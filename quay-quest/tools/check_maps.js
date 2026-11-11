// Headless checks: loads index.html, renders every map to <outdir>/map_*.png, and reports
// unreachable doors/NPCs/objects and any sprite, item, skill or enemy that is referenced but missing.
// usage: node tools/check_maps.js <outdir>   (needs Playwright + Chromium)
const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 820 } });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/title.png' });
  const res = await p.evaluate(() => {
    const r = {};
    for (const id in QQ.MAPS) { r[id] = QQ.world.snapshot(id).toDataURL(); }
    return r;
  });
  for (const id in res) fs.writeFileSync(out + '/map_' + id + '.png', Buffer.from(res[id].split(',')[1], 'base64'));
  // reachability: BFS ignoring npcs from each map's entry points
  const reach = await p.evaluate(() => {
    const report = [];
    const bfs = (m, sx, sy) => { const seen = new Set([sx + ',' + sy]), q = [[sx, sy]]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x+dx, ny = y+dy, k = nx+','+ny; if (!m.inside(nx, ny) || seen.has(k)) continue; seen.add(k); if (!m.solid[m.i(nx, ny)] && !(m.warps[m.i(nx,ny)] && false)) q.push([nx, ny]); } } return seen; };
    const starts = { ends: [29, 6], grim: [6, 5], dreg: [6, 5], pid: [6, 6], quay: [4, 6] };
    for (const id in QQ.MAPS) {
      const m = QQ.MAPS[id]; let s = starts[id];
      if (!s) { const w = Object.keys(m.warps)[0]; s = [w % m.w, Math.floor(w / m.w) - 1]; }
      if (m.solid[m.i(s[0], s[1])]) report.push(id + ': start solid ' + s);
      const seen = bfs(m, s[0], s[1]);
      // every act / warp / npc needs a reachable neighbour (or be itself reachable)
      const check = (x, y, what) => { if (seen.has(x+','+y) && !m.solid[m.i(x,y)]) return; const ok = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => seen.has((x+dx)+','+(y+dy)) && m.inside(x+dx,y+dy) && !m.solid[m.i(x+dx,y+dy)]); if (!ok) report.push(id + ': unreachable ' + what + ' at ' + x + ',' + y); };
      for (const i in m.acts) check(i % m.w, Math.floor(i / m.w), 'act ' + m.o[i]);
      for (const i in m.warps) { check(i % m.w, Math.floor(i / m.w), 'warp->' + m.warps[i].map); const t = m.warps[i], tm = QQ.MAPS[t.map]; if (!tm) report.push('bad warp ' + t.map); else if (tm.solid[tm.i(t.x, t.y)]) report.push(id + ' warp lands solid in ' + t.map + ' ' + t.x + ',' + t.y); }
      for (const n of m.npcs) { check(n.hx, n.hy, 'npc ' + n.id); if (m.solid[m.i(n.hx, n.hy)]) report.push(id + ' npc on solid ' + n.id); }
    }
    for (const t in QQ.TOWNS) { const a = QQ.TOWNS[t].at, m = QQ.MAPS[QQ.TOWNS[t].map]; if (m.solid[m.i(a[0], a[1])]) report.push('arrival solid ' + t); }
    const missing = []; for (const id in QQ.MAPS) { const m = QQ.MAPS[id]; m.o.forEach(s => { if (s && QQ.SPRITES[s] === undefined) missing.push(s); }); m.npcs.forEach(n => { if (QQ.SPRITES[n.s] === undefined) missing.push(n.s); }); }
    for (const k in QQ.ITEMS) if (QQ.ITEMS[k].icon && QQ.SPRITES[QQ.ITEMS[k].icon] === undefined) missing.push('item ' + k);
    for (const k in QQ.ENEMIES) if (QQ.SPRITES[QQ.ENEMIES[k].sprite] === undefined) missing.push('enemy ' + k);
    for (const k in QQ.SKILLS) { const s = QQ.SKILLS[k]; if (s.fx && QQ.SPRITES[s.fx] === undefined) missing.push('fx ' + k + ' ' + s.fx); (s.st||[]).forEach(x => { if (!QQ.STATUS[x[0]]) missing.push('status ' + x[0]); }); }
    for (const k in QQ.SHOPS) QQ.SHOPS[k].stock.forEach(i => { if (!i.startsWith('bag') && !QQ.ITEMS[i]) missing.push('shop item ' + i); });
    for (const z in QQ.ZONES) QQ.ZONES[z].forEach(([, g]) => g.forEach(e => { if (!QQ.ENEMIES[e]) missing.push('zone enemy ' + e); }));
    for (const k in QQ.ENEMIES) QQ.ENEMIES[k].acts.forEach(([s]) => { if (!QQ.SKILLS[s]) missing.push('enemy skill ' + s); });
    for (const c in QQ.CHARS) QQ.CHARS[c].learn.forEach(([, s]) => { if (!QQ.SKILLS[s]) missing.push('char skill ' + s); });
    return { report, missing: [...new Set(missing)] };
  });
  console.log(JSON.stringify(reach, null, 1)); console.log('ERRORS', errs);
  await b.close();
})();

// Overworld: map container/builder, movement, NPCs, encounters, HUD.
(function () {
  'use strict';
  const QQ = window.QQ, T = 16;
  QQ.MAPS = {};

  class GMap {
    constructor(id, o) {
      Object.assign(this, { id, name: o.name, w: o.w, h: o.h, music: o.music || 'indoor', bg: o.bg || 'ends', town: o.town || null, indoor: !!o.indoor, night: !!o.night });
      const n = o.w * o.h;
      this.g = new Array(n).fill(o.base || 'grass');
      this.o = new Array(n).fill(null);
      this.solid = new Uint8Array(n);
      this.zone = new Array(n).fill(null);
      this.warps = {}; this.acts = {}; this.steps = {}; this.npcs = [];
      QQ.MAPS[id] = this;
    }
    i(x, y) { return y * this.w + x; }
    inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    fill(x, y, w, h, g, solid) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        if (!this.inside(xx, yy)) continue;
        const i = this.i(xx, yy);
        this.g[i] = g; if (solid !== undefined) this.solid[i] = solid ? 1 : 0;
      }
      return this;
    }
    zoneRect(x, y, w, h, z) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (this.inside(xx, yy)) this.zone[this.i(xx, yy)] = z;
      return this;
    }
    obj(x, y, s, solid, act) {
      if (!this.inside(x, y)) return this;
      const i = this.i(x, y);
      this.o[i] = s; this.solid[i] = solid === false ? 0 : 1;
      if (act) this.acts[i] = act;
      return this;
    }
    objs(s, pts, solid) { pts.forEach(([x, y]) => this.obj(x, y, s, solid)); return this; }
    line(s, x, y, n, dx, dy, solid) { for (let k = 0; k < n; k++) this.obj(x + dx * k, y + dy * k, s, solid); return this; }
    clear(x, y) { const i = this.i(x, y); this.o[i] = null; this.solid[i] = 0; delete this.acts[i]; return this; }
    act(x, y, fn) { this.acts[this.i(x, y)] = fn; return this; }
    step(x, y, fn) { this.steps[this.i(x, y)] = fn; return this; }
    warp(x, y, to) { const i = this.i(x, y); this.warps[i] = to; this.solid[i] = 0; return this; }
    say(x, y, who, text) { return this.act(x, y, () => QQ.say(who, text)); }
    sign(x, y, text) { return this.obj(x, y, 'signpost', true, () => QQ.say({ n: 'Sign' }, text)); }
    // A building: roof rows on top, wall rows (with windows) below, optional door on the bottom row.
    building(x, y, w, h, o) {
      o = o || {};
      const wallRows = o.wallRows || (h >= 4 ? 2 : 1);
      this.fill(x, y, w, h - wallRows, o.roof || 'r_slate', true);
      this.fill(x, y + h - wallRows, w, wallRows, o.wall || 'w_red', true);
      const by = y + h - 1, doorX = o.door === undefined ? -1 : x + o.door;
      for (let yy = y + h - wallRows; yy <= by; yy++) for (let xx = x; xx < x + w; xx++) {
        const i = this.i(xx, yy); this.o[i] = null;
        if (yy === by && xx === doorX) continue;
        if (o.shut) { if ((xx - x) % 2 === 1 || w < 3) this.o[i] = 'shutter'; }
        else if (o.windows !== false && (xx - x) % 2 === 1 && xx !== doorX) this.o[i] = o.lit && (xx + yy) % 3 ? 'window_lit' : 'window';
        if (yy === by && doorX >= 0 && Math.abs(xx - doorX) === 1 && w <= 4) this.o[i] = o.shut ? this.o[i] : null;
      }
      if (doorX >= 0) {
        const i = this.i(doorX, by);
        this.o[i] = o.doorSprite || 'door';
        if (o.to) { this.warps[i] = o.to; this.solid[i] = 0; }
        else if (o.act) { this.acts[i] = o.act; }
      }
      return this;
    }
    // Interior shell: black surround, wall strip along the top, floor inside, exit mat on the bottom edge.
    room(wall, floor, exitX, to) {
      this.fill(0, 0, this.w, this.h, 'void', true);
      this.fill(1, 1, this.w - 2, 1, wall, true);
      this.fill(1, 2, this.w - 2, this.h - 3, floor, false);
      this.fill(exitX, this.h - 1, 1, 1, 'carpet_g', false);
      this.warp(exitX, this.h - 1, to);
      return this;
    }
    chest(x, y, key, loot, p) {
      (this.chests = this.chests || []).push({ x, y, key });
      return this.obj(x, y, 'chest', true, () => QQ.story.chest(this, x, y, key, loot, p));
    }
    npc(d) { this.npcs.push(Object.assign({ hx: d.x, hy: d.y, px: d.x * T, py: d.y * T, t: QQ.irnd(40, 160), flip: false, solid: true }, d)); return this; }
  }
  QQ.GMap = GMap;

  // ---------------------------------------------------------------- scripts (cutscenes lock player input)
  QQ.script = async function (fn) {
    if (QQ.busy) return;
    QQ.busy++;
    try { await fn(); } catch (e) { console.error('script error', e); QQ.lastError = String(e && e.stack || e); }
    finally { QQ.busy = Math.max(0, QQ.busy - 1); }
  };

  // ---------------------------------------------------------------- world scene
  const P = { x: 0, y: 0, px: 0, py: 0, dx: 0, dy: 1, moving: 0, flip: false };
  let map = null, pos = [], from = [], banner = 0, encWait = 8, camX = 0, camY = 0;
  const W = QQ.world = {
    P,
    get map() { return map; },
    npc: (id) => map && map.npcs.find((n) => n.id === id),
    visible: (n) => !n.when || n.when(),
    npcAt(x, y) { return map.npcs.find((n) => n.solid && W.visible(n) && n.x === x && n.y === y); },
    setMap(id, x, y, face) {
      map = QQ.MAPS[id];
      QQ.G.map = id; QQ.G.x = x; QQ.G.y = y;
      P.x = x; P.y = y; P.px = x * T; P.py = y * T; P.moving = 0;
      if (face) { P.dx = face[0]; P.dy = face[1]; }
      pos = [[x, y], [x, y], [x, y], [x, y]]; from = pos.map((p) => p.slice());
      map.npcs.forEach((n) => { n.x = n.hx; n.y = n.hy; n.px = n.x * T; n.py = n.y * T; n.moving = 0; });
      (map.chests || []).forEach((c) => { map.o[map.i(c.x, c.y)] = QQ.flag(c.key) ? 'chest_open' : 'chest'; });
      banner = 150; encWait = 8;
      QQ.audio.music(map.music);
      W.centre();
    },
    centre() {
      camX = QQ.clamp(P.px + 8 - QQ.W / 2, 0, Math.max(0, map.w * T - QQ.W));
      camY = QQ.clamp(P.py + 8 - QQ.H / 2, 0, Math.max(0, map.h * T - QQ.H));
      if (map.w * T < QQ.W) camX = -(QQ.W - map.w * T) / 2;
      if (map.h * T < QQ.H) camY = -(QQ.H - map.h * T) / 2;
    },
    async goto(id, x, y, face) {
      QQ.audio.sfx('door');
      await QQ.fade(1, 10);
      W.setMap(id, x, y, face);
      await QQ.fade(0, 10);
    },
    blocked(x, y) { return !map.inside(x, y) || map.solid[map.i(x, y)] || !!W.npcAt(x, y); },
    update() {
      if (QQ.busy) return;
      if (QQ.G.trust <= 0 && !QQ.flag('gameover')) { QQ.script(QQ.story.planningGranted); return; }
      if (P.moving) return;
      if (QQ.input.pressed('b')) { QQ.audio.sfx('ok'); QQ.script(QQ.menus.main); return; }
      if (QQ.input.pressed('a')) { W.interact(); return; }
      let dx = 0, dy = 0;
      if (QQ.input.held('up')) dy = -1; else if (QQ.input.held('down')) dy = 1;
      else if (QQ.input.held('left')) dx = -1; else if (QQ.input.held('right')) dx = 1;
      if (!dx && !dy) return;
      P.dx = dx; P.dy = dy;
      if (dx) P.flip = dx < 0;
      const nx = P.x + dx, ny = P.y + dy;
      if (W.blocked(nx, ny)) {
        // bumping a door-style act (shop doors) triggers it, so shops feel like doors
        const i = map.inside(nx, ny) ? map.i(nx, ny) : -1;
        if (i >= 0 && map.acts[i] && map.o[i] && /door/.test(map.o[i]) && QQ.input.pressed(dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right')) W.interact();
        return;
      }
      from = pos.map((p) => p.slice());
      for (let k = pos.length - 1; k > 0; k--) pos[k] = pos[k - 1].slice();
      pos[0] = [nx, ny];
      P.x = nx; P.y = ny; P.moving = 8;
    },
    interact() {
      const tx = P.x + P.dx, ty = P.y + P.dy;
      if (!map.inside(tx, ty)) return;
      let n = map.npcs.find((q) => W.visible(q) && q.x === tx && q.y === ty);
      // talk across a shop counter
      if (!n && map.o[map.i(tx, ty)] === 'counter') n = map.npcs.find((q) => W.visible(q) && q.x === tx + P.dx && q.y === ty + P.dy);
      if (n && n.talk) {
        n.flip = P.dx > 0 ? true : P.dx < 0 ? false : n.flip;
        QQ.script(async () => {
          if (typeof n.talk === 'function') await n.talk(n);
          else await QQ.say(n.who || { n: n.name, s: n.s }, n.talk);
        });
        return;
      }
      const act = map.acts[map.i(tx, ty)];
      if (act) QQ.script(() => act(tx, ty));
    },
    arrive() {
      QQ.G.x = P.x; QQ.G.y = P.y; QQ.G.steps++;
      const i = map.i(P.x, P.y);
      if (map.warps[i]) {
        const to = map.warps[i];
        QQ.script(async () => {
          const here = map;
          if (to.when && !(await to.when())) { if (map === here) W.shove(); return; }
          await W.goto(to.map, to.x, to.y, to.face || [0, 1]);
        });
        return;
      }
      if (map.steps[i]) { QQ.script(() => map.steps[i]()); if (QQ.busy) return; }
      const z = map.zone[i];
      if (z && --encWait <= 0 && Math.random() < 0.13) { encWait = 7; QQ.script(() => W.encounter(z)); }
    },
    // step the player back one tile (used by gated warps / blocked triggers)
    shove() { P.x -= P.dx; P.y -= P.dy; P.px = P.x * T; P.py = P.y * T; pos[0] = [P.x, P.y]; QQ.G.x = P.x; QQ.G.y = P.y; },
    async encounter(z) {
      const town = map.town, heat = town ? QQ.G.heat[town] : 0;
      if (town && heat >= 60 && QQ.stashCount() > 0 && Math.random() < 0.4) { await QQ.story.feds(town); return; }
      const table = QQ.ZONES[z];
      let r = Math.random() * table.reduce((a, t) => a + t[0], 0), group = table[0][1];
      for (const t of table) { r -= t[0]; if (r <= 0) { group = t[1]; break; } }
      const res = await QQ.battle.start(group, { bg: map.bg });
      if (res === 'lose') await QQ.story.wipe();
      else if (res === 'win' && town === 'ends') QQ.trust(-2);
    },
    tick() {
      if (QQ.scene !== W) return;
      if (P.moving) {
        P.moving--;
        P.px = P.x * T - P.dx * P.moving * 2; P.py = P.y * T - P.dy * P.moving * 2;
        if (!P.moving) { from = pos.map((p) => p.slice()); if (P.moving === 0) W.arrive(); }
      }
      // NPC idle wandering
      if (!QQ.busy && !QQ.modals.length) for (const n of map.npcs) {
        if (n.moving) {
          n.moving--; n.px = n.x * T - n.mdx * n.moving; n.py = n.y * T - n.mdy * n.moving;
        } else if (n.wander && --n.t <= 0) {
          n.t = QQ.irnd(50, 200);
          const [dx, dy] = QQ.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = n.x + dx, ny = n.y + dy;
          if (Math.abs(nx - n.hx) <= n.wander && Math.abs(ny - n.hy) <= n.wander && map.inside(nx, ny) && !map.solid[map.i(nx, ny)] &&
              !map.warps[map.i(nx, ny)] && !W.npcAt(nx, ny) && !(nx === P.x && ny === P.y)) {
            n.x = nx; n.y = ny; n.mdx = dx; n.mdy = dy; n.moving = 16; if (dx) n.flip = dx < 0;
          }
        }
      }
      if (banner > 0) banner--;
      W.centre();
    },
    draw() {
      const ctx = QQ.ctx, cx = Math.round(camX), cy = Math.round(camY);
      const x0 = Math.max(0, Math.floor(cx / T)), y0 = Math.max(0, Math.floor(cy / T));
      const x1 = Math.min(map.w - 1, x0 + 21), y1 = Math.min(map.h - 1, y0 + 16);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = map.i(x, y);
        ctx.drawImage(QQ.tiles.get(map.g[i], x, y, QQ.frame), x * T - cx, y * T - cy);
        if (map.o[i]) QQ.spr(map.o[i], x * T - cx, y * T - cy);
      }
      // actors, sorted by y
      const list = [];
      for (const n of map.npcs) if (W.visible(n)) list.push({ y: n.py, x: n.px, s: n.s, flip: n.flip, n });
      const t = P.moving ? 1 - P.moving / 8 : 1;
      for (let k = QQ.G.party.length - 1; k >= 1; k--) {
        if (k >= pos.length) continue;
        const fx = from[k][0] + (pos[k][0] - from[k][0]) * t, fy = from[k][1] + (pos[k][1] - from[k][1]) * t;
        if (!P.moving && pos[k][0] === P.x && pos[k][1] === P.y) continue;
        list.push({ y: fy * T - 0.2 * k, x: fx * T, s: QQ.CHARS[QQ.G.party[k]].sprite, flip: pos[k][0] < from[k][0] || (pos[k][0] === from[k][0] && P.flip), bob: P.moving && ((P.moving + k * 2) >> 2) & 1 });
      }
      list.push({ y: P.py + 0.1, x: P.px, s: QQ.CHARS[QQ.G.party[0]].sprite, flip: P.flip, bob: P.moving && (P.moving >> 2) & 1 });
      list.sort((a, b) => a.y - b.y);
      for (const a of list) {
        const sx = a.x - cx, sy = a.y - cy - 3 - (a.bob ? 1 : 0);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(sx) + 3, Math.round(a.y - cy) + 12, 10, 3);
        QQ.spr(a.s, sx, sy, { flip: a.flip });
        if (a.n && a.n.bubble) { const b = a.n.bubble(); if (b) QQ.spr(b, sx, sy - 14 + ((QQ.frame >> 4) & 1)); }
      }
      if (map.night) { ctx.fillStyle = 'rgba(14,18,60,0.36)'; ctx.fillRect(0, 0, QQ.W, QQ.H); }
      W.hud();
    },
    hud() {
      const G = QQ.G, ctx = QQ.ctx;
      ctx.fillStyle = 'rgba(11,9,18,0.82)'; ctx.fillRect(0, 0, QQ.W, 11);
      QQ.text(QQ.money(G.p), 4, 2, 'y');
      QQ.text('TRUST', 62, 2, 'w');
      QQ.bar(92, 2, 44, 7, G.trust / 100, G.trust > 40 ? '#7fd35b' : G.trust > 20 ? '#ffd23f' : '#ff5d5d', '#3a3160');
      if (map.town) {
        QQ.text('HEAT', 144, 2, 'w');
        QQ.bar(170, 2, 34, 7, (G.heat[map.town] || 0) / 100, G.heat[map.town] >= 60 ? '#ff5d5d' : '#ff9d3c', '#3a3160');
      }
      QQ.text('BAG ' + QQ.stashCount() + '/' + QQ.bagCap(), 212, 2, QQ.stashCount() ? 'c' : 'd');
      QQ.text('DAY ' + G.day, QQ.W - 4, 2, 'w', { align: 'right' });
      if (banner > 0) {
        const a = Math.min(1, banner / 20), w = QQ.textW(map.name) + 20;
        ctx.globalAlpha = a; QQ.box((QQ.W - w) / 2, 20, w, 17); QQ.text(map.name, QQ.W / 2, 25, 'y', { align: 'center' }); ctx.globalAlpha = 1;
      }
    },
    // debug / tests: render the whole map to a new canvas
    snapshot(id) {
      const m = QQ.MAPS[id], c = document.createElement('canvas');
      c.width = m.w * T; c.height = m.h * T;
      const x = c.getContext('2d');
      for (let y = 0; y < m.h; y++) for (let xx = 0; xx < m.w; xx++) {
        const i = m.i(xx, y);
        x.drawImage(QQ.tiles.get(m.g[i], xx, y, 0), xx * T, y * T);
        if (m.o[i]) QQ.spr(m.o[i], xx * T, y * T, { ctx: x });
        if (m.zone[i]) { x.fillStyle = 'rgba(255,0,0,0.12)'; x.fillRect(xx * T, y * T, T, T); }
        if (m.warps[i]) { x.strokeStyle = '#0ff'; x.strokeRect(xx * T + 1.5, y * T + 1.5, T - 3, T - 3); }
        if (m.acts[i]) { x.strokeStyle = '#ff0'; x.strokeRect(xx * T + 2.5, y * T + 2.5, T - 5, T - 5); }
      }
      m.npcs.forEach((n) => { QQ.spr(n.s, n.hx * T, n.hy * T - 3, { ctx: x }); x.strokeStyle = '#f0f'; x.strokeRect(n.hx * T + 0.5, n.hy * T + 0.5, T - 1, T - 1); });
      return c;
    }
  };
})();

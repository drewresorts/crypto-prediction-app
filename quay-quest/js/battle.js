// Turn-based party battles.
(function () {
  'use strict';
  const QQ = window.QQ;
  const E_SLOTS = { 1: [[84, 132]], 2: [[104, 118], [64, 142]], 3: [[110, 112], [66, 126], [106, 148]], 4: [[110, 108], [62, 118], [114, 136], [66, 148]] };
  const BOSS_SLOTS = [[70, 142], [128, 114], [132, 148], [26, 112]];
  const P_SLOTS = [[228, 114], [242, 126], [256, 138], [270, 150]];
  let S = null;

  const alive = (side) => S.actors.filter((a) => a.side === side && a.hp > 0);
  const foes = (u) => alive(u.side === 'p' ? 'e' : 'p');
  const mates = (u) => alive(u.side);
  const pause = async (frames) => {
    if (QQ.fast) frames = 1;
    for (let i = 0; i < frames; i++) { if (S.skip && i > 6) break; await QQ.wait(1); }
    S.skip = false;
  };
  const say = async (text, frames) => { S.msg = text; await pause(frames || 46); };
  const float = (a, text, col) => S.floats.push({ x: a.x, y: a.y - 16 * a.scale - 4, text: String(text), col: col || 'w', t: 40 });
  const fx = (a, name) => { if (name) S.fx.push({ name, x: a.x, y: a.y - 8 * a.scale, t: 18 }); };

  function makeParty(id, i) {
    const c = QQ.G.chars[id], d = QQ.CHARS[id];
    return {
      side: 'p', id, name: d.name, sprite: d.sprite, lv: c.lv, hp: c.hp, mhp: QQ.maxHp(id), nrg: c.nrg, mnrg: QQ.maxNrg(id),
      atk: QQ.stat(id, 'atk'), def: QQ.stat(id, 'def'), spd: QQ.stat(id, 'spd'), lck: QQ.stat(id, 'lck'),
      st: {}, x: P_SLOTS[i][0], y: P_SLOTS[i][1], ox: 0, oy: 0, flash: 0, alpha: 1, scale: 2
    };
  }
  function makeEnemies(group) {
    const boss = QQ.ENEMIES[group[0]].boss, slots = boss ? BOSS_SLOTS : E_SLOTS[Math.min(4, group.length)];
    const seen = {}, total = {};
    group.forEach((g) => { total[g] = (total[g] || 0) + 1; });
    return group.slice(0, 4).map((eid, i) => {
      const d = QQ.ENEMIES[eid];
      seen[eid] = (seen[eid] || 0) + 1;
      return Object.assign({}, d, {
        side: 'e', eid, name: d.name + (total[eid] > 1 ? ' ' + 'ABCD'[seen[eid] - 1] : ''), mhp: d.hp, nrg: 0, mnrg: 0,
        st: {}, x: slots[i][0], y: slots[i][1], ox: 0, oy: 0, flash: 0, alpha: 1, scale: d.boss ? 3 : 2
      });
    });
  }

  function damage(u, t, pow) {
    const atk = u.atk * (u.st.atkUp ? 1.3 : 1) * (u.st.atkDown ? 0.72 : 1);
    const def = t.def * (t.st.defUp ? 1.45 : 1) * (t.st.defDown ? 0.65 : 1);
    let d = 1.5 * pow * atk * atk / (atk + def) * QQ.rnd(0.9, 1.1);
    const crit = Math.random() < 0.04 + u.lck * 0.006;
    if (crit) d *= 1.6;
    if (t.guard) d *= 0.5;
    return { n: Math.max(1, Math.round(d)), crit };
  }
  async function hurt(t, n, crit) {
    t.hp = Math.max(0, t.hp - n);
    t.flash = 8; float(t, n, crit ? 'y' : t.side === 'p' ? 'r' : 'w');
    QQ.audio.sfx(crit ? 'crit' : 'hit');
    if (t.side === 'p' || crit) QQ.shakeT = crit ? 8 : 4;
  }
  async function checkDeaths() {
    for (const a of S.actors) {
      if (a.hp <= 0 && !a.dead) {
        a.dead = true; a.st = {}; a.guard = false;
        QQ.audio.sfx('die');
        if (a.side === 'e') { await QQ.tween(a, 'alpha', 0, QQ.fast ? 1 : 16); }
        else await say(a.name + ' is sparked out!', 34);
      }
    }
  }
  function addStatus(t, s, turns, quiet) {
    const had = t.st[s];
    t.st[s] = Math.max(t.st[s] || 0, turns);
    if (!quiet) { const d = QQ.STATUS[s]; float(t, d.tag, d.col); QQ.audio.sfx(d.good ? 'buff' : 'debuff'); }
    return !had;
  }

  // Carry out a skill. targets is an array of actors chosen by the caller.
  async function perform(u, sid, targets) {
    const sk = QQ.SKILLS[sid], mult = u.side === 'p' ? QQ.rankMult(QQ.rankOf(u.id, sid)) : 1;
    if (sk.cost && u.side === 'p') u.nrg -= sk.cost;
    const tname = targets.length === 1 ? targets[0].name : 'everyone';
    const line = sk.msg ? sk.msg.replace('{u}', u.name).replace('{t}', tname)
      : sid === 'attack' ? u.name + ' swings at ' + tname + '.' : u.name + ' uses ' + sk.name + '!';
    S.msg = line;
    const dir = u.side === 'p' ? -1 : 1;
    await QQ.tween(u, 'ox', dir * 14, QQ.fast ? 1 : 6, 'out');
    let dealt = 0;
    if (sk.special === 'bag') await mysteryBag(u, mult);
    else {
      const hits = sk.hits || 1;
      for (let h = 0; h < hits; h++) {
        let list = targets.filter((t) => t.hp > 0 || sk.revive);
        if (sk.tgt === 'rand') { const f = foes(u); if (!f.length) break; list = [QQ.pick(f)]; }
        if (!list.length) break;
        for (const t of list) {
          fx(t, sk.fx);
          if (sk.pow) { const d = damage(u, t, sk.pow * mult); await hurt(t, d.n, d.crit); dealt += d.n; }
          if (sk.revive && t.hp <= 0) { t.hp = Math.round(t.mhp * sk.revive * mult); t.dead = false; float(t, 'UP!', 'g'); QQ.audio.sfx('heal'); }
          else if (sk.heal && t.hp > 0) { const n = Math.round(t.mhp * sk.heal * mult); t.hp = Math.min(t.mhp, t.hp + n); float(t, '+' + n, 'g'); QQ.audio.sfx('heal'); }
          if (sk.cleanse) for (const s in t.st) if (!QQ.STATUS[s].good) delete t.st[s];
        }
        await pause(hits > 1 ? 12 : 16);
      }
      // statuses land after the hits
      for (const [s, turns, chance, onSelf] of sk.st || []) {
        for (const t of onSelf ? [u] : targets) {
          if (t.hp <= 0) continue;
          let c = chance * (onSelf || QQ.STATUS[s].good ? 1 : mult);
          if (s === 'stun' && t.boss) c *= 0.4;
          if (Math.random() < c) addStatus(t, s, turns); else if (!sk.pow) float(t, 'MISS', 'd');
        }
      }
      if (sk.st) await pause(14);
      if (sk.steal && u.side === 'p' && dealt) { const n = Math.round((3 + u.lv * 2.5) * sk.steal * QQ.rnd(0.8, 1.2)); S.loot += n; float(u, '+' + QQ.money(n), 'y'); QQ.audio.sfx('cash'); await pause(14); }
      if (sk.drain && dealt) { const n = Math.round(dealt * 0.5); u.hp = Math.min(u.mhp, u.hp + n); float(u, '+' + n, 'g'); }
      if (sk.special === 'fee' && u.side === 'e') {
        const n = Math.min(QQ.G.p, Math.round(4 + u.lv * 3));
        if (n > 0) { QQ.addP(-n, true); await say('You are down ' + QQ.money(n) + '.', 30); }
      }
      if (sk.special === 'snatch' && u.side === 'e') {
        const food = Object.keys(QQ.G.inv).filter((k) => QQ.ITEMS[k].type === 'use' && QQ.ITEMS[k].heal && !QQ.ITEMS[k].perm);
        if (food.length) { const k = QQ.pick(food); QQ.take(k, 1); await say(u.name + ' nicks your ' + QQ.ITEMS[k].name + '!', 36); }
      }
    }
    await QQ.tween(u, 'ox', 0, QQ.fast ? 1 : 5);
    await checkDeaths();
  }
  async function mysteryBag(u, mult) {
    const r = Math.random(), en = foes(u);
    if (r < 0.36) {
      await say('It is full of half bricks!', 30);
      for (const t of en) { fx(t, 'brickitem'); const d = damage(u, t, 1.35 * mult); await hurt(t, d.n, d.crit); }
    } else if (r < 0.6) {
      await say('Sausage rolls. Loads of them. Everyone eats.', 30);
      for (const t of mates(u)) { const n = Math.round(t.mhp * 0.3 * mult); t.hp = Math.min(t.mhp, t.hp + n); float(t, '+' + n, 'g'); fx(t, 'sausageroll'); }
      QQ.audio.sfx('heal');
    } else if (r < 0.8) {
      await say('A three-week-old egg mayo sandwich.', 30);
      for (const t of en) { fx(t, 'fx_poison'); addStatus(t, 'poison', 3); }
    } else if (r < 0.93) {
      await say('A pigeon flies out. Absolute chaos.', 30);
      for (const t of en) { fx(t, 'pigeon'); if (Math.random() < (t.boss ? 0.3 : 0.6)) addStatus(t, 'stun', 1); }
    } else await say('It is just more carrier bags.', 36);
    await pause(16);
  }
  async function useItem(u, key, t) {
    const it = QQ.ITEMS[key];
    QQ.take(key, 1);
    S.msg = u.name + ' uses ' + it.name + '.';
    fx(t, it.icon);
    if (it.revive && t.hp <= 0) { t.hp = Math.round(t.mhp * it.revive); t.dead = false; float(t, 'UP!', 'g'); }
    if (it.heal && t.hp > 0) { t.hp = Math.min(t.mhp, t.hp + it.heal); float(t, '+' + it.heal, 'g'); }
    if (it.nrg && t.hp > 0) { t.nrg = Math.min(t.mnrg, t.nrg + it.nrg); float(t, '+' + it.nrg + ' NRG', 'c'); }
    if (it.nrgAll) for (const m of mates(u)) { m.nrg = Math.min(m.mnrg, m.nrg + it.nrgAll); float(m, '+' + it.nrgAll + ' NRG', 'c'); }
    if (it.cure) for (const s in t.st) if (!QQ.STATUS[s].good) delete t.st[s];
    for (const [s, turns] of it.st || []) addStatus(t, s, turns, true);
    QQ.audio.sfx('heal');
    await pause(26);
  }

  // ---------------------------------------------------------------- player command selection
  function pickTarget(list, label) {
    list = list.slice().sort((a, b) => a.y - b.y);
    return new Promise((res) => {
      let i = 0;
      const m = QQ.push({
        update() {
          let d = 0;
          if (QQ.input.pressed('up') || QQ.input.pressed('left')) d = -1;
          if (QQ.input.pressed('down') || QQ.input.pressed('right')) d = 1;
          if (d) { i = (i + d + list.length) % list.length; QQ.audio.sfx('move'); }
          if (QQ.input.pressed('a')) { QQ.audio.sfx('ok'); QQ.pop(m); S.cursorOn = null; res(list[i]); }
          else if (QQ.input.pressed('b')) { QQ.audio.sfx('cancel'); QQ.pop(m); S.cursorOn = null; res(null); }
          else S.cursorOn = list[i];
        },
        draw() {
          const t = list[i];
          QQ.box(4, 160, 124, 30, { title: label });
          QQ.text(t.name, 12, 168, 'y');
          QQ.text('HP ' + t.hp + '/' + t.mhp, 12, 178, 'w');
        }
      });
      S.cursorOn = list[0];
    });
  }
  async function targetsFor(u, sk) {
    const pool = { enemy: () => foes(u), ally: () => mates(u), dead: () => S.actors.filter((a) => a.side === u.side && a.hp <= 0) }[sk.tgt];
    if (sk.tgt === 'enemies' || sk.tgt === 'rand') return foes(u);
    if (sk.tgt === 'allies') return mates(u);
    if (sk.tgt === 'self') return [u];
    const list = pool();
    if (!list.length) return null;
    const t = await pickTarget(list, sk.name);
    return t ? [t] : null;
  }
  async function command(u) {
    S.active = u;
    for (;;) {
      const c = await QQ.menu({
        x: 4, y: 160, w: 124, cancel: false, sel: S.lastCmd[u.id] || 0, title: u.name,
        items: [{ label: 'Attack' }, { label: 'Skills' }, { label: 'Items' }, { label: 'Guard' }, { label: 'Leg It', disabled: S.noFlee }]
      });
      S.lastCmd[u.id] = c;
      if (c === 0) { const t = await targetsFor(u, QQ.SKILLS.attack); if (t) return { skill: 'attack', targets: t }; }
      else if (c === 1) {
        const ids = QQ.skillsOf(u.id);
        const s = await QQ.menu({
          x: 4, y: 160, w: 156, rows: 5, title: 'Skills', desc: { x: 4, y: 124, w: 312, h: 34 }, sel: S.lastSkill[u.id] || 0,
          items: ids.map((id) => { const k = QQ.SKILLS[id], r = QQ.rankOf(u.id, id); return { label: k.name + (r > 1 ? ' ' + '+'.repeat(r - 1) : ''), right: k.cost, rcolor: 'c', disabled: u.nrg < k.cost, desc: k.desc }; })
        });
        if (s >= 0) { S.lastSkill[u.id] = s; const t = await targetsFor(u, QQ.SKILLS[ids[s]]); if (t) return { skill: ids[s], targets: t }; }
      } else if (c === 2) {
        const keys = Object.keys(QQ.G.inv).filter((k) => QQ.ITEMS[k].type === 'use' && !QQ.ITEMS[k].fieldOnly);
        const s = await QQ.menu({
          x: 4, y: 160, w: 156, rows: 5, title: 'Items', desc: { x: 4, y: 124, w: 312, h: 34 }, empty: 'No snacks. Peak.',
          items: keys.map((k) => ({ label: QQ.ITEMS[k].name, right: 'x' + QQ.G.inv[k], desc: QQ.ITEMS[k].desc }))
        });
        if (s >= 0) {
          const it = QQ.ITEMS[keys[s]];
          const list = it.revive ? S.actors.filter((a) => a.side === 'p' && a.hp <= 0) : it.nrgAll ? null : mates(u);
          if (list && !list.length) { QQ.audio.sfx('no'); continue; }
          const t = list ? await pickTarget(list, it.name) : u;
          if (t) return { item: keys[s], targets: [t] };
        }
      } else if (c === 3) return { guard: true };
      else if (c === 4) return { flee: true };
    }
  }
  function aiPick(u) {
    const opts = u.acts.filter(([sid]) => {
      const k = QQ.SKILLS[sid];
      if (k.heal && !mates(u).some((m) => m.hp < m.mhp * 0.7)) return false;
      if (k.st && !k.pow && k.st.every(([s, , , self]) => (self || QQ.STATUS[s].good ? mates(u) : foes(u)).every((t) => t.st[s]))) return false;
      return true;
    });
    const list = opts.length ? opts : [['attack', 1]];
    let r = Math.random() * list.reduce((a, o) => a + o[1], 0), sid = list[0][0];
    for (const o of list) { r -= o[1]; if (r <= 0) { sid = o[0]; break; } }
    const k = QQ.SKILLS[sid];
    let targets;
    if (k.tgt === 'enemies' || k.tgt === 'rand') targets = foes(u);
    else if (k.tgt === 'allies') targets = mates(u);
    else if (k.tgt === 'self') targets = [u];
    else if (k.tgt === 'ally') targets = [mates(u).slice().sort((a, b) => a.hp / a.mhp - b.hp / b.mhp)[0]];
    else { const f = foes(u), bait = f.filter((t) => t.st.taunt); targets = [bait.length && Math.random() < 0.85 ? bait[0] : QQ.pick(f)]; }
    return { skill: sid, targets };
  }

  // ---------------------------------------------------------------- main loop
  async function run(group, o) {
    await say(o.intro || (S.enemies.length > 1 ? S.enemies[0].name.replace(/ [A-D]$/, '') + ' and co. pull up!' : S.enemies[0].name + ' pulls up!'), 50);
    for (;;) {
      const order = S.actors.filter((a) => a.hp > 0).map((a) => ({ a, k: a.spd * (a.st.spdUp ? 1.5 : 1) * QQ.rnd(0.85, 1.15) })).sort((x, y) => y.k - x.k).map((x) => x.a);
      S.actors.forEach((a) => { if (a.turns > 1 && a.hp > 0) order.push(a); });
      for (const u of order) {
        if (u.hp <= 0) continue;
        if (!alive('e').length || !alive('p').length) break;
        u.guard = false;
        if (u.st.stun) { delete u.st.stun; S.active = u.side === 'p' ? u : null; await say(u.name + ' is rattled and cannot move!', 34); continue; }
        let act;
        if (u.side === 'p') { S.msg = ''; act = QQ.autoBattle ? QQ.autoBattle(u, S, { foes, mates }) : await command(u); }
        else { S.active = null; act = aiPick(u); }
        if (act.guard) { u.guard = true; float(u, 'GUARD', 'c'); await say(u.name + ' braces.', 26); }
        else if (act.flee) {
          const ps = alive('p').reduce((a, m) => a + m.spd, 0) / alive('p').length, es = alive('e').reduce((a, m) => a + m.spd, 0) / alive('e').length;
          if (Math.random() < QQ.clamp(0.55 + (ps - es) * 0.03, 0.3, 0.92)) { await say('You leg it!', 34); return 'flee'; }
          await say('Could not get away!', 34);
        } else if (act.item) await useItem(u, act.item, act.targets[0]);
        else await perform(u, act.skill, act.targets);
        if (!alive('e').length) return 'win';
        if (!alive('p').length) return 'lose';
      }
      // end of round: sickness and status timers
      for (const a of S.actors) {
        if (a.hp <= 0) continue;
        if (a.st.poison) { const n = Math.max(1, Math.round(a.mhp * (a.boss ? 0.04 : 0.08))); a.hp = Math.max(0, a.hp - n); float(a, n, 'p'); a.flash = 6; }
        for (const s in a.st) if (s !== 'stun' && --a.st[s] <= 0) delete a.st[s];
      }
      await checkDeaths();
      if (!alive('e').length) return 'win';
      if (!alive('p').length) return 'lose';
    }
  }
  async function victory() {
    S.active = null;
    QQ.audio.music(null); QQ.audio.sfx('win');
    const xp = S.enemies.reduce((a, e) => a + e.xp, 0), p = S.enemies.reduce((a, e) => a + e.p, 0) + S.loot;
    await say('Big W. ' + xp + ' XP and ' + QQ.money(p) + '.', 70);
    QQ.addP(p, true);
    // write party state back, then hand out XP
    S.party.forEach((a) => { const c = QQ.G.chars[a.id]; c.hp = Math.max(1, a.hp); c.nrg = a.nrg; });
    for (const a of S.party) {
      for (const n of QQ.gainXp(a.id, xp)) {
        QQ.audio.sfx('levelup');
        a.hp = QQ.G.chars[a.id].hp; a.mhp = QQ.maxHp(a.id); a.nrg = QQ.G.chars[a.id].nrg; a.mnrg = QQ.maxNrg(a.id); a.dead = false;
        float(a, 'LV ' + n.lv, 'y');
        await say(a.name + ' hits Lv ' + n.lv + '!  HP+' + n.hp + ' ATK+' + n.atk + ' DEF+' + n.def + ' SPD+' + n.spd, 80);
        for (const s of n.learned) await say(a.name + ' learns ' + s + '!', 70);
      }
    }
    for (const e of S.enemies) {
      if (Math.random() < (e.boss ? 1 : 0.16)) {
        const k = e.lv <= 3 ? QQ.pick(['crisps', 'potnoodle']) : e.lv <= 7 ? QQ.pick(['sausageroll', 'chips', 'energy']) : e.lv <= 11 ? QQ.pick(['pie', 'scone', 'coffee']) : QQ.pick(['kebab', 'coffee', 'medkit']);
        QQ.give(k, 1, true); await say('They dropped a ' + QQ.ITEMS[k].name + '.', 50);
      }
    }
    QQ.G.wins++;
  }

  const B = QQ.battle = {
    get state() { return S; },
    async start(group, o) {
      o = o || {};
      const prev = QQ.scene, prevSong = QQ.audio.wanted;
      QQ.audio.sfx('encounter');
      await QQ.flash(8); await QQ.fade(1, 10);
      const party = QQ.G.party.map(makeParty), enemies = makeEnemies(group);
      party.forEach((a) => { if (a.hp <= 0) a.dead = true; });
      S = { actors: party.concat(enemies), party, enemies, bg: o.bg || 'ends', msg: '', floats: [], fx: [], loot: 0, noFlee: !!o.noFlee || enemies.some((e) => e.boss), lastCmd: {}, lastSkill: {}, active: null, skip: false };
      QQ.scene = B;
      QQ.audio.music(o.music || (enemies.some((e) => e.boss) ? 'boss' : 'battle'));
      await QQ.fade(0, 10);
      let res = 'lose';
      try { res = await run(group, o); } catch (e) { console.error('battle error', e); QQ.lastError = String(e && e.stack || e); res = 'win'; }
      if (res === 'win') await victory();
      else {
        S.party.forEach((a) => { const c = QQ.G.chars[a.id]; c.hp = Math.max(res === 'lose' ? 0 : 1, a.hp); c.nrg = a.nrg; });
        if (res === 'lose') { QQ.audio.music(null); QQ.audio.sfx('lose'); await say('The mandem got folded...', 90); }
      }
      await QQ.fade(1, 12);
      QQ.scene = prev; S = null;
      QQ.audio.music(prevSong);
      await QQ.fade(0, 12);
      return res;
    },
    update() { if (S && QQ.input.pressed('a')) S.skip = true; },
    tick() {
      if (!S) return;
      for (const a of S.actors) if (a.flash > 0) a.flash--;
      for (let i = S.floats.length - 1; i >= 0; i--) { const f = S.floats[i]; f.t--; f.y -= 0.5; if (f.t <= 0) S.floats.splice(i, 1); }
      for (let i = S.fx.length - 1; i >= 0; i--) if (--S.fx[i].t <= 0) S.fx.splice(i, 1);
    },
    draw() {
      if (!S) return;
      const ctx = QQ.ctx;
      ctx.drawImage(QQ.tiles.battleBg(S.bg), 0, 0);
      QQ.rect(0, 156, QQ.W, QQ.H - 156, '#0b0912');
      const list = S.actors.slice().sort((a, b) => a.y - b.y);
      for (const a of list) {
        if (a.alpha <= 0.01) continue;
        const w = 16 * a.scale, x = a.x - w / 2 + a.ox, y = a.y - w + a.oy;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(a.x - w / 2 + 3 + a.ox), a.y - 3, w - 6, 5);
        if (a.side === 'p' && a.hp <= 0) {   // sparked out: lying flat
          ctx.save(); ctx.translate(Math.round(x), a.y - 6); ctx.scale(1, 0.4); QQ.spr(a.sprite, 0, 0, { scale: a.scale, flip: true, alpha: 0.7 }); ctx.restore();
          continue;
        }
        const bob = S.active === a ? ((QQ.frame >> 3) & 1) : 0;
        QQ.spr(a.sprite, x, y - bob, { scale: a.scale, flip: a.side === 'p', alpha: a.alpha, white: a.flash > 0 && (a.flash & 2) });
        if (a.guard) QQ.spr('ic_shield', x + (a.side === 'p' ? -10 : w - 6), y + w - 18);
        if (a.side === 'e' && a.hp > 0) {
          QQ.bar(a.x - 14, y - 6, 28, 4, a.hp / a.mhp, a.hp > a.mhp * 0.3 ? '#7fd35b' : '#ff5d5d');
          let tx = a.x - 14;
          for (const s in a.st) { const d = QQ.STATUS[s]; QQ.text(d.tag, tx, y - 15, d.col, { shadow: 1 }); tx += QQ.textW(d.tag) + 3; }
        }
        if (S.active === a) QQ.cursor(Math.round(a.x - 2), Math.round(y - 12));
        if (S.cursorOn === a) QQ.spr('ic_hand', a.side === 'e' ? x + w - 2 : x - 16, y + w / 2 - 8 + ((QQ.frame >> 3) & 1), { flip: a.side === 'e' });
      }
      for (const f of S.fx) QQ.spr(f.name, f.x - 16, f.y - 16 - (18 - f.t) * 0.4, { scale: 2, alpha: Math.min(1, f.t / 6) });
      for (const f of S.floats) QQ.text(f.text, f.x, f.y, f.col, { align: 'center', shadow: 1 });
      // party panel
      QQ.box(130, 160, 186, 78);
      S.party.forEach((a, i) => {
        const y = 166 + i * 17, on = S.active === a;
        QQ.text(a.name, 138, y, a.hp <= 0 ? 'r' : on ? 'y' : 'w');
        QQ.text(a.hp + '/' + a.mhp, 228, y, a.hp <= a.mhp * 0.3 ? 'r' : 'w', { align: 'right' });
        QQ.bar(176, y + 9, 52, 3, a.hp / a.mhp, a.hp > a.mhp * 0.3 ? '#7fd35b' : '#ff5d5d', '#3a3160');
        QQ.text(a.nrg + '/' + a.mnrg, 270, y, 'c', { align: 'right' });
        QQ.bar(236, y + 9, 34, 3, a.mnrg ? a.nrg / a.mnrg : 0, '#6fd3f2', '#3a3160');
        let tx = 276;
        for (const s in a.st) { if (tx > 300) break; const d = QQ.STATUS[s]; QQ.text(d.tag.slice(0, 1) + d.tag.slice(-1), tx, y, d.col); tx += 13; }
      });
      if (!QQ.modals.length) {
        QQ.box(4, 160, 124, 78);
        alive('e').slice(0, 5).forEach((e, i) => QQ.text(e.name, 12, 168 + i * 12, 'w'));
      }
      if (S.msg) { QQ.box(4, 4, 312, 19); QQ.text(S.msg, 12, 10, 'w'); }
    }
  };
})();

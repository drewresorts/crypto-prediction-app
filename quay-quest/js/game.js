// Game state and party rules: stats, levelling, inventory, the trap economy, days and community trust.
(function () {
  'use strict';
  const QQ = window.QQ;

  QQ.newGame = function () {
    const G = QQ.G = {
      v: 1, map: 'ends', x: 14, y: 12, dir: 1,
      party: [], chars: {}, p: 60, inv: { potnoodle: 2, crisps: 1 },
      stash: { bud: 0, light: 0, dark: 0 }, bag: 0,
      day: 1, trust: 60, heat: { ends: 0, grim: 0, dreg: 0, pid: 0, quay: 0 },
      sold: {}, flags: {}, quest: 'start', steps: 0, donated: 0, wins: 0
    };
    QQ.join('kaz', 1); QQ.join('biggz', 1);
    return G;
  };

  QQ.flag = (k, v) => { if (v === undefined) return QQ.G.flags[k]; QQ.G.flags[k] = v; return v; };
  QQ.inParty = (id) => QQ.G.party.includes(id);
  QQ.leadLv = () => QQ.G.chars.kaz.lv;

  // ---------------------------------------------------------------- stats
  QQ.stat = function (id, key) {
    const c = QQ.G.chars[id], d = QQ.CHARS[id];
    let v = Math.floor(d.base[key] + d.grow[key] * (c.lv - 1)) + (c.perm[key] || 0);
    for (const s of ['w', 'g', 'd']) { const it = c.eq[s] && QQ.ITEMS[c.eq[s]]; if (it && it[key]) v += it[key]; }
    return v;
  };
  QQ.maxHp = (id) => QQ.stat(id, 'hp');
  QQ.maxNrg = (id) => QQ.stat(id, 'nrg');
  QQ.xpNext = (lv) => Math.floor(14 * Math.pow(lv, 1.6) + 10);
  QQ.skillsOf = (id) => QQ.CHARS[id].learn.filter(([lv]) => lv <= QQ.G.chars[id].lv).map(([, s]) => s);
  QQ.rankOf = (id, skill) => (QQ.G.chars[id] && QQ.G.chars[id].rank[skill]) || 1;
  QQ.rankMult = (rank) => 1 + 0.22 * (rank - 1);
  QQ.rankCost = (rank) => rank;            // SP to go from rank -> rank+1

  QQ.join = function (id, lv) {
    const d = QQ.CHARS[id];
    QQ.G.chars[id] = { lv: lv || 1, xp: 0, hp: 1, nrg: 1, eq: Object.assign({}, d.eq), sp: Math.max(0, (lv || 1) - 1), rank: {}, perm: {} };
    QQ.G.chars[id].hp = QQ.maxHp(id); QQ.G.chars[id].nrg = QQ.maxNrg(id);
    if (!QQ.G.party.includes(id)) QQ.G.party.push(id);
  };
  // returns list of level-up notes for display
  QQ.gainXp = function (id, n) {
    const c = QQ.G.chars[id], d = QQ.CHARS[id], notes = [];
    c.xp += n;
    while (c.lv < 30 && c.xp >= QQ.xpNext(c.lv)) {
      c.xp -= QQ.xpNext(c.lv);
      const before = { hp: QQ.maxHp(id), atk: QQ.stat(id, 'atk'), def: QQ.stat(id, 'def'), spd: QQ.stat(id, 'spd') };
      c.lv++; c.sp++;
      const learned = d.learn.filter(([lv]) => lv === c.lv).map(([, s]) => QQ.SKILLS[s].name);
      c.hp = QQ.maxHp(id); c.nrg = QQ.maxNrg(id);
      notes.push({ id, lv: c.lv, learned, hp: QQ.maxHp(id) - before.hp, atk: QQ.stat(id, 'atk') - before.atk, def: QQ.stat(id, 'def') - before.def, spd: QQ.stat(id, 'spd') - before.spd });
    }
    return notes;
  };
  QQ.healAll = function () {
    QQ.G.party.forEach((id) => { QQ.G.chars[id].hp = QQ.maxHp(id); QQ.G.chars[id].nrg = QQ.maxNrg(id); });
  };

  // ---------------------------------------------------------------- inventory
  QQ.count = (item) => QQ.G.inv[item] || 0;
  QQ.has = (item) => QQ.count(item) > 0 || QQ.G.party.some((id) => Object.values(QQ.G.chars[id].eq).includes(item));
  QQ.give = function (item, n, quiet) {
    n = n || 1;
    QQ.G.inv[item] = QQ.count(item) + n;
    if (!quiet) { QQ.toast('Got ' + QQ.ITEMS[item].name + (n > 1 ? ' x' + n : ''), 'g'); QQ.audio.sfx('ok'); }
  };
  QQ.take = function (item, n) {
    n = n || 1;
    if (QQ.count(item) < n) return false;
    QQ.G.inv[item] -= n; if (QQ.G.inv[item] <= 0) delete QQ.G.inv[item];
    return true;
  };
  QQ.addP = function (n, quiet) {
    QQ.G.p = Math.max(0, Math.round(QQ.G.p + n));
    if (!quiet && n) { QQ.toast((n > 0 ? '+' : '-') + QQ.money(Math.abs(n)), n > 0 ? 'y' : 'r'); if (n > 0) QQ.audio.sfx('cash'); }
  };
  QQ.equip = function (id, slot, item) {
    const c = QQ.G.chars[id], old = c.eq[slot];
    if (item && !QQ.take(item, 1)) return false;
    if (old) QQ.give(old, 1, true);
    c.eq[slot] = item || null;
    c.hp = Math.min(c.hp, QQ.maxHp(id)); c.nrg = Math.min(c.nrg, QQ.maxNrg(id));
    return true;
  };
  // field use of a consumable. Returns a message, or null if it would do nothing.
  QQ.useItem = function (item, id) {
    const it = QQ.ITEMS[item], c = QQ.G.chars[id], name = QQ.CHARS[id].name;
    if (it.battleOnly) return null;
    let msg = null;
    if (it.revive) { if (c.hp > 0) return null; c.hp = Math.round(QQ.maxHp(id) * it.revive); msg = name + ' is back on their feet.'; }
    else if (c.hp <= 0) return null;
    if (it.perm) { for (const k in it.perm) c.perm[k] = (c.perm[k] || 0) + it.perm[k]; msg = name + ' feels permanently stronger.'; }
    if (it.heal && c.hp > 0) { if (c.hp >= QQ.maxHp(id) && !it.nrg && !it.cure) return null; c.hp = Math.min(QQ.maxHp(id), c.hp + it.heal); msg = name + ' recovers HP.'; }
    if (it.nrg) { if (c.nrg >= QQ.maxNrg(id) && !it.heal) return null; c.nrg = Math.min(QQ.maxNrg(id), c.nrg + it.nrg); msg = msg || name + ' recovers NRG.'; }
    if (it.nrgAll) { QQ.G.party.forEach((p) => { const pc = QQ.G.chars[p]; if (pc.hp > 0) pc.nrg = Math.min(QQ.maxNrg(p), pc.nrg + it.nrgAll); }); msg = 'Everyone recovers NRG.'; }
    if (it.cure && !msg) msg = name + ' feels sorted.';
    if (msg) QQ.take(item, 1);
    return msg;
  };

  // ---------------------------------------------------------------- the trap economy
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10000) / 10000; };
  QQ.dayRand = (key) => hash(key + ':' + QQ.G.day + ':qq');
  QQ.stashCount = () => QQ.G.stash.bud + QQ.G.stash.light + QQ.G.stash.dark;
  QQ.bagCap = () => QQ.BAGS[QQ.G.bag].cap;
  QQ.buyPrice = (prod, delivery) => Math.round(QQ.PRODUCTS[prod].base * (0.85 + 0.3 * QQ.dayRand('buy' + prod)) * (delivery ? 1.25 : 1));
  QQ.sellPrice = (prod, town) => Math.round(QQ.PRODUCTS[prod].base * QQ.TOWNS[town].mult[prod] * (0.9 + 0.25 * QQ.dayRand(town + prod)));
  QQ.bulkPrice = (prod, town) => Math.round(QQ.sellPrice(prod, town) * 0.7);
  // what a named customer wants today: {prod, qty, each}
  QQ.customerWant = function (custId, town, prods) {
    const prod = prods[Math.floor(QQ.dayRand(custId + 'p') * prods.length)];
    return { prod, qty: 2 + Math.floor(QQ.dayRand(custId + 'q') * 4), each: Math.round(QQ.sellPrice(prod, town) * (1.05 + 0.2 * QQ.dayRand(custId + 'e'))) };
  };
  QQ.addHeat = function (town, n) {
    QQ.G.heat[town] = QQ.clamp((QQ.G.heat[town] || 0) + n, 0, 100);
    if (n > 0 && QQ.G.heat[town] >= 60) QQ.toast('This town is getting HOT', 'r');
  };

  // ---------------------------------------------------------------- days and community trust
  QQ.trust = function (d, quiet) {
    const before = QQ.G.trust;
    QQ.G.trust = QQ.clamp(QQ.G.trust + d, 0, 100);
    const diff = QQ.G.trust - before;
    if (!quiet && diff) QQ.toast('Community trust ' + (diff > 0 ? '+' : '') + diff, diff > 0 ? 'g' : 'r');
  };
  QQ.nextDay = function (n) {
    n = n || 1;
    QQ.G.day += n;
    QQ.G.sold = {};
    for (const t in QQ.G.heat) QQ.G.heat[t] = Math.max(0, QQ.G.heat[t] - 22 * n);
    QQ.trust(-2 * n, true);
    QQ.toast('Day ' + QQ.G.day + '. Wrong\'s lobbyists were busy: trust -' + 2 * n, 'o');
    if (QQ.G.trust > 0 && QQ.G.trust <= 20) QQ.toast('The community is losing faith!', 'r');
  };

  // ---------------------------------------------------------------- save / load
  QQ.saveGame = function (quiet) {
    const ok = QQ.store.write(QQ.G);
    if (!quiet) QQ.toast(ok ? 'Game saved' : 'Saved for this session only', ok ? 'g' : 'o');
    return ok;
  };
  QQ.loadGame = function () {
    const s = QQ.store.read();
    if (!s || s.v !== 1 || !s.chars || !s.chars.kaz) return false;
    QQ.G = s;
    return true;
  };

  QQ.QUESTS = {
    start: 'Find Unc at his flat on Crestwell Estate. He has a job for you.',
    station: 'Catch the train from Crestwell station to Grimsworth.',
    gaz: 'Find 14 Bleak Street in Grimsworth. Unc says a man called Gaz lives there.',
    shed: 'Something is moving in the shed behind Gaz\'s house. Check it.',
    library: 'The Nitty Sage says the trail starts in Grimsworth Library.',
    baz: 'The key page is missing. The bookmark says "Property of B. Bazzington, The Rusty Ferret".',
    dreg: 'The page points to Admiral Kev\'s Fun Palace in Dregthorpe-on-Sea. Catch a train.',
    kev: 'Get into the back office at the Fun Palace and make Admiral Kev talk.',
    pid: 'The ledger says Lady Hedgefund of Piddlebrook Manor bought the amulet. Catch a train.',
    lady: 'Get inside Piddlebrook Manor and find Lady Hedgefund.',
    quay: 'The amulet ships from Blackwater Quay tonight. Get there before Pulon Wrong does.',
    container: 'Find container WR-0N6 at Berth 4, Blackwater Quay.',
    done: 'The ends are safe. For now.'
  };
})();

// Menus: pause menu, party screens, shops, the trap trade, train travel, title screen.
(function () {
  'use strict';
  const QQ = window.QQ;
  const DESC = { x: 4, y: 196, w: 312, h: 40 };

  function partyPanel() {
    const G = QQ.G;
    QQ.box(94, 16, 222, 150);
    G.party.forEach((id, i) => {
      const c = G.chars[id], d = QQ.CHARS[id], y = 22 + i * 36;
      QQ.rect(100, y, 34, 32, '#0b0912'); QQ.rect(101, y + 1, 32, 30, '#3a3160');
      QQ.spr(d.sprite, 101, y, { scale: 2 });
      QQ.text(d.name, 140, y, 'y'); QQ.text(d.role, 140, y + 10, 'd');
      QQ.text('Lv ' + c.lv, 200, y, 'w');
      if (c.sp) QQ.text(c.sp + ' SP', 200, y + 10, 'g');
      QQ.text('HP', 232, y, 'w'); QQ.text(c.hp + '/' + QQ.maxHp(id), 310, y, c.hp <= 0 ? 'r' : 'w', { align: 'right' });
      QQ.bar(232, y + 9, 78, 3, c.hp / QQ.maxHp(id), '#7fd35b', '#3a3160');
      QQ.text('NRG', 232, y + 14, 'w'); QQ.text(c.nrg + '/' + QQ.maxNrg(id), 310, y + 14, 'c', { align: 'right' });
      QQ.bar(232, y + 23, 78, 3, c.nrg / QQ.maxNrg(id), '#6fd3f2', '#3a3160');
    });
    QQ.box(94, 170, 222, 66);
    const town = QQ.world.map.town;
    QQ.text('P', 102, 177, 'd'); QQ.text(QQ.money(G.p), 150, 177, 'y');
    QQ.text('Day', 102, 188, 'd'); QQ.text(String(G.day), 150, 188, 'w');
    QQ.text('Trust', 102, 199, 'd'); QQ.bar(150, 199, 60, 7, G.trust / 100, G.trust > 40 ? '#7fd35b' : G.trust > 20 ? '#ffd23f' : '#ff5d5d', '#3a3160'); QQ.text(G.trust + '%', 214, 199, 'w');
    QQ.text('Bag', 102, 210, 'd'); QQ.text('Bud ' + G.stash.bud + '  Light ' + G.stash.light + '  Dark ' + G.stash.dark + '  (' + QQ.stashCount() + '/' + QQ.bagCap() + ')', 150, 210, 'c');
    QQ.text('Where', 102, 221, 'd'); QQ.text(QQ.world.map.name + (town ? '' : ''), 150, 221, 'w');
  }
  const who = (title) => QQ.menu({
    x: 4, y: 16, w: 88, title, lh: 17,
    items: QQ.G.party.map((id) => ({ label: QQ.CHARS[id].name, icon: QQ.CHARS[id].sprite })), extra: partyPanel
  }).then((i) => (i < 0 ? null : QQ.G.party[i]));

  function statusPage(id) {
    return new Promise((res) => {
      const m = QQ.push({
        update() { if (QQ.input.pressed('a') || QQ.input.pressed('b')) { QQ.audio.sfx('cancel'); QQ.pop(m); res(); } },
        draw() {
          const c = QQ.G.chars[id], d = QQ.CHARS[id];
          QQ.box(20, 20, 280, 200, { title: d.name + ' the ' + d.role });
          QQ.rect(30, 32, 52, 52, '#0b0912'); QQ.rect(31, 33, 50, 50, '#3a3160'); QQ.spr(d.sprite, 32, 34, { scale: 3 });
          QQ.text('Level ' + c.lv, 92, 34, 'y');
          QQ.text('XP ' + c.xp + ' / ' + QQ.xpNext(c.lv), 92, 46, 'w');
          QQ.bar(92, 56, 120, 5, c.xp / QQ.xpNext(c.lv), '#ffd23f', '#3a3160');
          QQ.text('Skill points: ' + c.sp, 92, 66, c.sp ? 'g' : 'd');
          const rows = [['HP', c.hp + '/' + QQ.maxHp(id)], ['NRG', c.nrg + '/' + QQ.maxNrg(id)], ['ATK', QQ.stat(id, 'atk')], ['DEF', QQ.stat(id, 'def')], ['SPD', QQ.stat(id, 'spd')], ['LCK', QQ.stat(id, 'lck')]];
          rows.forEach(([k, v], i) => { QQ.text(k, 32, 96 + i * 12, 'd'); QQ.text(String(v), 110, 96 + i * 12, 'w', { align: 'right' }); });
          ['w', 'g', 'd'].forEach((s, i) => {
            const it = c.eq[s] && QQ.ITEMS[c.eq[s]];
            QQ.text(QQ.SLOT[s], 130, 96 + i * 20, 'd');
            if (it) { QQ.spr(it.icon, 172, 91 + i * 20); QQ.text(it.name, 192, 96 + i * 20, 'w'); } else QQ.text('-', 176, 96 + i * 20, 'd');
          });
          QQ.text('Skills', 130, 160, 'd');
          QQ.skillsOf(id).forEach((sid, i) => QQ.text(QQ.SKILLS[sid].name, 130 + (i % 2) * 84, 172 + ((i / 2) | 0) * 11, 'c'));
        }
      });
    });
  }
  async function itemsMenu() {
    let sel = 0;
    for (;;) {
      const keys = Object.keys(QQ.G.inv).sort((a, b) => 'usewgdkey'.indexOf(QQ.ITEMS[a].type) - 'usewgdkey'.indexOf(QQ.ITEMS[b].type));
      const i = await QQ.menu({
        x: 4, y: 16, w: 180, rows: 9, lh: 17, title: 'Items', sel, desc: DESC, empty: 'Pockets are empty.',
        items: keys.map((k) => ({ label: QQ.ITEMS[k].name, icon: QQ.ITEMS[k].icon, right: QQ.ITEMS[k].type === 'key' ? '' : 'x' + QQ.G.inv[k], color: QQ.ITEMS[k].type === 'key' ? 'y' : 'w', desc: QQ.ITEMS[k].desc }))
      });
      if (i < 0) return;
      sel = i;
      const it = QQ.ITEMS[keys[i]];
      if (it.type !== 'use') { QQ.audio.sfx('no'); QQ.toast(it.type === 'key' ? 'Hold on to that.' : 'Equip it from the Garms menu.'); continue; }
      const id = await who('Use on');
      if (!id) continue;
      const msg = QQ.useItem(keys[i], id);
      if (msg) { QQ.audio.sfx('heal'); QQ.toast(msg, 'g'); } else { QQ.audio.sfx('no'); QQ.toast('No point right now.'); }
    }
  }
  const bonus = (it) => ['atk', 'def', 'spd', 'lck', 'hp', 'nrg'].filter((k) => it[k]).map((k) => k.toUpperCase() + ' +' + it[k]).join('  ');
  async function equipMenu() {
    for (;;) {
      const id = await who('Garms');
      if (!id) return;
      let slotSel = 0;
      for (;;) {
        const c = QQ.G.chars[id];
        const s = await QQ.menu({
          x: 4, y: 16, w: 200, lh: 17, title: QQ.CHARS[id].name, sel: slotSel,
          items: ['w', 'g', 'd'].map((k) => ({ label: QQ.SLOT[k] + ': ' + (c.eq[k] ? QQ.ITEMS[c.eq[k]].name : '-'), icon: c.eq[k] ? QQ.ITEMS[c.eq[k]].icon : 'ic_hand' })),
          desc: DESC
        });
        if (s < 0) break;
        slotSel = s;
        const slot = ['w', 'g', 'd'][s];
        const opts = Object.keys(QQ.G.inv).filter((k) => QQ.ITEMS[k].type === slot);
        const items = opts.map((k) => ({ label: QQ.ITEMS[k].name, icon: QQ.ITEMS[k].icon, right: 'x' + QQ.G.inv[k], desc: QQ.ITEMS[k].desc + '\n' + bonus(QQ.ITEMS[k]) }));
        if (c.eq[slot]) items.push({ label: 'Take it off', icon: 'ic_hand', desc: 'Go without.' });
        const pick = await QQ.menu({ x: 40, y: 30, w: 190, rows: 8, lh: 17, title: QQ.SLOT[slot], items, desc: DESC, empty: 'Nothing to wear. Hit the shops.' });
        if (pick < 0) continue;
        QQ.equip(id, slot, pick < opts.length ? opts[pick] : null);
        QQ.audio.sfx('buff');
      }
    }
  }
  async function skillsMenu() {
    for (;;) {
      const id = await who('Skills');
      if (!id) return;
      let sel = 0;
      for (;;) {
        const c = QQ.G.chars[id], ids = QQ.skillsOf(id);
        const i = await QQ.menu({
          x: 4, y: 16, w: 230, rows: 9, title: QQ.CHARS[id].name + '  -  ' + c.sp + ' SP', sel, desc: DESC,
          items: ids.map((sid) => {
            const k = QQ.SKILLS[sid], r = QQ.rankOf(id, sid);
            return { label: k.name, right: 'Rank ' + r + (r < 3 ? '  (' + QQ.rankCost(r) + ' SP)' : '  MAX'), rcolor: r < 3 && c.sp >= QQ.rankCost(r) ? 'g' : 'd', desc: k.desc + '  NRG ' + k.cost + '.  Each rank: +22% power.' };
          })
        });
        if (i < 0) break;
        sel = i;
        const sid = ids[i], r = QQ.rankOf(id, sid);
        if (r >= 3 || c.sp < QQ.rankCost(r)) { QQ.audio.sfx('no'); QQ.toast(r >= 3 ? 'Already maxed.' : 'Not enough SP. Level up.'); continue; }
        c.sp -= QQ.rankCost(r); c.rank[sid] = r + 1;
        QQ.audio.sfx('levelup'); QQ.toast(QQ.SKILLS[sid].name + ' is now rank ' + (r + 1), 'g');
      }
    }
  }
  async function questMenu() {
    const G = QQ.G, clues = ['tornpage', 'ledger', 'manifest'].filter((k) => QQ.count(k)).map((k) => '^y' + QQ.ITEMS[k].name + '^w: ' + QQ.ITEMS[k].desc);
    await QQ.say({ n: 'Objective' }, QQ.QUESTS[G.quest] || '...');
    if (clues.length) await QQ.say({ n: 'Clues' }, clues);
    await QQ.say({ n: 'How it works' }, [
      'Buy product off Unc in the Ends (or phone a re-up from the trap house). Sell it to cats out in the towns: every town pays best for something different.',
      '^yCommunity trust^w is all that stops Pulon Wrong flattening the Ends. It drops every day, drops if you sell or scrap on your own estate, and rises when you donate at the community centre or beat his people. If it hits zero, it is over.',
      '^oHeat^w rises as you sell in a town. Too hot and the Feds show up. It cools off each day.'
    ]);
  }

  QQ.menus = {
    async main() {
      let sel = 0;
      for (;;) {
        const c = await QQ.menu({
          x: 4, y: 16, w: 86, title: 'MENU', sel, extra: partyPanel,
          items: [{ label: 'Party' }, { label: 'Items' }, { label: 'Garms' }, { label: 'Skills' }, { label: 'Quest' }, { label: 'Save' }, { label: QQ.audio.muted ? 'Sound: off' : 'Sound: on' }]
        });
        if (c < 0) return;
        sel = c;
        if (c === 0) { const id = await who('Party'); if (id) await statusPage(id); }
        else if (c === 1) await itemsMenu();
        else if (c === 2) await equipMenu();
        else if (c === 3) await skillsMenu();
        else if (c === 4) await questMenu();
        else if (c === 5) QQ.saveGame();
        else if (c === 6) QQ.audio.toggle();
      }
    },

    // ------------------------------------------------------------ shops
    async shop(id) {
      const shop = QQ.SHOPS[id];
      let sel = 0;
      for (;;) {
        const rows = shop.stock.map((k) => {
          if (k.startsWith('bag')) {
            const lvl = +k.slice(3), b = QQ.BAGS[lvl], own = QQ.G.bag >= lvl;
            return { key: k, bag: lvl, label: b.name, icon: b.icon, right: own ? 'OWNED' : QQ.money(b.price), disabled: own || QQ.G.p < b.price || QQ.G.bag !== lvl - 1, desc: 'Carry up to ' + b.cap + ' units of product.' };
          }
          const it = QQ.ITEMS[k];
          return { key: k, label: it.name, icon: it.icon, right: QQ.money(it.price), disabled: QQ.G.p < it.price, desc: it.desc + '\nYou have ' + QQ.count(k) + '.' };
        });
        const i = await QQ.menu({ x: 4, y: 16, w: 210, rows: 9, lh: 17, title: shop.name, items: rows, sel, desc: DESC, extra: () => { QQ.box(220, 16, 96, 22); QQ.text(QQ.money(QQ.G.p), 308, 23, 'y', { align: 'right' }); QQ.text('P', 228, 23, 'd'); } });
        if (i < 0) return;
        sel = i;
        const r = rows[i];
        if (r.bag) { QQ.addP(-QQ.BAGS[r.bag].price); QQ.G.bag = r.bag; QQ.toast('Bag upgraded: ' + QQ.BAGS[r.bag].cap + ' units', 'g'); continue; }
        const it = QQ.ITEMS[r.key];
        let n = 1;
        if (it.type === 'use') {
          n = await QQ.pickNumber({ title: it.name, max: Math.min(20, Math.floor(QQ.G.p / it.price)), line: (v) => 'Total ' + QQ.money(v * it.price) });
          if (!n) continue;
        }
        QQ.addP(-it.price * n, true); QQ.give(r.key, n, true);
        QQ.audio.sfx('cash'); QQ.toast('Bought ' + it.name + (n > 1 ? ' x' + n : ''), 'g');
      }
    },

    // ------------------------------------------------------------ the trap trade
    async buyProduct(delivery) {
      let sel = 0;
      for (;;) {
        const keys = Object.keys(QQ.PRODUCTS), room = QQ.bagCap() - QQ.stashCount();
        const i = await QQ.menu({
          x: 4, y: 16, w: 210, lh: 17, title: delivery ? 'Re-up (delivered +25%)' : 'Unc\'s prices today', sel, desc: DESC,
          items: keys.map((k) => { const p = QQ.buyPrice(k, delivery); return { label: QQ.PRODUCTS[k].name, icon: QQ.PRODUCTS[k].icon, right: QQ.money(p) + ' each', disabled: QQ.G.p < p || room <= 0, desc: 'You hold ' + QQ.G.stash[k] + '. Bag ' + QQ.stashCount() + '/' + QQ.bagCap() + '. You have ' + QQ.money(QQ.G.p) + '.' }; })
        });
        if (i < 0) return;
        sel = i;
        const k = keys[i], p = QQ.buyPrice(k, delivery);
        const n = await QQ.pickNumber({ title: 'Buy ' + QQ.PRODUCTS[k].name, max: Math.min(room, Math.floor(QQ.G.p / p)), value: Math.min(room, Math.floor(QQ.G.p / p)), line: (v) => 'Cost ' + QQ.money(v * p) });
        if (!n) continue;
        QQ.addP(-n * p, true); QQ.G.stash[k] += n;
        QQ.audio.sfx('cash'); QQ.toast('Picked up ' + n + ' ' + QQ.PRODUCTS[k].name, 'c');
      }
    },
    async sellBulk(town) {
      let sel = 0;
      for (;;) {
        const keys = Object.keys(QQ.PRODUCTS);
        const i = await QQ.menu({
          x: 4, y: 16, w: 210, lh: 17, title: 'Sell in bulk', sel, desc: DESC,
          items: keys.map((k) => ({ label: QQ.PRODUCTS[k].name, icon: QQ.PRODUCTS[k].icon, right: QQ.money(QQ.bulkPrice(k, town)) + ' each', disabled: !QQ.G.stash[k], desc: 'You hold ' + QQ.G.stash[k] + '. Bulk pays less than cats do, but takes the lot.' }))
        });
        if (i < 0) return;
        sel = i;
        const k = keys[i], p = QQ.bulkPrice(k, town);
        const n = await QQ.pickNumber({ title: 'Sell ' + QQ.PRODUCTS[k].name, max: QQ.G.stash[k], value: QQ.G.stash[k], line: (v) => 'Get ' + QQ.money(v * p) });
        if (!n) continue;
        QQ.G.stash[k] -= n; QQ.addP(n * p);
        QQ.addHeat(town, Math.min(30, 4 + n * 2));
        if (town === 'ends') QQ.trust(-5);
      }
    },

    // ------------------------------------------------------------ trains
    async travel(here) {
      const ids = Object.keys(QQ.TOWNS).filter((t) => t !== here && (!QQ.TOWNS[t].flag || QQ.flag(QQ.TOWNS[t].flag)) && (t !== 'grim' || QQ.G.quest !== 'start'));
      if (!ids.length) { await QQ.say({ n: 'Ticket Machine' }, 'No services available. Speak to Unc first.'); return false; }
      const i = await QQ.menu({
        x: 60, y: 60, w: 200, title: 'Tickets (a journey takes a day)', desc: DESC,
        items: ids.map((t) => { const f = QQ.TOWNS[t].fare || QQ.TOWNS[here].fare; return { label: QQ.TOWNS[t].name, right: QQ.money(f), disabled: QQ.G.p < f, desc: QQ.TOWNS[t].full + '. Each day that passes costs the Ends 2 trust.' }; })
      });
      if (i < 0) return false;
      const t = ids[i], town = QQ.TOWNS[t];
      QQ.addP(-(town.fare || QQ.TOWNS[here].fare), true);
      QQ.audio.sfx('train');
      await QQ.fade(1, 20);
      QQ.nextDay(1);
      QQ.world.setMap(town.map, town.at[0], town.at[1], [0, 1]);
      QQ.saveGame(true);
      await QQ.wait(20);
      await QQ.fade(0, 20);
      if (QQ.story.arrive) await QQ.story.arrive(t);
      return true;
    },

    // ------------------------------------------------------------ title
    async title() {
      const Title = {
        draw() {
          const ctx = QQ.ctx;
          ctx.drawImage(QQ.tiles.battleBg('ends'), 0, 0);
          QQ.rect(0, 150, QQ.W, 90, '#0b0912');
          for (let i = 0; i < 20; i++) ctx.drawImage(QQ.tiles.get('road', i, 0, 0), i * 16, 124);
          for (let i = 0; i < 20; i++) ctx.drawImage(QQ.tiles.get(i % 2 ? 'road_h' : 'road', i, 1, 0), i * 16, 140);
          const bob = Math.sin(QQ.frame / 30) * 3;
          ctx.globalAlpha = 0.25 + 0.15 * Math.sin(QQ.frame / 18);
          ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(160, 62 + bob, 30, 0, 7); ctx.fill();
          ctx.globalAlpha = 1;
          QQ.spr('amulet', 136, 38 + bob, { scale: 3 });
          QQ.text('QUAY QUEST', 161, 13, 'k', { align: 'center', scale: 3 });
          QQ.text('QUAY QUEST', 160, 11, 'y', { align: 'center', scale: 3 });
          QQ.text('LEGEND OF THE NITTY AMULETS', 160, 96, 'w', { align: 'center', shadow: 1 });
          ['biggz', 'kaz', 'shay', 'gaz'].forEach((s, i) => QQ.spr(s, 98 + i * 34, 108 - (((QQ.frame >> 4) + i) & 1), { scale: 2 }));
          QQ.spr('pulon', 270, 104, { scale: 2, flip: true }); QQ.spr('henchman', 292, 108, { scale: 2, flip: true });
          QQ.text('Arrows: move   Z: OK   X: menu/back   M: sound', 160, 228, 'd', { align: 'center' });
        }
      };
      QQ.scene = Title;
      QQ.audio.music('title');
      for (;;) {
        const has = !!QQ.store.read();
        const i = await QQ.menu({ x: 110, y: 160, w: 100, cancel: false, items: [{ label: 'New Game' }, { label: 'Continue', disabled: !has }], sel: has ? 1 : 0 });
        if (i === 1 && QQ.loadGame()) { await QQ.fade(1, 14); QQ.scene = QQ.world; QQ.world.setMap(QQ.G.map, QQ.G.x, QQ.G.y); await QQ.fade(0, 14); return; }
        if (i === 0) {
          if (has) { const sure = await QQ.choose(['Start over', 'Keep my save'], { x: 110, y: 120, w: 100, title: 'Overwrite?' }); if (sure !== 0) continue; }
          QQ.newGame();
          await QQ.fade(1, 14);
          QQ.scene = QQ.world; QQ.world.setMap('ends', 14, 12);
          await QQ.story.intro();
          return;
        }
      }
    }
  };
})();

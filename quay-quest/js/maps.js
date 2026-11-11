// Map layouts: five towns and their interiors.
(function () {
  'use strict';
  const QQ = window.QQ;
  const S = () => QQ.story, flag = (k) => QQ.flag(k);
  const shop = (id) => () => QQ.menus.shop(id);
  const speech = (n) => () => (QQ.G.sold[n] === QQ.G.day ? null : 'ic_speech');
  const cust = (m, d) => m.npc(Object.assign({ wander: 1, bubble: speech(d.id), talk: (n) => S().customer(n, m.town, d.prods, d.lines) }, d));

  function station(m, town, x0, w) {
    m.fill(x0, 0, w, 1, 'rail', true).line('train', x0 + 1, 0, w - 2, 1, 0);
    m.fill(x0, 1, w, 3, 'platform', false);
    m.obj(x0 + 2, 1, 'vending', true, () => QQ.menus.travel(town));
    m.obj(x0 + 3, 1, 'busstop', true, () => QQ.menus.travel(town));
    m.obj(x0 + w - 2, 1, 'bench', true);
  }
  function terraces(m, x0, y, n, o) {
    for (let k = 0; k < n; k++) m.building(x0 + k * 3, y, 3, 4, Object.assign({ wall: k % 2 ? 'w_red' : 'w_yellow', roof: 'r_slate', door: 1, doorSprite: k % 3 === 2 ? 'door_white' : 'door', act: () => QQ.say(null, QQ.pick(['No answer.', 'A dog goes mental behind the door.', 'Someone shouts "WE DON\'T WANT ANY".', 'The curtains twitch.'])) }, o || {}));
  }

  QQ.buildMaps = function () {
    // ============================================================ THE ENDS
    let m = new QQ.GMap('ends', { name: 'Crestwell Estate', w: 32, h: 24, base: 'pave', music: 'ends', bg: 'ends', town: 'ends' });
    m.fill(0, 14, 32, 2, 'road').fill(0, 14, 32, 1, 'road');
    for (let x = 1; x < 32; x += 3) m.fill(x, 14, 1, 1, 'road_h');
    m.fill(16, 0, 2, 24, 'road');
    for (let y = 1; y < 24; y += 3) if (y < 13 || y > 16) m.fill(16, y, 1, 1, 'road_v');
    m.fill(16, 14, 2, 2, 'zebra');
    // Marlowe House tower block
    m.building(1, 0, 9, 7, { wall: 'w_conc', roof: 'r_flat', wallRows: 4, door: 4, doorSprite: 'ddoor', to: { map: 'flat_unc', x: 4, y: 6, face: [0, -1] }, lit: true });
    m.building(11, 1, 4, 5, { wall: 'w_conc', roof: 'r_flat', wallRows: 3, lit: true });
    m.sign(9, 7, 'MARLOWE HOUSE. Floors 1-14. Lift out of order since 2011.');
    // community centre
    m.building(1, 9, 7, 4, { wall: 'w_yellow', roof: 'r_red', door: 3, doorSprite: 'door_red', to: { map: 'centre', x: 5, y: 6, face: [0, -1] } });
    m.sign(8, 12, 'CRESTWELL COMMUNITY CENTRE. Food bank Tue/Thu. Youth club every night. Petition inside.');
    m.objs('flowerpot', [[0, 12], [0, 11]]).obj(10, 11, 'bench').obj(12, 11, 'bin').obj(14, 9, 'lamp').obj(9, 9, 'lamp');
    // shops along the south
    m.building(1, 17, 4, 4, { wall: 'w_red', roof: 'r_flat', door: 1, doorSprite: 'door_red', act: shop('corner') });
    m.obj(3, 21, 'phonebox').sign(4, 21, 'BOSSMAN\'S CORNER SHOP. Open 6am till whenever.');
    m.building(6, 17, 4, 4, { wall: 'w_white', roof: 'r_flat', door: 1, doorSprite: 'door_white', act: shop('wingz') });
    m.sign(8, 21, 'WINGZ & TINGZ. Three wings and chips, £3.49.');
    m.building(10, 17, 5, 4, { wall: 'w_glass', roof: 'r_flat', door: 2, doorSprite: 'ddoor', act: shop('garms') });
    m.sign(14, 21, 'CREPS & GARMS. Bags, garms, drip. No refunds.');
    m.objs('bin', [[0, 21], [5, 22]]).obj(9, 22, 'bike').obj(1, 23, 'moped');
    // Wrong's marketing suite + hoardings
    m.building(19, 17, 6, 4, { wall: 'w_glass', roof: 'r_flat', door: 2, doorSprite: 'ddoor', act: () => S().salesSuite() });
    m.fill(25, 17, 1, 5, 'w_hoard', true);
    m.sign(18, 21, 'COMING SOON: THE CRESTWELL COLLECTION. Live. Work. Candle.');
    m.objs('cone', [[18, 17], [18, 19]]).obj(18, 18, 'barrier');
    // the back alley (opps)
    m.fill(26, 16, 6, 8, 'cobble').zoneRect(26, 16, 6, 8, 'ends_alley');
    m.objs('dumpster', [[26, 23], [31, 16]]).obj(31, 20, 'wheelie').obj(28, 23, 'manhole');
    m.chest(31, 23, 'ch_ends', [['chips', 2], ['energy', 1]], 25);
    // the park + station
    m.fill(19, 4, 13, 9, 'grass').zoneRect(19, 5, 13, 8, 'ends').fill(22, 8, 6, 2, 'dirt');
    m.objs('tree', [[19, 5], [19, 9], [31, 6], [31, 11], [23, 12], [27, 12]]).objs('bush', [[20, 12], [30, 12]]).obj(25, 6, 'bench').obj(26, 6, 'bin').obj(21, 7, 'deadtree');
    station(m, 'ends', 19, 13);
    m.line('picket', 19, 4, 10, 1, 0).line('picket', 30, 4, 2, 1, 0).line('picket', 18, 0, 5, 0, 1);
    m.npc({ id: 'tarquin', s: 'officeworker', x: 29, y: 4, when: () => !flag('tarquin'), talk: () => S().tarquin() });
    // folk
    cust(m, { id: 'c_dev', name: 'Lanky Dev', s: 'boy2', x: 13, y: 12, prods: ['bud'], lines: ['Bro. Bro. BRO.', 'Safe, safe.', 'I am good for today, fam.'] });
    m.npc({ id: 'kids', s: 'boy', x: 22, y: 10, wander: 2, talk: 'Mum says the man in the suit wants to knock our flats down and build a "artisan bakery". What is artisan?' });
    m.npc({ id: 'nan', s: 'oldwoman', x: 6, y: 13, wander: 2, talk: 'Sixty years on this estate. They will carry me out of here in a box, not a removal van.' });
    m.npc({ id: 'pig1', s: 'pigeon', x: 11, y: 8, wander: 2, solid: false, talk: 'Coo.' });
    m.npc({ id: 'drone1', s: 'drone', x: 21, y: 3, wander: 1, talk: 'BZZT. WRONG DEVELOPMENTS COMMUNITY SAFETY DRONE. ANTISOCIAL BEHAVIOUR WILL BE REPORTED TO THE COUNCIL.' });
    m.npc({ id: 'dev2', s: 'henchman', x: 22, y: 15, talk: 'Mr Wrong is very excited about this community. Mainly about what it could be without it.' });

    m = new QQ.GMap('flat_unc', { name: 'Unc\'s Flat, 9th Floor', w: 9, h: 8, music: 'indoor', bg: 'indoor', town: 'ends', indoor: true });
    m.room('w_int', 'carpet', 4, { map: 'ends', x: 5, y: 7, face: [0, 1] });
    m.obj(1, 2, 'sofa').obj(2, 2, 'tv').obj(6, 2, 'fridge').obj(7, 2, 'bookshelf').obj(1, 5, 'bed', true, () => S().rest()).obj(7, 5, 'table').obj(7, 4, 'chair');
    m.npc({ id: 'unc', s: 'man2', x: 4, y: 3, talk: () => S().unc() });

    m = new QQ.GMap('centre', { name: 'Community Centre', w: 11, h: 8, music: 'indoor', bg: 'indoor', town: 'ends', indoor: true });
    m.room('w_int', 'lino', 5, { map: 'ends', x: 4, y: 13, face: [0, 1] });
    m.objs('table', [[2, 4], [8, 4]]).objs('chair', [[2, 5], [8, 5]]).obj(1, 2, 'bookshelf2').obj(9, 2, 'pooltable').obj(1, 6, 'computer').obj(9, 6, 'arcade');
    m.obj(3, 2, 'ic_heart', true, () => QQ.say(null, 'A thermometer poster: SAVE CRESTWELL. The red line is about where the community trust bar is.'));
    m.npc({ id: 'pat', s: 'oldwoman', x: 5, y: 3, talk: () => S().pat() });
    m.npc({ id: 'yc', s: 'girl', x: 8, y: 6, wander: 1, talk: 'If they shut the youth club I am going to have to go to the library. Like a NERD.' });

    // ============================================================ GRIMSWORTH
    m = new QQ.GMap('grim', { name: 'Grimsworth', w: 34, h: 26, base: 'cobble', music: 'grim', bg: 'grim', town: 'grim' });
    station(m, 'grim', 0, 12);
    m.fill(0, 8, 34, 2, 'road'); for (let x = 1; x < 34; x += 3) m.fill(x, 8, 1, 1, 'road_h');
    m.fill(12, 10, 2, 16, 'road');
    m.building(14, 1, 7, 6, { wall: 'w_stone', roof: 'r_slate', door: 3, to: { map: 'library', x: 6, y: 7, face: [0, -1] } });
    m.sign(13, 6, 'GRIMSWORTH PUBLIC LIBRARY. Est. 1904. Still here. Somehow.');
    m.building(22, 3, 4, 4, { wall: 'w_white', roof: 'r_flat', door: 1, doorSprite: 'door_white', act: shop('griggs') });
    m.sign(26, 7, 'GRIGGS. Steak bakes, sausage rolls. Queue starts 7am.');
    m.building(27, 1, 6, 6, { wall: 'w_red', roof: 'r_slate', door: 2, to: { map: 'pub', x: 6, y: 8, face: [0, -1] } });
    m.obj(31, 6, 'pubsign', true, () => QQ.say(null, 'THE RUSTY FERRET. Proper ale. No London prices. No Londoners.'));
    m.obj(12, 2, 'lamp').obj(21, 7, 'bin').obj(33, 7, 'barrel');
    // market
    m.fill(18, 11, 16, 4, 'pave');
    m.objs('crates', [[19, 11], [20, 11], [25, 11], [31, 11]]).objs('barrel', [[22, 11], [28, 11]]).obj(33, 14, 'haybale');
    m.npc({ id: 'dave', s: 'shopkeeper', x: 21, y: 12, talk: async () => { await QQ.say({ n: 'Dodgy Dave', s: 'shopkeeper' }, 'Everything must go. Including me, if the bailiffs find us.'); await QQ.menus.shop('market'); } });
    // west green
    m.fill(0, 11, 11, 5, 'grass2').zoneRect(0, 11, 11, 5, 'grim');
    m.objs('deadtree', [[1, 11], [9, 15]]).obj(4, 12, 'bench').obj(6, 13, 'statue').objs('tree2', [[10, 11], [0, 15]]);
    // Bleak Street terraces (14 = Gaz)
    m.fill(0, 21, 12, 2, 'pave');
    terraces(m, 0, 17, 2); terraces(m, 9, 17, 1);
    m.building(6, 17, 3, 4, { wall: 'w_red', roof: 'r_slate', door: 1, doorSprite: 'door_red', act: async () => { if (await S().meetGaz()) await QQ.world.goto('gaz_house', 4, 6, [0, -1]); } });
    m.obj(8, 21, 'signpost', true, () => QQ.say(null, '14 BLEAK STREET. The red door. A note on the step: "NO JEHOVAHS NO BAILIFFS NO SALAD".'));
    m.fill(0, 23, 12, 3, 'grass2');
    m.line('fence', 0, 23, 5, 1, 0).line('fence', 7, 23, 5, 1, 0);
    m.obj(5, 24, 'shed', true, () => S().shed()).objs('rock', [[2, 25], [10, 25]]).obj(9, 24, 'wheelie').obj(1, 24, 'stump');
    // canal (east-south)
    m.fill(14, 16, 20, 10, 'grass2').zoneRect(14, 16, 20, 10, 'grim_canal');
    m.fill(14, 22, 20, 2, 'water', true).fill(20, 22, 2, 2, 'dock', false);
    m.objs('tree2', [[15, 17], [24, 16], [32, 19]]).obj(17, 20, 'trolley', true).obj(28, 24, 'tombstone').obj(33, 25, 'tombstone');
    m.chest(33, 17, 'ch_grim', [['proteinbar', 1], ['sausageroll', 2]]);
    m.chest(30, 25, 'ch_grim2', [['tonic', 1]], 40);
    m.npc({ id: 'trev', s: 'nitty3', x: 26, y: 18, talk: (n) => S().bulk(n, 'grim', 'Trev buys in bulk. Trev does not haggle. Trev does not pay well. But Trev buys.') , name: 'Big Trev' });
    cust(m, { id: 'c_shaz', name: 'Shaz', s: 'woman', x: 8, y: 22, prods: ['light', 'dark'], lines: ['Alright love.', 'Ta, love. Same time tomorrow.', 'Got us sorted, ta.'] });
    cust(m, { id: 'c_wayne', name: 'Wayne', s: 'nitty2', x: 3, y: 13, prods: ['dark', 'light', 'bud'], lines: ['Lads. LADS. Over here.', 'You are a gent. A London gent.', 'Me head is battered. Tomorrow.'] });
    cust(m, { id: 'c_kyle', name: 'Kyle', s: 'boy', x: 24, y: 13, prods: ['bud', 'light'], lines: ['Is it true London lads are in town?', 'Proper. Proper proper.', 'Mam says I am grounded.'] });
    m.npc({ id: 'gm1', s: 'oldman', x: 18, y: 10, wander: 2, talk: 'The mill closed in 1983. The pit in 1991. The Woolworths in 2008. That one hurt the most.' });
    m.npc({ id: 'gm2', s: 'builder', x: 30, y: 10, wander: 1, talk: 'Some London developer\'s been sniffing round the old mill. Wrong, his name is. Feels about right.' });

    m = new QQ.GMap('library', { name: 'Grimsworth Library', w: 13, h: 9, music: 'indoor', bg: 'indoor', town: 'grim', indoor: true });
    m.room('w_int', 'carpet_g', 6, { map: 'grim', x: 17, y: 7, face: [0, 1] });
    m.line('bookshelf', 1, 2, 4, 1, 0).line('bookshelf2', 8, 2, 4, 1, 0).objs('table', [[2, 5], [10, 5]]).objs('chair', [[3, 5], [9, 5]]).obj(1, 7, 'computer');
    m.obj(10, 4, 'book', true, () => S().book());
    m.npc({ id: 'librarian', s: 'librarian', x: 6, y: 3, talk: () => S().librarian() });

    m = new QQ.GMap('pub', { name: 'The Rusty Ferret', w: 12, h: 10, music: 'indoor', bg: 'indoor', town: 'grim', indoor: true });
    m.room('w_int2', 'wood', 6, { map: 'grim', x: 29, y: 7, face: [0, 1] });
    m.line('counter', 2, 4, 8, 1, 0).objs('barrel', [[1, 2], [10, 2]]).objs('table', [[2, 7], [9, 7]]).objs('chair', [[3, 7], [8, 7]]).obj(10, 6, 'arcade').obj(1, 8, 'pooltable');
    m.npc({ id: 'baz', s: 'hardman', x: 6, y: 3, talk: () => S().baz() });
    m.npc({ id: 'barmaid', s: 'woman', x: 3, y: 3, talk: async () => { await QQ.say({ n: 'Barmaid', s: 'woman' }, 'What you having?'); await QQ.menus.shop('ferret'); } });
    m.npc({ id: 'regular', s: 'boxer', x: 9, y: 8, talk: 'Baz has been on edge. Some posh bloke from London keeps ringing the landline about a bit of paper.' });

    m = new QQ.GMap('gaz_house', { name: '14 Bleak Street', w: 9, h: 8, music: 'indoor', bg: 'indoor', town: 'grim', indoor: true });
    m.room('w_int', 'carpet', 4, { map: 'grim', x: 7, y: 21, face: [0, 1] });
    m.obj(1, 2, 'bed', true, () => S().rest()).obj(3, 2, 'tv').obj(4, 2, 'sofa').obj(7, 2, 'fridge').obj(7, 4, 'table').obj(1, 6, 'toilet');
    m.obj(6, 4, 'burner', true, () => S().trapPhone());
    m.npc({ id: 'gazh', s: 'gaz', x: 5, y: 5, when: () => !QQ.inParty('gaz'), talk: () => S().gazHome() });

    m = new QQ.GMap('shed', { name: 'The Shed', w: 7, h: 7, music: 'shed', bg: 'indoor', town: 'grim', indoor: true });
    m.room('w_dark', 'dirt', 3, { map: 'grim', x: 6, y: 24, face: [0, 1] });
    m.obj(1, 2, 'bookshelf2').obj(5, 2, 'campfire').obj(1, 4, 'barrel').obj(5, 4, 'crates');
    m.npc({ id: 'sage', s: 'sage', x: 3, y: 2, talk: () => S().sage() });

    // ============================================================ DREGTHORPE-ON-SEA
    m = new QQ.GMap('dreg', { name: 'Dregthorpe-on-Sea', w: 34, h: 24, base: 'pave', music: 'sea', bg: 'sea', town: 'dreg' });
    station(m, 'dreg', 0, 12);
    m.fill(0, 8, 34, 2, 'road'); for (let x = 1; x < 34; x += 3) m.fill(x, 8, 1, 1, 'road_h');
    m.building(13, 1, 9, 6, { wall: 'w_neon', roof: 'r_metal', door: 4, doorSprite: 'ddoor', to: { map: 'arcade', x: 8, y: 10, face: [0, -1] } });
    m.sign(12, 6, 'ADMIRAL KEV\'S FUN PALACE. VIP NIGHT EVERY NIGHT.');
    m.npc({ id: 'bouncer', s: 'guard', x: 17, y: 7, when: () => !flag('vip'), talk: () => S().bouncer() });
    m.building(24, 2, 5, 5, { wall: 'w_white', roof: 'r_red', door: 2, doorSprite: 'door_white', act: shop('chippy') });
    m.sign(29, 6, 'THE CODFATHER. An offer you can\'t refuse: large cod, £11.');
    m.objs('lamp', [[11, 7], [23, 7], [31, 7]]).obj(30, 3, 'bin').obj(32, 3, 'phonebox');
    m.fill(0, 10, 34, 2, 'pave').line('ironfence', 0, 12, 20, 1, 0).line('ironfence', 22, 12, 12, 1, 0);
    m.fill(0, 13, 34, 7, 'sand').zoneRect(0, 13, 34, 7, 'dreg');
    m.fill(0, 20, 34, 4, 'sea', true);
    m.fill(24, 13, 3, 11, 'dock', false);
    m.objs('bollard', [[24, 23], [26, 23]]).obj(28, 21, 'boat').obj(9, 22, 'ship');
    m.objs('rock', [[3, 18], [15, 19]]).obj(6, 15, 'campfire').obj(32, 14, 'lighthouse').obj(1, 14, 'stump');
    m.obj(11, 15, 'van', true, shop('ices'));
    m.chest(0, 19, 'ch_dreg', [['scratchcard', 1], ['chips', 2]]);
    m.npc({ id: 'shay', s: 'shay', x: 25, y: 22, when: () => !QQ.inParty('shay'), talk: () => S().shay() });
    m.npc({ id: 'salty', name: 'Salty Pete', s: 'fisherman', x: 26, y: 15, talk: (n) => S().bulk(n, 'dreg', 'Pete takes the lot, no questions. Pete is not generous.') });
    cust(m, { id: 'c_stag', name: 'Stag Do Darren', s: 'man', x: 8, y: 11, prods: ['bud', 'light'], lines: ['OI OI! Groom needs sorting!', 'LEGEND. LEGEND!', 'Darren is down. Darren is DOWN.'] });
    cust(m, { id: 'c_marge', name: 'Marge', s: 'oldwoman', x: 30, y: 16, prods: ['bud'], lines: ['For my hip, dear.', 'Lovely. Have a Werther\'s.', 'Hip is grand today, ta.'] });
    cust(m, { id: 'c_dj', name: 'DJ Wavey', s: 'boy2', x: 19, y: 16, prods: ['bud', 'dark'], lines: ['Beach rave tonight, innit.', 'Bless.', 'I am good, man.'] });
    m.npc({ id: 'dg1', s: 'seagull', x: 14, y: 16, wander: 2, solid: false, talk: 'The seagull stares into your soul. It wants your chips.' });
    m.npc({ id: 'dg2', s: 'oldman', x: 4, y: 11, wander: 2, talk: 'Kev bought the Fun Palace in eighty-five. Calls himself Admiral. Never been on a boat. Gets seasick in the bath.' });

    m = new QQ.GMap('arcade', { name: 'Fun Palace', w: 17, h: 12, music: 'sea', bg: 'arcade', town: 'dreg', indoor: true });
    m.room('w_neon', 'carpet_n', 8, { map: 'dreg', x: 17, y: 7, face: [0, 1] }).zoneRect(1, 5, 15, 5, 'dreg_arcade');
    m.objs('arcade', [[1, 2], [2, 2], [4, 2], [5, 2], [11, 2], [12, 2], [14, 2]]).objs('bandit', [[1, 6], [1, 7], [15, 6], [15, 7]]);
    m.obj(3, 2, 'arcade', true, () => S().dance());
    m.obj(8, 1, 'door_red', true, async () => { if (flag('kev')) await QQ.say(null, 'The back office is empty. A poster: "KEV: EMPLOYEE OF THE MONTH (SELF-NOMINATED)".'); else await S().kev(); });
    m.line('counter', 10, 4, 4, 1, 0);
    m.npc({ id: 'prize', s: 'shopkeeper2', x: 12, y: 3, talk: async () => { await QQ.say({ n: 'Prize Counter', s: 'shopkeeper2' }, 'Tickets or cash. Mostly cash.'); await QQ.menus.shop('prizes'); } });
    m.npc({ id: 'gamer', s: 'boy', x: 5, y: 3, talk: 'Do NOT try the dance machine. Nobody has beaten the high score since 2004. It is just "KEV" all the way down.' });

    // ============================================================ LOWER PIDDLEBROOK
    m = new QQ.GMap('pid', { name: 'Lower Piddlebrook', w: 34, h: 26, base: 'grass', music: 'village', bg: 'village', town: 'pid' });
    station(m, 'pid', 0, 12);
    m.fill(0, 5, 21, 2, 'dirt').fill(9, 7, 2, 19, 'dirt').fill(11, 17, 23, 2, 'dirt').fill(20, 7, 2, 10, 'dirt');
    m.building(1, 8, 5, 4, { wall: 'w_stone', roof: 'r_thatch', door: 2, act: shop('farmshop') });
    m.sign(6, 11, 'PIDDLEBROOK FARM SHOP. Honesty box. We are watching.');
    m.building(12, 8, 5, 4, { wall: 'w_stone', roof: 'r_slate', door: 2, doorSprite: 'door_white', act: shop('outfitters') });
    m.sign(17, 11, 'COUNTRY CASUALS. Quilted gilets from £400.');
    m.building(1, 14, 4, 4, { wall: 'w_white', roof: 'r_thatch', door: 1 });
    m.obj(14, 14, 'fountain').objs('flowerpot', [[13, 13], [15, 13]]).obj(16, 15, 'bench').objs('sunflower', [[1, 19], [2, 19], [3, 19]]);
    m.objs('tree', [[7, 13], [6, 21], [18, 22], [0, 24]]).objs('hedge', [[11, 13], [11, 15], [17, 13], [17, 15]]).fill(1, 20, 7, 5, 'flowers').zoneRect(0, 19, 9, 7, 'pid');
    // manor grounds (fenced). Front gate x=27, back hedge gap x=32.
    m.line('ironfence', 21, 1, 13, 1, 0).line('ironfence', 21, 1, 16, 0, 1);
    m.line('ironfence', 22, 16, 5, 1, 0).line('ironfence', 28, 16, 4, 1, 0).obj(33, 16, 'hedge');
    m.fill(22, 2, 12, 14, 'grass2').zoneRect(22, 10, 12, 6, 'pid');
    m.building(23, 2, 9, 6, { wall: 'w_stone', roof: 'r_slate', door: 4, doorSprite: 'ddoor', to: { map: 'manor', x: 9, y: 10, face: [0, -1] }, lit: true });
    m.fill(27, 8, 1, 8, 'cobble').objs('statue', [[25, 10], [29, 10]]).objs('hedge', [[23, 12], [24, 12], [30, 12], [31, 12]]).obj(33, 3, 'tree');
    m.chest(32, 14, 'ch_pid', [['proteinbar', 1], ['champagne', 1]]);
    m.npc({ id: 'gbutler', s: 'butler', x: 27, y: 16, when: () => !flag('pid_gate'), talk: () => S().gateButler() });
    m.npc({ id: 'giles', s: 'farmer', x: 32, y: 16, when: () => !flag('combine'), talk: () => S().combine() });
    // farm (south-east)
    m.fill(12, 19, 22, 7, 'field').zoneRect(12, 19, 22, 7, 'pid');
    m.objs('haybale', [[14, 21], [15, 21], [26, 24]]).obj(30, 20, 'barn').obj(22, 23, 'scarecrow').objs('sheep', [[18, 24]]).objs('cow', [[28, 23]]);
    m.npc({ id: 'pippa', s: 'officeworker', x: 19, y: 6, talk: () => S().pippa() });
    cust(m, { id: 'c_hugo', name: 'Hugo', s: 'noble', x: 15, y: 6, prods: ['light'], lines: ['I say. Are you the... London chaps?', 'Absolutely splendid. Mummy must never know.', 'Rather sorted, thanks awfully.'] });
    cust(m, { id: 'c_tilly', name: 'Tilly', s: 'lady', x: 8, y: 16, prods: ['light', 'dark'], lines: ['Darling! Polo season, you know how it is.', 'Mwah. Mwah.', 'One simply cannot today, darling.'] });
    m.npc({ id: 'fence', name: 'The Gamekeeper', s: 'farmer', x: 3, y: 23, talk: (n) => S().bulk(n, 'pid', 'The Gamekeeper will take the lot off your hands. For a fair price. For him.') });
    m.npc({ id: 'pv1', s: 'oldwoman', x: 12, y: 16, wander: 2, talk: 'Lady Hedgefund has gone into business with some London developer. They are putting a spa where the allotments were. Over my dead marrow.' });
    m.npc({ id: 'goosey', s: 'goose', x: 16, y: 20, wander: 2, talk: 'HONK.' });

    m = new QQ.GMap('manor', { name: 'Piddlebrook Manor', w: 19, h: 12, music: 'indoor', bg: 'manor', town: 'pid', indoor: true });
    m.room('w_int2', 'checker', 9, { map: 'pid', x: 27, y: 8, face: [0, 1] }).zoneRect(1, 5, 17, 5, 'pid_manor');
    m.line('bookshelf', 1, 2, 3, 1, 0).line('bookshelf2', 15, 2, 3, 1, 0).objs('statue', [[6, 2], [12, 2]]).objs('table', [[3, 7], [15, 7]]).objs('chair', [[4, 7], [14, 7]]).obj(1, 9, 'safe').obj(17, 9, 'pooltable');
    m.fill(7, 2, 5, 3, 'carpet');
    m.chest(17, 5, 'ch_manor', [['golfclub', 1]], 120);
    m.npc({ id: 'lady', s: 'lady', x: 9, y: 3, when: () => !flag('lady'), talk: () => S().lady() });

    // ============================================================ BLACKWATER QUAY
    m = new QQ.GMap('quay', { name: 'Blackwater Quay', w: 32, h: 22, base: 'concrete', music: 'quay', bg: 'quay', town: 'quay', night: true });
    station(m, 'quay', 0, 9);
    m.fill(0, 8, 10, 14, 'pave');
    m.line('ironfence', 10, 0, 10, 0, 1).line('ironfence', 10, 11, 11, 0, 1);
    m.npc({ id: 'captain', s: 'guard', x: 10, y: 10, when: () => !flag('gate'), talk: () => S().captain() });
    m.npc({ id: 'vanman', s: 'shopkeeper2', x: 6, y: 9, talk: () => S().vanMan() });
    m.obj(7, 9, 'van').objs('lamp', [[3, 9], [8, 15]]).obj(2, 17, 'crates').obj(5, 19, 'barrel');
    m.sign(9, 12, 'BLACKWATER QUAY. Berth 4 straight ahead. Unauthorised visitors will be "regenerated".');
    cust(m, { id: 'c_doc', name: 'Night Shift Del', s: 'docker', x: 4, y: 14, prods: ['dark', 'light'], lines: ['Twelve-hour shift, mate.', 'Cheers. Never saw you.', 'Sorted till Thursday.'] });
    // container yard
    m.fill(11, 0, 19, 22, 'concrete').zoneRect(11, 0, 19, 22, 'quay');
    const cont = ['container_o', 'container_r', 'container_b'];
    for (let x = 11; x < 30; x++) { if (x !== 14 && x !== 24) m.obj(x, 8, cont[x % 3]); if (x !== 16 && x !== 25) m.obj(x, 12, cont[(x + 1) % 3]); }
    m.line('container_b', 20, 0, 8, 0, 1).line('container_o', 20, 13, 9, 0, 1).obj(20, 9, 'container_r').obj(20, 11, 'container_o');
    for (const [x, y] of [[13, 3], [14, 3], [17, 5], [23, 2], [24, 2], [27, 5], [13, 17], [17, 16], [17, 17], [23, 18], [27, 15], [28, 15]]) m.obj(x, y, cont[(x + y) % 3]);
    m.objs('crates', [[12, 1], [18, 19]]).objs('barrel', [[29, 1], [12, 20]]);
    m.chest(19, 1, 'ch_q1', [['kebab', 2], ['coffee', 2]]);
    m.chest(12, 18, 'ch_q2', [['medkit', 2]], 150);
    m.chest(29, 20, 'ch_q3', [['proteinbar', 1], ['plaster', 1]]);
    m.npc({ id: 'dozer', s: 'bulldozer', x: 20, y: 10, when: () => !flag('dozer'), talk: () => S().dozer() });
    // berth 4
    m.fill(27, 9, 3, 3, 'dock').fill(30, 0, 2, 22, 'sea', true).obj(30, 10, 'ship').objs('bollard', [[29, 9], [29, 11]]);
    m.zoneRect(26, 9, 4, 3, null);
    m.sign(26, 9, 'BERTH 4. Container WR-0N6 awaiting collection. Consignee: Wrong Developments PLC.');
    m.npc({ id: 'pulon', s: 'pulon', x: 28, y: 10, when: () => !flag('pulon'), talk: () => S().finale() });
    m.npc({ id: 'hench1', s: 'henchman', x: 28, y: 9, when: () => !flag('pulon'), talk: 'Mr Wrong is busy. Would you like to book a stakeholder engagement session?' });
    m.npc({ id: 'hench2', s: 'henchman2', x: 28, y: 11, when: () => !flag('pulon'), talk: 'Stand back. This is a private regeneration event.' });
  };
})();

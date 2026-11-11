// Quay Quest static data: cast, skills, items, enemies, shops, towns, music.
(function () {
  'use strict';
  const QQ = window.QQ;

  QQ.SPEAKERS = {
    kaz: { n: 'Kaz', s: 'kaz' }, biggz: { n: 'Biggz', s: 'biggz' }, gaz: { n: 'Gaz', s: 'gaz' }, shay: { n: 'Shay', s: 'shay' },
    sage: { n: 'The Nitty Sage', s: 'sage' }, unc: { n: 'Unc', s: 'man2' }, pat: { n: 'Aunty Pat', s: 'oldwoman' },
    pulon: { n: 'Pulon Wrong', s: 'pulon' }, pulon2: { n: 'Pulon the Wrong \'Un', s: 'pulon2' },
    baz: { n: 'Mad Baz', s: 'hardman' }, kev: { n: 'Admiral Kev', s: 'admiral' }, lady: { n: 'Lady Hedgefund', s: 'lady' },
    butler: { n: 'Jeeves', s: 'butler' }, agent: { n: 'Estate Agent', s: 'agent' }, librarian: { n: 'Librarian', s: 'librarian' },
    bossman: { n: 'Bossman', s: 'shopkeeper' }, chef: { n: 'Wingz Bossman', s: 'chef' }, guard: { n: 'Security', s: 'guard' },
    henchman: { n: 'Wrong Associate', s: 'henchman' }, fed: { n: 'Fed', s: 'police' }
  };

  // ---------------------------------------------------------------- party
  QQ.CHARS = {
    kaz: {
      name: 'Kaz', role: 'Trapper', sprite: 'kaz',
      base: { hp: 42, nrg: 14, atk: 9, def: 6, spd: 8, lck: 6 }, grow: { hp: 7, nrg: 2.2, atk: 2.0, def: 1.4, spd: 1.2, lck: 0.8 },
      learn: [[1, 'screwface'], [2, 'twopiece'], [4, 'finesse'], [6, 'rally'], [9, 'trapphone'], [13, 'bigmanting']],
      eq: { w: 'newspaper', g: 'hoodie', d: null }
    },
    biggz: {
      name: 'Biggz', role: 'Enforcer', sprite: 'biggz',
      base: { hp: 58, nrg: 9, atk: 11, def: 8, spd: 4, lck: 3 }, grow: { hp: 10, nrg: 1.5, atk: 2.3, def: 1.8, spd: 0.7, lck: 0.5 },
      learn: [[1, 'bigslap'], [3, 'comethen'], [5, 'bearhug'], [7, 'protein'], [10, 'bellyflop'], [14, 'wreckingball']],
      eq: { w: null, g: 'hoodie', d: null }
    },
    gaz: {
      name: 'Gaz', role: 'Nitty Knight', sprite: 'gaz',
      base: { hp: 34, nrg: 18, atk: 6, def: 4, spd: 9, lck: 10 }, grow: { hp: 6, nrg: 2.8, atk: 1.6, def: 1.1, spd: 1.4, lck: 1.4 },
      learn: [[1, 'sparechange'], [1, 'specialbrew'], [4, 'carrierbag'], [6, 'nittysprint'], [9, 'cluckfury'], [12, 'sagewisdom']],
      eq: { w: 'brickitem', g: null, d: null }
    },
    shay: {
      name: 'Shay', role: 'Fraudster', sprite: 'shay',
      base: { hp: 36, nrg: 16, atk: 8, def: 5, spd: 11, lck: 8 }, grow: { hp: 6.5, nrg: 2.5, atk: 1.9, def: 1.2, spd: 1.6, lck: 1.1 },
      learn: [[1, 'skimmer'], [1, 'wheelspin'], [6, 'fakereview'], [8, 'burnerswap'], [10, 'phishing'], [13, 'chargeback']],
      eq: { w: 'laptop', g: 'tracksuit', d: 'cap' }
    }
  };

  // ---------------------------------------------------------------- skills (players and enemies share one table)
  // tgt: enemy | enemies | ally | allies | self | dead | rand.  st: [status, turns, chance, onSelf]
  QQ.STATUS = {
    atkUp: { tag: 'ATK+', col: 'g', good: 1, text: 'is gassed!' }, atkDown: { tag: 'ATK-', col: 'r', text: 'is shook!' },
    defUp: { tag: 'DEF+', col: 'g', good: 1, text: 'braces up!' }, defDown: { tag: 'DEF-', col: 'r', text: 'is exposed!' },
    spdUp: { tag: 'SPD+', col: 'g', good: 1, text: 'is moving mad quick!' }, stun: { tag: 'STUN', col: 'y', text: 'is rattled!' },
    poison: { tag: 'SICK', col: 'p', text: 'feels proper rough!' }, taunt: { tag: 'BAIT', col: 'o', good: 1, text: 'is baiting them out!' }
  };
  QQ.SKILLS = {
    attack: { name: 'Attack', cost: 0, tgt: 'enemy', pow: 1, fx: 'fx_slash' },
    // Kaz
    screwface: { name: 'Screwface', cost: 3, tgt: 'enemy', st: [['atkDown', 3, 0.9]], fx: 'ic_skull', msg: '{u} screwfaces {t}.', desc: 'A proper dirty look. Lowers one enemy\'s ATK.' },
    twopiece: { name: 'Two-Piece Combo', cost: 4, tgt: 'enemy', pow: 0.72, hits: 2, fx: 'fx_fist', desc: 'Two quick hits. No chips.' },
    finesse: { name: 'Finesse', cost: 5, tgt: 'enemy', pow: 1.15, steal: 1, fx: 'cash', msg: '{u} finesses {t}!', desc: 'Hit them and lift their P while you are there.' },
    rally: { name: 'Rally the Mandem', cost: 6, tgt: 'allies', st: [['atkUp', 3, 1]], fx: 'fx_note', msg: '{u}: "Mandem, LOCK IN!"', desc: 'Gasses up the whole party. ATK up.' },
    trapphone: { name: 'Trap Phone', cost: 10, tgt: 'enemies', pow: 1.25, fx: 'moped', msg: '{u} rings the youngers. A ped mounts the kerb!', desc: 'One call and a moped clatters every enemy.' },
    bigmanting: { name: 'Big Man Ting', cost: 14, tgt: 'enemy', pow: 3.2, fx: 'fx_boom', msg: '{u}: "This is a big man ting."', desc: 'Everything Kaz has got, on one target.' },
    // Biggz
    bigslap: { name: 'Big Slap', cost: 3, tgt: 'enemy', pow: 1.5, st: [['stun', 1, 0.3]], fx: 'fx_fist', desc: 'An open palm the size of a dinner plate. May rattle.' },
    comethen: { name: 'Come Then!', cost: 4, tgt: 'self', st: [['taunt', 3, 1], ['defUp', 3, 1]], fx: 'ic_shield', msg: '{u}: "COME THEN!"', desc: 'Enemies target Biggz. His DEF goes up.' },
    bearhug: { name: 'Bear Hug', cost: 6, tgt: 'enemy', pow: 1.3, st: [['stun', 1, 0.65]], fx: 'fx_fist', desc: 'Squeeze the air out of them. Likely to rattle.' },
    protein: { name: 'Protein Shake', cost: 6, tgt: 'self', heal: 0.4, st: [['atkUp', 3, 1]], fx: 'fx_sparkle', msg: '{u} necks a protein shake.', desc: 'Heals Biggz and raises his ATK.' },
    bellyflop: { name: 'Belly Flop', cost: 9, tgt: 'enemies', pow: 1.2, fx: 'fx_boom', desc: 'Biggz leaves the ground. Everyone regrets it.' },
    wreckingball: { name: 'Wrecking Ball', cost: 12, tgt: 'enemy', pow: 3.6, st: [['defDown', 2, 1, 1]], fx: 'fx_boom', desc: 'Massive hit. Leaves Biggz wide open after.' },
    // Gaz
    sparechange: { name: 'Spare Change?', cost: 2, tgt: 'enemy', pow: 0.6, steal: 1, st: [['atkDown', 2, 0.5]], fx: 'cash', msg: '{u}: "Spare us 20p, mate?"', desc: 'Guilt-trips an enemy out of their P.' },
    specialbrew: { name: 'Tin of Special', cost: 4, tgt: 'ally', heal: 0.45, fx: 'pint', msg: '{u} cracks open a warm tin.', desc: 'Restores a chunk of one ally\'s HP.' },
    carrierbag: { name: 'Mystery Carrier Bag', cost: 5, tgt: 'enemies', special: 'bag', fx: 'pouch', msg: '{u} rummages in a carrier bag...', desc: 'Nobody knows what is in the bag. Not even Gaz.' },
    nittysprint: { name: 'Nitty Sprint', cost: 6, tgt: 'allies', st: [['spdUp', 4, 1]], fx: 'fx_bolt', msg: 'You have never seen a man move so fast.', desc: 'Whole party SPD up.' },
    cluckfury: { name: 'Clucking Fury', cost: 9, tgt: 'rand', pow: 0.8, hits: 4, fx: 'fx_slash_r', desc: 'Four wild hits on random enemies.' },
    sagewisdom: { name: 'Sage\'s Teachings', cost: 12, tgt: 'dead', revive: 0.5, fx: 'fx_sparkle_b', msg: '{u} whispers the old words.', desc: 'Gets a sparked-out ally back on their feet.' },
    // Shay
    skimmer: { name: 'Card Skimmer', cost: 3, tgt: 'enemy', pow: 1.0, steal: 1.5, fx: 'card', desc: 'Tap, tap, gone. Damage and extra P.' },
    wheelspin: { name: 'Wheelspin', cost: 5, tgt: 'enemies', pow: 0.78, fx: 'fx_smoke', msg: '{u} does a wheelspin through the lot of them.', desc: 'Hits every enemy.' },
    fakereview: { name: 'Fake Review', cost: 4, tgt: 'enemy', st: [['defDown', 3, 1]], fx: 'smartphone', msg: '{u} leaves {t} a one-star review.', desc: 'Lowers one enemy\'s DEF.' },
    burnerswap: { name: 'Burner Swap', cost: 5, tgt: 'ally', heal: 0.25, cleanse: 1, fx: 'burner', desc: 'New SIM, new you. Clears debuffs and heals a bit.' },
    phishing: { name: 'Phishing Link', cost: 8, tgt: 'enemies', pow: 0.4, st: [['stun', 1, 0.45]], fx: 'laptop', msg: '"Your parcel could not be delivered..."', desc: 'Light damage, may rattle every enemy.' },
    chargeback: { name: 'Chargeback', cost: 12, tgt: 'enemy', pow: 2.9, fx: 'fx_bolt', desc: 'Reverse the whole transaction. Heavy damage.' },
    // enemy moves
    peck: { name: 'Peck', tgt: 'enemy', pow: 0.6, hits: 2, fx: 'fx_slash' },
    snatch: { name: 'Chip Snatch', tgt: 'enemy', pow: 0.7, special: 'snatch', fx: 'fx_slash' },
    bite: { name: 'Bite', tgt: 'enemy', pow: 1.2, fx: 'fx_slash_r' },
    lockjaw: { name: 'Lockjaw', tgt: 'enemy', pow: 1.35, st: [['stun', 1, 0.2]], fx: 'fx_slash_r' },
    gnaw: { name: 'Gnaw', tgt: 'enemy', pow: 0.9, st: [['poison', 3, 0.35]], fx: 'fx_poison' },
    rummage: { name: 'Rummage', tgt: 'enemy', pow: 0.7, special: 'fee', fx: 'cash', msg: '{u} goes through your pockets!' },
    adminfee: { name: 'Admin Fee', tgt: 'enemy', pow: 0.6, special: 'fee', fx: 'card', msg: '{u}: "There is a small admin fee."' },
    sharedown: { name: 'Shared Ownership', tgt: 'enemy', st: [['defDown', 3, 0.8]], fx: 'house', msg: '{u}: "Have you considered shared ownership?"' },
    ringlight: { name: 'Ring Light', tgt: 'enemies', st: [['atkDown', 2, 0.6]], fx: 'fx_sparkle', msg: '{u}: "Guys, I am LITERALLY in the ends right now."' },
    oatlatte: { name: 'Oat Flat White', tgt: 'ally', heal: 0.3, fx: 'coffee', msg: '{u} serves a seven-quid oat flat white.' },
    bottle: { name: 'Bottle', tgt: 'enemy', pow: 1.5, fx: 'bottle' },
    headbutt: { name: 'Headbutt', tgt: 'enemy', pow: 1.3, st: [['stun', 1, 0.25]], fx: 'fx_fist' },
    beg: { name: 'Beg', tgt: 'enemy', pow: 0.5, special: 'fee', fx: 'cash', msg: '{u}: "Lend us a tenner, I\'ll pay you back Fridee."' },
    frenzy: { name: 'Frenzy', tgt: 'rand', pow: 0.55, hits: 3, fx: 'fx_slash_r' },
    honk: { name: 'HONK', tgt: 'enemy', pow: 0.4, st: [['stun', 1, 0.5]], fx: 'megaphone' },
    pitchfork: { name: 'Pitchfork', tgt: 'enemy', pow: 1.4, fx: 'fx_slash' },
    getorf: { name: 'Get Orf Moi Land', tgt: 'self', st: [['atkUp', 3, 1]], fx: 'fx_fire', msg: '{u}: "GET ORF MOI LAAAND!"' },
    pinch: { name: 'Pinch', tgt: 'enemy', pow: 1.1, st: [['defDown', 2, 0.3]], fx: 'fx_slash' },
    coinspray: { name: 'Coin Spray', tgt: 'enemies', pow: 0.7, fx: 'pound' },
    lads: { name: 'Lads Lads Lads', tgt: 'allies', st: [['atkUp', 2, 1]], fx: 'pint', msg: '{u}: "LADS! LADS! LADS!"' },
    downit: { name: 'Down It', tgt: 'self', heal: 0.22, fx: 'pint', msg: '{u} downs a pint in one.' },
    reel: { name: 'Reel In', tgt: 'enemy', pow: 1.2, st: [['stun', 1, 0.2]], fx: 'anchor' },
    trample: { name: 'Trample', tgt: 'enemies', pow: 0.95, fx: 'fx_smoke' },
    stare: { name: 'Thousand-Yard Stare', tgt: 'enemies', st: [['atkDown', 2, 0.5]], fx: 'ic_skull' },
    daddy: { name: 'Daddy\'s Lawyer', tgt: 'enemy', pow: 0.8, special: 'fee', fx: 'card', msg: '{u}: "My father will hear about this."' },
    tray: { name: 'Silver Tray', tgt: 'enemy', pow: 1.25, fx: 'fx_slash' },
    servetea: { name: 'Serve Tea', tgt: 'ally', heal: 0.3, fx: 'tea', msg: '{u}: "Tea is served."' },
    baton: { name: 'Baton', tgt: 'enemy', pow: 1.3, fx: 'fx_slash' },
    cuff: { name: 'Stop and Search', tgt: 'enemy', pow: 0.5, st: [['stun', 1, 0.45]], fx: 'dlock', msg: '{u}: "Empty your pockets for me."' },
    zap: { name: 'Zap', tgt: 'enemy', pow: 1.15, st: [['stun', 1, 0.15]], fx: 'fx_bolt' },
    scan: { name: 'Surveillance', tgt: 'enemies', st: [['defDown', 2, 0.6]], fx: 'fx_sparkle_b', msg: '{u} logs your faces to the cloud.' },
    hook: { name: 'Cargo Hook', tgt: 'enemy', pow: 1.3, fx: 'anchor' },
    briefcase: { name: 'Briefcase', tgt: 'enemy', pow: 1.2, fx: 'fx_fist' },
    nda: { name: 'NDA', tgt: 'enemy', pow: 0.3, st: [['stun', 1, 0.4]], fx: 'newspaper', msg: '{u} slaps you with an NDA.' },
    // bosses
    lastorders: { name: 'Last Orders', tgt: 'enemies', pow: 0.9, fx: 'pint', msg: '{u}: "LAST ORDERS!"' },
    barstool: { name: 'Bar Stool', tgt: 'enemy', pow: 1.7, fx: 'chair' },
    tokenstorm: { name: 'Token Storm', tgt: 'enemies', pow: 0.9, fx: 'pound' },
    cannon: { name: 'Penny Cannon', tgt: 'enemy', pow: 1.8, fx: 'fx_boom' },
    rigged: { name: 'Rigged Machine', tgt: 'enemies', st: [['atkDown', 3, 0.7]], fx: 'bandit', msg: '{u}: "The house always wins, kid."' },
    crop: { name: 'Riding Crop', tgt: 'enemy', pow: 1.5, fx: 'fx_slash_r' },
    offshore: { name: 'Offshore Account', tgt: 'self', heal: 0.14, st: [['defUp', 3, 1]], fx: 'cash', msg: '{u} moves assets to the Caymans.' },
    hounds: { name: 'Release the Hounds', tgt: 'enemies', pow: 1.05, fx: 'gshep', msg: '{u}: "Release the hounds!"' },
    tutting: { name: 'Withering Tut', tgt: 'enemies', st: [['atkDown', 3, 0.65]], fx: 'ic_speech', msg: '{u} tuts. It is devastating.' },
    crush: { name: 'Crush', tgt: 'enemy', pow: 1.6, fx: 'fx_boom' },
    demolish: { name: 'Demolition Notice', tgt: 'enemies', pow: 1.1, fx: 'fx_boom' },
    rev: { name: 'Rev Engine', tgt: 'self', st: [['atkUp', 3, 1]], fx: 'fx_smoke', msg: '{u} revs its engine.' },
    purchase: { name: 'Compulsory Purchase', tgt: 'enemy', pow: 1.3, special: 'fee', fx: 'card', msg: '{u}: "Consider it a compulsory purchase."' },
    synergy: { name: 'Synergy', tgt: 'allies', st: [['atkUp', 3, 1]], fx: 'fx_note', msg: '{u}: "Let\'s leverage some synergies."' },
    renthike: { name: 'Rent Hike', tgt: 'enemies', pow: 0.95, fx: 'house', msg: '{u} raises the rent on everyone.' },
    nova: { name: 'Nitty Nova', tgt: 'enemies', pow: 0.85, fx: 'fx_boom', msg: 'The amulet burns off-white!' },
    soultax: { name: 'Soul Tax', tgt: 'enemy', pow: 1.3, drain: 1, fx: 'fx_sparkle_b', msg: '{u} drains the light out of you.' },
    gentrify: { name: 'Gentrify', tgt: 'enemies', st: [['defDown', 3, 0.8]], fx: 'coffee', msg: '{u}: "This area is so up-and-coming."' },
    luxflats: { name: 'Luxury Flats', tgt: 'enemy', pow: 1.8, fx: 'fx_boom', msg: '{u} drops a block of luxury flats on you!' }
  };

  // ---------------------------------------------------------------- items
  QQ.ITEMS = {
    // food and consumables
    crisps: { name: 'Bag of Crisps', icon: 'crisps', type: 'use', price: 4, heal: 18, desc: 'Prawn cocktail. Restores 18 HP.' },
    potnoodle: { name: 'Pot Noodle', icon: 'potnoodle', type: 'use', price: 7, heal: 35, desc: 'Chicken and mushroom. Restores 35 HP.' },
    chocolate: { name: 'Choccy Bar', icon: 'chocolate', type: 'use', price: 9, heal: 25, nrg: 6, desc: 'Restores 25 HP and 6 NRG.' },
    sausageroll: { name: 'Sausage Roll', icon: 'sausageroll', type: 'use', price: 11, heal: 60, desc: 'Still warm. Restores 60 HP.' },
    chips: { name: 'Cheesy Chips', icon: 'chips', type: 'use', price: 13, heal: 75, desc: 'Salt and vinegar, obviously. Restores 75 HP.' },
    chicken: { name: 'Chicken & Chips', icon: 'chicken', type: 'use', price: 18, heal: 110, desc: 'Three wings, chips, burger sauce. Restores 110 HP.' },
    pie: { name: 'Steak Bake', icon: 'pie', type: 'use', price: 24, heal: 160, desc: 'Molten in the middle. Restores 160 HP.' },
    kebab: { name: 'Mixed Doner', icon: 'kebab', type: 'use', price: 34, heal: 260, desc: 'Chilli sauce AND garlic mayo. Restores 260 HP.' },
    icecream: { name: '99 Flake', icon: 'icecream', type: 'use', price: 9, heal: 40, cure: 1, desc: 'Restores 40 HP and cures status.' },
    scone: { name: 'Cream Scone', icon: 'scone', type: 'use', price: 14, heal: 65, cure: 1, desc: 'Jam first. Restores 65 HP, cures status.' },
    tea: { name: 'Cup of Tea', icon: 'tea', type: 'use', price: 8, heal: 20, cure: 1, desc: 'Fixes most things. Cures status, restores 20 HP.' },
    energy: { name: 'Boost Can', icon: 'energy', type: 'use', price: 12, nrg: 15, desc: 'Tastes of battery. Restores 15 NRG.' },
    coffee: { name: 'Flat White', icon: 'coffee', type: 'use', price: 22, nrg: 32, desc: 'Restores 32 NRG.' },
    champagne: { name: 'Champers', icon: 'champagne', type: 'use', price: 90, nrgAll: 40, desc: 'Restores 40 NRG to the whole party.' },
    pint: { name: 'Pint of Stout', icon: 'pint', type: 'use', price: 10, battleOnly: 1, st: [['atkUp', 3], ['defDown', 3]], desc: 'In battle: ATK up, DEF down. Dutch courage.' },
    medkit: { name: 'First Aid Kit', icon: 'medkit', type: 'use', price: 45, revive: 0.4, desc: 'Revives a sparked-out ally at 40% HP.' },
    pills: { name: 'Paracetamol', icon: 'pills', type: 'use', price: 10, cure: 1, heal: 10, desc: 'Cures status effects.' },
    // permanent boosts
    proteinbar: { name: 'Protein Bar', icon: 'trophy', type: 'use', price: 0, perm: { atk: 2 }, fieldOnly: 1, desc: 'Permanently raises one person\'s ATK by 2.' },
    tonic: { name: 'Vitamin Tonic', icon: 'bottle', type: 'use', price: 0, perm: { hp: 12 }, fieldOnly: 1, desc: 'Permanently raises max HP by 12.' },
    scratchcard: { name: 'Lucky Scratchcard', icon: 'scratchcard', type: 'use', price: 0, perm: { lck: 3 }, fieldOnly: 1, desc: 'Permanently raises LCK by 3.' },
    plaster: { name: 'Thick-Skin Plasters', icon: 'plaster', type: 'use', price: 0, perm: { def: 2 }, fieldOnly: 1, desc: 'Permanently raises DEF by 2.' },
    // weapons
    newspaper: { name: 'Rolled-Up Metro', icon: 'newspaper', type: 'w', price: 5, atk: 2, desc: 'Free at the station. ATK +2.' },
    brickitem: { name: 'Half Brick', icon: 'brickitem', type: 'w', price: 30, atk: 4, desc: 'Found, not bought. ATK +4.' },
    pan: { name: 'Frying Pan', icon: 'pan', type: 'w', price: 45, atk: 5, desc: 'Non-stick. ATK +5.' },
    rollingpin: { name: 'Rolling Pin', icon: 'rollingpin', type: 'w', price: 80, atk: 7, desc: 'Nan\'s finest. ATK +7.' },
    cricketbat: { name: 'Cricket Bat', icon: 'cricketbat', type: 'w', price: 150, atk: 10, desc: 'Howzat. ATK +10.' },
    laptop: { name: 'Fraud Laptop', icon: 'laptop', type: 'w', price: 200, atk: 9, spd: 2, lck: 2, desc: 'Covered in stickers. ATK +9, SPD +2, LCK +2.' },
    bat: { name: 'Baseball Bat', icon: 'bat', type: 'w', price: 270, atk: 14, desc: 'Nobody here plays baseball. ATK +14.' },
    brolly: { name: 'Posh Brolly', icon: 'brolly', type: 'w', price: 340, atk: 15, def: 3, desc: 'Solid oak handle. ATK +15, DEF +3.' },
    dlock: { name: 'D-Lock', icon: 'dlock', type: 'w', price: 430, atk: 18, desc: 'Sold Secure Gold. ATK +18.' },
    golfclub: { name: 'Nine Iron', icon: 'golfclub', type: 'w', price: 620, atk: 22, desc: 'Borrowed from the manor. ATK +22.' },
    crowbar: { name: 'Crowbar', icon: 'crowbar', type: 'w', price: 900, atk: 27, desc: 'Opens doors. And containers. ATK +27.' },
    megaphone: { name: 'Megaphone', icon: 'megaphone', type: 'w', price: 0, atk: 12, lck: 4, desc: 'Aunty Pat\'s. ATK +12, LCK +4.' },
    // garms
    hoodie: { name: 'Black Hoodie', icon: 'hoodie', type: 'g', price: 20, def: 2, desc: 'Standard issue. DEF +2.' },
    tracksuit: { name: 'Trackie', icon: 'tracksuit', type: 'g', price: 60, def: 4, desc: 'Full matching set. DEF +4.' },
    tracksuit_r: { name: 'Red Tech Fleece', icon: 'tracksuit_r', type: 'g', price: 120, def: 6, spd: 1, desc: 'DEF +6, SPD +1.' },
    puffer: { name: 'Puffer Jacket', icon: 'puffer', type: 'g', price: 230, def: 9, desc: 'Like wearing a duvet. DEF +9.' },
    puffer_w: { name: 'White Puffer', icon: 'puffer_w', type: 'g', price: 390, def: 12, lck: 2, desc: 'Do NOT spill on it. DEF +12, LCK +2.' },
    vest: { name: 'Stab Vest', icon: 'vest', type: 'g', price: 720, def: 17, desc: 'Fell off a van. DEF +17.' },
    // drip (accessories)
    cap: { name: 'Baseball Cap', icon: 'cap', type: 'd', price: 45, spd: 2, desc: 'Low over the eyes. SPD +2.' },
    buckethat: { name: 'Bucket Hat', icon: 'buckethat', type: 'd', price: 60, lck: 4, desc: 'Festival energy. LCK +4.' },
    bally: { name: 'Bally', icon: 'bally', type: 'd', price: 130, atk: 3, desc: 'It IS cold out. ATK +3.' },
    shades: { name: 'Shades', icon: 'shades', type: 'd', price: 160, atk: 2, lck: 3, desc: 'Indoors, at night. ATK +2, LCK +3.' },
    trainers: { name: 'Fresh Creps', icon: 'trainers', type: 'd', price: 190, spd: 4, desc: 'Do not step on them. SPD +4.' },
    trainers_w: { name: 'Box-Fresh Whites', icon: 'trainers_w', type: 'd', price: 360, spd: 6, def: 1, desc: 'Blinding. SPD +6, DEF +1.' },
    chain: { name: 'Gold Chain', icon: 'chain', type: 'd', price: 520, atk: 3, def: 3, desc: 'Cuban link. ATK +3, DEF +3.' },
    watch: { name: 'Rolly', icon: 'watch', type: 'd', price: 680, atk: 4, spd: 4, desc: 'Probably real. ATK +4, SPD +4.' },
    ring: { name: 'Signet Ring', icon: 'ring', type: 'd', price: 0, def: 6, lck: 3, desc: 'The Hedgefund crest. DEF +6, LCK +3.' },
    medallion: { name: 'Sage\'s Medallion', icon: 'medallion', type: 'd', price: 0, hp: 20, nrg: 6, desc: 'Smells of the shed. Max HP +20, NRG +6.' },
    // key items
    burner: { name: 'Burner Phone', icon: 'burner', type: 'key', desc: 'Unc\'s line. Do not lose it.' },
    librarycard: { name: 'Library Card', icon: 'card', type: 'key', desc: 'Grimsworth Public Library. Expires never.' },
    tornpage: { name: 'Torn Page', icon: 'newspaper', type: 'key', desc: '"...pawned in 1987 at Admiral Kev\'s Fun Palace, Dregthorpe-on-Sea, for a tenner and a bag of chips."' },
    ledger: { name: 'Pawn Ledger', icon: 'book', type: 'key', desc: '"1994. One off-white amulet. Sold to Lady A. Hedgefund, Piddlebrook Manor, for her collection."' },
    manifest: { name: 'Shipping Manifest', icon: 'map', type: 'key', desc: '"Container WR-0N6. Blackwater Quay, Berth 4. Consignee: Wrong Developments PLC."' },
    vipcard: { name: 'Fun Palace VIP Card', icon: 'card', type: 'key', desc: 'Gets you past the rope at Admiral Kev\'s.' },
    invite: { name: 'Garden Party Invite', icon: 'ticket', type: 'key', desc: 'Piddlebrook Manor. Carriages at midnight.' },
    gatepass: { name: 'Quay Gate Pass', icon: 'card', type: 'key', desc: 'Blackwater Quay. Authorised personnel only.' },
    trophy: { name: 'Arcade Trophy', icon: 'trophy', type: 'key', desc: 'Dance machine high score. The youth club would love this.' },
    amulet: { name: 'The Nitty Amulet', icon: 'amulet', type: 'key', desc: 'An off-white stone on an intricate copper setting. It hums. It wants things.' }
  };
  QQ.SLOT = { w: 'Weapon', g: 'Garms', d: 'Drip' };

  // the product. Abstract trading goods: buy from the plug, sell out in the sticks.
  QQ.PRODUCTS = {
    bud: { name: 'Bud', icon: 'bud', base: 10 },
    light: { name: 'Light', icon: 'light', base: 28 },
    dark: { name: 'Dark', icon: 'dark', base: 42 }
  };
  QQ.BAGS = [{ cap: 12, name: 'Pockets' }, { cap: 24, name: 'Rucksack', price: 240, icon: 'backpack' }, { cap: 40, name: 'Duffel Bag', price: 760, icon: 'duffel' }];

  QQ.TOWNS = {
    ends: { name: 'The Ends', full: 'Crestwell Estate, South London', map: 'ends', at: [29, 5], fare: 0, mult: { bud: 1.25, light: 1.3, dark: 1.3 }, bg: 'ends' },
    grim: { name: 'Grimsworth', full: 'Grimsworth, the North', map: 'grim', at: [6, 5], fare: 18, mult: { bud: 1.7, light: 2.1, dark: 2.3 }, bg: 'grim' },
    dreg: { name: 'Dregthorpe', full: 'Dregthorpe-on-Sea', map: 'dreg', at: [6, 5], fare: 24, mult: { bud: 2.3, light: 1.8, dark: 1.7 }, bg: 'sea', flag: 'town_dreg' },
    pid: { name: 'Piddlebrook', full: 'Lower Piddlebrook', map: 'pid', at: [6, 6], fare: 30, mult: { bud: 1.5, light: 2.8, dark: 1.5 }, bg: 'village', flag: 'town_pid' },
    quay: { name: 'Blackwater Quay', full: 'Blackwater Quay', map: 'quay', at: [4, 6], fare: 36, mult: { bud: 1.4, light: 1.6, dark: 2.6 }, bg: 'quay', flag: 'town_quay' }
  };

  // ---------------------------------------------------------------- enemies
  // mob(level, tweaks) derives stats from an expected party level.
  const mob = (L, o) => Object.assign({
    hp: Math.round((18 + 9 * L) * (o.hpx || 1)), atk: Math.round((6 + 2.3 * L) * (o.atkx || 1)), def: Math.round((3 + 1.5 * L) * (o.defx || 1)),
    spd: Math.round((5 + 1.1 * L) * (o.spdx || 1)), lck: 4 + L, xp: Math.round((6 + 5 * L) * (o.xpx || 1)), p: Math.round((4 + 3 * L) * (o.px || 1)), lv: L
  }, o);
  QQ.mob = mob;
  QQ.ENEMIES = {
    // the ends
    pigeon: mob(1, { name: 'Pigeon', sprite: 'pigeon', hpx: 0.7, acts: [['attack', 3], ['peck', 3]] }),
    staffy: mob(2, { name: 'Staffy', sprite: 'bulldog', atkx: 1.1, acts: [['bite', 4], ['lockjaw', 2]] }),
    agent: mob(2, { name: 'Estate Agent', sprite: 'agent', px: 2.2, acts: [['attack', 3], ['adminfee', 3], ['sharedown', 2]] }),
    influencer: mob(2, { name: 'Influencer', sprite: 'influencer', hpx: 0.9, acts: [['attack', 3], ['ringlight', 2]] }),
    barista: mob(3, { name: 'Artisan Barista', sprite: 'barista', acts: [['attack', 3], ['oatlatte', 3]] }),
    opp: mob(3, { name: 'Opp', sprite: 'opp_blue', atkx: 1.1, acts: [['attack', 4], ['screwface', 2], ['headbutt', 1]] }),
    opp2: mob(4, { name: 'Elder Opp', sprite: 'opp_red', atkx: 1.15, hpx: 1.2, acts: [['attack', 4], ['headbutt', 2], ['bottle', 1]] }),
    // grimsworth
    rat: mob(2, { name: 'Canal Rat', sprite: 'rat', hpx: 0.75, spdx: 1.3, acts: [['attack', 3], ['gnaw', 3]] }),
    fox: mob(3, { name: 'Bin Fox', sprite: 'fox', spdx: 1.3, acts: [['bite', 3], ['rummage', 2]] }),
    nitty: mob(3, { name: 'Feral Nitty', sprite: 'nitty1', acts: [['attack', 3], ['beg', 2], ['frenzy', 2]] }),
    hardman: mob(4, { name: 'Pub Hard Man', sprite: 'boxer', hpx: 1.25, atkx: 1.1, acts: [['attack', 3], ['headbutt', 2], ['bottle', 2], ['downit', 1]] }),
    bailiff: mob(5, { name: 'Bailiff', sprite: 'henchman2', defx: 1.2, px: 1.6, acts: [['attack', 3], ['adminfee', 2], ['briefcase', 2]] }),
    // dregthorpe
    seagull: mob(5, { name: 'Seagull', sprite: 'seagull', hpx: 0.8, spdx: 1.4, acts: [['peck', 3], ['snatch', 3]] }),
    crab: mob(6, { name: 'Pier Crab', sprite: 'crab', defx: 1.5, hpx: 0.9, acts: [['attack', 2], ['pinch', 4]] }),
    staglad: mob(6, { name: 'Stag-Do Lad', sprite: 'man', hpx: 1.15, acts: [['attack', 3], ['lads', 2], ['downit', 2], ['headbutt', 1]] }),
    bandit: mob(7, { name: 'One-Armed Bandit', sprite: 'bandit', defx: 1.3, px: 2.5, acts: [['attack', 2], ['coinspray', 3]] }),
    fisherman: mob(7, { name: 'Salty Fisherman', sprite: 'fisherman', hpx: 1.2, acts: [['attack', 3], ['reel', 3]] }),
    // piddlebrook
    goose: mob(8, { name: 'Goose', sprite: 'goose', atkx: 1.2, spdx: 1.3, hpx: 0.85, acts: [['bite', 3], ['honk', 3]] }),
    farmer: mob(9, { name: 'Farmer', sprite: 'farmer', hpx: 1.2, acts: [['pitchfork', 4], ['getorf', 2]] }),
    scarecrow: mob(9, { name: 'Scarecrow', sprite: 'scarecrow', defx: 1.2, acts: [['attack', 3], ['stare', 2]] }),
    tractor: mob(10, { name: 'Rogue Tractor', sprite: 'tractor', hpx: 1.5, defx: 1.4, spdx: 0.6, acts: [['trample', 3], ['attack', 2]] }),
    poshboy: mob(10, { name: 'Posh Boy', sprite: 'noble', px: 3, acts: [['attack', 3], ['daddy', 2], ['downit', 1]] }),
    jeeves: mob(10, { name: 'Under-Butler', sprite: 'butler', acts: [['tray', 3], ['servetea', 2]] }),
    // the quay
    secguard: mob(11, { name: 'Security Guard', sprite: 'guard', hpx: 1.15, acts: [['baton', 4], ['cuff', 2]] }),
    guarddog: mob(11, { name: 'Guard Dog', sprite: 'gshep', spdx: 1.4, atkx: 1.1, hpx: 0.9, acts: [['bite', 4], ['lockjaw', 2]] }),
    drone: mob(12, { name: 'Wrong Drone', sprite: 'drone', hpx: 0.8, spdx: 1.5, acts: [['zap', 4], ['scan', 2]] }),
    docker: mob(12, { name: 'Bent Docker', sprite: 'docker', hpx: 1.3, acts: [['hook', 4], ['attack', 2]] }),
    associate: mob(13, { name: 'Wrong Associate', sprite: 'henchman', px: 2, acts: [['briefcase', 3], ['nda', 2], ['attack', 2]] }),
    // feds
    fed: mob(4, { name: 'Fed', sprite: 'police', hpx: 1.3, defx: 1.2, acts: [['baton', 3], ['cuff', 2]] }),
    fed2: mob(4, { name: 'Fed', sprite: 'police2', hpx: 1.3, defx: 1.2, acts: [['baton', 3], ['cuff', 2]] }),
    // bosses
    b_agent: mob(1, { name: 'Tarquin (Sales)', sprite: 'officeworker', hpx: 1.6, px: 4, xpx: 2, acts: [['attack', 3], ['adminfee', 2], ['sharedown', 1]] }),
    b_baz: mob(5, { name: 'Mad Baz', sprite: 'hardman', boss: 1, hpx: 4.6, atkx: 1.15, xpx: 6, px: 8, acts: [['attack', 3], ['barstool', 3], ['lastorders', 2], ['downit', 1]] }),
    b_gull: mob(6, { name: 'Steven Seagull', sprite: 'seagull', boss: 1, hpx: 3.6, atkx: 1.1, spdx: 1.3, xpx: 4, px: 3, acts: [['peck', 3], ['snatch', 2], ['bite', 2]] }),
    b_kev: mob(8, { name: 'Admiral Kev', sprite: 'admiral', boss: 1, hpx: 4.8, atkx: 1.12, xpx: 6, px: 9, acts: [['attack', 2], ['cannon', 3], ['tokenstorm', 3], ['rigged', 1]] }),
    b_tractor: mob(10, { name: 'Farmer Giles\' Combine', sprite: 'tractor', boss: 1, hpx: 4.2, defx: 1.3, spdx: 0.7, xpx: 4, px: 3, acts: [['trample', 3], ['crush', 2], ['rev', 1]] }),
    b_lady: mob(11, { name: 'Lady Hedgefund', sprite: 'lady', boss: 1, hpx: 4.6, atkx: 1.1, xpx: 6, px: 12, acts: [['crop', 3], ['hounds', 2], ['tutting', 1], ['offshore', 1]] }),
    b_captain: mob(12, { name: 'Gate Captain', sprite: 'guard', boss: 1, hpx: 3.2, xpx: 3, px: 4, acts: [['baton', 3], ['cuff', 2], ['attack', 2]] }),
    b_dozer: mob(13, { name: 'The Regenerator 9000', sprite: 'bulldozer', boss: 1, hpx: 5.4, defx: 1.3, spdx: 0.7, xpx: 6, px: 6, acts: [['crush', 3], ['demolish', 3], ['rev', 1]] }),
    b_pulon: mob(14, { name: 'Pulon Wrong', sprite: 'pulon', boss: 1, hpx: 4.4, atkx: 1.05, xpx: 5, px: 20, acts: [['purchase', 3], ['renthike', 3], ['synergy', 1], ['attack', 2]] }),
    b_pulon2: mob(15, { name: 'Pulon the Wrong \'Un', sprite: 'pulon2', boss: 1, hpx: 5.4, atkx: 1.08, spdx: 1.1, xpx: 0, px: 0, turns: 2, acts: [['nova', 3], ['soultax', 3], ['gentrify', 1], ['luxflats', 2]] })
  };
  // random encounter tables: [weight, [enemy ids]]
  QQ.ZONES = {
    ends: [[3, ['pigeon', 'pigeon']], [3, ['agent']], [2, ['influencer', 'pigeon']], [2, ['staffy']], [2, ['agent', 'influencer']], [1, ['barista', 'agent']]],
    ends_alley: [[3, ['opp']], [2, ['opp', 'staffy']], [2, ['opp', 'opp']], [1, ['opp2', 'opp']]],
    grim: [[3, ['rat', 'rat']], [3, ['fox']], [2, ['nitty', 'rat']], [2, ['hardman']], [2, ['fox', 'rat']], [1, ['nitty', 'nitty']]],
    grim_canal: [[3, ['rat', 'rat', 'rat']], [2, ['nitty', 'fox']], [2, ['hardman', 'hardman']], [2, ['bailiff']], [1, ['bailiff', 'hardman']]],
    dreg: [[3, ['seagull', 'seagull']], [3, ['crab', 'crab']], [2, ['staglad', 'staglad']], [2, ['seagull', 'crab']], [1, ['fisherman']], [1, ['staglad', 'seagull', 'seagull']]],
    dreg_arcade: [[3, ['bandit']], [3, ['bandit', 'staglad']], [2, ['bandit', 'bandit']], [1, ['fisherman', 'bandit']]],
    pid: [[3, ['goose', 'goose']], [3, ['farmer']], [2, ['scarecrow', 'goose']], [2, ['farmer', 'goose']], [1, ['tractor']], [1, ['poshboy', 'poshboy']]],
    pid_manor: [[3, ['jeeves', 'poshboy']], [2, ['jeeves', 'jeeves']], [2, ['poshboy', 'goose']], [1, ['poshboy', 'poshboy', 'jeeves']]],
    quay: [[3, ['secguard', 'guarddog']], [3, ['drone', 'drone']], [2, ['docker', 'docker']], [2, ['associate', 'drone']], [2, ['secguard', 'secguard']], [1, ['associate', 'associate', 'guarddog']]]
  };

  // ---------------------------------------------------------------- shops
  QQ.SHOPS = {
    corner: { name: 'Bossman\'s Corner Shop', stock: ['crisps', 'potnoodle', 'chocolate', 'energy', 'tea', 'pills'] },
    wingz: { name: 'Wingz & Tingz', stock: ['chicken', 'chips', 'energy'] },
    garms: { name: 'Creps & Garms', stock: ['bag2', 'cap', 'tracksuit', 'tracksuit_r', 'bally', 'trainers', 'puffer', 'trainers_w', 'chain'] },
    griggs: { name: 'Griggs the Bakers', stock: ['sausageroll', 'pie', 'tea', 'coffee'] },
    market: { name: 'Dodgy Dave\'s Stall', stock: ['bag1', 'pan', 'rollingpin', 'cricketbat', 'tracksuit', 'buckethat', 'pills', 'medkit'] },
    ferret: { name: 'The Rusty Ferret', stock: ['pint', 'crisps', 'pie'] },
    ices: { name: 'Mr Drippy', stock: ['icecream', 'energy', 'chocolate'] },
    chippy: { name: 'The Codfather', stock: ['chips', 'pie', 'icecream', 'energy'] },
    prizes: { name: 'Fun Palace Prize Counter', stock: ['shades', 'trainers', 'bat', 'puffer', 'medkit'] },
    farmshop: { name: 'Piddlebrook Farm Shop', stock: ['scone', 'tea', 'pie', 'coffee', 'champagne', 'medkit'] },
    outfitters: { name: 'Country Casuals', stock: ['brolly', 'golfclub', 'puffer_w', 'watch'] },
    van: { name: 'Back of a Van', stock: ['kebab', 'coffee', 'medkit', 'dlock', 'crowbar', 'vest', 'chain'] }
  };

  // ---------------------------------------------------------------- music (16th-note step patterns)
  QQ.SONGS = {
    title: { bpm: 100, tracks: [
      { wave: 'triangle', vol: 0.09, notes: 'E3 - B3 - E4 - B3 - G3 - D4 - G4 - D4 - A3 - E4 - A4 - E4 - B3 - F#4 - B4 - F#4 -' },
      { wave: 'square', vol: 0.035, notes: '. . . . B4 - - - . . . . D5 - - - . . . . C5 - - - . . B4 - A4 - F#4 -' },
      { wave: 'sine', vol: 0.12, notes: 'E2 - - - - - - - G2 - - - - - - - A2 - - - - - - - B2 - - - - - - -' }] },
    ends: { bpm: 140, tracks: [
      { wave: 'square', vol: 0.04, gate: 0.5, notes: 'E4 . . E4 . . G4 . F#4 . . E4 . . B3 . E4 . . E4 . . G4 . A4 . G4 . F#4 . D4 .' },
      { wave: 'sawtooth', vol: 0.06, notes: 'E2 - . . . . E2 . . . G2 - . . D2 . E2 - . . . . E2 . . . C2 - . . D2 -' },
      { drum: 1, vol: 0.07, notes: 'k . . h . . k . s . h . . k . h k . . h . k . . s . h . k . h h' }] },
    grim: { bpm: 92, tracks: [
      { wave: 'triangle', vol: 0.09, notes: 'A3 - C4 - E4 - - - D4 - C4 - A3 - - - G3 - A3 - C4 - - - D4 - E4 - D4 - C4 -' },
      { wave: 'sine', vol: 0.11, notes: 'A2 - - - - - E2 - F2 - - - - - C2 - G2 - - - - - D2 - E2 - - - - - - -' },
      { drum: 1, vol: 0.04, notes: 'k . . . h . . . s . . . h . . . k . . . h . k . s . . . h . . .' }] },
    sea: { bpm: 124, tracks: [
      { wave: 'square', vol: 0.04, gate: 0.6, notes: 'C4 E4 G4 E4 C5 . G4 . A4 . F4 . G4 - - . D4 F4 A4 F4 D5 . A4 . G4 . E4 . C4 - - .' },
      { wave: 'triangle', vol: 0.09, notes: 'C3 . G3 . C3 . G3 . F3 . C4 . G3 . D3 . D3 . A3 . D3 . A3 . G3 . D3 . C3 . G3 .' },
      { drum: 1, vol: 0.05, notes: 'k . h . s . h . k . h . s . h h' }] },
    village: { bpm: 104, tracks: [
      { wave: 'triangle', vol: 0.09, notes: 'G4 - B4 - D5 - B4 - C5 - A4 - B4 - - - G4 - A4 - B4 - G4 - A4 - F#4 - G4 - - -' },
      { wave: 'sine', vol: 0.1, notes: 'G2 - - - D3 - - - C3 - - - G2 - - - E3 - - - B2 - - - D3 - - - G2 - - -' },
      { wave: 'square', vol: 0.02, gate: 0.4, notes: '. . D4 . . . D4 . . . E4 . . . D4 . . . B3 . . . B3 . . . A3 . . . B3 .' }] },
    quay: { bpm: 128, tracks: [
      { wave: 'sawtooth', vol: 0.05, gate: 0.5, notes: 'D2 D2 . D2 . D2 F2 . D2 D2 . D2 . C2 . C2 D2 D2 . D2 . D2 G2 . F2 F2 . F2 . C2 . C2' },
      { wave: 'square', vol: 0.03, gate: 0.4, notes: '. . . . A4 . . . . . . . G4 . F4 . . . . . A4 . . . . . C5 . A4 . G4 .' },
      { drum: 1, vol: 0.06, notes: 'k . h . . . h . k . h . s . h . k . h . . k h . k . h . s . h h' }] },
    shed: { bpm: 72, tracks: [
      { wave: 'sine', vol: 0.1, notes: 'E4 - G#4 - B4 - D#5 - B4 - G#4 - E4 - - - C#4 - E4 - G#4 - B4 - G#4 - E4 - C#4 - - -' },
      { wave: 'sine', vol: 0.1, notes: 'E2 - - - - - - - - - - - - - - - C#2 - - - - - - - - - - - - - - -' }] },
    indoor: { bpm: 96, tracks: [
      { wave: 'triangle', vol: 0.07, notes: 'C4 . E4 . G4 . E4 . A3 . C4 . E4 . C4 . F3 . A3 . C4 . A3 . G3 . B3 . D4 . B3 .' },
      { wave: 'sine', vol: 0.09, notes: 'C2 - - - - - - - A2 - - - - - - - F2 - - - - - - - G2 - - - - - - -' }] },
    battle: { bpm: 164, tracks: [
      { wave: 'sawtooth', vol: 0.05, gate: 0.5, notes: 'A2 A2 C3 A2 E3 A2 C3 A2 A2 A2 C3 A2 E3 A2 G3 E3 F2 F2 A2 F2 C3 F2 A2 F2 G2 G2 B2 G2 D3 G2 B2 D3' },
      { wave: 'square', vol: 0.04, gate: 0.6, notes: 'A4 - . C5 . E5 - . D5 . C5 . A4 . G4 . A4 - . C5 . F5 - . E5 . D5 . B4 . G4 .' },
      { drum: 1, vol: 0.07, notes: 'k . h . s . h k k . h . s . h h' }] },
    boss: { bpm: 150, tracks: [
      { wave: 'sawtooth', vol: 0.06, gate: 0.5, notes: 'E2 E2 . E2 G2 . E2 . A#2 . A2 . G2 . E2 . E2 E2 . E2 G2 . E2 . B2 . A#2 . A2 . G2 .' },
      { wave: 'square', vol: 0.04, gate: 0.7, notes: 'E4 - - - . . G4 - A#4 - A4 - G4 - E4 - B4 - - - . . A#4 - A4 - G4 - E4 - D4 -' },
      { wave: 'square', vol: 0.02, gate: 0.3, notes: 'E5 B4 E5 B4 E5 B4 E5 B4 G5 B4 G5 B4 G5 B4 G5 B4' },
      { drum: 1, vol: 0.08, notes: 'k . h k s . h . k k h . s . h h' }] },
    ending: { bpm: 96, tracks: [
      { wave: 'triangle', vol: 0.1, notes: 'C4 - E4 - G4 - C5 - B4 - G4 - E4 - - - A3 - C4 - E4 - A4 - G4 - E4 - D4 - - -' },
      { wave: 'sine', vol: 0.11, notes: 'C2 - - - - - - - G2 - - - - - - - A2 - - - - - - - G2 - - - - - - -' },
      { wave: 'square', vol: 0.02, gate: 0.5, notes: '. . G4 . . . G4 . . . D4 . . . D4 . . . E4 . . . E4 . . . B3 . . . B3 .' }] }
  };
})();

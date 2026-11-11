// Procedural 16x16 ground / wall / roof textures and battle backdrops.
// Everything that is an object, character, item or icon comes from the sprite atlas;
// only seamless terrain is generated here because single-sprite datasets have no tiling ground.
(function () {
  'use strict';
  const QQ = window.QQ;
  const tiles = {};
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

  function make(seed, fn, w, h) {
    const c = document.createElement('canvas');
    c.width = w || 16; c.height = h || 16;
    const x = c.getContext('2d'), r = QQ.seeded(seed);
    const f = (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(px, py, pw, ph); };
    fn(f, r, x);
    return c;
  }
  function def(name, n, fn) {
    tiles[name] = [];
    for (let v = 0; v < n; v++) tiles[name].push(make(hash(name) + v * 977, (f, r, x) => fn(f, r, v, x)));
  }
  const speck = (f, r, cols, n) => { for (let i = 0; i < n; i++) f((r() * 16) | 0, (r() * 16) | 0, 1, 1, cols[(r() * cols.length) | 0]); };
  const bricks = (f, r, base, mortar, hi) => {
    f(0, 0, 16, 16, base);
    for (let y = 3; y < 16; y += 4) f(0, y, 16, 1, mortar);
    for (let row = 0; row < 4; row++) for (let x = (row % 2) * 4; x < 16; x += 8) f(x, row * 4, 1, 3, mortar);
    speck(f, r, [hi], 7);
  };

  // --- ground
  def('grass', 3, (f, r) => { f(0, 0, 16, 16, '#3d7f3b'); speck(f, r, ['#357235', '#4a9146', '#458a40'], 30); for (let i = 0; i < 2; i++) { const x = (r() * 14) | 0, y = 2 + ((r() * 12) | 0); f(x, y, 1, 2, '#58a34e'); f(x + 1, y + 1, 1, 1, '#2c632f'); } });
  def('grass2', 3, (f, r) => { f(0, 0, 16, 16, '#2f6a35'); speck(f, r, ['#285d2f', '#3a7a3e'], 30); });
  def('tall', 2, (f, r) => { f(0, 0, 16, 16, '#347436'); for (let i = 0; i < 16; i++) { const x = (r() * 16) | 0, y = (r() * 13) | 0; f(x, y, 1, 3, '#63b254'); f((x + 1) % 16, y + 1, 1, 2, '#27592b'); } });
  def('flowers', 2, (f, r) => { f(0, 0, 16, 16, '#3d7f3b'); speck(f, r, ['#357235', '#4a9146'], 24); for (let i = 0; i < 4; i++) { const x = 1 + ((r() * 13) | 0), y = 1 + ((r() * 13) | 0); f(x, y, 2, 2, ['#ffd23f', '#f4ecd8', '#ff8fb5', '#c59bff'][(r() * 4) | 0]); f(x, y + 2, 1, 1, '#2c632f'); } });
  def('road', 3, (f, r) => { f(0, 0, 16, 16, '#3b3a45'); speck(f, r, ['#34333d', '#45444f', '#40404a'], 24); });
  def('road_h', 1, (f, r) => { f(0, 0, 16, 16, '#3b3a45'); speck(f, r, ['#34333d', '#45444f'], 20); f(3, 7, 10, 2, '#d8d4c4'); });
  def('road_v', 1, (f, r) => { f(0, 0, 16, 16, '#3b3a45'); speck(f, r, ['#34333d', '#45444f'], 20); f(7, 3, 2, 10, '#d8d4c4'); });
  def('zebra', 1, (f, r) => { f(0, 0, 16, 16, '#3b3a45'); for (let x = 1; x < 16; x += 5) f(x, 0, 3, 16, '#e4e0d0'); });
  def('pave', 2, (f, r) => { f(0, 0, 16, 16, '#8f8c96'); f(0, 0, 16, 1, '#7a7783'); f(0, 8, 16, 1, '#7a7783'); f(0, 0, 1, 8, '#7a7783'); f(8, 8, 1, 8, '#7a7783'); speck(f, r, ['#9c99a3', '#858290'], 12); });
  def('dirt', 2, (f, r) => { f(0, 0, 16, 16, '#7a5a3a'); speck(f, r, ['#6b4d30', '#8a6844', '#5f452b'], 28); });
  def('mud', 2, (f, r) => { f(0, 0, 16, 16, '#5c4630'); speck(f, r, ['#4e3a27', '#6a5238'], 26); });
  def('sand', 2, (f, r) => { f(0, 0, 16, 16, '#dcc98e'); speck(f, r, ['#cdb97c', '#e8d8a3', '#c9b274'], 22); });
  def('water', 2, (f, r, v) => { f(0, 0, 16, 16, '#2d6aa8'); for (let i = 0; i < 5; i++) { const x = (((r() * 12) | 0) + v * 3) % 13, y = 1 + i * 3; f(x, y, 3, 1, '#5a9bd4'); f((x + 6) % 14, y + 1, 2, 1, '#255a92'); } });
  def('sea', 2, (f, r, v) => { f(0, 0, 16, 16, '#24558c'); for (let i = 0; i < 4; i++) { const x = (((r() * 12) | 0) + v * 4) % 13, y = 2 + i * 4; f(x, y, 4, 1, '#3f7dbb'); } });
  def('wood', 1, (f, r) => { f(0, 0, 16, 16, '#8a5a34'); for (let y = 3; y < 16; y += 4) f(0, y, 16, 1, '#6e4526'); f(5, 0, 1, 3, '#6e4526'); f(11, 4, 1, 3, '#6e4526'); f(3, 8, 1, 3, '#6e4526'); f(13, 12, 1, 3, '#6e4526'); speck(f, r, ['#96663d'], 10); });
  def('lino', 1, (f) => { f(0, 0, 16, 16, '#e9e2cc'); f(0, 0, 8, 8, '#c8434c'); f(8, 8, 8, 8, '#c8434c'); });
  def('checker', 1, (f) => { f(0, 0, 16, 16, '#e3ded2'); f(0, 0, 8, 8, '#2c2a36'); f(8, 8, 8, 8, '#2c2a36'); });
  def('carpet', 1, (f, r) => { f(0, 0, 16, 16, '#6b2d3e'); for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 1 : 3); x < 16; x += 4) f(x, y, 1, 1, '#93475c'); });
  def('carpet_g', 1, (f, r) => { f(0, 0, 16, 16, '#2f5a44'); for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 1 : 3); x < 16; x += 4) f(x, y, 1, 1, '#447a5e'); });
  def('carpet_n', 1, (f, r) => { f(0, 0, 16, 16, '#2b2350'); for (let i = 0; i < 6; i++) f((r() * 15) | 0, (r() * 15) | 0, 2, 1, ['#ff5db1', '#5de4ff', '#ffd23f'][(r() * 3) | 0]); });
  def('concrete', 2, (f, r) => { f(0, 0, 16, 16, '#6f6d78'); speck(f, r, ['#666470', '#7a7884'], 22); f(0, 15, 16, 1, '#5d5b66'); });
  def('dock', 1, (f, r) => { f(0, 0, 16, 16, '#7b5b3d'); for (let x = 3; x < 16; x += 4) f(x, 0, 1, 16, '#5d4329'); speck(f, r, ['#8a6947'], 10); });
  def('cobble', 2, (f, r) => { f(0, 0, 16, 16, '#57535f'); for (let y = 0; y < 16; y += 4) for (let x = ((y / 4) % 2) * 2 - 2; x < 16; x += 4) f(x + 1, y + 1, 3, 3, r() < 0.5 ? '#7d7985' : '#716d7a'); });
  def('rail', 1, (f, r) => { f(0, 0, 16, 16, '#4f4b56'); speck(f, r, ['#5d5964', '#433f4a'], 26); for (let x = 1; x < 16; x += 4) f(x, 2, 2, 12, '#5e4630'); f(0, 4, 16, 1, '#b9b6c2'); f(0, 11, 16, 1, '#b9b6c2'); });
  def('field', 1, (f, r) => { f(0, 0, 16, 16, '#6e5632'); for (let y = 2; y < 16; y += 4) { f(0, y, 16, 1, '#5a4527'); for (let x = 1; x < 16; x += 3) f(x, y - 1, 1, 1, '#8fbf4a'); } });
  def('platform', 1, (f, r) => { f(0, 0, 16, 16, '#8f8c96'); speck(f, r, ['#9c99a3', '#858290'], 12); f(0, 12, 16, 2, '#ffd23f'); f(0, 14, 16, 2, '#6f6d78'); });
  def('void', 1, (f) => f(0, 0, 16, 16, '#0b0912'));
  // --- walls (front faces)
  def('w_red', 2, (f, r) => bricks(f, r, '#9a4a3a', '#6f3329', '#ab5a48'));
  def('w_yellow', 2, (f, r) => bricks(f, r, '#b89a5e', '#8c7343', '#c9ac70'));
  def('w_stone', 2, (f, r) => { f(0, 0, 16, 16, '#cdb47a'); f(0, 7, 16, 1, '#a68d58'); f(0, 15, 16, 1, '#a68d58'); f(5, 0, 1, 7, '#a68d58'); f(12, 8, 1, 7, '#a68d58'); speck(f, r, ['#d9c18a', '#bfa66c'], 12); });
  def('w_conc', 2, (f, r) => { f(0, 0, 16, 16, '#8d8a96'); f(0, 0, 16, 1, '#75727e'); f(0, 0, 1, 16, '#75727e'); speck(f, r, ['#84818d', '#96939f'], 14); f(4 + ((r() * 8) | 0), 1, 1, 6, '#7c7985'); });
  def('w_metal', 1, (f) => { for (let x = 0; x < 16; x += 4) { f(x, 0, 2, 16, '#62758b'); f(x + 2, 0, 2, 16, '#4d5d70'); } f(0, 0, 16, 1, '#3d4a5a'); });
  def('w_white', 2, (f, r) => { f(0, 0, 16, 16, '#e6e2d6'); speck(f, r, ['#d6d1c2', '#efece2'], 14); f(0, 15, 16, 1, '#bdb8a8'); });
  def('w_int', 1, (f) => { f(0, 0, 16, 16, '#b9a98c'); for (let x = 1; x < 16; x += 4) f(x, 0, 1, 13, '#a8977a'); f(0, 12, 16, 4, '#5d4329'); f(0, 12, 16, 1, '#7b5b3d'); });
  def('w_int2', 1, (f, r) => { f(0, 0, 16, 16, '#5a2f3a'); for (let y = 1; y < 12; y += 4) for (let x = (y % 8 === 1 ? 2 : 6); x < 16; x += 8) { f(x, y, 1, 3, '#7d4553'); f(x - 1, y + 1, 3, 1, '#7d4553'); } f(0, 12, 16, 4, '#3a2416'); f(0, 12, 16, 1, '#c9a24a'); });
  def('w_tile', 1, (f) => { f(0, 0, 16, 16, '#dfe7ea'); for (let i = 0; i < 16; i += 4) { f(i, 0, 1, 16, '#b7c4ca'); f(0, i, 16, 1, '#b7c4ca'); } f(0, 12, 16, 4, '#c8434c'); });
  def('w_neon', 1, (f, r) => { f(0, 0, 16, 16, '#231a44'); f(0, 3, 16, 1, '#ff5db1'); f(0, 9, 16, 1, '#5de4ff'); f(0, 12, 16, 4, '#150f2b'); });
  def('w_hoard', 1, (f) => { f(0, 0, 16, 16, '#1f4fa8'); f(0, 0, 16, 2, '#e9e2cc'); f(0, 14, 16, 2, '#163a7d'); [[3, 5], [4, 7], [5, 9], [6, 7], [7, 5], [8, 7], [9, 9], [10, 7], [11, 5]].forEach(([x, y]) => f(x, y, 2, 2, '#ffd23f')); });
  def('w_dark', 1, (f, r) => { f(0, 0, 16, 16, '#2a2733'); speck(f, r, ['#322f3c', '#23212b'], 14); });
  def('w_glass', 1, (f) => { f(0, 0, 16, 16, '#3d6f8f'); f(0, 0, 16, 1, '#1f3d52'); f(0, 0, 1, 16, '#1f3d52'); f(3, 3, 1, 4, '#8fc3dd'); f(4, 2, 1, 3, '#8fc3dd'); f(10, 9, 1, 4, '#5b93b3'); });
  // --- roofs
  const shingle = (f, base, line) => { f(0, 0, 16, 16, base); for (let y = 3; y < 16; y += 4) f(0, y, 16, 1, line); for (let row = 0; row < 4; row++) for (let x = (row % 2) * 3; x < 16; x += 6) f(x, row * 4, 1, 3, line); };
  def('r_slate', 1, (f) => shingle(f, '#3d4152', '#2d303d'));
  def('r_red', 1, (f) => shingle(f, '#a3523a', '#7d3b28'));
  def('r_flat', 1, (f, r) => { f(0, 0, 16, 16, '#2e2c36'); speck(f, r, ['#363440', '#27252e'], 16); });
  def('r_thatch', 1, (f, r) => { f(0, 0, 16, 16, '#b99a4e'); for (let i = 0; i < 20; i++) f((r() * 16) | 0, (r() * 14) | 0, 1, 3, r() < 0.5 ? '#9a7d38' : '#cdb062'); });
  def('r_metal', 1, (f) => { for (let y = 0; y < 16; y += 4) { f(0, y, 16, 2, '#6d7f93'); f(0, y + 2, 16, 2, '#5a6b7e'); } });

  QQ.tiles = {
    get(name, x, y, t) {
      const v = tiles[name] || tiles.void;
      if (name === 'water' || name === 'sea') return v[((t >> 5) + x + y) % 2];
      return v[v.length === 1 ? 0 : ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % v.length];
    },
    has: (name) => !!tiles[name]
  };

  // ---------------------------------------------------------------- battle backdrops (320 x 150)
  const bgs = {};
  const BG = {
    ends: { sky: ['#2a1f4e', '#4a2a66', '#8a3f6b', '#d8704f', '#f2b05a'], ground: 'pave', sil: 'towers' },
    grim: { sky: ['#4a5060', '#5c6373', '#737a88', '#8c929c', '#a3a7ad'], ground: 'cobble', sil: 'terraces' },
    sea: { sky: ['#3f8fd6', '#5aa6e0', '#7fbfea', '#a8d6f2', '#d2ebf7'], ground: 'sand', sil: 'sea' },
    village: { sky: ['#4f9fe0', '#6fb3e8', '#93c8ef', '#b9dcf5', '#dff0fa'], ground: 'grass', sil: 'hills' },
    quay: { sky: ['#0d1026', '#141a38', '#1d2648', '#2a3458', '#3a4468'], ground: 'concrete', sil: 'cranes' },
    indoor: { sky: ['#3a2c24', '#3a2c24', '#4a382c', '#4a382c', '#5a4636'], ground: 'wood', sil: 'room' },
    arcade: { sky: ['#1a1238', '#231a48', '#2c2058', '#231a48', '#1a1238'], ground: 'carpet_n', sil: 'neon' },
    manor: { sky: ['#4a2530', '#5a2f3a', '#5a2f3a', '#6a3945', '#6a3945'], ground: 'checker', sil: 'manor' }
  };
  QQ.tiles.battleBg = function (kind) {
    if (bgs[kind]) return bgs[kind];
    const d = BG[kind] || BG.ends;
    return (bgs[kind] = make(hash('bg' + kind), (f, r, x) => {
      const HZ = 92;
      d.sky.forEach((c, i) => f(0, Math.round(i * HZ / 5), 320, Math.ceil(HZ / 5) + 1, c));
      const lit = () => (r() < 0.35 ? '#ffd23f' : '#1a1630');
      if (d.sil === 'towers') {
        for (let i = 0; i < 9; i++) {
          const w = 22 + ((r() * 20) | 0), h = 30 + ((r() * 55) | 0), bx = i * 38 - 8 + ((r() * 10) | 0);
          f(bx, HZ - h, w, h, '#1d1836');
          for (let wy = HZ - h + 4; wy < HZ - 4; wy += 6) for (let wx = bx + 3; wx < bx + w - 3; wx += 5) f(wx, wy, 2, 3, lit());
        }
        f(250, 8, 3, HZ - 8, '#120f24'); f(236, 8, 40, 3, '#120f24'); f(240, 11, 1, 10, '#120f24');   // Wrong's crane
      } else if (d.sil === 'terraces') {
        f(40, 20, 10, 72, '#3a3f4c'); f(38, 16, 14, 5, '#3a3f4c');                                    // mill chimney
        for (let i = 0; i < 12; i++) { const bx = i * 28 - 6; f(bx, 62, 27, 30, '#4a3a3a'); f(bx, 56, 27, 7, '#2f3340'); f(bx + 18, 48, 5, 9, '#3a2c2c'); f(bx + 5, 70, 5, 6, lit()); f(bx + 16, 70, 5, 6, lit()); f(bx + 11, 80, 5, 12, '#2a2222'); }
      } else if (d.sil === 'sea') {
        f(0, 70, 320, 22, '#2d6aa8'); for (let i = 0; i < 40; i++) f((r() * 320) | 0, 71 + ((r() * 20) | 0), 6, 1, '#5a9bd4');
        f(200, 62, 120, 4, '#5d4329'); for (let i = 0; i < 8; i++) f(204 + i * 15, 66, 2, 26, '#4a3520');
        f(60, 18, 26, 8, '#f4ecd8'); f(68, 14, 22, 6, '#f4ecd8'); f(170, 30, 20, 6, '#f4ecd8');
      } else if (d.sil === 'hills') {
        for (let i = 0; i < 320; i++) { const h = 20 + Math.sin(i / 40) * 10 + Math.sin(i / 17 + 2) * 5; f(i, HZ - h, 1, h, '#4f9a4a'); }
        for (let i = 0; i < 320; i++) { const h = 10 + Math.sin(i / 25 + 1) * 6; f(i, HZ - h, 1, h, '#3d7f3b'); }
        f(230, 52, 14, 28, '#cdb47a'); f(234, 36, 6, 16, '#cdb47a'); f(236, 28, 2, 8, '#3d4152'); f(80, 20, 30, 7, '#fff'); f(90, 16, 24, 6, '#fff');
      } else if (d.sil === 'cranes') {
        for (let i = 0; i < 60; i++) f((r() * 320) | 0, (r() * 60) | 0, 1, 1, '#c8d0ff');
        for (let i = 0; i < 3; i++) { const bx = 30 + i * 110; f(bx, 20, 4, 72, '#0a0c1c'); f(bx - 20, 20, 70, 4, '#0a0c1c'); f(bx + 44, 24, 1, 22, '#0a0c1c'); f(bx + 40, 46, 9, 6, '#0a0c1c'); }
        for (let i = 0; i < 14; i++) { const bx = i * 24 - 4; for (let k = 0; k < 1 + ((r() * 3) | 0); k++) f(bx, 82 - k * 10, 23, 10, ['#7d3b28', '#1f4fa8', '#b0652a', '#2f5a44'][(r() * 4) | 0]); }
      } else if (d.sil === 'room' || d.sil === 'manor') {
        f(0, 78, 320, 14, d.sil === 'manor' ? '#3a2416' : '#3a2a1e'); f(0, 78, 320, 1, d.sil === 'manor' ? '#c9a24a' : '#6e4526');
        for (let i = 0; i < 4; i++) { const bx = 30 + i * 80; f(bx, 26, 30, 24, '#1a1410'); f(bx + 2, 28, 26, 20, d.sil === 'manor' ? ['#6b7f5a', '#7d5a4a', '#4a5f7d', '#8a7a4a'][i] : '#243a4a'); }
      } else if (d.sil === 'neon') {
        for (let i = 0; i < 7; i++) { const bx = 10 + i * 46; f(bx, 44, 30, 48, '#0f0a22'); f(bx + 3, 48, 24, 16, ['#ff5db1', '#5de4ff', '#ffd23f', '#7fd35b'][i % 4]); f(bx + 6, 51, 18, 10, '#150f2b'); f(bx + 8, 70, 14, 3, '#3a3160'); }
        f(0, 10, 320, 2, '#ff5db1'); f(0, 16, 320, 1, '#5de4ff');
      }
      const g = QQ.tiles.get.bind(null, d.ground);
      for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 10; tx++) { x.imageSmoothingEnabled = false; x.drawImage(g(tx, ty, 0), tx * 32, HZ + ty * 32, 32, 32); }
      f(0, HZ, 320, 2, 'rgba(0,0,0,0.35)');
    }, 320, 156));
  };
})();

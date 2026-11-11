// Quay Quest engine: canvas, input, bitmap font, UI widgets, audio, saves.
(function () {
  'use strict';
  const QQ = window.QQ = window.QQ || {};
  const W = 320, H = 240, T = 16;
  Object.assign(QQ, { W, H, T, frame: 0, speed: 1, modals: [], timers: [], busy: 0 });

  // ---------------------------------------------------------------- helpers
  QQ.rnd = (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  QQ.irnd = (a, b) => Math.floor(QQ.rnd(a, b + 1));
  QQ.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  QQ.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  QQ.seeded = function (seed) {
    let s = seed >>> 0;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  };
  QQ.money = (n) => '£' + Math.round(n).toLocaleString('en-GB');

  // ---------------------------------------------------------------- canvas
  let ctx, atlas, whiteAtlas;
  QQ.init = function (canvas) {
    QQ.canvas = canvas;
    canvas.width = W; canvas.height = H;
    ctx = QQ.ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return new Promise((resolve, reject) => {
      atlas = QQ.atlas = new Image();
      atlas.onload = () => {
        whiteAtlas = document.createElement('canvas');
        whiteAtlas.width = atlas.width; whiteAtlas.height = atlas.height;
        const c = whiteAtlas.getContext('2d');
        c.drawImage(atlas, 0, 0);
        c.globalCompositeOperation = 'source-in';
        c.fillStyle = '#fff'; c.fillRect(0, 0, atlas.width, atlas.height);
        resolve();
      };
      atlas.onerror = reject;
      atlas.src = QQ.ATLAS_SRC;
    });
  };

  // Draw a 16x16 atlas sprite by name. o: {flip, scale, alpha, white}
  QQ.spr = function (name, x, y, o) {
    const i = QQ.SPRITES[name];
    if (i === undefined) return;
    const sx = (i % QQ.ATLAS_COLS) * 16, sy = ((i / QQ.ATLAS_COLS) | 0) * 16;
    const s = (o && o.scale) || 1, img = o && o.white ? whiteAtlas : atlas, c = (o && o.ctx) || ctx;
    x = Math.round(x); y = Math.round(y);
    if (o && o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o && o.flip) {
      c.save(); c.translate(x + 16 * s, y); c.scale(-1, 1);
      c.drawImage(img, sx, sy, 16, 16, 0, 0, 16 * s, 16 * s); c.restore();
    } else c.drawImage(img, sx, sy, 16, 16, x, y, 16 * s, 16 * s);
    if (o && o.alpha !== undefined) c.globalAlpha = 1;
  };
  QQ.rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // ---------------------------------------------------------------- bitmap font (5x7 LCD style, proportional)
  // 96 glyphs for ASCII 32..126 plus the pound sign at slot 95. Five column bytes each, bit 0 = top row.
  const FONT =
    '0000000000' + '00005F0000' + '0007000700' + '147F147F14' + '242A7F2A12' + '2313086462' + '3649562050' + '0000070000' +
    '001C224100' + '0041221C00' + '2A1C7F1C2A' + '08083E0808' + '0080600000' + '0808080800' + '0000606000' + '2010080402' +
    '3E5149453E' + '00427F4000' + '7249494946' + '2141494D33' + '1814127F10' + '2745454539' + '3C4A494931' + '4121110907' +
    '3649494936' + '464949291E' + '0000240000' + '0040340000' + '0008142241' + '1414141414' + '0041221408' + '0201590906' +
    '3E415D594E' + '7C1211127C' + '7F49494936' + '3E41414122' + '7F4141413E' + '7F49494941' + '7F09090901' + '3E4149497A' +
    '7F0808087F' + '00417F4100' + '2040413F01' + '7F08142241' + '7F40404040' + '7F020C027F' + '7F0408107F' + '3E4141413E' +
    '7F09090906' + '3E4151215E' + '7F09192946' + '4649494931' + '01017F0101' + '3F4040403F' + '1F2040201F' + '7F2018207F' +
    '6314081463' + '0708700807' + '6151494543' + '007F414100' + '0204081020' + '0041417F00' + '0402010204' + '4040404040' +
    '0001020400' + '2054545478' + '7F48444438' + '3844444420' + '384444487F' + '3854545418' + '087E090102' + '18A4A4A47C' +
    '7F08040478' + '00447D4000' + '4080847D00' + '7F10284400' + '00417F4000' + '7C04180478' + '7C08040478' + '3844444438' +
    'FC24242418' + '18242424FC' + '7C08040408' + '4854545420' + '043F444020' + '3C4040207C' + '1C2040201C' + '3C4030403C' +
    '4428102844' + '1CA0A0A07C' + '4464544C44' + '0008364100' + '00007F0000' + '0041360800' + '0804081008' + '487E494142';
  const GL = [];
  for (let g = 0; g < 96; g++) {
    const cols = [];
    for (let c = 0; c < 5; c++) cols.push(parseInt(FONT.substr(g * 10 + c * 2, 2), 16));
    let a = 0, b = 4;
    while (a < 5 && !cols[a]) a++;
    while (b >= 0 && !cols[b]) b--;
    if (g === 0) { a = 0; b = 2; }                 // space
    if (g >= 16 && g <= 25) { a = 0; b = 4; }      // tabular digits
    GL.push({ cols, x0: a, w: b - a + 1 });
  }
  const strips = {};
  function strip(color) {
    if (strips[color]) return strips[color];
    const c = document.createElement('canvas');
    c.width = 96 * 6; c.height = 8;
    const x = c.getContext('2d');
    x.fillStyle = color;
    GL.forEach((g, i) => g.cols.forEach((bits, cx) => {
      for (let r = 0; r < 8; r++) if (bits & (1 << r)) x.fillRect(i * 6 + cx, r, 1, 1);
    }));
    return (strips[color] = c);
  }
  const glyph = (ch) => {
    let code = ch.charCodeAt(0);
    if (code === 0xa3) return 95;
    if (code === 0x2019 || code === 0x2018) code = 39;
    if (code < 32 || code > 126) code = 63;
    return code - 32;
  };
  QQ.COL = { w: '#f4ecd8', y: '#ffd23f', g: '#7fd35b', r: '#ff5d5d', c: '#6fd3f2', d: '#8d86a8', k: '#15121c', o: '#ff9d3c', p: '#e58bd8' };
  // Inline colour tags: ^y yellow, ^w white, ^g green, ^r red, ^c cyan, ^d dim, ^o orange, ^p pink.
  QQ.textW = function (str) {
    let w = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '^' && QQ.COL[str[i + 1]]) { i++; continue; }
      w += GL[glyph(str[i])].w + 1;
    }
    return Math.max(0, w - 1);
  };
  QQ.text = function (str, x, y, color, o) {
    str = String(str);
    const s = (o && o.scale) || 1;
    if (o && o.align === 'right') x -= QQ.textW(str) * s;
    else if (o && o.align === 'center') x -= Math.round(QQ.textW(str) * s / 2);
    x = Math.round(x); y = Math.round(y);
    if (o && o.shadow) QQ.text(str.replace(/\^[a-z]/g, ''), x + s, y + s, QQ.COL.k, { scale: s });
    let img = strip(QQ.COL[color] || color || QQ.COL.w), limit = o && o.limit !== undefined ? o.limit : 1e9;
    for (let i = 0; i < str.length && limit > 0; i++) {
      if (str[i] === '^' && QQ.COL[str[i + 1]]) { if (!(o && o.mono)) img = strip(QQ.COL[str[i + 1]]); i++; continue; }
      const gi = glyph(str[i]), g = GL[gi];
      if (gi) ctx.drawImage(img, gi * 6 + g.x0, 0, g.w, 8, x, y, g.w * s, 8 * s);
      x += (g.w + 1) * s; limit--;
    }
  };
  QQ.wrap = function (str, maxW) {
    const out = [];
    String(str).split('\n').forEach((para) => {
      let line = '';
      para.split(' ').forEach((word) => {
        const t = line ? line + ' ' + word : word;
        if (QQ.textW(t) > maxW && line) { out.push(line); line = word; } else line = t;
      });
      out.push(line);
    });
    return out;
  };

  // ---------------------------------------------------------------- UI skin
  QQ.box = function (x, y, w, h, o) {
    const bg = (o && o.bg) || '#1b1630', edge = (o && o.edge) || '#f4ecd8';
    QQ.rect(x + 1, y, w - 2, h, '#0b0912'); QQ.rect(x, y + 1, w, h - 2, '#0b0912');
    QQ.rect(x + 1, y + 1, w - 2, h - 2, edge);
    QQ.rect(x + 2, y + 2, w - 4, h - 4, bg);
    QQ.rect(x + 2, y + 2, w - 4, 1, '#2c2548');
    if (o && o.title) {
      const tw = QQ.textW(o.title) + 8;
      QQ.rect(x + 6, y - 3, tw, 9, '#0b0912');
      QQ.rect(x + 7, y - 2, tw - 2, 7, '#ffd23f');
      QQ.text(o.title, x + 10, y - 2, 'k', { mono: 1 });
    }
  };
  QQ.cursor = function (x, y) {
    const b = (QQ.frame >> 4) & 1;
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + b + i, y + i, 1, 7 - i * 2);
  };
  QQ.bar = function (x, y, w, h, frac, col, back) {
    QQ.rect(x, y, w, h, back || '#0b0912');
    QQ.rect(x + 1, y + 1, Math.round((w - 2) * QQ.clamp(frac, 0, 1)), h - 2, col);
  };

  // ---------------------------------------------------------------- input
  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    z: 'a', Z: 'a', Enter: 'a', ' ': 'a', e: 'a', E: 'a',
    x: 'b', X: 'b', Escape: 'b', Backspace: 'b', q: 'b', Q: 'b'
  };
  const held = {}, edge = {}, rep = {};
  QQ.input = {
    set(k, on) {
      if (on && !held[k]) { edge[k] = true; rep[k] = 0; QQ.audio.unlock(); }
      held[k] = on;
    },
    held: (k) => !!held[k],
    // pressed: edge-triggered; with auto-repeat for directions
    pressed(k) {
      if (edge[k]) { edge[k] = false; return true; }
      return false;
    },
    clear() { for (const k in edge) edge[k] = false; },
    tick() {
      ['up', 'down', 'left', 'right'].forEach((k) => {
        if (held[k]) { rep[k]++; if (rep[k] > 18 && rep[k] % 5 === 0) edge[k] = true; }
      });
    }
  };
  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.key];
    if (k) { QQ.input.set(k, true); e.preventDefault(); }
    else if (e.key === 'm' || e.key === 'M') QQ.audio.toggle();
  });
  window.addEventListener('keyup', (e) => { const k = KEYMAP[e.key]; if (k) QQ.input.set(k, false); });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });

  // ---------------------------------------------------------------- timers / tweens / modals
  QQ.wait = (frames) => new Promise((res) => QQ.timers.push({ t: Math.max(1, Math.round(frames)), res }));
  QQ.tween = function (obj, prop, to, frames, ease) {
    const from = obj[prop];
    return new Promise((res) => QQ.timers.push({
      t: frames, n: frames, res,
      step(k) { const u = 1 - k; obj[prop] = from + (to - from) * (ease === 'out' ? 1 - (1 - u) * (1 - u) : u); }
    }));
  };
  function tickTimers() {
    for (let i = QQ.timers.length - 1; i >= 0; i--) {
      const t = QQ.timers[i];
      t.t--;
      if (t.step) t.step(Math.max(0, t.t / t.n));
      if (t.t <= 0) { QQ.timers.splice(i, 1); t.res(); }
    }
  }
  QQ.push = (m) => { QQ.modals.push(m); QQ.input.clear(); return m; };
  QQ.pop = (m) => { const i = QQ.modals.indexOf(m); if (i >= 0) QQ.modals.splice(i, 1); QQ.input.clear(); };

  // fade overlay
  QQ.fadeA = 0; QQ.fadeCol = '#0b0912';
  QQ.fade = (to, frames, col) => { if (col) QQ.fadeCol = col; return QQ.tween(QQ, 'fadeA', to, frames || 16); };
  QQ.flashA = 0;
  QQ.flash = (frames) => { QQ.flashA = 1; return QQ.tween(QQ, 'flashA', 0, frames || 10); };
  QQ.shakeT = 0;

  // toasts (non-blocking notices)
  const toasts = [];
  QQ.toast = (text, color) => { toasts.push({ text, color: color || 'w', t: 150 }); if (toasts.length > 4) toasts.shift(); };

  // ---------------------------------------------------------------- dialogue
  // who: speaker key from QQ.SPEAKERS, {n, s} object, or null for narration.
  QQ.say = async function (who, text) {
    const pages = Array.isArray(text) ? text : [text];
    for (const p of pages) await sayPage(who, p);
  };
  function sayPage(who, text) {
    const sp = typeof who === 'string' ? (QQ.SPEAKERS && QQ.SPEAKERS[who]) || { n: who } : who;
    const hasPic = sp && sp.s;
    const lines = QQ.wrap(text, hasPic ? 252 : 296);
    return new Promise((res) => {
      let top = 0, shown = 0, wait = 0;
      const total = (from) => lines.slice(from, from + 4).join('').replace(/\^[a-z]/g, '').length;
      const m = QQ.push({
        update() {
          const n = total(top);
          if (shown < n) {
            shown += QQ.input.held('b') ? 4 : 1.5;
            if (((shown | 0) % 3) === 0) QQ.audio.sfx('talk');
            if (QQ.input.pressed('a')) shown = n;
          } else if (QQ.input.pressed('a') || QQ.input.pressed('b') || (QQ.autoTalk && ++wait > 2)) {
            wait = 0;
            if (top + 4 < lines.length) { top += 4; shown = 0; QQ.audio.sfx('ok'); }
            else { QQ.pop(m); res(); }
          }
        },
        draw() {
          const y = H - 62;
          QQ.box(4, y, W - 8, 58, { title: sp && sp.n ? sp.n : null });
          let tx = 14;
          if (hasPic) { QQ.rect(10, y + 10, 36, 38, '#0b0912'); QQ.rect(11, y + 11, 34, 36, '#3a3160'); QQ.spr(sp.s, 12, y + 13, { scale: 2 }); tx = 54; }
          let left = Math.floor(shown);
          for (let i = 0; i < 4 && top + i < lines.length; i++) {
            const ln = lines[top + i], len = ln.replace(/\^[a-z]/g, '').length;
            QQ.text(ln, tx, y + 10 + i * 11, 'w', { limit: left });
            left -= len; if (left <= 0) break;
          }
          if (shown >= total(top) && (QQ.frame >> 4) & 1) QQ.rect(W - 18, y + 48, 5, 3, '#ffd23f');
        }
      });
    });
  }

  // ---------------------------------------------------------------- list menu
  // opts: {title, items:[{label, right, disabled, icon, color, desc}], x, y, w, rows, cancel, sel, desc:{x,y,w,h}, onMove}
  QQ.menu = function (o) {
    if (QQ.autoMenu) { const r = QQ.autoMenu(o); if (r !== undefined) return Promise.resolve(r); }
    return new Promise((res) => {
      const items = o.items, rows = Math.min(o.rows || items.length, items.length || 1);
      const w = o.w || Math.max(60, ...items.map((it) => QQ.textW(it.label) + (it.right ? QQ.textW(String(it.right)) + 14 : 0) + (it.icon ? 18 : 0) + 26));
      const lh = o.lh || (items.some((it) => it.icon) ? 17 : 12), h = rows * lh + 12;
      const x = o.x !== undefined ? o.x : Math.round((W - w) / 2), y = o.y !== undefined ? o.y : Math.round((H - h) / 2);
      let sel = QQ.clamp(o.sel || 0, 0, Math.max(0, items.length - 1)), top = QQ.clamp(sel - rows + 1, 0, Math.max(0, items.length - rows));
      const m = QQ.push({
        update() {
          const n = items.length;
          if (!n) { if (QQ.input.pressed('a') || QQ.input.pressed('b')) { QQ.pop(m); res(-1); } return; }
          let mv = 0;
          if (QQ.input.pressed('up')) mv = -1;
          if (QQ.input.pressed('down')) mv = 1;
          if (mv) {
            sel = (sel + mv + n) % n;
            if (sel < top) top = sel; if (sel >= top + rows) top = sel - rows + 1;
            QQ.audio.sfx('move'); if (o.onMove) o.onMove(sel);
          }
          if (QQ.input.pressed('a')) {
            if (items[sel].disabled) QQ.audio.sfx('no');
            else { QQ.audio.sfx('ok'); QQ.pop(m); res(sel); }
          } else if (QQ.input.pressed('b') && o.cancel !== false) { QQ.audio.sfx('cancel'); QQ.pop(m); res(-1); }
        },
        draw() {
          QQ.box(x, y, w, h, { title: o.title });
          if (!items.length) QQ.text(o.empty || 'Nothing here.', x + 10, y + 8, 'd');
          for (let i = 0; i < rows && top + i < items.length; i++) {
            const it = items[top + i], yy = y + 7 + i * lh, on = top + i === sel;
            let tx = x + 14;
            if (it.icon) { QQ.spr(it.icon, tx - 1, yy - 1, { alpha: it.disabled ? 0.45 : 1 }); tx += 18; }
            const ty = it.icon ? yy + 3 : yy;
            QQ.text(it.label, tx, ty, it.disabled ? 'd' : it.color || 'w');
            if (it.right !== undefined) QQ.text(String(it.right), x + w - 8, ty, it.disabled ? 'd' : it.rcolor || 'y', { align: 'right' });
            if (on) QQ.cursor(x + 6, ty);
          }
          if (top > 0) QQ.text('^', x + w - 10, y + 2, 'y');
          if (top + rows < items.length) QQ.text('v', x + w - 10, y + h - 9, 'y');
          const d = o.desc, it = items[sel];
          if (d && it) {
            QQ.box(d.x, d.y, d.w, d.h);
            const text = typeof it.desc === 'function' ? it.desc() : it.desc;
            QQ.wrap(text || '', d.w - 16).slice(0, Math.floor((d.h - 10) / 10)).forEach((ln, i) => QQ.text(ln, d.x + 8, d.y + 7 + i * 10, 'w'));
          }
          if (o.extra) o.extra(sel);
        }
      });
      if (o.onMove) o.onMove(sel);
    });
  };
  QQ.choose = (options, o) => QQ.menu(Object.assign({
    items: options.map((l) => (typeof l === 'string' ? { label: l } : l)), x: undefined, y: undefined
  }, (() => {
    const w = Math.max(64, ...options.map((l) => QQ.textW(typeof l === 'string' ? l : l.label) + 30));
    return { x: W - w - 8, y: H - 68 - options.length * 12 - 12, w };
  })(), o || {}));

  // quantity picker: returns chosen number or 0 on cancel
  QQ.pickNumber = function (o) {
    if (QQ.autoMenu) return Promise.resolve(o.max);
    return new Promise((res) => {
      let v = QQ.clamp(o.value || 1, o.min || 1, o.max);
      const m = QQ.push({
        update() {
          let d = 0;
          if (QQ.input.pressed('right')) d = 1; if (QQ.input.pressed('left')) d = -1;
          if (QQ.input.pressed('up')) d = 5; if (QQ.input.pressed('down')) d = -5;
          if (d) { v = QQ.clamp(v + d, o.min || 1, o.max); QQ.audio.sfx('move'); }
          if (QQ.input.pressed('a')) { QQ.audio.sfx('ok'); QQ.pop(m); res(v); }
          else if (QQ.input.pressed('b')) { QQ.audio.sfx('cancel'); QQ.pop(m); res(0); }
        },
        draw() {
          const w = 150, x = (W - w) / 2, y = 84;
          QQ.box(x, y, w, 52, { title: o.title });
          QQ.text('< ' + v + ' >', x + w / 2, y + 12, 'y', { align: 'center', scale: 2 });
          if (o.line) QQ.text(o.line(v), x + w / 2, y + 34, 'w', { align: 'center' });
          QQ.text('up/down: 5', x + w / 2, y + 43, 'd', { align: 'center' });
        }
      });
    });
  };

  // ---------------------------------------------------------------- audio (tiny chip synth + step sequencer)
  const N = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = (note) => {
    const m = /^([A-G]#?)(\d)$/.exec(note);
    return m ? 440 * Math.pow(2, (N[m[1]] + (m[2] - 4) * 12 - 9) / 12) : 0;
  };
  let ac = null, master = null, noiseBuf = null, seq = null;
  const audio = QQ.audio = {
    muted: false, song: null, wanted: null,
    unlock() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain(); master.gain.value = audio.muted ? 0 : 0.5; master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        if (audio.wanted) { const w = audio.wanted; audio.song = null; audio.music(w); }
      } catch (e) { ac = null; }
    },
    toggle() {
      audio.muted = !audio.muted;
      if (master) master.gain.value = audio.muted ? 0 : 0.5;
      QQ.toast(audio.muted ? 'Sound off' : 'Sound on');
      try { localStorage.setItem('quayquest.mute', audio.muted ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    },
    tone(f, t0, dur, type, vol, slide) {
      if (!ac || !f) return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
      g.gain.setValueAtTime(vol || 0.12, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
    },
    noise(t0, dur, vol, hp) {
      if (!ac) return;
      const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
      s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 800;
      g.gain.setValueAtTime(vol || 0.15, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
    },
    sfx(name) {
      if (!ac || audio.muted) return;
      const t = ac.currentTime, tn = audio.tone, nz = audio.noise;
      switch (name) {
        case 'talk': tn(520 + Math.random() * 80, t, 0.025, 'square', 0.03); break;
        case 'move': tn(660, t, 0.04, 'square', 0.06); break;
        case 'ok': tn(660, t, 0.05, 'square', 0.08); tn(990, t + 0.05, 0.08, 'square', 0.08); break;
        case 'cancel': tn(440, t, 0.05, 'square', 0.07); tn(300, t + 0.05, 0.08, 'square', 0.07); break;
        case 'no': tn(160, t, 0.12, 'sawtooth', 0.09); break;
        case 'hit': nz(t, 0.09, 0.25, 500); tn(180, t, 0.09, 'square', 0.1, 60); break;
        case 'crit': nz(t, 0.16, 0.3, 300); tn(300, t, 0.16, 'sawtooth', 0.12, 50); break;
        case 'miss': tn(900, t, 0.1, 'sine', 0.06, 300); break;
        case 'heal': [523, 659, 784, 1047].forEach((f, i) => tn(f, t + i * 0.06, 0.12, 'triangle', 0.1)); break;
        case 'buff': [392, 523, 659].forEach((f, i) => tn(f, t + i * 0.05, 0.1, 'square', 0.07)); break;
        case 'debuff': [392, 311, 233].forEach((f, i) => tn(f, t + i * 0.06, 0.12, 'sawtooth', 0.07)); break;
        case 'cash': tn(1319, t, 0.06, 'square', 0.08); tn(1760, t + 0.07, 0.16, 'square', 0.08); break;
        case 'door': nz(t, 0.08, 0.12, 200); tn(120, t, 0.1, 'square', 0.06); break;
        case 'step': nz(t, 0.02, 0.03, 2000); break;
        case 'encounter': for (let i = 0; i < 8; i++) tn(200 + i * 90, t + i * 0.04, 0.05, 'sawtooth', 0.09); break;
        case 'die': tn(300, t, 0.3, 'sawtooth', 0.1, 40); nz(t, 0.2, 0.12, 300); break;
        case 'levelup': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tn(f, t + i * 0.08, 0.14, 'square', 0.09)); break;
        case 'win': [392, 392, 392, 523, 466, 523].forEach((f, i) => tn(f, t + [0, 0.12, 0.24, 0.36, 0.6, 0.84][i], i > 2 ? 0.3 : 0.1, 'square', 0.1)); break;
        case 'lose': [392, 370, 349, 262].forEach((f, i) => tn(f, t + i * 0.22, 0.3, 'triangle', 0.12)); break;
        case 'train': for (let i = 0; i < 6; i++) nz(t + i * 0.13, 0.06, 0.12, 300 + (i % 2) * 500); break;
        case 'mystic': [330, 415, 494, 659, 831].forEach((f, i) => tn(f, t + i * 0.09, 0.4, 'sine', 0.08)); break;
      }
    },
    music(name) {
      audio.wanted = name;
      if (!ac || audio.song === name) return;
      audio.song = name;
      if (seq) clearInterval(seq);
      seq = null;
      const song = QQ.SONGS && QQ.SONGS[name];
      if (!song) return;
      const stepDur = 60 / song.bpm / 4;
      const tracks = song.tracks.map((tr) => Object.assign({}, tr, { n: tr.notes.trim().split(/\s+/) }));
      let step = 0, next = ac.currentTime + 0.08;
      seq = setInterval(() => {
        if (!ac) return;
        if (next < ac.currentTime - 0.3) next = ac.currentTime + 0.05;   // tab was asleep
        while (next < ac.currentTime + 0.25) {
          for (const tr of tracks) {
            const tok = tr.n[step % tr.n.length];
            if (tok === '.' || tok === '-') continue;
            let len = 1;
            while (tr.n[(step + len) % tr.n.length] === '-' && len < 16) len++;
            if (tr.drum) {
              if (tok === 'k') audio.tone(120, next, 0.12, 'sine', tr.vol * 2.2, 40);
              else if (tok === 's') { audio.noise(next, 0.1, tr.vol * 1.4, 900); audio.tone(190, next, 0.06, 'triangle', tr.vol); }
              else if (tok === 'h') audio.noise(next, 0.025, tr.vol * 0.7, 6000);
              else if (tok === 'c') audio.noise(next, 0.05, tr.vol, 2500);
            } else audio.tone(freq(tok), next, stepDur * len * (tr.gate || 0.9), tr.wave || 'square', tr.vol || 0.05);
          }
          step++; next += stepDur;
        }
      }, 60);
    }
  };
  try { audio.muted = localStorage.getItem('quayquest.mute') === '1'; } catch (e) { /* storage unavailable */ }

  // ---------------------------------------------------------------- saves
  const SAVE_KEY = 'quayquest.save.v1';
  let memSave = null;
  QQ.store = {
    write(state) {
      memSave = JSON.stringify(state);
      try { localStorage.setItem(SAVE_KEY, memSave); return true; } catch (e) { return false; }
    },
    read() {
      try { const s = localStorage.getItem(SAVE_KEY); if (s) return JSON.parse(s); } catch (e) { /* fall through */ }
      try { return memSave ? JSON.parse(memSave) : null; } catch (e) { return null; }
    },
    load(json) { memSave = typeof json === 'string' ? json : JSON.stringify(json); },
    clear() { memSave = null; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ } }
  };

  // ---------------------------------------------------------------- main loop
  QQ.scene = null; // {update, draw}
  function update() {
    QQ.frame++;
    QQ.input.tick();
    tickTimers();
    const top = QQ.modals[QQ.modals.length - 1];
    if (top) top.update();
    else if (QQ.scene && QQ.scene.update) QQ.scene.update();
    if (QQ.scene && QQ.scene.tick) QQ.scene.tick();
    if (QQ.shakeT > 0) QQ.shakeT--;
    for (let i = toasts.length - 1; i >= 0; i--) if (--toasts[i].t <= 0) toasts.splice(i, 1);
    QQ.input.clear();
  }
  function draw() {
    ctx.save();
    if (QQ.shakeT > 0) ctx.translate(QQ.irnd(-2, 2), QQ.irnd(-2, 2));
    QQ.rect(-4, -4, W + 8, H + 8, '#0b0912');
    if (QQ.scene) QQ.scene.draw();
    ctx.restore();
    if (QQ.flashA > 0.01) { ctx.globalAlpha = QQ.flashA; QQ.rect(0, 0, W, H, '#fff'); ctx.globalAlpha = 1; }
    if (QQ.fadeA > 0.01) { ctx.globalAlpha = QQ.fadeA; QQ.rect(0, 0, W, H, QQ.fadeCol); ctx.globalAlpha = 1; }
    for (const m of QQ.modals) m.draw();
    toasts.forEach((t, i) => {
      const w = QQ.textW(t.text) + 12, a = Math.min(1, t.t / 20);
      ctx.globalAlpha = a;
      QQ.rect(W - w - 4, 16 + i * 13, w, 11, '#0b0912'); QQ.rect(W - w - 3, 17 + i * 13, w - 2, 9, '#2c2548');
      QQ.text(t.text, W - w + 2, 18 + i * 13, t.color);
      ctx.globalAlpha = 1;
    });
  }
  let last = 0, acc = 0;
  function loop(ts) {
    const dt = Math.min(100, ts - last); last = ts; acc += dt * QQ.speed;
    let n = 0;
    while (acc >= 1000 / 60 && n < 240) { update(); acc -= 1000 / 60; n++; }
    if (n >= 240) acc = 0;
    try { draw(); } catch (e) { console.error(e); }
    requestAnimationFrame(loop);
  }
  QQ.start = () => requestAnimationFrame((ts) => { last = ts; loop(ts); });
  QQ.stepFrames = (n) => { for (let i = 0; i < n; i++) update(); draw(); };
})();

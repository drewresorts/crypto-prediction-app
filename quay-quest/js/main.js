// Boot: canvas scaling, touch pad, start the title screen.
(function () {
  'use strict';
  const QQ = window.QQ;
  const canvas = document.getElementById('screen');
  function fit() {
    const wrap = canvas.parentElement, r = wrap.getBoundingClientRect();
    const s = Math.max(1, Math.min(r.width / QQ.W, (window.innerHeight - (document.body.classList.contains('touch') ? 190 : 120)) / QQ.H));
    const k = s >= 2 ? Math.floor(s) : s;
    canvas.style.width = Math.round(QQ.W * k) + 'px';
    canvas.style.height = Math.round(QQ.H * k) + 'px';
  }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  window.addEventListener('resize', fit);
  document.querySelectorAll('[data-key]').forEach((b) => {
    const k = b.dataset.key;
    const on = (e) => { e.preventDefault(); QQ.input.set(k, true); b.classList.add('down'); };
    const off = (e) => { e.preventDefault(); QQ.input.set(k, false); b.classList.remove('down'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
  canvas.addEventListener('pointerdown', () => QQ.audio.unlock());
  QQ.init(canvas).then(() => {
    QQ.buildMaps();
    fit();
    QQ.start();
    QQ.script(QQ.menus.title);
  }).catch((e) => { document.getElementById('err').textContent = 'Could not load the game: ' + e; });
})();

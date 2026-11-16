/* =========================================================
   UI-кит: DOM-хелперы, HUD, панели, атмосфера, звук
   ========================================================= */
(function (G) {
  'use strict';

  var UI = {};
  G.UI = UI;

  /* ---------- DOM ---------- */

  UI.el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  UI.clear = function (n) {
    while (n && n.firstChild) n.removeChild(n.firstChild);
    return n;
  };

  UI.$ = function (id) { return document.getElementById(id); };

  UI.img = function (src, cls, alt) {
    var i = document.createElement('img');
    i.src = src;
    if (cls) i.className = cls;
    i.alt = alt || '';
    return i;
  };

  /* ---------- уведомления ---------- */

  var toastEl = null, toastTimer = null;

  UI.toast = function (text) {
    toastEl = toastEl || UI.$('toast');
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2200);
  };

  /* ---------- HUD ---------- */

  UI.setHudVisible = function (on) {
    var h = UI.$('hud');
    if (h) h.classList.toggle('is-on', !!on);
  };

  UI.setWhere = function (text) {
    var n = UI.$('hudWhere');
    if (n) n.textContent = text || '';
  };

  UI.updateHud = function (S, L, D) {
    if (!S) return;
    UI.$('hudHp').textContent = Math.max(0, S.hp);
    UI.$('hudHpMax').textContent = '/' + S.maxHp;
    UI.$('hudLvl').textContent = S.level;
    UI.$('hudCredits').textContent = S.credits;

    var next = L.xpForNext(S);
    var pct = isFinite(next) && next > 0 ? Math.min(100, Math.round(S.xp / next * 100)) : 100;
    UI.$('hudXpFill').style.width = pct + '%';
    UI.$('hudXpText').textContent = isFinite(next) ? S.xp + '/' + next : 'max';

    var pts = UI.$('hudPoints');
    if (pts) {
      pts.classList.toggle('hidden', !(S.points > 0));
      if (S.points > 0) pts.textContent = 'очки: ' + S.points;
    }
  };

  /* ---------- монтаж экранов ---------- */

  UI.clearTitleLayer = function () {
    var l = document.querySelector('.title-layer');
    if (l) {
      if (l._timer) clearInterval(l._timer);
      if (l.parentNode) l.parentNode.removeChild(l);
    }
  };

  UI.showTitleLayer = function (node) {
    UI.clearTitleLayer();
    UI.$('stage').appendChild(node);
    return node;
  };

  UI.mount = function (screenName) {
    if (G.AU && G.AU.state) G.AU.state.screen = screenName;
    UI.clearTitleLayer();
    var app = UI.$('app');
    UI.clear(app);
    var root = UI.el('div', 'screen');
    app.appendChild(root);
    return root;
  };

  /* ---------- панели ---------- */

  var overlay = null, activePanel = null, onClose = null;

  function overlayNode() {
    overlay = overlay || UI.$('overlay');
    return overlay;
  }

  UI.panel = function (opts) {
    opts = opts || {};
    var root = UI.el('div', 'panel' + (opts.wide ? ' panel--wide' : ''));
    root.id = opts.id || 'panel';

    var head = UI.el('div', 'panel__head');
    head.appendChild(UI.el('p', 'panel__kicker', opts.kicker || 'Терминал'));
    head.appendChild(UI.el('h2', 'panel__title', opts.title || ''));
    var close = UI.el('button', 'panel__close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть');
    close.addEventListener('click', function () { UI.closePanel(); });
    head.appendChild(close);
    root.appendChild(head);

    var body = UI.el('div', 'panel__body');
    if (opts.body) body.appendChild(opts.body);
    root.appendChild(body);

    var foot = UI.el('div', 'panel__foot');
    foot.appendChild(UI.el('span', '', opts.footLeft || 'Esc — закрыть'));
    foot.appendChild(UI.el('span', '', opts.footRight || ''));
    root.appendChild(foot);

    root._body = body;
    root._close = close;
    return root;
  };

  UI.openPanel = function (root, afterClose) {
    var ov = overlayNode();
    UI.clear(ov);
    ov.appendChild(root);
    ov.classList.add('is-open');
    activePanel = root;
    onClose = afterClose || null;
    var first = root.querySelector('.panel__body button, .panel__body input');
    if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 200);
  };

  UI.closePanel = function () {
    var ov = overlayNode();
    if (!ov || !ov.classList.contains('is-open')) return;
    ov.classList.remove('is-open');
    activePanel = null;
    var cb = onClose; onClose = null;
    setTimeout(function () { UI.clear(ov); }, 320);
    if (cb) cb();
  };

  UI.isPanelOpen = function () { return !!activePanel; };

  /* ---------- сцена / фон ---------- */

  var stage = null, bg = null, spin = null;
  var scenes = [], sceneIdx = 0;

  function initScene() {
    stage = UI.$('stage');
    bg = UI.$('bg');
    spin = UI.$('bgSpin');
    scenes = [UI.$('sceneA'), UI.$('sceneB')];

    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.ceil(Math.sqrt(w * w + h * h) * 1.03);
    spin.style.width = s + 'px';
    spin.style.height = s + 'px';
    spin.style.marginLeft = (-s / 2) + 'px';
    spin.style.marginTop = (-s / 2) + 'px';
  }

  UI.usePoster = function () {
    if (!stage) return;
    stage.classList.remove('mode-scene');
    scenes.forEach(function (s) { s.classList.remove('is-on'); });
  };

  UI.setScene = function (file) {
    if (!stage || !file) return;
    var nextIdx = 1 - sceneIdx;
    var next = scenes[nextIdx];
    var prev = scenes[sceneIdx];
    next.style.backgroundImage = 'url("assets/img/' + file + '")';
    next.classList.add('is-on');
    if (prev) prev.classList.remove('is-on');
    sceneIdx = nextIdx;
    stage.classList.add('mode-scene');
    UI.setSceneName(file);
  };

  UI.setSceneName = function (file) {
    var m = { 'bg_arrival.png': 'ВНЕШНИЙ КОНТУР', 'bg_dome.png': 'КУПОЛ СТАНЦИИ' };
    var n = UI.$('hudScene');
    if (n) n.textContent = m[file] || 'СЕКТОР R-7';
  };

  /* ---------- параллакс ---------- */

  var tx = 0, ty = 0, cx = 0, cy = 0, reduce = false;

  UI.initMotion = function () {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    (function loop() {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      if (bg) {
        bg.style.setProperty('--px', cx.toFixed(4));
        bg.style.setProperty('--py', cy.toFixed(4));
      }
      requestAnimationFrame(loop);
    })();
  };

  /* ---------- вспышки ---------- */

  UI.flare = function () {
    if (!stage) return;
    stage.classList.add('is-flare');
    setTimeout(function () { stage.classList.remove('is-flare'); }, 2200);
  };

  UI.initFlares = function () {
    if (reduce || !stage) return;
    setTimeout(UI.flare, 2600);
    (function schedule() {
      setTimeout(function () { UI.flare(); schedule(); }, 7000 + Math.random() * 9000);
    })();
  };

  /* ---------- пыль ---------- */

  UI.initDust = function () {
    var cv = UI.$('dust');
    if (!cv || reduce) return;
    var ctx = cv.getContext('2d');
    var W, H, DPR, motes = [], meteors = [], nextMeteor = 5000;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      motes = [];
      var n = Math.min(120, Math.round(W * H / 26000));
      for (var i = 0; i < n; i++) {
        motes.push({ x: Math.random() * W, y: Math.random() * H, r: rnd(.3, 1.4), vx: rnd(-.08, .08), vy: rnd(-.14, -.02), a: rnd(.05, .35), tw: rnd(0, 6.28), ts: rnd(.004, .014) });
      }
    }

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(now - last, 60); last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx * dt * .06; m.y += m.vy * dt * .06; m.tw += m.ts * dt * .06;
        if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
        if (m.x < -10) m.x = W + 10;
        if (m.x > W + 10) m.x = -10;
        var a = m.a * (.55 + .45 * Math.sin(m.tw));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(190,226,255,' + a.toFixed(3) + ')';
        ctx.arc(m.x, m.y, m.r, 0, 6.2832);
        ctx.fill();
      }

      nextMeteor -= dt;
      if (nextMeteor <= 0) {
        nextMeteor = rnd(6000, 12000);
        var left = Math.random() > .5;
        meteors.push({ x: left ? rnd(0, W * .6) : rnd(W * .4, W), y: rnd(0, H * .5), vx: (left ? 1 : -1) * rnd(9, 15), vy: rnd(4, 8), life: rnd(900, 1500) });
      }
      for (var k = meteors.length - 1; k >= 0; k--) {
        var s = meteors[k];
        s.life -= dt;
        if (s.life <= 0) { meteors.splice(k, 1); continue; }
        s.x += s.vx * dt * .06; s.y += s.vy * dt * .06;
        var g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * .06, s.y - s.vy * .06);
        g.addColorStop(0, 'rgba(200,235,255,' + (.5 * Math.min(1, s.life / 500)).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(200,235,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * .06, s.y - s.vy * .06); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(frame);
  };

  /* ---------- звук ---------- */

  var ambientOn = false;

  UI.initAudio = function (file, volume) {
    var a = UI.$('amb');
    if (!a) return;
    a.src = file;
    var arm = function () {
      document.removeEventListener('pointerdown', arm);
      a.volume = volume || .2;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
      ambientOn = true;
    };
    document.addEventListener('pointerdown', arm);
  };

  /* ---------- утилиты ---------- */

  UI.glyphFor = function (item) {
    if (!item) return '·';
    switch (item.kind) {
      case 'med': return '✚';
      case 'key': return '▤';
      case 'tool': return '⚒';
      case 'mask': return '◈';
      case 'clue': return '✧';
      case 'weapon': return '⌁';
      case 'suit': return '▦';
      default: return '◈';
    }
  };

  UI.bar = function (pct, label, mod) {
    var b = UI.el('div', 'bar' + (mod ? ' ' + mod : ''));
    var i = UI.el('i');
    i.style.width = Math.max(0, Math.min(100, pct)) + '%';
    b.appendChild(i);
    if (label) {
      var s = UI.el('span', '', label);
      s.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;font-size:9px;';
      b.appendChild(s);
    }
    return b;
  };

  UI.init = function () {
    initScene();
    UI.initMotion();
    UI.initFlares();
    UI.initDust();
    window.addEventListener('resize', function () {
      var w = window.innerWidth, h = window.innerHeight;
      var s = Math.ceil(Math.sqrt(w * w + h * h) * 1.03);
      spin.style.width = s + 'px';
      spin.style.height = s + 'px';
      spin.style.marginLeft = (-s / 2) + 'px';
      spin.style.marginTop = (-s / 2) + 'px';
    }, { passive: true });
  };
})(window);

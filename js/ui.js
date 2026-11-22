/* =========================================================
UI-кит 3.1: DOM, HUD, панели, атмосфера, плеер с автопоиском
и автопереходом по окончании трека.
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
UI.clear = function (n) { while (n && n.firstChild) n.removeChild(n.firstChild); return n; };
UI.$ = function (id) { return document.getElementById(id); };
UI.img = function (src, cls, alt) {
var i = document.createElement('img');
i.src = src; if (cls) i.className = cls; i.alt = alt || '';
i.onerror = function () { i.style.opacity = '.25'; };
return i;
};

/* ---------- уведомления ---------- */
var toastEl = null, toastTimer = null;
UI.toast = function (text) {
toastEl = toastEl || UI.$('toast');
if (!toastEl || !text) return;
toastEl.textContent = text;
toastEl.classList.add('is-show');
clearTimeout(toastTimer);
toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2200);
};

/* ---------- HUD ---------- */
UI.setHudVisible = function (on) {
  var h = UI.$('hud');
  if (!h) return;
  var s = G.AU && G.AU.state && G.AU.state.S;
  /* MaskLink — интерфейс станции: до выдачи идентификатора HUD не поднят */
  var masked = !s || !s.flags || s.flags.mask_active !== false;
  on = !!on && masked;
  h.classList.toggle('is-on', on);
  h.classList.toggle('is-min', !on);
};
UI.setWhere = function (text) {
var n = UI.$('hudWhere');
if (n) n.textContent = text || '';
};
UI.updateHud = function (S, L, D) {
if (!S) return;
function set(id, v) { var n = UI.$(id); if (n) n.textContent = v; }
set('hudHp', Math.max(0, S.hp));
set('hudHpMax', '/' + S.maxHp);
set('hudLvl', S.level);
set('hudCredits', S.credits);
var next = L.xpForNext(S);
var pct = isFinite(next) && next > 0 ? Math.min(100, Math.round(S.xp / next * 100)) : 100;
var fill = UI.$('hudXpFill');
if (fill) fill.style.width = pct + '%';
set('hudXpText', isFinite(next) ? S.xp + '/' + next : 'max');
var pts = UI.$('hudPoints');
if (pts) {
pts.classList.toggle('hidden', !(S.points > 0));
if (S.points > 0) pts.textContent = 'очки: ' + S.points;
}
};

/* ---------- титульный слой ---------- */
UI.clearTitleLayer = function () {
var l = document.querySelector('.title-layer');
if (l) {
if (l._timer) clearInterval(l._timer);
if (l.parentNode) l.parentNode.removeChild(l);
}
var h = UI.$('hud');
if (h) h.classList.remove('is-title');
};
UI.showTitleLayer = function (node) {
UI.clearTitleLayer();
UI.$('stage').appendChild(node);
var h = UI.$('hud');
if (h) h.classList.add('is-title');
return node;
};

/* ---------- монтаж экранов ---------- */
UI.mount = function (screenName) {
if (G.AU && G.AU.state) G.AU.state.screen = screenName;
UI.clearTitleLayer();
UI.closePlayer();
var app = UI.$('app');
UI.clear(app);
var root = UI.el('div', 'screen');
app.appendChild(root);
return root;
};

/* ---------- панели ---------- */
var overlay = null, activePanel = null, onClose = null, closeTimer = null, focusTimer = null;
function overlayNode() { overlay = overlay || UI.$('overlay'); return overlay; }
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
clearTimeout(closeTimer);
clearTimeout(focusTimer);
var ov = overlayNode();
if (!ov) return;
UI.clear(ov);
ov.appendChild(root);
ov.classList.add('is-open');
activePanel = root;
onClose = afterClose || null;
UI.closePlayer();
var first = root.querySelector('.panel__body button, .panel__body input');
if (first) focusTimer = setTimeout(function () { try { first.focus(); } catch (e) {} }, 180);
};
UI.closePanel = function () {
var ov = overlayNode();
if (!ov || !ov.classList.contains('is-open')) return;
ov.classList.remove('is-open');
activePanel = null;
var cb = onClose; onClose = null;
clearTimeout(focusTimer);
clearTimeout(closeTimer);
closeTimer = setTimeout(function () { if (!activePanel) UI.clear(ov); }, 320);
if (cb) cb();
};
UI.isPanelOpen = function () { return !!activePanel; };
UI.activePanel = function () { return activePanel; };

/* ---------- сцена ---------- */
var stage = null, bg = null, spin = null, scenes = [], sceneIdx = 0;
function sizeSpin() {
if (!spin) return;
var w = window.innerWidth, h = window.innerHeight;
var s = Math.ceil(Math.sqrt(w * w + h * h) * 1.03);
spin.style.width = s + 'px'; spin.style.height = s + 'px';
spin.style.marginLeft = (-s / 2) + 'px'; spin.style.marginTop = (-s / 2) + 'px';
}
function initScene() {
stage = UI.$('stage'); bg = UI.$('bg'); spin = UI.$('bgSpin');
scenes = [UI.$('sceneA'), UI.$('sceneB')].filter(Boolean);
sizeSpin();
}
UI.usePoster = function () {
if (!stage) return;
stage.classList.remove('mode-scene');
scenes.forEach(function (s) { s.classList.remove('is-on'); });
};
UI.setScene = function (file) {
if (!stage || !file || scenes.length < 2) return;
var nextIdx = 1 - sceneIdx;
var next = scenes[nextIdx], prev = scenes[sceneIdx];
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
UI.setScan = function (on) { if (stage) stage.classList.toggle('no-scan', !on); };
UI.setBigFont = function (on) { document.body.classList.toggle('big-font', !!on); };

/* ---------- движение: один выключатель на всё ---------- */
var motionOn = true;
var paraRaf = null, tx = 0, ty = 0, cx = 0, cy = 0, paraBound = false;
var dustRaf = null, dustCv = null, dustCtx = null, dustW = 0, dustH = 0;
var motes = [], meteors = [], nextMeteor = 5000, dustLast = 0, dustBound = false;
var flareTimer = null, flareOff = null;

function paraLoop() {
if (!motionOn) { paraRaf = null; return; }
cx += (tx - cx) * 0.045; cy += (ty - cy) * 0.045;
if (bg) { bg.style.setProperty('--px', cx.toFixed(4)); bg.style.setProperty('--py', cy.toFixed(4)); }
paraRaf = requestAnimationFrame(paraLoop);
}
function startPara() {
if (!paraBound) {
paraBound = true;
window.addEventListener('pointermove', function (e) {
tx = e.clientX / window.innerWidth - 0.5;
ty = e.clientY / window.innerHeight - 0.5;
}, { passive: true });
}
if (!paraRaf) paraRaf = requestAnimationFrame(paraLoop);
}
function stopPara() {
if (paraRaf) { cancelAnimationFrame(paraRaf); paraRaf = null; }
if (bg) { bg.style.setProperty('--px', '0'); bg.style.setProperty('--py', '0'); }
cx = cy = tx = ty = 0;
}
function rnd(a, b) { return a + Math.random() * (b - a); }
function dustResize() {
if (!dustCv || !dustCtx) return;
var DPR = Math.min(window.devicePixelRatio || 1, 2);
dustW = window.innerWidth; dustH = window.innerHeight;
dustCv.width = Math.round(dustW * DPR);
dustCv.height = Math.round(dustH * DPR);
dustCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
motes = [];
var n = Math.min(120, Math.round(dustW * dustH / 26000));
for (var i = 0; i < n; i++) {
motes.push({ x: Math.random() * dustW, y: Math.random() * dustH, r: rnd(.3, 1.4),
vx: rnd(-.08, .08), vy: rnd(-.14, -.02), a: rnd(.05, .35), tw: rnd(0, 6.28), ts: rnd(.004, .014) });
}
}
function dustFrame(now) {
if (!motionOn) { dustRaf = null; return; }
var dt = Math.min(now - dustLast, 60); dustLast = now;
var ctx = dustCtx, W = dustW, H = dustH;
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
meteors.push({ x: left ? rnd(0, W * .6) : rnd(W * .4, W), y: rnd(0, H * .5),
vx: (left ? 1 : -1) * rnd(9, 15), vy: rnd(4, 8), life: rnd(900, 1500) });
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
dustRaf = requestAnimationFrame(dustFrame);
}
function startDust() {
if (!dustCv) {
dustCv = UI.$('dust');
if (!dustCv || !dustCv.getContext) return;
dustCtx = dustCv.getContext('2d');
}
if (!dustBound) { dustBound = true; window.addEventListener('resize', dustResize, { passive: true }); }
dustResize();
if (!dustRaf) { dustLast = performance.now(); dustRaf = requestAnimationFrame(dustFrame); }
}
function stopDust() {
if (dustRaf) { cancelAnimationFrame(dustRaf); dustRaf = null; }
if (dustCtx) dustCtx.clearRect(0, 0, dustW, dustH);
motes = []; meteors = [];
}
UI.flare = function () {
if (!stage || !motionOn) return;
stage.classList.add('is-flare');
clearTimeout(flareOff);
flareOff = setTimeout(function () { stage.classList.remove('is-flare'); }, 2200);
};
function startFlares() {
if (flareTimer) return;
(function schedule() {
flareTimer = setTimeout(function () {
if (!motionOn) { flareTimer = null; return; }
UI.flare(); schedule();
}, 7000 + Math.random() * 9000);
})();
}
function stopFlares() {
clearTimeout(flareTimer); flareTimer = null;
clearTimeout(flareOff); flareOff = null;
if (stage) stage.classList.remove('is-flare');
}
UI.setMotion = function (on) {
motionOn = !!on;
document.body.classList.toggle('no-motion', !motionOn);
if (stage) stage.classList.toggle('calm', !motionOn);
if (motionOn) { startPara(); startDust(); startFlares(); }
else { stopPara(); stopDust(); stopFlares(); }
};
UI.motionEnabled = function () { return motionOn; };
UI.motionState = function () {
return { enabled: motionOn, dust: !!dustRaf, parallax: !!paraRaf, flares: !!flareTimer };
};
UI.prefersReducedMotion = function () {
try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
};
UI.initMotion = function () { startPara(); };
UI.initFlares = function () { startFlares(); };
UI.initDust = function () { startDust(); };

/* =========================================================
ПЛЕЕР. Источники: кэш выбранной папки (IndexedDB) → index.json
→ автоиндекс сервера → assets/audio/ambient.mp3.
Трек заканчивается — играет следующий, список идёт по кругу.
========================================================= */
UI.player = (function () {
var AUDIO_RE = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|weba|webm)$/i;
var tracks = [], idx = 0, audio = null, playing = false, muted = false, volume = .35;
var opened = false, root = null, opts = {}, source = 'поиск…', picker = null;
var failStreak = 0, scanning = false, urls = [], inited = false, wantPlay = false;

function pretty(filename) {
var n = String(filename || '');
try { n = decodeURIComponent(n); } catch (e) {}
n = n.replace(/\.[a-z0-9]+$/i, '');
n = n.replace(/_/g, ' ').replace(/\s+-\s+/g, ' — ').replace(/\s+/g, ' ').trim();
n = n.replace(/^\d{1,3}[\s.)\-—]+/, '').trim();
return n || String(filename || 'трек');
}
function lastSegment(u) {
var s = String(u).split('?')[0].split('#')[0].split('/').filter(Boolean).pop() || '';
try { return decodeURIComponent(s); } catch (e) { return s; }
}
function releaseUrls() {
urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
urls = [];
}
function setTracks(list, src) {
releaseUrls();
tracks = list.map(function (t, i) {
if (!t.id) t.id = 't' + i + ':' + t.name;
if (t.kind === 'file') urls.push(t.src);
return t;
});
source = src;
failStreak = 0;
if (idx >= tracks.length) idx = 0;
var want = opts.track;
if (want) {
for (var i = 0; i < tracks.length; i++) if (tracks[i].id === want) { idx = i; break; }
}
if (audio && tracks.length && !playing) audio.src = tracks[idx].src;
render(); emit();
}
function fileTrack(f) {
return { id: 'f:' + f.name + ':' + f.size, name: pretty(f.name), src: URL.createObjectURL(f), file: f, kind: 'file', ok: true };
}
function urlTrack(u) {
return { id: 'u:' + u, name: pretty(lastSegment(u)), src: u, kind: 'url', ok: true };
}

/* --- IndexedDB --- */
function db() {
return new Promise(function (res, rej) {
if (!G.indexedDB) return rej(new Error('no idb'));
var r = indexedDB.open('aumic', 1);
r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
r.onsuccess = function () { res(r.result); };
r.onerror = function () { rej(r.error); };
});
}
function idbSet(k, v) {
return db().then(function (d) {
return new Promise(function (res, rej) {
var tx = d.transaction('kv', 'readwrite');
tx.objectStore('kv').put(v, k);
tx.oncomplete = function () { res(true); };
tx.onerror = function () { rej(tx.error); };
});
});
}
function idbGet(k) {
return db().then(function (d) {
return new Promise(function (res, rej) {
var tx = d.transaction('kv', 'readonly');
var q = tx.objectStore('kv').get(k);
q.onsuccess = function () { res(q.result); };
q.onerror = function () { rej(q.error); };
});
});
}

/* --- ID3 --- */
function readTag(file) {
return new Promise(function (res) {
try {
var fr = new FileReader();
fr.onload = function () {
try {
var b = new Uint8Array(fr.result);
if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return res(null);
var ver = b[3];
var size = (b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9];
var p = 10, end = Math.min(10 + size, b.length), out = {};
while (p + 10 <= end) {
var id = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
if (!/^[A-Z0-9]{4}$/.test(id)) break;
var fs = ver === 4
? ((b[p + 4] << 21) | (b[p + 5] << 14) | (b[p + 6] << 7) | b[p + 7])
: ((b[p + 4] << 24) | (b[p + 5] << 16) | (b[p + 6] << 8) | b[p + 7]);
if (fs <= 0 || p + 10 + fs > end) break;
if (id === 'TIT2' || id === 'TPE1') {
var enc = b[p + 10], data = b.subarray(p + 11, p + 10 + fs), txt = '';
try {
if (enc === 0) txt = new TextDecoder('windows-1251').decode(data);
else if (enc === 1) txt = new TextDecoder('utf-16').decode(data);
else if (enc === 2) txt = new TextDecoder('utf-16be').decode(data);
else txt = new TextDecoder('utf-8').decode(data);
} catch (e) { txt = ''; }
txt = txt.replace(/\0/g, '').trim();
if (txt) out[id] = txt;
}
p += 10 + fs;
}
res(out.TIT2 ? (out.TPE1 ? out.TPE1 + ' — ' + out.TIT2 : out.TIT2) : null);
} catch (e) { res(null); }
};
fr.onerror = function () { res(null); };
fr.readAsArrayBuffer(file.slice(0, 131072));
} catch (e) { res(null); }
});
}
function readTags(list) {
var jobs = list.filter(function (t) { return t.file; }).slice(0, 60);
(function step(i) {
if (i >= jobs.length) return;
readTag(jobs[i].file).then(function (name) {
if (name) { jobs[i].name = name; render(); emit(); }
step(i + 1);
});
})(0);
}

/* --- сеть --- */
function fetchText(url) {
return new Promise(function (res) {
try {
fetch(url, { cache: 'no-store' }).then(function (r) {
return r.ok ? r.text() : null;
}).then(function (t) { res(t); }).catch(function () { res(null); });
} catch (e) { res(null); }
});
}
function parseListing(html, base) {
var out = [];
try {
var doc = new DOMParser().parseFromString(html, 'text/html');
var links = doc.querySelectorAll('a[href]');
for (var i = 0; i < links.length; i++) {
var href = links[i].getAttribute('href') || '';
if (!AUDIO_RE.test(href.split('?')[0])) continue;
var abs;
try { abs = new URL(href, base).href; } catch (e) { abs = href; }
if (out.indexOf(abs) < 0) out.push(abs);
}
} catch (e) {}
return out;
}
function parseManifest(text, base) {
var out = [];
try {
var j = JSON.parse(text);
var arr = Array.isArray(j) ? j : (j.tracks || j.files || []);
arr.forEach(function (x) {
if (typeof x === 'string') {
var u; try { u = new URL(x, base).href; } catch (e) { u = x; }
out.push({ id: 'u:' + u, name: pretty(lastSegment(u)), src: u, kind: 'url', ok: true });
} else if (x && x.src) {
var u2; try { u2 = new URL(x.src, base).href; } catch (e) { u2 = x.src; }
out.push({ id: 'u:' + u2, name: x.name || pretty(lastSegment(u2)), src: u2, kind: 'url', ok: true });
}
});
} catch (e) {}
return out;
}
function discoverNetwork() {
var base = new URL('assets/audio/', location.href).href;
var names = ['index.json', 'playlist.json', 'tracks.json'];
return (function next(i) {
if (i >= names.length) return Promise.resolve(null);
return fetchText(base + names[i]).then(function (t) {
if (t) {
var list = parseManifest(t, base);
if (list.length) return { list: list, src: names[i] };
}
return next(i + 1);
});
})(0).then(function (r) {
if (r) return r;
return fetchText(base).then(function (html) {
if (!html) return null;
var found = parseListing(html, base);
if (!found.length) return null;
return { list: found.map(urlTrack), src: 'папка на сервере' };
});
});
}
function fallback() {
return [{ id: 'u:default', name: 'R-7 · фон', src: 'assets/audio/ambient.mp3', kind: 'url', ok: true }];
}

/* --- управление --- */
function emit() {
var b = UI.$('btnMusic'), m = UI.$('btnMute');
if (b) {
b.classList.toggle('is-playing', playing && !muted);
b.title = tracks.length && tracks[idx] ? tracks[idx].name : 'Плеер';
}
if (m) {
m.textContent = muted ? 'ТИХО' : 'ЗВУК';
m.classList.toggle('is-muted', muted);
}
if (opts.onChange) opts.onChange({ volume: volume, mute: muted, track: tracks[idx] ? tracks[idx].id : null });
}
function armAgain() {
var go = function () {
document.removeEventListener('pointerdown', go);
if (wantPlay && !playing && !muted && tracks.length) play(idx);
};
document.addEventListener('pointerdown', go);
}
function markBad() {
if (!tracks[idx]) return;
tracks[idx].ok = false;
failStreak++;
render();
if (failStreak < tracks.length) play(idx + 1);
else { playing = false; wantPlay = false; emit(); UI.toast('Треки не читаются — укажи папку'); }
}
function play(i) {
if (!tracks.length || !audio) return;
idx = ((i % tracks.length) + tracks.length) % tracks.length;
var t = tracks[idx];
wantPlay = true;
audio.loop = false;
if (audio.src !== t.src) audio.src = t.src;
audio.volume = volume;
audio.muted = muted;
var p = audio.play();
if (p && p.then) {
p.then(function () { playing = true; failStreak = 0; emit(); render(); })
 .catch(function (err) {
   playing = false; emit(); render();
   if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) armAgain();
 });
} else { playing = true; }
emit(); render();
}
function pause() {
wantPlay = false;
if (audio) audio.pause();
playing = false; emit(); render();
}
function advance() {
if (!tracks.length) return;
play(idx + 1);
}

/* --- выпадашка --- */
function build() {
if (root) return root;
root = UI.el('div', 'mplayer');
root.id = 'mplayer';
var head = UI.el('div', 'mplayer__head');
head.appendChild(UI.el('span', '', 'Плеер'));
head.appendChild(UI.el('span', 'mplayer__src', ''));
root.appendChild(head);
root.appendChild(UI.el('div', 'mplayer__now', '—'));
root.appendChild(UI.el('div', 'mplayer__state', ''));
var ctrl = UI.el('div', 'mplayer__ctrl');
function cb(label, fn, test) {
var b = UI.el('button', 'btn btn--sm btn--ghost', label);
b.type = 'button';
if (test) b.setAttribute('data-test', test);
b.addEventListener('click', fn);
return b;
}
ctrl.appendChild(cb('⏮', function () { play(idx - 1); }, 'mprev'));
var pp = cb('▶', function () { playing ? pause() : play(idx); }, 'mplay');
ctrl.appendChild(pp);
ctrl.appendChild(cb('⏭', function () { play(idx + 1); }, 'mnext'));
var vol = UI.el('div', 'mplayer__vol');
var input = document.createElement('input');
input.type = 'range'; input.min = '0'; input.max = '100';
input.setAttribute('data-test', 'mvol');
input.addEventListener('input', function () { setVolume(Number(input.value) / 100); });
var out = UI.el('span', '', '35%');
vol.appendChild(input); vol.appendChild(out);
ctrl.appendChild(vol);
root.appendChild(ctrl);
root.appendChild(UI.el('div', 'mplayer__list'));
var foot = UI.el('div', 'mplayer__foot');
foot.appendChild(cb('Папка…', pickFolder, 'mfolder'));
foot.appendChild(cb('Обновить', refresh, 'mrefresh'));
foot.appendChild(cb('Закрыть', close, 'mclose'));
foot.appendChild(UI.el('div', 'mplayer__note', ''));
root.appendChild(foot);
root._pp = pp; root._vol = input; root._vout = out;
UI.$('stage').appendChild(root);
return root;
}
function render() {
if (!root) return;
root.querySelector('.mplayer__src').textContent = source;
root.querySelector('.mplayer__now').textContent = tracks[idx] ? tracks[idx].name : 'нет треков';
root.querySelector('.mplayer__state').textContent =
muted ? 'звук выключен' : playing ? 'играет · ' + (idx + 1) + '/' + tracks.length : 'пауза · ' + (idx + 1) + '/' + tracks.length;
root._pp.textContent = playing ? '❚❚' : '▶';
root._vol.value = String(Math.round(volume * 100));
root._vout.textContent = Math.round(volume * 100) + '%';
var list = root.querySelector('.mplayer__list');
UI.clear(list);
if (!tracks.length) list.appendChild(UI.el('div', 'mplayer__note', 'треков не найдено'));
tracks.forEach(function (t, i) {
var b = UI.el('button', 'mtrack' + (i === idx ? ' on' : '') + (t.ok ? '' : ' bad'));
b.type = 'button';
b.setAttribute('data-test', 'mtrack' + i);
b.appendChild(UI.el('span', 'mtrack__n', String(i + 1).padStart(2, '0')));
b.appendChild(UI.el('span', 'mtrack__t', t.name));
b.appendChild(UI.el('span', 'mtrack__b', t.ok ? (i === idx && playing ? '▶' : '') : 'нет файла'));
if (t.ok) b.addEventListener('click', function () { play(i); });
else b.disabled = true;
list.appendChild(b);
});
root.querySelector('.mplayer__note').textContent =
'Трек закончился — играет следующий. «Папка…» запоминает выбор, имена берутся из тегов.';
}
function open() { build(); opened = true; root.classList.add('is-open'); render(); }
function close() { if (root) root.classList.remove('is-open'); opened = false; }
function setVolume(v) {
volume = Math.max(0, Math.min(1, Number(v) || 0));
if (audio) audio.volume = volume;
render(); emit();
}
function setMute(b) {
muted = !!b;
if (audio) audio.muted = muted;
if (!muted && wantPlay && !playing && tracks.length) play(idx);
render(); emit();
}
function pickFolder() {
if (!picker) {
picker = document.createElement('input');
picker.type = 'file';
picker.multiple = true;
picker.setAttribute('webkitdirectory', '');
picker.setAttribute('directory', '');
picker.style.display = 'none';
document.body.appendChild(picker);
picker.addEventListener('change', function () {
var files = Array.prototype.slice.call(picker.files || [])
.filter(function (f) { return AUDIO_RE.test(f.name); })
.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
if (!files.length) { UI.toast('В папке нет аудиофайлов'); return; }
idx = 0;
setTracks(files.map(fileTrack), 'папка · ' + files.length);
readTags(tracks);
idbSet('musicFiles', files).catch(function () {});
UI.toast('Найдено треков: ' + files.length);
play(0);
picker.value = '';
});
}
picker.click();
}
function refresh() {
if (scanning) return;
scanning = true; source = 'поиск…'; render();
discoverNetwork().then(function (r) {
scanning = false;
if (r && r.list.length) { setTracks(r.list, r.src); UI.toast('Найдено треков: ' + r.list.length); }
else { render(); UI.toast('Автоиндекс недоступен — используй «Папка…»'); }
});
}
function init(o) {
if (inited) return;
inited = true;
opts = o || {};
audio = UI.$('amb');
volume = typeof opts.volume === 'number' ? opts.volume : .35;
muted = !!opts.mute;
if (audio) {
/* атрибут loop в HTML делает трек бесконечным — гасим принудительно */
audio.removeAttribute('loop');
audio.loop = false;
audio.volume = volume;
audio.muted = muted;
audio.addEventListener('ended', function () { advance(); });
audio.addEventListener('error', function () { if (audio.getAttribute('src')) markBad(); });
audio.addEventListener('play', function () { playing = true; emit(); render(); });
audio.addEventListener('pause', function () {
if (audio.ended) return;
playing = false; emit(); render();
});
}
setTracks(fallback(), 'файл');
build();
document.addEventListener('pointerdown', function (e) {
if (!opened) return;
var t = e.target;
if (root.contains(t)) return;
var bm = UI.$('btnMusic'), bu = UI.$('btnMute');
if ((bm && bm.contains(t)) || (bu && bu.contains(t))) return;
close();
}, true);
idbGet('musicFiles').then(function (files) {
if (files && files.length) {
setTracks(files.map(fileTrack), 'папка · кэш');
readTags(tracks);
return true;
}
return false;
}).catch(function () { return false; }).then(function (had) {
if (had) return;
return discoverNetwork().then(function (r) {
if (r && r.list.length) setTracks(r.list, r.src);
});
});
wantPlay = !muted;
armAgain();
emit();
}
return {
init: init, open: open, close: close,
toggle: function () { opened ? close() : open(); },
isOpen: function () { return opened; },
play: play, pause: pause, next: advance,
prev: function () { play(idx - 1); },
setVolume: setVolume, setMute: setMute,
isMuted: function () { return muted; },
pickFolder: pickFolder, refresh: refresh,
state: function () {
return { count: tracks.length, idx: idx, playing: playing, muted: muted,
volume: volume, source: source, loop: !!(audio && audio.loop) };
},
tracks: function () { return tracks.slice(); }
};
})();
UI.closePlayer = function () { UI.player.close(); };
UI.initAudio = function (file, volume) { UI.player.init({ volume: volume }); };

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
window.addEventListener('resize', sizeSpin, { passive: true });
};
})(window);
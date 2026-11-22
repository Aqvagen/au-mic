/* =========================================================
GrailOS · MaskLink — интерактивный справочник лора.
Экран: разделы → записи → чтение. Медиа: текст, аудио,
изображения, векторные схемы. Открытие записей выводится из
состояния игры (улики, предметы, зоны, флаги, уровень допуска).
Своё состояние хранит внутри сейва: st.codex.
========================================================= */
(function (G) {
'use strict';
var UI = G.UI;
var AU = G.AU;
var ST = AU.state;
var D = AU.D, L = AU.L;
var S = G.Screens = G.Screens || {};

var CX = null;
var view = { section: 'station', entry: null, q: '', filter: 'all', from: null, loc: null };
var audio = null, audioMeta = null, resumeMusic = false;
var lightbox = null, listIds = [], listPos = 0;

function data() {
  if (!CX) CX = D.CODEX || G.AU_CODEX || null;
  return CX;
}
function E() { var c = data(); return c ? c.entries : {}; }
function state() {
  var s = ST.S;
  if (!s) return null;
  if (!s.codex) s.codex = { found: {}, read: {}, seen: {}, lvl: 1 };
  s.codex.found = s.codex.found || {};
  s.codex.read = s.codex.read || {};
  s.codex.seen = s.codex.seen || {};
  return s.codex;
}
function hasItem(id) {
  var s = ST.S;
  if (L.hasItem) return L.hasItem(s, id);
  return (s.bag || []).indexOf(id) >= 0 || (s.questItems || []).indexOf(id) >= 0;
}

/* ---------- уровень доступа ---------- */
function level() {
  var s = ST.S, c = state();
  if (!s || !c) return 1;
  var lv = 1;
  if (s.flags && s.flags.unlock_server) lv = 2;
  if (lv >= 2 && s.facts && s.facts.f_core) lv = 3;
  if (c.lvl && c.lvl > lv) lv = c.lvl;
  c.lvl = Math.min(3, lv);
  return c.lvl;
}
function levelName(n) {
  var c = data();
  var l = c && c.levels.filter(function (x) { return x.n === n; })[0];
  return l ? l.name : 'УРОВЕНЬ ' + n;
}

/* ---------- открытие записей ---------- */
function met(d) {
  var s = ST.S;
  if (!s) return false;
  if (!d || d.always) return true;
  if (d.any) return d.any.some(met);
  if (d.hero && s.hero !== d.hero) return false;
  if (d.fact && !(s.facts && s.facts[d.fact])) return false;
  if (d.facts && !d.facts.every(function (f) { return s.facts && s.facts[f]; })) return false;
  if (d.item && !hasItem(d.item)) return false;
  if (d.flag && !(s.flags && s.flags[d.flag])) return false;
  if (d.location) {
    var c = state();
    var seen = c.seen[d.location] || ST.loc === d.location;
    if (!seen) {
      Object.keys(D.QUESTS || {}).forEach(function (q) {
        var qq = D.QUESTS[q], ss = s.quests && s.quests[q];
        if (qq.where === d.location && ss && (ss.started || ss.done)) seen = true;
      });
    }
    if (!seen) return false;
  }
  if (d.quest) {
    var qs = s.quests && s.quests[d.quest.id];
    if (!qs || !qs.done) return false;
    if (d.quest.branch && qs.branch !== d.quest.branch) return false;
  }
  return true;
}
function sync() {
  var c = state();
  if (!c) return [];
  if (ST.loc) c.seen[ST.loc] = true;
  var fresh = [];
  var e = E();
  Object.keys(e).forEach(function (id) {
    if (c.found[id]) return;
    if (met(e[id].discover)) { c.found[id] = Date.now(); fresh.push(id); }
  });
  level();
  badge();
  return fresh;
}
function isOpen(id) {
  var c = state(), e = E()[id];
  return !!(c && e && c.found[id] && level() >= (e.access || 1));
}
function statusOf(id) {
  var c = state(), e = E()[id];
  if (!c || !e) return 'missing';
  if (!c.found[id]) return e.secret ? 'hidden' : 'missing';
  if (level() < (e.access || 1)) return 'locked';
  return c.read[id] ? 'read' : 'new';
}
function sourceLabel(e) {
  var d = e.discover || {};
  function one(x) {
    if (!x || x.always) return 'справочный раздел';
    if (x.any) return x.any.map(one).filter(Boolean).join(' · ');
    if (x.fact) return 'улика: ' + ((D.FACTS && D.FACTS[x.fact] && D.FACTS[x.fact].name) || x.fact);
    if (x.facts) return 'улики: ' + x.facts.map(function (f) {
      return (D.FACTS && D.FACTS[f] && D.FACTS[f].name) || f;
    }).join(', ');
    if (x.item) return 'предмет: ' + ((D.ITEMS && D.ITEMS[x.item] && D.ITEMS[x.item].name) || x.item);
    if (x.location) {
      var l = (D.LOCATIONS || []).filter(function (y) { return y.id === x.location; })[0];
      return 'зона: ' + (l ? l.name : x.location);
    }
    if (x.flag) return 'служебный допуск';
    if (x.hero) return 'личное дело: ' + ((D.HEROES && D.HEROES[x.hero] && D.HEROES[x.hero].name) || x.hero);
    if (x.quest) return 'дело: ' + ((D.QUESTS && D.QUESTS[x.quest.id] && D.QUESTS[x.quest.id].title) || x.quest.id);
    return '';
  }
  return one(d);
}

/* ---------- бейдж HUD ---------- */
function unread() {
  var c = state(); if (!c) return 0;
  var n = 0;
  Object.keys(c.found).forEach(function (id) {
    if (!c.read[id] && isOpen(id)) n++;
  });
  return n;
}
function badge() {
  var b = UI.$('cxBadge');
  if (!b) return;
  var n = unread();
  b.textContent = String(n);
  b.classList.toggle('hidden', n === 0);
  var btn = UI.$('btnCodex');
  if (btn) btn.classList.toggle('has-new', n > 0);
}

/* ---------- медиа ---------- */
function stopAudio(restore) {
  if (audio) {
    try { audio.pause(); } catch (e) {}
    audio.removeAttribute('src');
    try { audio.load(); } catch (e) {}
  }
  if (restore && resumeMusic && UI.player && UI.player.state && !UI.player.state().muted) {
    UI.player.play(UI.player.state().idx);
  }
  resumeMusic = false;
  audioMeta = null;
}
function ensureAudio() {
  if (audio) return audio;
  audio = document.createElement('audio');
  audio.preload = 'none';
  audio.addEventListener('ended', function () {
    if (audioMeta) { audioMeta.btn.textContent = '▶'; audioMeta.bar.style.width = '100%'; }
    stopAudio(true);
    badge();
  });
  audio.addEventListener('timeupdate', function () {
    if (!audioMeta || !audio.duration) return;
    var p = audio.currentTime / audio.duration;
    audioMeta.bar.style.width = (p * 100).toFixed(1) + '%';
    audioMeta.time.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  });
  audio.addEventListener('error', function () {
    if (!audioMeta) return;
    audioMeta.row.classList.add('is-broken');
    audioMeta.note.textContent = 'файл записи недоступен · расшифровка ниже';
    audioMeta.btn.disabled = true;
    audioMeta.tr.classList.add('is-open');
  });
  return audio;
}
function fmt(t) {
  if (!isFinite(t)) return '0:00';
  var m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}
function closeLightbox() {
  if (lightbox && lightbox.parentNode) lightbox.parentNode.removeChild(lightbox);
  lightbox = null;
}
function openLightbox(src, caption) {
  closeLightbox();
  lightbox = UI.el('div', 'cx-lb');
  var img = UI.img(src, 'cx-lb__img', caption || '');
  lightbox.appendChild(img);
  if (caption) lightbox.appendChild(UI.el('div', 'cx-lb__cap', caption));
  var close = UI.el('button', 'cx-lb__x', '✕');
  close.type = 'button';
  close.addEventListener('click', function (ev) { ev.stopPropagation(); closeLightbox(); });
  lightbox.appendChild(close);
  lightbox.addEventListener('click', function () { closeLightbox(); });
  UI.$('stage').appendChild(lightbox);
}

/* ---------- векторные схемы ---------- */
var NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  var n = document.createElementNS(NS, tag);
  Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
  return n;
}
function drawSectors() {
  var c = data();
  var box = UI.el('div', 'cx-map');
  var svg = svgEl('svg', { viewBox: '0 0 620 300', class: 'cx-map__svg', preserveAspectRatio: 'xMidYMid meet' });
  var pos = {
    arrival: { x: 20, y: 20, w: 180, h: 110 },
    cocoon: { x: 220, y: 20, w: 200, h: 110 },
    heart: { x: 440, y: 20, w: 160, h: 110 },
    iron: { x: 20, y: 160, w: 280, h: 120 },
    root: { x: 320, y: 160, w: 280, h: 120 }
  };
  [['arrival', 'cocoon'], ['cocoon', 'heart'], ['arrival', 'iron'], ['cocoon', 'root'], ['heart', 'root']]
    .forEach(function (p) {
      var a = pos[p[0]], b = pos[p[1]];
      svg.appendChild(svgEl('line', {
        x1: a.x + a.w / 2, y1: a.y + a.h / 2, x2: b.x + b.w / 2, y2: b.y + b.h / 2,
        class: 'cx-map__link'
      }));
    });
  (c.sectors || []).forEach(function (sec) {
    var p = pos[sec.id]; if (!p) return;
    var target = 'cx_sec_' + sec.id;
    var g = svgEl('g', { class: 'cx-map__sec', tabindex: '0', role: 'button' });
    g.appendChild(svgEl('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: 2 }));
    var t = svgEl('text', { x: p.x + 14, y: p.y + 30, class: 'cx-map__name' });
    t.textContent = sec.name;
    g.appendChild(t);
    var words = sec.desc.split(' ');
    var line = '', rows = [];
    words.forEach(function (w) {
      if ((line + ' ' + w).trim().length > 26) { rows.push(line.trim()); line = w; }
      else line += ' ' + w;
    });
    if (line.trim()) rows.push(line.trim());
    rows.slice(0, 3).forEach(function (r, i) {
      var d = svgEl('text', { x: p.x + 14, y: p.y + 52 + i * 15, class: 'cx-map__desc' });
      d.textContent = r;
      g.appendChild(d);
    });
    var known = sec.rooms.filter(function (r) {
      return (D.LOCATIONS || []).some(function (l) { return l.id === r; });
    }).length;
    var cnt = svgEl('text', { x: p.x + p.w - 14, y: p.y + p.h - 12, class: 'cx-map__cnt' });
    cnt.textContent = known ? known + ' пом.' : '—';
    g.appendChild(cnt);
    function go() { if (E()[target]) select(target); }
    g.addEventListener('click', go);
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') go(); });
    svg.appendChild(g);
  });
  box.appendChild(svg);
  var leg = UI.el('div', 'cx-map__leg');
  leg.appendChild(UI.el('span', '', '— переход'));
  leg.appendChild(UI.el('span', '', 'клик по сектору — карточка'));
  box.appendChild(leg);
  return box;
}
function drawStation() {
  var box = UI.el('div', 'cx-map');
  var svg = svgEl('svg', { viewBox: '0 0 620 220', class: 'cx-map__svg' });
  svg.appendChild(svgEl('ellipse', { cx: 310, cy: 110, rx: 290, ry: 84, class: 'cx-map__hull' }));
  svg.appendChild(svgEl('ellipse', { cx: 310, cy: 110, rx: 210, ry: 58, class: 'cx-map__hull2' }));
  svg.appendChild(svgEl('line', { x1: 20, y1: 110, x2: 600, y2: 110, class: 'cx-map__axis' }));
  [[110, 'ПРИБЫТИЕ'], [220, 'КОКОН'], [330, 'СЕРДЦЕ'], [440, 'ЖЕЛЕЗО'], [540, 'КОРЕНЬ']].forEach(function (p) {
    svg.appendChild(svgEl('line', { x1: p[0], y1: 34, x2: p[0], y2: 186, class: 'cx-map__bulk' }));
    var t = svgEl('text', { x: p[0] + 6, y: 26, class: 'cx-map__tick' });
    t.textContent = p[1];
    svg.appendChild(t);
  });
  var core = svgEl('circle', { cx: 330, cy: 110, r: 9, class: 'cx-map__core' });
  svg.appendChild(core);
  var cl = svgEl('text', { x: 330, y: 200, class: 'cx-map__tick', 'text-anchor': 'middle' });
  cl.textContent = 'GrailOS';
  svg.appendChild(cl);
  box.appendChild(svg);
  return box;
}
function drawMask() {
  var box = UI.el('div', 'cx-map');
  var svg = svgEl('svg', { viewBox: '0 0 620 240', class: 'cx-map__svg' });
  svg.appendChild(svgEl('path', {
    d: 'M210 40 Q310 20 410 40 L430 130 Q310 200 190 130 Z', class: 'cx-map__mask'
  }));
  svg.appendChild(svgEl('path', { d: 'M240 90 Q310 74 380 90', class: 'cx-map__visor' }));
  svg.appendChild(svgEl('circle', { cx: 310, cy: 132, r: 12, class: 'cx-map__core' }));
  [['ID · биометрия', 150, 60, 208, 62], ['ДОСТУП · замки', 150, 110, 196, 118],
   ['UCU · учёт', 470, 60, 414, 62], ['GrailOS · справочник', 470, 110, 424, 118]].forEach(function (p) {
    svg.appendChild(svgEl('line', { x1: p[3], y1: p[4], x2: p[1] < 300 ? p[1] + 118 : p[1] - 8, y2: p[2], class: 'cx-map__axis' }));
    var t = svgEl('text', { x: p[1], y: p[2] - 6, class: 'cx-map__tick', 'text-anchor': p[1] < 300 ? 'end' : 'start' });
    t.textContent = p[0];
    svg.appendChild(t);
  });
  box.appendChild(svg);
  return box;
}
function drawDeck() {
  var box = UI.el('div', 'cx-map');
  var svg = svgEl('svg', { viewBox: '0 0 620 220', class: 'cx-map__svg' });
  svg.appendChild(svgEl('rect', { x: 30, y: 30, width: 560, height: 160, rx: 2, class: 'cx-map__hull2' }));
  [['ПРИЛАВОК', 60, 60, 150, 60], ['ЯЩИК', 240, 60, 110, 60], ['ШАТТЛ', 390, 50, 170, 110],
   ['АНТЕННА', 60, 140, 150, 34]].forEach(function (p) {
    svg.appendChild(svgEl('rect', { x: p[1], y: p[2], width: p[3], height: p[4], rx: 2, class: 'cx-map__room' }));
    var t = svgEl('text', { x: p[1] + 10, y: p[2] + 22, class: 'cx-map__tick' });
    t.textContent = p[0];
    svg.appendChild(t);
  });
  svg.appendChild(svgEl('circle', { cx: 135, cy: 157, r: 6, class: 'cx-map__core' }));
  box.appendChild(svg);
  return box;
}
var DRAW = { sectors: drawSectors, station: drawStation, mask: drawMask, deck: drawDeck };

/* ---------- динамические разделы ---------- */
function dynamicBlock(kind) {
  var s = ST.S, c = state(), lv = level();
  var wrap = UI.el('div', 'cx-dyn');
  if (kind === 'profile') {
    var active = !!(s.flags && s.flags.mask_active !== false);
    if (!active) {
      wrap.appendChild(UI.el('div', 'cx-dyn__off', 'ПРОФИЛЬ НЕ АКТИВИРОВАН'));
      wrap.appendChild(UI.el('div', 'hint', 'Для активации профиля обратитесь к сотруднику регистрационной службы.'));
      return wrap;
    }
    var h = D.HEROES[s.hero];
    var status = s.hero === 'selin' ? 'зарегистрированный прибывший' : 'сотрудник станции';
    wrap.appendChild(UI.el('div', 'cx-dyn__name', h.name.toUpperCase()));
    var kv = UI.el('div', 'cx-kv');
    var rows = [['Статус', status], ['Идентификатор', 'MaskLink активирован'],
      ['Оператор', 'GrailTech'], ['Учётная запись UCU', 'активна'],
      ['Уровень доступа', lv + ' · ' + levelName(lv)]];
    if (s.hero === 'garik') {
      rows.push(['Дополнительный статус', 'дополнительная проверка']);
      rows.push(['Ограничения', 'доступ к отдельным зонам и оборудованию может быть ограничен']);
      rows.push(['Изъято при досмотре', 'несколько чипов и компонентов']);
    }
    rows.forEach(function (r) {
      var row = UI.el('div', 'cx-kv__row');
      row.appendChild(UI.el('span', 'cx-kv__k', r[0]));
      row.appendChild(UI.el('b', 'cx-kv__v', r[1]));
      kv.appendChild(row);
    });
    wrap.appendChild(kv);
    wrap.appendChild(UI.el('div', 'cx-redact__why', 'Дополнительная информация ограничена условиями вашего контракта.'));
    return wrap;
  }
  if (kind === 'ucu') {
    var active2 = !!(s.flags && s.flags.mask_active !== false);
    var kv2 = UI.el('div', 'cx-kv');
    [['Баланс', active2 ? s.credits + ' кр.' : 'профиль не активирован'],
     ['Операции', active2 ? 'фиксируются системой внутреннего учёта' : 'недоступны'],
     ['Идентификатор', active2 ? 'MaskLink · активен' : 'не выдан']].forEach(function (r) {
      var row = UI.el('div', 'cx-kv__row');
      row.appendChild(UI.el('span', 'cx-kv__k', r[0]));
      row.appendChild(UI.el('b', 'cx-kv__v', r[1]));
      kv2.appendChild(row);
    });
    wrap.appendChild(kv2);
    return wrap;
  }
  if (kind === 'access') {
    var cd = data();
    (cd.levels || []).forEach(function (l) {
      var row = UI.el('div', 'cx-lvl' + (l.n === lv ? ' is-now' : l.n < lv ? ' is-have' : ' is-need'));
      row.appendChild(UI.el('span', 'cx-lvl__n', String(l.n)));
      var m = UI.el('div', 'cx-lvl__m');
      m.appendChild(UI.el('div', 'cx-lvl__t', l.name));
      m.appendChild(UI.el('div', 'cx-lvl__d', l.desc));
      m.appendChild(UI.el('div', 'cx-lvl__h', 'условие: ' + l.how));
      row.appendChild(m);
      row.appendChild(UI.el('span', 'cx-lvl__s', l.n === lv ? 'текущий' : l.n < lv ? 'пройден' : 'закрыт'));
      wrap.appendChild(row);
    });
    return wrap;
  }
  return wrap;
}

/* ---------- рендер блоков ---------- */
function renderBlocks(host, blocks) {
  (blocks || []).forEach(function (b, bi) {
    if (b.t === 'p') host.appendChild(UI.el('p', 'cx-p', b.text));
    else if (b.t === 'h') host.appendChild(UI.el('h3', 'cx-h', b.text));
    else if (b.t === 'note') host.appendChild(UI.el('div', 'cx-note', b.text));
    else if (b.t === 'stamp') host.appendChild(UI.el('div', 'cx-stamp', b.text));
    else if (b.t === 'quote') {
      var q = UI.el('blockquote', 'cx-quote');
      q.appendChild(UI.el('p', '', b.text));
      if (b.by) q.appendChild(UI.el('cite', '', b.by));
      host.appendChild(q);
    } else if (b.t === 'list' || b.t === 'num') {
      var ul = UI.el(b.t === 'num' ? 'ol' : 'ul', 'cx-list');
      (b.items || []).forEach(function (t) { ul.appendChild(UI.el('li', '', t)); });
      host.appendChild(ul);
    } else if (b.t === 'kv') {
      var kv = UI.el('div', 'cx-kv');
      (b.rows || []).forEach(function (r) {
        var row = UI.el('div', 'cx-kv__row');
        row.appendChild(UI.el('span', 'cx-kv__k', r[0]));
        row.appendChild(UI.el('b', 'cx-kv__v', r[1]));
        kv.appendChild(row);
      });
      host.appendChild(kv);
    } else if (b.t === 'redact') {
      var need = b.level || 2;
      var box = UI.el('div', 'cx-redact' + (level() >= need ? ' is-open' : ''));
      box.appendChild(UI.el('div', 'cx-redact__bar', level() >= need ? 'РАСКРЫТО · УРОВЕНЬ ' + need : '████ ███████ ████'));
      if (level() >= need) box.appendChild(UI.el('p', 'cx-p', b.text));
      else box.appendChild(UI.el('div', 'cx-redact__why', b.reason || 'ограничено условиями вашего контракта'));
      host.appendChild(box);
    } else if (b.t === 'link') {
      var lb = UI.el('button', 'cx-link', '→ ' + (b.text || (E()[b.to] && E()[b.to].title) || b.to));
      lb.type = 'button';
      lb.addEventListener('click', function () { select(b.to); });
      host.appendChild(lb);
    } else if (b.t === 'image') {
      var fig = UI.el('figure', 'cx-fig');
      var im = UI.img(b.src, 'cx-fig__img', b.caption || '');
      im.addEventListener('click', function () { openLightbox(b.src, b.caption); });
      im.addEventListener('error', function () {
        fig.classList.add('is-broken');
        fig.appendChild(UI.el('div', 'cx-fig__miss', 'изображение недоступно'));
      });
      fig.appendChild(im);
      if (b.caption) fig.appendChild(UI.el('figcaption', 'cx-fig__cap', b.caption));
      host.appendChild(fig);
    } else if (b.t === 'svg') {
      var f = DRAW[b.draw];
      if (f) {
        var w = f();
        if (b.caption) w.appendChild(UI.el('div', 'cx-fig__cap', b.caption));
        host.appendChild(w);
      }
    } else if (b.t === 'audio') {
      host.appendChild(audioBlock(b, bi));
    }
  });
}
function audioBlock(b, bi) {
  var row = UI.el('div', 'cx-audio');
  row.setAttribute('data-test', 'cxaudio' + bi);
  var top = UI.el('div', 'cx-audio__top');
  var btn = UI.el('button', 'cx-audio__btn', '▶');
  btn.type = 'button';
  top.appendChild(btn);
  var meta = UI.el('div', 'cx-audio__meta');
  meta.appendChild(UI.el('div', 'cx-audio__t', b.title || 'запись'));
  var note = UI.el('div', 'cx-audio__note', 'служебная аудиозапись');
  meta.appendChild(note);
  top.appendChild(meta);
  var time = UI.el('span', 'cx-audio__time', '0:00');
  top.appendChild(time);
  row.appendChild(top);
  var track = UI.el('div', 'cx-audio__track');
  var bar = UI.el('i', 'cx-audio__bar');
  track.appendChild(bar);
  row.appendChild(track);
  var trBtn = UI.el('button', 'cx-audio__trbtn', 'Расшифровка');
  trBtn.type = 'button';
  var tr = UI.el('div', 'cx-audio__tr');
  (b.transcript || []).forEach(function (t) { tr.appendChild(UI.el('p', '', t)); });
  trBtn.addEventListener('click', function () { tr.classList.toggle('is-open'); });
  row.appendChild(trBtn);
  row.appendChild(tr);
  audioMeta = { row: row, btn: btn, bar: bar, time: time, note: note, tr: tr };
  btn.addEventListener('click', function () {
    var a = ensureAudio();
    if (audioMeta && audioMeta.row === row && !a.paused) {
      a.pause(); btn.textContent = '▶';
      stopAudio(true);
      return;
    }
    stopAudio(false);
    audioMeta = { row: row, btn: btn, bar: bar, time: time, note: note, tr: tr };
    if (UI.player && UI.player.state && UI.player.state().playing) {
      resumeMusic = true;
      UI.player.pause();
    }
    a.src = b.src;
    a.volume = (AU.getSettings && AU.getSettings().volume) || 0.5;
    var p = a.play();
    btn.textContent = '❚❚';
    if (p && p.catch) p.catch(function () {
      note.textContent = 'воспроизведение заблокировано · нажми ещё раз';
      btn.textContent = '▶';
    });
  });
  track.addEventListener('click', function (ev) {
    if (!audio || !audio.duration || !audioMeta || audioMeta.row !== row) return;
    var r = track.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * audio.duration;
  });
  return row;
}

/* ---------- список ---------- */
function visibleEntries() {
  var c = state(), e = E(), out = [];
  var q = view.q.trim().toLowerCase();
  Object.keys(e).forEach(function (id) {
    var st = statusOf(id);
    if (st === 'hidden') return;
    var en = e[id];
    if (view.q) {
      var hay = (en.title + ' ' + (en.tags || []).join(' ')).toLowerCase();
      if (st === 'read' || st === 'new') {
        hay += ' ' + (en.blocks || []).map(function (b) {
          return b.text || (b.items || []).join(' ') || (b.transcript || []).join(' ') || '';
        }).join(' ').toLowerCase();
      }
      if (hay.indexOf(q) < 0) return;
    } else if (en.section !== view.section) return;
    if (view.filter === 'new' && st !== 'new') return;
    if (view.filter === 'locked' && st !== 'locked') return;
    if (view.filter === 'missing' && st !== 'missing') return;
    if (view.filter === 'audio' && en.kind !== 'audio') return;
    if (view.filter === 'visual' && en.kind !== 'image' && en.kind !== 'map') return;
    out.push(id);
  });
  var order = { new: 0, locked: 1, read: 2, missing: 3 };
  out.sort(function (a, b) {
    var d = order[statusOf(a)] - order[statusOf(b)];
    if (d) return d;
    return E()[a].title.localeCompare(E()[b].title, 'ru');
  });
  return out;
}
var KIND_ICON = { text: '▤', document: '▦', audio: '◉', image: '◧', map: '◈', dossier: '◍' };
var KIND_NAME = { text: 'статья', document: 'документ', audio: 'аудио', image: 'изображение', map: 'схема', dossier: 'досье' };

/* ---------- экран ---------- */
S.showCodex = function (entryId) {
  if (!ST.S) { UI.toast('Нет активного сеанса'); return; }
  if (!data()) { UI.toast('Справочник не загружен'); return; }
  if (ST.screen !== 'codex') { view.from = ST.screen; view.loc = ST.loc; }
  var fresh = sync();
  if (fresh.length) UI.toast('GrailOS: новых записей — ' + fresh.length);
  stopAudio(false);
  closeLightbox();
  if (entryId && E()[entryId]) {
    view.entry = entryId;
    view.section = E()[entryId].section;
  }
  if (!view.entry) {
    var first = visibleEntries().filter(function (id) { return isOpen(id); })[0];
    view.entry = first || visibleEntries()[0] || null;
  }
  UI.setHudVisible(true);
  if (ST.S.flags && ST.S.flags.mask_active === false) UI.setWhere('GrailOS · режим чтения');   
  UI.updateHud(ST.S, L, D);
  UI.setWhere('GrailOS · справочник');
  var root = UI.mount('codex');
  root.appendChild(buildHead());
  var wrap = UI.el('div', 'cx');
  wrap.appendChild(buildRail());
  wrap.appendChild(buildList());
  wrap.appendChild(buildReader());
  root.appendChild(wrap);
  if (view.entry) markRead(view.entry);
  badge();
};

function buildHead() {
  var c = state(), e = E();
  var total = Object.keys(e).length;
  var found = Object.keys(c.found).length;
  var read = Object.keys(c.read).filter(function (id) { return e[id]; }).length;
  var pct = total ? Math.round(found / total * 100) : 0;
  var head = UI.el('div', 'cx-head');
  var left = UI.el('div', 'cx-head__l');
  left.appendChild(UI.el('p', 'kicker', 'GRAILTECH · СИСТЕМА ВНУТРЕННЕГО ИНФОРМИРОВАНИЯ'));
  left.appendChild(UI.el('h1', 'cx-head__title', 'GrailOS'));
  left.appendChild(UI.el('div', 'cx-head__sub', 'TAU-SIGMA R-7 · MaskLink активен · доступ ' + level() + ' · ' + levelName(level())));
  head.appendChild(left);
  var right = UI.el('div', 'cx-head__r');
  var prog = UI.el('div', 'cx-prog');
  prog.appendChild(UI.el('div', 'cx-prog__n', found + ' / ' + total));
  var bar = UI.el('div', 'cx-prog__bar');
  var fill = UI.el('i');
  fill.style.width = pct + '%';
  bar.appendChild(fill);
  prog.appendChild(bar);
  prog.appendChild(UI.el('div', 'cx-prog__l', 'найдено ' + pct + '% · прочитано ' + read));
  right.appendChild(prog);
  var back = UI.el('button', 'btn btn--sm btn--ghost', '← Выйти');
  back.type = 'button';
  back.setAttribute('data-test', 'cxback');
  back.addEventListener('click', exit);
  right.appendChild(back);
  head.appendChild(right);
  return head;
}

function buildRail() {
  var c = data(), st = state();
  var rail = UI.el('div', 'cx-rail');
  var search = UI.el('div', 'cx-search');
  var input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'поиск по справочнику  /';
  input.value = view.q;
  input.id = 'cxSearch';
  input.addEventListener('input', function () {
    view.q = input.value;
    refreshList();
  });
  search.appendChild(input);
  rail.appendChild(search);

  var chips = UI.el('div', 'cx-chips');
  [['all', 'Всё'], ['new', 'Новые'], ['locked', 'Закрытые'], ['missing', 'Не найдено'],
   ['audio', 'Аудио'], ['visual', 'Схемы']].forEach(function (f) {
    var b = UI.el('button', 'cx-chip' + (view.filter === f[0] ? ' on' : ''), f[1]);
    b.type = 'button';
    b.addEventListener('click', function () { view.filter = f[0]; S.showCodex(view.entry); });
    chips.appendChild(b);
  });
  rail.appendChild(chips);

  var nav = UI.el('div', 'cx-nav');
  c.sections.forEach(function (sec) {
    var ids = Object.keys(c.entries).filter(function (id) { return c.entries[id].section === sec.id; });
    var vis = ids.filter(function (id) { return statusOf(id) !== 'hidden'; });
    var got = ids.filter(function (id) { return st.found[id]; }).length;
    var b = UI.el('button', 'cx-nav__i' + (view.section === sec.id && !view.q ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('data-test', 'cxsec_' + sec.id);
    var m = UI.el('div', 'cx-nav__m');
    m.appendChild(UI.el('div', 'cx-nav__t', sec.title));
    m.appendChild(UI.el('div', 'cx-nav__h', sec.hint));
    b.appendChild(m);
    b.appendChild(UI.el('span', 'cx-nav__c', got + '/' + vis.length));
    b.addEventListener('click', function () {
      view.q = ''; view.section = sec.id; view.entry = null;
      S.showCodex();
    });
    nav.appendChild(b);
  });
  rail.appendChild(nav);
  rail.appendChild(UI.el('div', 'cx-rail__foot', 'записи открываются уликами, предметами и посещёнными зонами'));
  return rail;
}

function buildList() {
  var box = UI.el('div', 'cx-list');
  box.id = 'cxList';
  listIds = visibleEntries();
  if (!listIds.length) {
    box.appendChild(UI.el('div', 'empty', view.q ? 'ничего не найдено' : 'в разделе пока нет записей'));
    return box;
  }
  listIds.forEach(function (id, i) {
    var en = E()[id], st = statusOf(id);
    var b = UI.el('button', 'cx-row cx-row--' + st + (view.entry === id ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('data-test', 'cxrow_' + id);
    b.appendChild(UI.el('span', 'cx-row__i', KIND_ICON[en.kind] || '▤'));
    var m = UI.el('div', 'cx-row__m');
    m.appendChild(UI.el('div', 'cx-row__t', st === 'missing' ? '████ ███████' : en.title));
    m.appendChild(UI.el('div', 'cx-row__s',
      st === 'missing' ? 'не найдено · ' + sourceLabel(en)
        : st === 'locked' ? 'нужен доступ ' + en.access + ' · ' + levelName(en.access)
          : KIND_NAME[en.kind] + (en.secret ? ' · вне описи' : '')));
    b.appendChild(m);
    b.appendChild(UI.el('span', 'cx-row__b',
      st === 'new' ? 'новое' : st === 'locked' ? '🔒' : st === 'missing' ? '—' : ''));
    b.addEventListener('click', function () { listPos = i; select(id); });
    box.appendChild(b);
  });
  return box;
}
function refreshList() {
  var old = UI.$('cxList');
  if (!old) return;
  var fresh = buildList();
  old.parentNode.replaceChild(fresh, old);
}

function buildReader() {
  var box = UI.el('div', 'cx-read');
  box.id = 'cxRead';
  var id = view.entry;
  if (!id || !E()[id]) {
    box.appendChild(UI.el('div', 'empty', 'выбери запись слева'));
    return box;
  }
  var en = E()[id], st = statusOf(id);
  var head = UI.el('div', 'cx-read__head');
  head.appendChild(UI.el('div', 'cx-read__kick', (data().sections.filter(function (s) { return s.id === en.section; })[0] || {}).kicker || ''));
  head.appendChild(UI.el('h2', 'cx-read__title', st === 'missing' ? 'ЗАПИСЬ НЕ НАЙДЕНА' : en.title));
  var meta = UI.el('div', 'cx-read__meta');
  [[KIND_NAME[en.kind] || en.kind], ['доступ ' + (en.access || 1)], [sourceLabel(en)]].forEach(function (x) {
    meta.appendChild(UI.el('span', 'cx-tag', x[0]));
  });
  head.appendChild(meta);
  box.appendChild(head);

  if (st === 'missing') {
    var lock = UI.el('div', 'cx-lock');
    lock.appendChild(UI.el('div', 'cx-lock__t', 'Нет данных'));
    lock.appendChild(UI.el('p', 'cx-p', 'Запись существует в описи GrailOS, но её содержимое ещё не получено.'));
    lock.appendChild(UI.el('div', 'cx-lock__how', 'источник: ' + sourceLabel(en)));
    box.appendChild(lock);
    return box;
  }
  if (st === 'locked') {
    var lock2 = UI.el('div', 'cx-lock');
    lock2.appendChild(UI.el('div', 'cx-lock__t', 'Ограничено уровнем доступа'));
    lock2.appendChild(UI.el('p', 'cx-p', 'Запись получена, но чтение требует уровня ' + en.access + ' · ' + levelName(en.access) + '.'));
    var lv = (data().levels || []).filter(function (l) { return l.n === en.access; })[0];
    if (lv) lock2.appendChild(UI.el('div', 'cx-lock__how', 'условие: ' + lv.how));
    var toAccess = UI.el('button', 'cx-link', '→ Уровни доступа');
    toAccess.type = 'button';
    toAccess.addEventListener('click', function () { select('cx_access'); });
    lock2.appendChild(toAccess);
    box.appendChild(lock2);
    return box;
  }

  var body = UI.el('div', 'cx-read__body');
  if (en.dynamic) body.appendChild(dynamicBlock(en.dynamic));
  renderBlocks(body, en.blocks);
  var hv = en.hero && en.hero[ST.S.hero];
  if (hv) renderBlocks(body, hv.blocks);
  box.appendChild(body);

  var react = en.react && en.react[ST.S.hero];
  if (react && react.length) {
    var r = UI.el('div', 'cx-react');
    r.appendChild(UI.el('div', 'cx-react__t', 'ВНУТРЕННЯЯ РЕАКЦИЯ · ' + D.HEROES[ST.S.hero].name.toUpperCase()));
    react.forEach(function (t) { r.appendChild(UI.el('p', '', t)); });
    box.appendChild(r);
  }

  if (en.related && en.related.length) {
    var rel = UI.el('div', 'cx-rel');
    rel.appendChild(UI.el('div', 'cx-rel__t', 'Связанные записи'));
    var row = UI.el('div', 'cx-rel__row');
    en.related.forEach(function (rid) {
      if (!E()[rid]) return;
      var rst = statusOf(rid);
      if (rst === 'hidden') return;
      var b = UI.el('button', 'cx-rel__i' + (rst === 'missing' ? ' is-miss' : rst === 'locked' ? ' is-lock' : ''),
        rst === 'missing' ? '████ ████' : E()[rid].title);
      b.type = 'button';
      b.addEventListener('click', function () { select(rid); });
      row.appendChild(b);
    });
    rel.appendChild(row);
    box.appendChild(rel);
  }

  var nav = UI.el('div', 'cx-read__nav');
  var idx = listIds.indexOf(id);
  var prev = UI.el('button', 'btn btn--sm btn--ghost', '← предыдущая');
  prev.type = 'button';
  prev.disabled = idx <= 0;
  prev.addEventListener('click', function () { if (idx > 0) select(listIds[idx - 1]); });
  var next = UI.el('button', 'btn btn--sm btn--ghost', 'следующая →');
  next.type = 'button';
  next.disabled = idx < 0 || idx >= listIds.length - 1;
  next.addEventListener('click', function () { if (idx >= 0 && idx < listIds.length - 1) select(listIds[idx + 1]); });
  nav.appendChild(prev);
  nav.appendChild(UI.el('span', 'hint', '↑↓ — список · Enter — открыть · Esc — выйти'));
  nav.appendChild(next);
  box.appendChild(nav);
  return box;
}

function select(id) {
  if (!E()[id]) return;
  view.entry = id;
  view.section = E()[id].section;
  listPos = Math.max(0, listIds.indexOf(id));
  stopAudio(false);
  closeLightbox();
  var old = UI.$('cxRead');
  if (old) {
    var fresh = buildReader();
    old.parentNode.replaceChild(fresh, old);
    fresh.scrollTop = 0;
  }
  refreshList();
  markRead(id);
  badge();
  var rail = document.querySelector('.cx-nav');
  if (rail) {
    Array.prototype.forEach.call(rail.children, function (b) {
      var sid = b.getAttribute('data-test');
      b.classList.toggle('on', sid === 'cxsec_' + view.section && !view.q);
    });
  }
}
function markRead(id) {
  var c = state(), en = E()[id];
  if (!c || !en || !isOpen(id) || c.read[id]) return;
  c.read[id] = Date.now();
  (en.onRead || []).forEach(function (step) {
    if (step.req && L.reqMet && !L.reqMet(ST.S, step.req)) return;
    if (step.effects && AU.applyEffects) AU.applyEffects(step.effects);
  });
  if (L.save) L.save(ST.S, 'auto');
  refreshList();
}
function exit() {
  stopAudio(true);
  closeLightbox();
  var loc = view.loc;
  view.entry = null; view.q = ''; view.filter = 'all';
  if (loc && (D.LOCATIONS || []).some(function (l) { return l.id === loc; })) S.showLocation(loc);
  else S.showHub();
}

/* ---------- клавиатура ---------- */
document.addEventListener('keydown', function (e) {
  if (ST.screen !== 'codex') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') {
    e.stopPropagation();
    if (lightbox) { closeLightbox(); return; }
    if (tag === 'input') { e.target.blur(); return; }
    exit();
    return;
  }
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === '/') {
    e.preventDefault();
    var s = UI.$('cxSearch');
    if (s) s.focus();
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!listIds.length) return;
    listPos = e.key === 'ArrowDown'
      ? Math.min(listIds.length - 1, listPos + 1)
      : Math.max(0, listPos - 1);
    var row = document.querySelector('[data-test="cxrow_' + listIds[listPos] + '"]');
    if (row) { row.focus(); row.scrollIntoView({ block: 'nearest' }); }
    return;
  }
  if (e.key === 'Enter' && listIds[listPos]) {
    e.preventDefault();
    select(listIds[listPos]);
  }
}, true);

/* ---------- кнопка HUD ---------- */
function wire() {
  var b = UI.$('btnCodex');
  if (b) b.addEventListener('click', function () {
    if (!ST.S) { UI.toast('Нет активного сеанса'); return; }
    if (ST.screen === 'codex') { exit(); return; }
    S.showCodex();
  });
  badge();
}
document.addEventListener('DOMContentLoaded', function () {
  data();
  wire();
});

/* ---------- проверка данных (консоль) ---------- */
function validate() {
  var c = data(), bad = [];
  if (!c) return ['CODEX не загружен'];
  var secIds = c.sections.map(function (s) { return s.id; });
  Object.keys(c.entries).forEach(function (id) {
    var e = c.entries[id];
    if (secIds.indexOf(e.section) < 0) bad.push(id + ': неизвестный раздел ' + e.section);
    if (!e.title) bad.push(id + ': нет заголовка');
    if (e.access && [1, 2, 3].indexOf(e.access) < 0) bad.push(id + ': уровень ' + e.access);
    (e.related || []).forEach(function (r) { if (!c.entries[r]) bad.push(id + ': related → ' + r); });
    (e.blocks || []).forEach(function (b, i) {
      if (b.t === 'link' && !c.entries[b.to]) bad.push(id + ': блок ' + i + ' → ' + b.to);
      if (b.t === 'svg' && !DRAW[b.draw]) bad.push(id + ': блок ' + i + ' схема ' + b.draw);
      if (b.t === 'audio' && !b.transcript) bad.push(id + ': аудио без расшифровки');
    });
    Object.keys(e.react || {}).forEach(function (h) { if (!D.HEROES[h]) bad.push(id + ': реакция ' + h); });
    (function chk(d) {
      if (!d) return;
      if (d.any) return d.any.forEach(chk);
      if (d.fact && !D.FACTS[d.fact]) bad.push(id + ': discover fact ' + d.fact);
      if (d.item && !D.ITEMS[d.item]) bad.push(id + ': discover item ' + d.item);
      if (d.location && !D.LOCATIONS.some(function (l) { return l.id === d.location; }) && d.location !== 'loc_arrival') {
        bad.push(id + ': discover location ' + d.location);
      }
      if (d.quest && !D.QUESTS[d.quest.id]) bad.push(id + ': discover quest ' + d.quest.id);
    })(e.discover);
  });
  return bad;
}

G.Codex = {
  sync: sync, level: level, status: statusOf, unread: unread, validate: validate,
  open: function (id) { S.showCodex(id); },
  state: function () { return state(); },
  grant: function (id) { var c = state(); if (c && E()[id]) { c.found[id] = Date.now(); badge(); } },
  setLevel: function (n) { var c = state(); if (c) { c.lvl = Math.max(1, Math.min(3, n | 0)); badge(); } }
};
})(window);
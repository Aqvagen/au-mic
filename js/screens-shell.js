/* =========================================================
Экраны: титул, выбор героя, хаб-карта, локация. Версия 3.0.
Карточки дел собираются и из entries, и из q.where — дело больше
не может «потеряться» из-за пробела в данных локации.
========================================================= */
(function (G) {
'use strict';
var UI = G.UI;
var AU = G.AU;
var ST = AU.state;
var D = AU.D, L = AU.L;
var S = G.Screens = G.Screens || {};
function app() { return UI.$('app'); }
function mount(screen) { return UI.mount(screen); }
function pageHead(kicker, title, sub, right) {
var head = UI.el('div', 'page-head');
var left = UI.el('div', 'page-head__left');
left.appendChild(UI.el('p', 'kicker', kicker));
left.appendChild(UI.el('h1', 'page-head__title', title));
if (sub) left.appendChild(UI.el('div', 'page-head__sub', sub));
head.appendChild(left);
if (right) {
var r = UI.el('div', 'page-head__right');
right.forEach(function (n) { r.appendChild(n); });
head.appendChild(r);
}
return head;
}
/* ================= титул ================= */
function tbtn(idx, label, hint, cls, fn, test) {
var b = UI.el('button', 'tbtn' + (cls ? ' ' + cls : ''));
b.type = 'button';
if (test) b.setAttribute('data-test', test);
b.appendChild(UI.el('span', 'tbtn__idx', idx));
var txt = UI.el('span', 'tbtn__txt');
txt.appendChild(UI.el('span', 'tbtn__label', label));
txt.appendChild(UI.el('span', 'tbtn__hint', hint));
b.appendChild(txt);
b.appendChild(UI.el('span', 'tbtn__edge'));
if (fn) b.addEventListener('click', fn);
else b.disabled = true;
return b;
}
S.showTitle = function () {
ST.screen = 'title';
ST.loc = null; ST.dlg = null;
UI.usePoster();
UI.setHudVisible(false);
UI.clear(app());
var layer = UI.el('div', 'title-layer');
var top = UI.el('div', 'title-top');
var brand = UI.el('div', 'brand');
brand.appendChild(UI.el('span', 'brand__dot'));
brand.appendChild(UI.el('span', '', 'AU MIC'));
brand.appendChild(UI.el('span', 'brand__sep', '/'));
brand.appendChild(UI.el('span', 'brand__sub', 'STARTERMINAL'));
top.appendChild(brand);
var status = UI.el('div', 'status');
status.appendChild(UI.el('span', 'status__lamp'));
status.appendChild(UI.el('span', '', 'Связь установлена'));
var clock = UI.el('span', 'status__clock', '--:--:--');
status.appendChild(clock);
top.appendChild(status);
layer.appendChild(top);
var main = UI.el('div', 'title-main');
main.appendChild(UI.el('p', 'kicker', 'Сектор M-карлика · 32,6 св. года'));
var disp = UI.el('h1', 'title__display');
disp.appendChild(UI.el('span', 'title__a', 'AU'));
disp.appendChild(UI.el('span', 'title__b', 'Microscopii'));
main.appendChild(disp);
var sub = UI.el('p', 'title__sub');
sub.appendChild(document.createTextNode('Пылевой диск вспыхивающей звезды.'));
sub.appendChild(UI.el('em', '', 'Эпоха 2287 · внешнее кольцо обитания'));
main.appendChild(sub);
var saved = null;
try { saved = L.load('auto'); } catch (e) { saved = null; }
var menu = UI.el('nav', 'title-menu');
menu.setAttribute('aria-label', 'Главное меню');
menu.appendChild(tbtn('01', 'Новая смена', 'пробуждение на борту R-7', 'tbtn--primary',
function () { S.showHeroes(); }, 'start'));
menu.appendChild(saved
? tbtn('02', 'Продолжить', 'автосохранение · ур. ' + saved.level + ' · ' + (D.HEROES[saved.hero] ? D.HEROES[saved.hero].name : '—'), '',
function () { ST.S = saved; S.showHub(); }, 'continue')
: tbtn('02', 'Продолжить', 'нет активного сеанса', '', null, 'continue'));
menu.appendChild(tbtn('03', 'Загрузить', 'архивы орбитальной станции', '',
function () { if (AU.showLoad) AU.showLoad(); }, 'load'));
menu.appendChild(tbtn('04', 'Настройки', 'звук, интерфейс, анимации', '',
function () { if (AU.showSettings) AU.showSettings(); }, 'settings'));
menu.appendChild(tbtn('05', 'Об игре', 'эпоха 2287 · сектор AU Mic', 'tbtn--ghost',
function () { if (AU.showAbout) AU.showAbout(); }, 'about'));
main.appendChild(menu);
layer.appendChild(main);
var side = UI.el('aside', 'title-side');
side.appendChild(UI.el('p', 'title-side__title', 'Телеметрия'));
var read = UI.el('dl', 'tread');
[['Звезда', 'M1 Ve · вспыхивающая', false],
['Диск', '0,4 – 40 а.е.', false],
['Планеты', 'b · c · подтверждены', false],
['Радиация', 'повышенная', true],
['Сеанс', 'локальный', false]].forEach(function (row) {
var d = UI.el('div');
d.appendChild(UI.el('dt', '', row[0]));
var dd = UI.el('dd', '', row[1]);
if (row[2]) dd.className = 'is-warn';
d.appendChild(dd);
read.appendChild(d);
});
side.appendChild(read);
var signal = UI.el('div', 'signal');
[38, 62, 44, 78, 52, 88, 40, 66, 30, 72, 48, 58].forEach(function (h) {
var sp = UI.el('span');
sp.style.setProperty('--h', h + '%');
signal.appendChild(sp);
});
side.appendChild(signal);
layer.appendChild(side);
var markers = UI.el('div', 'markers');
[['63%', '33%', 'AU Mic b', '0,064 а.е. · 8,46 сут'],
['74.5%', '61%', 'AU Mic c', '0,111 а.е. · 18,86 сут']].forEach(function (m) {
var pin = UI.el('div', 'pin');
pin.style.setProperty('--x', m[0]);
pin.style.setProperty('--y', m[1]);
pin.appendChild(UI.el('i'));
var t = UI.el('span', 'pin__txt');
t.appendChild(UI.el('b', '', m[2]));
t.appendChild(UI.el('em', '', m[3]));
pin.appendChild(t);
markers.appendChild(pin);
});
layer.appendChild(markers);
var foot = UI.el('div', 'title-foot');
var keys = UI.el('div', 'title-keys');
[['arrows', '↑↓', 'выбор'], ['Enter', 'Enter', 'вход'], ['Esc', 'Esc', 'назад'], ['M', 'M', 'звук']].forEach(function (k) {
var sp = UI.el('span');
if (k[0] === 'arrows') { sp.appendChild(UI.el('kbd', '', '↑')); sp.appendChild(UI.el('kbd', '', '↓')); }
else sp.appendChild(UI.el('kbd', '', k[1]));
sp.appendChild(document.createTextNode(' ' + k[2]));
keys.appendChild(sp);
});
foot.appendChild(keys);
foot.appendChild(UI.el('div', 'build', 'build ' + D.VERSION + ' · ' + Object.keys(D.QUESTS).length + ' дел'));
layer.appendChild(foot);
UI.showTitleLayer(layer);
function tick() {
var d = new Date();
var p = function (n) { return (n < 10 ? '0' : '') + n; };
clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}
tick();
layer._timer = setInterval(tick, 1000);
};
/* ================= герои ================= */
S.showHeroes = function () {
UI.usePoster();
UI.setHudVisible(false);
var root = mount('heroes');
root.appendChild(pageHead('Новая смена', 'Кто ты на R-7', 'три допуска · три характера'));
var grid = UI.el('div', 'heroes');
Object.keys(D.HEROES).forEach(function (id, i) {
var h = D.HEROES[id];
var card = UI.el('button', 'hero');
card.type = 'button';
card.style.setProperty('--i', i);
card.setAttribute('data-test', 'hero' + i);
var imgWrap = UI.el('div', 'hero__img');
imgWrap.appendChild(UI.img('assets/img/' + h.portrait + '.png', '', h.name));
card.appendChild(imgWrap);
var body = UI.el('div', 'hero__body');
body.appendChild(UI.el('div', 'hero__name', h.name));
body.appendChild(UI.el('div', 'hero__role', h.role));
var stats = UI.el('div', 'hero__stats');
[['ТЕЛО', h.attrs.telo], ['УМ', h.attrs.um], ['ХАР', h.attrs.harizma]].forEach(function (a) {
var sp = UI.el('span');
sp.appendChild(document.createTextNode(a[0] + ' '));
sp.appendChild(UI.el('b', '', String(a[1])));
stats.appendChild(sp);
});
body.appendChild(stats);
body.appendChild(UI.el('div', 'hero__go', 'Выбрать →'));
card.appendChild(body);
card.addEventListener('click', function () { ST.S = L.create(id); S.showHub(); });
grid.appendChild(card);
});
root.appendChild(grid);
};
/* ================= хаб / карта ================= */
var MAP_ROOMS = {
loc_zhil:    { x: 60,  y: 50,  w: 250, h: 150, name: 'ЖИЛОЙ' },
loc_med:     { x: 375, y: 50,  w: 250, h: 150, name: 'МЕДБЛОК' },
loc_admin:   { x: 690, y: 50,  w: 250, h: 150, name: 'АДМИН' },
loc_tech:    { x: 60,  y: 225, w: 250, h: 150, name: 'ТЕХУРОВЕНЬ' },
loc_server:  { x: 375, y: 225, w: 250, h: 150, name: 'СЕРВЕРНАЯ' },
loc_mine:    { x: 690, y: 225, w: 250, h: 150, name: 'ШАХТЫ' },
loc_canteen: { x: 60,  y: 400, w: 250, h: 150, name: 'СТОЛОВАЯ' },
loc_b12:     { x: 375, y: 400, w: 250, h: 150, name: 'B-12' },
loc_dock:    { x: 690, y: 400, w: 250, h: 150, name: 'АНГАР' },
loc_airlock: { x: 375, y: 575, w: 250, h: 90,  name: 'ШЛЮЗ' }
};
var MAP_LINKS = [
['loc_zhil', 'loc_med'], ['loc_med', 'loc_admin'],
['loc_zhil', 'loc_tech'], ['loc_med', 'loc_server'], ['loc_admin', 'loc_mine'],
['loc_tech', 'loc_server'], ['loc_server', 'loc_mine'],
['loc_tech', 'loc_canteen'], ['loc_server', 'loc_b12'], ['loc_mine', 'loc_dock'],
['loc_canteen', 'loc_b12'], ['loc_b12', 'loc_dock'],
['loc_b12', 'loc_airlock'], ['loc_dock', 'loc_airlock']
];
S.isUnlocked = function (l) {
var s = ST.S;
if (!l.unlock) return true;
if (s.flags['unlock_' + l.unlock]) return true;
return (s.bag || []).concat(s.questItems || []).some(function (i) {
return D.ITEMS[i] && D.ITEMS[i].unlock === l.unlock;
});
};
/* дела локации: entries + всё, что ссылается на неё через q.where */
function locationEntries(l) {
var list = (l.entries || []).slice();
Object.keys(D.QUESTS).forEach(function (id) {
if (D.QUESTS[id].where === l.id && list.indexOf(id) < 0) list.push(id);
});
return list;
}
function visibleQuests(l, s) {
return locationEntries(l).filter(function (e) {
if (e.indexOf('q_') !== 0) return false;
var q = D.QUESTS[e], st = s.quests[e];
if (!q || !st || st.done || st.failed) return false;
if (q.hero && q.hero !== s.hero) return false;
return st.started || L.questAvailable(s, e);
});
}
function sideCard(title) {
var c = UI.el('div', 'side-card');
c.appendChild(UI.el('div', 'side-card__title', title));
return c;
}
S.showHub = function () {
var s = ST.S;
s.location = null;
UI.setScene('bg_dome.png');
UI.setHudVisible(true);
UI.updateHud(s, L, D);
UI.setWhere('Станция R-7 · карта');
var root = mount('map');
root.appendChild(pageHead('Станция R-7 · сектор AU Mic', 'Карта станции', 'клик по комнате — войти'));
var hub = UI.el('div', 'hub');
var mapBox = UI.el('div', 'hub__map');
mapBox.appendChild(buildMap());
hub.appendChild(mapBox);
hub.appendChild(buildSide());
root.appendChild(hub);
L.save(s, 'auto');
};
S.btn = function (label, test, fn, mod) {
var b = UI.el('button', 'btn btn--sm' + (mod ? ' ' + mod : ''), label);
b.type = 'button';
if (test) b.setAttribute('data-test', test);
b.addEventListener('click', fn);
return b;
};
function buildMap() {
var s = ST.S;
var NS = 'http://www.w3.org/2000/svg';
var svg = document.createElementNS(NS, 'svg');
svg.setAttribute('viewBox', '50 40 900 645');
svg.setAttribute('class', 'mapsvg');
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
MAP_LINKS.forEach(function (pair) {
var a = MAP_ROOMS[pair[0]], b = MAP_ROOMS[pair[1]];
if (!a || !b) return;
var line = document.createElementNS(NS, 'line');
line.setAttribute('x1', a.x + a.w / 2); line.setAttribute('y1', a.y + a.h / 2);
line.setAttribute('x2', b.x + b.w / 2); line.setAttribute('y2', b.y + b.h / 2);
line.setAttribute('class', 'corridor');
svg.appendChild(line);
});
D.LOCATIONS.forEach(function (l) {
var r = MAP_ROOMS[l.id];
if (!r) return;
var unlocked = S.isUnlocked(l);
var g = document.createElementNS(NS, 'g');
g.setAttribute('class', 'room' + (unlocked ? '' : ' locked'));
g.setAttribute('data-test', 'room_' + l.id);
var rect = document.createElementNS(NS, 'rect');
rect.setAttribute('x', r.x); rect.setAttribute('y', r.y);
rect.setAttribute('width', r.w); rect.setAttribute('height', r.h);
rect.setAttribute('rx', 2);
g.appendChild(rect);
var t1 = document.createElementNS(NS, 'text');
t1.setAttribute('x', r.x + r.w / 2); t1.setAttribute('y', r.y + 46);
t1.setAttribute('class', 'roomname');
t1.textContent = r.name;
g.appendChild(t1);
var t2 = document.createElementNS(NS, 'text');
t2.setAttribute('x', r.x + r.w / 2); t2.setAttribute('y', r.y + 72);
t2.setAttribute('class', 'roomdesc');
t2.textContent = unlocked ? (l.desc || '').slice(0, 26) + ((l.desc || '').length > 26 ? '…' : '') : 'закрыто';
g.appendChild(t2);
if (!unlocked) {
var lock = document.createElementNS(NS, 'text');
lock.setAttribute('x', r.x + r.w / 2); lock.setAttribute('y', r.y + 108);
lock.setAttribute('class', 'roomlock');
lock.textContent = '● нужен ' + (l.unlock === 'admin' ? 'чип 1' : l.unlock === 'server' ? 'чип 2' : 'фильтр');
g.appendChild(lock);
} else {
g.addEventListener('click', function () { S.showLocation(l.id); });
}
var qcount = visibleQuests(l, s).length;
if (qcount && unlocked) {
var dot = document.createElementNS(NS, 'circle');
dot.setAttribute('cx', r.x + r.w - 20); dot.setAttribute('cy', r.y + 20);
dot.setAttribute('r', 8); dot.setAttribute('class', 'qdot');
g.appendChild(dot);
var qt = document.createElementNS(NS, 'text');
qt.setAttribute('x', r.x + r.w - 20); qt.setAttribute('y', r.y + 24);
qt.setAttribute('class', 'qdottext');
qt.textContent = qcount;
g.appendChild(qt);
}
svg.appendChild(g);
});
return svg;
}
function buildSide() {
var s = ST.S;
var side = UI.el('div', 'hub__side');
var rep = sideCard('Репутация');
var list = UI.el('div', 'rep');
Object.keys(D.REP_NAMES).forEach(function (k) {
var v = s.rep[k] || 0;
var row = UI.el('div', 'rep__row');
row.appendChild(UI.el('span', 'rep__name', D.REP_NAMES[k]));
row.appendChild(UI.el('span', 'rep__val' + (v > 0 ? ' is-pos' : v < 0 ? ' is-neg' : ''), (v > 0 ? '+' : '') + v));
var track = UI.el('div', 'rep__track');
var fill = UI.el('i');
var w = Math.min(50, Math.abs(v) / 10 * 50);
if (v >= 0) { fill.style.left = '50%'; fill.style.width = w + '%'; }
else { fill.style.left = (50 - w) + '%'; fill.style.width = w + '%'; fill.style.background = '#ff8a6a'; }
track.appendChild(fill);
row.appendChild(track);
list.appendChild(row);
});
rep.appendChild(list);
side.appendChild(rep);
var party = sideCard('Партия');
var pl = UI.el('div', 'party');
var hero = D.HEROES[s.hero];
var selfRow = UI.el('div', 'party__row');
var ava = UI.el('span', 'party__ava');
ava.style.backgroundImage = 'url("assets/img/' + hero.portrait + '.png")';
selfRow.appendChild(ava);
selfRow.appendChild(UI.el('span', '', hero.name));
selfRow.appendChild(UI.el('em', '', 'ты'));
pl.appendChild(selfRow);
s.companions.forEach(function (c) {
var m = D.COMPANIONS[c];
if (!m) return;
var row = UI.el('div', 'party__row');
var a = UI.el('span', 'party__ava');
a.style.backgroundImage = 'url("assets/img/' + m.portrait + '.png")';
row.appendChild(a);
row.appendChild(UI.el('span', '', m.name));
row.appendChild(UI.el('em', '', m.passive));
pl.appendChild(row);
});
if (!s.companions.length) pl.appendChild(UI.el('div', 'hint', 'пока один'));
party.appendChild(pl);
side.appendChild(party);
var sum = sideCard('Сводка');
var kv = UI.el('div', 'kv');
[['дел закрыто', L.questsDone(s)],
['в работе', L.questsActive(s)],
['проверки', s.passed + '/' + s.checks],
['уровень', s.level]].forEach(function (x) {
kv.appendChild(UI.el('dt', '', x[0]));
kv.appendChild(UI.el('dd', '', String(x[1])));
});
sum.appendChild(kv);
side.appendChild(sum);
var leg = sideCard('Обозначения');
var lg = UI.el('div', 'legend');
[['l-amber', 'дела в комнате'], ['l-red', 'нужен предмет'], ['l-cyan', 'коридоры']].forEach(function (x) {
var sp = UI.el('span');
sp.appendChild(UI.el('i', x[0]));
sp.appendChild(document.createTextNode(x[1]));
lg.appendChild(sp);
});
leg.appendChild(lg);
side.appendChild(leg);
return side;
}
/* ================= локация ================= */
S.showLocation = function (id) {
var s = ST.S;
ST.loc = id;
s.location = id;
var l = D.LOCATIONS.filter(function (x) { return x.id === id; })[0];
if (!l) return;
UI.setScene(l.bg);
UI.setHudVisible(true);
UI.updateHud(s, L, D);
UI.setWhere(l.name);
var root = mount('loc');
root.appendChild(pageHead('Локация', l.name, l.desc,
[S.btn('← На карту', 'back', function () { S.showHub(); }, 'btn--ghost')]));
var grid = UI.el('div', 'entries');
var i = 0;
locationEntries(l).forEach(function (e) {
if (e.indexOf('dlg_') === 0) {
var d = D.DIALOGUES[e];
if (!d) return;
grid.appendChild(entry('Поговорить: ' + d.speaker, 'диалог', 'dlg_' + i,
function () { S.openDialogue(e); }, i++));
} else if (e.indexOf('trade_') === 0) {
var mid = e.replace('trade_', '');
if (!D.MERCHANTS[mid]) return;
grid.appendChild(entry('Торговец: ' + D.MERCHANTS[mid].name, 'торговля', 'trade_' + i,
function () { S.showTrade(mid); }, i++));
} else if (e.indexOf('q_') === 0) {
var q = D.QUESTS[e];
if (!q) return;
if (q.hero && q.hero !== s.hero) return;
var st = s.quests[e];
if (!st) return;
var finalEntry = (e === 'q_final' && !st.done);
if (!st.started && !st.done && !st.failed && !L.questAvailable(s, e) && !finalEntry) return;
var kind = st.done ? 'завершено'
: st.failed ? 'провал'
: st.stage >= q.stages.length ? 'решение'
: st.started ? 'дело · этап ' + (st.stage + 1) + '/' + q.stages.length
: finalEntry ? 'нужно 3 дела акта II'
: 'доступно';
grid.appendChild(entry(q.title, kind, 'quest_' + e,
function () { S.showQuest(e); }, i++, st.done));
}
});
if (!grid.childNodes.length) grid.appendChild(UI.el('div', 'empty', 'здесь пока нечего делать'));
root.appendChild(grid);
};
function entry(title, kind, test, fn, i, done) {
var b = UI.el('button', 'entry' + (done ? ' entry--done' : ''));
b.type = 'button';
b.style.setProperty('--i', i);
if (test) b.setAttribute('data-test', test);
var main = UI.el('div', 'entry__main');
main.appendChild(UI.el('div', 'entry__kind', kind));
main.appendChild(UI.el('div', 'entry__title', title));
b.appendChild(main);
b.appendChild(UI.el('div', 'entry__go', '→'));
b.addEventListener('click', fn);
return b;
}
S.entry = entry;
S.pageHead = pageHead;
})(window);
/* =========================================================
AU MICROSCOPII 3.2 — состояние, эффекты, настройки, сейвы,
пауза, клавиатура, дозагрузка данных, самотест
========================================================= */
(function (G) {
'use strict';
var D = G.D = G.D || {};
var L = G.L;
var UI = G.UI;
var AU = G.AU = G.AU || {};
AU.D = D; AU.L = L;
var ST = AU.state = AU.state || { S: null, loc: null, dlg: null, screen: 'title' };
var S = G.Screens;

/* ================= данные: подхват и дозагрузка ================= */
function normalize() {
D.QUESTS = D.QUESTS || {};
D.DIALOGUES = D.DIALOGUES || {};
D.ITEMS = D.ITEMS || {};
D.WEAPONS = D.WEAPONS || {};
D.ARMORS = D.ARMORS || {};
D.LOCATIONS = D.LOCATIONS || [];
D.FACTS = D.FACTS || {};
D.ENDINGS = D.ENDINGS || [];
D.COMPANIONS = D.COMPANIONS || {};
D.MERCHANTS = D.MERCHANTS || {};
D.PERKS = D.PERKS || {};
D.HEROES = D.HEROES || {};
D.ENEMIES = D.ENEMIES || {};
D.SKILLS = D.SKILLS || {};
D.ATTRS = D.ATTRS || {};
D.REP_NAMES = D.REP_NAMES || {};
D.REP_START = D.REP_START || {};
}
function empty(o) { return !o || !Object.keys(o).length; }
function adopt() {
if (empty(D.QUESTS) && G.AU_QUESTS) D.QUESTS = G.AU_QUESTS;
if (empty(D.DIALOGUES) && G.AU_DIALOGUES) D.DIALOGUES = G.AU_DIALOGUES;
normalize();
}
function loadScript(src) {
return new Promise(function (res) {
var s = document.createElement('script');
s.src = src;
s.async = false;
s.onload = function () { res(true); };
s.onerror = function () { res(false); };
document.head.appendChild(s);
});
}
/* если файл не подключён в index.html — грузим его сами */
function ensureData() {
adopt();
var need = [];
if (empty(D.QUESTS)) need.push('js/data-quests.js');
if (empty(D.DIALOGUES)) need.push('js/data-dialogues.js');
if (!need.length) return Promise.resolve();
return need.reduce(function (p, src) {
return p.then(function () { return loadScript(src); });
}, Promise.resolve()).then(adopt, adopt);
}
function missingBlocks() {
var miss = [];
if (empty(D.HEROES)) miss.push('js/data.js');
if (empty(D.QUESTS)) miss.push('js/data-quests.js');
if (empty(D.DIALOGUES)) miss.push('js/data-dialogues.js');
if (!L) miss.push('js/logic.js');
if (!UI) miss.push('js/ui.js');
if (!S || !S.showTitle) miss.push('js/screens-shell.js');
return miss;
}
function reportMissing(list) {
var old = document.getElementById('datawarn');
if (old) old.parentNode.removeChild(old);
if (!list.length) return;
var box = document.createElement('div');
box.id = 'datawarn';
box.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9998;max-width:min(560px,92vw);' +
'padding:12px 14px;background:rgba(38,10,8,.97);border:1px solid #ff6a4a;border-left:3px solid #ff6a4a;' +
'color:#ffd8cf;font:11.5px/1.6 monospace;white-space:pre-wrap';
box.textContent = 'НЕ ЗАГРУЖЕНЫ ДАННЫЕ:\n' + list.map(function (f) { return '  · ' + f; }).join('\n') +
'\n\nФайл должен лежать рядом с index.html. Порядок подключения:\n' +
'data → data-quests → data-dialogues → logic → core → ui → screens → main.';
document.body.appendChild(box);
list.forEach(function (f) { console.error('[AU MIC] не загружен ' + f); });
}

/* ================= настройки ================= */
var SET_KEY = 'gryft.settings';
function defaults() {
var d = Object.assign({}, D.SETTINGS || {});
if (d.volume === undefined) d.volume = .35;
if (d.motion === undefined) d.motion = true;
if (d.scan === undefined) d.scan = true;
if (d.autosave === undefined) d.autosave = true;
return d;
}
function loadSettings() {
var d = defaults();
try {
var raw = localStorage.getItem(SET_KEY);
if (raw) return Object.assign(d, JSON.parse(raw));
d.motion = !UI.prefersReducedMotion();
} catch (e) {}
return d;
}
var settings = loadSettings();
function saveSettings() {
try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (e) {}
}
function applySettings() {
UI.setMotion(settings.motion);
UI.setScan(settings.scan);
UI.setBigFont(settings.bigFont);
document.body.classList.toggle('hide-hints', !!settings.hideHints);
UI.player.setVolume(settings.volume);
UI.player.setMute(settings.mute);
}
AU.getSettings = function () { return Object.assign({}, settings); };
AU.setSetting = function (k, v) {
settings[k] = v;
saveSettings();
if (k === 'motion') UI.setMotion(v);
else if (k === 'scan') UI.setScan(v);
else if (k === 'bigFont') UI.setBigFont(v);
else if (k === 'hideHints') document.body.classList.toggle('hide-hints', !!v);
else if (k === 'volume') UI.player.setVolume(v);
else if (k === 'mute') UI.player.setMute(v);
};
var rawSave = L.save;
L.save = function (st, slot) {
if ((!slot || slot === 'auto') && !settings.autosave) return false;
return rawSave(st, slot);
};

/* ================= эффекты ================= */
AU.applyEffects = function (eff) {
var s = ST.S;
if (!eff) return false;
if (eff.startQuest && L.startQuest(s, eff.startQuest)) UI.toast('Взято дело: ' + D.QUESTS[eff.startQuest].title);
if (eff.advanceQuest && L.advanceQuest(s, eff.advanceQuest)) UI.toast('Этап: ' + D.QUESTS[eff.advanceQuest].title);
if (eff.setStage) L.setQuestStage(s, eff.setStage.quest, eff.setStage.stage);
if (eff.completeQuest) {
if (L.completeQuest(s, eff.completeQuest, eff.branch || 'A')) UI.toast('Дело закрыто');
else UI.toast(L.branchBlockReason(s, eff.completeQuest, eff.branch || 'A') || 'Не вышло');
}
if (eff.failQuest) L.failQuest(s, eff.failQuest, eff.reason);
if (eff.fact) L.addFact(s, eff.fact);
if (eff.facts) eff.facts.forEach(function (f) { L.addFact(s, f); });
if (eff.rep) Object.keys(eff.rep).forEach(function (k) { L.addRep(s, k, eff.rep[k]); });
if (eff.xp) L.gainXp(s, eff.xp);
if (eff.credits) s.credits += eff.credits;
if (eff.hp) s.hp = Math.max(1, Math.min(s.maxHp, s.hp + eff.hp));
if (eff.companion && s.companions.indexOf(eff.companion) < 0 && D.COMPANIONS[eff.companion]) {
s.companions.push(eff.companion);
UI.toast('Напарник: ' + D.COMPANIONS[eff.companion].name);
}
if (eff.item) L.grantItem(s, eff.item);
if (eff.openQuest) {
L.save(s, 'auto');
S.showQuest(eff.openQuest);
return true;
}
if (eff.combat) {
var winQuest = eff.combatWinQuest;
L.save(s, 'auto');
S.startCombat(eff.combat, function (win) {
if (win && winQuest) L.advanceQuest(s, winQuest);
L.save(s, 'auto');
S.showLocation(ST.loc);
});
return true;
}
L.save(s, 'auto');
return false;
};

/* ================= настройки: экран ================= */
AU.showSettings = function () {
var p = UI.panel({ kicker: 'Конфигурация', title: 'Настройки', footRight: 'профиль браузера' });
var box = UI.el('div', 'stack');
function group(title) {
var g = UI.el('div', 'set-group');
g.appendChild(UI.el('div', 'set-group__t', title));
box.appendChild(g);
return g;
}
function slider(g, label, value, onInput) {
var row = UI.el('div', 'set-row');
row.appendChild(UI.el('span', 'set-row__l', label));
var input = document.createElement('input');
input.type = 'range'; input.min = '0'; input.max = '100';
input.value = String(Math.round(value * 100));
var out = UI.el('span', 'set-row__v', input.value + '%');
input.addEventListener('input', function () {
out.textContent = input.value + '%';
onInput(Number(input.value) / 100);
});
row.appendChild(input); row.appendChild(out);
g.appendChild(row);
}
function toggle(g, label, key, hint) {
var row = UI.el('div', 'set-row');
row.appendChild(UI.el('span', 'set-row__l', label + (hint ? ' · ' + hint : '')));
var b = UI.el('button', 'btn btn--sm' + (settings[key] ? ' btn--primary' : ''),
settings[key] ? 'вкл' : 'выкл');
b.type = 'button';
b.setAttribute('data-test', 'set_' + key);
b.addEventListener('click', function () {
AU.setSetting(key, !settings[key]);
b.textContent = settings[key] ? 'вкл' : 'выкл';
b.className = 'btn btn--sm' + (settings[key] ? ' btn--primary' : '');
});
row.appendChild(b);
g.appendChild(row);
}
var snd = group('Звук');
slider(snd, 'Громкость', settings.volume, function (v) { AU.setSetting('volume', v); });
toggle(snd, 'Звук', 'mute', 'инверсия: вкл = тихо');
var openPlayer = UI.el('button', 'btn btn--sm btn--ghost', 'Открыть плеер');
openPlayer.type = 'button';
openPlayer.addEventListener('click', function () { UI.closePanel(); UI.player.open(); });
snd.appendChild(openPlayer);
var gfx = group('Графика');
toggle(gfx, 'Анимации', 'motion', 'пыль, вспышки, параллакс');
toggle(gfx, 'Скан-линии', 'scan');
var ui = group('Интерфейс');
toggle(ui, 'Крупный шрифт', 'bigFont');
toggle(ui, 'Подсказки', 'hideHints', 'инверсия: вкл = скрыть');
var game = group('Игра');
toggle(game, 'Автосохранение', 'autosave');
var reset = UI.el('button', 'btn btn--sm btn--danger', 'Сбросить настройки');
reset.type = 'button';
reset.addEventListener('click', function () {
settings = defaults();
saveSettings(); applySettings();
UI.closePanel(); AU.showSettings();
UI.toast('Настройки сброшены');
});
box.appendChild(reset);
box.appendChild(UI.el('div', 'hint', 'настройки хранятся в этом браузере и применяются при запуске'));
p._body.appendChild(box);
UI.openPanel(p);
};

/* ================= сейвы ================= */
var SLOTS = [['auto', 'Автосохранение'], ['slot1', 'Слот 1'], ['slot2', 'Слот 2'],
['slot3', 'Слот 3'], ['slot4', 'Слот 4'], ['slot5', 'Слот 5']];
function fmtDate(ts) {
if (!ts) return '—';
try {
var d = new Date(ts);
var p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '.' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
} catch (e) { return '—'; }
}
function slotRow(def, i, mode) {
var info = L.slotInfo(def[0]);
var row = UI.el('div', 'lrow' + (info ? '' : ' lrow--empty'));
row.style.setProperty('--i', i);
var main = UI.el('div', 'lrow__main');
main.appendChild(UI.el('div', 'lrow__t', def[1] + (info && D.HEROES[info.hero] ? ' · ' + D.HEROES[info.hero].name : '')));
if (info) {
var meta = UI.el('div', 'slot__meta');
[['уровень', info.level], ['₡', info.credits], ['HP', info.hp + '/' + info.maxHp],
['дел', info.done], ['где', info.location], ['когда', fmtDate(info.savedAt)]].forEach(function (x) {
var sp = UI.el('span');
sp.appendChild(document.createTextNode(x[0] + ' '));
sp.appendChild(UI.el('b', '', String(x[1])));
meta.appendChild(sp);
});
main.appendChild(meta);
} else {
main.appendChild(UI.el('div', 'lrow__s', 'пусто'));
}
row.appendChild(main);
var acts = UI.el('div', 'slot__acts');
function btn(label, cls, fn, test) {
var b = UI.el('button', 'btn btn--sm' + (cls ? ' ' + cls : ''), label);
b.type = 'button';
if (test) b.setAttribute('data-test', test);
b.addEventListener('click', fn);
return b;
}
if (mode === 'save') {
if (def[0] === 'auto') acts.appendChild(UI.el('span', 'lrow__badge', 'авто'));
else if (ST.S && ST.S.combat) acts.appendChild(UI.el('span', 'lrow__badge', 'бой'));
else if (ST.S) {
acts.appendChild(btn(info ? 'Перезаписать' : 'Сохранить', 'btn--primary', function () {
if (rawSave(ST.S, def[0])) { UI.toast('Сохранено: ' + def[1]); UI.closePanel(); AU.showSave(); }
else UI.toast('Не удалось сохранить');
}, 'save_' + def[0]));
}
} else if (info) {
acts.appendChild(btn('Загрузить', 'btn--primary', function () {
var st = L.load(def[0]);
if (!st) { UI.toast('Сейв не читается'); return; }
ST.S = st; ST.loc = null; ST.dlg = null;
UI.closePanel(); S.showHub();
UI.toast('Сеанс восстановлен');
}, 'load_' + def[0]));
}
if (info) {
var del = btn('Удалить', 'btn--danger', function () {
if (del.dataset.armed) {
try { localStorage.removeItem('gryft.' + def[0]); } catch (e) {}
UI.toast('Удалено: ' + def[1]);
UI.closePanel();
mode === 'save' ? AU.showSave() : AU.showLoad();
} else {
del.dataset.armed = '1';
del.textContent = 'Точно?';
setTimeout(function () { if (del.isConnected) { delete del.dataset.armed; del.textContent = 'Удалить'; } }, 3000);
}
}, 'del_' + def[0]);
acts.appendChild(del);
}
row.appendChild(acts);
return row;
}
AU.showSave = function () {
if (!ST.S) { UI.toast('Нет активного сеанса'); return; }
var p = UI.panel({ kicker: 'Архив', title: 'Сохранить', footRight: '5 ручных слотов' });
var list = UI.el('div', 'list');
SLOTS.forEach(function (def, i) { list.appendChild(slotRow(def, i, 'save')); });
p._body.appendChild(list);
if (ST.S.combat) p._body.appendChild(UI.el('div', 'hint', 'в бою сохранение недоступно — закончи бой'));
UI.openPanel(p);
};
AU.showLoad = function () {
var p = UI.panel({ kicker: 'Архив', title: 'Загрузить', footRight: 'локальные сейвы' });
var list = UI.el('div', 'list');
var any = false;
SLOTS.forEach(function (def, i) {
if (L.slotInfo(def[0])) any = true;
list.appendChild(slotRow(def, i, 'load'));
});
p._body.appendChild(list);
if (!any) p._body.appendChild(UI.el('div', 'hint', 'сохранений нет — начни новую смену'));
UI.openPanel(p);
};

/* ================= справка / пауза ================= */
AU.showAbout = function () {
var p = UI.panel({ kicker: 'Справка', title: 'Об игре', footRight: 'AU MICROSCOPII · 2287' });
var box = UI.el('div', 'stack');
box.appendChild(UI.el('p', 'title__sub',
'Станция R-7 держится на внешнем кольце пылевого диска AU Microscopii. Звезда вспыхивает, смены идут по расписанию, а накладные не сходятся.'));
box.appendChild(UI.el('p', 'title__sub',
'Один герой, три допуска, дела, проверки d20, торговля, бой на сетке 6×6 и финал, который зависит от того, что ты решил по дороге.'));
var kv = UI.el('div', 'kv');
[['эпоха', '2287'], ['сектор', 'AU Mic · 32,6 св. года'],
['версия', (D.VERSION || '—') + ' · ' + Object.keys(D.QUESTS).length + ' дел'],
['диалогов', String(Object.keys(D.DIALOGUES).length)],
['финалов', String(D.ENDINGS.length)]].forEach(function (x) {
kv.appendChild(UI.el('dt', '', x[0]));
kv.appendChild(UI.el('dd', '', x[1]));
});
box.appendChild(kv);
p._body.appendChild(box);
UI.openPanel(p);
};
AU.showPause = function () {
var p = UI.panel({ kicker: 'Пауза', title: 'Терминал', footLeft: 'Esc — продолжить' });
var box = UI.el('div', 'stack');
var grid = UI.el('div', 'pause-grid');
[['Журнал', function () { UI.closePanel(); S.showJournal(); }],
['Рюкзак', function () { UI.closePanel(); S.showInventory(); }],
['Сохранить', function () { UI.closePanel(); AU.showSave(); }],
['Загрузить', function () { UI.closePanel(); AU.showLoad(); }],
['Настройки', function () { UI.closePanel(); AU.showSettings(); }],
['Плеер', function () { UI.closePanel(); UI.player.open(); }]
].forEach(function (x) {
var b = UI.el('button', 'btn');
b.type = 'button';
b.textContent = x[0];
b.addEventListener('click', x[1]);
grid.appendChild(b);
});
box.appendChild(grid);
var kv = UI.el('div', 'kv');
var s = ST.S;
if (s) {
kv.appendChild(UI.el('dt', '', 'герой')); kv.appendChild(UI.el('dd', '', D.HEROES[s.hero].name));
kv.appendChild(UI.el('dt', '', 'уровень')); kv.appendChild(UI.el('dd', '', String(s.level)));
kv.appendChild(UI.el('dt', '', 'кредиты')); kv.appendChild(UI.el('dd', '', String(s.credits)));
kv.appendChild(UI.el('dt', '', 'дел закрыто')); kv.appendChild(UI.el('dd', '', String(L.questsDone(s))));
}
box.appendChild(kv);
var close = UI.el('button', 'btn btn--primary btn--block');
close.type = 'button';
close.textContent = 'Продолжить';
close.addEventListener('click', function () { UI.closePanel(); });
box.appendChild(close);
p._body.appendChild(box);
UI.openPanel(p);
};

/* ================= клавиатура ================= */
document.addEventListener('keydown', function (e) {
var tag = (e.target && e.target.tagName || '').toLowerCase();
if (tag === 'input' || tag === 'textarea' || tag === 'select') {
if (e.key === 'Escape') e.target.blur();
return;
}
if (e.key === 'Escape') {
if (UI.isPanelOpen()) { UI.closePanel(); return; }
if (UI.player.isOpen()) { UI.player.close(); return; }
if (ST.screen === 'dlg' && ST.dlg) { ST.dlg = null; S.showLocation(ST.loc); return; }
if ((ST.screen === 'quest' || ST.screen === 'trade') && ST.S) {
ST.loc ? S.showLocation(ST.loc) : S.showHub();
return;
}
if (ST.S && (ST.screen === 'map' || ST.screen === 'loc' || ST.screen === 'combat')) AU.showPause();
return;
}
if ((e.key === 'm' || e.key === 'M' || e.key === 'ь') && ST.screen !== 'dlg') {
UI.player.setMute(!UI.player.isMuted());
return;
}
if (ST.screen === 'title' && !UI.isPanelOpen()) {
if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
var items = Array.prototype.slice.call(document.querySelectorAll('.title-menu .tbtn:not([disabled])'));
if (items.length) {
e.preventDefault();
var i = items.indexOf(document.activeElement);
var next = e.key === 'ArrowDown'
? (i === -1 ? 0 : (i + 1) % items.length)
: (i === -1 ? items.length - 1 : (i - 1 + items.length) % items.length);
items[next].focus();
}
return;
}
if (e.key === 'Enter' && document.activeElement === document.body) {
var first = document.querySelector('.title-menu .tbtn:not([disabled])');
if (first) { e.preventDefault(); first.click(); }
return;
}
}
var n = parseInt(e.key, 10);
if (n >= 1 && n <= 9 && ST.screen === 'dlg' && ST.dlg) {
var b = document.querySelector('[data-test="opt' + (n - 1) + '"]');
if (b && !b.disabled) b.click();
}
});

/* ================= HUD ================= */
function wireHud() {
function on(id, fn) { var n = UI.$(id); if (n) n.addEventListener('click', fn); }
on('btnJournal', function () { if (ST.S) S.showJournal(); });
on('btnBag', function () { if (ST.S) S.showInventory(); });
on('btnPause', function () { if (ST.S) AU.showPause(); });
on('btnSave', function () { AU.showSave(); });
on('btnLoad', function () { AU.showLoad(); });
on('btnMusic', function () { UI.player.toggle(); });
on('btnMute', function () { UI.player.setMute(!UI.player.isMuted()); });
on('hudPoints', function () { if (ST.S) S.showLevelUp(); });
var pts = UI.$('hudPoints');
if (pts) pts.addEventListener('keydown', function (e) { if (e.key === 'Enter' && ST.S) S.showLevelUp(); });
}

/* ================= самотест ================= */
var TR = [];
function clickable(sel) {
var n = document.querySelector(sel);
if (!n) return 'нет ' + sel;
var r = n.getBoundingClientRect();
if (r.width < 4 || r.height < 4) return 'нулевой размер';
var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
return (n === top || n.contains(top)) ? true : ('перекрыт: ' + (top && top.className));
}
function fire(n) {
if (typeof n.click === 'function') n.click();
else n.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
}
function clickel(sel) {
var n = document.querySelector(sel);
if (!n) throw new Error('нет элемента ' + sel);
fire(n);
return true;
}
function panelBtn(text) {
var all = Array.prototype.slice.call(document.querySelectorAll('#panel button'));
for (var i = 0; i < all.length; i++) if (all[i].textContent.indexOf(text) >= 0) return all[i];
return null;
}
function out() {
var bad = TR.filter(function (r) { return !r.ok; }).length;
var old = document.getElementById('testout');
if (old) old.parentNode.removeChild(old);
var box = document.createElement('div');
box.id = 'testout';
box.style.cssText = 'position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;max-height:60vh;overflow:auto;padding:10px;background:rgba(4,8,12,.98);border:1px solid #57d3e6;color:#cfe6ef;font:11.5px/1.5 monospace;white-space:pre-wrap';
box.textContent = 'САМОТЕСТ · ' + TR.length + ' проверок · ' + (bad === 0 ? 'ВСЁ РАБОТАЕТ' : 'ПРОВАЛОВ: ' + bad) + '\n\n' +
TR.map(function (r) { return (r.ok ? 'OK   ' : 'FAIL ') + r.name + (r.note ? '  (' + r.note + ')' : ''); }).join('\n');
document.body.appendChild(box);
window.__selftest = { bad: bad, total: TR.length, results: TR };
}
function seedRequires(st, q) {
var r = q.requires || {};
function done(id, branch) {
if (!st.quests[id]) return;
st.quests[id].done = true; st.quests[id].started = true;
st.quests[id].branch = branch || 'A';
st.quests[id].stage = D.QUESTS[id].stages.length;
}
(r.all || []).forEach(function (x) { done(x); });
(r.any || []).slice(0, r.minAny || 1).forEach(function (x) { done(x); });
(r.anyFailed || []).slice(0, 1).forEach(function (x) {
if (st.quests[x]) { st.quests[x].failed = true; st.quests[x].started = true; }
});
if (r.questBranch) done(r.questBranch.id, r.questBranch.branch);
(r.facts || []).forEach(function (f) { st.facts[f] = true; });
}
AU.runSelfTest = function () {
TR = [];
function optText(needle) {
var all = Array.prototype.slice.call(document.querySelectorAll('[data-test^="opt"]'));
for (var k = 0; k < all.length; k++) if (all[k].textContent.indexOf(needle) >= 0) return all[k];
return null;
}
function closePanel() { if (UI.isPanelOpen()) UI.closePanel(); }
function fresh(hero) {
ST.S = L.create(hero || 'noa');
ST.loc = null; ST.dlg = null;
UI.setHudVisible(true);
UI.updateHud(ST.S, L, D);
return ST.S;
}
var steps = [
['данные: квесты загружены', function () {
var n = Object.keys(D.QUESTS).length;
return n >= 30 ? true : 'мало дел: ' + n;
}],
['данные: диалоги загружены', function () {
var n = Object.keys(D.DIALOGUES).length;
return n >= 15 ? true : 'диалогов ' + n + ' — проверь js/data-dialogues.js';
}],
['данные: этапы, подсказки, три ветки и награды', function () {
var bad = [];
Object.keys(D.QUESTS).forEach(function (id) {
var q = D.QUESTS[id];
if (q.stages.length !== q.hints.length) bad.push(id + ':hints');
if (Object.keys(q.branch).length !== 3) bad.push(id + ':branches');
Object.keys(q.branch).forEach(function (b) { if (!q.rewards[b]) bad.push(id + ':' + b); });
});
return bad.length ? bad.join(', ') : true;
}],
['данные: матрица финалов 3×3×2', function () {
var bad = [];
['noa', 'selin', 'garik'].forEach(function (h) {
['A', 'B', 'C'].forEach(function (t) {
['1', '2'].forEach(function (v) {
var f = D.ENDINGS.filter(function (e) { return e.hero === h && e.thread === t && e.variant === v; });
if (f.length !== 1) bad.push(h + t + v);
});
});
});
return bad.length ? 'нет/дубли: ' + bad.join(', ') : true;
}],
['данные: тексты финалов не пустые', function () {
return D.ENDINGS.every(function (e) { return e.text.length >= 3 && e.text.join(' ').length > 80; });
}],
['движок: каждое дело проходимо по каждой ветке', function () {
var err = null;
Object.keys(D.QUESTS).forEach(function (id) {
if (err) return;
var q = D.QUESTS[id];
Object.keys(q.branch).forEach(function (b) {
if (err) return;
var st = L.create(q.hero || 'noa');
seedRequires(st, q);
var br = (q.branchReq || {})[b] || {};
if (br.fact) st.facts[br.fact] = true;
if (br.item) L.addItem(st, br.item);
if (br.companion) st.companions.push(br.companion);
if (!L.questAvailable(st, id)) { err = 'недоступен ' + id; return; }
L.startQuest(st, id);
for (var i = 0; i < q.stages.length; i++) L.advanceQuest(st, id);
if (!L.questReady(st, id)) { err = 'не готов ' + id; return; }
if (L.branchBlockReason(st, id, b)) { err = id + '/' + b + ': ' + L.branchBlockReason(st, id, b); return; }
if (!L.completeQuest(st, id, b)) err = 'не закрылся ' + id + '/' + b;
});
});
return err || true;
}],
['данные: каждый этап двигается диалогом', function () {
var adv = {};
Object.keys(D.DIALOGUES).forEach(function (d) {
(D.DIALOGUES[d].options || []).forEach(function (o) {
[o.effects, o.success && o.success.effects, o.fail && o.fail.effects].forEach(function (ef) {
if (!ef) return;
var ids = [];
if (ef.advanceQuest) ids.push(ef.advanceQuest);
if (ef.combatWinQuest) ids.push(ef.combatWinQuest);
ids.forEach(function (qid) {
adv[qid] = adv[qid] || [];
adv[qid].push(o.req || {});
});
});
});
});
var bad = [];
Object.keys(D.QUESTS).forEach(function (id) {
var q = D.QUESTS[id], list = adv[id] || [];
for (var s = 0; s < q.stages.length; s++) {
var ok = list.some(function (r) {
if (!r.quest) return true;
if (r.quest !== id) return false;
if (r.stage !== undefined) return r.stage === s;
if (r.stageMin !== undefined && s < r.stageMin) return false;
if (r.stageMax !== undefined && s > r.stageMax) return false;
return true;
});
if (!ok) bad.push(id + ':этап' + s);
}
});
return bad.length ? bad.slice(0, 10).join(', ') + (bad.length > 10 ? '…' : '') : true;
}],
['данные: у каждого дела есть старт в диалогах', function () {
var started = {};
Object.keys(D.DIALOGUES).forEach(function (d) {
(D.DIALOGUES[d].options || []).forEach(function (o) {
if (o.effects && o.effects.startQuest) started[o.effects.startQuest] = true;
});
});
var miss = Object.keys(D.QUESTS).filter(function (q) { return !started[q]; });
return miss.length ? 'нет старта: ' + miss.slice(0, 8).join(', ') + (miss.length > 8 ? '…' : '') : true;
}],
['данные: переходы диалогов существуют', function () {
var bad = [];
Object.keys(D.DIALOGUES).forEach(function (d) {
(D.DIALOGUES[d].options || []).forEach(function (o) {
if (o.next && o.next !== 'end' && !D.DIALOGUES[o.next]) bad.push(d + '→' + o.next);
['success', 'fail'].forEach(function (k) {
if (o[k] && o[k].next && o[k].next !== 'end' && !D.DIALOGUES[o[k].next]) bad.push(d + '→' + o[k].next);
});
});
});
return bad.length ? bad.join(', ') : true;
}],
['сейв: старый формат мигрирует', function () {
var old = { hero: 'noa', dlgv: D.VERSION,
quests: { q_mira: { stage: 2, done: false, branch: null } },
facts: {}, usedChecks: { 'dlg_x:1': true }, bag: ['chip_low'], flags: {}, anchors: [],
weights: { A: 0, B: 0, C: 0 }, companions: [], level: 1, skills: {},
attrs: { telo: 5, um: 5, harizma: 5 }, perks: [], hp: 10, maxHp: 10, credits: 0, log: [], rep: {} };
L.migrate(old);
var checks = [
['started', old.quests.q_mira.started === true],
['stage', old.quests.q_mira.stage === 1],
['usedChecks', old.usedChecks['dlg_x:1'] === 'fail'],
['q_sign', !!old.quests.q_sign],
['questItems', (old.questItems || []).indexOf('chip_low') >= 0],
['bag', old.bag.length === 0]
];
var bad = checks.filter(function (c) { return !c[1]; }).map(function (c) { return c[0]; });
return bad.length ? 'не мигрировало: ' + bad.join(', ') : true;
}],
['сейв: смена версии сбрасывает диалоговые флаги', function () {
var st = L.create('noa');
st.dlgv = '0.0';
st.usedChecks = { 'dlg_zhil:0': 'ok' };
st.flags = { seen_dlg_zhil: true, unlock_admin: true };
L.migrate(st);
return Object.keys(st.usedChecks).length === 0 && !st.flags.seen_dlg_zhil &&
st.flags.unlock_admin === true && st.dlgv === D.VERSION;
}],
['сейв: веса пересчитываются из закрытых дел', function () {
var st = L.create('noa');
st.quests.q_mira.done = true; st.quests.q_mira.branch = 'B';
st.anchors = []; st.weights = { A: 0, B: 0, C: 0 };
L.migrate(st);
return st.weights.B === 5 && st.anchors.length === 1 && !!st.anchors[0].src;
}],
['нити: вес копится с нуля', function () {
var st = L.create('noa');
L.weight(st, 'C', 5, 'тест');
return st.weights.C === 5 && L.thread(st) === 'C';
}],
['инвентарь: оружие не теряется при смене', function () {
var st = L.create('noa');
L.addItem(st, 'glasshot');
var old = st.weapon;
L.equipWeapon(st, 'glasshot');
return st.weapon === 'glasshot' && st.bag.indexOf(old) >= 0;
}],
['инвентарь: улики не продаются', function () {
var st = L.create('noa');
var r = L.sell(st, 'chip_low');
return r.ok === false && L.hasItem(st, 'chip_low');
}],
['инвентарь: оружие продаётся', function () {
var st = L.create('noa');
L.addItem(st, 'glasshot');
var before = st.credits;
var r = L.sell(st, 'glasshot');
return r.ok === true && st.credits > before;
}],
['кнопка старта кликабельна', function () { fresh(); S.showTitle(); return clickable('[data-test="start"]'); }],
['переход к выбору героя', function () { clickel('[data-test="start"]'); return !!document.querySelector('[data-test="hero0"]'); }],
['герой создан, карта открыта', function () {
clickel('[data-test="hero0"]');
return !!document.querySelector('[data-test="room_loc_zhil"]') && !!ST.S;
}],
['комнат на карте: 10', function () { return document.querySelectorAll('[data-test^="room_"]').length === 10; }],
['локация открывается', function () {
clickel('[data-test="room_loc_zhil"]');
return !!document.querySelector('[data-test^="dlg_"]') ? true : 'нет карточек диалога';
}],
['диалог: опции есть', function () {
clickel('[data-test^="dlg_"]');
var n = document.querySelectorAll('[data-test^="opt"]').length;
return n >= 2 ? true : 'опций ' + n;
}],
['взято дело Миры', function () {
var b = optText('Что за чипы');
if (!b) return 'нет опции старта';
fire(b);
return ST.S.quests.q_mira.started === true;
}],
['журнал открывается из HUD', function () { clickel('[data-test="journal"]'); return !!document.getElementById('panel'); }],
['журнал: все вкладки живые', function () {
var tabs = Array.prototype.slice.call(document.querySelectorAll('#panel .tab'));
if (tabs.length < 5) return 'вкладок мало: ' + tabs.length;
for (var i = 0; i < tabs.length; i++) {
fire(tabs[i]);
if (!document.querySelector('#panel .journal__list')) return 'вкладка ' + i + ' без списка';
}
return true;
}],
['дело: экран и этапы', function () {
closePanel(); ST.loc = 'loc_zhil'; S.showQuest('q_mira');
return document.querySelectorAll('.qstage').length === D.QUESTS.q_mira.stages.length;
}],
['проверка в админ-блоке двигает этап', function () {
ST.S.skills.logika = 10; ST.S.attrs.um = 12; ST.loc = 'loc_admin';
for (var k = 0; k < 8; k++) {
S.openDialogue('dlg_admin');
var b = optText('Найти лог аудита');
if (!b) return 'нет опции лога';
fire(b);
if (ST.S.quests.q_mira.stage === 2) return !!ST.S.facts.f_log;
}
return 'проверка не прошла за 8 попыток';
}],
['возврат к Мире готовит развилку', function () {
ST.S.quests.q_mira.stage = 2; ST.loc = 'loc_zhil';
S.openDialogue('dlg_zhil');
var b = optText('Вернуться к Мире');
if (!b) return 'нет опции возврата';
fire(b);
var close = optText('Закрыть дело');
if (!close) return 'нет закрытия';
fire(close);
return ST.S.quests.q_mira.stage === 3 && !!document.querySelector('[data-test="branch0"]');
}],
['развилка закрывает дело и копит нить', function () {
clickel('[data-test="branch0"]');
return ST.S.quests.q_mira.done === true && ST.S.weights.A > 0;
}],
['следующее дело открылось', function () { return L.questAvailable(ST.S, 'q_sign'); }],
['рюкзак открывается', function () {
ST.S.hp = Math.max(1, ST.S.hp - 10);
S.showInventory();
return !!document.getElementById('panel');
}],
['предмет используется', function () {
var b = document.querySelector('[data-test^="use"]');
if (!b) return 'нет используемого предмета';
fire(b);
return ST.S.hp > 0;
}],
['уровень повышается и очко тратится', function () {
closePanel(); L.gainXp(ST.S, 500);
if (ST.S.points <= 0) return 'нет очков';
S.showLevelUp();
var before = ST.S.skills.ubezhdenie;
clickel('[data-test="skill_ubezhdenie"]');
return ST.S.skills.ubezhdenie === before + 1;
}],
['перк берётся', function () {
closePanel(); ST.S.attrs.telo = 6; L.recalc(ST.S); ST.S.points += 1;
S.showLevelUp();
var b = document.querySelector('[data-test="perk_hardbody"]');
if (!b || b.disabled) return 'перк недоступен';
fire(b);
return ST.S.perks.length > 0;
}],
['торговля: покупка', function () {
closePanel(); ST.S.credits = 1000; ST.loc = 'loc_canteen';
S.showTrade('kim');
var before = ST.S.credits;
clickel('[data-test="buy0"]');
return ST.S.credits < before;
}],
['торговля: продажа', function () {
L.addItem(ST.S, 'medgel');
S.showTrade('kim');
var before = ST.S.credits;
var b = document.querySelector('[data-test="sell0"]');
if (!b) return 'нечего продавать';
fire(b);
return ST.S.credits > before;
}],
['бой начинается', function () {
ST.loc = 'loc_mine'; S.startCombat('drone,drone');
return !!ST.S.combat && document.querySelectorAll('[data-cell]').length === 36;
}],
['бой: на сетке 8 укрытий', function () { return document.querySelectorAll('.cell--cover').length === 8; }],
['бой: укрытие даёт +2', function () {
var st = L.create('noa'); st.weapon = 'glasshot';
var c = L.combatStart(st, ['drone'], {});
var h = L.heroUnit(c), e = L.enemies(c)[0];
h.x = 2; h.y = 3; e.x = 2; e.y = 1;
var pv = L.previewAttack(st, c, h, e);
return pv.ok && pv.cover === 2 && pv.dist === 2;
}],
['бой: полное укрытие достижимо (+4)', function () {
var st = L.create('noa'); st.weapon = 'glasshot';
var c = L.combatStart(st, ['drone'], {});
var h = L.heroUnit(c), e = L.enemies(c)[0];
h.x = 2; h.y = 2; h.ap = 2;
e.x = 5; e.y = 5;
if (L.occupied(c, 2, 4, h.id)) return 'клетка укрытия занята';
if (!L.canMove(c, h, 2, 4)) return 'на полное укрытие нельзя встать';
h.x = 2; h.y = 4;
return L.coverBonus(h, 'short', false, 2) === 4 ? true : 'бонус не +4';
}],
['бой: клик по себе не тратит AP', function () {
var st = L.create('noa');
var c = L.combatStart(st, ['drone'], {});
var h = L.heroUnit(c);
var ap = h.ap;
L.move(c, h, h.x, h.y);
return h.ap === ap;
}],
['бой: вне дальности не стреляет', function () {
var st = L.create('noa');
var c = L.combatStart(st, ['drone'], {});
var h = L.heroUnit(c), e = L.enemies(c)[0];
h.x = 0; h.y = 5; e.x = 5; e.y = 0;
var pv = L.previewAttack(st, c, h, e);
return pv.ok === false && pv.reason === 'вне дальности';
}],
['бой: атака снимает HP', function () {
var c = ST.S.combat;
if (!c) return 'бой не идёт';
for (var k = 0; k < 10; k++) {
if (!ST.S.combat || ST.S.combat.over) return true;
c = ST.S.combat;
var h = L.heroUnit(c), foe = L.enemies(c)[0];
if (!foe) return true;
c.turnIndex = c.order.indexOf('hero');
h.ap = 2; h.x = foe.x; h.y = Math.max(0, foe.y - 1);
var before = foe.hp;
S.onCellClick(foe.x, foe.y);
if (foe.hp < before) return true;
}
return false;
}],
['бой: завершается и возвращает в игру', function () {
var guard = 0;
while (ST.S.combat && !ST.S.combat.over && guard++ < 90) {
var c = ST.S.combat, h = L.heroUnit(c), foes = L.enemies(c);
if (!foes.length) break;
c.turnIndex = c.order.indexOf('hero');
h.ap = 2; h.x = foes[0].x; h.y = Math.max(0, foes[0].y - 1);
L.attack(ST.S, c, h, foes[0]);
if (ST.S.combat && !ST.S.combat.over) L.endTurn(ST.S, ST.S.combat);
}
if (ST.S.combat && ST.S.combat.over) S.finishCombat();
return !ST.S.combat;
}],
['бой: победа двигает квест', function () {
fresh(); ST.loc = 'loc_mine';
L.setQuestStage(ST.S, 'q_ore', 1);
AU.applyEffects({ combat: 'drone', combatWinQuest: 'q_ore' });
var c = ST.S.combat;
if (!c) return 'бой не начался';
c.over = true; c.winner = 'hero';
S.finishCombat();
return ST.S.quests.q_ore.stage === 2 ? true : 'этап ' + ST.S.quests.q_ore.stage;
}],
['бой: поражение НЕ двигает квест', function () {
fresh(); ST.loc = 'loc_mine';
L.setQuestStage(ST.S, 'q_ore', 1);
AU.applyEffects({ combat: 'drone', combatWinQuest: 'q_ore' });
var c = ST.S.combat;
if (!c) return 'бой не начался';
L.heroUnit(c).hp = 0; L.heroUnit(c).alive = false;
c.over = true; c.winner = 'enemy';
S.finishCombat();
var b = document.querySelector('[data-test="afterdefeat"]');
if (!b) return 'нет кнопки поражения';
fire(b);
if (ST.S.quests.q_ore.stage !== 1) return 'этап уехал: ' + ST.S.quests.q_ore.stage;
return ST.S.weights.C === 1 ? true : 'нить C = ' + ST.S.weights.C;
}],
['поражение не забирает квестовый предмет', function () {
var st = L.create('noa');
st.bag = ['bondo7']; st.questItems = ['chip_low'];
var c = L.combatStart(st, ['drone'], {});
c.over = true; c.winner = 'enemy';
var res = L.combatResult(st, c);
return !res.win && L.hasItem(st, 'chip_low') && st.bag.indexOf('bondo7') < 0;
}],
['сейв и загрузка', function () {
rawSave(ST.S, 'auto');
var loaded = L.load('auto');
return !!loaded && loaded.hero === ST.S.hero && loaded.level === ST.S.level;
}],
['сейв: ручной слот, карточка, удаление', function () {
fresh(); ST.loc = 'loc_zhil'; ST.S.location = 'loc_zhil';
rawSave(ST.S, 'selftest');
var info = L.slotInfo('selftest');
var ok = !!info && info.hero === 'noa' && info.location === 'Жилой сектор' && !!info.savedAt;
try { localStorage.removeItem('gryft.selftest'); } catch (e) {}
return ok && !L.slotInfo('selftest');
}],
['настройки: сохраняются и читаются', function () {
var before = AU.getSettings().bigFont;
AU.setSetting('bigFont', !before);
var stored = JSON.parse(localStorage.getItem('gryft.settings') || '{}');
var ok = stored.bigFont === !before;
AU.setSetting('bigFont', before);
return ok;
}],
['анимации: выключатель глушит всё', function () {
var was = UI.motionEnabled();
UI.setMotion(false);
var off = UI.motionState();
UI.setMotion(true);
var on = UI.motionState();
UI.setMotion(was);
return (!off.dust && !off.parallax && !off.flares && on.dust && on.parallax) ? true
: JSON.stringify(off) + ' / ' + JSON.stringify(on);
}],
['плеер: треки, громкость, mute', function () {
var st = UI.player.state();
if (st.count < 1) return 'нет треков';
UI.player.setVolume(0.5);
var v = UI.player.state().volume === 0.5;
UI.player.setMute(true);
var m = UI.$('amb').muted === true;
UI.player.setMute(false);
return v && m;
}],
['плеер: трек не зациклен и автопереходит', function () {
var a = UI.$('amb');
if (!a) return 'нет audio';
if (a.loop || a.hasAttribute('loop')) return 'loop включён — трек никогда не закончится';
var st = UI.player.state();
if (st.count < 2) return true;
var i0 = st.idx;
a.dispatchEvent(new Event('ended'));
var moved = UI.player.state().idx !== i0;
UI.player.pause();
return moved ? true : 'индекс не сменился по ended';
}],
['плеер: выпадашка открывается', function () {
UI.player.open();
var ok = !!document.getElementById('mplayer') && UI.player.isOpen();
UI.player.close();
return ok;
}],
['панель: пауза → настройки не пустеет', function () {
fresh(); S.showHub(); AU.showPause();
var b = panelBtn('Настройки');
if (!b) return 'нет кнопки настроек';
fire(b);
return new Promise(function (res) {
setTimeout(function () {
var p = document.getElementById('panel');
var ok = !!p && p.textContent.indexOf('Настройки') >= 0 && document.getElementById('overlay').classList.contains('is-open');
UI.closePanel();
res(ok ? true : 'панель стёрта таймером');
}, 420);
});
}],
['панель: пауза → журнал не пустеет', function () {
S.showHub(); AU.showPause();
var b = panelBtn('Журнал');
if (!b) return 'нет кнопки журнала';
fire(b);
return new Promise(function (res) {
setTimeout(function () {
var ok = !!document.querySelector('#panel .journal__list');
UI.closePanel();
res(ok ? true : 'журнал стёрт таймером');
}, 420);
});
}],
['нить и финал', function () {
var st = L.create('noa');
st.quests.q_final.started = true;
st.quests.q_final.stage = D.QUESTS.q_final.stages.length;
L.completeQuest(st, 'q_final', 'A');
var e = L.ending(st);
return !!e && e.hero === 'noa' && e.thread === 'A' && e.text.join(' ').length > 80;
}]
];
(function runAt(k) {
if (k >= steps.length) return out();
var name = steps[k][0], fn = steps[k][1], settled = false;
function finish(r, note) {
if (settled) return;
settled = true;
TR.push({ name: name, ok: r === true, note: note || (typeof r === 'string' ? r : '') });
setTimeout(function () { runAt(k + 1); }, 25);
}
var to = setTimeout(function () { finish(false, 'таймаут'); }, 5000);
try {
var r = fn();
if (r && typeof r.then === 'function') {
r.then(function (v) { clearTimeout(to); finish(v); },
function (e) { clearTimeout(to); finish(false, (e && e.message) || 'ошибка'); });
} else { clearTimeout(to); finish(r); }
} catch (e) { clearTimeout(to); finish(false, e.message); }
})(0);
};

/* ================= запуск ================= */
window.onerror = function (m, src, line) {
var b = document.getElementById('testout');
if (!b) {
b = document.createElement('div');
b.id = 'testout';
b.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9999;padding:10px;background:#200;color:#faa;font:12px monospace;max-width:90vw';
document.body.appendChild(b);
}
b.style.background = '#200'; b.style.color = '#faa';
b.textContent = 'ОШИБКА: ' + m + ' @ ' + (src || '').split('/').pop() + ':' + line;
return false;
};
function boot() {
reportMissing(missingBlocks());
if (/[?&]noveil/.test(location.search)) UI.$('stage').classList.add('no-veil');
UI.init();
wireHud();
UI.player.init({
volume: settings.volume,
mute: settings.mute,
track: settings.track,
onChange: function (s) {
settings.volume = s.volume;
settings.mute = s.mute;
if (s.track) settings.track = s.track;
saveSettings();
}
});
applySettings();
S.showTitle();
var h = (location.hash || '').replace('#', '');
if (h === 'selftest') { setTimeout(function () { AU.runSelfTest(); }, 300); return; }
if (h.indexOf('dev:') === 0) {
ST.S = L.create('noa');
var what = h.slice(4);
UI.setHudVisible(true);
UI.updateHud(ST.S, L, D);
if (what === 'heroes') S.showHeroes();
else if (what === 'hub') S.showHub();
else if (what === 'loc') { ST.loc = 'loc_zhil'; S.showLocation('loc_zhil'); }
else if (what === 'pause') { S.showHub(); setTimeout(function () { AU.showPause(); }, 350); }
else if (what === 'settings') { S.showHub(); AU.showSettings(); }
else if (what === 'save') { S.showHub(); AU.showSave(); }
else if (what === 'load') { S.showHub(); AU.showLoad(); }
else if (what === 'music') { S.showHub(); UI.player.open(); }
else if (what === 'dlg') { ST.loc = 'loc_zhil'; S.openDialogue('dlg_zhil'); }
else if (what === 'combat') { ST.loc = 'loc_mine'; S.startCombat('drone,drone'); }
else if (what === 'trade') { ST.loc = 'loc_canteen'; S.showTrade('kim'); }
else if (what === 'journal') { L.startQuest(ST.S, 'q_mira'); L.advanceQuest(ST.S, 'q_mira'); S.showHub(); S.showJournal(); }
else if (what === 'levelup') { ST.S.points = 3; S.showHub(); S.showLevelUp(); }
else if (what === 'inv') { ST.S.hp = 32; S.showHub(); S.showInventory(); }
else if (what === 'quest') { L.setQuestStage(ST.S, 'q_ore', 1); ST.loc = 'loc_mine'; S.showQuest('q_ore'); }
else if (what === 'end') {
L.setQuestStage(ST.S, 'q_final', D.QUESTS.q_final.stages.length);
L.completeQuest(ST.S, 'q_final', 'A');
S.showEnding();
}
else S.showHub();
}
}
document.addEventListener('DOMContentLoaded', function () {
ensureData().then(boot, boot);
});
AU.Screens = S;
AU.getS = function () { return ST.S; };
AU.setS = function (v) { ST.S = v; };
})(window);
/* =========================================================
Экраны: бой на сетке 6×6 и эпилог. Версия 3.0.
after(win) — победа и поражение различаются.
========================================================= */
(function (G) {
'use strict';
var UI = G.UI;
var AU = G.AU;
var ST = AU.state;
var D = AU.D, L = AU.L;
var S = G.Screens;
function mount(screen) { return UI.mount(screen); }
function bandName(b) { return b === 'melee' ? 'ближний' : b === 'short' ? 'короткий' : 'дальний'; }

S.startCombat = function (enemyKey, after) {
var s = ST.S;
var keys = enemyKey.split(',').map(function (k) { return k.trim(); }).filter(function (k) { return D.ENEMIES[k]; });
if (!keys.length) keys = ['drone'];
s.combat = L.combatStart(s, keys, { after: after });
S.renderCombat();
};

S.renderCombat = function () {
var s = ST.S;
var c = s.combat;
if (!c) return;
UI.setScene('bg_arrival.png');
UI.setHudVisible(true);
var hero = L.heroUnit(c);
var cur = L.current(c);
var w = L.weapon(s);
UI.updateHud(Object.assign({}, s, { hp: Math.max(0, hero.hp) }), L, D);
UI.setWhere('Бой · раунд ' + c.round);
var root = mount('combat');
root.appendChild(S.pageHead('Бой', 'Раунд ' + c.round,
'ход: ' + (cur ? cur.name : '—') + ' · HP ' + Math.max(0, hero.hp) + '/' + hero.maxHp + ' · AP ' + hero.ap,
[S.btn('Закончить ход', 'endturn', function () {
if (!s.combat || s.combat.over) return;
L.endTurn(s, c);
if (!c.over) return S.renderCombat();
S.finishCombat();
}, 'btn--primary')]));
var wrap = UI.el('div', 'combat');

/* --- сетка --- */
var grid = UI.el('div', 'grid');
grid.title = 'дальность оружия: ' + w.range + ' кл. · шаг: до 3 кл. за 1 AP';
for (var y = 0; y < L.GRID; y++) {
for (var x = 0; x < L.GRID; x++) {
var cv = L.coverAt(x, y);
var cell = UI.el('div', 'cell' + (cv ? ' cell--cover' : ''));
cell.setAttribute('data-cell', x + ',' + y);
if (cv) {
cell.title = cv.type === 'full'
? 'полное укрытие: +4 к защите, блокирует линию огня — встать можно'
: 'полуукрытие: +2 к защите от выстрелов';
cell.setAttribute('data-cover', cv.type);
if (cv.type === 'full') cell.style.background = 'rgba(90, 78, 44, .72)';
}
var u = c.units.filter(function (z) { return z.alive && z.x === x && z.y === y; })[0];
if (u) {
var box = UI.el('div', 'u ' + (u.side === 'hero' ? 'u--h' : 'u--e'), u.name.split(' ')[0] + ' ' + u.hp);
if (u.id === (cur && cur.id)) box.title = 'сейчас ходит';
if (u.bleed) box.title = (box.title || '') + ' · кровотечение ' + u.bleed;
cell.appendChild(box);
cell.addEventListener('click', function (uu) { return function () { S.onCellClick(uu.x, uu.y); }; }(u));
} else {
cell.addEventListener('click', function (xx, yy) { return function () { S.onCellClick(xx, yy); }; }(x, y));
}
grid.appendChild(cell);
}
}
wrap.appendChild(grid);

/* --- боковая панель --- */
var side = UI.el('div', 'combat__side');
var wsec = UI.el('div', 'sec');
wsec.appendChild(UI.el('span', '', 'Оружие'));
wsec.appendChild(UI.el('span', '', w.range + ' кл.'));
side.appendChild(wsec);
var wu = UI.el('div', 'units');
var wr1 = UI.el('div', 'unit');
wr1.appendChild(UI.el('span', '', w.name));
wr1.appendChild(UI.el('span', 'unit__hp', 'урон ' + w.dmg));
wu.appendChild(wr1);
var wr2 = UI.el('div', 'unit');
wr2.appendChild(UI.el('span', '', bandName(L.weaponBand(w)) + ' · точность ' + (w.acc >= 0 ? '+' : '') + (w.acc || 0)));
wr2.appendChild(UI.el('span', 'unit__hp',
w.pierce ? 'пробивает укрытие' : w.stun ? 'отнимает AP' : w.bleed ? 'кровотечение' : 'без свойств'));
wu.appendChild(wr2);
side.appendChild(wu);
var acc = L.skill(s, L.weaponBand(w) === 'melee' ? 'draka' : 'strelba') + L.heroAccuracyBonus(s) + (w.acc || 0);
side.appendChild(UI.el('div', 'hint',
'попадание: d20 ' + (acc >= 0 ? '+ ' : '− ') + Math.abs(acc) + ' против защиты · 20 всегда попадает, 1 всегда мимо'));
side.appendChild(UI.el('div', 'hint',
'2 AP: шаг до 3 клеток — 1, атака — 1. Янтарные клетки — укрытия: полу +2, полное +4 и режет линию огня. В упор укрытие не работает.'));

var orderSec = UI.el('div', 'sec');
orderSec.appendChild(UI.el('span', '', 'Очередь'));
orderSec.appendChild(UI.el('span', '', 'раунд ' + c.round));
side.appendChild(orderSec);
var ord = UI.el('div', 'units');
c.order.forEach(function (id) {
var u = L.unit(c, id);
if (!u) return;
var r = UI.el('div', 'unit' + (u.alive ? '' : ' unit--foe'));
var mark = (cur && cur.id === u.id) ? '▸ ' : (u.alive ? '  ' : '× ');
r.appendChild(UI.el('span', '', mark + u.name));
r.appendChild(UI.el('span', 'unit__hp', u.alive ? ('HP ' + u.hp) : 'выведен'));
ord.appendChild(r);
});
side.appendChild(ord);

var foeSec = UI.el('div', 'sec');
foeSec.appendChild(UI.el('span', '', 'Цели'));
side.appendChild(foeSec);
var units = UI.el('div', 'units');
L.enemies(c).forEach(function (e) {
var pv = L.previewAttack(s, c, hero, e);
var info = 'HP ' + e.hp + ' · ' + L.dist(hero, e) + ' кл.';
if (pv.ok) info += ' · ' + pv.chance + '%' + (pv.cover ? ' · укрытие +' + pv.cover : '');
else info += ' · ' + pv.reason + ' (моя ' + hero.range + ' кл.)';
var r = UI.el('div', 'unit unit--foe');
r.title = e.name + ': стреляет на ' + e.range + ' кл.';
r.appendChild(UI.el('span', '', e.name));
r.appendChild(UI.el('span', 'unit__hp', info));
units.appendChild(r);
});
side.appendChild(units);

var acts = UI.el('div', 'row');
s.bag.forEach(function (id, i) {
var it = D.ITEMS[id];
if (!it || (!it.heal && !it.combat)) return;
var b = UI.el('button', 'btn btn--sm', it.name);
b.type = 'button';
b.setAttribute('data-test', 'citem' + i);
b.addEventListener('click', function () {
var res = L.useItemCombat(s, c, id);
UI.toast(res.text || '');
if (!c.over) S.renderCombat(); else S.finishCombat();
});
acts.appendChild(b);
});
side.appendChild(acts);

var log = UI.el('div', 'combat__log');
c.log.slice(-18).forEach(function (t) { log.appendChild(UI.el('div', '', t)); });
side.appendChild(log);
wrap.appendChild(side);
root.appendChild(wrap);
if (c.over) S.finishCombat();
};

S.onCellClick = function (x, y) {
var s = ST.S;
var c = s.combat;
if (!c || c.over) return;
var cur = L.current(c);
if (!cur || cur.side !== 'hero') { UI.toast('сейчас ходит ' + (cur ? cur.name : '—')); return; }
var target = c.units.filter(function (u) {
return u.alive && u.x === x && u.y === y && u.side === 'enemy';
})[0];
if (target) {
var pv = L.previewAttack(s, c, cur, target);
if (!pv.ok) { UI.toast(pv.reason); return; }
var r = L.attack(s, c, cur, target);
if (!r.ok) UI.toast(r.text || 'не вышло');
} else {
if (!L.move(c, cur, x, y)) { UI.toast('нельзя: далеко, занято или это твоя клетка'); return; }
}
if (c.over) return S.finishCombat();
S.renderCombat();
};

S.finishCombat = function () {
var s = ST.S;
var c = s.combat;
if (!c || !c.over) return;
var after = c.after;
var res = L.combatResult(s, c);
s.combat = null;
L.save(s, 'auto');
if (res.win) {
UI.toast('Победа');
if (after) after(true); else S.showHub();
return;
}
var p = UI.panel({ kicker: 'Исход', title: 'Поражение', footRight: 'нить C +1' });
var body = UI.el('div', 'stack');
body.appendChild(UI.el('p', 'title__sub', 'Ты проиграл бой. Тебя не убили — но и не отпустили просто так.'));
var list = UI.el('div', 'list');
[['потерян предмет из рюкзака', res.lost ? ('потеряно: ' + res.lost) : 'нечего терять'],
['здоровье восстановлено до минимума', 'HP 1 / ' + s.maxHp],
['дело не продвинулось', 'этап остался прежним'],
['отмечено в твоей линии', 'вес нити C +1']].forEach(function (x, i) {
var r = UI.el('div', 'lrow lrow--failed');
r.style.setProperty('--i', i);
var m = UI.el('div', 'lrow__main');
m.appendChild(UI.el('div', 'lrow__t', x[0]));
m.appendChild(UI.el('div', 'lrow__s', x[1]));
r.appendChild(m);
list.appendChild(r);
});
body.appendChild(list);
var go = UI.el('button', 'btn btn--primary');
go.type = 'button';
go.setAttribute('data-test', 'afterdefeat');
go.appendChild(UI.el('span', '', 'Продолжить'));
go.addEventListener('click', function () {
UI.closePanel();
ST.S.hp = 1;
if (after) after(false); else S.showHub();
});
body.appendChild(go);
p._body.appendChild(body);
UI.openPanel(p);
};

/* ================= финал ================= */
S.showEnding = function () {
var s = ST.S;
var e = L.ending(s);
s.ending = e;
UI.setScene('bg_dome.png');
UI.setHudVisible(true);
UI.updateHud(s, L, D);
UI.setWhere('Эпилог');
var root = mount('end');
root.appendChild(UI.el('p', 'kicker', 'эпилог'));
var wrap = UI.el('div', 'ending');
wrap.appendChild(UI.el('h1', 'ending__title', e.title));
e.text.forEach(function (t) { wrap.appendChild(UI.el('p', '', t)); });
var stats = UI.el('div', 'row');
[['герой', D.HEROES[s.hero].name],
['нить', L.thread(s)],
['уровень', String(s.level)],
['проверки', s.passed + '/' + s.checks],
['дел', String(L.questsDone(s))],
['кредитов', String(s.credits)]].forEach(function (x) {
var p = UI.el('span', 'pill');
p.appendChild(document.createTextNode(x[0] + ' '));
p.appendChild(UI.el('b', '', x[1]));
stats.appendChild(p);
});
wrap.appendChild(stats);
var again = UI.el('button', 'btn btn--primary');
again.type = 'button';
again.setAttribute('data-test', 'again');
again.appendChild(UI.el('span', '', 'Новая смена'));
again.addEventListener('click', function () { S.showTitle(); });
wrap.appendChild(again);
root.appendChild(wrap);
};
})(window);
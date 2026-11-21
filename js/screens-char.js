/* =========================================================
Экраны персонажа 3.0: кукла-сетка, рюкзак 16, квестовое
отдельно, улики в журнале, вкладка «Склонность», торговля.
========================================================= */
(function (G) {
'use strict';
var UI = G.UI;
var AU = G.AU;
var ST = AU.state;
var D = AU.D, L = AU.L;
var S = G.Screens;

var BAG = L.BAG_SLOTS || 16;
var SLOTS = D.SLOTS || [
['head', 'ГОЛОВА'], ['handL', 'РУКА Л'], ['body', 'ТЕЛО'], ['handR', 'РУКА П'],
['implant', 'ИМПЛАНТ'], ['belt', 'ПОЯС'], ['pocket1', 'КАРМАН 1'], ['pocket2', 'КАРМАН 2']
];
var SMALL = ['head', 'implant', 'handL', 'belt', 'pocket1', 'pocket2'];
var TYPE = {
med: 'МЕДИЦИНА', key: 'КЛЮЧ', tool: 'ИНСТРУМЕНТ', mask: 'МАСКА',
clue: 'УЛИКА', implant: 'ИМПЛАНТ', suit: 'КОСТЮМ', weapon: 'ОРУЖИЕ'
};
var THREAD_NAME = { A: 'Правда', B: 'Сделка', C: 'Молчание' };
var FILTERS = [['all', 'Всё'], ['weapon', 'Оружие'], ['suit', 'Броня'], ['med', 'Медицина'], ['other', 'Прочее']];

var sel = null, filter = 'all', tipEl = null, armedDrop = null;
var hoverOK = false;
try { hoverOK = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { hoverOK = true; }

function st() { return ST.S; }
function bagArr() { return (st().bag || []); }
function questArr() { return (st().questItems || []); }
function slotLabel(id) {
for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i][0] === id) return SLOTS[i][1];
return String(id || '').toUpperCase();
}
function has(id) {
if (L.hasItem) return L.hasItem(st(), id);
return bagArr().indexOf(id) >= 0 || questArr().indexOf(id) >= 0;
}
function addAny(id) {
var s = st();
if (L.addItem(s, id)) return true;
var d = def(id);
if (d && d.quest) { s.questItems = s.questItems || []; if (s.questItems.indexOf(id) < 0) s.questItems.push(id); return true; }
return false;
}
function removeAny(id) {
var s = st();
if (L.removeItem(s, id)) return true;
var i = bagArr().indexOf(id);
if (i >= 0) { s.bag.splice(i, 1); return true; }
i = questArr().indexOf(id);
if (i >= 0) { s.questItems.splice(i, 1); return true; }
return false;
}
function slotFor(it) {
if (!it) return null;
if (it.slot) return it.slot;
if (it.kind === 'mask') return 'head';
if (it.kind === 'implant') return 'implant';
if (it.kind === 'tool') return 'belt';
if (it.kind === 'suit') return 'body';
if (it.kind === 'weapon') return 'handR';
return null;
}
/* единое описание предмета: оружие, броня, вещь */
function def(id) {
if (!id) return null;
var w = D.WEAPONS[id];
if (w) {
var band = w.band === 'melee' ? 'ближний' : w.band === 'short' ? 'короткий' : 'дальний';
var tr = [];
if (w.pierce) tr.push('пробивает укрытие');
if (w.stun) tr.push('отнимает AP');
if (w.bleed) tr.push('кровотечение');
return {
id: id, name: w.name, kind: 'weapon', type: 'ОРУЖИЕ', slot: 'handR',
desc: w.desc || '', cost: w.cost || 0, glyph: '⌁', tags: tr,
stats: [['урон', String(w.dmg)], ['дальность', w.range + ' кл.'], ['полоса', band],
['точность', (w.acc >= 0 ? '+' : '') + (w.acc || 0)]]
};
}
var a = D.ARMORS[id];
if (a) {
return {
id: id, name: a.name, kind: 'suit', type: 'БРОНЯ', slot: 'body',
desc: a.desc || '', cost: a.cost || 0, glyph: '▦', tags: [],
stats: [['защита', '+' + a.def], ['снижение урона', String(a.dr || 0)]]
};
}
var it = D.ITEMS[id];
if (it) {
var stats = [];
if (it.heal) stats.push(['лечение', '+' + it.heal + ' HP']);
if (it.check) Object.keys(it.check).forEach(function (k) {
stats.push([D.SKILLS[k] ? D.SKILLS[k].name : k, '+' + it.check[k]]);
});
if (it.combat === 'stun') stats.push(['в бою', 'оглушение']);
if (it.unlock) stats.push(['доступ', it.unlock === 'admin' ? 'админ-блок' : it.unlock === 'server' ? 'серверная' : 'B-12']);
return {
id: id, name: it.name, kind: it.kind, type: TYPE[it.kind] || 'ПРЕДМЕТ',
slot: slotFor(it), desc: it.desc || '', cost: it.cost || 0,
glyph: UI.glyphFor(it), tags: [], stats: stats,
quest: !!it.quest, heal: it.heal, check: it.check, combat: it.combat
};
}
return null;
}
function isClue(id) { var d = def(id); return !!d && d.kind === 'clue'; }
function isQuest(id) { var d = def(id); return !!d && d.quest; }
function carry() { return bagArr().filter(function (id) { return def(id) && !isQuest(id); }); }
function questStuff() {
var out = [];
questArr().concat(bagArr()).forEach(function (id) {
if (!isQuest(id) || isClue(id)) return;
if (out.indexOf(id) < 0) out.push(id);
});
return out;
}
function clueStuff() {
var out = [];
questArr().concat(bagArr()).forEach(function (id) {
if (isClue(id) && out.indexOf(id) < 0) out.push(id);
});
return out;
}
function equipped(slot) {
var s = st();
if (slot === 'handR') return s.weapon;
if (slot === 'body') return s.armor && s.armor !== 'none' ? s.armor : null;
return (s.gear || {})[slot] || null;
}
function matchFilter(d) {
if (filter === 'all') return true;
if (filter === 'weapon') return d.kind === 'weapon';
if (filter === 'suit') return d.kind === 'suit';
if (filter === 'med') return d.kind === 'med';
return d.kind !== 'weapon' && d.kind !== 'suit' && d.kind !== 'med';
}
/* ---------- безопасная экипировка: старое не теряется ---------- */
function equipWeapon(id) {
var s = st(), old = s.weapon;
if (!L.equipWeapon(s, id)) return false;
if (old && D.WEAPONS[old] && s.weapon !== old && s.bag.indexOf(old) < 0 && s.bag.length < BAG) s.bag.push(old);
return true;
}
function equipArmor(id) {
var s = st(), old = s.armor;
if (!L.equipArmor(s, id)) return false;
if (old && old !== 'none' && D.ARMORS[old] && s.bag.indexOf(old) < 0 && s.bag.length < BAG) s.bag.push(old);
return true;
}
function equipGear(slot, id) {
var s = st();
s.gear = s.gear || {};
var prev = s.gear[slot];
if (!removeAny(id)) return false;
if (prev) addAny(prev);
s.gear[slot] = id;
return true;
}
function equipDefault(id) {
var d = def(id);
if (!d || !d.slot) { UI.toast('это не надевается'); return false; }
if (d.quest) { UI.toast('квестовое не надевается'); return false; }
var ok = d.slot === 'handR' && d.kind === 'weapon' ? equipWeapon(id)
: d.slot === 'body' && d.kind === 'suit' ? equipArmor(id)
: equipGear(d.slot, id);
UI.toast(ok ? d.name + ' → ' + slotLabel(d.slot) : 'некуда деть то, что снимаешь');
return ok;
}
function unequip(slot) {
var s = st(), id = equipped(slot);
if (!id) return false;
if (slot === 'handR') { filter = 'weapon'; UI.toast('оружие меняется: выбери другое в рюкзаке'); return true; }
if (s.bag.length >= BAG) { UI.toast('рюкзак полон'); return false; }
if (slot === 'body') { s.armor = 'none'; addAny(id); UI.toast('броня снята'); return true; }
delete s.gear[slot];
addAny(id);
UI.toast('снято: ' + (def(id) ? def(id).name : id));
return true;
}
function bonusSummary() {
var s = st(), out = [];
Object.keys(D.SKILLS).forEach(function (k) {
var v = 0;
if (L.checkBonus) v = L.checkBonus(s, k);
else {
bagArr().concat(questArr()).forEach(function (id) {
var it = D.ITEMS[id];
if (it && it.check && it.check[k]) v += it.check[k];
});
}
if (v) out.push(D.SKILLS[k].name + ' +' + v);
});
return out;
}

/* ================= всплывающая карточка ================= */
function tipHide() {
if (tipEl && tipEl.parentNode) tipEl.parentNode.removeChild(tipEl);
tipEl = null;
}
function tipCard(d, extra) {
var box = UI.el('div', 'tip');
var head = UI.el('div', 'tip__head');
head.appendChild(UI.el('span', 'tip__glyph', d.glyph));
var t = UI.el('div', 'tip__tt');
t.appendChild(UI.el('div', 'tip__t', d.name));
t.appendChild(UI.el('div', 'tip__type', d.type + (d.quest ? ' · квестовое' : '')));
head.appendChild(t);
box.appendChild(head);
if (d.stats.length) {
var ss = UI.el('div', 'tip__stats');
d.stats.forEach(function (x) {
var r = UI.el('div', 'tip__stat');
r.appendChild(UI.el('span', '', x[0]));
r.appendChild(UI.el('b', '', x[1]));
ss.appendChild(r);
});
box.appendChild(ss);
}
if (d.tags.length) box.appendChild(UI.el('div', 'tip__tags', d.tags.join(' · ')));
if (d.desc) box.appendChild(UI.el('div', 'tip__desc', d.desc));
var foot = UI.el('div', 'tip__foot');
foot.appendChild(UI.el('span', '', d.quest ? 'не продаётся' : (d.cost ? d.cost + ' кр. · продажа ' + Math.max(1, Math.round(d.cost * .5)) + ' кр.' : 'без цены')));
if (extra) foot.appendChild(UI.el('b', '', extra));
box.appendChild(foot);
return box;
}
function tipShow(d, ev, extra) {
if (!hoverOK || !d) return;
tipHide();
tipEl = tipCard(d, extra);
document.body.appendChild(tipEl);
var r = tipEl.getBoundingClientRect();
var x = ev.clientX + 16, y = ev.clientY + 14;
if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 16;
if (y + r.height > window.innerHeight - 8) y = Math.max(8, ev.clientY - r.height - 14);
tipEl.style.left = Math.max(8, x) + 'px';
tipEl.style.top = Math.max(8, y) + 'px';
}
document.addEventListener('pointerdown', tipHide, true);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tipHide(); }, true);

/* ================= рюкзак / персонаж ================= */
S.showInventory = function (fresh) {
tipHide();
var s = st();
s.gear = s.gear || {};
if (fresh !== false && !sel) {
var c = carry();
var heal = null;
if (s.hp < s.maxHp) {
for (var i = 0; i < c.length; i++) { var dd = def(c[i]); if (dd && dd.heal) { heal = c[i]; break; } }
}
sel = heal || c[0] || null;
}
if (sel && !has(sel)) sel = carry()[0] || null;
armedDrop = null;

var p = UI.panel({
kicker: 'Персонаж', title: D.HEROES[s.hero].name, wide: true,
footLeft: 'Esc — закрыть', footRight: 'ЛКМ — выбрать · 2×ЛКМ — надеть/использовать'
});

var stats = UI.el('div', 'statgrid');
var w = D.WEAPONS[s.weapon], ar = D.ARMORS[s.armor];
[['HP', s.hp + ' / ' + s.maxHp, 'живучесть'],
['УРОН', String(w.dmg + L.heroDamageBonus(s)), w.name],
['ЗАЩИТА', String(L.defense(s)), ar.name + ' · −' + (ar.dr || 0) + ' урона'],
['КРЕДИТЫ', String(s.credits), 'на счету']].forEach(function (x) {
var b = UI.el('div', 'statbox');
b.appendChild(UI.el('div', 'statbox__v', x[1]));
b.appendChild(UI.el('div', 'statbox__l', x[0] + ' · ' + x[2]));
stats.appendChild(b);
});
p._body.appendChild(stats);

var inv = UI.el('div', 'inv');
inv.appendChild(buildLeft());
inv.appendChild(buildRight());
p._body.appendChild(inv);
UI.openPanel(p);
};

function buildLeft() {
var s = st();
var col = UI.el('div', 'inv__left');
var head = UI.el('div', 'sec');
head.appendChild(UI.el('span', '', 'Снаряжение'));
head.appendChild(UI.el('span', '', 'клик — снять'));
col.appendChild(head);

var doll = UI.el('div', 'doll');
var main = UI.el('div', 'doll__main');
main.appendChild(slotCell('handR', true));
main.appendChild(slotCell('body', true));
doll.appendChild(main);
var grid = UI.el('div', 'doll__grid');
SMALL.forEach(function (sl) { grid.appendChild(slotCell(sl, false)); });
doll.appendChild(grid);
col.appendChild(doll);

var bs = bonusSummary();
var sum = UI.el('div', 'side-card');
sum.appendChild(UI.el('div', 'side-card__title', 'Бонусы проверок'));
sum.appendChild(UI.el('div', bs.length ? 'hint' : 'hint', bs.length ? bs.join(' · ') : 'предметы с бонусами не надеты и не в рюкзаке'));
var kv = UI.el('div', 'kv');
[['оружие', D.WEAPONS[s.weapon].name],
['броня', D.ARMORS[s.armor].name],
['напарники', String(s.companions.length)],
['уровень', String(s.level)]].forEach(function (x) {
kv.appendChild(UI.el('dt', '', x[0]));
kv.appendChild(UI.el('dd', '', x[1]));
});
sum.appendChild(kv);
col.appendChild(sum);
return col;
}

function slotCell(slot, big) {
var id = equipped(slot);
var d = def(id);
var b = UI.el('button', 'slot' + (big ? ' slot--big' : '') + (d ? ' slot--filled' : ''));
b.type = 'button';
b.setAttribute('data-test', 'slot_' + slot);
b.setAttribute('aria-label', slotLabel(slot) + (d ? ': ' + d.name : ': пусто'));
b.appendChild(UI.el('span', 'slot__label', slotLabel(slot)));
b.appendChild(UI.el('span', 'slot__glyph', d ? d.glyph : '·'));
b.appendChild(UI.el('span', d ? 'slot__name' : 'slot__empty', d ? d.name : 'пусто'));
if (d && d.stats.length) b.appendChild(UI.el('span', 'slot__meta', d.stats[0][0] + ' ' + d.stats[0][1]));
b.addEventListener('mouseenter', function (e) { if (d) tipShow(d, e, 'клик — снять'); });
b.addEventListener('mousemove', function (e) { if (d && tipEl) tipShow(d, e, 'клик — снять'); });
b.addEventListener('mouseleave', tipHide);
b.addEventListener('click', function () {
tipHide();
if (!d) { UI.toast(slotLabel(slot) + ': пусто — надень из рюкзака'); return; }
if (unequip(slot)) S.showInventory(false);
});
return b;
}

function buildRight() {
var s = st();
var col = UI.el('div', 'inv__right');
var head = UI.el('div', 'sec');
head.appendChild(UI.el('span', '', 'Рюкзак'));
head.appendChild(UI.el('span', '', carry().length + ' / ' + BAG));
col.appendChild(head);

var chips = UI.el('div', 'chips');
FILTERS.forEach(function (f) {
var b = UI.el('button', 'chip' + (filter === f[0] ? ' on' : ''), f[1]);
b.type = 'button';
b.setAttribute('data-test', 'filter_' + f[0]);
b.addEventListener('click', function () { filter = f[0]; S.showInventory(false); });
chips.appendChild(b);
});
col.appendChild(chips);

var grid = UI.el('div', 'baggrid');
var items = carry();
for (var i = 0; i < BAG; i++) {
grid.appendChild(bagCell(items[i], i));
}
col.appendChild(grid);
col.appendChild(detailCard());

var qs = questStuff();
var qsec = UI.el('div', 'qsec');
var qh = UI.el('div', 'sec');
qh.appendChild(UI.el('span', '', 'Квестовое'));
qh.appendChild(UI.el('span', '', qs.length + ' · вне слотов'));
qsec.appendChild(qh);
if (!qs.length) qsec.appendChild(UI.el('div', 'empty', 'квестовых предметов нет'));
qs.forEach(function (id, i) {
var d = def(id);
var row = UI.el('div', 'qrow');
row.style.setProperty('--i', i);
row.appendChild(UI.el('span', 'qrow__glyph', d.glyph));
var m = UI.el('div', 'qrow__main');
m.appendChild(UI.el('div', 'qrow__t', d.name));
m.appendChild(UI.el('div', 'qrow__s', d.desc || d.type));
row.appendChild(m);
row.appendChild(UI.el('span', 'lrow__badge', d.type));
row.addEventListener('mouseenter', function (e) { tipShow(d, e, 'не продаётся'); });
row.addEventListener('mouseleave', tipHide);
qsec.appendChild(row);
});
col.appendChild(qsec);
col.appendChild(UI.el('div', 'hint', 'улики лежат в журнале · вкладка «Улики»'));
return col;
}

function bagCell(id, i) {
var d = def(id);
var b = UI.el('button', 'bcell' + (d ? ' bcell--filled' : '') + (d && sel === id ? ' bcell--sel' : '') +
(d && !matchFilter(d) ? ' bcell--dim' : ''));
b.type = 'button';
b.style.setProperty('--i', i);
b.setAttribute('data-test', 'bag' + i);
b.appendChild(UI.el('span', 'bcell__n', String(i + 1).padStart(2, '0')));
b.appendChild(UI.el('span', 'bcell__glyph', d ? d.glyph : '·'));
b.appendChild(UI.el('span', 'bcell__name', d ? d.name : ''));
if (!d) { b.disabled = true; return b; }
b.setAttribute('aria-label', d.name);
b.addEventListener('mouseenter', function (e) { tipShow(d, e, d.slot ? 'двойной клик — надеть' : d.heal ? 'двойной клик — использовать' : ''); });
b.addEventListener('mousemove', function (e) { if (tipEl) tipShow(d, e, ''); });
b.addEventListener('mouseleave', tipHide);
b.addEventListener('click', function () { sel = id; armedDrop = null; S.showInventory(false); });
b.addEventListener('dblclick', function () {
tipHide();
sel = id;
if (d.slot && !d.quest) { if (equipDefault(id)) S.showInventory(false); }
else if (d.heal) { var r = L.useItem(st(), id); UI.toast((r && r.text) || 'использовано'); S.showInventory(false); }
else UI.toast('действие недоступно');
});
return b;
}

function detailCard() {
var s = st();
var d = def(sel);
var card = UI.el('div', 'card');
if (!d) {
card.appendChild(UI.el('div', 'card__empty', 'выбери предмет в рюкзаке — здесь появится карточка с действиями'));
return card;
}
var head = UI.el('div', 'card__head');
head.appendChild(UI.el('span', 'card__glyph', d.glyph));
var tt = UI.el('div', 'card__tt');
tt.appendChild(UI.el('div', 'card__title', d.name));
tt.appendChild(UI.el('div', 'card__type', d.type + (d.slot ? ' · ' + slotLabel(d.slot) : '') + (d.quest ? ' · квестовое' : '')));
head.appendChild(tt);
head.appendChild(UI.el('span', 'pill', d.quest ? 'не продаётся' : (d.cost ? d.cost + ' кр.' : '—')));
card.appendChild(head);
if (d.stats.length) {
var ss = UI.el('div', 'card__stats');
d.stats.forEach(function (x) {
var c = UI.el('div', 'card__stat');
c.appendChild(UI.el('span', '', x[0]));
c.appendChild(UI.el('b', '', x[1]));
ss.appendChild(c);
});
card.appendChild(ss);
}
if (d.tags.length) card.appendChild(UI.el('div', 'card__tags', d.tags.join(' · ')));
if (d.desc) card.appendChild(UI.el('div', 'card__desc', d.desc));
var acts = UI.el('div', 'card__acts');
function btn(label, cls, fn, test) {
var b = UI.el('button', 'btn btn--sm' + (cls ? ' ' + cls : ''), label);
b.type = 'button';
if (test) b.setAttribute('data-test', test);
b.addEventListener('click', fn);
return b;
}
if (d.slot && !d.quest) {
acts.appendChild(btn('Надеть', 'btn--primary', function () {
if (equipDefault(d.id)) S.showInventory(false);
}, 'equip0'));
}
if (d.heal) {
var ub = btn('Использовать', 'btn--primary', function () {
var r = L.useItem(st(), d.id);
UI.toast((r && r.text) || 'использовано');
S.showInventory(false);
}, 'use0');
if (s.hp >= s.maxHp) ub.title = 'здоровье полное';
acts.appendChild(ub);
}
if (d.combat === 'stun') acts.appendChild(UI.el('span', 'lrow__badge', 'работает в бою'));
if (!d.quest) {
var db = btn(armedDrop === d.id ? 'Точно выбросить?' : 'Выбросить', 'btn--danger', function () {
if (armedDrop === d.id) {
removeAny(d.id);
UI.toast('выброшено: ' + d.name);
sel = null;
S.showInventory(false);
} else {
armedDrop = d.id;
S.showInventory(false);
}
}, 'drop0');
acts.appendChild(db);
} else {
acts.appendChild(UI.el('span', 'lrow__badge', 'квестовое · не выбрасывается'));
}
card.appendChild(acts);
return card;
}

/* ================= уровень ================= */
S.showLevelUp = function () {
tipHide();
var s = st();
var p = UI.panel({
kicker: 'Развитие', title: 'Повышение уровня', wide: true,
footRight: 'очков: ' + s.points
});
var box = UI.el('div', 'lvl');
box.appendChild(UI.el('div', 'hint', s.points > 0
? 'очко тратится на атрибут, навык или перк · атрибуты тянут за собой все свои навыки'
: 'очков нет — закрывай дела и выигрывай бои'));

var attrs = UI.el('div', 'statgrid');
var ATTR_DESC = { telo: 'HP, Драка, Стрельба, Запугивание', um: 'Логика, Взлом', harizma: 'Убеждение, Интуиция' };
Object.keys(D.ATTRS).forEach(function (a) {
var b = UI.el('div', 'statbox');
b.appendChild(UI.el('div', 'statbox__v', String(s.attrs[a])));
b.appendChild(UI.el('div', 'statbox__l', D.ATTRS[a].name + ' · ' + ATTR_DESC[a]));
var btn = UI.el('button', 'btn btn--sm btn--primary', s.attrs[a] >= 12 ? 'предел' : '+ очко');
btn.type = 'button';
btn.disabled = s.points <= 0 || s.attrs[a] >= 12;
btn.setAttribute('data-test', 'attr_' + a);
btn.addEventListener('click', function () {
if (L.spendPoint(st(), 'attr', a)) { UI.toast(D.ATTRS[a].name + ' → ' + st().attrs[a]); S.showLevelUp(); }
else UI.toast('не хватает очков или предел');
});
b.appendChild(btn);
attrs.appendChild(b);
});
box.appendChild(attrs);

var secS = UI.el('div', 'sec');
secS.appendChild(UI.el('span', '', 'Навыки'));
secS.appendChild(UI.el('span', '', 'ранг + атрибут + перки + напарники'));
box.appendChild(secS);
var sg = UI.el('div', 'skills');
Object.keys(D.SKILLS).forEach(function (k) {
var row = UI.el('div', 'skill');
var nm = UI.el('span', 'skill__name', D.SKILLS[k].name + ' ');
nm.appendChild(UI.el('em', '', D.ATTRS[D.SKILLS[k].attr].short));
row.appendChild(nm);
row.appendChild(UI.el('span', 'skill__val', String(L.skill(s, k))));
var b = UI.el('button', 'btn btn--sm', (s.skills[k] || 0) >= 6 ? 'предел' : '+');
b.type = 'button';
b.disabled = s.points <= 0 || (s.skills[k] || 0) >= 6;
b.setAttribute('data-test', 'skill_' + k);
b.title = 'ранг ' + (s.skills[k] || 0) + ' из 6 · итоговый бонус ' + L.skill(s, k);
b.addEventListener('click', function () {
if (L.spendPoint(st(), 'skill', k)) { UI.toast(D.SKILLS[k].name + ' → ранг ' + st().skills[k]); S.showLevelUp(); }
else UI.toast('не хватает очков или предел');
});
row.appendChild(b);
sg.appendChild(row);
});
box.appendChild(sg);

var secP = UI.el('div', 'sec');
secP.appendChild(UI.el('span', '', 'Перки'));
secP.appendChild(UI.el('span', '', s.perks.length + ' взято'));
box.appendChild(secP);
var listEl = UI.el('div', 'list');
Object.keys(D.PERKS).forEach(function (id, i) {
var pk = D.PERKS[id];
var has = s.perks.indexOf(id) >= 0;
var avail = L.perkAvailable(s, id);
var row = UI.el('div', 'lrow' + (has ? ' lrow--done' : ''));
row.style.setProperty('--i', i);
var main = UI.el('div', 'lrow__main');
main.appendChild(UI.el('div', 'lrow__t', pk.name));
var req = Object.keys(pk.req || {}).map(function (k) {
var nm = D.ATTRS[k] ? D.ATTRS[k].name : D.SKILLS[k] ? D.SKILLS[k].name : k;
return nm + ' ' + pk.req[k];
}).join(' · ');
main.appendChild(UI.el('div', 'lrow__s', pk.desc + (req ? ' · нужно: ' + req : '')));
row.appendChild(main);
var b = UI.el('button', 'btn btn--sm' + (avail && !has && s.points > 0 ? ' btn--primary' : ''),
has ? 'взят' : avail ? 'Взять' : 'нет условий');
b.type = 'button';
b.disabled = !avail || has || s.points <= 0;
b.setAttribute('data-test', 'perk_' + id);
b.addEventListener('click', function () {
if (L.spendPoint(st(), 'perk', id)) { UI.toast('Перк: ' + pk.name); S.showLevelUp(); }
});
row.appendChild(b);
listEl.appendChild(row);
});
box.appendChild(listEl);
p._body.appendChild(box);
UI.openPanel(p);
};

/* ================= журнал ================= */
function journalData() {
var s = st();
var j = L.journal(s);
if (!j.clues) {
j.clues = clueStuff().map(function (id) {
var d = def(id);
return { id: id, name: d.name, desc: d.desc };
});
}
return j;
}
S.showJournal = function () {
tipHide();
var s = st();
var j = journalData();
function locName(id) {
var l = D.LOCATIONS.filter(function (x) { return x.id === id; })[0];
return l ? l.name : '—';
}
function lineName(line) { return line === 'personal' ? 'личное' : line === 'faction' ? 'фракция' : 'линия'; }
var p = UI.panel({ kicker: 'Архив', title: 'Журнал', wide: true, footRight: 'AU MIC · R-7' });
var box = UI.el('div', 'journal');
var tabs = UI.el('div', 'tabs');
var listEl = UI.el('div', 'journal__list');

function row(title, sub, mod, i, fn, badge) {
var r = UI.el('div', 'lrow' + (mod ? ' ' + mod : ''));
r.style.setProperty('--i', i);
var m = UI.el('div', 'lrow__main');
m.appendChild(UI.el('div', 'lrow__t', title));
if (sub) m.appendChild(UI.el('div', 'lrow__s', sub));
r.appendChild(m);
if (badge) r.appendChild(UI.el('span', 'lrow__badge', badge));
if (fn) {
r.style.cursor = 'pointer';
r.setAttribute('role', 'button');
r.tabIndex = 0;
r.addEventListener('click', fn);
r.addEventListener('keydown', function (e) { if (e.key === 'Enter') fn(); });
}
return r;
}
function openQuest(id) { UI.closePanel(); S.showQuest(id); }

function renderThread() {
var w = s.weights || { A: 0, B: 0, C: 0 };
var total = (w.A || 0) + (w.B || 0) + (w.C || 0);
var lead = L.thread(s);
var wrap = UI.el('div', 'thread');
var leadRow = UI.el('div', 'thread__lead');
leadRow.appendChild(UI.el('span', '', 'сейчас ведёт'));
leadRow.appendChild(UI.el('b', '', THREAD_NAME[lead] + ' · ' + lead));
leadRow.appendChild(UI.el('span', '', total ? 'весов набрано: ' + total : 'ещё нет решений'));
wrap.appendChild(leadRow);
['A', 'B', 'C'].forEach(function (k, i) {
var pct = total ? Math.round((w[k] || 0) / total * 100) : 0;
var r = UI.el('div', 'thread__row' + (k === lead ? ' on' : ''));
r.style.setProperty('--i', i);
r.appendChild(UI.el('span', 'thread__label', k + ' · ' + THREAD_NAME[k]));
var bar = UI.el('div', 'thread__bar');
var fill = UI.el('i');
fill.style.width = pct + '%';
fill.className = 'th-' + k;
bar.appendChild(fill);
r.appendChild(bar);
r.appendChild(UI.el('span', 'thread__val', (w[k] || 0) + ' · ' + pct + '%'));
wrap.appendChild(r);
});
wrap.appendChild(UI.el('div', 'hint',
'закрытое дело даёт +5 своей нити · критический успех +1 к A · поражение в бою +1 к C'));
wrap.appendChild(UI.el('div', 'hint',
s.flags && s.flags.lost_fight ? 'вариант финала: 2 — был проигрыш в бою' : 'вариант финала: 1 — без поражений'));
var ah = UI.el('div', 'sec');
ah.appendChild(UI.el('span', '', 'Последние якоря'));
var anchors = (s.anchors || []).slice(-5).reverse();
ah.appendChild(UI.el('span', '', String(anchors.length)));
wrap.appendChild(ah);
if (!anchors.length) wrap.appendChild(UI.el('div', 'empty', 'решений ещё не было — нити пустые'));
anchors.forEach(function (a, i) {
var r = UI.el('div', 'anchor th-border-' + a.thread);
r.style.setProperty('--i', i);
r.appendChild(UI.el('span', 'anchor__th', a.thread));
r.appendChild(UI.el('span', 'anchor__t', a.src || ('решение · нить ' + a.thread)));
r.appendChild(UI.el('span', 'anchor__w', '+' + a.w));
wrap.appendChild(r);
});
listEl.appendChild(wrap);
}

function render(tab) {
UI.clear(listEl);
var count = 0;
if (tab === 'active') {
j.active.forEach(function (q, i) {
var num = q.ready ? q.total + 1 : Math.min(q.index + 1, q.total + 1);
var sub = q.ready ? 'все этапы пройдены · выбери исход' : 'этап ' + num + '/' + q.total + ' · ' + q.stage;
if (q.hint && !q.ready) sub += ' — ' + q.hint;
listEl.appendChild(row(q.title, sub, q.ready ? 'lrow--now' : '', i, function () { openQuest(q.id); },
q.ready ? 'решение' : 'в работе'));
count++;
});
if (!count) listEl.appendChild(UI.el('div', 'empty', 'нет активных дел'));
} else if (tab === 'done') {
j.done.forEach(function (q, i) {
listEl.appendChild(row(q.title, 'исход: ' + q.branch + ' · ' + lineName(q.line), 'lrow--done', i,
function () { openQuest(q.id); }, 'закрыто'));
count++;
});
if (!count) listEl.appendChild(UI.el('div', 'empty', 'ничего не закрыто'));
} else if (tab === 'failed') {
j.failed.forEach(function (q, i) {
listEl.appendChild(row(q.title, lineName(q.line), 'lrow--failed', i,
function () { openQuest(q.id); }, 'провал'));
count++;
});
if (!count) listEl.appendChild(UI.el('div', 'empty', 'проваленных дел нет'));
} else if (tab === 'where') {
j.where.filter(function (q) { return q.available; }).forEach(function (q, i) {
listEl.appendChild(row(q.title, 'где искать: ' + locName(q.where) + ' · ' + q.giver, '', i,
function () { openQuest(q.id); }, 'не взято'));
count++;
});
if (!count) listEl.appendChild(UI.el('div', 'empty', 'новых дел нет — ищи в комнатах и разговорах'));
} else if (tab === 'facts') {
var seen = {};
j.facts.forEach(function (f, i) {
var fact = D.FACTS[f] || { name: f, desc: '' };
seen[f] = true;
listEl.appendChild(row(fact.name, fact.desc, '', i, null, 'улика'));
count++;
});
j.clues.forEach(function (c, i) {
var it = D.ITEMS[c.id];
if (it && it.fact && seen[it.fact]) return;
listEl.appendChild(row(c.name, c.desc, 'lrow--now', count + i, null, 'предмет'));
count++;
});
if (!count) listEl.appendChild(UI.el('div', 'empty', 'улик пока нет'));
} else {
renderThread();
}
}

var clueCount = j.facts.length + j.clues.filter(function (c) {
var it = D.ITEMS[c.id];
return !(it && it.fact && j.facts.indexOf(it.fact) >= 0);
}).length;
[['active', 'Активные', j.active.length],
['done', 'Завершённые', j.done.length],
['failed', 'Проваленные', j.failed.length],
['where', 'Где искать', j.where.filter(function (q) { return q.available; }).length],
['facts', 'Улики', clueCount],
['thread', 'Склонность', (s.anchors || []).length]].forEach(function (t, i) {
var b = UI.el('button', 'tab' + (i === 0 ? ' on' : ''));
b.type = 'button';
b.setAttribute('data-test', 'tab_' + t[0]);
b.appendChild(document.createTextNode(t[1] + ' '));
b.appendChild(UI.el('span', '', String(t[2])));
b.addEventListener('click', function () {
Array.prototype.forEach.call(tabs.children, function (c) { c.classList.remove('on'); });
b.classList.add('on');
render(t[0]);
});
tabs.appendChild(b);
});
box.appendChild(tabs);
box.appendChild(listEl);
var foot = UI.el('div', 'journal__foot');
['проверок: ' + s.passed + '/' + s.checks,
'дел закрыто: ' + L.questsDone(s),
'в работе: ' + L.questsActive(s),
'напарников: ' + s.companions.length].forEach(function (t) { foot.appendChild(UI.el('span', '', t)); });
box.appendChild(foot);
render('active');
p._body.appendChild(box);
UI.openPanel(p);
};

/* ================= торговля ================= */
S.showTrade = function (mid) {
tipHide();
var s = st();
var m = D.MERCHANTS[mid];
if (!m) return;
UI.setScene('bg_arrival.png');
UI.setHudVisible(true);
UI.updateHud(s, L, D);
UI.setWhere('Торговля · ' + m.name);
var root = UI.mount('trade');
var rep = s.rep[m.faction] || 0;
root.appendChild(S.pageHead('Торговля', m.name, m.greet,
[S.btn('← Назад', 'back', function () { ST.loc ? S.showLocation(ST.loc) : S.showHub(); }, 'btn--ghost')]));

var wrap = UI.el('div', 'trade');
var buyCol = UI.el('div', 'trade__col');
var buyHead = UI.el('div', 'trade__head');
buyHead.appendChild(UI.el('div', 'sec', 'Продаёт'));
buyHead.appendChild(UI.el('span', 'pill pill--amber', s.credits + ' кр.'));
buyCol.appendChild(buyHead);
buyCol.appendChild(UI.el('div', 'hint', 'репутация ' + D.REP_NAMES[m.faction] + ' ' + (rep > 0 ? '+' : '') + rep +
' · цена ×' + (Math.max(.7, Math.min(1.4, 1 - rep * .04))).toFixed(2)));
var buyList = UI.el('div', 'trade__list');
var stock = (m.stock || []).concat(m.weapons || []).concat(m.armors || []);
stock.forEach(function (id, i) {
var d = def(id);
if (!d) return;
var price = L.price(s, d.cost, mid);
var r = UI.el('div', 'lrow');
r.style.setProperty('--i', i);
r.appendChild(UI.el('span', 'qrow__glyph', d.glyph));
var main = UI.el('div', 'lrow__main');
main.appendChild(UI.el('div', 'lrow__t', d.name));
main.appendChild(UI.el('div', 'lrow__s', d.stats.map(function (x) { return x[0] + ' ' + x[1]; }).join(' · ') || d.desc));
r.appendChild(main);
r.appendChild(UI.el('span', 'pill', price + ' кр.'));
var b = UI.el('button', 'btn btn--sm btn--primary', 'Купить');
b.type = 'button';
b.disabled = s.credits < price;
b.setAttribute('data-test', 'buy' + i);
b.addEventListener('click', function () {
var kind = D.WEAPONS[id] ? 'weapon' : D.ARMORS[id] ? 'armor' : 'item';
var res = L.buy(st(), mid, kind, id);
UI.toast(res.text || (res.ok ? 'куплено' : 'не вышло'));
if (res.ok) S.showTrade(mid);
});
r.appendChild(b);
r.addEventListener('mouseenter', function (e) { tipShow(d, e, price + ' кр.'); });
r.addEventListener('mouseleave', tipHide);
buyList.appendChild(r);
});
buyCol.appendChild(buyList);
wrap.appendChild(buyCol);

var sellCol = UI.el('div', 'trade__col');
var sellHead = UI.el('div', 'trade__head');
sellHead.appendChild(UI.el('div', 'sec', 'Скупает'));
var sellable = bagArr().filter(function (id) { return def(id) && !isQuest(id); });
sellHead.appendChild(UI.el('span', 'pill', sellable.length + ' предм.'));
sellCol.appendChild(sellHead);
sellCol.appendChild(UI.el('div', 'hint', 'половина цены · квестовое и улики не скупаются'));
var sellList = UI.el('div', 'trade__list');
if (!sellable.length) sellList.appendChild(UI.el('div', 'empty', 'нечего продавать'));
sellable.forEach(function (id, i) {
var d = def(id);
var price = Math.max(1, Math.round(d.cost * .5));
var r = UI.el('div', 'lrow');
r.style.setProperty('--i', i);
r.appendChild(UI.el('span', 'qrow__glyph', d.glyph));
var main = UI.el('div', 'lrow__main');
main.appendChild(UI.el('div', 'lrow__t', d.name));
main.appendChild(UI.el('div', 'lrow__s', d.type + (d.desc ? ' · ' + d.desc : '')));
r.appendChild(main);
r.appendChild(UI.el('span', 'pill', price + ' кр.'));
var b = UI.el('button', 'btn btn--sm', 'Продать');
b.type = 'button';
b.setAttribute('data-test', 'sell' + i);
b.addEventListener('click', function () {
var res = L.sell(st(), id);
UI.toast(res.text || (res.ok ? 'продано' : 'не вышло'));
S.showTrade(mid);
});
r.appendChild(b);
r.addEventListener('mouseenter', function (e) { tipShow(d, e, 'продажа ' + price + ' кр.'); });
r.addEventListener('mouseleave', tipHide);
sellList.appendChild(r);
});
sellCol.appendChild(sellList);
wrap.appendChild(sellCol);
root.appendChild(wrap);
};
})(window);
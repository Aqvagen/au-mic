/*
AU MICROSCOPII — логика: d20, прокачка, инвентарь, торговля, бой 6×6,
квесты, факты, репутация, напарники, сохранения.
Версия 3.0: нити работают, questItems, экипировка без потерь, честный бой.
*/
(function (G) {
'use strict';
var D = G.D;
var L = {};
L.GRID = 6;
L.BAG_SLOTS = 16;
function rnd(n) { return Math.floor(Math.random() * n); }
L.d20 = function () { return 1 + rnd(20); };
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
/* ================= СОСТОЯНИЕ ================= */
L.create = function (heroId) {
var h = D.HEROES[heroId];
if (!h) throw new Error('нет героя');
var st = {
v: 3,
dlgv: D.VERSION,
hero: heroId,
attrs: Object.assign({}, h.attrs),
skills: Object.assign({}, h.skills),
perks: [],
xp: 0, level: 1, points: 0,
hp: 0, maxHp: 0,
weapon: h.weapon, armor: h.armor,
gear: {},
bag: [],
questItems: [],
credits: h.credits,
rep: Object.assign({}, D.REP_START),
facts: {},
flags: {},
quests: {},
companions: [],
usedChecks: {},
weights: { A: 0, B: 0, C: 0 },
anchors: [],
log: [],
combat: null,
ending: null,
location: null,
savedAt: null,
scene: null,
checks: 0, passed: 0
};
Object.keys(D.QUESTS).forEach(function (q) {
st.quests[q] = { started: false, stage: 0, done: false, branch: null, failed: false };
});
h.bag.forEach(function (id) { L.addItem(st, id); });
L.recalc(st);
st.hp = st.maxHp;
return st;
};
L.recalc = function (st) {
var base = 20 + st.attrs.telo * 6;
var bonus = 0;
st.perks.forEach(function (p) { if (D.PERKS[p].apply.hp) bonus += D.PERKS[p].apply.hp; });
st.maxHp = base + bonus;
if (st.hp > st.maxHp) st.hp = st.maxHp;
};
L.log = function (st, t) { st.log.push(t); if (st.log.length > 240) st.log.shift(); };
/* ================= НАВЫКИ ================= */
L.skill = function (st, skillId) {
var sk = D.SKILLS[skillId];
if (!sk) return 0;
var val = (st.skills[skillId] || 0) + (st.attrs[sk.attr] - 5);
st.perks.forEach(function (p) {
var a = D.PERKS[p].apply;
if (a.skill && a.skill[skillId]) val += a.skill[skillId];
});
st.companions.forEach(function (c) {
if (D.COMPANIONS[c] && D.COMPANIONS[c].skill === skillId) val += 1;
});
return val;
};
/* сумма бонусов предметов к навыку: рюкзак + надетое + квестовые */
L.checkBonus = function (st, skillId) {
var sum = 0;
function add(id) {
var it = D.ITEMS[id];
if (it && it.check && it.check[skillId]) sum += it.check[skillId];
}
(st.bag || []).forEach(add);
(st.questItems || []).forEach(add);
Object.keys(st.gear || {}).forEach(function (k) { add(st.gear[k]); });
return sum;
};
L.check = function (st, skillId, dc, opts) {
opts = opts || {};
var bonus = L.skill(st, skillId) + (opts.itemBonus || 0);
var roll = L.d20();
var total = roll + bonus;
var crit = roll === 20, fumble = roll === 1;
var success = crit || (!fumble && total >= dc);
st.checks++;
if (success) st.passed++;
if (crit) L.weight(st, 'A', 1, 'критический успех');
return {
roll: roll, bonus: bonus, total: total, dc: dc, crit: crit, fumble: fumble,
success: success,
label: crit ? 'критический успех' : fumble ? 'критический провал' : success ? 'успех' : 'провал'
};
};
/* ================= ОПЫТ ================= */
L.xpForNext = function (st) {
if (st.level >= D.MAX_LEVEL) return Infinity;
return D.XP_TABLE[st.level];
};
L.gainXp = function (st, xp) {
if (!xp) return;
st.xp += xp;
while (st.level < D.MAX_LEVEL && st.xp >= D.XP_TABLE[st.level]) {
st.xp -= D.XP_TABLE[st.level];
st.level++;
st.points++;
L.log(st, 'Уровень ' + st.level + ': +1 очко');
}
};
L.spendPoint = function (st, kind, id) {
if (st.points <= 0) return false;
if (kind === 'skill') {
if ((st.skills[id] || 0) >= 6) return false;
st.skills[id]++;
} else if (kind === 'attr') {
if (st.attrs[id] >= 12) return false;
st.attrs[id]++;
if (id === 'telo') { L.recalc(st); st.hp = Math.min(st.maxHp, st.hp + 6); }
} else if (kind === 'perk') {
if (!D.PERKS[id] || st.perks.indexOf(id) >= 0) return false;
if (!L.perkAvailable(st, id)) return false;
st.perks.push(id);
L.recalc(st);
} else return false;
st.points--;
return true;
};
L.perkAvailable = function (st, id) {
var p = D.PERKS[id];
if (!p) return false;
if (st.perks.indexOf(id) >= 0) return false;
var req = p.req || {};
if (req.level && st.level < req.level) return false;
for (var k in req) {
if (k === 'level') continue;
if (D.ATTRS[k]) { if ((st.attrs[k] || 0) < req[k]) return false; }
else if (D.SKILLS[k]) { if ((st.skills[k] || 0) < req[k]) return false; }
}
return true;
};
/* ================= ИНВЕНТАРЬ ================= */
L.hasItem = function (st, id) {
return (st.bag || []).indexOf(id) >= 0 || (st.questItems || []).indexOf(id) >= 0;
};
/* принимает предметы, оружие и броню; quest:true → questItems без лимита */
L.addItem = function (st, id) {
var it = D.ITEMS[id];
if (it) {
if (it.quest) {
st.questItems = st.questItems || [];
if (st.questItems.indexOf(id) < 0) st.questItems.push(id);
return true;
}
if (st.bag.length >= L.BAG_SLOTS) return false;
st.bag.push(id);
return true;
}
if (D.WEAPONS[id] || D.ARMORS[id]) {
if (st.bag.length >= L.BAG_SLOTS) return false;
st.bag.push(id);
return true;
}
return false;
};
L.grantItem = function (st, id) {
if (!id) return true;
if (L.addItem(st, id)) return true;
st.credits += 40;
L.log(st, 'Рюкзак полон: ' + (D.ITEMS[id] ? D.ITEMS[id].name : id) + ' обменян на 40 кр.');
return false;
};
L.removeItem = function (st, id) {
var i = st.bag.indexOf(id);
if (i >= 0) { st.bag.splice(i, 1); return true; }
i = (st.questItems || []).indexOf(id);
if (i >= 0) { st.questItems.splice(i, 1); return true; }
return false;
};
L.useItem = function (st, id) {
var it = D.ITEMS[id];
if (!it) return null;
if (!it.heal) return { ok: false, text: it.name + ': используется в проверках и бою' };
if (!L.removeItem(st, id)) return null;
var heal = L.healAmount(st, it.heal);
st.hp = Math.min(st.maxHp, st.hp + heal);
return { ok: true, text: it.name + ': +' + heal + ' HP' };
};
L.healAmount = function (st, base) {
var k = 1;
st.perks.forEach(function (p) { if (D.PERKS[p].apply.heal) k += D.PERKS[p].apply.heal; });
return Math.round(base * k);
};
L.weapon = function (st) { return D.WEAPONS[st.weapon]; };
L.armor = function (st) { return D.ARMORS[st.armor]; };
L.defense = function (st) { return 10 + L.armor(st).def + Math.floor((st.attrs.telo - 5) / 2); };
L.damageReduction = function (st) { return L.armor(st).dr || 0; };
L.equipWeapon = function (st, id) {
if (!D.WEAPONS[id] || st.bag.indexOf(id) < 0) return false;
L.removeItem(st, id);
if (D.WEAPONS[st.weapon]) L.addItem(st, st.weapon);
st.weapon = id;
return true;
};
L.equipArmor = function (st, id) {
if (!D.ARMORS[id] || st.bag.indexOf(id) < 0) return false;
L.removeItem(st, id);
if (D.ARMORS[st.armor] && st.armor !== 'none') L.addItem(st, st.armor);
st.armor = id;
return true;
};
/* ================= ТОРГОВЛЯ ================= */
L.price = function (st, base, merchantId) {
var m = D.MERCHANTS[merchantId];
var rep = m ? (st.rep[m.faction] || 0) : 0;
var k = 1 - rep * 0.04;
k = Math.max(0.7, Math.min(1.4, k));
return Math.max(1, Math.round(base * k));
};
L.buy = function (st, merchantId, kind, id) {
var base = kind === 'weapon' ? D.WEAPONS[id].cost : kind === 'armor' ? D.ARMORS[id].cost : D.ITEMS[id].cost;
var price = L.price(st, base, merchantId);
if (st.credits < price) return { ok: false, text: 'Не хватает кредитов' };
var it = D.ITEMS[id];
if (!(it && it.quest) && st.bag.length >= L.BAG_SLOTS) return { ok: false, text: 'Рюкзак полон' };
if (!L.addItem(st, id)) return { ok: false, text: 'Некуда положить' };
st.credits -= price;
return { ok: true, text: 'Куплено за ' + price + ' кр.' };
};
L.sell = function (st, id) {
var it = D.ITEMS[id] || D.WEAPONS[id] || D.ARMORS[id];
if (!it) return { ok: false, text: 'нет предмета' };
if (it.quest) return { ok: false, text: 'Не продаётся: улика' };
if (!L.removeItem(st, id)) return { ok: false, text: 'нет предмета' };
var price = Math.max(1, Math.round((it.cost || 0) * 0.5));
st.credits += price;
return { ok: true, text: 'Продано за ' + price + ' кр.' };
};
/* ================= РЕПУТАЦИЯ И ФАКТЫ ================= */
L.addRep = function (st, faction, delta) {
if (st.rep[faction] === undefined) return;
st.rep[faction] = clamp(st.rep[faction] + delta, -10, 10);
};
L.addFact = function (st, fact) {
if (!fact) return;
st.facts[fact] = true;
L.log(st, 'Узнано: ' + (D.FACTS[fact] ? D.FACTS[fact].name : fact));
};
L.hasFact = function (st, fact) { return !!st.facts[fact]; };
/* ================= НИТИ ================= */
L.weight = function (st, thread, w, src) {
if (st.weights[thread] === undefined) return;
st.weights[thread] += w;
st.anchors.push({ thread: thread, w: w, src: src || '', t: Date.now() });
};
L.thread = function (st) {
var w = st.weights;
var best = Math.max(w.A, w.B, w.C);
var leaders = ['A', 'B', 'C'].filter(function (k) { return w[k] === best; });
if (leaders.length === 1) return leaders[0];
var counts = { A: 0, B: 0, C: 0 };
st.anchors.forEach(function (a) { counts[a.thread]++; });
var maxC = Math.max(counts.A, counts.B, counts.C);
leaders = leaders.filter(function (k) { return counts[k] === maxC; });
if (leaders.length === 1) return leaders[0];
for (var i = st.anchors.length - 1; i >= 0; i--) {
if (leaders.indexOf(st.anchors[i].thread) >= 0) return st.anchors[i].thread;
}
return leaders[0];
};
/* ================= ТРЕБОВАНИЯ ================= */

L.reqMet = function (st, req) {
  if (!req) return true;
  if (req.hero && st.hero !== req.hero) return false;
  var fl = st.flags || {};
  if (req.flag && !fl[req.flag]) return false;
  if (req.flags && !req.flags.every(function (f) { return fl[f]; })) return false;
  if (req.notFlag && fl[req.notFlag]) return false;
  if (req.notFlags && req.notFlags.some(function (f) { return fl[f]; })) return false;
  if (req.fact && !st.facts[req.fact]) return false;
  if (req.facts && !req.facts.every(function (f) { return st.facts[f]; })) return false;
  if (req.item && !L.hasItem(st, req.item)) return false;
  if (req.level && st.level < req.level) return false;
  if (req.companion && st.companions.indexOf(req.companion) < 0) return false;
  if (req.companionsAll && !req.companionsAll.every(function (c) { return st.companions.indexOf(c) >= 0; })) return false;
  if (req.rep) {
    for (var k in req.rep) if ((st.rep[k] || 0) < req.rep[k]) return false;
  }
  if (req.questBranch) {
    var qb = st.quests[req.questBranch.id];
    if (!qb || !qb.done || qb.branch !== req.questBranch.branch) return false;
  }
  if (req.questFailed && !(st.quests[req.questFailed] && st.quests[req.questFailed].failed)) return false;
  if (req.quest) {
    var s = st.quests[req.quest], q = D.QUESTS[req.quest];
    if (!s || !q) return false;
    var state = req.state || 'active';
    if (state === 'available' && !L.questAvailable(st, req.quest)) return false;
    if (state === 'notStarted' && (s.started || s.done || s.failed)) return false;
    if (state === 'active' && (!s.started || s.done || s.failed)) return false;
    if (state === 'ready' && !(s.started && !s.done && s.stage >= q.stages.length)) return false;
    if (state === 'done' && !s.done) return false;
    if (state === 'failed' && !s.failed) return false;
    if (req.stage !== undefined && s.stage !== req.stage) return false;
    if (req.stageMin !== undefined && s.stage < req.stageMin) return false;
    if (req.stageMax !== undefined && s.stage > req.stageMax) return false;
  }
  return true;
};

L.requiresMet = function (st, q) {
var r = q.requires || {};
if (r.all) {
for (var i = 0; i < r.all.length; i++) if (!st.quests[r.all[i]].done) return false;
}
if (r.any) {
var need = r.minAny || 1, got = 0;
for (var j = 0; j < r.any.length; j++) if (st.quests[r.any[j]].done) got++;
if (got < need) return false;
}
if (r.anyFailed) {
var ok = false;
for (var k = 0; k < r.anyFailed.length; k++) {
if (st.quests[r.anyFailed[k]] && st.quests[r.anyFailed[k]].failed) { ok = true; break; }
}
if (!ok) return false;
}
if (r.questBranch) {
var qb = st.quests[r.questBranch.id];
if (!qb || !qb.done || qb.branch !== r.questBranch.branch) return false;
}
if (r.facts) {
for (var f = 0; f < r.facts.length; f++) if (!st.facts[r.facts[f]]) return false;
}
return true;
};
/* ================= КВЕСТЫ ================= */
L.quest = function (st, id) { return st.quests[id]; };
L.questAvailable = function (st, id) {
var q = D.QUESTS[id], s = st.quests[id];
if (!q || !s || s.started || s.done || s.failed) return false;
if (q.hero && q.hero !== st.hero) return false;
return L.requiresMet(st, q);
};
L.questReady = function (st, id) {
var q = D.QUESTS[id], s = st.quests[id];
return !!(q && s && s.started && !s.done && !s.failed && s.stage >= q.stages.length);
};
L.startQuest = function (st, id) {
if (!L.questAvailable(st, id)) return false;
var s = st.quests[id];
s.started = true;
s.stage = 0;
s.done = false;
s.failed = false;
L.log(st, 'Взято дело: ' + D.QUESTS[id].title);
return true;
};
L.advanceQuest = function (st, id, n) {
var q = D.QUESTS[id], s = st.quests[id];
if (!q || !s || !s.started || s.done || s.failed) return false;
n = n || 1;
s.stage = Math.min(q.stages.length, s.stage + n);
L.log(st, D.QUESTS[id].title + ': этап ' + s.stage + '/' + q.stages.length);
if (s.stage >= q.stages.length) L.log(st, 'Дело готово к решению: ' + q.title);
return true;
};
L.setQuestStage = function (st, id, n) {
var q = D.QUESTS[id], s = st.quests[id];
if (!q || !s) return false;
s.started = true;
s.stage = clamp(n, 0, q.stages.length);
return true;
};
L.failQuest = function (st, id, reason) {
var q = D.QUESTS[id], s = st.quests[id];
if (!q || !s || s.done) return false;
s.failed = true;
s.started = true;
L.log(st, 'Дело провалено: ' + q.title + (reason ? ' — ' + reason : ''));
return true;
};
L.branchBlockReason = function (st, id, branch) {
var q = D.QUESTS[id], s = st.quests[id];
if (!q || !s) return 'нет дела';
if (s.done) return 'дело закрыто';
if (s.failed) return 'дело провалено';
if (!L.questReady(st, id)) return 'сначала заверши этапы';
var req = (q.branchReq || {})[branch];
if (req && !L.reqMet(st, req)) {
if (req.fact) return 'нужна улика: ' + (D.FACTS[req.fact] ? D.FACTS[req.fact].name : req.fact);
if (req.item) return 'нужен предмет: ' + (D.ITEMS[req.item] ? D.ITEMS[req.item].name : req.item);
return 'нужны условия';
}
return null;
};
L.completeQuest = function (st, id, branch) {
var q = D.QUESTS[id], s = st.quests[id];
if (!q || !s || s.done) return false;
if (!q.branch[branch]) return false;
if (L.branchBlockReason(st, id, branch)) return false;
var rw = (q.rewards || {})[branch] || {};
s.done = true;
s.failed = false;
s.branch = branch;
s.stage = q.stages.length;
if (q.unlock) q.unlock.forEach(function (u) { st.flags['unlock_' + u] = true; });
/* регистрационная форма не двигает нить: у single-дел нет морального выбора */
if (!q.single) L.weight(st, rw.thread || branch, 5, q.title + ' — ' + q.branch[branch]);
if (rw.item) L.grantItem(st, rw.item);
if (rw.fact) L.addFact(st, rw.fact);
if (rw.facts) rw.facts.forEach(function (f) { L.addFact(st, f); });
if (rw.credits) st.credits += rw.credits;
if (rw.rep) {
Object.keys(rw.rep).forEach(function (k) { L.addRep(st, k, rw.rep[k]); });
}
L.gainXp(st, rw.xp || 80);
L.log(st, 'Дело закрыто: ' + q.title + ' — ' + q.branch[branch]);
return true;
};
L.questsDone = function (st) {
return Object.keys(st.quests).filter(function (k) { return st.quests[k].done; }).length;
};
L.questsActive = function (st) {
return Object.keys(st.quests).filter(function (k) {
var s = st.quests[k];
return s.started && !s.done && !s.failed;
}).length;
};
/* ================= ЖУРНАЛ ================= */
L.journal = function (st) {
var active = [], done = [], failed = [], where = [], facts = [], clues = [];
Object.keys(D.QUESTS).forEach(function (id) {
var q = D.QUESTS[id], s = st.quests[id];
if (q.hero && q.hero !== st.hero) return;
if (s.done) {
done.push({ id: id, title: q.title, branch: q.branch[s.branch] || 'исход неизвестен', line: q.line, act: q.act });
} else if (s.failed) {
failed.push({ id: id, title: q.title, line: q.line, act: q.act });
} else if (s.started) {
var i = Math.min(s.stage, q.stages.length - 1);
active.push({
id: id, title: q.title, stage: q.stages[i] || 'решение',
hint: (q.hints || [])[i] || '', index: s.stage, total: q.stages.length,
ready: s.stage >= q.stages.length, line: q.line, act: q.act
});
} else {
where.push({
id: id, title: q.title, where: q.where, giver: q.giver,
available: L.questAvailable(st, id), line: q.line, act: q.act
});
}
});
Object.keys(st.facts).forEach(function (f) { facts.push(f); });
(st.questItems || []).forEach(function (id) {
var it = D.ITEMS[id];
if (it && it.kind === 'clue') clues.push({ id: id, name: it.name, desc: it.desc || '' });
});
return { active: active, done: done, failed: failed, where: where, facts: facts, clues: clues };
};
/* ================= БОЙ 6×6 ================= */
L.COVER = [
{ x: 2, y: 1, type: 'half' }, { x: 3, y: 3, type: 'half' },
{ x: 1, y: 4, type: 'half' }, { x: 4, y: 2, type: 'half' },
{ x: 2, y: 4, type: 'full' }, { x: 4, y: 4, type: 'full' },
{ x: 0, y: 2, type: 'full' }, { x: 5, y: 1, type: 'full' }
];
L.coverAt = function (x, y) {
for (var i = 0; i < L.COVER.length; i++) {
if (L.COVER[i].x === x && L.COVER[i].y === y) return L.COVER[i];
}
return null;
};
L.inCover = function (x, y) { return !!L.coverAt(x, y); };
L.fullCoverAt = function (x, y) { var c = L.coverAt(x, y); return !!c && c.type === 'full'; };
L.weaponBand = function (w) {
if (w.band) return w.band;
return w.range <= 1 ? 'melee' : w.range <= 3 ? 'short' : 'long';
};
L.bandName = function (band) {
return band === 'melee' ? 'ближний' : band === 'short' ? 'короткий' : 'дальний';
};
L.rangePenalty = function (band, dist) {
if (band === 'melee') return 0;
if (dist > 4) return -2;
if (dist > 2) return -1;
return 0;
};
L.coverBonus = function (target, band, pierce, dist) {
if (band === 'melee' || pierce) return 0;
if (dist <= 1) return 0;
var c = L.coverAt(target.x, target.y);
return c ? (c.type === 'full' ? 4 : 2) : 0;
};
/* линия огня: полное укрытие блокирует; диагональ не режет углы */
L.losBlocked = function (a, b) {
var x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
var err = dx - dy, x = x0, y = y0, guard = 0;
while (true) {
if (x === x1 && y === y1) break;
var px = x, py = y;
var e2 = 2 * err;
if (e2 > -dy) { err -= dy; x += sx; }
if (e2 < dx) { err += dx; y += sy; }
if (x === x1 && y === y1) break;
if (x !== px && y !== py) {
if (L.fullCoverAt(px, y) && L.fullCoverAt(x, py)) return true;
}
if (L.fullCoverAt(x, y)) return true;
if (guard++ > 30) break;
}
return false;
};
L.heroDamageBonus = function (st) {
var b = 0, band = L.weaponBand(L.weapon(st));
st.perks.forEach(function (p) {
var a = D.PERKS[p].apply;
if (a.mdmg && band === 'melee') b += a.mdmg;
if (a.rdmg && band !== 'melee') b += a.rdmg;
});
return b;
};
L.heroAccuracyBonus = function (st) {
var b = 0, band = L.weaponBand(L.weapon(st));
st.perks.forEach(function (p) {
var a = D.PERKS[p].apply;
if (a.racc && band !== 'melee') b += a.racc;
if (a.macc && band === 'melee') b += a.macc;
});
return b;
};
L.combatStart = function (st, enemyKeys, opts) {
opts = opts || {};
var w = L.weapon(st);
var units = [];
units.push({
id: 'hero', side: 'hero', name: D.HEROES[st.hero].name,
x: 1, y: 3, hp: st.hp, maxHp: st.maxHp, dmg: w.dmg,
range: w.range, band: L.weaponBand(w), def: L.defense(st), dr: L.damageReduction(st),
ap: 2, alive: true, bleed: 0,
initiative: L.d20() + st.attrs.telo
});
var spots = [[4, 2], [3, 2], [4, 1], [3, 1], [4, 3], [3, 3]];
enemyKeys.forEach(function (k, i) {
var e = D.ENEMIES[k];
var sp = spots[i % spots.length];
units.push({
id: 'e' + i, key: k, side: 'enemy', name: e.name,
x: sp[0], y: sp[1], hp: e.hp, maxHp: e.hp, dmg: e.dmg,
range: e.range, band: e.range <= 1 ? 'melee' : e.range <= 3 ? 'short' : 'long',
acc: e.acc || 2, def: e.def, dr: e.dr || 0,
ap: 2, alive: true, bleed: 0,
initiative: L.d20() + 3
});
});
units.sort(function (a, b) { return b.initiative - a.initiative; });
var c = {
units: units, order: units.map(function (u) { return u.id; }),
turnIndex: 0, round: 1, log: [], over: false, winner: null, after: opts.after || null
};
L.log(st, 'Бой начался');
c.log.push('Бой начался. Первым ходит ' + L.current(c).name + '.');
if (L.current(c).side === 'enemy') L.enemyTurn(st, c);
return c;
};
L.current = function (c) {
var id = c.order[c.turnIndex];
return c.units.filter(function (u) { return u.id === id; })[0];
};
L.unit = function (c, id) { return c.units.filter(function (u) { return u.id === id; })[0]; };
L.heroUnit = function (c) { return L.unit(c, 'hero'); };
L.enemies = function (c) { return c.units.filter(function (u) { return u.side === 'enemy' && u.alive; }); };
L.dist = function (a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); };
L.occupied = function (c, x, y, exceptId) {
return c.units.some(function (u) { return u.alive && u.id !== exceptId && u.x === x && u.y === y; });
};
L.canMove = function (c, u, x, y) {
if (x < 0 || y < 0 || x >= L.GRID || y >= L.GRID) return false;
if (x === u.x && y === u.y) return false;
if (u.ap < 1) return false;
if (L.occupied(c, x, y, u.id)) return false;
return L.dist(u, { x: x, y: y }) <= 3;
};
L.move = function (c, u, x, y) {
if (!L.canMove(c, u, x, y)) return false;
u.x = x; u.y = y; u.ap -= 1;
c.log.push(u.name + ' перемещается');
return true;
};
L.previewAttack = function (st, c, attacker, target) {
if (!attacker || !target || !target.alive) return { ok: false, reason: 'нет цели' };
var dist = L.dist(attacker, target);
if (dist > attacker.range) {
return { ok: false, reason: 'вне дальности', dist: dist, range: attacker.range };
}
var band = attacker.band || 'short';
var w = attacker.side === 'hero' ? L.weapon(st) : null;
var pierce = !!(w && w.pierce);
if (L.losBlocked(attacker, target) && !pierce) {
return { ok: false, reason: 'нет линии огня', dist: dist, range: attacker.range };
}
var cover = L.coverBonus(target, band, pierce, dist);
var penalty = L.rangePenalty(band, dist);
var bonus = attacker.side === 'hero'
? L.skill(st, band === 'melee' ? 'draka' : 'strelba') + L.heroAccuracyBonus(st) + ((w && w.acc) || 0)
: (attacker.acc || 2);
var def = target.def + cover;
var need = def - (bonus + penalty);
/* точный шанс: nat20 всегда попадает, nat1 всегда мимо */
var hits = 1;
for (var r = 2; r <= 19; r++) if (r >= need) hits++;
return {
ok: true, dist: dist, range: attacker.range, band: band, bonus: bonus,
penalty: penalty, cover: cover, def: def, chance: hits * 5, pierce: pierce
};
};
L.attack = function (st, c, attacker, target) {
if (attacker.ap < 1) return { ok: false, text: 'Нет AP' };
var pv = L.previewAttack(st, c, attacker, target);
if (!pv.ok) return { ok: false, text: pv.reason };
attacker.ap -= 1;
var roll = L.d20();
var total = roll + pv.bonus + pv.penalty;
var crit = roll === 20, fumble = roll === 1;
var coverText = pv.cover ? ' (укрытие +' + pv.cover + ')' : '';
var mod = pv.bonus + pv.penalty;
var rollText = attacker.name + ': d20 ' + roll + (mod >= 0 ? ' + ' : ' − ') + Math.abs(mod) +
' = ' + total + ' против ' + pv.def + coverText;
if (fumble || (!crit && total < pv.def)) {
c.log.push(rollText + (fumble ? ' — критический промах' : ' — промах'));
return { ok: true, hit: false, roll: total, def: pv.def, cover: pv.cover };
}
var w = attacker.side === 'hero' ? L.weapon(st) : null;
var base = attacker.dmg + (attacker.side === 'hero' ? L.heroDamageBonus(st) : 0);
var dr = target.dr || 0;
var dmg = Math.max(1, base - dr);
target.hp -= dmg;
c.log.push(rollText + (crit ? ' — крит, ' : ' — попадание, ') + dmg + ' урона' +
(dr ? ' (броня −' + dr + ')' : ''));
if (w && w.stun) {
target.ap = Math.max(0, target.ap - 1);
c.log.push(target.name + ' теряет AP от разряда');
}
if (w && w.bleed) {
target.bleed = (target.bleed || 0) + 2;
c.log.push(target.name + ' кровоточит');
}
if (target.hp <= 0) {
target.hp = 0; target.alive = false;
c.log.push(target.name + ' выведен из боя');
if (target.side === 'enemy') {
var e = D.ENEMIES[target.key];
L.gainXp(st, e.xp);
st.credits += e.credits;
if (e.drop && Math.random() < 0.5) L.grantItem(st, e.drop);
}
}
L.checkCombatEnd(c);
return { ok: true, hit: true, crit: crit, dmg: dmg, roll: total, def: pv.def, cover: pv.cover, dr: dr };
};
L.useItemCombat = function (st, c, itemId) {
var it = D.ITEMS[itemId];
if (!it || !L.hasItem(st, itemId)) return { ok: false, text: 'нет предмета' };
var hero = L.heroUnit(c);
if (hero.ap < 1) return { ok: false, text: 'Нет AP' };
if (it.heal) {
var heal = L.healAmount(st, it.heal);
hero.hp = Math.min(hero.maxHp, hero.hp + heal);
L.removeItem(st, itemId);
hero.ap -= 1;
c.log.push('Использовано: ' + it.name + ' (+' + heal + ' HP)');
return { ok: true, text: it.name + ': +' + heal + ' HP' };
}
if (it.combat === 'stun') {
var target = L.enemies(c)[0];
if (!target) return { ok: false, text: 'нет цели' };
L.removeItem(st, itemId);
hero.ap -= 1;
target.ap = 0;
c.log.push(it.name + ': ' + target.name + ' оглушён');
return { ok: true, text: it.name + ': ' + target.name + ' оглушён' };
}
return { ok: false, text: 'в бою не работает' };
};
L.endTurn = function (st, c) {
var cur = L.current(c);
if (cur && cur.side === 'hero') cur.ap = 0;
L.nextTurn(st, c);
};
L.nextTurn = function (st, c) {
if (c.over) return;
var guard = 0;
do {
c.turnIndex++;
if (c.turnIndex >= c.order.length) { c.turnIndex = 0; c.round++; }
var u = L.current(c);
if (!u) break;
if (!u.alive) continue;
if (u.bleed > 0) {
u.hp -= 1; u.bleed--;
c.log.push(u.name + ' теряет 1 HP от кровотечения');
if (u.hp <= 0) { u.hp = 0; u.alive = false; c.log.push(u.name + ' выведен из боя'); }
}
if (!u.alive) { L.checkCombatEnd(c); continue; }
u.ap = 2;
break;
} while (guard++ < 40);
if (c.over) return;
var cur = L.current(c);
if (cur && cur.side === 'enemy' && !c.over) L.enemyTurn(st, c);
};
L.enemyTurn = function (st, c) {
var e = L.current(c);
if (!e || !e.alive || c.over) return;
var hero = L.heroUnit(c);
if (!hero || !hero.alive) return;
var guard = 0;
while (e.ap > 0 && !c.over && guard++ < 5) {
var pv = L.previewAttack(st, c, e, hero);
if (pv.ok) {
L.attack(st, c, e, hero);
} else {
var best = null, bestScore = -1e9;
for (var y = 0; y < L.GRID; y++) {
for (var x = 0; x < L.GRID; x++) {
if (!L.canMove(c, e, x, y)) continue;
var d = Math.abs(x - hero.x) + Math.abs(y - hero.y);
var los = !L.losBlocked({ x: x, y: y }, hero);
var sc = 0;
if (d <= e.range && los) sc += 30;
else sc -= Math.abs(d - e.range) * 3;
if (e.range > 1 && L.inCover(x, y)) sc += 4;
if (e.range <= 1) sc -= d;
if (sc > bestScore) { bestScore = sc; best = { x: x, y: y }; }
}
}
if (!best) break;
L.move(c, e, best.x, best.y);
}
if (!hero.alive) { L.checkCombatEnd(c); break; }
if (c.over) break;
}
if (!c.over) L.nextTurn(st, c);
};
L.checkCombatEnd = function (c) {
if (c.over) return;
var hero = L.heroUnit(c);
if (!hero || !hero.alive) { c.over = true; c.winner = 'enemy'; c.log.push('Ты проиграл'); return; }
if (!L.enemies(c).length) { c.over = true; c.winner = 'hero'; c.log.push('Противник повержен'); }
};
L.combatResult = function (st, c) {
var hero = L.heroUnit(c);
st.hp = Math.max(1, hero.hp);
if (c.winner === 'hero') {
L.gainXp(st, 60);
return { win: true };
}
st.hp = 1;
var lost = null;
for (var i = 0; i < st.bag.length; i++) {
var it = D.ITEMS[st.bag[i]];
if (it && !it.quest) { lost = st.bag[i]; L.removeItem(st, lost); break; }
}
L.weight(st, 'C', 1, 'поражение в бою');
st.flags.lost_fight = true;
return { win: false, lost: lost ? (D.ITEMS[lost] ? D.ITEMS[lost].name : lost) : null };
};
/* ================= ФИНАЛ ================= */
L.ending = function (st) {
var t = L.thread(st);
var variant = st.flags.lost_fight ? '2' : '1';
var list = D.ENDINGS.filter(function (e) { return e.hero === st.hero && e.thread === t; });
return list.filter(function (e) { return e.variant === variant; })[0] || list[0] || D.ENDINGS[0];
};
/* ================= СОХРАНЕНИЯ ================= */
L.serialize = function (st) { return JSON.stringify(st); };
L.migrate = function (st) {
if (!st) return st;
st.v = 3;
st.flags = st.flags || {};
st.facts = st.facts || {};
st.usedChecks = st.usedChecks || {};
st.anchors = st.anchors || [];
st.weights = st.weights || { A: 0, B: 0, C: 0 };
st.companions = st.companions || [];
st.bag = st.bag || [];
st.questItems = st.questItems || [];
st.gear = st.gear || {};
st.quests = st.quests || {};
Object.keys(D.QUESTS).forEach(function (id) {
if (!st.quests[id]) {
st.quests[id] = { started: false, stage: 0, done: false, branch: null, failed: false };
}
var s = st.quests[id];
if (s.started === undefined) {
var n = Number(s.stage) || 0;
s.started = n > 0 || !!s.done;
s.stage = s.done ? D.QUESTS[id].stages.length : Math.max(0, n - 1);
}
if (s.failed === undefined) s.failed = false;
if (s.branch === undefined) s.branch = null;
if (s.stage > D.QUESTS[id].stages.length) s.stage = D.QUESTS[id].stages.length;
});
Object.keys(st.usedChecks).forEach(function (k) {
if (st.usedChecks[k] === true) st.usedChecks[k] = 'fail';
});
if (st.quests.q_gt_audit && st.quests.q_gt_audit.started && st.quests.q_gt_audit.stage === 0) {
st.quests.q_gt_audit.stage = 1;
}
/* квестовые предметы — в отдельный список без лимита */
for (var i = st.bag.length - 1; i >= 0; i--) {
var it = D.ITEMS[st.bag[i]];
if (it && it.quest) {
if (st.questItems.indexOf(st.bag[i]) < 0) st.questItems.push(st.bag[i]);
st.bag.splice(i, 1);
}
}
/* старые сейвы: веса не копились из-за бага — пересчитываем из закрытых дел */
if (!st.anchors.length) {
st.weights = { A: 0, B: 0, C: 0 };
Object.keys(st.quests).forEach(function (id) {
var s = st.quests[id], q = D.QUESTS[id];
if (q && s.done && s.branch) {
var rw = (q.rewards || {})[s.branch] || {};
L.weight(st, rw.thread || s.branch, 5, q.title + ' — ' + q.branch[s.branch]);
}
});
}
/* бой не переживает загрузку: after-колбэк не сериализуется */
st.combat = null;
if (st.dlgv !== D.VERSION) {
st.usedChecks = {};
Object.keys(st.flags).forEach(function (k) {
if (k.indexOf('seen_') === 0) delete st.flags[k];
});
st.dlgv = D.VERSION;
}
return st;
};
L.save = function (st, slot) {
try {
st.savedAt = Date.now();
localStorage.setItem('gryft.' + (slot || 'auto'), L.serialize(st));
return true;
} catch (e) { return false; }
};
L.load = function (slot) {
try {
var raw = localStorage.getItem('gryft.' + (slot || 'auto'));
return raw ? L.migrate(JSON.parse(raw)) : null;
} catch (e) { return null; }
};
/* карточка слота для экранов Сохранить/Загрузить */
L.slotInfo = function (slot) {
try {
var raw = localStorage.getItem('gryft.' + (slot || 'auto'));
if (!raw) return null;
var st = JSON.parse(raw);
var done = 0;
Object.keys(st.quests || {}).forEach(function (k) { if (st.quests[k].done) done++; });
var loc = 'Карта станции';
if (st.location) {
var l = D.LOCATIONS.filter(function (x) { return x.id === st.location; })[0];
if (l) loc = l.name;
}
return {
slot: slot || 'auto', hero: st.hero, level: st.level || 1,
credits: st.credits || 0, hp: st.hp, maxHp: st.maxHp,
location: loc, savedAt: st.savedAt || null, done: done
};
} catch (e) { return null; }
};
G.L = L;
if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof globalThis !== 'undefined' ? globalThis : this);
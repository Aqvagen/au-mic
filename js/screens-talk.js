/* =========================================================
Экраны: диалог и дело. Версия 3.0.
VN-механика: intro → start → reply. Кубик — бейдж.
Бонус предметов честный (сумма, рюкзак + надетое), шанс виден до броска.
========================================================= */
(function (G) {
'use strict';
var UI = G.UI;
var AU = G.AU;
var ST = AU.state;
var D = AU.D, L = AU.L;
var S = G.Screens;
function mount(screen) { return UI.mount(screen); }
S.mount = S.mount || mount;

function locName(id) {
var l = D.LOCATIONS.filter(function (x) { return x.id === id; })[0];
return l ? l.name : '—';
}
function itemName(id) {
if (!id) return null;
if (D.ITEMS[id]) return D.ITEMS[id].name;
if (D.WEAPONS[id]) return D.WEAPONS[id].name;
if (D.ARMORS[id]) return D.ARMORS[id].name;
return id;
}
function itemBonus(skill) {
var s = ST.S;
if (L.checkBonus) return L.checkBonus(s, skill);
var sum = 0;
function add(id) {
var it = D.ITEMS[id];
if (it && it.check && it.check[skill]) sum += it.check[skill];
}
(s.bag || []).forEach(add);
(s.questItems || []).forEach(add);
Object.keys(s.gear || {}).forEach(function (k) { add(s.gear[k]); });
return sum;
}
/* точный шанс: 20 всегда успех, 1 всегда провал */
function chanceFor(bonus, dc) {
var need = dc - bonus, hits = 1;
for (var r = 2; r <= 19; r++) if (r >= need) hits++;
return hits * 5;
}
function signed(n) { return (n >= 0 ? '+' : '−') + Math.abs(n); }

function questLockReason(id) {
var q = D.QUESTS[id], s = ST.S, out = [];
var r = (q && q.requires) || {};
function title(x) { return D.QUESTS[x] ? D.QUESTS[x].title : x; }
function isDone(x) { return s.quests[x] && s.quests[x].done; }
(r.all || []).forEach(function (x) { if (!isDone(x)) out.push(title(x)); });
if (r.any) {
var need = r.minAny || 1, got = 0;
r.any.forEach(function (x) { if (isDone(x)) got++; });
if (got < need) {
out.push(r.any.length > 3
? 'ещё ' + (need - got) + ' дело(а) акта II'
: 'ещё ' + (need - got) + ' из: ' + r.any.map(title).join(', '));
}
}
if (r.anyFailed) {
var okF = r.anyFailed.some(function (x) { return s.quests[x] && s.quests[x].failed; });
if (!okF) out.push('нужен провал: ' + r.anyFailed.map(title).join(' или '));
}
if (r.questBranch) {
var qb = s.quests[r.questBranch.id];
if (!qb || !qb.done || qb.branch !== r.questBranch.branch) {
out.push('нужен выбор «' + D.QUESTS[r.questBranch.id].branch[r.questBranch.branch] +
'» в «' + D.QUESTS[r.questBranch.id].title + '»');
}
}
(r.facts || []).forEach(function (f) {
if (!s.facts[f]) out.push('улика: ' + (D.FACTS[f] ? D.FACTS[f].name : f));
});
return out.length ? 'нужно: ' + out.join('; ') : '';
}

/* ================= диалог ================= */
S.openDialogue = function (id) {
var d = D.DIALOGUES[id];
if (!d) return UI.toast('Нет диалога');
var wasSeen = !!ST.S.flags['seen_' + id];
ST.dlg = { id: id, node: d, reply: null, roll: null, firstOpen: !wasSeen };
ST.S.flags['seen_' + id] = true;
S.renderDialogue();
};

function optionState(s, o, idx) {
var used = s.usedChecks[ST.dlg.id + ':' + idx];
var met = L.reqMet(s, o.req);
if (!met && o.hide) return 'hidden';
if (used === 'ok') return 'done';
if (!met) return 'locked';
return used === 'fail' ? 'retry' : 'open';
}
function resolveNpcLines(d, s, firstOpen) {
if (ST.dlg.reply) return ST.dlg.reply.slice();
if (firstOpen && d.intro) return d.intro.slice();
if (d.start) {
for (var i = 0; i < d.start.length; i++) {
if (L.reqMet(s, d.start[i].req)) return (d.start[i].lines || []).slice();
}
}
return (d.lines || []).slice();
}

S.renderDialogue = function () {
var d = ST.dlg.node;
var s = ST.S;
if (d.bg) UI.setScene(d.bg);
UI.setHudVisible(true);
UI.updateHud(s, L, D);
UI.setWhere(d.title || 'Разговор');
var root = mount('dlg');
root.appendChild(UI.el('p', 'kicker', d.title || 'Разговор'));
var wrap = UI.el('div', 'dlg');

var pb = UI.el('div', 'dlg__portrait');
if (d.portrait) pb.appendChild(UI.img('assets/img/' + d.portrait + '.png', '', d.speaker || ''));
else pb.appendChild(UI.el('div', 'g', '◈'));
wrap.appendChild(pb);

var box = UI.el('div', 'dlg__box');
box.appendChild(UI.el('div', 'dlg__who', d.speaker || ''));

if (ST.dlg.roll) {
var r = ST.dlg.roll;
var badge = UI.el('div', 'roll' + (r.success ? '' : ' roll--bad'));
badge.appendChild(UI.el('div', 'roll__dice',
'd20 ' + r.roll + ' ' + signed(r.bonus) + ' = ' + r.total + ' против ' + r.dc));
badge.appendChild(UI.el('div', '', r.label + (r.itemBonus ? ' · предмет ' + signed(r.itemBonus) : '')));
if (r.crit) badge.appendChild(UI.el('div', 'roll__dice', 'нить A +1'));
box.appendChild(badge);
}

var npcLines = resolveNpcLines(d, s, ST.dlg.firstOpen);
if (d.reactions) {
d.reactions.forEach(function (rc) {
if (L.reqMet(s, rc.req)) npcLines = npcLines.concat(rc.lines || []);
});
}
var lines = UI.el('div', 'dlg__lines');
npcLines.forEach(function (t, i) {
var p = UI.el('p', 'dlg__line dlg__line--n', t);
p.style.setProperty('--i', i);
lines.appendChild(p);
});
box.appendChild(lines);

if (d.companions) {
Object.keys(d.companions).forEach(function (c) {
if (s.companions.indexOf(c) >= 0 && D.COMPANIONS[c]) {
var v = UI.el('div', 'comp');
v.appendChild(UI.el('b', '', D.COMPANIONS[c].name + ': '));
v.appendChild(document.createTextNode(d.companions[c]));
box.appendChild(v);
}
});
}

var opts = UI.el('div', 'opts');
opts.style.maxHeight = '44vh';
opts.style.overflowY = 'auto';
opts.style.paddingRight = '4px';
var shown = 0;
(d.options || []).forEach(function (o, i) {
var state = optionState(s, o, i);
if (state === 'hidden') return;
var b = UI.el('button', 'opt');
b.type = 'button';
b.setAttribute('data-test', 'opt' + shown);
b.disabled = state === 'locked' || state === 'done';
b.appendChild(UI.el('span', 'opt__num', String(shown + 1)));
if (o.check) {
var ib = itemBonus(o.check.skill);
var total = L.skill(s, o.check.skill) + ib;
b.appendChild(UI.el('span', 'opt__tag', (D.SKILLS[o.check.skill] ? D.SKILLS[o.check.skill].name : o.check.skill) + ' ' + o.check.dc));
var ch = UI.el('span', 'opt__tag opt__tag--fact', chanceFor(total, o.check.dc) + '%');
ch.title = 'твой бонус ' + signed(total) + (ib ? ' (предмет ' + signed(ib) + ')' : '') +
' · нужно выбросить ' + Math.max(2, o.check.dc - total) + '+';
b.appendChild(ch);
}
var label = o.check ? o.text.replace(/^\[[^\]]+\]\s*/, '') : o.text;
if (state === 'done') label = 'сделано — ' + label;
else if (state === 'retry') label = 'ещё попытка — ' + label;
else if (state === 'locked') label = 'закрыто — ' + label;
b.appendChild(UI.el('span', 'opt__text', label));
if (state === 'open' || state === 'retry') {
b.addEventListener('click', function () { S.chooseOption(o, i); });
}
opts.appendChild(b);
shown++;
});
box.appendChild(opts);

var foot = UI.el('div', 'dlg__foot');
var back = UI.el('button', 'btn btn--ghost btn--sm', 'Выйти');
back.type = 'button';
back.setAttribute('data-test', 'dlgback');
back.addEventListener('click', function () { ST.dlg = null; S.showLocation(ST.loc); });
foot.appendChild(back);
foot.appendChild(UI.el('span', 'hint', 'Esc — выйти · 1–9 — выбрать реплику'));
box.appendChild(foot);

wrap.appendChild(box);
root.appendChild(wrap);
};

/* провал дела: без мутации статических данных */
function applyFailQuest(o) {
if (!o) return;
var id = o.failQuest || (o.effects && o.effects.failQuest);
if (!id) return;
var q = ST.S.quests[id];
if (q && !q.failed && !q.done) {
L.failQuest(ST.S, id);
UI.toast('Дело провалено: ' + D.QUESTS[id].title);
}
}

S.chooseOption = function (o, idx) {
var s = ST.S;
applyFailQuest(o);
if (o.check) {
var key = ST.dlg.id + ':' + idx;
if (s.usedChecks[key] === 'ok') return;
var ib = itemBonus(o.check.skill);
var r = L.check(s, o.check.skill, o.check.dc, { itemBonus: ib });
r.itemBonus = ib;
s.usedChecks[key] = r.success ? 'ok' : 'fail';
var br = (r.success ? o.success : o.fail) || {};
applyFailQuest(br);
if (AU.applyEffects(br.effects)) { ST.dlg = null; return; }
ST.dlg.reply = br.lines || ['…'];
ST.dlg.roll = r;
ST.dlg.firstOpen = false;
S.renderDialogue();
return;
}
if (o.once) s.usedChecks[ST.dlg.id + ':' + idx] = 'ok';
if (AU.applyEffects(o.effects)) { ST.dlg = null; return; }
if (o.next === 'end') { ST.dlg = null; return S.showLocation(ST.loc); }
if (o.next && D.DIALOGUES[o.next]) return S.openDialogue(o.next);
if (o.reply) { ST.dlg.reply = o.reply; ST.dlg.roll = null; }
ST.dlg.firstOpen = false;
S.renderDialogue();
};

/* ================= дело ================= */
function rewardBits(rw) {
var bits = [];
if (rw.item) bits.push(itemName(rw.item));
if (rw.credits) bits.push(signed(rw.credits) + ' кр.');
if (rw.xp) bits.push('+' + rw.xp + ' XP');
if (rw.fact) bits.push('улика: ' + (D.FACTS[rw.fact] ? D.FACTS[rw.fact].name : rw.fact));
if (rw.facts) rw.facts.forEach(function (f) {
bits.push('улика: ' + (D.FACTS[f] ? D.FACTS[f].name : f));
});
if (rw.rep) Object.keys(rw.rep).forEach(function (k) {
bits.push((D.REP_NAMES[k] || k) + ' ' + signed(rw.rep[k]));
});
bits.push('нить ' + (rw.thread || '—'));
return bits;
}

S.showQuest = function (id) {
  var s = ST.S;
  var q = D.QUESTS[id], st = s.quests[id];
  if (!q || !st) return;
  if (st.done) UI.setScene('bg_dome.png');
  UI.setHudVisible(true);
  UI.updateHud(s, L, D);
  UI.setWhere('Дело · ' + q.title);
  var root = mount('quest');
  var lineName = q.line === 'personal' ? 'личное дело' : q.line === 'faction' ? 'фракционное дело' : 'основная линия';
  root.appendChild(S.pageHead('Дело · ' + lineName + ' · акт ' + q.act, q.title,
    q.giver + ' · ' + locName(q.where)));
  var wrap = UI.el('div', 'quest');
  var ht = q.heroText && q.heroText[s.hero];

  if (ht && ht.desc && !st.done) wrap.appendChild(UI.el('p', 'quest__desc', ht.desc));

  var goal = UI.el('div', 'quest__goal');
  goal.appendChild(UI.el('span', '', st.done ? 'исход' : st.failed ? 'провал' : 'цель'));
  var goalText;
  if (st.done) goalText = q.branch[st.branch] || 'исход неизвестен';
  else if (st.failed) goalText = q.failText || 'дело провалено — но это не конец смены';
  else if (!st.started) goalText = q.stages[0];
  else if (st.stage >= q.stages.length) goalText = q.single ? 'всё готово — подтверди завершение' : 'все этапы пройдены — выбери исход';
  else goalText = q.stages[st.stage];
  goal.appendChild(UI.el('p', '', goalText));
  wrap.appendChild(goal);

  var stages = UI.el('div', 'stages');
  for (var i = 0; i < q.stages.length; i++) {
    var done = st.stage > i;
    var now = st.started && !st.done && !st.failed && st.stage === i;
    var row = UI.el('div', 'qstage' + (done ? ' qstage--done' : now ? ' qstage--now' : ''));
    row.appendChild(UI.el('span', 'qstage__n', String(i + 1).padStart(2, '0')));
    row.appendChild(UI.el('span', '', q.stages[i]));
    row.appendChild(UI.el('span', 'qstage__mark', done ? 'готово' : now ? 'сейчас' : ''));
    if (q.hints && q.hints[i]) row.title = q.hints[i];
    stages.appendChild(row);
  }
  wrap.appendChild(stages);

  if (st.started && !st.done && !st.failed && st.stage < q.stages.length) {
    var h = q.hints && q.hints[st.stage];
    if (h) wrap.appendChild(UI.el('div', 'hint', 'подсказка: ' + h));
    var target = q.targetRead && q.targetRead[s.hero];
    if (target && st.stage === 2 && D.CODEX && D.CODEX.entries[target]) {
      var art = D.CODEX.entries[target];
      var goCx = UI.el('button', 'btn btn--primary', '→ Открыть GrailOS: ' + art.title);
      goCx.type = 'button';
      goCx.setAttribute('data-test', 'questcodex');
      goCx.addEventListener('click', function () { S.showCodex(target); });
      wrap.appendChild(goCx);
    }
  }

  if (st.failed) {
    wrap.appendChild(UI.el('div', 'muted', q.failText || 'дело провалено — но это не конец смены'));
    wrap.appendChild(UI.el('div', 'hint', 'провал открывает другие дела — проверь журнал, вкладка «Где искать»'));
  } else if (st.done) {
    wrap.appendChild(UI.el('div', 'muted', 'дело закрыто · исход: ' + q.branch[st.branch]));
    if (ht && ht.done) {
      var dw = UI.el('div', 'quest__done');
      ht.done.forEach(function (t) { dw.appendChild(UI.el('p', '', t)); });
      wrap.appendChild(dw);
    }
    var rw = (q.rewards || {})[st.branch] || {};
    wrap.appendChild(UI.el('div', 'hint', 'получено: ' + rewardBits(rw).join(' · ')));
    var nxt = (q.next || []).filter(function (x) { return D.QUESTS[x] && (!D.QUESTS[x].hero || D.QUESTS[x].hero === s.hero); });
    if (nxt.length) {
      var opened = nxt.filter(function (x) { return L.questAvailable(s, x); });
      wrap.appendChild(UI.el('div', 'hint', 'дальше: ' + nxt.map(function (x) {
        return D.QUESTS[x].title + (opened.indexOf(x) >= 0 ? ' (доступно)' : '');
      }).join(' · ')));
    }
  } else if (!st.started) {
    if (L.questAvailable(s, id)) {
      var go = UI.el('button', 'btn btn--primary', '→ Где искать: ' + locName(q.where));
      go.type = 'button';
      go.setAttribute('data-test', 'questgo');
      go.addEventListener('click', function () { ST.loc = q.where; S.showLocation(q.where); });
      wrap.appendChild(go);
      wrap.appendChild(UI.el('div', 'hint', 'поговори с: ' + q.giver));
    } else {
      wrap.appendChild(UI.el('div', 'hint', questLockReason(id) || 'дело пока недоступно'));
    }
    wrap.appendChild(UI.el('div', 'hint', 'дело берётся в разговоре, а не в журнале'));
  } else if (st.stage >= q.stages.length) {
    wrap.appendChild(UI.el('div', 'muted', q.single
      ? 'подтверди завершение — исход здесь один'
      : 'ты дошёл до развилки — исход определит нить и награду'));
    var brs = UI.el('div', 'branches');
    Object.keys(q.branch).forEach(function (b, bi) {
      var reason = L.branchBlockReason(s, id, b) || '';
      var btn = UI.el('button', 'branch');
      btn.type = 'button';
      btn.setAttribute('data-test', 'branch' + bi);
      btn.disabled = !!reason;
      btn.appendChild(UI.el('span', '', q.branch[b]));
      var rw2 = (q.rewards && q.rewards[b]) || {};
      btn.appendChild(UI.el('em', '', reason || ('получено: ' + rewardBits(rw2).join(' · '))));
      if (q.branchInfo && q.branchInfo[b]) {
        var info = UI.el('span', '', q.branchInfo[b]);
        info.style.fontSize = '11px';
        info.style.lineHeight = '1.4';
        info.style.color = 'var(--dim-2)';
        btn.appendChild(info);
      }
      btn.addEventListener('click', function () {
        if (!L.completeQuest(s, id, b)) { UI.toast(L.branchBlockReason(s, id, b) || 'не вышло'); return; }
        L.save(s, 'auto');
        UI.toast('Дело закрыто: ' + q.branch[b]);
        (q.unlock || []).forEach(function (u) {
          var room = D.LOCATIONS.filter(function (x) { return x.unlock === u; })[0];
          if (room) setTimeout(function () { UI.toast('Открыто: ' + room.name); }, 900);
        });
        if (id === 'q_final') { S.showEnding(); return; }
        S.showQuest(id);
      });
      brs.appendChild(btn);
    });
    wrap.appendChild(brs);
  } else {
    wrap.appendChild(UI.el('div', 'hint', 'дело двигается разговорами, проверками и боями'));
  }

  var back = UI.el('button', 'btn btn--ghost btn--sm', '← Назад');
  back.type = 'button';
  back.setAttribute('data-test', 'back');
  back.addEventListener('click', function () { ST.loc ? S.showLocation(ST.loc) : S.showHub(); });
  wrap.appendChild(back);
  root.appendChild(wrap);
};
})(window);
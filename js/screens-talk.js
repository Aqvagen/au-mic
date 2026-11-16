/* =========================================================
   Экраны: диалог и дело.
   Версия 2.6: VN-механика. intro → start → reply.
   Никаких «Дальше». Кубик — бейдж. next:'end' — только явное «Уйти».
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

  function questLockReason(id) {
    var q = D.QUESTS[id], out = [];
    if (q.requires && q.requires.all) {
      q.requires.all.forEach(function (r) {
        if (!ST.S.quests[r].done) out.push(D.QUESTS[r].title);
      });
    }
    if (q.requires && q.requires.any) {
      var need = q.requires.minAny || 1, got = 0;
      q.requires.any.forEach(function (r) { if (ST.S.quests[r].done) got++; });
      if (got < need) {
        out.push(q.requires.any.length > 3
          ? 'ещё ' + (need - got) + ' дело(а) акта II'
          : 'ещё ' + (need - got) + ' из: ' + q.requires.any.map(function (r) { return D.QUESTS[r].title; }).join(', '));
      }
    }
    if (q.requires && q.requires.anyFailed) {
      out.push('нужен провал одного из: ' + q.requires.anyFailed.map(function (r) { return D.QUESTS[r].title; }).join(', '));
    }
    if (q.requires && q.requires.questBranch) {
      var qb = q.requires.questBranch;
      out.push('нужен выбор «' + D.QUESTS[qb.id].branch[qb.branch] + '» в «' + D.QUESTS[qb.id].title + '»');
    }
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
    var key = ST.dlg.id + ':' + idx;
    var used = s.usedChecks[key];
    var met = L.reqMet(s, o.req);
    if (!met && o.hide) return 'hidden';
    if (o.fact && !L.hasFact(s, o.fact)) return 'locked';
    if (used === 'ok') return 'done';
    if (!met) return 'locked';
    return used === 'fail' ? 'retry' : 'open';
  }

  /** Определить текст NPC: reply → intro (1-й раз) → start (по req) → lines */
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

    /* бейдж кубика над репликой — вариант А */
    if (ST.dlg.roll) {
      var r = ST.dlg.roll;
      var badge = UI.el('div', 'roll' + (r.success ? '' : ' roll--bad'));
      badge.appendChild(UI.el('div', 'roll__dice',
        'd20: ' + r.roll + ' + ' + r.bonus + ' = ' + r.total + ' vs DC ' + r.dc));
      badge.appendChild(UI.el('div', '', r.label));
      box.appendChild(badge);
    }

    var npcLines = resolveNpcLines(d, s, ST.dlg.firstOpen);

    /* reactions — всегда в конец */
    if (d.reactions) {
      d.reactions.forEach(function (r) {
        if (L.reqMet(s, r.req)) npcLines = npcLines.concat(r.lines || []);
      });
    }

    var lines = UI.el('div', 'dlg__lines');
    npcLines.forEach(function (t) { lines.appendChild(UI.el('p', 'dlg__line dlg__line--n', t)); });
    box.appendChild(lines);

    if (d.companions) {
      Object.keys(d.companions).forEach(function (c) {
        if (s.companions.indexOf(c) >= 0) {
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
        b.appendChild(UI.el('span', 'opt__tag', o.tag || (D.SKILLS[o.check.skill].name + ' ' + o.check.dc)));
      }
      if (o.fact) b.appendChild(UI.el('span', 'opt__tag opt__tag--fact', 'ФАКТ'));

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
    var back = UI.el('button', 'btn btn--ghost btn--sm');
    back.type = 'button';
    back.setAttribute('data-test', 'dlgback');
    back.appendChild(UI.el('span', '', 'Выйти'));
    back.addEventListener('click', function () { ST.dlg = null; S.showLocation(ST.loc); });
    foot.appendChild(back);
    box.appendChild(foot);

    wrap.appendChild(box);
    root.appendChild(wrap);
  };

  function applyFailQuest(o) {
    if (!o) return;
    if (o.failQuest) L.failQuest(ST.S, o.failQuest);
    if (o.effects && o.effects.failQuest) {
      L.failQuest(ST.S, o.effects.failQuest);
      delete o.effects.failQuest;
    }
  }

  S.chooseOption = function (o, idx) {
    var s = ST.S;
    applyFailQuest(o);

    /* проверка */
    if (o.check) {
      var key = ST.dlg.id + ':' + idx;
      if (s.usedChecks[key] === 'ok') return;
      var r = L.check(s, o.check.skill, o.check.dc, {
        itemBonus: s.bag.some(function (i) { return D.ITEMS[i] && D.ITEMS[i].check && D.ITEMS[i].check[o.check.skill]; }) ? 1 : 0
      });
      s.usedChecks[key] = r.success ? 'ok' : 'fail';
      var br = (r.success ? o.success : o.fail) || {};
      applyFailQuest(br);
      var started = AU.applyEffects(br.effects);
      if (started) { ST.dlg = null; return; }
      ST.dlg.reply = br.lines || ['…'];
      ST.dlg.roll = r;
      ST.dlg.firstOpen = false;
      S.renderDialogue();
      return;
    }

    if (o.once) s.usedChecks[ST.dlg.id + ':' + idx] = 'ok';
    if (AU.applyEffects(o.effects)) { ST.dlg = null; return; }

    /* переход */
    if (o.next === 'end') { ST.dlg = null; return S.showLocation(ST.loc); }
    if (o.next && D.DIALOGUES[o.next]) { return S.openDialogue(o.next); }

    /* остаться — обновить текст NPC */
    if (o.reply) {
      ST.dlg.reply = o.reply;
      ST.dlg.roll = null;
    }
    ST.dlg.firstOpen = false;
    S.renderDialogue();
  };

  /* ================= дело ================= */

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

    var goal = UI.el('div', 'quest__goal');
    goal.appendChild(UI.el('span', '', st.done ? 'исход' : st.failed ? 'провал' : 'цель'));
    var goalText;
    if (st.done) goalText = q.branch[st.branch] || 'исход неизвестен';
    else if (st.failed) goalText = q.failText || 'дело провалено — но это не конец смены';
    else if (!st.started) goalText = q.stages[0];
    else if (st.stage >= q.stages.length) goalText = 'все этапы пройдены — выбери исход';
    else goalText = q.stages[st.stage];
    goal.appendChild(UI.el('p', '', goalText));
    wrap.appendChild(goal);

    var stages = UI.el('div', 'stages');
    for (var i = 0; i < q.stages.length; i++) {
      var done = st.stage > i;
      var now = st.started && st.stage === i;
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
    }

    if (st.failed) {
      wrap.appendChild(UI.el('div', 'muted', q.failText || 'дело провалено — но это не конец смены'));
    } else if (st.done) {
      wrap.appendChild(UI.el('div', 'muted', 'дело закрыто · исход: ' + q.branch[st.branch]));
      var rw = (q.rewards || {})[st.branch] || {};
      var bits = [];
      if (rw.item && D.ITEMS[rw.item]) bits.push('предмет: ' + D.ITEMS[rw.item].name);
      if (rw.credits) bits.push('кредиты: ' + rw.credits);
      if (rw.xp) bits.push('опыт: ' + rw.xp);
      if (bits.length) wrap.appendChild(UI.el('div', 'hint', bits.join(' · ')));
    } else if (!st.started) {
      var reason = questLockReason(id);
      if (L.questAvailable(s, id)) {
        var go = UI.el('button', 'btn btn--primary');
        go.type = 'button';
        go.setAttribute('data-test', 'questgo');
        go.appendChild(UI.el('span', '', '→ Где искать: ' + locName(q.where)));
        go.addEventListener('click', function () {
          ST.loc = q.where;
          S.showLocation(q.where);
        });
        wrap.appendChild(go);
        wrap.appendChild(UI.el('div', 'hint', 'поговори с: ' + q.giver));
      } else {
        wrap.appendChild(UI.el('div', 'hint', reason || 'дело пока недоступно'));
      }
      wrap.appendChild(UI.el('div', 'hint', 'дело берётся в разговоре, а не в журнале'));
    } else if (st.stage >= q.stages.length) {
      wrap.appendChild(UI.el('div', 'muted', 'ты дошёл до развилки — исход определит нить и награду'));
      var brs = UI.el('div', 'branches');
      Object.keys(q.branch).forEach(function (b, i) {
        var reason = L.branchBlockReason(s, id, b) || '';
        var btn = UI.el('button', 'branch');
        btn.type = 'button';
        btn.setAttribute('data-test', 'branch' + i);
        btn.disabled = !!reason;
        btn.title = (q.branchInfo && q.branchInfo[b]) || '';
        btn.appendChild(UI.el('span', '', q.branch[b]));
        var rw2 = (q.rewards && q.rewards[b]) || {};
        var bits2 = [];
        if (rw2.item && D.ITEMS[rw2.item]) bits2.push(D.ITEMS[rw2.item].name);
        if (rw2.credits) bits2.push('+' + rw2.credits + ' кр.');
        if (rw2.xp) bits2.push('+' + rw2.xp + ' XP');
        bits2.push('нить ' + (rw2.thread || b));
        btn.appendChild(UI.el('em', '', reason || ('награда: ' + bits2.join(' · '))));
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
          if (id === 'q_final') { S.showEnding(); return; }
          S.showQuest(id);
        });
        brs.appendChild(btn);
      });
      wrap.appendChild(brs);
    } else {
      wrap.appendChild(UI.el('div', 'hint', 'дело двигается разговорами, проверками и боями'));
    }

    var back = UI.el('button', 'btn btn--ghost btn--sm');
    back.type = 'button';
    back.setAttribute('data-test', 'back');
    back.appendChild(UI.el('span', '', '← Назад'));
    back.addEventListener('click', function () { ST.loc ? S.showLocation(ST.loc) : S.showHub(); });
    wrap.appendChild(back);

    root.appendChild(wrap);
  };

})(window);
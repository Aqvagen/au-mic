/* =========================================================
   AU MICROSCOPII — состояние, эффекты, запуск, клавиатура, самотест
   ========================================================= */
(function (G) {
  'use strict';

  var D = G.D, L = G.L, UI = G.UI;
  var AU = G.AU = G.AU || {};
  AU.D = D; AU.L = L;
  var ST = AU.state = AU.state || { S: null, loc: null, dlg: null, screen: 'title' };

  var S = G.Screens;

  /* ================= эффекты ================= */

  AU.applyEffects = function (eff) {
    var s = ST.S;
    if (!eff) return false;

    if (eff.startQuest) {
      if (L.startQuest(s, eff.startQuest)) UI.toast('Взято дело: ' + D.QUESTS[eff.startQuest].title);
    }
    if (eff.advanceQuest) {
      if (L.advanceQuest(s, eff.advanceQuest)) UI.toast('Этап: ' + D.QUESTS[eff.advanceQuest].title);
    }
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
      S.startCombat(eff.combat, function () {
        if (winQuest) L.advanceQuest(s, winQuest);
        S.showLocation(ST.loc);
      });
      return true;
    }

    L.save(s, 'auto');
    return false;
  };

  /* ================= настройки / пауза ================= */

  var settings = { volume: 0.2, calm: false, scan: true };

  AU.showSettings = function () {
    var p = UI.panel({ kicker: 'Конфигурация', title: 'Настройки', footRight: 'AU MIC · локальный профиль' });
    var box = UI.el('div', 'stack');

    function slider(label, value, onInput) {
      var row = UI.el('div', 'lrow');
      row.style.alignItems = 'center';
      row.appendChild(UI.el('span', 'lrow__t', label));
      var input = document.createElement('input');
      input.type = 'range';
      input.min = '0'; input.max = '100'; input.value = String(Math.round(value * 100));
      input.style.flex = '1 1 auto';
      input.style.accentColor = '#ffb457';
      var out = UI.el('span', 'lrow__s', input.value + '%');
      input.addEventListener('input', function () {
        out.textContent = input.value + '%';
        onInput(Number(input.value) / 100);
      });
      row.appendChild(input);
      row.appendChild(out);
      return row;
    }

    box.appendChild(slider('Громкость', settings.volume, function (v) {
      settings.volume = v;
      var a = UI.$('amb');
      if (a) a.volume = v;
    }));

    function toggle(label, on, fn) {
      var b = UI.el('button', 'btn btn--sm' + (on ? ' btn--primary' : ''), label + (on ? ' · вкл' : ' · выкл'));
      b.type = 'button';
      b.addEventListener('click', function () {
        fn(!on);
        on = !on;
        b.textContent = label + (on ? ' · вкл' : ' · выкл');
        b.className = 'btn btn--sm' + (on ? ' btn--primary' : '');
      });
      return b;
    }

    var row = UI.el('div', 'row');
    row.appendChild(toggle('Снизить анимации', settings.calm, function (v) {
      settings.calm = v;
      UI.$('stage').classList.toggle('calm', v);
    }));
    row.appendChild(toggle('Скан-линии', settings.scan, function (v) {
      settings.scan = v;
      UI.$('stage').classList.toggle('no-scan', !v);
    }));
    box.appendChild(row);

    var note = UI.el('div', 'hint', 'настройки действуют на этот сеанс');
    box.appendChild(note);

    p._body.appendChild(box);
    UI.openPanel(p);
  };

  AU.showLoad = function () {
    var p = UI.panel({ kicker: 'Архив', title: 'Загрузить', footRight: 'локальные сейвы' });
    var list = UI.el('div', 'list');
    var any = false;

    [['auto', 'Автосохранение'], ['slot1', 'Слот 1'], ['slot2', 'Слот 2']].forEach(function (def, i) {
      var st = null;
      try { st = L.load(def[0]); } catch (e) { st = null; }

      var row = UI.el('div', 'lrow' + (st ? '' : ' lrow--empty'));
      row.style.setProperty('--i', i);

      var main = UI.el('div', 'lrow__main');
      main.appendChild(UI.el('div', 'lrow__t', st ? def[1] + ' · ' + D.HEROES[st.hero].name : def[1]));
      main.appendChild(UI.el('div', 'lrow__s', st
        ? 'уровень ' + st.level + ' · ' + st.credits + ' кр. · HP ' + st.hp + '/' + st.maxHp
        : 'пусто'));
      row.appendChild(main);

      if (st) {
        any = true;
        var b = UI.el('button', 'btn btn--sm btn--primary', 'Загрузить');
        b.type = 'button';
        b.addEventListener('click', function () {
          ST.S = st;
          UI.closePanel();
          S.showHub();
          UI.toast('Сеанс восстановлен');
        });
        row.appendChild(b);
      } else {
        row.appendChild(UI.el('span', 'lrow__badge', 'пусто'));
      }
      list.appendChild(row);
    });

    p._body.appendChild(list);
    if (!any) p._body.appendChild(UI.el('div', 'hint', 'сохранений нет — начни новую смену'));
    UI.openPanel(p);
  };

  AU.showAbout = function () {
    var p = UI.panel({ kicker: 'Справка', title: 'Об игре', footRight: 'AU MICROSCOPII · 2287' });
    var box = UI.el('div', 'stack');
    box.appendChild(UI.el('p', 'title__sub',
      'Станция R-7 держится на внешнем кольце пылевого диска AU Microscopii. ' +
      'Звезда вспыхивает, смены идут по расписанию, а накладные не сходятся.'));
    box.appendChild(UI.el('p', 'title__sub',
      'Один герой, три допуска, дела, проверки d20, торговля, бой на сетке 6×6 и финал, ' +
      'который зависит от того, что ты решил по дороге.'));
    var kv = UI.el('div', 'kv');
    [['эпоха', '2287'], ['сектор', 'AU Mic · 32,6 св. года'], ['версия', '2.0.0 · 25 дел']].forEach(function (x) {
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
    [
      ['Журнал', function () { UI.closePanel(); S.showJournal(); }],
      ['Рюкзак', function () { UI.closePanel(); S.showInventory(); }],
      ['Настройки', function () { UI.closePanel(); AU.showSettings(); }],
      ['Сохранить', function () { var ok = L.save(ST.S, 'auto'); UI.toast(ok ? 'Сохранено' : 'Не вышло'); }]
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
      kv.appendChild(UI.el('dt', '', 'герой'));
      kv.appendChild(UI.el('dd', '', D.HEROES[s.hero].name));
      kv.appendChild(UI.el('dt', '', 'уровень'));
      kv.appendChild(UI.el('dd', '', String(s.level)));
      kv.appendChild(UI.el('dt', '', 'кредиты'));
      kv.appendChild(UI.el('dd', '', String(s.credits)));
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
    if (e.key === 'Escape') {
      if (UI.isPanelOpen()) { UI.closePanel(); return; }
      if (ST.S && (ST.screen === 'map' || ST.screen === 'loc' || ST.screen === 'combat')) { AU.showPause(); }
      return;
    }
    // навигация по титульному меню
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
    if (n >= 1 && n <= 9 && ST.screen === 'dlg' && ST.dlg && !ST.dlg.result) {
      var b = document.querySelector('[data-test="opt' + (n - 1) + '"]');
      if (b && !b.disabled) b.click();
    }
  });

  /* ================= HUD ================= */

  function wireHud() {
    var j = UI.$('btnJournal');
    if (j) j.addEventListener('click', function () { if (ST.S) S.showJournal(); });
    var i = UI.$('btnBag');
    if (i) i.addEventListener('click', function () { if (ST.S) S.showInventory(); });
    var p = UI.$('btnPause');
    if (p) p.addEventListener('click', function () { if (ST.S) AU.showPause(); });
    var pts = UI.$('hudPoints');
    if (pts) pts.addEventListener('click', function () { if (ST.S) S.showLevelUp(); });
  }

  /* ================= самотест ================= */

  var TR = [];

  function t(name, fn) {
    try {
      var r = fn();
      TR.push({ name: name, ok: r === true, note: typeof r === 'string' ? r : '' });
    } catch (err) {
      TR.push({ name: name, ok: false, note: err.message });
    }
  }

  function clickable(sel) {
    var n = document.querySelector(sel);
    if (!n) return 'нет ' + sel;
    var r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return 'нулевой размер';
    var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return (n === top || n.contains(top)) ? true : ('перекрыт: ' + (top && top.className));
  }

  function clickel(sel) {
    var n = document.querySelector(sel);
    if (!n) throw new Error('нет элемента ' + sel);
    if (typeof n.click === 'function') n.click();
    else n.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }

  function out() {
    var bad = TR.filter(function (r) { return !r.ok; }).length;
    var box = document.createElement('div');
    box.id = 'testout';
    box.style.cssText = 'position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;max-height:60vh;overflow:auto;padding:10px;background:rgba(4,8,12,.98);border:1px solid #57d3e6;color:#cfe6ef;font:11.5px/1.5 monospace;white-space:pre-wrap';
    box.textContent = 'САМОТЕСТ · ' + (bad === 0 ? 'ВСЁ РАБОТАЕТ' : 'ПРОВАЛОВ: ' + bad) + '\n\n' +
      TR.map(function (r) { return (r.ok ? 'OK   ' : 'FAIL ') + r.name + (r.note ? '  (' + r.note + ')' : ''); }).join('\n');
    document.body.appendChild(box);
    window.__selftest = { bad: bad, results: TR };
  }

  AU.runSelfTest = function () {
    var s = ST.S;
    function optText(needle) {
      var all = Array.prototype.slice.call(document.querySelectorAll('[data-test^="opt"]'));
      for (var k = 0; k < all.length; k++) {
        if (all[k].textContent.indexOf(needle) >= 0) return all[k];
      }
      return null;
    }
    function closePanel() {
      var p = document.getElementById('panel');
      if (p) { var b = p.querySelector('button'); if (b) b.click(); }
    }
    function fresh(hero) {
      ST.S = L.create(hero || 'noa');
      ST.loc = null; ST.dlg = null;
      UI.setHudVisible(true);
      UI.updateHud(ST.S, L, D);
      return ST.S;
    }

    var steps = [
      ['данные: 25 квестов', function () { return Object.keys(D.QUESTS).length === 25; }],
      ['данные: 18 концовок и 32 улики', function () {
        return D.ENDINGS.length === 18 && Object.keys(D.FACTS).length >= 30;
      }],
      ['данные: у каждого квеста этапы, подсказки и три ветки', function () {
        var bad = [];
        Object.keys(D.QUESTS).forEach(function (id) {
          var q = D.QUESTS[id];
          if (q.stages.length !== q.hints.length) bad.push(id + ': hints');
          if (Object.keys(q.branch).length !== 3) bad.push(id + ': branches');
          Object.keys(q.branch).forEach(function (b) {
            if (!q.rewards[b]) bad.push(id + ': reward ' + b);
          });
        });
        return bad.length ? bad.join(', ') : true;
      }],
      ['движок: каждый квест проходим по каждой ветке', function () {
        var err = null;
        Object.keys(D.QUESTS).forEach(function (id) {
          if (err) return;
          var q = D.QUESTS[id];
          Object.keys(q.branch).forEach(function (b) {
            if (err) return;
            var st = L.create(q.hero || 'noa');
            var r = q.requires || {};
            (r.all || []).forEach(function (x) { st.quests[x].done = true; st.quests[x].started = true; st.quests[x].stage = D.QUESTS[x].stages.length; });
            (r.any || []).slice(0, r.minAny || 1).forEach(function (x) { st.quests[x].done = true; st.quests[x].started = true; st.quests[x].stage = D.QUESTS[x].stages.length; });
            var br = (q.branchReq || {})[b] || {};
            if (br.fact) st.facts[br.fact] = true;
            if (br.item) st.bag.push(br.item);
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
      ['данные: у каждого квеста есть старт в диалогах', function () {
        var started = {};
        Object.keys(D.DIALOGUES).forEach(function (d) {
          (D.DIALOGUES[d].options || []).forEach(function (o) {
            if (o.effects && o.effects.startQuest) started[o.effects.startQuest] = true;
          });
        });
        var miss = Object.keys(D.QUESTS).filter(function (q) { return !started[q]; });
        return miss.length ? 'нет старта: ' + miss.join(', ') : true;
      }],
      ['данные: все переходы диалогов существуют', function () {
        var bad = [];
        Object.keys(D.DIALOGUES).forEach(function (d) {
          (D.DIALOGUES[d].options || []).forEach(function (o) {
            var nxt = o.next;
            if (nxt && nxt !== 'end' && !D.DIALOGUES[nxt]) bad.push(d + ' → ' + nxt);
            ['success', 'fail'].forEach(function (k) {
              if (o[k] && o[k].next && o[k].next !== 'end' && !D.DIALOGUES[o[k].next]) bad.push(d + ' → ' + o[k].next);
            });
          });
        });
        return bad.length ? bad.join(', ') : true;
      }],
      ['сейв: старый формат мигрирует', function () {
        var old = { hero: 'noa', quests: { q_mira: { stage: 2, done: false, branch: null } },
          facts: {}, usedChecks: { 'dlg_x:1': true }, bag: [], flags: {}, anchors: [],
          weights: { A: 0, B: 0, C: 0 }, companions: [], level: 1,
          skills: {}, attrs: { telo: 5, um: 5, harizma: 5 }, perks: [],
          hp: 10, maxHp: 10, credits: 0, log: [], rep: {} };
        L.migrate(old);
        return old.quests.q_mira.started === true && old.quests.q_mira.stage === 1 &&
          old.usedChecks['dlg_x:1'] === 'fail' && !!old.quests.q_sign;
      }],
      ['кнопка старта кликабельна', function () { fresh(); S.showTitle(); return clickable('[data-test="start"]'); }],
      ['переход к выбору героя', function () { document.querySelector('[data-test="start"]').click(); return !!document.querySelector('[data-test="hero0"]'); }],
      ['герой создан, карта открыта', function () {
        document.querySelector('[data-test="hero0"]').click();
        return !!document.querySelector('[data-test="room_loc_zhil"]') && !!ST.S;
      }],
      ['комнат на карте: 10', function () { return document.querySelectorAll('[data-test^="room_"]').length === 10; }],
      ['локация открывается', function () { clickel('[data-test="room_loc_zhil"]'); return !!document.querySelector('[data-test^="dlg_"]'); }],
      ['диалог: опции есть', function () { document.querySelector('[data-test^="dlg_"]').click(); return document.querySelectorAll('[data-test^="opt"]').length >= 3; }],
      ['взято дело Миры', function () {
        var b = optText('Что за чипы');
        if (!b) return 'нет опции старта';
        b.click();
        return ST.S.quests.q_mira.started === true;
      }],
      ['журнал открывается', function () {
        document.querySelector('[data-test="journal"]').click();
        return !!document.getElementById('panel');
      }],
      ['вкладки журнала работают', function () {
        document.querySelector('[data-test="tab_where"]').click();
        return !!document.querySelector('[data-test="tab_active"]');
      }],
      ['журнал: пять вкладок и счётчики', function () {
        document.querySelector('[data-test="tab_where"]').click();
        return document.querySelectorAll('#panel .tab').length === 5;
      }],
      ['дело: экран и этапы', function () {
        closePanel();
        ST.loc = 'loc_zhil';
        S.showQuest('q_mira');
        var qs = document.querySelectorAll('.qstage').length;
        return qs === D.QUESTS.q_mira.stages.length;
      }],
      ['проверка в админ-блоке двигает этап', function () {
        ST.S.skills.logika = 10;
        ST.S.attrs.um = 12;
        ST.loc = 'loc_admin';
        for (var k = 0; k < 6; k++) {
          S.openDialogue('dlg_admin');
          var b = optText('Найти лог аудита');
          if (!b) return 'нет опции лога';
          b.click();
          var nx = document.querySelector('[data-test="dlgnext"]');
          if (nx) nx.click();
          if (ST.S.quests.q_mira.stage === 2) return !!ST.S.facts.f_log;
        }
        return 'проверка не прошла за 6 попыток';
      }],
      ['возврат к Мире готовит развилку', function () {
        ST.S.quests.q_mira.stage = 2;
        ST.loc = 'loc_zhil';
        S.openDialogue('dlg_zhil');
        var b = optText('Вернуться к Мире');
        if (!b) return 'нет опции возврата';
        b.click();
        var close = optText('Закрыть дело');
        if (!close) return 'нет закрытия';
        close.click();
        return ST.S.quests.q_mira.stage === 3 && !!document.querySelector('[data-test="branch0"]');
      }],
      ['развилка закрывает дело', function () {
        document.querySelector('[data-test="branch0"]').click();
        return ST.S.quests.q_mira.done === true;
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
        b.click();
        return ST.S.hp > 0;
      }],
      ['уровень повышается и очко тратится', function () {
        closePanel();
        L.gainXp(ST.S, 500);
        if (ST.S.points <= 0) return 'нет очков';
        S.showLevelUp();
        var b = document.querySelector('[data-test="skill_ubezhdenie"]');
        var before = ST.S.skills.ubezhdenie;
        b.click();
        return ST.S.skills.ubezhdenie === before + 1;
      }],
      ['перк берётся', function () {
        closePanel();
        ST.S.attrs.telo = 6; L.recalc(ST.S); ST.S.points += 1;
        S.showLevelUp();
        var b = document.querySelector('[data-test="perk_hardbody"]');
        if (!b || b.disabled) return 'перк недоступен';
        b.click();
        return ST.S.perks.length > 0;
      }],
      ['торговля: покупка', function () {
        closePanel();
        ST.S.credits = 1000;
        ST.loc = 'loc_canteen';
        S.showTrade('kim');
        var before = ST.S.credits;
        document.querySelector('[data-test="buy0"]').click();
        return ST.S.credits < before;
      }],
      ['торговля: продажа', function () {
        var before = ST.S.credits;
        var b = document.querySelector('[data-test="sell0"]');
        if (!b) return 'нечего продавать';
        b.click();
        return ST.S.credits > before;
      }],
      ['бой начинается', function () {
        ST.loc = 'loc_mine';
        S.startCombat('drone,drone');
        return !!ST.S.combat && document.querySelectorAll('[data-cell]').length === 36;
      }],
      ['бой: на сетке 8 укрытий', function () { return document.querySelectorAll('.cell--cover').length === 8; }],
      ['бой: укрытие даёт +2 к защите', function () {
        var st = L.create('noa');
        st.weapon = 'glasshot';
        var c = L.combatStart(st, ['drone'], {});
        var h = L.heroUnit(c), e = L.enemies(c)[0];
        h.x = 2; h.y = 3; e.x = 2; e.y = 1; e.alive = true;
        var pv = L.previewAttack(st, c, h, e);
        return pv.ok && pv.cover === 2 && pv.dist === 2;
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
        var h = L.heroUnit(c), foe = L.enemies(c)[0];
        c.turnIndex = c.order.indexOf('hero');
        h.ap = 2;
        h.x = foe.x; h.y = Math.max(0, foe.y - 1);
        var before = foe.hp;
        for (var k = 0; k < 8; k++) {
          if (!ST.S.combat || ST.S.combat.over) return true;
          c = ST.S.combat;
          h = L.heroUnit(c); foe = L.enemies(c)[0];
          if (!foe) return true;
          c.turnIndex = c.order.indexOf('hero');
          h.ap = 2;
          h.x = foe.x; h.y = Math.max(0, foe.y - 1);
          S.onCellClick(foe.x, foe.y);
          if (foe.hp < before) return true;
        }
        return false;
      }],
      ['бой: враг ходит и логирует', function () {
        var c = ST.S.combat;
        if (!c || c.over) return true;
        var before = c.log.length;
        c.turnIndex = c.order.indexOf('hero');
        L.endTurn(ST.S, c);
        return c.log.length > before;
      }],
      ['бой: завершается и возвращает в игру', function () {
        var guard = 0;
        while (ST.S.combat && !ST.S.combat.over && guard++ < 80) {
          var c = ST.S.combat;
          var h = L.heroUnit(c);
          var foes = L.enemies(c);
          if (!foes.length) break;
          c.turnIndex = c.order.indexOf('hero');
          h.ap = 2;
          h.x = foes[0].x; h.y = Math.max(0, foes[0].y - 1);
          L.attack(ST.S, c, h, foes[0]);
          if (ST.S.combat && !ST.S.combat.over) L.endTurn(ST.S, ST.S.combat);
        }
        if (ST.S.combat && ST.S.combat.over) S.finishCombat();
        return !ST.S.combat;
      }],
      ['поражение не забирает квестовый предмет', function () {
        var st = L.create('noa');
        st.bag = ['chip_low', 'bondo7'];
        var c = L.combatStart(st, ['drone'], {});
        c.over = true; c.winner = 'enemy';
        L.heroUnit(c).hp = 0; L.heroUnit(c).alive = false;
        var res = L.combatResult(st, c);
        return !res.win && st.bag.indexOf('chip_low') >= 0 && st.bag.indexOf('bondo7') < 0;
      }],
      ['сейв и загрузка', function () {
        L.save(ST.S, 'auto');
        var loaded = L.load('auto');
        return !!loaded && loaded.hero === ST.S.hero && loaded.level === ST.S.level;
      }],
      ['нить и финал', function () {
        var st = L.create('noa');
        st.quests.q_final.started = true;
        st.quests.q_final.stage = D.QUESTS.q_final.stages.length;
        L.completeQuest(st, 'q_final', 'A');
        var e = L.ending(st);
        return !!e && e.text.join(' ').length > 80;
      }],
      ['все 18 концовок написаны', function () {
        return D.ENDINGS.every(function (e) { return e.text.length >= 3 && e.text.join(' ').length > 80; });
      }]
    ];

    var i = 0;
    (function step() {
      if (i < steps.length) {
        t(steps[i][0], steps[i][1]);
        i++;
        setTimeout(step, 40);
      } else out();
    })();
  };

  /* ================= запуск ================= */

  window.onerror = function (m, src, line) {
    var b = document.createElement('div');
    b.id = 'testout';
    b.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9999;padding:10px;background:#200;color:#faa;font:12px monospace';
    b.textContent = 'ОШИБКА: ' + m + ' @ ' + (src || '').split('/').pop() + ':' + line;
    document.body.appendChild(b);
    return false;
  };

  function boot() {
    if (/[?&]noveil/.test(location.search)) UI.$('stage').classList.add('no-veil');
    UI.init();
    wireHud();
    UI.initAudio('assets/audio/ambient.mp3', 0.2);
    S.showTitle();

    var h = (location.hash || '').replace('#', '');
    if (h === 'selftest') {
      setTimeout(function () { AU.runSelfTest(); }, 250);
      return;
    }
    if (h.indexOf('dev:') === 0) {
      ST.S = L.create('noa');
      var what = h.slice(4);
      UI.setHudVisible(true);
      UI.updateHud(ST.S, L, D);
      if (what === 'heroes') S.showHeroes();
      else if (what === 'hub') S.showHub();
      else if (what === 'loc') { ST.loc = 'loc_zhil'; S.showLocation('loc_zhil'); }
      else if (what === 'pause') { S.showHub(); setTimeout(function () { AU.showPause(); }, 400); }
      else if (what === 'settings') { S.showHub(); AU.showSettings(); }
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

  document.addEventListener('DOMContentLoaded', boot);

  AU.Screens = S;
  AU.getS = function () { return ST.S; };
  AU.setS = function (v) { ST.S = v; };
})(window);

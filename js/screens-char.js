/* =========================================================
   Экраны персонажа: рюкзак, уровень, журнал, торговля
   ========================================================= */
(function (G) {
  'use strict';

  var UI = G.UI;
  var AU = G.AU;
  var ST = AU.state;
  var D = AU.D, L = AU.L;
  var S = G.Screens;

  var EQ_SLOTS = [
    ['head', 'ГОЛОВА'], ['handL', 'РУКА Л'], ['body', 'ТЕЛО'], ['handR', 'РУКА П'],
    ['implant', 'ИМПЛАНТ'], ['belt', 'ПОЯС'], ['pocket1', 'КАРМАН 1'], ['pocket2', 'КАРМАН 2']
  ];
  var EQ_POS = {
    head: 's-head', handL: 's-handl', body: 's-body', handR: 's-handr',
    implant: 's-implant', belt: 's-belt', pocket1: 's-p1', pocket2: 's-p2'
  };

  function st() { return ST.S; }

  function itemName(id) {
    if (!id) return null;
    if (D.WEAPONS[id]) return D.WEAPONS[id].name;
    if (D.ARMORS[id]) return D.ARMORS[id].name;
    if (D.ITEMS[id]) return D.ITEMS[id].name;
    return id;
  }

  function weaponStats(w) {
    if (!w) return '';
    var band = w.band === 'melee' ? 'ближний' : w.band === 'short' ? 'короткий' : 'дальний';
    var tr = [];
    if (w.pierce) tr.push('пробивает укрытие');
    if (w.stun) tr.push('отнимает AP');
    if (w.bleed) tr.push('кровотечение');
    return 'урон ' + w.dmg + ' · ' + w.range + ' кл. · ' + band + (tr.length ? ' · ' + tr.join(', ') : '');
  }

  function itemSlot(it) {
    if (!it) return null;
    if (it.kind === 'weapon') return 'handR';
    if (it.kind === 'suit') return 'body';
    if (it.kind === 'mask') return 'head';
    if (it.kind === 'tool') return 'handR';
    if (it.kind === 'implant') return 'implant';
    return 'pocket1';
  }

  function equipInto(slot, id) {
    var s = st();
    if (slot === 'handR' && D.WEAPONS[id]) return L.equipWeapon(s, id);
    if (slot === 'body' && D.ARMORS[id]) return L.equipArmor(s, id);
    if (!s.gear) s.gear = {};
    if (s.gear[slot]) L.addItem(s, s.gear[slot]);
    L.removeItem(s, id);
    s.gear[slot] = id;
    return true;
  }

  /* ================= рюкзак / персонаж ================= */

  S.showInventory = function () {
    var s = st();
    s.gear = s.gear || {};

    var p = UI.panel({ kicker: 'Персонаж', title: D.HEROES[s.hero].name, wide: true, footRight: 'ЛКМ — действие' });

    // сводка
    var grid = UI.el('div', 'statgrid');
    [
      ['HP', s.hp + ' / ' + s.maxHp],
      ['УРОН', D.WEAPONS[s.weapon].dmg + ' · ' + D.WEAPONS[s.weapon].range + ' кл.', D.WEAPONS[s.weapon].name],
      ['ЗАЩИТА', String(L.defense(s)), D.ARMORS[s.armor].name + ' · −' + (D.ARMORS[s.armor].dr || 0) + ' урона']
    ].forEach(function (x) {
      var b = UI.el('div', 'statbox');
      var v = UI.el('div', 'statbox__v', x[1]);
      b.appendChild(v);
      b.appendChild(UI.el('div', 'statbox__l', x[2] ? x[0] + ' · ' + x[2] : x[0]));
      grid.appendChild(b);
    });
    p._body.appendChild(grid);

    var inv = UI.el('div', 'inv');
    inv.appendChild(buildDoll(p));
    inv.appendChild(buildBag(p));
    p._body.appendChild(inv);

    UI.openPanel(p);
  };

  function buildDoll(panel) {
    var s = st();
    var doll = UI.el('div', 'inv__doll');

    var sil = UI.el('div', 'silhouette');
    sil.innerHTML =
      '<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid meet">' +
      '<g fill="rgba(111,227,255,.10)" stroke="rgba(111,227,255,.32)" stroke-width="1.5">' +
      '<circle cx="150" cy="62" r="34"/>' +
      '<path d="M118 100 Q150 92 182 100 L196 210 Q150 224 104 210 Z"/>' +
      '<path d="M104 116 L74 200 L84 206 L112 130 Z"/>' +
      '<path d="M196 116 L226 200 L216 206 L188 130 Z"/>' +
      '<path d="M132 214 L126 300 L142 300 L148 220 Z"/>' +
      '<path d="M168 214 L174 300 L158 300 L152 220 Z"/>' +
      '<path d="M120 300 L150 300 L150 316 L116 316 Z"/>' +
      '<path d="M180 300 L150 300 L150 316 L184 316 Z"/>' +
      '</g></svg>';
    doll.appendChild(sil);

    EQ_SLOTS.forEach(function (sl) {
      var slotId = sl[0], label = sl[1];
      var id = slotId === 'handR' ? s.weapon : slotId === 'body' ? s.armor : s.gear[slotId];
      var row = UI.el('div', 'eq ' + (EQ_POS[slotId] || '') + (id ? ' eq--filled' : ''));
      row.appendChild(UI.el('div', 'eq__sl', label));
      row.appendChild(UI.el('div', id ? 'eq__it' : 'eq__empty', id ? itemName(id) : 'пусто'));

      if (id && slotId !== 'handR' && slotId !== 'body') {
        var off = UI.el('button', 'btn btn--sm btn--ghost', 'Снять');
        off.type = 'button';
        off.addEventListener('click', function (e) {
          e.stopPropagation();
          if (L.addItem(s, s.gear[slotId])) delete s.gear[slotId];
          S.showInventory();
        });
        row.appendChild(off);
      }
      doll.appendChild(row);
    });

    return doll;
  }

  function buildBag(panel) {
    var s = st();
    var side = UI.el('div', 'inv__side');

    var head = UI.el('div', 'sec');
    head.appendChild(UI.el('span', '', 'Рюкзак'));
    head.appendChild(UI.el('span', '', s.bag.length + ' / ' + L.BAG_SLOTS));
    side.appendChild(head);

    var bag = UI.el('div', 'bag');
    for (var i = 0; i < L.BAG_SLOTS; i++) {
      var id = s.bag[i];
      var slot = UI.el('div', 'bag__slot' + (id ? ' bag__slot--filled' : ''));
      slot.style.setProperty('--i', i);

      if (id) {
        var it = D.ITEMS[id] || (D.WEAPONS[id] ? { kind: 'weapon', name: D.WEAPONS[id].name } : null);
        slot.appendChild(UI.el('div', 'bag__glyph', UI.glyphFor(it)));
        slot.appendChild(UI.el('div', 'bag__name', it ? it.name.slice(0, 14) : id));
      } else {
        slot.appendChild(UI.el('div', 'bag__glyph', '·'));
        slot.appendChild(UI.el('div', 'bag__name', ''));
      }
      bag.appendChild(slot);
    }
    side.appendChild(bag);

    var listTitle = UI.el('div', 'sec');
    listTitle.appendChild(UI.el('span', '', 'Предметы'));
    listTitle.appendChild(UI.el('span', '', String(s.bag.length)));
    side.appendChild(listTitle);

    var listEl = UI.el('div', 'list');
    listEl.style.overflow = 'auto';
    listEl.style.minHeight = '0';

    if (!s.bag.length) listEl.appendChild(UI.el('div', 'empty', 'рюкзак пуст'));

    s.bag.forEach(function (id, i) {
      var it = D.ITEMS[id] || (D.WEAPONS[id] ? { name: D.WEAPONS[id].name, desc: weaponStats(D.WEAPONS[id]), kind: 'weapon' } : null);
      if (!it) return;

      var row = UI.el('div', 'lrow');
      row.style.setProperty('--i', i);

      var glyph = UI.el('div', 'bag__glyph', UI.glyphFor(it));
      glyph.style.width = '20px';
      glyph.style.color = 'var(--amber)';
      row.appendChild(glyph);

      var main = UI.el('div', 'lrow__main');
      main.appendChild(UI.el('div', 'lrow__t', it.name));
      if (it.desc) main.appendChild(UI.el('div', 'lrow__s', it.desc));
      row.appendChild(main);

      var acts = UI.el('div', 'row');

      if (it.heal) {
        var b = UI.el('button', 'btn btn--sm');
        b.type = 'button';
        b.setAttribute('data-test', 'use' + i);
        b.appendChild(UI.el('span', '', 'Использовать'));
        b.addEventListener('click', function () {
          var r = L.useItem(st(), id);
          UI.toast(r.text);
          S.showInventory();
        });
        acts.appendChild(b);
      }

      var slotName = itemSlot(it);
      if (slotName) {
        var eqb = UI.el('button', 'btn btn--sm btn--primary');
        eqb.type = 'button';
        eqb.setAttribute('data-test', 'equip' + i);
        eqb.appendChild(UI.el('span', '', 'Надеть'));
        eqb.addEventListener('click', function () {
          if (equipInto(slotName, id)) S.showInventory();
        });
        acts.appendChild(eqb);
      }

      row.appendChild(acts);
      listEl.appendChild(row);
    });

    side.appendChild(listEl);
    return side;
  }

  /* ================= уровень ================= */

  S.showLevelUp = function () {
    var s = st();
    var p = UI.panel({ kicker: 'Развитие', title: 'Повышение уровня', wide: true, footRight: 'очков: ' + s.points });
    var box = UI.el('div', 'lvl');

    box.appendChild(UI.el('div', 'hint', 'очко тратится на атрибут, навык или перк. перки открываются по требованиям'));

    var attrs = UI.el('div', 'statgrid');
    Object.keys(D.ATTRS).forEach(function (a) {
      var b = UI.el('div', 'statbox');
      var v = UI.el('div', 'statbox__v', String(s.attrs[a]));
      b.appendChild(v);
      b.appendChild(UI.el('div', 'statbox__l', D.ATTRS[a].name));

      var btn = UI.el('button', 'btn btn--sm btn--primary', '+ очко');
      btn.type = 'button';
      btn.setAttribute('data-test', 'attr_' + a);
      btn.addEventListener('click', function () {
        if (L.spendPoint(st(), 'attr', a)) { UI.toast(D.ATTRS[a].name + ' → ' + st().attrs[a]); S.showLevelUp(); }
        else UI.toast('Не хватает очков');
      });
      b.appendChild(btn);
      attrs.appendChild(b);
    });
    box.appendChild(attrs);

    var secS = UI.el('div', 'sec');
    secS.appendChild(UI.el('span', '', 'Навыки'));
    box.appendChild(secS);

    var sg = UI.el('div', 'skills');
    Object.keys(D.SKILLS).forEach(function (k) {
      var row = UI.el('div', 'skill');
      var nm = UI.el('span', 'skill__name', D.SKILLS[k].name + ' ');
      var em = UI.el('em', '', D.ATTRS[D.SKILLS[k].attr].short);
      nm.appendChild(em);
      row.appendChild(nm);
      row.appendChild(UI.el('span', 'skill__val', String(s.skills[k])));

      var b = UI.el('button', 'btn btn--sm', '+');
      b.type = 'button';
      b.setAttribute('data-test', 'skill_' + k);
      b.addEventListener('click', function () {
        if (L.spendPoint(st(), 'skill', k)) { UI.toast(D.SKILLS[k].name + ' → ' + st().skills[k]); S.showLevelUp(); }
        else UI.toast('Не хватает очков или предел');
      });
      row.appendChild(b);
      sg.appendChild(row);
    });
    box.appendChild(sg);

    var secP = UI.el('div', 'sec');
    secP.appendChild(UI.el('span', '', 'Перки'));
    box.appendChild(secP);

    var listEl = UI.el('div', 'list');
    Object.keys(D.PERKS).forEach(function (id, i) {
      var has = s.perks.indexOf(id) >= 0;
      var avail = L.perkAvailable(s, id);
      var row = UI.el('div', 'lrow' + (has ? ' lrow--done' : ''));
      row.style.setProperty('--i', i);

      var main = UI.el('div', 'lrow__main');
      main.appendChild(UI.el('div', 'lrow__t', D.PERKS[id].name));
      main.appendChild(UI.el('div', 'lrow__s', D.PERKS[id].desc));
      row.appendChild(main);

      var b = UI.el('button', 'btn btn--sm' + (avail && !has ? ' btn--primary' : ''), has ? 'взят' : avail ? 'Взять' : 'нет условий');
      b.type = 'button';
      b.disabled = !avail || has;
      b.setAttribute('data-test', 'perk_' + id);
      b.addEventListener('click', function () { if (L.spendPoint(st(), 'perk', id)) S.showLevelUp(); });
      row.appendChild(b);
      listEl.appendChild(row);
    });
    box.appendChild(listEl);

    p._body.appendChild(box);
    UI.openPanel(p);
  };

  /* ================= журнал ================= */

  S.showJournal = function () {
    var s = st();
    var j = L.journal(s);

    function locName(id) {
      var l = D.LOCATIONS.filter(function (x) { return x.id === id; })[0];
      return l ? l.name : '—';
    }
    function lineName(line) {
      return line === 'personal' ? 'личное' : line === 'faction' ? 'фракция' : 'линия';
    }

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
        r.addEventListener('click', fn);
      }
      return r;
    }

    function openQuest(id) {
      UI.closePanel();
      S.showQuest(id);
    }

    function render(tab) {
      UI.clear(listEl);
      var count = 0;

      if (tab === 'active') {
        j.active.forEach(function (q, i) {
          var num = q.ready ? q.total + 1 : Math.min(q.index + 1, q.total + 1);
          var sub = q.ready
            ? 'все этапы пройдены · выбери исход'
            : 'этап ' + num + '/' + q.total + ' · ' + q.stage;
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
      } else {
        j.facts.forEach(function (f, i) {
          var fact = D.FACTS[f] || { name: f, desc: '' };
          listEl.appendChild(row(fact.name, fact.desc, '', i, null, 'улика'));
          count++;
        });
        if (!count) listEl.appendChild(UI.el('div', 'empty', 'улик пока нет'));
      }
    }

    [['active', 'Активные', j.active.length], ['done', 'Завершённые', j.done.length],
     ['failed', 'Проваленные', j.failed.length],
     ['where', 'Где искать', j.where.filter(function (q) { return q.available; }).length],
     ['facts', 'Улики', j.facts.length]].forEach(function (t, i) {
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
    var s = st();
    var m = D.MERCHANTS[mid];

    UI.setScene('bg_arrival.png');
    UI.setHudVisible(true);
    UI.updateHud(s, L, D);
    UI.setWhere('Торговля · ' + m.name);

    ST.screen = 'trade';
    UI.clear(UI.$('app'));
    var root = UI.el('div', 'screen');
    UI.$('app').appendChild(root);

    root.appendChild(S.pageHead('Торговля', m.name, m.greet,
      [S.btn('← Назад', 'back', function () { S.showLocation(ST.loc); }, 'btn--ghost')]));

    var wrap = UI.el('div', 'trade');

    // покупка
    var buyCol = UI.el('div', 'trade__col');
    var buyHead = UI.el('div', 'trade__head');
    buyHead.appendChild(UI.el('div', 'sec', 'Продаёт'));
    buyHead.appendChild(UI.el('span', 'pill pill--amber', s.credits + ' кр.'));
    buyCol.appendChild(buyHead);

    var buyList = UI.el('div', 'trade__list');
    m.stock.concat(m.weapons).forEach(function (id, i) {
      var isW = m.weapons.indexOf(id) >= 0;
      var base = isW ? D.WEAPONS[id].cost : D.ITEMS[id].cost;
      var price = L.price(s, base, mid);

      var r = UI.el('div', 'lrow');
      r.style.setProperty('--i', i);
      var main = UI.el('div', 'lrow__main');
      main.appendChild(UI.el('div', 'lrow__t', isW ? D.WEAPONS[id].name : D.ITEMS[id].name));
      main.appendChild(UI.el('div', 'lrow__s', isW ? weaponStats(D.WEAPONS[id]) : D.ITEMS[id].desc));
      r.appendChild(main);
      r.appendChild(UI.el('span', 'pill', price + ' кр.'));

      var b = UI.el('button', 'btn btn--sm btn--primary', 'Купить');
      b.type = 'button';
      b.setAttribute('data-test', 'buy' + i);
      b.addEventListener('click', function () {
        var res = L.buy(st(), mid, isW ? 'weapon' : 'item', id);
        UI.toast(res.text);
        if (res.ok) S.showTrade(mid);
      });
      r.appendChild(b);
      buyList.appendChild(r);
    });
    buyCol.appendChild(buyList);
    wrap.appendChild(buyCol);

    // продажа
    var sellCol = UI.el('div', 'trade__col');
    var sellHead = UI.el('div', 'trade__head');
    sellHead.appendChild(UI.el('div', 'sec', 'Скупает'));
    sellHead.appendChild(UI.el('span', 'pill', s.bag.length + ' предм.'));
    sellCol.appendChild(sellHead);

    var sellList = UI.el('div', 'trade__list');
    if (!s.bag.length) sellList.appendChild(UI.el('div', 'empty', 'рюкзак пуст'));
    s.bag.forEach(function (id, i) {
      var it = D.ITEMS[id];
      if (!it) return;
      var r = UI.el('div', 'lrow');
      r.style.setProperty('--i', i);
      var main = UI.el('div', 'lrow__main');
      main.appendChild(UI.el('div', 'lrow__t', it.name));
      main.appendChild(UI.el('div', 'lrow__s', it.desc || ''));
      r.appendChild(main);
      r.appendChild(UI.el('span', 'pill', Math.round(it.cost * 0.5) + ' кр.'));

      var b = UI.el('button', 'btn btn--sm', 'Продать');
      b.type = 'button';
      b.setAttribute('data-test', 'sell' + i);
      b.addEventListener('click', function () {
        var res = L.sell(st(), id);
        UI.toast(res.text);
        S.showTrade(mid);
      });
      r.appendChild(b);
      sellList.appendChild(r);
    });
    sellCol.appendChild(sellList);
    wrap.appendChild(sellCol);

    root.appendChild(wrap);
  };
})(window);

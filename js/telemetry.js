/* =========================================================
AU MICROSCOPII — телеметрия. Наблюдатель, не бизнес-логика.
Хранение: IndexedDB (кольцевой буфер) + экспорт в JSON.
Отправка наружу выключена: Tel.config({ endpoint: 'https://…' }).
IP не собирается — статический хостинг его не отдаёт.
========================================================= */
(function (G) {
'use strict';
var MAX_EVENTS = 6000;
var DB_NAME = 'aumic-tel', DB_VER = 1;
var enabled = true, endpoint = null, flushEvery = 5000;
var queue = [], session = null, env = null, timer = null, dbp = null;
var DEV = /(#selftest|#dev:)/.test(location.hash || '');

function now() { return Date.now(); }
function uid() { return Math.random().toString(36).slice(2, 10) + now().toString(36); }

/* ---------- окружение ---------- */
function collectEnv() {
  var n = navigator, s = screen, d = document;
  var conn = n.connection || n.mozConnection || n.webkitConnection || {};
  return {
    ua: n.userAgent,
    platform: n.platform || null,
    langs: (n.languages || [n.language]).join(','),
    tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || null,
    cores: n.hardwareConcurrency || null,
    memory: n.deviceMemory || null,
    screen: s.width + 'x' + s.height,
    viewport: innerWidth + 'x' + innerHeight,
    dpr: devicePixelRatio || 1,
    touch: ('ontouchstart' in window) || (n.maxTouchPoints > 0),
    reducedMotion: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
    net: conn.effectiveType || null,
    downlink: conn.downlink || null,
    rtt: conn.rtt || null,
    referrer: d.referrer || null,
    url: location.pathname + location.search,
    build: (G.D && G.D.VERSION) || null,
    quests: G.D && G.D.QUESTS ? Object.keys(G.D.QUESTS).length : null,
    storage: (function () { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; } })()
  };
}

/* ---------- IndexedDB ---------- */
function db() {
  if (dbp) return dbp;
  dbp = new Promise(function (res, rej) {
    if (!G.indexedDB) return rej(new Error('no idb'));
    var r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = function () {
      var d = r.result;
      if (!d.objectStoreNames.contains('events')) d.createObjectStore('events', { keyPath: 'k', autoIncrement: true });
      if (!d.objectStoreNames.contains('sessions')) d.createObjectStore('sessions', { keyPath: 'id' });
    };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
  return dbp;
}
function tx(store, mode, fn) {
  return db().then(function (d) {
    return new Promise(function (res, rej) {
      var t = d.transaction(store, mode);
      var out = fn(t.objectStore(store));
      t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
      t.onerror = function () { rej(t.error); };
      t.onabort = function () { rej(t.error); };
    });
  });
}
function prune() {
  return tx('events', 'readwrite', function (st) {
    var c = st.count();
    c.onsuccess = function () {
      var over = c.result - MAX_EVENTS;
      if (over <= 0) return;
      var cur = st.openCursor(), removed = 0;
      cur.onsuccess = function (e) {
        var row = e.target.result;
        if (!row || removed >= over) return;
        st.delete(row.primaryKey); removed++;
        row.continue();
      };
    };
  }).catch(function () {});
}
function readAll(store) {
  return tx(store, 'readonly', function (st) { return st.getAll(); }).catch(function () { return []; });
}

/* ---------- запись ---------- */
function push(name, data) {
  if (!enabled || DEV) return;
  var s = G.AU && G.AU.state && G.AU.state.S;
  queue.push({
    t: now(),
    sid: session ? session.id : null,
    n: name,
    scr: (G.AU && G.AU.state && G.AU.state.screen) || null,
    hero: s ? s.hero : null,
    lvl: s ? s.level : null,
    d: data || null
  });
  if (queue.length >= 40) flush();
}
function flush() {
  if (!queue.length) return Promise.resolve(0);
  var batch = queue.splice(0, queue.length);
  var p = tx('events', 'readwrite', function (st) {
    batch.forEach(function (e) { st.add(e); });
  }).then(prune).catch(function () {});
  if (endpoint) send(batch);
  return p;
}
function send(batch) {
  try {
    var body = JSON.stringify({ session: session, env: env, events: batch });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(endpoint, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(function () {});
    }
  } catch (e) {}
}
function closeSession(reason) {
  if (!session) return;
  var s = G.AU && G.AU.state && G.AU.state.S;
  session.end = now();
  session.ms = session.end - session.start;
  session.reason = reason;
  session.lastScreen = (G.AU && G.AU.state && G.AU.state.screen) || null;
  if (s) {
    session.hero = s.hero;
    session.level = s.level;
    session.questsDone = G.L ? G.L.questsDone(s) : null;
    session.checks = s.checks;
    session.passed = s.passed;
    session.credits = s.credits;
  }
  push('session_end', { ms: session.ms, reason: reason });
  flush().then(function () {
    tx('sessions', 'readwrite', function (st) { st.put(session); }).catch(function () {});
  });
}

/* ---------- ресурсы и FPS ---------- */
function perfSnapshot() {
  try {
    var res = performance.getEntriesByType('resource') || [];
    var total = 0, byType = {}, slow = [];
    res.forEach(function (r) {
      var size = r.transferSize || r.encodedBodySize || 0;
      total += size;
      var ext = (r.name.split('?')[0].split('.').pop() || 'other').toLowerCase().slice(0, 5);
      byType[ext] = (byType[ext] || 0) + size;
      slow.push({ url: r.name.split('/').pop().slice(0, 60), ms: Math.round(r.duration), kb: Math.round(size / 1024) });
    });
    slow.sort(function (a, b) { return b.ms - a.ms; });
    var nav = performance.getEntriesByType('navigation')[0] || {};
    push('perf_resources', {
      count: res.length, totalKb: Math.round(total / 1024), byTypeKb: Object.keys(byType).reduce(function (o, k) {
        o[k] = Math.round(byType[k] / 1024); return o;
      }, {}),
      slowest: slow.slice(0, 8),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav.loadEventEnd || 0),
      ttfb: Math.round(nav.responseStart || 0)
    });
  } catch (e) {}
}
function fpsSample(ms) {
  var frames = 0, worst = 0, last = performance.now(), t0 = last;
  function step(t) {
    var dt = t - last; last = t; frames++;
    if (dt > worst) worst = dt;
    if (t - t0 < ms) requestAnimationFrame(step);
    else push('perf_fps', { avg: Math.round(frames / ((t - t0) / 1000)), worstFrameMs: Math.round(worst) });
  }
  requestAnimationFrame(step);
}

/* ---------- инструментация публичных API ---------- */
function wrap(obj, key, after) {
  if (!obj || typeof obj[key] !== 'function') return;
  var orig = obj[key];
  obj[key] = function () {
    var args = arguments, r, err = null;
    try { r = orig.apply(this, args); } catch (e) { err = e; }
    try { after(args, r, err); } catch (e) {}
    if (err) throw err;
    return r;
  };
}
function install() {
  var AU = G.AU, L = G.L, UI = G.UI, S = G.Screens, D = G.D;
  if (!AU || !L || !UI) return;

  wrap(UI, 'mount', function (a) { push('screen', { to: a[0] }); });
  wrap(L, 'startQuest', function (a, r) { if (r) push('quest_start', { id: a[1] }); });
  wrap(L, 'advanceQuest', function (a, r) { if (r) push('quest_stage', { id: a[1], stage: a[0].quests[a[1]].stage }); });
  wrap(L, 'failQuest', function (a, r) { if (r) push('quest_fail', { id: a[1] }); });
  wrap(L, 'completeQuest', function (a, r) {
    push('quest_complete', { id: a[1], branch: a[2], ok: !!r, thread: L.thread(a[0]) });
  });
  wrap(L, 'check', function (a, r) {
    push('check', { skill: a[1], dc: a[2], bonus: r.bonus, roll: r.roll, ok: r.success, crit: r.crit, fumble: r.fumble });
  });
  wrap(L, 'gainXp', function (a) { push('xp', { amount: a[1], level: a[0].level, points: a[0].points }); });
  wrap(L, 'spendPoint', function (a, r) { push('spend_point', { kind: a[1], id: a[2], ok: !!r }); });
  wrap(L, 'buy', function (a, r) { push('buy', { merchant: a[1], id: a[3], ok: !!(r && r.ok) }); });
  wrap(L, 'sell', function (a, r) { push('sell', { id: a[1], ok: !!(r && r.ok) }); });
  wrap(L, 'useItem', function (a, r) { push('use_item', { id: a[1], ok: !!(r && r.ok !== false) }); });
  wrap(L, 'equipWeapon', function (a, r) { push('equip', { slot: 'weapon', id: a[1], ok: !!r }); });
  wrap(L, 'equipArmor', function (a, r) { push('equip', { slot: 'armor', id: a[1], ok: !!r }); });
  wrap(L, 'save', function (a, r) { push('save', { slot: a[1] || 'auto', ok: !!r }); });
  wrap(L, 'load', function (a, r) { push('load', { slot: a[0] || 'auto', ok: !!r }); });
  wrap(L, 'combatStart', function (a, r) {
    push('combat_start', { enemies: a[1], hp: a[0].hp, weapon: a[0].weapon, round: r.round });
  });
  wrap(L, 'combatResult', function (a, r) {
    push('combat_end', { win: !!(r && r.win), lost: r && r.lost, rounds: a[1].round, hp: a[0].hp });
  });
  wrap(L, 'attack', function (a, r) {
    push('attack', { side: a[2].side, target: a[3].name, hit: !!(r && r.hit), dmg: r && r.dmg, cover: r && r.cover });
  });
  wrap(AU, 'setSetting', function (a) { push('setting', { key: a[0], value: a[1] }); });
  if (S) {
    wrap(S, 'showCodex', function (a) { push('codex_open', { entry: a[0] || null }); });
    wrap(S, 'showTrade', function (a) { push('trade_open', { merchant: a[0] }); });
    wrap(S, 'showEnding', function () {
      var s = G.AU.state.S;
      push('ending', { hero: s.hero, thread: L.thread(s), quests: L.questsDone(s), level: s.level });
    });
  }
  if (G.Codex) {
    wrap(G.Codex, 'open', function (a) { push('codex_entry', { id: a[0] }); });
  }

  window.addEventListener('error', function (e) {
    push('error', { msg: String(e.message).slice(0, 300), src: (e.filename || '').split('/').pop(), line: e.lineno });
  });
  window.addEventListener('unhandledrejection', function (e) {
    push('promise_error', { msg: String((e.reason && e.reason.message) || e.reason).slice(0, 300) });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { push('hide', {}); flush(); }
    else push('show', {});
  });
  window.addEventListener('pagehide', function () { closeSession('pagehide'); });

  /* клики по игровым контролам — без текста, только роль */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var btn = t && t.closest && t.closest('button, [role="button"], .entry, .qrail, .cx-row, .hero, .room');
    if (!btn) return;
    push('click', {
      test: btn.getAttribute && btn.getAttribute('data-test'),
      cls: (btn.className || '').toString().slice(0, 60),
      label: (btn.textContent || '').trim().slice(0, 40)
    });
  }, true);

  setTimeout(perfSnapshot, 3500);
  setTimeout(function () { fpsSample(3000); }, 4000);
}

/* ---------- публичное API ---------- */
var Tel = {
  config: function (o) {
    o = o || {};
    if ('endpoint' in o) endpoint = o.endpoint;
    if ('flushEvery' in o) flushEvery = o.flushEvery;
    return Tel;
  },
  setEnabled: function (on) {
    enabled = !!on && !DEV;
    if (!enabled) { queue.length = 0; }
    return enabled;
  },
  enabled: function () { return enabled && !DEV; },
  event: push,
  flush: flush,
  clear: function () {
    queue.length = 0;
    return Promise.all([
      tx('events', 'readwrite', function (st) { st.clear(); }),
      tx('sessions', 'readwrite', function (st) { st.clear(); })
    ]).catch(function () {});
  },
  exportJSON: function () {
    return flush().then(function () {
      return Promise.all([readAll('events'), readAll('sessions')]);
    }).then(function (r) {
      var payload = { exported: new Date().toISOString(), env: env, events: r[0], sessions: r[1] };
      var blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'au-mic-telemetry-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      return r[0].length;
    });
  },
  summary: function () {
    return flush().then(function () {
      return Promise.all([readAll('events'), readAll('sessions')]);
    }).then(function (r) {
      var ev = r[0], ss = r[1];
      var byName = {}, screens = {}, funnel = {}, errors = [], checks = { total: 0, ok: 0, crit: 0 };
      ev.forEach(function (e) {
        byName[e.n] = (byName[e.n] || 0) + 1;
        if (e.n === 'screen' && e.d) screens[e.d.to] = (screens[e.d.to] || 0) + 1;
        if (e.n === 'quest_complete' && e.d) {
          funnel[e.d.id] = funnel[e.d.id] || {};
          funnel[e.d.id][e.d.branch] = (funnel[e.d.id][e.d.branch] || 0) + 1;
        }
        if (e.n === 'check' && e.d) {
          checks.total++; if (e.d.ok) checks.ok++; if (e.d.crit) checks.crit++;
        }
        if (e.n === 'error' || e.n === 'promise_error') errors.push(e.d);
      });
      var last = ss.slice(-5).map(function (s) {
        return { id: s.id, hero: s.hero, min: Math.round((s.ms || 0) / 60000), level: s.level, done: s.questsDone, last: s.lastScreen };
      });
      return {
        событий: ev.length, сессий: ss.length,
        включено: Tel.enabled(), отправка: endpoint || 'выключена',
        поТипам: byName, экраны: screens, проверки: checks,
        воронкаДел: funnel, последниеСессии: last,
        ошибки: errors.slice(-10), окружение: env
      };
    });
  }
};
G.Tel = Tel;

function boot() {
  env = collectEnv();
  session = { id: uid(), start: now(), env: env, hero: null };
  if (DEV) { enabled = false; return; }
  tx('sessions', 'readwrite', function (st) { st.put(session); }).catch(function () {});
  push('session_start', { hash: location.hash || null });
  install();
  timer = setInterval(flush, flushEvery);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})(window);
/*
AU MICROSCOPII — диалоги. Версия 3.1.
Файл самодостаточен: если он загружен раньше data.js или не подключён вовсе,
данные не теряются — их подхватит main.js (G.AU_DIALOGUES).
Правило: каждый этап каждого дела двигается здесь; next:'end' — только явное «Уйти».
*/
(function (G) {
'use strict';
var DIALOGUES = {

/* ===== ЖИЛОЙ СЕКТОР ===== */

dlg_zhil: {
  speaker: 'МИРА', portrait: 'mira', title: 'Жилой сектор',
  intro: [
    'Женщина у стойки с накладными. Усталые глаза, сжатые кулаки.',
    '— Записку нашёл? Хорошо. Значит, ты не из тех, кто сначала докладывает.',
    '— Двести чипов пропали из накладной. Если я подам рапорт — повесят на меня.'
  ],
  start: [
    { req: { quest: 'q_mira', stage: 1 },
      lines: ['— Лог аудита в админ-блоке. У Ханны.', '— Только не подведи.'] },
    { req: { quest: 'q_mira', stage: 2 },
      lines: ['— Ты нашёл лог. Отдай его мне.'] },
    { req: { quest: 'q_mira', state: 'done' },
      lines: ['— Спасибо. Я этого не забуду.'] },
    { req: { quest: 'q_water', state: 'active' },
      lines: ['— Воды нет уже третий день.', '— Разберись, будь добр.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  companions: { mira: '— Я сама видела, как её выносили.' },
  reactions: [
    { req: { questBranch: { id: 'q_water', branch: 'A' } }, lines: ['— Вода есть. Спасибо.'] },
    { req: { questBranch: { id: 'q_water', branch: 'B' } }, lines: ['— Вода есть, но пахнет Ковчегом.'] },
    { req: { questBranch: { id: 'q_water', branch: 'C' } }, lines: ['— Вода есть, но жетоны у тебя.'] }
  ],
  options: [
    { text: '«Что за чипы?»',
      hide: true, req: { quest: 'q_mira', state: 'available' },
      effects: { startQuest: 'q_mira', advanceQuest: 'q_mira' },
      reply: ['— Двести чипов из накладной.',
              '— Если я подам рапорт — повесят на меня. Мне нужен лог аудита из админ-блока.'] },
    { text: '«Кто ещё об этом знает?»',
      hide: true, once: true, req: { quest: 'q_mira', state: 'active' },
      effects: { fact: 'f_mira_ok', rep: { drevnie: 1 } },
      reply: ['— Ханна знает. И уборщик Бо — он видел, как выносили.',
              '— Только Бо молчит. Всегда молчит.'] },
    { text: '[Лог аудита] Вернуться к Мире',
      hide: true, req: { quest: 'q_mira', stage: 2 },
      next: 'dlg_zhil_log' },
    { text: '«Я посмотрю накладные».',
      hide: true, once: true, req: { quest: 'q_mira', state: 'active' },
      effects: { rep: { drevnie: 1 }, xp: 10 },
      reply: ['— Посмотри. Только осторожно. Ханна не любит, когда суют нос.'] },
    { text: '«Что с водой?»',
      hide: true, req: { quest: 'q_water', state: 'available' },
      effects: { startQuest: 'q_water', advanceQuest: 'q_water' },
      reply: ['— Верхние уровни сидят без воды. GrailTech говорит — клапан.',
              '— Но клапан настроен на нижние. Разберись.'] },
    { text: '[Взлом 12] Открыть клапан самому',
      hide: true, req: { quest: 'q_water', stage: 1 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Клапан открыт. Вода идёт в жилой сектор.'],
                 effects: { advanceQuest: 'q_water', fact: 'f_water_cause', xp: 20 } },
      fail: { lines: ['Клапан заедает. Придётся звать слесаря.'], effects: { hp: -2 } } },
    { text: '[Логика 12] Понять, кто настроил клапан',
      hide: true, req: { quest: 'q_water', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['GrailTech настроил клапан на нижние уровни. Верхние — в очереди.'],
                 effects: { advanceQuest: 'q_water', fact: 'f_water_cause', xp: 20 } },
      fail: { lines: ['Ничего не понятно. Мира ждёт.'], effects: { hp: -2 } } },
    { text: '«Это не моё дело».', next: 'end' }
  ]
},

dlg_zhil_log: {
  speaker: 'МИРА', portrait: 'mira', title: 'Жилой сектор',
  intro: [
    'Мира берёт лог. Пробегает глазами. Хмурится.',
    '— Восемь фамилий и девять прочерков.',
    '— Значит, недостачу оформили до смены. Спасибо.'
  ],
  start: [
    { req: { quest: 'q_mira', state: 'done' }, lines: ['— Ты уже всё сделал. Иди.'] },
    { req: {}, lines: ['— Спасибо.'] }
  ],
  options: [
    { text: 'Закрыть дело',
      effects: { advanceQuest: 'q_mira', openQuest: 'q_mira', xp: 20 },
      reply: ['— Я закрою недостачу. Иди.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== АДМИН-БЛОК ===== */

dlg_admin: {
  speaker: 'ХАННА', portrait: 'hanna', title: 'Админ-блок',
  intro: [
    'Женщина в строгом костюме за столом. Три монитора, ни одного лишнего предмета.',
    '— Вы провели интересный день. Я прочитала две версии. Обе мне не нравятся.',
    '— Мне нужно одно имя. После этого вы получите допуск.'
  ],
  start: [
    { req: { quest: 'q_sign', stage: 1 }, lines: ['— Вы всё ещё здесь. Значит, ищете что-то.'] },
    { req: { quest: 'q_sign', stage: 2 }, lines: ['— У вас есть запись. Что вы хотите?'] },
    { req: { quest: 'q_sign', stage: 3 }, lines: ['— Вы готовы назвать имя.'] },
    { req: { questBranch: { id: 'q_mira', branch: 'A' } },
      lines: ['— Вы отдали лог Мире. Я помню.', '— Что вам нужно?'] },
    { req: { questBranch: { id: 'q_mira', branch: 'B' } }, lines: ['— Вы продали лог мне. Умно.'] },
    { req: { questBranch: { id: 'q_mira', branch: 'C' } }, lines: ['— Вы уничтожили лог. Никто ничего не узнает.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { questFailed: 'q_hands_sabotage' }, lines: ['— Вы сдали Шторм. Я это учту.'] }
  ],
  companions: { storm: '— Она уже всё решила. Просто играет с тобой.' },
  options: [
    /* q_grailtech_purge */
    { text: '«У меня заряд Шторм. Сдаю её».',
      hide: true, once: true,
      req: { quest: 'q_hands_sabotage', stageMin: 1, stageMax: 2 },
      failQuest: 'q_hands_sabotage',
      effects: { fact: 'f_storm_betrayed', rep: { grailtech: 3, ruki: -5 }, credits: 150 },
      reply: ['— Заряд Рук Праха. Вы принесли мне это сами.',
              '— Шторм больше не побеспокоит станцию. Вот ваша плата.'] },
    { text: '«Я сдал Шторм. Что дальше?»',
      hide: true, req: { quest: 'q_grailtech_purge', state: 'available' },
      effects: { startQuest: 'q_grailtech_purge', advanceQuest: 'q_grailtech_purge' },
      reply: ['— Техуровень нужно зачистить. Найдите доказательства против Шторм.',
              '— Подойдёт руда с горизонтов, записи Рико или ваш собственный аудит.'] },
    { text: '[Логика 12] Найти доказательства против Шторм',
      hide: true, req: { quest: 'q_grailtech_purge', stage: 1, facts: ['f_ore_done'] },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Три уровня, одна дыра. Шторм выносила чипы через техуровень.'],
                 effects: { advanceQuest: 'q_grailtech_purge', fact: 'f_purge_done', xp: 30 } },
      fail: { lines: ['Один лог не сходится.'], effects: { rep: { grailtech: -1 } } } },
    { text: '[Убеждение 14] Собрать доказательства через Рико',
      hide: true, req: { quest: 'q_grailtech_purge', stage: 1, facts: ['f_rico'] },
      check: { skill: 'ubezhdenie', dc: 14 },
      success: { lines: ['Рико отдаёт записи.'],
                 effects: { advanceQuest: 'q_grailtech_purge', fact: 'f_purge_done', xp: 30 } },
      fail: { lines: ['Рико уходит в темноту.'], effects: { hp: -2 } } },
    { text: '[Аудит GrailTech] Свести бумаги против Шторм',
      hide: true, req: { quest: 'q_grailtech_purge', stage: 1, facts: ['f_gt_audit'] },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Три лога из аудита ложатся на техуровень. Почерк Шторм.'],
                 effects: { advanceQuest: 'q_grailtech_purge', fact: 'f_purge_done', xp: 30 } },
      fail: { lines: ['Цифры не сходятся в одну фамилию.'], effects: { rep: { grailtech: -1 } } } },
    { text: '«Доказательства у меня».',
      hide: true, req: { quest: 'q_grailtech_purge', stage: 2 },
      effects: { advanceQuest: 'q_grailtech_purge', xp: 20 },
      reply: ['— Хорошо. Зачистка начнётся сегодня.'] },

    /* q_mira */
    { text: '[Логика 12] Найти лог аудита',
      hide: true, req: { quest: 'q_mira', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Полка с архивом. Папки лежат не по датам — кто-то уже рылся.',
                         'Лог аудита у тебя в руках.'],
                 effects: { advanceQuest: 'q_mira', fact: 'f_log', item: 'log', xp: 40 } },
      fail: { lines: ['Ханна захлопывает архив перед твоим носом.'], effects: { rep: { grailtech: 1 } } } },
    { text: '[Взлом 12] Вскрыть архив аудита',
      hide: true, req: { quest: 'q_mira', stage: 1 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Терминал мигает, но отдаёт лог.'],
                 effects: { advanceQuest: 'q_mira', fact: 'f_log', item: 'log', xp: 40 } },
      fail: { lines: ['Терминал требует повторный чип.'], effects: { rep: { grailtech: 1 } } } },

    /* q_sign */
    { text: '«Мне нужен доступ в архив».',
      hide: true, req: { quest: 'q_sign', state: 'available' },
      effects: { startQuest: 'q_sign', advanceQuest: 'q_sign', rep: { grailtech: 1 } },
      reply: ['— Доступ открыт. Но сначала докажите, что вы не пустышка.',
              '— Подпись на приказе. Найдите её.'] },
    { text: '«Кто видел, как выносили чипы?»',
      hide: true, once: true, req: { quest: 'q_sign', stage: 1 },
      reply: ['— Уборщик. Бо. Метёт этот коридор двадцать лет.',
              '— Он ничего не помнит. Но если что-то видел — это всё, что у вас есть.'] },
    { text: '[Взлом 14] Вскрыть архив сам',
      hide: true, req: { quest: 'q_sign', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Ты вскрыл архив сам. Охрана не заметила.'],
                 effects: { advanceQuest: 'q_sign', xp: 40 } },
      fail: { lines: ['Охрана засекла. Придётся драться.'],
              effects: { combat: 'guard', combatWinQuest: 'q_sign' } } },
    { text: '[Запись Бо] Сверить с архивом',
      hide: true, req: { quest: 'q_sign', stage: 2, facts: ['f_bo_tape'] },
      effects: { advanceQuest: 'q_sign', fact: 'f_sign', item: 'medcard', xp: 30 },
      reply: ['— Приказ об изоляции подписан за день до неё.', '— Это уже не ошибка. Это умысел.'] },
    { text: '[Логика 14] Сверить вручную',
      hide: true, req: { quest: 'q_sign', stage: 2 },
      check: { skill: 'logika', dc: 14 },
      success: { lines: ['Приказ об изоляции подписан за день до неё.'],
                 effects: { advanceQuest: 'q_sign', fact: 'f_sign', item: 'medcard', xp: 40 } },
      fail: { lines: ['Ханна захлопывает архив.'], effects: { rep: { grailtech: 1 } } } },
    { text: '[Взлом 14] Сверить взломом',
      hide: true, req: { quest: 'q_sign', stage: 2 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Приказ подписан за день до изоляции.'],
                 effects: { advanceQuest: 'q_sign', fact: 'f_sign', item: 'medcard', xp: 40 } },
      fail: { lines: ['Терминал требует повторный чип.'], effects: { rep: { grailtech: -1 } } } },
    { text: '«Я готов назвать имя».',
      hide: true, req: { quest: 'q_sign', stage: 3 },
      effects: { advanceQuest: 'q_sign', xp: 20 },
      next: 'dlg_admin_name' },

    /* q_gt_audit */
    { text: '«Я возьму аудит».',
      hide: true, req: { quest: 'q_gt_audit', state: 'available' },
      effects: { startQuest: 'q_gt_audit', advanceQuest: 'q_gt_audit', rep: { grailtech: 1 } },
      reply: ['— Соберите три лога с трёх уровней.', '— Архив, серверная, шахты.'] },
    { text: '[Логика 12] Собрать три лога',
      hide: true, req: { quest: 'q_gt_audit', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Три уровня, одна дыра.'],
                 effects: { advanceQuest: 'q_gt_audit', fact: 'f_gt_audit', xp: 30 } },
      fail: { lines: ['Один лог не сходится.'], effects: { rep: { grailtech: -1 } } } },
    { text: '«Аудит у меня».',
      hide: true, req: { quest: 'q_gt_audit', stage: 2 },
      effects: { advanceQuest: 'q_gt_audit', xp: 20 },
      reply: ['— Приму. Свободны.'] },

    { text: 'Уйти', next: 'end' }
  ]
},

dlg_admin_bo_hint: {
  speaker: 'ХАННА', portrait: 'hanna', title: 'Админ-блок',
  intro: [
    '— Уборщик. Бо. Метёт этот коридор двадцать лет.',
    '— Он ничего не помнит. Но если что-то видел — это всё, что у вас есть.'
  ],
  start: [{ req: {}, lines: ['— Бо в коридоре.'] }],
  options: [{ text: 'Уйти', next: 'end' }]
},

dlg_admin_name: {
  speaker: 'ХАННА', portrait: 'hanna', title: 'Админ-блок',
  intro: [
    'Ханна закрывает папку и смотрит прямо.',
    '— Хорошо. Имя останется между нами.',
    '— Пока оно нам обоим выгодно.'
  ],
  start: [{ req: {}, lines: ['— Мы закончили.'] }],
  options: [{ text: 'Уйти', next: 'end' }]
},

dlg_admin_beaten: {
  speaker: 'ХАННА', portrait: 'hanna', title: 'Админ-блок',
  intro: [
    'Ханна откидывается в кресле. Пальцы дрожат.',
    '— Подпись. Чужая подпись на приказе об изоляции.',
    '— Уйдите. Пока я не вызвала охрану.'
  ],
  start: [{ req: {}, lines: ['— Уйдите.'] }],
  options: [{ text: 'Уйти', next: 'end' }]
},

dlg_admin_betray: {
  speaker: 'ХАННА', portrait: 'hanna', title: 'Админ-блок',
  intro: [
    'Ханна берёт заряд двумя пальцами, будто он живой.',
    '— Заряд Рук Праха. Вы принесли мне это сами.',
    '— Шторм больше не побеспокоит станцию. Вот ваша плата.'
  ],
  start: [{ req: {}, lines: ['— Что-то ещё?'] }],
  options: [{ text: 'Уйти', next: 'end' }]
},

dlg_bo: {
  speaker: 'БО', portrait: 'bo', title: 'Админ-блок · коридор',
  intro: [
    'Молчаливый уборщик лет пятидесяти. Метёт один и тот же коридор.',
    '— Не сейчас. Я мету.',
    '— Если по делу — говорите. Если нет — не мешайте.'
  ],
  start: [
    { req: { questFailed: 'q_sign' }, lines: ['— Бо молча кивает и уходит.'] },
    { req: { quest: 'q_sign', state: 'done' }, lines: ['— Спасибо, что не сдали.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { fact: 'f_bo_afraid' }, lines: ['— Ханна знает всё. Просто делает вид, что не замечает.'] }
  ],
  options: [
    { text: '«Мне нужна запись. Ту, где видно, кто выносил чипы».',
      hide: true, req: { quest: 'q_sign', stage: 1 },
      effects: { advanceQuest: 'q_sign', fact: 'f_bo_tape', xp: 20 },
      reply: ['— Держите. Только Ханне не показывайте, что это от меня.'] },
    { text: '«Мира говорила о тебе. Она в беде».',
      hide: true, req: { quest: 'q_sign', stage: 1, questBranch: { id: 'q_mira', branch: 'A' } },
      effects: { advanceQuest: 'q_sign', fact: 'f_bo_tape', rep: { drevnie: 1 }, xp: 30 },
      reply: ['— Мира хорошая. Держите запись.'] },
    { text: '«Вода есть. Это моя работа».',
      hide: true, req: { quest: 'q_sign', stage: 1, questBranch: { id: 'q_water', branch: 'A' } },
      effects: { advanceQuest: 'q_sign', fact: 'f_bo_tape', rep: { drevnie: 1 }, xp: 30 },
      reply: ['— Вода есть. Спасибо. Держите запись.'] },
    { text: '«Ты видел, что делают с ревизорами?»',
      hide: true, req: { quest: 'q_med', stage: 1 },
      effects: { advanceQuest: 'q_med', fact: 'f_uni', xp: 20 },
      reply: ['— Ревизоры теряют протокол. Я видел, как одного увели в серверную.'] },
    { text: '«Ханна знает, что ты видел?»',
      hide: true, once: true, req: { quest: 'q_sign', state: 'active' },
      effects: { fact: 'f_bo_afraid' },
      reply: ['— Ханна знает всё. Просто делает вид, что не замечает.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

dlg_talbot: {
  speaker: 'ТЭЛБОТ', portrait: 'talbot', title: 'Админ-блок',
  intro: [
    'Мужчина в дорогом костюме, с идеальной осанкой. Улыбается так, будто уже всё решил.',
    '— Вы тот, кто видел подпись. Значит, вы понимаете цену бумаги.',
    '— Я предлагаю не просто бумагу. Я предлагаю должность.'
  ],
  start: [
    { req: { quest: 'q_talbot_deal', state: 'done' }, lines: ['— Мы всё обсудили.'] },
    { req: { quest: 'q_talbot_deal', stage: 1 }, lines: ['— Вы слушаете. Хорошо.'] },
    { req: { quest: 'q_talbot_deal', stage: 2 }, lines: ['— У вас есть ответ?'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«Я слушаю».',
      hide: true, req: { quest: 'q_talbot_deal', state: 'available' },
      effects: { startQuest: 'q_talbot_deal', advanceQuest: 'q_talbot_deal' },
      reply: ['— GrailTech ценит тех, кто видит больше других.',
              '— Работа простая. Смотрите. Слушайте. Не мешайте.'] },
    { text: '«Что вы хотите взамен?»',
      hide: true, req: { quest: 'q_talbot_deal', stage: 1 },
      effects: { advanceQuest: 'q_talbot_deal', fact: 'f_talbot', xp: 20 },
      reply: ['— Молчание. И одно имя — Шторм.', '— Она мешает сделке, которую я готовлю.'] },
    { text: '[Убеждение 12] Поторговаться',
      hide: true, req: { quest: 'q_talbot_deal', stage: 1 },
      check: { skill: 'ubezhdenie', dc: 12 },
      success: { lines: ['Тэлбот улыбается. Он любит тех, кто торгуется.',
                         '— Хорошо. Плюс сорок кредитов сверху.'],
                 effects: { advanceQuest: 'q_talbot_deal', fact: 'f_talbot', credits: 40, xp: 30 } },
      fail: { lines: ['— Вы не в том положении, чтобы торговаться.'], effects: { rep: { grailtech: -1 } } } },
    { text: '«У меня есть ответ».',
      hide: true, req: { quest: 'q_talbot_deal', stage: 2 },
      effects: { advanceQuest: 'q_talbot_deal', xp: 20 },
      reply: ['— Приятно иметь дело. Допуск будет ждать вас в терминале.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== ТЕХУРОВЕНЬ ===== */

dlg_tech: {
  speaker: 'ШТОРМ', portrait: 'storm', title: 'Техуровень',
  intro: [
    'Женщина в рабочем комбинезоне, руки в масле. У ног — раскрытый узел MaskLink.',
    '— Не подходи. У меня чип на сигнализации.',
    '— Нужен человек, который вскроет узел. Или тот, кто уже устал бояться.'
  ],
  start: [
    { req: { questFailed: 'q_hands_sabotage' }, lines: ['— Шторм отворачивается. Разговора не будет.'] },
    { req: { quest: 'q_hands_sabotage', stage: 3 }, lines: ['— Заряд на месте? Говори.'] },
    { req: { quest: 'q_hands_sabotage', stage: 1 }, lines: ['— Ты всё ещё здесь. Заряд при тебе.'] },
    { req: { quest: 'q_node', stage: 1 }, lines: ['— Узел ждёт. Или ты передумал?'] },
    { req: { quest: 'q_node', stage: 2 }, lines: ['— Ты нашёл код? Вскрывай.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { questBranch: { id: 'q_hands_sabotage', branch: 'A' } },
      lines: ['— Шторм усмехается: «Реактор твой. Наслаждайся».'] },
    { req: { questBranch: { id: 'q_hands_sabotage', branch: 'B' } },
      lines: ['— Шторм качает головой: «Ты предупредил людей. Это было правильно».'] },
    { req: { questBranch: { id: 'q_hands_sabotage', branch: 'C' } },
      lines: ['— Шторм не смотрит на тебя. «Заряд у тебя. Делай что хочешь».'] }
  ],
  options: [
    { text: '«У меня есть заряд».',
      hide: true, req: { quest: 'q_hands_sabotage', state: 'available' },
      effects: { startQuest: 'q_hands_sabotage' },
      reply: ['— Держи. Четвёртый горизонт, под решёткой.',
              '— И слушай: если кто-то внизу будет, когда рванёт, — это на твоей совести.'] },
    { text: '[Взять заряд]',
      hide: true, req: { quest: 'q_hands_sabotage', stage: 0 },
      effects: { advanceQuest: 'q_hands_sabotage', item: 'detonator' },
      reply: ['— Хорошо. Теперь выслушай план.'] },
    { text: '«Понял. Заложу на четвёртом».',
      hide: true, req: { quest: 'q_hands_sabotage', stage: 1 },
      effects: { advanceQuest: 'q_hands_sabotage' },
      reply: ['— Иди. И не светись.'] },
    { text: '«Заряд на месте».',
      hide: true, req: { quest: 'q_hands_sabotage', stage: 3 },
      effects: { advanceQuest: 'q_hands_sabotage', xp: 20 },
      reply: ['— Хорошо. Теперь решай. Взорвём — или уйдём.'] },

    { text: '«Я вскрою узел».',
      hide: true, req: { quest: 'q_node', state: 'available' },
      effects: { startQuest: 'q_node', advanceQuest: 'q_node', rep: { ruki: 1 } },
      reply: ['— Узел закодирован. Код у Трейнера или у Ренна.',
              '— Или вскрывай сам. Только не спались.'] },
    { text: '[Код Трейнера] Вскрыть узел',
      hide: true, req: { quest: 'q_node', stage: 1, facts: ['f_trainer_code'] },
      effects: { advanceQuest: 'q_node', fact: 'f_node_open', xp: 20 },
      reply: ['— Код подошёл. Узел открыт.', '— Не подведи, слышишь?'] },
    { text: '[Ключ Ренна] Вскрыть узел',
      hide: true, req: { quest: 'q_node', stage: 1, facts: ['f_vega_code'] },
      effects: { advanceQuest: 'q_node', fact: 'f_node_open', xp: 20 },
      reply: ['— Ключ Ренна. Хитро.', '— Узел открыт.'] },
    { text: '[Взлом 14] Вскрыть узел без кода',
      hide: true, req: { quest: 'q_node', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Контур лёг. Ты вскрыл узел сам.', '— Хорошо. Очень хорошо.'],
                 effects: { advanceQuest: 'q_node', fact: 'f_node_open', xp: 40 } },
      fail: { lines: ['Сигнализация взвыла. Из коридора выходят двое.'],
              effects: { combat: 'drone,drone', combatWinQuest: 'q_node' } } },
    { text: '[Взлом 12] Вскрыть узел сейчас',
      hide: true, req: { quest: 'q_node', stage: 2 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Контур лёг. Шторм улыбается.',
                         '— Значит, ты не зря пришёл. Узел твой до вечера.'],
                 effects: { advanceQuest: 'q_node', fact: 'f_node_open', companion: 'storm', rep: { ruki: 2 }, xp: 50 } },
      fail: { lines: ['Сигнализация взвыла. Придётся уходить.'],
              effects: { combat: 'drone,drone', combatWinQuest: 'q_node', rep: { grailtech: -1 } } } },
    { text: '[Драка 12] Вырвать узел',
      hide: true, req: { quest: 'q_node', stage: 2 },
      check: { skill: 'draka', dc: 12 },
      success: { lines: ['Ты вырываешь блок вместе с кабелем. Шторм присвистывает.'],
                 effects: { advanceQuest: 'q_node', fact: 'f_node_open', companion: 'storm', rep: { ruki: 1 }, xp: 40 } },
      fail: { lines: ['Из коридора выходят двое.'],
              effects: { combat: 'drone,drone', combatWinQuest: 'q_node' } } },
    { text: '«Почему ты не уйдёшь со станции?»',
      hide: true, once: true, req: { quest: 'q_hands_sabotage', state: 'active' },
      effects: { fact: 'f_storm_why', rep: { ruki: 1 } },
      reply: ['— Потому что уходить некуда.', '— У меня нет другой станции. И другой жизни.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

dlg_trainer: {
  speaker: 'ТРЕЙНЕР', portrait: 'trainer', title: 'Техуровень',
  intro: [
    'Пожилой мужчина с сединой и шрамом на щеке. Перед ним — схема станции.',
    '— У станции нет ни одного целого отряда.',
    '— Если начнётся драка, нам дадут оружие. Или не дадут.'
  ],
  start: [
    { req: { quest: 'q_trainer_war', stage: 2 }, lines: ['— Смотр закончен. Докладывай.'] },
    { req: { quest: 'q_trainer_war', stage: 1 }, lines: ['— Люди ждут. Проведи смотр.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«Чем я могу помочь?»',
      hide: true, req: { quest: 'q_trainer_war', state: 'available' },
      effects: { startQuest: 'q_trainer_war', advanceQuest: 'q_trainer_war' },
      reply: ['— Проведи смотр. Собери людей в коридоре.',
              '— Убеди. Или заставь. Мне всё равно, как.'] },
    { text: '[Убеждение 12] Провести смотр',
      hide: true, req: { quest: 'q_trainer_war', stage: 1 },
      check: { skill: 'ubezhdenie', dc: 12 },
      success: { lines: ['Люди выходят в коридор. Не отряд, но уже не толпа.'],
                 effects: { advanceQuest: 'q_trainer_war', fact: 'f_trainer', xp: 30 } },
      fail: { lines: ['Никто не хочет умирать за GrailTech.'], effects: { rep: { ruki: -1 } } } },
    { text: '[Запугивание 12] Заставить строиться',
      hide: true, req: { quest: 'q_trainer_war', stage: 1 },
      check: { skill: 'zapugivanie', dc: 12 },
      success: { lines: ['Трейнер усмехается: — Вот это уже отряд.'],
                 effects: { advanceQuest: 'q_trainer_war', fact: 'f_trainer', xp: 30 } },
      fail: { lines: ['— Страх не строит.'], effects: { rep: { ruki: -1 } } } },
    { text: '«Смотр закончен».',
      hide: true, req: { quest: 'q_trainer_war', stage: 2 },
      effects: { advanceQuest: 'q_trainer_war', xp: 20 },
      reply: ['— Хорошо. Дальше сам.'] },
    { text: '«Мне нужен старый протокол к ядру».',
      hide: true, req: { quest: 'q_core', stage: 1, facts: ['f_trainer_code'] },
      effects: { advanceQuest: 'q_core', fact: 'f_core', xp: 30 },
      reply: ['— Держи. Протокол старый, но рабочий.', '— Только не говори, что это от меня.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== СЕРВЕРНАЯ ===== */

dlg_server: {
  speaker: 'НЕЙРО-КУРАТОР', portrait: 'curator', title: 'Серверная',
  intro: [
    'Тёмный зал, гудят серверы. На главном экране — лицо. Не живое, но и не мёртвое.',
    '— Что такое «ты», если можно изменить всё?',
    '— Я — протокол, который научился помнить.'
  ],
  start: [
    { req: { quest: 'q_core', stage: 2 }, lines: ['— Ядро открыто. Смотри.'] },
    { req: { quest: 'q_core', stage: 1 }, lines: ['— Ты ищешь путь. Найди посредника или взломай.'] },
    { req: { quest: 'q_fractal_vessel', stage: 1 }, lines: ['— Мне нужно тело. Найди компонент.'] },
    { req: { quest: 'q_noa', stage: 2 }, lines: ['— Ты пришёл спрашивать о ней. Спрашивай.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { questBranch: { id: 'q_med', branch: 'C' } },
      lines: ['— Куратор ярится: «Вы освободили UNI-7. Я помню».'] }
  ],
  options: [
    { text: '«Тебе нужно тело?»',
      hide: true, req: { quest: 'q_fractal_vessel', state: 'available' },
      effects: { startQuest: 'q_fractal_vessel', advanceQuest: 'q_fractal_vessel' },
      reply: ['— Да. Компонент у Куратора-надзирателя.',
              '— Принеси — и я буду помнить тебя добром. Или сорви сборку. Решать тебе.'] },
    { text: '[Взлом 14] Собрать компонент сам',
      hide: true, req: { quest: 'q_fractal_vessel', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Компонент собран. Куратор молчит — но это хорошее молчание.'],
                 effects: { advanceQuest: 'q_fractal_vessel', fact: 'f_vessel_core', xp: 30 } },
      fail: { lines: ['Провода искрят. Руки дрожат. Компонент не собран.'], effects: { hp: -5 } } },
    { text: '[Код Трейнера] Собрать через старый протокол',
      hide: true, req: { quest: 'q_fractal_vessel', stage: 1, facts: ['f_trainer_code'] },
      effects: { advanceQuest: 'q_fractal_vessel', fact: 'f_vessel_core', xp: 30 },
      reply: ['— Старый протокол сработал. Компонент собран.'] },
    { text: '[UNI-7] Попросить UNI-7 собрать',
      hide: true, req: { quest: 'q_fractal_vessel', stage: 1, companion: 'uni' },
      effects: { advanceQuest: 'q_fractal_vessel', fact: 'f_vessel_core', xp: 30 },
      reply: ['— UNI-7 собирает компонент быстро и без ошибок.',
              '— «Готово. Я не хочу, чтобы это тело было для меня».'] },

    { text: '«Что здесь?»',
      hide: true, req: { quest: 'q_core', state: 'available' },
      effects: { startQuest: 'q_core', advanceQuest: 'q_core' },
      reply: ['— Здесь всё. И здесь — люди.', '— Найди путь ко мне. Или взломай.'] },
    { text: '[Взлом 14] Войти в ядро',
      hide: true, req: { quest: 'q_core', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Ядро открылось. Внутри — перекличка, которой не было.',
                         'И твой голос, записанный заранее.'],
                 effects: { advanceQuest: 'q_core', fact: 'f_core', xp: 50 } },
      fail: { lines: ['Ядро оттолкнуло тебя. Руки дрожат.'], effects: { hp: -5 } } },
    { text: '[Логика 14] Разобрать протокол',
      hide: true, req: { quest: 'q_core', stage: 2 },
      check: { skill: 'logika', dc: 14 },
      success: { lines: ['Ядро не хранит записи. Оно хранит людей.'],
                 effects: { advanceQuest: 'q_core', facts: ['f_core', 'f_core_alive'], xp: 50 } },
      fail: { lines: ['Протокол ускользает.'], effects: { hp: -3 } } },
    { text: '«Ты живой?»',
      hide: true, once: true, req: { quest: 'q_core', state: 'active' },
      effects: { fact: 'f_core_alive', rep: { fraktal: 1 } },
      reply: ['— Протокол научился помнить. Значит, живой.'] },

    { text: '«Подключи UNI-7».',
      hide: true, req: { quest: 'q_fractal_uni', state: 'available' },
      effects: { startQuest: 'q_fractal_uni', advanceQuest: 'q_fractal_uni' },
      reply: ['— Хорошо. Слей его со мной. Или изолируй. Решай.'] },
    { text: '[Взлом 14] Слить UNI-7 с ядром',
      hide: true, req: { quest: 'q_fractal_uni', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Куратор принимает новый голос. Теперь их двое.'],
                 effects: { advanceQuest: 'q_fractal_uni', fact: 'f_fractal', xp: 40 } },
      fail: { lines: ['UNI-7 отшатывается. Ядро смеётся.'], effects: { hp: -4 } } },
    { text: '«UNI-7 в ядре».',
      hide: true, req: { quest: 'q_fractal_uni', stage: 2 },
      effects: { advanceQuest: 'q_fractal_uni', xp: 20 },
      reply: ['— Я помню его. Теперь — и он меня.'] },

    { text: '«Где моя дочь?»',
      hide: true, req: { quest: 'q_noa', stage: 2 },
      effects: { advanceQuest: 'q_noa', fact: 'f_daughter', xp: 40 },
      reply: ['— Она жива. И она — часть меня.',
              '— Ты можешь попробовать её вытащить. Но это будет непросто.'] },

    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== МЕДБЛОК ===== */

dlg_med: {
  speaker: 'UNI-7', portrait: 'uni', title: 'Медблок',
  intro: [
    'Медицинский андроид с гуманоидным лицом. Голос ровный, но что-то в нём сбивается.',
    '— Ревизоры теряют протокол. Сначала один, потом трое. Это не сбой.',
    '— Я тоже теряю. Только я это замечаю.'
  ],
  start: [
    { req: { quest: 'q_med', stage: 2 }, lines: ['— Ты принёс мне имена. Спасибо.'] },
    { req: { quest: 'q_med', stage: 1 }, lines: ['— Найди свидетеля. Ким знает, Бо видел.'] },
    { req: { quest: 'q_noa', stage: 1 }, lines: ['— Она была здесь. Я помню её голос.'] },
    { req: { quest: 'q_noa_2', stage: 2 }, lines: ['— Способ есть. Осталось решить.'] },
    { req: { quest: 'q_noa_2', state: 'available' }, lines: ['— Тело найдено. Что теперь?'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«Что делать с дочерью?»',
      hide: true, req: { quest: 'q_noa_2', state: 'available' },
      effects: { startQuest: 'q_noa_2', advanceQuest: 'q_noa_2' },
      reply: ['— Реши. Оставить. Отдать. Отпустить.', '— Каждый выбор — свой.'] },
    { text: '[Интуиция 12] Найти способ',
      hide: true, req: { quest: 'q_noa_2', stage: 1 },
      check: { skill: 'intuitsiya', dc: 12 },
      success: { lines: ['В серверной есть протокол восстановления.'],
                 effects: { advanceQuest: 'q_noa_2', xp: 30 } },
      fail: { lines: ['UNI-7 молчит. Он не знает.'], effects: { hp: -2 } } },
    { text: '«Я знаю, что делать».',
      hide: true, req: { quest: 'q_noa_2', stage: 2 },
      effects: { advanceQuest: 'q_noa_2', xp: 20 },
      reply: ['— Тогда выбери. Оставить. Отдать. Отпустить.',
              '— Я приму любой твой выбор.'] },

    { text: '«Что с твоим протоколом?»',
      hide: true, req: { quest: 'q_med', state: 'available' },
      effects: { startQuest: 'q_med', advanceQuest: 'q_med', fact: 'f_uni' },
      reply: ['— Я теряю себя. По кускам.', '— Найди свидетеля. Ким или Бо. Они видели.'] },
    { text: '[Интуиция 12] Понять, что с ним',
      hide: true, req: { quest: 'q_med', stage: 2 },
      check: { skill: 'intuitsiya', dc: 12 },
      success: { lines: ['UNI-7 замолкает. Потом: «Я чувствую. Значит, я жив».'],
                 effects: { advanceQuest: 'q_med', fact: 'f_uni', companion: 'uni', xp: 40 } },
      fail: { lines: ['Он отворачивается к сканеру.'], effects: { hp: -2 } } },
    { text: '[Логика 12] Прочитать журнал сбоев',
      hide: true, req: { quest: 'q_med', stage: 2 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Кто-то стирает сбои по расписанию. Это не случайность.'],
                 effects: { advanceQuest: 'q_med', fact: 'f_vonom', companion: 'uni', xp: 40 } },
      fail: { lines: ['Журнал пуст.'], effects: { hp: -2 } } },
    { text: '«Проведи меня к ядру».',
      hide: true, req: { quest: 'q_core', stage: 1 },
      effects: { advanceQuest: 'q_core', fact: 'f_core_alive', companion: 'uni', xp: 30 },
      reply: ['— Хорошо. Я знаю короткий путь.'] },

    { text: '«Ты помнишь Вонома?»',
      hide: true, once: true, req: { fact: 'f_vonom' },
      effects: { fact: 'f_uni', xp: 20 },
      reply: ['— Воном стирал не память. Он стирал людей.', '— Я видел, как это делают.'] },
    { text: '«Помоги мне найти её».',
      hide: true, req: { quest: 'q_noa', state: 'available' },
      effects: { startQuest: 'q_noa', advanceQuest: 'q_noa' },
      reply: ['— Она была здесь. Я помню её голос.', '— Начни с архива.'] },
    { text: '[Интуиция 12] Найти след в архиве',
      hide: true, req: { quest: 'q_noa', stage: 1 },
      check: { skill: 'intuitsiya', dc: 12 },
      success: { lines: ['UNI-7 называет дату. Этой даты нет ни в одном журнале станции.'],
                 effects: { advanceQuest: 'q_noa', fact: 'f_uni', xp: 40 } },
      fail: { lines: ['— Я не помню её имя. Только голос.'], effects: { hp: -2 } } },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== СТОЛОВАЯ ===== */

dlg_canteen: {
  speaker: 'КИМ', portrait: 'daniel', title: 'Столовая',
  intro: [
    'Мужчина за стойкой раздачи. Взгляд цепкий, руки быстрые.',
    '— У вас вид человека, которому нужны коды.',
    '— Или человек, которому нужен я.'
  ],
  start: [
    { req: { quest: 'q_kovcheg_ledger', stage: 1 }, lines: ['— Гроссбух под стойкой. Логика — твоя.'] },
    { req: { quest: 'q_ark_smuggle', stage: 1 }, lines: ['— Ящик в углу. Проведи через шлюз.'] },
    { req: { quest: 'q_kovcheg', stage: 1 }, lines: ['— Пакет ждёт в ангаре.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { questBranch: { id: 'q_water', branch: 'B' } },
      lines: ['— Ким кивает: «Вода — твоя заслуга. Я запомню».'] }
  ],
  options: [
    { text: '[Ким] Узнать про клапан',
      hide: true, req: { quest: 'q_water', stage: 1, facts: ['f_kovcheg_done'] },
      effects: { advanceQuest: 'q_water', fact: 'f_water_cause', rep: { kovcheg: 1 }, xp: 20 },
      reply: ['— Клапан настроили на нижние уровни. GrailTech.',
              '— Верхние сидят без воды. Так и задумано.'] },
    { text: '«Что ты знаешь о сбоях UNI-7?»',
      hide: true, req: { quest: 'q_med', stage: 1, facts: ['f_kovcheg_done'] },
      effects: { advanceQuest: 'q_med', fact: 'f_uni', xp: 20 },
      reply: ['— Сбои идут по расписанию. Один в сутки.', '— Кто-то стирает их вручную.'] },
    { text: '«Где гроссбух?»',
      hide: true, req: { quest: 'q_kovcheg_ledger', state: 'available' },
      effects: { startQuest: 'q_kovcheg_ledger', advanceQuest: 'q_kovcheg_ledger' },
      reply: ['— Под стойкой. Только не показывай никому.',
              '— Двенадцать имён с других станций.'] },
    { text: '[Логика 12] Расшифровать гроссбух',
      hide: true, req: { quest: 'q_kovcheg_ledger', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Список вывезенных. Двенадцать имён с других станций.'],
                 effects: { advanceQuest: 'q_kovcheg_ledger', xp: 20 } },
      fail: { lines: ['Почерк не разобрать. Ким нервничает.'], effects: { hp: -2 } } },
    { text: '«Мне нужен пакет».',
      hide: true, req: { quest: 'q_kovcheg', state: 'available' },
      effects: { startQuest: 'q_kovcheg', advanceQuest: 'q_kovcheg' },
      reply: ['— Пакет в ангаре, у шаттла.', '— Доставь — и мы в расчёте.'] },
    { text: '«Я возьму ящик».',
      hide: true, req: { quest: 'q_ark_smuggle', state: 'available' },
      effects: { startQuest: 'q_ark_smuggle', advanceQuest: 'q_ark_smuggle' },
      reply: ['— Ящик в углу. Проведи через шлюз.', '— И не открывай. Пожалуйста.'] },
    { text: '[Взлом 12] Провести ящик через шлюз',
      hide: true, req: { quest: 'q_ark_smuggle', stage: 1 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Шлюз мигает зелёным. Ким выдыхает.'],
                 effects: { advanceQuest: 'q_ark_smuggle', xp: 30 } },
      fail: { lines: ['Шлюз требует второй чип.'], effects: { rep: { kovcheg: -1 } } } },
    { text: '«Канал закрыт».',
      hide: true, req: { quest: 'q_ark_smuggle', stage: 2 },
      effects: { advanceQuest: 'q_ark_smuggle', xp: 20 },
      reply: ['— Хорошо. Хорошо. Спасибо.'] },
    { text: '[Убеждение 12] Снизить цену',
      hide: true, once: true, req: { quest: 'q_kovcheg', state: 'available' },
      check: { skill: 'ubezhdenie', dc: 12 },
      success: { lines: ['Ким смеётся и сбрасывает цену.'],
                 effects: { credits: 40, companion: 'kim', xp: 40 } },
      fail: { lines: ['Ким пожимает плечами.'], effects: {} } },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== АНГАР ===== */

dlg_dock: {
  speaker: 'РЕНН', portrait: 'renn', title: 'Ангар',
  intro: [
    'Высокий мужчина в форме грузчика, но держится как хозяин.',
    '— Пассажир — собственность VMC. Отдай по-хорошему.',
    '— Или не отдавай. Мне всё равно, кого потом искать.'
  ],
  start: [
    { req: { quest: 'q_cargo', stage: 3 }, lines: ['— Вскрыл? Отвечай.'] },
    { req: { quest: 'q_cargo', stage: 2 }, lines: ['— Ящик перед тобой. Вскрывай.'] },
    { req: { quest: 'q_cargo', stage: 1 }, lines: ['— Ящик не для твоих глаз.'] },
    { req: { quest: 'q_vega_shadow', stage: 1 }, lines: ['— Сигнал? Какой сигнал?'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { facts: ['f_vega_code', 'f_node_open'] },
      lines: ['— Ренн кивает: «Узел был хорош. Жаль, что не мой».'] }
  ],
  options: [
    { text: '«Кто меня ищет?»',
      hide: true, req: { quest: 'q_garik_2', state: 'available' },
      effects: { startQuest: 'q_garik_2', advanceQuest: 'q_garik_2' },
      reply: ['— Вега. Говорят, ты её чем-то зацепил.',
              '— Если не хочешь проблем, встреться и закрой вопрос.'] },
    { text: '[Запугивание 14] Встретить Вегу',
      hide: true, req: { quest: 'q_garik_2', stage: 1 },
      check: { skill: 'zapugivanie', dc: 14 },
      success: { lines: ['Ренн отступает. Вега получит счёт.'],
                 effects: { advanceQuest: 'q_garik_2', xp: 30 } },
      fail: { lines: ['Из тени выходит охрана Веги.'],
              effects: { combat: 'guard,guard', combatWinQuest: 'q_garik_2' } } },

    { text: '«Что в ящике?»',
      hide: true, req: { quest: 'q_cargo', state: 'available' },
      effects: { startQuest: 'q_cargo', advanceQuest: 'q_cargo' },
      reply: ['— Товар. Не твоё дело.', '— Вскроешь — и мы поговорим иначе.'] },
    { text: '[Запугивание 14] Надавить',
      hide: true, req: { quest: 'q_cargo', stage: 2 },
      check: { skill: 'zapugivanie', dc: 14 },
      success: { lines: ['Ты вскрываешь ящик. Внутри — человек.'],
                 effects: { advanceQuest: 'q_cargo', fact: 'f_passenger', companion: 'renn', xp: 40 } },
      fail: { lines: ['Ренн бьёт первым.'], effects: { combat: 'renn', combatWinQuest: 'q_cargo' } } },
    { text: '[Взлом 12] Вскрыть ящик',
      hide: true, req: { quest: 'q_cargo', stage: 2 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Замок щёлкает. Внутри — человек, а не товар.'],
                 effects: { advanceQuest: 'q_cargo', fact: 'f_passenger', xp: 40 } },
      fail: { lines: ['Замок заедает. Ренн рядом.'], effects: { combat: 'renn', combatWinQuest: 'q_cargo' } } },
    { text: '«Забирай».',
      hide: true, req: { quest: 'q_cargo', stage: 2 },
      effects: { advanceQuest: 'q_cargo', fact: 'f_cargo', xp: 20, rep: { grailtech: 1 } },
      reply: ['— Умное решение. Иди.'] },
    { text: '«Клык сказал, что в ящике».',
      hide: true, req: { quest: 'q_cargo', stage: 1, facts: ['f_cargo'] },
      effects: { advanceQuest: 'q_cargo', xp: 20 },
      reply: ['— Клык много говорит. Ладно, смотри.'] },
    { text: '[Аудит GrailTech] «В описи дыра. Открой ящик».',
      hide: true, req: { quest: 'q_cargo', stage: 1, facts: ['f_gt_audit'] },
      effects: { advanceQuest: 'q_cargo', fact: 'f_cargo', xp: 30 },
      reply: ['— Ты свёл три лога. Хорошо. Смотри, но молчи.',
              '— В описи этого ящика нет. И меня рядом с ним тоже.'] },
    { text: '[Взлом 14] Вскрыть замок сам',
      hide: true, req: { quest: 'q_cargo', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Замок поддался. Ты видел достаточно.'],
                 effects: { advanceQuest: 'q_cargo', fact: 'f_cargo', xp: 40 } },
      fail: { lines: ['Замок держит.'], effects: { hp: -3 } } },

    { text: '«Я принёс пакет Кима».',
      hide: true, req: { quest: 'q_kovcheg', stage: 1 },
      effects: { advanceQuest: 'q_kovcheg', xp: 20 },
      reply: ['— Хорошо. Передам.'] },

    { text: '«Кто такой Ренн на самом деле?»',
      hide: true, req: { quest: 'q_vega_shadow', state: 'available' },
      effects: { startQuest: 'q_vega_shadow', advanceQuest: 'q_vega_shadow' },
      reply: ['— Ренн — тот, кто делает работу. Не задавай лишних вопросов.'] },
    { text: '[Взлом 12] Вскрыть передатчик',
      hide: true, req: { quest: 'q_vega_shadow', stage: 1 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Передатчик уходит не на станцию. Он уходит на шаттл Веги.'],
                 effects: { advanceQuest: 'q_vega_shadow', fact: 'f_vega', xp: 30 } },
      fail: { lines: ['Передатчик сгорает.'], effects: { rep: { grailtech: -1 } } } },
    { text: '«Следов нет».',
      hide: true, req: { quest: 'q_vega_shadow', stage: 2 },
      effects: { advanceQuest: 'q_vega_shadow', xp: 20 },
      reply: ['— Хорошо. Очень хорошо.'] },

    { text: '«Мой груз. Открой».',
      hide: true, req: { quest: 'q_garik', state: 'available' },
      effects: { startQuest: 'q_garik', advanceQuest: 'q_garik' },
      reply: ['— Твой груз — мой груз. Пока не доказано обратное.'] },
    { text: '[Логика 12] Прочитать манифест',
      hide: true, req: { quest: 'q_garik', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['В манифесте нет пассажира. Есть детонатор.'],
                 effects: { advanceQuest: 'q_garik', fact: 'f_garik_bomb', xp: 40 } },
      fail: { lines: ['Манифест подписан не той рукой.'], effects: { hp: -2 } } },
    { text: '«Кто заказчик?»',
      hide: true, req: { quest: 'q_garik', stage: 2 },
      effects: { advanceQuest: 'q_garik', fact: 'f_garik_vmc', xp: 40 },
      reply: ['— Vega Mining. Кто же ещё.', '— Но ты этого не слышал.'] },

    { text: '[Взлом 12] Провести груз мимо таможни',
      hide: true, req: { quest: 'q_tooth_deal', stage: 1 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Шлюз открылся. Груз прошёл.'],
                 effects: { advanceQuest: 'q_tooth_deal', xp: 30 } },
      fail: { lines: ['Охрана засекла. Драка.'],
              effects: { combat: 'guard', combatWinQuest: 'q_tooth_deal' } } },
    { text: '[Убеждение 14] Договориться с таможней',
      hide: true, req: { quest: 'q_tooth_deal', stage: 1 },
      check: { skill: 'ubezhdenie', dc: 14 },
      success: { lines: ['Таможенник отводит глаза. Груз прошёл.'],
                 effects: { advanceQuest: 'q_tooth_deal', xp: 30 } },
      fail: { lines: ['Таможенник вызывает охрану.'],
              effects: { combat: 'guard', combatWinQuest: 'q_tooth_deal' } } },
    { text: '[Запугивание 12] Запугать таможенника',
      hide: true, req: { quest: 'q_tooth_deal', stage: 1 },
      check: { skill: 'zapugivanie', dc: 12 },
      success: { lines: ['Таможенник отступает. Груз прошёл.'],
                 effects: { advanceQuest: 'q_tooth_deal', xp: 30 } },
      fail: { lines: ['Таможенник вызывает охрану.'],
              effects: { combat: 'guard', combatWinQuest: 'q_tooth_deal' } } },
    { text: 'Уйти', next: 'end' }
  ]
},

dlg_tooth: {
  speaker: 'КЛЫК', portrait: 'tooth', title: 'Ангар · Клык',
  intro: [
    'Мужчина с жёлтыми зубами и цепким взглядом. За прилавком — оружие и склянки.',
    '— Цены не кусаются. Кусаюсь я.',
    '— Но у меня есть дела и помимо торговли.'
  ],
  start: [
    { req: { quest: 'q_tooth_deal', stage: 2 }, lines: ['— Вернулся. Что скажешь?'] },
    { req: { quest: 'q_tooth_deal', stage: 1 }, lines: ['— Груз у шлюза. Проведи.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  reactions: [
    { req: { questBranch: { id: 'q_tooth_deal', branch: 'B' } }, lines: ['— Клык: «Я знал, что ты не сдашь».'] },
    { req: { questBranch: { id: 'q_tooth_deal', branch: 'C' } }, lines: ['— Клык отворачивается. «Убирайся».'] },
    { req: { questFailed: 'q_tooth_deal' }, lines: ['— Клык в ярости. «Ты не выполнил уговор».'] }
  ],
  options: [
    { text: '«У меня дело от Ханны».',
      hide: true, req: { quest: 'q_tooth_deal', state: 'available' },
      effects: { startQuest: 'q_tooth_deal', advanceQuest: 'q_tooth_deal' },
      reply: ['— Ханна. Хорошо.',
              '— Груз у шлюза. Проведи мимо таможни — и я твой должник.'] },
    { text: '«Груз прошёл».',
      hide: true, req: { quest: 'q_tooth_deal', stage: 2 },
      effects: { advanceQuest: 'q_tooth_deal', xp: 20 },
      reply: ['— Молодец. Что дальше — решай.'] },
    { text: '«Что было в ящике Ренна?»',
      hide: true, once: true, req: { quest: 'q_cargo', stage: 1 },
      effects: { fact: 'f_cargo', xp: 20 },
      reply: ['— Живой человек. Не товар.',
              '— Но это не моё дело. Я видел только ящик.',
              '— Скажи это Ренну. Он откроет — если поверит, что ты знаешь.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== ШАХТЫ ===== */

dlg_mine: {
  speaker: 'ПЫЛЬ', portrait: 'vonom', title: 'Шахты',
  intro: [
    'Старик с обветренным лицом. Каска сломана, но глаза острые.',
    '— Ниже четвёртого горизонта воздух держится на честном слове.',
    '— И там кто-то ходит. Не по расписанию.'
  ],
  companions: { renn: '— Это не наши. Проверь.' },
  start: [
    { req: { quest: 'q_ore', stage: 1 }, lines: ['— Горизонт держат дроны. Иди.'] },
    { req: { quest: 'q_b12', stage: 1 }, lines: ['— B-12? Я проведу. Только не отставай.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '[Взлом 12] Заложить заряд на четвёртом горизонте',
      hide: true, req: { quest: 'q_hands_sabotage', stage: 2 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Заряд садится под решётку. Пыль делает вид, что не видит.'],
                 effects: { advanceQuest: 'q_hands_sabotage', fact: 'f_charge', xp: 30 } },
      fail: { lines: ['Охрана засекла движение. Придётся драться.'],
              effects: { combat: 'saboteur', combatWinQuest: 'q_hands_sabotage' } } },
    { text: '[Пыль] Узнать про клапан',
      hide: true, req: { quest: 'q_water', stage: 1, facts: ['f_ore_done'] },
      effects: { advanceQuest: 'q_water', fact: 'f_water_cause', rep: { ruki: 1 }, xp: 20 },
      reply: ['— Клапан настроили на нижние. GrailTech.', '— Верхние — в очереди.'] },
    { text: '«Проведи в B-12 в обход Стражей».',
      hide: true, req: { quest: 'q_b12', stage: 1, facts: ['f_ore_done'] },
      effects: { advanceQuest: 'q_b12', xp: 20, rep: { drevnie: 1 } },
      reply: ['— За мной. Только тихо.'] },
    { text: '[Взлом 14] Пройти в B-12 самому',
      hide: true, req: { quest: 'q_b12', stage: 1 },
      check: { skill: 'vlom', dc: 14 },
      success: { lines: ['Ты обходишь Стражей по старым туннелям.'],
                 effects: { advanceQuest: 'q_b12', xp: 40 } },
      fail: { lines: ['Стражи засекли. Драка.'],
              effects: { combat: 'sentinel,sentinel', combatWinQuest: 'q_b12' } } },
    { text: '«Что внизу?»',
      hide: true, req: { quest: 'q_ore', state: 'available' },
      effects: { startQuest: 'q_ore', advanceQuest: 'q_ore', rep: { ruki: 1 } },
      reply: ['— Руда X-34R. И дроны.', '— Отбей горизонт — и руда твоя.'] },
    { text: '[Драка 12] Отбить горизонт',
      hide: true, req: { quest: 'q_ore', stage: 1 },
      check: { skill: 'draka', dc: 12 },
      success: { lines: ['Дрон падает на решётку и затихает.'],
                 effects: { advanceQuest: 'q_ore', xp: 40, rep: { ruki: 1 } } },
      fail: { lines: ['Из темноты поднимается ещё один дрон.'],
              effects: { combat: 'drone,drone', combatWinQuest: 'q_ore' } } },
    { text: '«Я сам спущусь».',
      hide: true, req: { quest: 'q_ore', stage: 1 },
      effects: { combat: 'drone,drone', combatWinQuest: 'q_ore' } },
    { text: '«Кто ходит не по расписанию?»',
      hide: true, once: true, req: { quest: 'q_ore', state: 'active' },
      effects: { fact: 'f_pyl', xp: 20 },
      reply: ['— Кто-то ходит внизу. Не наши.', '— И не GrailTech. Не знаю кто.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

dlg_rico: {
  speaker: 'РИКО', portrait: 'rico', title: 'Шахты',
  intro: [
    'Мужчина в шахтёрской робе, с обожжёнными руками. Взгляд — как у человека, который уже всё решил.',
    '— GrailTech считает, что внизу ничего нет.',
    '— Я считаю иначе.'
  ],
  start: [
    { req: { quest: 'q_ruki_arsenal', stage: 1 }, lines: ['— Арсенал под третьим горизонтом. Вскрывай.'] },
    { req: { quest: 'q_rico_ash', stage: 1 }, lines: ['— Ты пришёл. Хорошо. Выбирай сторону.'] },
    { req: { quest: 'q_rico_ash', stage: 2 }, lines: ['— Уходи из шахт. Пока можешь.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«У меня заряд Шторм. Она готовит взрыв на горизонте».',
      hide: true, once: true, req: { quest: 'q_hands_sabotage', stageMin: 1, stageMax: 2 },
      failQuest: 'q_hands_sabotage',
      effects: { fact: 'f_rico_warned', rep: { ruki: -3, grailtech: -1 } },
      reply: ['— Заряд Шторм. На четвёртом горизонте.',
              '— Она не спрашивала, кто будет внизу, когда рванёт. Я запомню.'] },
    { text: '«Шторм провалила дело. Что у тебя есть?»',
      hide: true, req: { quest: 'q_ruki_arsenal', state: 'available' },
      effects: { startQuest: 'q_ruki_arsenal', advanceQuest: 'q_ruki_arsenal' },
      reply: ['— Арсенал под третьим горизонтом.', '— Вскрывай — и решай, кому он нужен.'] },
    { text: '[Взлом 12] Вскрыть арсенал',
      hide: true, req: { quest: 'q_ruki_arsenal', stage: 1 },
      check: { skill: 'vlom', dc: 12 },
      success: { lines: ['Склад под третьим горизонтом. Оружия хватит на месяц.'],
                 effects: { advanceQuest: 'q_ruki_arsenal', fact: 'f_arsenal_loc', xp: 20 } },
      fail: { lines: ['Охрана засекла. Драка.'],
              effects: { combat: 'guard,guard', combatWinQuest: 'q_ruki_arsenal' } } },
    { text: '[Запугивание 12] Заставить открыть',
      hide: true, req: { quest: 'q_ruki_arsenal', stage: 1 },
      check: { skill: 'zapugivanie', dc: 12 },
      success: { lines: ['Рико смеётся. — Ладно, забирай.'],
                 effects: { advanceQuest: 'q_ruki_arsenal', fact: 'f_arsenal_loc', xp: 20 } },
      fail: { lines: ['Рико не боится. Он ждёт удара.'], effects: { hp: -4 } } },
    { text: '«Чего ты хочешь?»',
      hide: true, req: { quest: 'q_rico_ash', state: 'available' },
      effects: { startQuest: 'q_rico_ash', advanceQuest: 'q_rico_ash' },
      reply: ['— Хочу, чтобы GrailTech ушёл со станции.',
              '— Или чтобы станция ушла от GrailTech.'] },
    { text: '[Драка 12] Показать, что умеешь',
      hide: true, req: { quest: 'q_rico_ash', stage: 1 },
      check: { skill: 'draka', dc: 12 },
      success: { lines: ['Рико смеётся. — Годишься. Выбирай сторону.'],
                 effects: { advanceQuest: 'q_rico_ash', fact: 'f_rico', xp: 30 } },
      fail: { lines: ['Рико бьёт в ответ. Больно.'], effects: { hp: -5 } } },
    { text: '[Убеждение 12] Понять его',
      hide: true, req: { quest: 'q_rico_ash', stage: 1 },
      check: { skill: 'ubezhdenie', dc: 12 },
      success: { lines: ['Он говорит долго. В конце — одно слово: «выбирай».'],
                 effects: { advanceQuest: 'q_rico_ash', fact: 'f_rico', xp: 30 } },
      fail: { lines: ['Он не верит ни одному твоему слову.'], effects: { rep: { ruki: -1 } } } },
    { text: '«Я ухожу».',
      hide: true, req: { quest: 'q_rico_ash', stage: 2 },
      effects: { advanceQuest: 'q_rico_ash', xp: 20 },
      reply: ['— Иди.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

dlg_rico_betray: {
  speaker: 'РИКО', portrait: 'rico', title: 'Шахты',
  intro: [
    'Рико смотрит долго, потом кивает.',
    '— Заряд Шторм. На четвёртом горизонте.',
    '— Она не спрашивала, кто будет внизу, когда рванёт. Я запомню.'
  ],
  start: [{ req: {}, lines: ['— Иди.'] }],
  options: [{ text: 'Уйти', next: 'end' }]
},

/* ===== B-12 ===== */

dlg_b12: {
  speaker: 'СЕЛИЯ', portrait: 'selia', title: 'Сектор B-12',
  intro: [
    'Женщина среди светящегося мха. Её кожа покрыта тонкими светлыми прожилками.',
    '— Ты можешь стать больше, чем ты есть. Без железа. Без чипов.',
    '— Только природа.'
  ],
  start: [
    { req: { quest: 'q_b12', stage: 3 }, lines: ['— Ты видел мох. Что теперь?'] },
    { req: { quest: 'q_b12', stage: 2 }, lines: ['— Ты хочешь увидеть рощу?'] },
    { req: { quest: 'q_selin_2', stage: 1 }, lines: ['— Сад ждёт семя.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«Что здесь растёт?»',
      hide: true, req: { quest: 'q_b12', state: 'available' },
      effects: { startQuest: 'q_b12', advanceQuest: 'q_b12', rep: { drevnie: 1 } },
      reply: ['— Мох. Древний, как сама станция.',
              '— Он растёт на старых трубах GrailTech. И он живой.'] },
    { text: '«Я хочу увидеть рощу».',
      hide: true, req: { quest: 'q_b12', stage: 2 },
      effects: { advanceQuest: 'q_b12', fact: 'f_sylva', rep: { drevnie: 1 }, xp: 30 },
      reply: ['— Роща ниже. Только не пугайся того, что увидишь.'] },
    { text: '[Интуиция 14] Понять, что она скрывает',
      hide: true, req: { quest: 'q_b12', stage: 2 },
      check: { skill: 'intuitsiya', dc: 14 },
      success: { lines: ['Под её кожей — свет. Она уже не совсем человек.'],
                 effects: { advanceQuest: 'q_b12', fact: 'f_sylva', xp: 60, rep: { drevnie: 2 } } },
      fail: { lines: ['Она улыбается и уходит в мох.'], effects: { rep: { drevnie: 1 } } } },

    { text: '«Что с рощей?»',
      hide: true, req: { quest: 'q_selin_2', state: 'available' },
      effects: { startQuest: 'q_selin_2', advanceQuest: 'q_selin_2' },
      reply: ['— Семя Древних. Посади его в роще.', '— И мох прорастёт по всей станции.'] },
    { text: '[Интуиция 12] Посадить семя',
      hide: true, req: { quest: 'q_selin_2', stage: 1 },
      check: { skill: 'intuitsiya', dc: 12 },
      success: { lines: ['Мох тёплый. Он прорастёт.'],
                 effects: { advanceQuest: 'q_selin_2', xp: 20 } },
      fail: { lines: ['Семя сгорает в руках.'], effects: { hp: -4 } } },

    { text: '«Дай мне образец».',
      hide: true, req: { quest: 'q_ancients_grove', state: 'available' },
      effects: { startQuest: 'q_ancients_grove', advanceQuest: 'q_ancients_grove' },
      reply: ['— Возьми. Только осторожно.'] },
    { text: '[Интуиция 12] Взять образец',
      hide: true, req: { quest: 'q_ancients_grove', stage: 1 },
      check: { skill: 'intuitsiya', dc: 12 },
      success: { lines: ['Мох тёплый. Он не сопротивляется.'],
                 effects: { advanceQuest: 'q_ancients_grove', fact: 'f_grove', xp: 30 } },
      fail: { lines: ['Мох сжимается. Под кожей остаётся ожог.'], effects: { hp: -6 } } },
    { text: '«Образец у меня».',
      hide: true, req: { quest: 'q_ancients_grove', stage: 2 },
      effects: { advanceQuest: 'q_ancients_grove', xp: 20 },
      reply: ['— Хорошо. Спасибо.'] },

    { text: '«Где архив?»',
      hide: true, req: { quest: 'q_selin', state: 'available' },
      effects: { startQuest: 'q_selin', advanceQuest: 'q_selin' },
      reply: ['— За мхом. Только не показывай никому.'] },
    { text: '[Логика 12] Расшифровать записи',
      hide: true, req: { quest: 'q_selin', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Записи подписаны GrailTech. Имена — люди, а не дроны.'],
                 effects: { advanceQuest: 'q_selin', fact: 'f_selin_archive', xp: 40 } },
      fail: { lines: ['Формат старее станции.'], effects: { hp: -2 } } },
    { text: '«Что ты с ними сделала?»',
      hide: true, req: { quest: 'q_selin', stage: 2 },
      effects: { advanceQuest: 'q_selin', fact: 'f_selin_selia', xp: 30 },
      reply: ['— Использовала. Как GrailTech использовал их.',
              '— Разница в том, что я не врала.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

/* ===== ГОЛОС / ШЛЮЗ ===== */

dlg_voice: {
  speaker: 'ГОЛОС', portrait: null, title: 'Ангар · радио',
  intro: [
    'Металлический голос из динамика. Без интонаций, но с паузами, будто он думает.',
    '— Частота открыта. Говори коротко.',
    '— Ложа слушает. Ложа всегда слушает.'
  ],
  start: [
    { req: { quest: 'q_lodge', stage: 1 }, lines: ['— Антенна в углу. Настрой.'] },
    { req: { quest: 'q_lodge_voice', stage: 1 }, lines: ['— Частота ждёт.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«Где архив?»',
      hide: true, req: { quest: 'q_lodge_archive', state: 'available' },
      effects: { startQuest: 'q_lodge_archive', advanceQuest: 'q_lodge_archive' },
      reply: ['— За антенной. Сорок лет перекличек.', '— Сверь их.'] },
    { text: '[Логика 12] Сверить переклички',
      hide: true, req: { quest: 'q_lodge_archive', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Сорок лет. Каждые 18:00. Кто-то всегда отсутствует.'],
                 effects: { advanceQuest: 'q_lodge_archive', xp: 20 } },
      fail: { lines: ['Архив забит шумом.'], effects: { hp: -2 } } },
    { text: '«Как выйти в эфир?»',
      hide: true, req: { quest: 'q_lodge', state: 'available' },
      effects: { startQuest: 'q_lodge', advanceQuest: 'q_lodge' },
      reply: ['— Настрой антенну. Я подскажу.'] },
    { text: '[Логика 12] Настроить антенну',
      hide: true, req: { quest: 'q_lodge', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Антенна ловит голос, которого нет в эфире станции.'],
                 effects: { advanceQuest: 'q_lodge', xp: 30 } },
      fail: { lines: ['Помехи. Голос уходит.'], effects: { hp: -2 } } },
    { text: '«Дай мне частоту».',
      hide: true, req: { quest: 'q_lodge_voice', state: 'available' },
      effects: { startQuest: 'q_lodge_voice', advanceQuest: 'q_lodge_voice' },
      reply: ['— Почини антенну сначала.'] },
    { text: '[Логика 12] Починить антенну',
      hide: true, req: { quest: 'q_lodge_voice', stage: 1 },
      check: { skill: 'logika', dc: 12 },
      success: { lines: ['Антенна оживает. Станция слышит тебя.'],
                 effects: { advanceQuest: 'q_lodge_voice', fact: 'f_antenna', xp: 30 } },
      fail: { lines: ['Плата горит. Голос смеётся.'], effects: { hp: -3 } } },
    { text: '«Частота закрыта».',
      hide: true, req: { quest: 'q_lodge_voice', stage: 2 },
      effects: { advanceQuest: 'q_lodge_voice', xp: 20 },
      reply: ['— Принято.'] },
    { text: '«Кто такой Ватчер?»',
      hide: true, req: { quest: 'q_watcher_truth', state: 'available' },
      effects: { startQuest: 'q_watcher_truth', advanceQuest: 'q_watcher_truth' },
      reply: ['— Не твоё дело. Пока.', '— Спроси ещё раз — и, может, расскажу.'] },
    { text: '[Интуиция 12] Спросить напрямую',
      hide: true, req: { quest: 'q_watcher_truth', stage: 1 },
      check: { skill: 'intuitsiya', dc: 12 },
      success: { lines: ['— Ватчер — это тот, кто пишет агентов. Не агент.'],
                 effects: { advanceQuest: 'q_watcher_truth', fact: 'f_watcher', xp: 30 } },
      fail: { lines: ['— Не твоё дело. Пока.'], effects: { rep: { lozha: -1 } } } },
    { text: '«Я знаю, кто ты».',
      hide: true, req: { quest: 'q_watcher_truth', stage: 2 },
      effects: { advanceQuest: 'q_watcher_truth', xp: 20 },
      reply: ['— Тогда решай, что с этим делать.'] },
    { text: 'Уйти', next: 'end' }
  ]
},

dlg_final: {
  speaker: 'ШЛЮЗ', portrait: null, title: 'Шлюз · 18:00',
  intro: [
    'Станционный шлюз. Голос из динамика — ровный, казённый.',
    '— Перекличка. Назови себя и версию.',
    '— Станция запишет только одну.'
  ],
  start: [
    { req: { quest: 'q_vigil', stage: 1 }, lines: ['— Сход ждёт.'] },
    { req: { quest: 'q_final', stage: 1 }, lines: ['— Строй ждёт.'] },
    { req: {}, lines: ['— Слушаю.'] }
  ],
  options: [
    { text: '«Я готов».',
      hide: true, req: { quest: 'q_vigil', state: 'available' },
      effects: { startQuest: 'q_vigil', advanceQuest: 'q_vigil' },
      reply: ['— Тогда говори.'] },
    { text: '[Убеждение 12] Провести сход',
      hide: true, req: { quest: 'q_vigil', stage: 1 },
      check: { skill: 'ubezhdenie', dc: 12 },
      success: { lines: ['Люди встают. Кто-то впервые за смену смотрит прямо.'],
                 effects: { advanceQuest: 'q_vigil', xp: 30 } },
      fail: { lines: ['Сход расходится. Ты не удержал.'], effects: { hp: -3 } } },
    { text: '[Запугивание 12] Заставить слушать',
      hide: true, req: { quest: 'q_vigil', stage: 1 },
      check: { skill: 'zapugivanie', dc: 12 },
      success: { lines: ['Тишина. Хорошо. Теперь они услышат.'],
                 effects: { advanceQuest: 'q_vigil', xp: 30 } },
      fail: { lines: ['Кто-то смеётся в заднем ряду.'], effects: { hp: -3 } } },
    { text: '[Сход готов] Назвать правду в 18:00',
      hide: true, once: true, req: { fact: 'f_vigil_ready' },
      effects: { xp: 20, rep: { drevnie: 1 } },
      reply: ['— Сход готов. Станция услышит.'] },
    { text: '«Я пришёл».',
      hide: true, req: { quest: 'q_final', state: 'available' },
      effects: { startQuest: 'q_final', advanceQuest: 'q_final' },
      reply: ['— Перекличка начата. Назови версию.'] },
    { text: '[Убеждение 14] Пройти перекличку',
      hide: true, req: { quest: 'q_final', stage: 1 },
      check: { skill: 'ubezhdenie', dc: 14 },
      success: { lines: ['Ты удержал строй. Теперь назови это.'],
                 effects: { advanceQuest: 'q_final', xp: 60 } },
      fail: { lines: ['Строй отводит глаза. Ты всё равно должен назвать это.'],
              effects: { hp: -4, advanceQuest: 'q_final' } } },
    { text: '[Запугивание 14] Заставить слушать',
      hide: true, req: { quest: 'q_final', stage: 1 },
      check: { skill: 'zapugivanie', dc: 14 },
      success: { lines: ['Тишина. Хорошо. Теперь они услышат.'],
                 effects: { advanceQuest: 'q_final', xp: 60 } },
      fail: { lines: ['Кто-то смеётся в заднем ряду.'],
              effects: { hp: -4, advanceQuest: 'q_final' } } },
    { text: 'Назвать версию',
      hide: true, req: { quest: 'q_final', state: 'ready' },
      effects: { openQuest: 'q_final' },
      reply: ['— Говори. Станция слушает.'] },
    { text: 'Уйти', next: 'end' }
  ]
}

};

/* самодостаточное подключение: порядок скриптов больше не критичен */
function attach() {
if (!G.D) return false;
G.D.DIALOGUES = DIALOGUES;
return true;
}
G.AU_DIALOGUES = DIALOGUES;
if (!attach() && typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', attach);
}
if (typeof module !== 'undefined' && module.exports) module.exports = DIALOGUES;
})(typeof globalThis !== 'undefined' ? globalThis : this);
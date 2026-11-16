/*
 * AU MICROSCOPII — квесты.
 * Версия 2.5:
 *   q_sign   — 4 этапа, Бо (посредник), f_bo_tape открывает проход к архиву
 *   q_cargo  — 4 этапа, Клык (грузчик), f_vega_code открывает путь
 *   q_core   — 4 этапа, UNI-7 / Трейнер (посредник)
 *   q_b12    — 4 этапа, Пыль / узел (проводник)
 *   q_med    — 4 этапа, Ким / Бо (свидетель)
 *   q_tooth_deal — НОВЫЙ, Клык. Требует q_sign. Кросс с q_gt_audit
 *   q_lodge  — развилка A/B/C теперь открывает ТРИ РАЗНЫХ квеста
 */
(function (G) {
  'use strict';

  if (!G.D) {
    console.error('[data-quests.js] Загружен раньше data.js.');
    return;
  }

  G.D.QUESTS = {

    /* ===== ОСНОВНАЯ ЛИНИЯ ===== */

    q_mira: {
      title: 'Пропавшие чипы', line: 'main', act: 1, hero: null,
      where: 'loc_zhil', giver: 'Мира Ван',
      requires: {},
      unlock: ['admin'],
      stages: ['Поговорить с Мирой о пропавших чипах', 'Найти лог аудита в админ-блоке', 'Вернуться к Мире с логом'],
      hints: ['Мира ждёт в жилом секторе.', 'Архив — в админ-блоке.', 'Мира примет лог только из рук.'],
      branch: { A: 'Отдать лог Мире', B: 'Продать лог Ханне', C: 'Уничтожить лог' },
      branchInfo: { A: 'Мира закроет недостачу и запомнит.', B: 'Ханна заплатит.', C: 'Никто не узнает.' },
      rewards: {
        A: { item: 'bondo7', xp: 90, rep: { drevnie: 2 }, thread: 'A' },
        B: { item: 'chip_high', xp: 80, credits: 80, rep: { grailtech: 2 }, thread: 'B' },
        C: { item: 'nullcoin', xp: 100, rep: { ruki: 1 }, thread: 'C' }
      },
      next: ['q_sign', 'q_water']
    },

    q_sign: {
      title: 'Чужая подпись', line: 'main', act: 1, hero: null,
      where: 'loc_admin', giver: 'Ханна Гриффит',
      requires: { all: ['q_mira'] },
      unlock: ['server'],
      stages: [
        'Поговорить с Ханной',
        'Найти запись у Бо',
        'Сверить запись с архивом',
        'Вернуться к Ханне'
      ],
      hints: [
        'Ханна в админ-блоке. Она отказывается говорить, но упоминает «уборщика».',
        'Бо метёт коридор админ-блока. Он видел, как выносили чипы. С ним можно договориться.',
        'Архив — в админ-блоке. С записью Бо — Взлом 12 или Логика 12. Без — Взлом 14 или Логика 14.',
        'Ханна ждёт ответа. У неё есть три версии.'
      ],
      branch: { A: 'Обнародовать', B: 'Шантажировать', C: 'Скрыть' },
      branchInfo: {
        A: 'Приказ подписан за день до неё. Это уже не ошибка.',
        B: 'Ханна купит молчание — но запомнит цену.',
        C: 'Ты унесёшь подпись в себе. Как все остальные.'
      },
      branchReq: { B: { fact: 'f_sign' }, C: { fact: 'f_sign' } },
      rewards: {
        A: { item: 'filter', xp: 110, rep: { grailtech: -3, drevnie: 2 }, thread: 'A' },
        B: { item: 'chip_high', xp: 90, credits: 100, rep: { grailtech: 2 }, thread: 'B' },
        C: { item: 'calmstim', xp: 80, credits: 50, rep: { grailtech: 2 }, thread: 'C' }
      },
      next: ['q_core', 'q_cargo', 'q_tooth_deal']
    },

    q_node: {
      title: 'Узел MaskLink', line: 'main', act: 2, hero: null,
      where: 'loc_tech', giver: 'Алекса Шторм',
      requires: { all: ['q_mira'] },
      unlock: ['b12'],
      stages: ['Поговорить со Шторм', 'Найти код к узлу MaskLink', 'Вскрыть узел MaskLink'],
      hints: [
        'Шторм держит узел на техуровне.',
        'Код — у Трейнера (пройди «Военный совет») или Ренна («Тень Vega»), либо вскрыть самому.',
        'Вскрытие: Взлом 12 или Драка 12. Провал — бой.'
      ],
      branch: { A: 'Оставить связь', B: 'Забрать чип', C: 'Сломать узел' },
      branchInfo: { A: 'Связь останется у людей.', B: 'Чип дороже связи.', C: 'Только тишина.' },
      rewards: {
        A: { item: 'bondo7', xp: 90, rep: { ruki: 2 }, thread: 'A', facts: ['f_node_done'] },
        B: { item: 'chip_high', xp: 90, credits: 80, rep: { grailtech: 1 }, thread: 'B', facts: ['f_node_done'] },
        C: { item: 'nullcoin', xp: 100, rep: { fraktal: 2 }, thread: 'C', facts: ['f_node_done'] }
      },
      next: ['q_ore', 'q_hands_sabotage', 'q_b12']
    },

    q_ore: {
      title: 'Руда X-34R', line: 'main', act: 2, hero: null,
      where: 'loc_mine', giver: 'Пыль',
      requires: { all: ['q_mira'] },
      unlock: ['b12'],
      stages: ['Спуститься в шахты', 'Отбить четвёртый горизонт'],
      hints: ['Пыль у входа в шахты.', 'Горизонт держат дроны.'],
      branch: { A: 'Сдать GrailTech', B: 'Отдать Рукам Праха', C: 'Оставить себе' },
      branchInfo: { A: 'GrailTech закроет горизонт.', B: 'Руки Праха пустят руду на дело.', C: 'Ты вынесешь руду сам.' },
      rewards: {
        A: { item: 'chip_low', xp: 90, credits: 120, rep: { grailtech: 2 }, thread: 'B', facts: ['f_ore_done'] },
        B: { item: 'bondo7', xp: 100, rep: { ruki: 3 }, thread: 'A', facts: ['f_ore_done'] },
        C: { item: 'arcpen', xp: 100, credits: 80, rep: { ruki: -1 }, thread: 'C', facts: ['f_ore_done'] }
      },
      next: ['q_cargo', 'q_b12', 'q_ruki_arsenal']
    },

    q_cargo: {
      title: 'Груз Ренна', line: 'main', act: 2, hero: null,
      where: 'loc_dock', giver: 'Джеймс Ренн',
      requires: { all: ['q_sign'] },
      stages: [
        'Поговорить с Ренном',
        'Найти грузчика-свидетеля',
        'Вскрыть ящик'
      ],
      hints: [
        'Ренн у шаттла, но он не откроет ящик без причины.',
        'Клык видел, что грузили в ящик. Он в ангаре. Или вскрой сам: Взлом 14.',
        'Замок ящика: Взлом 12 или Запугивание 14. Или просто отдай Ренну.'
      ],
      branch: { A: 'Отдать Ренну', B: 'Спасти пассажира', C: 'Открыть всем' },
      branchInfo: { A: 'Vega получит своё.', B: 'В ящике живой человек.', C: 'Станция увидит правду.' },
      branchReq: { B: { fact: 'f_passenger' }, C: { fact: 'f_passenger' } },
      rewards: {
        A: { item: 'arcpen', xp: 90, credits: 100, rep: { grailtech: 2 }, thread: 'C' },
        B: { item: 'medcard', xp: 110, rep: { drevnie: 2, lozha: 1 }, thread: 'A' },
        C: { item: 'log', xp: 100, credits: 60, rep: { lozha: 2 }, thread: 'B' }
      },
      next: ['q_vega_shadow', 'q_kovcheg', 'q_garik']
    },

    q_core: {
      title: 'Ядро GrailOS', line: 'main', act: 2, hero: null,
      where: 'loc_server', giver: 'Нейро-Куратор',
      requires: { all: ['q_sign'] },
      stages: [
        'Войти в серверную',
        'Найти посредника для подключения',
        'Подключиться к ядру'
      ],
      hints: [
        'Серверная за вторым чипом.',
        'UNI-7 (медблок) проведёт без взлома. Или Трейнер знает старый протокол. Или вскрой сам: Взлом 14 / Логика 14.',
        'Ядро слушает. Подключайся.'
      ],
      branch: { A: 'Открыть журнал', B: 'Скачать данные', C: 'Отключить' },
      branchInfo: { A: 'Журнал покажет, кто был в перекличке.', B: 'BlackDrive — данные, за которые платят.', C: 'Ядро замолчит.' },
      rewards: {
        A: { item: 'medcard', xp: 100, rep: { fraktal: 1 }, thread: 'A' },
        B: { item: 'blackdrive', xp: 100, credits: 120, rep: { lozha: 2 }, thread: 'B' },
        C: { item: 'chip_high', xp: 110, rep: { grailtech: -2 }, thread: 'C' }
      },
      next: ['q_fractal_uni', 'q_final', 'q_noa']
    },

    q_b12: {
      title: 'Сектор B-12', line: 'main', act: 2, hero: null,
      where: 'loc_b12', giver: 'Селия Дрин',
      requires: { any: ['q_ore', 'q_node'] },
      stages: [
        'Пройти в B-12',
        'Найти проводника',
        'Встретить Селию'
      ],
      hints: [
        'B-12 открывается фильтром (у Кима или Ханны) или чипом.',
        'Пыль знает, как пройти мимо Стражей. Или через узел: Взлом 14.',
        'Селия ждёт у мха. Роща — ниже.'
      ],
      branch: { A: 'Заключить пакт', B: 'Взять образец', C: 'Обнародовать' },
      branchInfo: { A: 'Древние получат станцию.', B: 'Образец стоит дорого.', C: 'Правда о B-12 выйдет наружу.' },
      rewards: {
        A: { item: 'sylva', xp: 100, rep: { drevnie: 3 }, thread: 'B' },
        B: { item: 'sylva', xp: 100, credits: 80, rep: { drevnie: -2 }, thread: 'C' },
        C: { item: 'blackdrive', xp: 110, rep: { drevnie: -3 }, thread: 'A' }
      },
      next: ['q_med', 'q_selin']
    },
	
    q_med: {
      title: 'Протокол UNI-7', line: 'main', act: 2, hero: null,
      where: 'loc_med', giver: 'UNI-7',
      requires: { all: ['q_b12'] },
      stages: [
        'Поговорить с UNI-7',
        'Найти свидетеля сбоев',
        'Разобрать протокол'
      ],
      hints: [
        'UNI-7 в медблоке. Он теряет себя по кускам.',
        'Ким в столовой видел сбои. Бо в админ-блоке — тоже.',
        'Протокол вскрывается Интуицией 12 или Логикой 12.'
      ],
      branch: { A: 'Восстановить', B: 'Стереть', C: 'Освободить' },
      branchInfo: { A: 'UNI-7 снова будет помнить. Всё.', B: 'Чистый протокол. Чистый инструмент.', C: 'Он уйдёт из системы.' },
      rewards: {
        A: { item: 'bondo7', xp: 100, rep: { fraktal: 2 }, thread: 'B' },
        B: { item: 'chip_high', xp: 90, rep: { grailtech: 1 }, thread: 'C' },
        C: { item: 'medcard', xp: 110, rep: { fraktal: 3 }, thread: 'A' }
      },
      next: ['q_kovcheg', 'q_noa', 'q_fractal_uni']
    },
	
    q_kovcheg: {
      title: 'Долг Кима', line: 'main', act: 2, hero: null,
      where: 'loc_canteen', giver: 'Даниэль Ким',
      requires: { all: ['q_cargo'] },
      stages: ['Взять дело у Кима', 'Доставить пакет в ангар'],
      hints: ['Ким в столовой.', 'Пакет ждёт в ангаре.'],
      branch: { A: 'Заплатить долг', B: 'Помочь с контрабандой', C: 'Сдать GrailTech' },
      branchInfo: { A: 'Ким забудет твой долг.', B: 'Ковчег получит канал.', C: 'GrailTech получит Кима.' },
      rewards: {
        A: { item: 'medgel', xp: 90, rep: { kovcheg: 2 }, thread: 'C', facts: ['f_kovcheg_done'] },
        B: { item: 'manifest', xp: 100, credits: 100, rep: { kovcheg: 3 }, thread: 'B', facts: ['f_kovcheg_done'] },
        C: { item: 'chip_low', xp: 100, rep: { kovcheg: -3, grailtech: 2 }, thread: 'A', facts: ['f_kovcheg_done'] }
      },
      next: ['q_lodge', 'q_ark_smuggle', 'q_kovcheg_ledger']
    },

    q_lodge: {
      title: 'Голос в эфире', line: 'main', act: 2, hero: null,
      where: 'loc_dock', giver: 'Оператор «Голос»',
      requires: { all: ['q_kovcheg'] },
      stages: ['Настроить радио в ангаре', 'Встретить Голоса'],
      hints: ['Радио в ангаре.', 'Голос выйдет на связь.'],
      branch: { A: 'Выйти в эфир', B: 'Молчать', C: 'Сделка с Ложей' },
      branchInfo: {
        A: 'Станция услышит правду. Откроется «Частота Ложи».',
        B: 'Тишина — тоже сообщение. Откроется «Кто такой Ватчер».',
        C: 'Ложа получит канал. Откроется «Архив Ложи».'
      },
      rewards: {
        A: { item: 'seal', xp: 100, rep: { lozha: 3 }, thread: 'A' },
        B: { xp: 90, credits: 120, rep: { lozha: 1 }, thread: 'C' },
        C: { item: 'blackdrive', xp: 100, rep: { lozha: 2 }, thread: 'B' }
      },
      next: ['q_lodge_voice', 'q_watcher_truth', 'q_lodge_archive', 'q_final']
    },

    q_final: {
      title: 'Перекличка', line: 'main', act: 3, hero: null,
      where: 'loc_airlock', giver: 'Шлюз',
      requires: { all: ['q_sign'], any: ['q_node', 'q_ore', 'q_cargo', 'q_core', 'q_b12', 'q_med', 'q_kovcheg', 'q_lodge'], minAny: 3 },
      stages: ['Прийти в шлюз', 'Пройти перекличку'],
      hints: ['Шлюз открыт в 18:00.', 'Перекличка — Убеждение 14 или Запугивание 14.'],
      branch: { A: 'Назвать правдой', B: 'Назвать сделкой', C: 'Назвать молчанием' },
      branchInfo: { A: 'Станция услышит всё.', B: 'Ты назовёшь цену.', C: 'Ты не скажешь ничего.' },
      rewards: {
        A: { xp: 220, rep: { drevnie: 2 }, thread: 'A' },
        B: { xp: 200, credits: 150, rep: { grailtech: 2 }, thread: 'B' },
        C: { xp: 200, rep: { lozha: 2 }, thread: 'C' }
      },
      next: []
    },

    /* ===== РАСШИРЕНИЕ: MAIN ===== */

    q_water: {
      title: 'Вода по расписанию', line: 'main', act: 1, hero: null,
      where: 'loc_zhil', giver: 'Мира Ван',
      requires: { all: ['q_mira'] },
      stages: ['Поговорить с Мирой о воде', 'Найти причину перебоев'],
      hints: [
        'Мира в жилом секторе.',
        'Три пути: взломать клапан самому, спросить Кима (нужно закрыть «Долг Кима»), или узнать у Пыли в шахтах (нужно закрыть «Руду X-34R»).'
      ],
      branch: { A: 'Вернуть воду жилым', B: 'Продать жетоны Ковчегу', C: 'Забрать всё себе' },
      branchInfo: { A: 'Жилой сектор получит воду.', B: 'Ковчег начнёт возить воду в обход.', C: 'Никто не получит. Кроме тебя.' },
      rewards: {
        A: { item: 'bondo7', xp: 70, rep: { drevnie: 1, grailtech: -1 }, thread: 'A', fact: 'f_water_public' },
        B: { credits: 80, xp: 60, rep: { kovcheg: 2, grailtech: -1 }, thread: 'B', fact: 'f_water_black' },
        C: { item: 'ration_card', xp: 60, rep: { drevnie: -1, grailtech: -1 }, thread: 'C', fact: 'f_water_selfish' }
      },
      next: []
    },

    q_vigil: {
      title: 'Подготовка к перекличке', line: 'main', act: 3, hero: null,
      where: 'loc_airlock', giver: 'Мира Ван',
      requires: { all: ['q_sign'], any: ['q_node', 'q_ore', 'q_cargo', 'q_core', 'q_b12', 'q_med', 'q_kovcheg', 'q_lodge'], minAny: 2 },
      stages: ['Найти союзников', 'Провести сход'],
      hints: ['Мира у шлюза.', 'Сход — Убеждение или Запугивание 12.'],
      branch: { A: 'Назвать правду', B: 'Назвать сделку', C: 'Назвать молчание' },
      branchInfo: { A: 'Люди услышат правду.', B: 'Ковчег получит канал.', C: 'Никто не назовёт ничего.' },
      rewards: {
        A: { xp: 60, rep: { drevnie: 2 }, thread: 'A', fact: 'f_vigil_ready' },
        B: { xp: 60, credits: 60, rep: { kovcheg: 2 }, thread: 'B', fact: 'f_vigil_split' },
        C: { xp: 60, rep: { lozha: 2 }, thread: 'C', fact: 'f_vigil_silent' }
      },
      next: []
    },

    q_hands_sabotage: {
      title: 'Заряд Рук Праха', line: 'main', act: 2, hero: null,
      where: 'loc_tech', giver: 'Алекса Шторм',
      requires: { all: ['q_node'] },
      stages: ['Взять заряд у Шторм', 'Выслушать план Шторм', 'Заложить заряд в шахтах', 'Доложить Шторм'],
      hints: [
        'Шторм на техуровне.',
        'Шторм ждёт, что ты выслушаешь план.',
        'Заряд ставится на четвёртом горизонте. Взлом 12. Или — отнеси его Рико в шахты, или Ханне в админ-блок.',
        'Шторм ждёт у узла.'
      ],
      failText: 'Шторм больше не доверяет тебе. Дело провалено — но другие это запомнили.',
      branch: { A: 'Взорвать реактор', B: 'Эвакуировать', C: 'Отказаться' },
      branchInfo: { A: 'Реактор ляжет. Руки Праха получат станцию.', B: 'Ты предупредишь людей и уйдёшь.', C: 'Заряд останется у тебя.' },
      rewards: {
        A: { item: 'detonator', xp: 90, rep: { ruki: 3, grailtech: -3 }, thread: 'A' },
        B: { xp: 90, rep: { ruki: 1, drevnie: 1 }, thread: 'B' },
        C: { xp: 80, rep: { ruki: -2, grailtech: 1 }, thread: 'C' }
      },
      next: []
    },

    /* ===== НОВЫЙ: КЛЫК ===== */

    q_tooth_deal: {
      title: 'Услуга Клыка', line: 'faction', act: 2, hero: null,
      where: 'loc_dock', giver: 'Клык',
      requires: { all: ['q_sign'] },
      stages: [
        'Поговорить с Клыком',
        'Провести груз мимо таможни',
        'Вернуться к Клыку'
      ],
      hints: [
        'Клык в ангаре. Он не торгует информацией бесплатно.',
        'Груз у шлюза. Поговори с Ренном в ангаре: Взлом 12 / Убеждение 14 / Запугивание 12.',
        'Клык ждёт подтверждения. Вернись к нему.'
      ],
      failText: 'Клык больше не имеет с тобой дел. Услуга не оплачена.',
      branch: { A: 'Заплатить Ханне', B: 'Обмануть Ханну', C: 'Сдать Клыка' },
      branchInfo: {
        A: 'Ханна получит пошлину. Клык — свой.',
        B: 'Груз уйдёт в обход. Клык — в тени.',
        C: 'Ханна арестует Клыка. Ты — чист.'
      },
      rewards: {
        A: { xp: 90, credits: 50, rep: { kovcheg: 2, grailtech: 1 }, thread: 'B', fact: 'f_tooth_paid' },
        B: { xp: 90, credits: 150, rep: { kovcheg: 1, ruki: -1 }, thread: 'C', fact: 'f_tooth_cheated' },
        C: { xp: 100, credits: 80, rep: { grailtech: 3, kovcheg: -2 }, thread: 'A', fact: 'f_tooth_reported' }
      },
      next: []
    },

    /* ===== ЛИЧНЫЕ ЛИНИИ ===== */

    q_noa: {
      title: 'Дочь', line: 'personal', act: 2, hero: 'noa',
      where: 'loc_med', giver: 'UNI-7',
      requires: { all: ['q_med'], any: ['q_core', 'q_fractal_uni'] },
      stages: ['Найти след дочери в архиве', 'Встретить проекцию Куратора', 'Узнать, что с ней сделали'],
      hints: ['UNI-7 помнит её голос.', 'Куратор в серверной.', 'Ответ — в BlackDrive.'],
      branch: { A: 'Вытащить', B: 'Оставить', C: 'Обнародовать' },
      branchInfo: { A: 'Ты вернёшь её тело.', B: 'Она живёт в ядре.', C: 'Станция узнает правду.' },
      branchReq: { A: { fact: 'f_daughter' }, B: { fact: 'f_daughter' } },
      rewards: {
        A: { item: 'blackdrive', xp: 140, rep: { fraktal: -2 }, thread: 'A' },
        B: { item: 'chip_high', xp: 140, rep: { fraktal: 2 }, thread: 'B' },
        C: { item: 'medcard', xp: 140, rep: { fraktal: -3, drevnie: 2 }, thread: 'C' }
      },
      next: ['q_noa_2']
    },

    q_selin: {
      title: 'Архив B-12', line: 'personal', act: 2, hero: 'selin',
      where: 'loc_b12', giver: 'Селия Дрин',
      requires: { all: ['q_b12'], any: ['q_ore'] },
      stages: ['Открыть архив B-12', 'Расшифровать записи', 'Спросить Селию'],
      hints: ['Архив за мхом.', 'Логика 12.', 'Селия знает больше, чем говорит.'],
      branch: { A: 'Опубликовать', B: 'Обменять', C: 'Уничтожить' },
      branchInfo: { A: 'Правда станет общим достоянием.', B: 'Ты обменяешь её на допуск.', C: 'Записи исчезнут.' },
      rewards: {
        A: { item: 'filter', xp: 140, rep: { drevnie: -2 }, thread: 'A' },
        B: { item: 'chip_high', xp: 140, credits: 100, rep: { grailtech: 2 }, thread: 'B' },
        C: { item: 'calmstim', xp: 140, rep: { drevnie: 2 }, thread: 'C' }
      },
      next: ['q_selin_2']
    },

    q_garik: {
      title: 'Тёмный груз', line: 'personal', act: 2, hero: 'garik',
      where: 'loc_dock', giver: 'Джеймс Ренн',
      requires: { all: ['q_cargo'], any: ['q_kovcheg'] },
      stages: ['Вскрыть свой груз', 'Выйти на Вегу', 'Понять, кому он служит'],
      hints: ['Ящик в ангаре.', 'Передатчик Веги на техуровне.', 'Манифест назовёт заказчика.'],
      branch: { A: 'Довезти', B: 'Продать', C: 'Сдать пассажира' },
      branchInfo: { A: 'Ты довезёшь груз.', B: 'Ты продашь его.', C: 'Пассажир снова станет товаром.' },
      rewards: {
        A: { item: 'arcpen', xp: 140, rep: { kovcheg: 2 }, thread: 'A' },
        B: { xp: 140, credits: 150, rep: { kovcheg: 1, grailtech: 1 }, thread: 'B' },
        C: { item: 'chip_high', xp: 140, rep: { grailtech: 2 }, thread: 'C' }
      },
      next: ['q_garik_2']
    },

    q_noa_2: {
      title: 'Осколки', line: 'personal', act: 3, hero: 'noa',
      where: 'loc_med', giver: 'UNI-7',
      requires: { all: ['q_noa'], questBranch: { id: 'q_noa', branch: 'A' } },
      stages: ['Решить судьбу дочери', 'Найти способ', 'Сделать выбор'],
      hints: ['Ты вытащил её тело. Теперь — что с ним делать.', 'UNI-7 в медблоке.', 'Выбор — здесь.'],
      branch: { A: 'Оставить с собой', B: 'Отдать UNI-7', C: 'Отпустить' },
      branchInfo: { A: 'Она будет рядом. Но не свободна.', B: 'UNI-7 позаботится.', C: 'Она уйдёт. Совсем.' },
      rewards: {
        A: { xp: 120, rep: { fraktal: -2 }, thread: 'A', fact: 'f_noa_rescued' },
        B: { xp: 120, rep: { fraktal: 2 }, thread: 'B', fact: 'f_noa_left' },
        C: { xp: 120, rep: { fraktal: -1, lozha: 1 }, thread: 'C', fact: 'f_noa_released' }
      },
      next: []
    },

    q_selin_2: {
      title: 'Сад', line: 'personal', act: 3, hero: 'selin',
      where: 'loc_b12', giver: 'Селия Дрин',
      requires: { all: ['q_selin'], questBranch: { id: 'q_selin', branch: 'C' } },
      stages: ['Спуститься в рощу', 'Посадить семя'],
      hints: ['Селия в B-12.', 'Посадка — Интуиция 12.'],
      branch: { A: 'Посадить сад', B: 'Продать семя', C: 'Уничтожить' },
      branchInfo: { A: 'Мох прорастёт по всей станции.', B: 'GrailTech заплатит за семя.', C: 'Роща не переживёт.' },
      rewards: {
        A: { item: 'seed_pod', xp: 120, rep: { drevnie: 3, grailtech: -2 }, thread: 'A', fact: 'f_selin_garden' },
        B: { xp: 120, credits: 200, rep: { grailtech: 2, drevnie: -3 }, thread: 'B' },
        C: { xp: 120, rep: { drevnie: -2, grailtech: 1 }, thread: 'C' }
      },
      next: []
    },

    q_garik_2: {
      title: 'Старый долг', line: 'personal', act: 3, hero: 'garik',
      where: 'loc_dock', giver: 'Джеймс Ренн',
      requires: { all: ['q_garik'], questBranch: { id: 'q_garik', branch: 'A' } },
      stages: ['Узнать, кто ищет', 'Встретить Вегу'],
      hints: ['Ренн в ангаре.', 'Встреча — Запугивание 14 или бой.'],
      branch: { A: 'Заплатить', B: 'Сбежать', C: 'Встать против Веги' },
      branchInfo: { A: 'Долг закрыт.', B: 'Шаттл уйдёт. Ты — с ним.', C: 'Вега узнает, кто ты.' },
      rewards: {
        A: { xp: 120, credits: -80, rep: { grailtech: 1 }, thread: 'C', fact: 'f_garik_paid' },
        B: { xp: 120, rep: { lozha: 2 }, thread: 'C' },
        C: { xp: 120, rep: { grailtech: -3, kovcheg: 2 }, thread: 'A' }
      },
      next: []
    },

    /* ===== ФРАКЦИОННЫЕ ===== */

    q_gt_audit: {
      title: 'Аудит GrailTech', line: 'faction', act: 2, hero: null,
      where: 'loc_admin', giver: 'Ханна Гриффит',
      requires: { all: ['q_sign'] },
      stages: ['Взять аудит у Ханны', 'Собрать три лога', 'Вернуться к Ханне'],
      hints: ['Ханна в админ-блоке.', 'Логи в архиве, серверной и шахтах.'],
      branch: { A: 'Обнародовать', B: 'Замять', C: 'Продать' },
      branchInfo: { A: 'Недостача станет публичной.', B: 'Бумаги исчезнут.', C: 'Клык заплатит за цифры.' },
      rewards: {
        A: { xp: 80, rep: { grailtech: -2, drevnie: 1 }, thread: 'A' },
        B: { xp: 80, credits: 80, rep: { grailtech: 2 }, thread: 'C' },
        C: { item: 'chip_high', xp: 80, credits: 120, rep: { grailtech: -1, kovcheg: 1 }, thread: 'B' }
      },
      next: []
    },

    q_ruki_arsenal: {
      title: 'Арсенал', line: 'faction', act: 2, hero: null,
      where: 'loc_mine', giver: 'Рико «Пламя»',
      requires: { anyFailed: ['q_hands_sabotage'] },
      stages: ['Найти Рико в шахтах', 'Вскрыть арсенал'],
      hints: ['Рико в шахтах.', 'Арсенал под третьим горизонтом. Взлом 12 или Запугивание 12.'],
      branch: { A: 'Отдать Шторм', B: 'Сдать GrailTech', C: 'Оставить себе' },
      branchInfo: { A: 'Шторм простит тебя.', B: 'GrailTech получит арсенал.', C: 'Никто не узнает.' },
      rewards: {
        A: { xp: 90, rep: { ruki: 5, grailtech: -1 }, thread: 'A', fact: 'f_arsenal_loc' },
        B: { xp: 90, credits: 150, rep: { grailtech: 2, ruki: -3 }, thread: 'B' },
        C: { item: 'pulserifle', xp: 100, rep: { ruki: -1 }, thread: 'C' }
      },
      next: []
    },

    q_grailtech_purge: {
      title: 'Зачистка', line: 'faction', act: 2, hero: null,
      where: 'loc_admin', giver: 'Ханна Гриффит',
      requires: { anyFailed: ['q_hands_sabotage'] },
      stages: ['Поговорить с Ханной', 'Найти доказательства против Шторм', 'Решить судьбу техуровня'],
      hints: ['Ханна в админ-блоке.', 'Доказательства — в шахтах у Пыли или у Рико.', 'Реши, что делать с техуровнем.'],
      branch: { A: 'Сдать Шторм', B: 'Предупредить', C: 'Скрыть' },
      branchInfo: { A: 'Техуровень зачистят.', B: 'Шторм скроется.', C: 'Ты не назовёшь никого.' },
      rewards: {
        A: { xp: 100, credits: 150, rep: { grailtech: 3, ruki: -3 }, thread: 'B', fact: 'f_purge_done' },
        B: { xp: 100, rep: { ruki: 2, grailtech: -2 }, thread: 'A' },
        C: { xp: 80, rep: { lozha: 1 }, thread: 'C' }
      },
      next: []
    },

    q_ark_smuggle: {
      title: 'Ящик Ковчега', line: 'faction', act: 2, hero: null,
      where: 'loc_canteen', giver: 'Даниэль Ким',
      requires: { all: ['q_kovcheg'] },
      stages: ['Взять ящик у Кима', 'Провести через шлюз', 'Закрыть канал'],
      hints: ['Ким в столовой.', 'Шлюз в конце ангара.'],
      branch: { A: 'Продать Клыку', B: 'Отдать пассажиру', C: 'Шантажировать Кима' },
      branchInfo: { A: 'Клык даст цену.', B: 'В ящике не товар.', C: 'Ким заплатит за молчание.' },
      rewards: {
        A: { xp: 80, credits: 120, rep: { kovcheg: 2 }, thread: 'B' },
        B: { item: 'manifest', xp: 90, rep: { kovcheg: -1, drevnie: 2 }, thread: 'A' },
        C: { item: 'chip_low', xp: 80, credits: 80, rep: { kovcheg: -2 }, thread: 'C' }
      },
      next: []
    },

    q_ancients_grove: {
      title: 'Роща', line: 'faction', act: 2, hero: null,
      where: 'loc_b12', giver: 'Селия Дрин',
      requires: { all: ['q_b12'] },
      stages: ['Спуститься в рощу', 'Взять образец', 'Вернуться к Селии'],
      hints: ['Роща ниже B-12.', 'Интуиция 12.'],
      branch: { A: 'Отдать Селии', B: 'Сжечь', C: 'Принять симбиот' },
      branchInfo: { A: 'Селия продолжит работу.', B: 'Роща не переживёт.', C: 'Ты станешь частью Древних.' },
      rewards: {
        A: { item: 'sylva', xp: 90, rep: { drevnie: 2 }, thread: 'B' },
        B: { xp: 90, rep: { drevnie: -3, grailtech: 2 }, thread: 'C' },
        C: { xp: 100, rep: { drevnie: 3, grailtech: -1 }, thread: 'A' }
      },
      next: []
    },

    q_lodge_voice: {
      title: 'Частота Ложи', line: 'faction', act: 2, hero: null,
      where: 'loc_dock', giver: 'Оператор «Голос»',
      requires: { all: ['q_lodge'], questBranch: { id: 'q_lodge', branch: 'A' } },
      stages: ['Починить антенну', 'Выйти на частоту', 'Закрыть частоту'],
      hints: ['Антенна в ангаре.', 'Логика 12.'],
      branch: { A: 'Сказать правду', B: 'Сказка для станции', C: 'Глушить' },
      branchInfo: { A: 'Станция услышит настоящий голос.', B: 'Ложь спасёт смену.', C: 'Частота умрёт.' },
      rewards: {
        A: { item: 'seal', xp: 90, rep: { lozha: 2 }, thread: 'A' },
        B: { xp: 90, credits: 100, rep: { lozha: 1 }, thread: 'B' },
        C: { xp: 80, rep: { lozha: -2 }, thread: 'C' }
      },
      next: []
    },

    q_fractal_uni: {
      title: 'Фрактал: выбор UNI-7', line: 'faction', act: 2, hero: null,
      where: 'loc_server', giver: 'Нейро-Куратор',
      requires: { all: ['q_core'], any: ['q_med'] },
      stages: ['Подключить UNI-7 к ядру', 'Выбрать режим', 'Проверить, что осталось'],
      hints: ['Ядро в серверной.', 'Взлом 14.'],
      branch: { A: 'Слить', B: 'Изолировать', C: 'Освободить' },
      branchInfo: { A: 'UNI-7 станет частью Куратора.', B: 'Он останется собой.', C: 'Он уйдёт в сеть.' },
      rewards: {
        A: { xp: 90, rep: { fraktal: 3 }, thread: 'B' },
        B: { xp: 90, rep: { fraktal: 1 }, thread: 'C' },
        C: { item: 'blackdrive', xp: 100, rep: { fraktal: -2 }, thread: 'A' }
      },
      next: []
    },

    q_vega_shadow: {
      title: 'Тень Vega', line: 'faction', act: 2, hero: null,
      where: 'loc_dock', giver: 'Джеймс Ренн',
      requires: { all: ['q_cargo'] },
      stages: ['Проследить сигнал', 'Вскрыть передатчик', 'Замести след'],
      hints: ['Сигнал из ангара.', 'Взлом 12.'],
      branch: { A: 'Сдать Вегу', B: 'Сделка', C: 'Сжечь след' },
      branchInfo: { A: 'GrailTech узнает про Вегу.', B: 'Вега заплатит.', C: 'Следов не останется.' },
      rewards: {
        A: { xp: 90, rep: { grailtech: 2 }, thread: 'A', facts: ['f_vega_code'] },
        B: { xp: 90, credits: 150, rep: { grailtech: -1, lozha: 1 }, thread: 'B', facts: ['f_vega_code'] },
        C: { xp: 80, rep: { lozha: 2 }, thread: 'C', facts: ['f_vega_code'] }
      },
      next: []
    },

    q_rico_ash: {
      title: 'Пепел', line: 'faction', act: 2, hero: null,
      where: 'loc_mine', giver: 'Рико «Пламя»',
      requires: { all: ['q_ore'] },
      stages: ['Найти Рико в шахтах', 'Выбрать сторону', 'Уйти из шахт'],
      hints: ['Рико на третьем горизонте.', 'Он не любит GrailTech.'],
      branch: { A: 'Встать с Руками', B: 'Остановить', C: 'Уйти' },
      branchInfo: { A: 'Шахты станут крепостью.', B: 'Рико остановится.', C: 'Это не твоя война.' },
      rewards: {
        A: { xp: 90, rep: { ruki: 3, grailtech: -2 }, thread: 'A' },
        B: { xp: 90, rep: { ruki: -2, grailtech: 1 }, thread: 'B' },
        C: { item: 'medgel', xp: 70, rep: { lozha: 1 }, thread: 'C' }
      },
      next: []
    },

    q_trainer_war: {
      title: 'Военный совет', line: 'faction', act: 2, hero: null,
      where: 'loc_tech', giver: 'Трейнер',
      requires: { all: ['q_mira'] },
      stages: ['Выслушать Трейнера', 'Провести смотр', 'Закрыть смотр'],
      hints: ['Трейнер на техуровне.', 'Смотр — Убеждение или Запугивание 12.'],
      branch: { A: 'Сделка с Ares', B: 'Ополчение', C: 'Саботаж' },
      branchInfo: { A: 'Ares даст оружие.', B: 'Люди встанут сами.', C: 'Арсенал не достанется никому.' },
      rewards: {
        A: { xp: 90, credits: 100, rep: { ruki: 1, grailtech: 2 }, thread: 'B', facts: ['f_trainer_code'] },
        B: { xp: 90, rep: { ruki: 2, drevnie: 1 }, thread: 'A', facts: ['f_trainer_code'] },
        C: { xp: 90, rep: { grailtech: 2, ruki: -2 }, thread: 'C', facts: ['f_trainer_code'] }
      },
      next: []
    },

    q_talbot_deal: {
      title: 'Сделка с Тэлботом', line: 'faction', act: 2, hero: null,
      where: 'loc_admin', giver: 'Алекс Тэлбот',
      requires: { all: ['q_sign'] },
      stages: ['Встретить Тэлбота', 'Выслушать предложение', 'Дать ответ'],
      hints: ['Тэлбот в админ-блоке.', 'Он говорит только с теми, кто видел подпись.'],
      branch: { A: 'Служить GrailTech', B: 'Шантаж', C: 'Отказать' },
      branchInfo: { A: 'Ты получишь допуск.', B: 'Тэлбот заплатит.', C: 'Он это запомнит.' },
      rewards: {
        A: { item: 'chip_high', xp: 90, rep: { grailtech: 3 }, thread: 'C' },
        B: { xp: 90, credits: 150, rep: { grailtech: -1 }, thread: 'B' },
        C: { xp: 100, rep: { grailtech: -3, drevnie: 2 }, thread: 'A' }
      },
      next: []
    },

    q_watcher_truth: {
      title: 'Кто такой Ватчер', line: 'faction', act: 2, hero: null,
      where: 'loc_dock', giver: 'The Watcher',
      requires: { all: ['q_lodge'], questBranch: { id: 'q_lodge', branch: 'B' } },
      stages: ['Найти Ватчера', 'Спросить, кто он', 'Решить, что делать'],
      hints: ['Ватчер ждёт в ангаре.', 'Он ответит, если ты слышал Голоса.'],
      branch: { A: 'Обнародовать', B: 'Вступить', C: 'Стереть' },
      branchInfo: { A: 'Ложа потеряет лицо.', B: 'Ты станешь её частью.', C: 'Ватчер исчезнет.' },
      rewards: {
        A: { xp: 90, rep: { lozha: -2, drevnie: 1 }, thread: 'A' },
        B: { item: 'seal', xp: 90, rep: { lozha: 3 }, thread: 'B' },
        C: { xp: 80, rep: { lozha: 1 }, thread: 'C' }
      },
      next: []
    },

    q_kovcheg_ledger: {
      title: 'Гроссбух Ковчега', line: 'faction', act: 2, hero: null,
      where: 'loc_canteen', giver: 'Даниэль Ким',
      requires: { all: ['q_kovcheg'], questBranch: { id: 'q_water', branch: 'B' } },
      stages: ['Забрать гроссбух у Кима', 'Расшифровать записи'],
      hints: ['Ким в столовой.', 'Гроссбух под стойкой. Логика 12.'],
      branch: { A: 'Вернуть Киму', B: 'Продать Тэлботу', C: 'Сжечь' },
      branchInfo: { A: 'Ковчег продолжит дело.', B: 'GrailTech получит список.', C: 'Никто не узнает.' },
      rewards: {
        A: { item: 'ledger_kov', xp: 80, rep: { kovcheg: 2 }, thread: 'B', fact: 'f_ledger_kov' },
        B: { xp: 80, credits: 150, rep: { kovcheg: -2, grailtech: 2 }, thread: 'A' },
        C: { xp: 80, rep: { kovcheg: -1, lozha: 1 }, thread: 'C' }
      },
      next: []
    },

    q_lodge_archive: {
      title: 'Архив Ложи', line: 'faction', act: 2, hero: null,
      where: 'loc_dock', giver: 'Оператор «Голос»',
      requires: { all: ['q_lodge'], questBranch: { id: 'q_lodge', branch: 'C' } },
      stages: ['Найти архив в ангаре', 'Сверить переклички'],
      hints: ['Архив за антенной.', 'Логика 12.'],
      branch: { A: 'Опубликовать', B: 'Отдать Ватчеру', C: 'Уничтожить' },
      branchInfo: { A: 'Станция узнает.', B: 'Ватчер сохранит.', C: 'Сорок лет исчезнут.' },
      rewards: {
        A: { item: 'archive_lodge', xp: 80, rep: { lozha: -2, drevnie: 1 }, thread: 'A', fact: 'f_lodge_arch' },
        B: { xp: 80, rep: { lozha: 2 }, thread: 'B', fact: 'f_lodge_arch' },
        C: { xp: 80, credits: 100, rep: { lozha: -1 }, thread: 'C' }
      },
      next: []
    },

    q_fractal_vessel: {
      title: 'Сосуд для Куратора', line: 'faction', act: 2, hero: null,
      where: 'loc_server', giver: 'Нейро-Куратор',
      requires: { all: ['q_core'] },
      stages: ['Найти компонент сосуда', 'Установить в ядро'],
      hints: [
        'Куратор в серверной. Компонент у Куратора-надзирателя.',
        'Три пути: взлом 14 (риск, но быстро), через Трейнера (если есть его код), через UNI-7 (если он с тобой). Провал одного не блокирует остальные.'
      ],
      branch: { A: 'Собрать сосуд', B: 'Сорвать сборку', C: 'Продать деталь' },
      branchInfo: { A: 'Куратор получит тело.', B: 'Куратор останется без тела.', C: 'Деталь уйдёт тому, кто заплатит.' },
      rewards: {
        A: { item: 'vessel_part', xp: 90, rep: { fraktal: 3 }, thread: 'B', fact: 'f_vessel_core' },
        B: { xp: 90, rep: { fraktal: -2, drevnie: 2 }, thread: 'A' },
        C: { xp: 90, credits: 180, rep: { fraktal: -1 }, thread: 'C' }
      },
      next: []
    },
  
  
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
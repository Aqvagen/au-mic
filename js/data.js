/*
AU MICROSCOPII — статика. Версия 3.0.
*/
(function (G) {
'use strict';
var D = {};
D.VERSION = '3.0';
D.ATTRS = {
telo:    { name: 'ТЕЛО',     short: 'ТЕЛ' },
um:      { name: 'УМ',       short: 'УМ' },
harizma: { name: 'ХАРИЗМА',  short: 'ХАР' }
};
D.SKILLS = {
ubezhdenie:  { name: 'Убеждение',  attr: 'harizma' },
zapugivanie: { name: 'Запугивание', attr: 'telo' },
logika:      { name: 'Логика',      attr: 'um' },
vlom:        { name: 'Взлом',       attr: 'um' },
draka:       { name: 'Драка',       attr: 'telo' },
strelba:     { name: 'Стрельба',    attr: 'telo' },
intuitsiya:  { name: 'Интуиция',    attr: 'harizma' }
};
D.HEROES = {
noa:   { id: 'noa', name: 'Ноа Меррик', role: 'техник станции', portrait: 'noa',
attrs: { telo: 5, um: 9, harizma: 6 },
skills: { ubezhdenie: 1, zapugivanie: 0, logika: 2, vlom: 2, draka: 0, strelba: 1, intuitsiya: 1 },
weapon: 'cfsting', armor: 'cfvest', bag: ['bondo7', 'chip_low'], credits: 80 },
selin: { id: 'selin', name: 'Селин Варе', role: 'медик-биолог', portrait: 'selin',
attrs: { telo: 5, um: 8, harizma: 9 },
skills: { ubezhdenie: 2, zapugivanie: 0, logika: 1, vlom: 1, draka: 0, strelba: 1, intuitsiya: 2 },
weapon: 'glasshot', armor: 'cfvest', bag: ['bondo7', 'calmstim'], credits: 120 },
garik: { id: 'garik', name: 'Гарик Чжоу', role: 'грузчик-ветеран', portrait: 'garik',
attrs: { telo: 9, um: 5, harizma: 6 },
skills: { ubezhdenie: 1, zapugivanie: 2, logika: 1, vlom: 0, draka: 2, strelba: 2, intuitsiya: 0 },
weapon: 'pressureline', armor: 'riotvest', bag: ['oxiburst', 'nullcoin'], credits: 60 }
};
D.WEAPONS = {
cfsting:     { name: 'CF-Sting',      dmg: 3, range: 1, band: 'melee', acc: 0,  cost: 120, desc: 'нож-стингер' },
shockneedler:{ name: 'ShockNeedler',  dmg: 2, range: 1, band: 'melee', acc: 0,  cost: 90,  bleed: true, desc: 'иглы · кровотечение' },
pressureline:{ name: 'Pressure Line', dmg: 6, range: 1, band: 'melee', acc: -1, cost: 240, desc: 'пневматик · −1 к попаданию' },
glasshot:    { name: 'GlasShot',      dmg: 4, range: 3, band: 'short', acc: 1,  cost: 180, desc: 'осколочный · +1 к попаданию' },
arcemitter:  { name: 'ArcEmitter',    dmg: 5, range: 3, band: 'short', acc: 0,  cost: 260, stun: true, desc: 'разряд · отнимает AP' },
irlash:      { name: 'IR-Lash',       dmg: 3, range: 4, band: 'long',  acc: 0,  cost: 300, pierce: true, desc: 'луч · игнорирует укрытие' },
pulserifle:  { name: 'Pulse Rifle',   dmg: 6, range: 4, band: 'long',  acc: 0,  cost: 360, desc: 'винтовка' },
scattergun:  { name: 'Scattergun',    dmg: 7, range: 2, band: 'short', acc: -1, cost: 300, desc: 'дробовик · −1 к попаданию' }
};
D.ARMORS = {
none:      { name: 'Без брони',   def: 0, dr: 0, cost: 0 },
cfvest:    { name: 'CF-жилет',    def: 2, dr: 1, cost: 100, desc: 'лёгкая · −1 к урону' },
riotvest:  { name: 'Штурмовой',   def: 4, dr: 2, cost: 220, desc: 'тяжёлая · −2 к урону' },
biosuit:   { name: 'Биоскафандр', def: 3, dr: 1, cost: 260, desc: '−1 к урону' }
};
/* slot: куда надевается; null/нет поля = не надевается */
D.ITEMS = {
bondo7:    { name: 'Bondo-7',      kind: 'med',   cost: 40, heal: 12,  desc: 'медицина: +12 HP' },
calmstim:  { name: 'CalmStim',     kind: 'med',   cost: 50, check: { ubezhdenie: 2 }, desc: 'успокоительное: +2 к Убеждению' },
oxiburst:  { name: 'OxyBurst',     kind: 'med',   cost: 35, heal: 6, desc: 'кислород: +6 HP' },
medgel:    { name: 'MedGel',       kind: 'med',   cost: 25, heal: 5, desc: 'гель: +5 HP' },
nullcoin:  { name: 'NullCoin',     kind: 'tool',  cost: 70, combat: 'stun', slot: 'belt', desc: 'ЭМИ: оглушает в бою' },
chip_low:  { name: 'Чип доступа 1', kind: 'key',  cost: 60, unlock: 'admin', quest: true, desc: 'открывает админ-блок' },
chip_high: { name: 'Чип доступа 2', kind: 'key',  cost: 150, unlock: 'server', quest: true, desc: 'открывает серверную' },
filter:    { name: 'Фильтр B-12',   kind: 'key',  cost: 90, unlock: 'b12', quest: true, desc: 'пропуск в B-12' },
maskpatch: { name: 'MaskPatch',     kind: 'mask', cost: 110, slot: 'head', desc: 'патч маски: +1 к Интуиции', check: { intuitsiya: 1 } },
medcard:   { name: 'Медкарта',      kind: 'clue', cost: 0, fact: 'f_sign', quest: true, desc: 'улика: чужая подпись' },
log:       { name: 'Лог аудита',    kind: 'clue', cost: 0, fact: 'f_log', quest: true, desc: 'улика: недостача' },
arcpen:    { name: 'Дуговой резак', kind: 'tool',  cost: 130, quest: true, slot: 'belt', desc: 'инструмент для шахт' },
blackdrive:{ name: 'BlackDrive',    kind: 'clue', cost: 0, fact: 'f_drive', quest: true, desc: 'чёрный архив' },
manifest:  { name: 'Манифест',      kind: 'clue', cost: 0, fact: 'f_manifest', quest: true, desc: 'груз вне описи' },
sylva:     { name: 'Образец Sylva', kind: 'clue', cost: 0, fact: 'f_sylva', quest: true, desc: 'живой симбиот' },
detonator: { name: 'Детонатор',     kind: 'tool',  cost: 0, quest: true, slot: 'belt', desc: 'заряд Рук Праха' },
seal:      { name: 'Печать Ложи',   kind: 'key',  cost: 0, quest: true, slot: 'pocket1', desc: 'знак Экипажа' },
ration_card:  { name: 'Водяной жетон',     kind: 'key',  cost: 30, quest: true, slot: 'pocket1', desc: 'право на воду' },
ledger_kov:   { name: 'Гроссбух Ковчега',  kind: 'clue', cost: 0, fact: 'f_ledger_kov',  quest: true, desc: 'улика: список вывезенных' },
archive_lodge:{ name: 'Архив Ложи',        kind: 'clue', cost: 0, fact: 'f_lodge_arch',  quest: true, desc: 'улика: переклички за 40 лет' },
vessel_part:  { name: 'Ядро-сосуд',        kind: 'tool', cost: 0, quest: true, slot: 'belt', desc: 'тело для Куратора' },
seed_pod:     { name: 'Семя Древних',      kind: 'tool', cost: 0, quest: true, slot: 'belt', desc: 'живое семя B-12' }
};
D.SLOTS = [
['head', 'ГОЛОВА'], ['handL', 'РУКА Л'], ['body', 'ТЕЛО'], ['handR', 'РУКА П'],
['implant', 'ИМПЛАНТ'], ['belt', 'ПОЯС'], ['pocket1', 'КАРМАН 1'], ['pocket2', 'КАРМАН 2']
];
D.ENEMIES = {
drone:    { name: 'Дрон-ревизор', hp: 14, dmg: 3, range: 2, def: 11, acc: 2, xp: 25, credits: 15, drop: 'oxiburst' },
revisor:  { name: 'Ревизор',      hp: 20, dmg: 4, range: 3, def: 12, acc: 2, xp: 40, credits: 25, drop: 'bondo7' },
guard:    { name: 'Охранник',     hp: 18, dmg: 5, range: 1, def: 12, acc: 3, xp: 35, credits: 30, drop: 'nullcoin' },
renn:     { name: 'Ренн',         hp: 26, dmg: 5, range: 1, def: 13, acc: 3, xp: 70, credits: 60, drop: 'arcpen' },
curator:  { name: 'Нейро-Куратор',hp: 26, dmg: 5, range: 3, def: 14, acc: 2, xp: 80, credits: 80, drop: 'chip_high' },
boss:     { name: 'Ревизор смены',hp: 44, dmg: 7, range: 2, def: 15, acc: 3, xp: 150, credits: 120, drop: 'chip_high' },
sentinel: { name: 'Страж B-12',   hp: 16, dmg: 4, range: 3, def: 12, acc: 2, xp: 30, credits: 20, drop: 'oxiburst' },
saboteur: { name: 'Саботажник',   hp: 15, dmg: 5, range: 2, def: 11, acc: 3, xp: 30, credits: 25, drop: 'nullcoin' },
beast:    { name: 'Симбиот',      hp: 22, dmg: 6, range: 1, def: 13, acc: 3, xp: 45, credits: 10, drop: 'sylva' }
};
D.MERCHANTS = {
kim:   { name: 'Даниэль Ким', portrait: 'daniel', faction: 'kovcheg',
stock: ['chip_low', 'chip_high', 'nullcoin', 'calmstim', 'medgel'],
weapons: ['shockneedler', 'glasshot'], greet: '— Доступ открыт. Платите. Уходите.' },
tooth: { name: 'Клык', portrait: 'tooth', faction: 'ruki',
stock: ['bondo7', 'oxiburst', 'filter', 'medgel'],
weapons: ['pressureline', 'arcemitter', 'irlash', 'pulserifle', 'scattergun'],
greet: '— Бери, пока не передумал.' }
};
D.COMPANIONS = {
mira:  { name: 'Мира Ван', portrait: 'mira', skill: 'vlom', passive: '+1 к Взлому', join: 'loc_zhil' },
storm: { name: 'Алекса Шторм', portrait: 'storm', skill: 'draka', passive: '+1 к Драке', join: 'loc_tech' },
uni:   { name: 'UNI-7', portrait: 'uni', skill: 'intuitsiya', passive: '+1 к Интуиции', join: 'loc_med' },
kim:   { name: 'Даниэль Ким', portrait: 'daniel', skill: 'ubezhdenie', passive: '+1 к Убеждению', join: 'loc_canteen' },
renn:  { name: 'Джеймс Ренн', portrait: 'renn', skill: 'logika', passive: '+1 к Логике', join: 'loc_dock' }
};
D.PERKS = {
hardbody:  { name: 'Крепкая шкура',   desc: '+10 HP', req: { telo: 6 }, apply: { hp: 10 } },
sniper:    { name: 'Хладнокровие',    desc: '+2 урона (дальний)', req: { level: 3 }, apply: { rdmg: 2 } },
marksman:  { name: 'Стрелок',         desc: '+2 попадание (дальний)', req: { telo: 6 }, apply: { racc: 2 } },
silver:    { name: 'Серебряный язык', desc: '+2 Убеждение', req: { harizma: 7 }, apply: { skill: { ubezhdenie: 2 } } },
hacker:    { name: 'Взломщик',        desc: '+2 Взлом', req: { um: 7 }, apply: { skill: { vlom: 2 } } },
brawler:   { name: 'Мясник',          desc: '+2 урона (ближний)', req: { telo: 7 }, apply: { mdmg: 2 } },
reader:    { name: 'Читатель людей',  desc: '+2 Интуиция', req: { harizma: 6 }, apply: { skill: { intuitsiya: 2 } } },
medic:     { name: 'Полевой медик',   desc: 'медицина +50%', req: { um: 7 }, apply: { heal: 0.5 } }
};
D.LOCATIONS = [
{ id: 'loc_zhil',    name: 'Жилой сектор',   desc: 'Кухня, койки, очередь за водой',   bg: 'bg_dome.png',    unlock: null,     entries: ['dlg_zhil', 'q_mira', 'q_water'] },
{ id: 'loc_admin',   name: 'Админ-блок',     desc: 'Кабинеты, протоколы, коридоры',    bg: 'bg_dome.png',    unlock: 'admin',  entries: ['dlg_admin', 'dlg_bo', 'q_sign', 'dlg_talbot', 'q_gt_audit', 'q_talbot_deal', 'q_grailtech_purge'] },
{ id: 'loc_tech',    name: 'Техуровень',     desc: 'Трубы, кабели, узел MaskLink',     bg: 'bg_dome.png',    unlock: null,     entries: ['dlg_tech', 'q_node', 'dlg_trainer', 'q_hands_sabotage', 'q_trainer_war'] },
{ id: 'loc_server',  name: 'Серверная',      desc: 'GrailOS и то, что в нём живёт',    bg: 'bg_dome.png',    unlock: 'server', entries: ['dlg_server', 'q_core', 'q_fractal_uni', 'q_fractal_vessel'] },
{ id: 'loc_mine',    name: 'Шахты',          desc: 'Горизонты вниз',                   bg: 'bg_dome.png',    unlock: null,     entries: ['dlg_mine', 'q_ore', 'dlg_rico', 'q_rico_ash', 'q_ruki_arsenal'] },
{ id: 'loc_b12',     name: 'Сектор B-12',    desc: 'Мох светится в темноте',           bg: 'bg_dome.png',    unlock: 'b12',    entries: ['dlg_b12', 'q_b12', 'q_selin', 'q_ancients_grove', 'q_selin_2'] },
{ id: 'loc_med',     name: 'Медблок',        desc: 'Койки, сканеры, UNI-7',            bg: 'bg_dome.png',    unlock: null,     entries: ['dlg_med', 'q_med', 'q_noa', 'q_noa_2'] },
{ id: 'loc_canteen', name: 'Столовая',       desc: 'Очередь, слухи, Ким',              bg: 'bg_arrival.png', unlock: null,     entries: ['dlg_canteen', 'trade_kim', 'q_kovcheg', 'q_ark_smuggle', 'q_kovcheg_ledger'] },
{ id: 'loc_dock',    name: 'Ангар',          desc: 'Грузы, Ренн, Клык, шаттл',         bg: 'bg_arrival.png', unlock: null,     entries: ['dlg_dock', 'trade_tooth', 'dlg_tooth', 'q_cargo', 'q_tooth_deal', 'dlg_voice', 'q_lodge', 'q_vega_shadow', 'q_watcher_truth', 'q_lodge_archive', 'q_garik', 'q_garik_2'] },
{ id: 'loc_airlock', name: 'Шлюз',           desc: 'Перекличка в 18:00',               bg: 'bg_arrival.png', unlock: null,     entries: ['dlg_final', 'q_final', 'q_vigil'] }
];
D.FACTS = {
f_log:       { name: 'Лог аудита',      desc: 'недостача оформлена до смены' },
f_sign:      { name: 'Чужая подпись',   desc: 'приказ об изоляции подписан за день до неё' },
f_mira_ok:   { name: 'Слово Миры',      desc: 'Мира подтвердит' },
f_hanna_caught: { name: 'Ханна на дате', desc: 'Ханна знала о приказе' },
f_node_open: { name: 'Узел вскрыт',     desc: 'MaskLink на техуровне слушает всех' },
f_node_done: { name: 'Узел обработан',  desc: 'с узлом что-то сделали' },
f_storm_why: { name: 'Почему Шторм здесь', desc: 'уходить некуда' },
f_core:      { name: 'Ядро помнит',     desc: 'голос, которого не было в перекличке' },
f_core_alive:{ name: 'Куратор живой',   desc: 'протокол научился помнить' },
f_uni:       { name: 'Сбой UNI-7',      desc: 'ревизоры теряют протокол' },
f_vonom:     { name: 'Память Вонома',   desc: 'он стирал людей' },
f_pyl:       { name: 'Кто ходит внизу', desc: 'кто-то вне расписания' },
f_cargo:     { name: 'Груз вне описи',  desc: 'ящик Ренна не совпадает с манифестом' },
f_passenger: { name: 'Пассажир',        desc: 'в ящике живой человек' },
f_sylva:     { name: 'Свет под кожей',  desc: 'Селия не совсем человек' },
f_drive:     { name: 'BlackDrive',      desc: 'чёрный архив Фрактала' },
f_manifest:  { name: 'Манифест Веги',   desc: 'заказчик — Vega Mining' },
f_daughter:  { name: 'Дочь Ноа',        desc: 'она жива и часть Куратора' },
f_selin_archive: { name: 'Архив B-12',  desc: 'эксперименты на людях' },
f_selin_selia: { name: 'Сделка Селии',  desc: 'Селия хранила архив как сырьё' },
f_garik_vmc: { name: 'Заказчик груза',  desc: 'Vega Mining платила Ренну' },
f_garik_bomb:{ name: 'Что в грузе',     desc: 'детонатор для реактора' },
f_gt_audit:  { name: 'Три лога',        desc: 'недостача с трёх уровней' },
f_charge:    { name: 'Заряд в шахтах',  desc: 'заряд под четвёртым горизонтом' },
f_smuggle:   { name: 'Ящик Ковчега',    desc: 'в ящике человек' },
f_grove:     { name: 'Роща',            desc: 'мох B-12 растёт на трубах' },
f_antenna:   { name: 'Антенна Ложи',    desc: 'Ложа слушает станцию' },
f_fractal:   { name: 'Слияние',         desc: 'Куратор собирает людей' },
f_vega:      { name: 'Передатчик Веги', desc: 'сигнал уходит на шаттл' },
f_rico:      { name: 'Пламя',           desc: 'Рико готов взорвать шахты' },
f_trainer:   { name: 'Смотр',           desc: 'у станции нет целого отряда' },
f_talbot:    { name: 'Предложение Тэлбота', desc: 'он готов купить молчание' },
f_watcher:   { name: 'Кто такой Ватчер', desc: 'тот, кто пишет агентов' },
f_water_public:  { name: 'Вода жилым',      desc: 'жилой получил воду' },
f_water_black:   { name: 'Вода Ковчега',    desc: 'Ковчег возит воду вне расписания' },
f_water_selfish: { name: 'Вода моя',        desc: 'ты забрал жетоны' },
f_water_cause:   { name: 'Причина перебоев', desc: 'клапан настроен на нижние уровни' },
f_vigil_ready:   { name: 'Сход готов',      desc: 'люди знают, что сказать' },
f_vigil_split:   { name: 'Раскол',          desc: 'часть за GrailTech' },
f_vigil_silent:  { name: 'Тишина на сходе', desc: 'никто не назвал ничего' },
f_ledger_kov:    { name: 'Гроссбух Ковчега', desc: 'список вывезенных' },
f_lodge_arch:    { name: 'Архив Ложи',      desc: 'переклички за 40 лет' },
f_vessel_core:   { name: 'Сосуд',           desc: 'тело для Куратора' },
f_arsenal_loc:   { name: 'Арсенал',         desc: 'склад, забытый всеми' },
f_noa_rescued:   { name: 'Дочь спасена',    desc: 'вытащена из ядра' },
f_noa_left:      { name: 'Дочь в ядре',     desc: 'осталась собой, но не свободной' },
f_noa_released:  { name: 'Дочь отпущена',   desc: 'ушла из системы' },
f_selin_garden:  { name: 'Сад',             desc: 'мох растёт по всей станции' },
f_garik_paid:    { name: 'Долг закрыт',     desc: 'Вега получила своё' },
f_storm_betrayed: { name: 'Шторм предана',  desc: 'ты сдал Шторм Ханне' },
f_rico_warned:    { name: 'Рико предупреждён', desc: 'ты рассказал Рико про заряд' },
f_trainer_code:   { name: 'Код Трейнера',   desc: 'код к узлу MaskLink' },
f_vega_code:      { name: 'Ключ Ренна',     desc: 'ключ к узлу MaskLink' },
f_kovcheg_done:   { name: 'С Кимом покончено', desc: 'долг закрыт любой ценой' },
f_ore_done:       { name: 'Руда поднята',   desc: 'горизонт взят' },
f_purge_done:     { name: 'Зачистка',       desc: 'техуровень зачищен' },
f_bo_tape:       { name: 'Запись Бо',      desc: 'на ней видно, как выносили чипы' },
f_bo_afraid:     { name: 'Бо боится',      desc: 'Бо знает, что Ханна не простит' },
f_tooth_paid:    { name: 'Клык получил своё', desc: 'груз прошёл мимо таможни' },
f_tooth_cheated: { name: 'Клык обманут',   desc: 'груз не дошёл до Ханны' },
f_tooth_reported:{ name: 'Клык сдан',      desc: 'Ханна знает про Клыка' }
};
D.ENDINGS = [
{ id: 'e_noa_A1', hero: 'noa', thread: 'A', variant: '1', title: 'Правда о дочери',
text: ['Ты вытащил её из ядра. Она дышит, открывает глаза и первым делом спрашивает, сколько прошло смен.',
'Куратор отступает в глубину протокола. GrailTech объявляет это сбоем, но люди в жилом секторе уже знают: в перекличке был ещё один голос.',
'Станция не станет прежней. Ты — тоже. Но она жива, и это единственное, что ты записываешь в журнал большими буквами.'] },
{ id: 'e_noa_A2', hero: 'noa', thread: 'A', variant: '2', title: 'Правда · после падения',
text: ['Ты вытащил её, но бой ты проиграл. Охрана видела, как ты падал, и теперь помнит это лучше, чем твою правду.',
'Она жива. Она смотрит на тебя и спрашивает, почему так долго. Ты не отвечаешь: ответ слишком похож на оправдание.',
'Вы уходите вниз, к шахтам, где ещё можно дышать. Станция записывает твою версию второй строкой после официальной.'] },
{ id: 'e_noa_B1', hero: 'noa', thread: 'B', variant: '1', title: 'Сделка с GrailTech',
text: ['Ты подписал допуск. Она осталась в ядре — живая, но не свободная. Тэлбот называет это «сохранением ценного сотрудника».',
'Тебе дают кабинет, чип и право входить в серверную без охраны. Ты приходишь каждую смену и говоришь с терминалом.',
'Иногда она отвечает. Иногда молчит. Ты научился различать эти два молчания и не рассказывать о них никому.'] },
{ id: 'e_noa_B2', hero: 'noa', thread: 'B', variant: '2', title: 'Сделка · после падения',
text: ['После боя цена стала ниже. Ты подписал то, что осталось от сделки, и получил то, что осталось от должности.',
'Она в ядре. Ты — в коридоре с пропуском. Между вами две двери и один протокол, который никто не читает.',
'Ты говоришь себе, что это ради неё. Терминал в ответ мигает зелёным — так он соглашается.'] },
{ id: 'e_noa_C1', hero: 'noa', thread: 'C', variant: '1', title: 'Молчание техника',
text: ['На перекличке ты не сказал ничего. Станция записала свою версию: техник Меррик, без замечаний, допуск закрыт.',
'Ты знаешь, где она. Ты знаешь, как её вытащить. Ты не делаешь ни того, ни другого — и это тоже выбор, который ты делаешь каждое утро.',
'В шкафчике остаётся её старая фотография. Ты не убираешь её и не показываешь никому.'] },
{ id: 'e_noa_C2', hero: 'noa', thread: 'C', variant: '2', title: 'Молчание · после падения',
text: ['Ты проиграл бой и промолчал на перекличке. Никто не спросил, почему ты вернулся без ответа.',
'Она осталась в ядре. Ты остался в смене. Станция любит таких: целых, тихих, без вопросов.',
'Иногда в шуме коридоров тебе слышится её голос. Ты не оборачиваешься. Так проще.'] },
{ id: 'e_selin_A1', hero: 'selin', thread: 'A', variant: '1', title: 'Обнародовать',
text: ['Ты выложил архив на все терминалы станции. Сначала — тишина, потом — очередь в медблок: люди ищут свои фамилии.',
'Селия уходит в B-12 и не закрывает за собой дверь. GrailTech называет документы подделкой, но перекличку переносят на сутки.',
'Ты не выиграла. Но ты вернула мёртвым их имена, и этого у тебя уже не отнять.'] },
{ id: 'e_selin_A2', hero: 'selin', thread: 'A', variant: '2', title: 'Обнародовать · после падения',
text: ['Ты опубликовала архив, но тебя уже видели слабой. Половина станции считает документы твоей местью.',
'Имена всё равно остаются на экранах. Медблок работает круглосуточно. Селия не приходит.',
'Ты говоришь себе, что правда не обязана быть убедительной. Иногда ты в это веришь.'] },
{ id: 'e_selin_B1', hero: 'selin', thread: 'B', variant: '1', title: 'Шантаж',
text: ['Ты обменяла архив на допуск и защиту. GrailTech подписывает бумаги, которые ты сама и составила.',
'Селия называет тебя юристом до конца. Ты не споришь: юрист — это тот, кто знает цену каждой строке.',
'Ты получила место, где можно менять правила. Осталось понять, сколько правил ты готова подписать.'] },
{ id: 'e_selin_B2', hero: 'selin', thread: 'B', variant: '2', title: 'Шантаж · после падения',
text: ['После боя ты торговалась хуже. GrailTech дал меньше, чем ты просила, и больше, чем ты заслуживала.',
'Архив остался у тебя. Допуск тоже. Селия больше не отвечает на вызовы.',
'Ты сидишь в кабинете с чужими именами в сейфе и учишься называть это справедливостью.'] },
{ id: 'e_selin_C1', hero: 'selin', thread: 'C', variant: '1', title: 'Скрыть',
text: ['Ты сожгла архив. Огонь в B-12 выглядит почти как свет мха — только не тёплый.',
'Селия кивает. GrailTech закрывает дело. Люди, чьи имена были в записях, остаются пропавшими без вести.',
'Ты выходишь в коридор и понимаешь, что теперь ты — единственная, кто помнит. Это тяжелее, чем бумага.'] },
{ id: 'e_selin_C2', hero: 'selin', thread: 'C', variant: '2', title: 'Скрыть · после падения',
text: ['Ты проиграла бой и сожгла архив. Никто не видел, как ты это сделала, — но все видели, как ты уходила.',
'Селия не благодарит. GrailTech не награждает. Станция просто продолжает смену.',
'Ты возвращаешься в медблок и лечишь тех, кого ещё можно вылечить. Это единственное, что осталось.'] },
{ id: 'e_garik_A1', hero: 'garik', thread: 'A', variant: '1', title: 'Довезти груз',
text: ['Ты довёз груз. Пассажир выходит из ящика сам, отряхивается и говорит, что запомнит твоё лицо.',
'Ренн пожимает плечами: работа есть работа. Вега платит, не спрашивая, что ты видел.',
'Ты возвращаешься в ангар и впервые за долгое время не проверяешь, не следят ли за тобой. Привычка остаётся, но уже не главная.'] },
{ id: 'e_garik_A2', hero: 'garik', thread: 'A', variant: '2', title: 'Довезти · после падения',
text: ['Ты довёз груз, но опоздал. Пассажир жив, но смотрит на тебя так, будто ты тоже часть заказа.',
'Вега платит меньше: за задержку. Ренн не комментирует. Ты тоже.',
'Ты возвращаешься в ангар и садишься на ящик. Работа сделана. Почему от неё так пусто — ты не знаешь.'] },
{ id: 'e_garik_B1', hero: 'garik', thread: 'B', variant: '1', title: 'Продать данные',
text: ['Ты продал груз и данные. Покупатель не назвал имени, но заплатил столько, что имя перестало быть важным.',
'Пассажир стал строчкой в манифесте. Ренн исчез на следующей смене. Ковчег делает вид, что не знает тебя.',
'У тебя есть деньги и нет долгов. В ангаре ты теперь просто ещё один человек с ящиком.'] },
{ id: 'e_garik_B2', hero: 'garik', thread: 'B', variant: '2', title: 'Продать · после падения',
text: ['После боя ты продал всё, что осталось: груз, данные, адрес шаттла. Цена была смешной.',
'Пассажир не смотрит на тебя. Ренн смеётся и уходит. Ты остаёшься с кредитами, которых не хватит на новую жизнь.',
'Ты говоришь себе, что это была сделка. Сделка — это когда обе стороны что-то получают. Ты пока не уверен, что получил.'] },
{ id: 'e_garik_C1', hero: 'garik', thread: 'C', variant: '1', title: 'Сдать пассажира',
text: ['Ты сдал пассажира Веге. Всё прошло чисто: ящик, подпись, шлюз.',
'GrailTech отмечает тебя как надёжного. Ренн — как удобного. Ковчег — как чужого.',
'Ты возвращаешься в ангар с пустыми руками. Работа сделана правильно. Ты не уверен, что это то же самое, что «хорошо».'] },
{ id: 'e_garik_C2', hero: 'garik', thread: 'C', variant: '2', title: 'Сдать · после падения',
text: ['Ты проиграл бой и сдал пассажира, чтобы закрыть сделку. Вега приняла груз без вопросов.',
'Ренн больше не здоровается. Ковчег вычёркивает тебя из списков. Зато GrailTech платит вовремя.',
'Ты стоишь в ангаре и смотришь, как шаттл уходит. Внутри — человек, которого ты не стал спасать. Ты запоминаешь его лицо, хотя не должен.'] }
];
D.XP_TABLE = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
D.MAX_LEVEL = 10;
D.REP_START = { grailtech: 0, fraktal: 0, drevnie: 0, kovcheg: 0, ruki: 0, lozha: 0 };
D.REP_NAMES = { grailtech: 'GrailTech', fraktal: 'Фрактал', drevnie: 'Древние', kovcheg: 'Чёрный Ковчег', ruki: 'Руки Праха', lozha: 'Ложа' };
D.MUSIC = [
{ id: 'ambient', name: 'R-7 · фон', src: 'assets/audio/ambient.mp3' }
];
D.SETTINGS = {
volume: 0.35, mute: false, track: 'ambient',
motion: true, scan: true,
bigFont: false, hideHints: false, autosave: true, telemetry: true
};
G.D = D;
if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof globalThis !== 'undefined' ? globalThis : this);
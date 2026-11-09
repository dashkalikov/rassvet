import type {PlanId} from './domain';

export type ImageSection='landing'|'plans'|'technology'|'equipment'|'coverage'|'connect'|'guides'|'speedtest'|'privacy'|'support'|'account';

// A scene belongs to one section. Menu thumbnails may preview that same section.
export const EDITORIAL_IMAGES = {
  home: {section:'landing',alt:'Загородный дом у лесного озера с терминалом в саду и рабочим местом на террасе'},
  travel: {section:'landing',alt:'Автодом у горного озера с компактным спутниковым терминалом на стоянке'},
  business: {section:'landing',alt:'Удалённый исследовательский комплекс с двумя спутниковыми терминалами'},
  satellite: {section:'technology',alt:'Концептуальный спутник связи с солнечными панелями над голубым горизонтом Земли'},
  gateway: {section:'technology',alt:'Наземная станция с тремя параболическими антеннами у соснового леса'},
  installation: {section:'equipment',alt:'Специалист подключает кабель терминала на устойчивой площадке в саду'},
  wifi: {section:'guides',alt:'Светлый Wi-Fi роутер на деревянной консоли в современном загородном доме'},
  kit: {section:'equipment',alt:'Распакованный комплект: спутниковый терминал, опора, роутер, питание и кабель на деревянном столе'},
  support: {section:'support',alt:'Специалист в гарнитуре за рабочим столом с компьютером и роутером'},
  learning: {section:'landing',alt:'Студентка за ноутбуком в загородном доме с видом на горы и терминал в саду'},
  remote: {section:'coverage',alt:'Дом полевой станции в снежной северной долине со спутниковым терминалом'},
  'landing-home': {section:'landing',alt:'Светлый загородный дом у берёзовой рощи с терминалом на открытой лужайке'},
  'landing-travel': {section:'landing',alt:'Экспедиционный автомобиль и спутниковый терминал на стоянке у морского побережья'},
  'landing-business': {section:'landing',alt:'Небольшой загородный отель с терминалом у служебной части здания'},
  'plan-home': {section:'plans',alt:'Отдых с планшетом в светлой гостиной загородного дома'},
  'plan-travel': {section:'plans',alt:'Палатка, рабочий стол и компактный терминал в горном кемпинге'},
  'plan-business': {section:'plans',alt:'Команда за ноутбуками в современном загородном коворкинге'},
  assembly: {section:'landing',alt:'Сборка компактного спутника связи в чистой инженерной мастерской'},
  'steps-location': {section:'landing',alt:'Проверка открытого обзора неба со смартфоном в загородном саду'},
  'steps-start': {section:'landing',alt:'Включение домашнего роутера на аккуратном рабочем столе'},
  'network-core': {section:'technology',alt:'Телекоммуникационные стойки с оптическими кабелями в сетевом узле'},
  'terminal-field': {section:'technology',alt:'Плоский спутниковый терминал на низкой подставке в открытой поляне'},
  'connected-devices': {section:'technology',alt:'Ноутбук, планшет и смартфон на столе домашней беспроводной сети'},
  onboarding: {section:'connect',alt:'Подготовка нового подключения за ноутбуком рядом с распакованным оборудованием'},
  'guide-installation': {section:'guides',alt:'Проверка устойчивой опоры терминала строительным уровнем на площадке у дома'},
  'guide-account': {section:'guides',alt:'Ввод данных аккаунта на ноутбуке за домашним столом'},
  'guide-choice': {section:'guides',alt:'Сравнение габаритов двух разных спутниковых терминалов на рабочем столе'},
  'coverage-address': {section:'coverage',alt:'Проверка адреса на планшете у входа на загородный участок'},
  'speed-live': {section:'speedtest',alt:'Сетевой кабель Ethernet подключён к ноутбуку для проверки соединения'},
  'speed-models': {section:'speedtest',alt:'Стенд с сетевыми приборами для сравнения характеристик соединения'},
  'speed-history': {section:'speedtest',alt:'Планшет с графиком и блокнот для записей результатов проверки связи'},
  privacy: {section:'privacy',alt:'Локальный накопитель данных и металлический ключ рядом с закрытым ноутбуком'},
  'guides-desk': {section:'guides',alt:'Открытое руководство с техническими рисунками, кабель и инструмент на рабочем столе'},
  contact: {section:'support',alt:'Пользователь набирает вопрос на смартфоне за домашним столом'},
  correspondence: {section:'account',alt:'Рабочий стол с ноутбуком, гарнитурой и папками для истории переписки'},
  orders: {section:'account',alt:'Упакованный комплект, список проверки и смартфон с деталями заявки'},
} as const satisfies Record<string,{section:ImageSection;alt:string}>;

export type EditorialImageId = keyof typeof EDITORIAL_IMAGES;
export const SCENARIO_IMAGES = {home:'plan-home',travel:'plan-travel',business:'plan-business'} as const satisfies Record<PlanId,EditorialImageId>;
export const LANDING_PLAN_IMAGES = {home:'home',travel:'travel',business:'business'} as const satisfies Record<PlanId,EditorialImageId>;
export const GUIDE_IMAGES = {installation:'guide-installation',wifi:'wifi',account:'guide-account',selection:'guide-choice'} as const satisfies Record<string,EditorialImageId>;

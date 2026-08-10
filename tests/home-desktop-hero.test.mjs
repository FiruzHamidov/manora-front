import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const homeSource = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const heroSource = await readFile(
  new URL('../app/_components/manora/DesktopHomeHero.tsx', import.meta.url),
  'utf8'
);

test('desktop home hero uses the Figma image while preserving the mobile hero', () => {
  assert.match(homeSource, /<DesktopHomeHero/);
  assert.match(heroSource, /home-hero-desktop\.png/);
  assert.match(heroSource, /hidden[^"\n]*md:block/);
  assert.match(homeSource, /md:hidden/);
});

test('home page no longer embeds video or reels', () => {
  assert.doesNotMatch(homeSource, /youtube-nocookie|<iframe|<video|ManoraReelsSection/);
});

test('desktop filter exposes catalog, deal, category, region and advanced fields', () => {
  assert.doesNotMatch(heroSource, /Что вы хотите найти\?/);
  assert.doesNotMatch(heroSource, /<select/);
  assert.match(heroSource, /SearchableSelect/);
  assert.match(heroSource, /HeroSegmentedTabs/);
  assert.match(heroSource, /role="tablist"/);
  assert.match(heroSource, /role="tab"/);
  assert.match(heroSource, /aria-selected=\{isSelected\}/);
  assert.match(heroSource, /bg-\[#E2F2EA\]/);
  assert.match(heroSource, /max-w-\[1180px\]/);
  assert.match(heroSource, /Все фильтры/);
  assert.match(heroSource, /grid-cols-\[1fr_1\.08fr_180px_146px_150px\]/);
  assert.match(heroSource, /icon: Building2/);
  assert.match(heroSource, /icon: CarFront/);
  assert.match(heroSource, /icon: HandCoins/);
  assert.match(heroSource, /icon: KeyRound/);
  assert.match(heroSource, /ROOM_PRESET_OPTIONS/);
  assert.match(heroSource, /Количество комнат/);
  assert.match(heroSource, /Площадь, м²/);
  assert.match(heroSource, /Год постройки/);
  assert.match(heroSource, /Пробег, км/);
  assert.match(heroSource, /absolute right-0 top-full z-30/);
  assert.match(heroSource, /icon=\{MapPin\}/);
  assert.match(heroSource, /Введите название города/);
  assert.match(heroSource, /Недвижимость/);
  assert.match(heroSource, /Авто/);
  assert.match(heroSource, /Купить/);
  assert.match(heroSource, /Арендовать/);
  assert.doesNotMatch(heroSource, /Все объявления/);
  assert.doesNotMatch(heroSource, /Любой тип сделки/);
  assert.match(heroSource, /Тип недвижимости/);
  assert.match(heroSource, /По всему Таджикистану/);
  assert.match(heroSource, /Дополнительные параметры/);
  assert.match(heroSource, /Цена, сомони/);
  assert.match(heroSource, /Все застройщики/);
  assert.match(heroSource, /Любая стадия/);
  assert.match(heroSource, /Любой материал/);
  assert.match(heroSource, /rounded-\[26px\]/);
  assert.match(heroSource, /bg-white\/68/);
  assert.match(heroSource, /backdrop-blur-\[4px\]/);
  assert.match(heroSource, /searchable=\{false\}/);
  assert.match(heroSource, /Аренда автомобилей пока недоступна/);
});

test('desktop hero centers the copy and filter together vertically', () => {
  assert.match(heroSource, /flex-col items-center justify-center/);
  assert.match(heroSource, /<form[^>]+mt-6 w-full max-w-\[1180px\]/);
  assert.doesNotMatch(heroSource, /absolute inset-x-6 bottom-6/);
});

test('desktop search routes each catalog to its own results page', () => {
  assert.match(homeSource, /`\/cars\?\$\{params\}`/);
  assert.match(homeSource, /`\/new-buildings\?\$\{params\}`/);
  assert.match(homeSource, /`\/listings\?\$\{params\}`/);
  assert.match(homeSource, /propertyTypes: filters\.categoryId/);
  assert.match(homeSource, /cities: filters\.locationId/);
  assert.match(homeSource, /areaFrom: filters\.areaFrom/);
  assert.match(homeSource, /mileage_from: filters\.mileageFrom/);
});

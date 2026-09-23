import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFilterNumber, validateFilterRanges, propertyFilterInitialValues } from '../services/properties/filter-form.ts';

test('range boundaries support one side, zero, first floor and third floor', () => {
  for (const [from,to] of [['1',''],['','3'],['0','0'],['1','3'],['-1','0']]) {
    assert.equal(validateFilterRanges([{label:'Этаж',from,to,integer:true,min:-20}]),null);
  }
});
test('inverted, invalid and fractional room ranges are rejected before navigation', () => {
  for (const [from,to] of [['3','1'],['oops',''],['1.5','2'],['-1','']]) {
    assert.ok(validateFilterRanges([{label:'Комнаты',from,to,integer:true}]));
  }
});
test('localized numeric input and URL reopen preserve decimal boundaries and full apartment boolean', () => {
  assert.equal(normalizeFilterNumber(' 1 000 000,50 '),'1000000.50');
  const params = new URLSearchParams('offer_type=rent&floorFrom=1&floorTo=3&areaFrom=0&is_full_apartment=false&construction_status=built&landmark=park&cities=1,2');
  const initial=propertyFilterInitialValues(params);
  assert.equal(initial.floorFrom,'1'); assert.equal(initial.floorTo,'3'); assert.equal(initial.areaFrom,'0');
  assert.equal(initial.is_full_apartment,false);assert.equal(initial.offer_type,'rent');assert.equal(initial.construction_status,'built');assert.equal(initial.landmark,'park');assert.deepEqual(initial.cities,['1','2']);
  params.set('is_full_apartment','1');assert.equal(propertyFilterInitialValues(params).is_full_apartment,true);
});

test('canonical URLs from previous searches reopen with the same boundaries', () => {
  const initial = propertyFilterInitialValues(new URLSearchParams('floor_from=1&floor_to=3&price_tjs_to=0&rooms_from=2&total_area_from=50.5'));
  assert.equal(initial.floorFrom,'1');assert.equal(initial.floorTo,'3');assert.equal(initial.priceTo,'0');assert.equal(initial.roomsFrom,'2');assert.equal(initial.areaFrom,'50.5');
});

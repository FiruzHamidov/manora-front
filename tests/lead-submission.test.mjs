import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createLeadSubmission, genericLeadSource, leadFormPresentation, stripSourceQuery } from '../services/leads/client.ts';

const lead = { service_type: 'consultation', name: 'Test', phone: '+992900123456' };

test('frontend runtime and published API contracts contain no external CRM adapter', () => {
  const files = [];
  const collect = path => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) collect(child);
      else if (/\.(?:js|mjs|ts|tsx)$/.test(entry.name)) files.push(child);
    }
  };
  for (const root of ['app', 'components', 'hooks', 'lib', 'services', 'store']) {
    if (existsSync(root)) collect(root);
  }
  files.push('.env.example', 'next.config.ts', 'package.json', 'docs/API_ROUTES.md', 'docs/manora-api.postman_collection.json');

  for (const file of files) {
    const contents = readFileSync(file, 'utf8').toLowerCase();
    for (const identifier of ['bit' + 'rix', 'b' + '24']) {
      assert.equal(contents.includes(identifier), false, `Obsolete external CRM surface found in ${file}`);
    }
  }
});

test('ordinary mortgage consultation copy and CRM source stay separate from residential entities', () => {
  assert.deepEqual(leadFormPresentation('mortgage'), { label: 'Ипотечная консультация', heading: 'Получить ипотечную консультацию' });
  assert.deepEqual(genericLeadSource('mortgage'), { service_type: 'Ипотека', source: 'web-mortgage-consultant' });
  assert.deepEqual(leadFormPresentation('residential'), { label: 'Обращение по ЖК', heading: 'Получить консультацию' });
  assert.deepEqual(genericLeadSource('residential'), { service_type: 'Новостройки', source: 'web-new-building-consultant' });
  assert.equal(leadFormPresentation('mortgage', true).label, 'Обращение по квартире');
  assert.equal(leadFormPresentation('mortgage', false, true).label, 'Обращение по условиям покупки');
});

test('CRM failure is never reported as a successful submission', async () => {
  const submission = createLeadSubmission(async () => {
    throw { response: { status: 503, data: { message: 'Not saved' } } };
  }, () => 'first-key');
  const result = await submission.submitLead({ lead });
  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
  assert.equal(result.uncertain, true);
  assert.equal(result.leadId, undefined);
});

test('timeout retry retains the key and a new confirmed request gets a new key', async () => {
  const payloads = [];
  let attempts = 0;
  let keys = 0;
  const submission = createLeadSubmission(async payload => {
    payloads.push(payload);
    if (++attempts === 1) throw new Error('timeout after server accepted');
    return { request_id: attempts === 2 ? 10 : 11, replayed: attempts === 2 };
  }, () => `key-${++keys}`);
  assert.equal((await submission.submitLead({ lead })).ok, false);
  assert.equal((await submission.submitLead({ lead })).leadId, 10);
  assert.equal((await submission.submitLead({ lead })).leadId, 11);
  assert.deepEqual(payloads.map(payload => payload.idempotency_key), ['key-1', 'key-1', 'key-2']);
});

test('ambiguous transport results require an unchanged retry, while explicit rejections allow correction', async () => {
  for (const status of [undefined, 408, 500, 502, 503, 504, 401, 403, 404, 409, 422, 429]) {
    const payloads = [];
    const submission = createLeadSubmission(async payload => {
      payloads.push(payload);
      if (payloads.length === 1) throw { response: status === undefined ? undefined : { status } };
      return { request_id: 45, replayed: true };
    }, () => 'original-key');
    const result = await submission.submitLead({ lead });
    assert.equal(result.uncertain, status === undefined || status === 408 || status >= 500);
    assert.equal((await submission.submitLead({ lead })).leadId, 45);
    assert.deepEqual(payloads[0], payloads[1]);
  }
});

test('a throttled retry does not resolve an earlier ambiguous acceptance', async () => {
  let attempt = 0, key = 0;
  const payloads = [];
  const submission = createLeadSubmission(async payload => {
    payloads.push(payload);
    attempt++;
    if (attempt === 1) throw new Error('response lost');
    if (attempt === 2) throw { response: { status: 429 } };
    if (attempt === 3) return { request_id: 45, replayed: true };
    throw { response: { status: 422 } };
  }, () => `key-${++key}`);
  assert.equal((await submission.submitLead({ lead })).uncertain, true);
  const limited = await submission.submitLead({ lead });
  assert.equal(limited.status, 429);
  assert.equal(limited.uncertain, true);
  assert.equal((await submission.submitLead({ lead })).leadId, 45);
  assert.equal((await submission.submitLead({ lead })).uncertain, false);
  assert.deepEqual(payloads.map(p => p.idempotency_key), ['key-1', 'key-1', 'key-1', 'key-2']);
});

test('double click sends one request and changed content cannot claim its success', async () => {
  let finish;
  let count = 0;
  const submission = createLeadSubmission(() => {
    count++;
    return new Promise(resolve => { finish = resolve; });
  }, () => 'key');
  const first = submission.submitLead({ lead });
  assert.equal(submission.submitLead({ lead }), first);
  const changed = await submission.submitLead({ lead: { ...lead, name: 'Another' } });
  assert.equal(changed.ok, false);
  assert.equal(changed.code, 'submission_in_progress');
  finish({ request_id: 20 });
  assert.equal((await first).leadId, 20);
  assert.equal(count, 1);
});

test('an HTTP response without a persisted CRM ID is not accepted', async () => {
  const payloads = [];
  const submission = createLeadSubmission(async payload => {
    payloads.push(payload);
    return { ok: true, message: 'Some external notification succeeded' };
  }, () => 'retained');
  const result = await submission.submitLead({ lead });
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, true);
  assert.equal((await submission.submitLead({ lead })).ok, false);
  assert.deepEqual(payloads.map(payload => payload.idempotency_key), ['retained', 'retained']);
});

test('conflicting current apartment data is available to the UI without acceptance', async () => {
  const current = { total_price: '550000.00', availability_status: 'reserved' };
  const submission = createLeadSubmission(async () => {
    throw { response: { status: 409, data: { code: 'listing_changed', current } } };
  }, () => 'key');
  const result = await submission.submitLead({ lead });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'listing_changed');
  assert.deepEqual(result.current, current);
});

test('source URL removes personal query, fragments and embedded credentials', async () => {
  let payload;
  const submission = createLeadSubmission(async data => {
    payload = data;
    return { request_id: 21 };
  }, () => 'key');
  await submission.submitLead({ lead: {
    ...lead,
    source_url: 'https://user:secret@manora.tj/new-buildings/5?phone=900123456#email=private',
    utm: { utm_source: 'search' },
  } });
  assert.equal(payload.source_url, 'https://manora.tj/new-buildings/5');
  assert.deepEqual(payload.utm, { utm_source: 'search' });
  assert.equal(stripSourceQuery('javascript:alert(1)'), undefined);
});

test('separate form instances never share an idempotency key', async () => {
  const keys = [];
  const post = async payload => { keys.push(payload.idempotency_key); return { request_id: 1 }; };
  await createLeadSubmission(post, () => 'form-a').submitLead({ lead });
  await createLeadSubmission(post, () => 'form-b').submitLead({ lead });
  assert.deepEqual(keys, ['form-a', 'form-b']);
});

test('payment consultations preserve exact inputs and expose a program conflict for explicit review', async () => {
  const payloads = [];
  const submission = createLeadSubmission(async payload => {
    payloads.push(payload);
    if (payload.expected_program_version === 1) {
      throw { response: { status: 409, data: { code: 'program_changed', current: { program_version: 2 } } } };
    }
    return { request_id: 25 };
  }, () => 'program-request');
  const paymentLead = {
    ...lead, intent: 'payment_consultation', new_building_id: 4, payment_program_id: 9, expected_program_version: 1,
    payment_calculation: { price: '9999999999999.99', down_payment_mode: 'percent', down_payment: '20.01', term_months: 12 },
  };
  const conflict = await submission.submitLead({ lead: paymentLead });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.code, 'program_changed');
  assert.deepEqual(conflict.current, { program_version: 2 });
  assert.equal((await submission.submitLead({ lead: { ...paymentLead, expected_program_version: 2 } })).leadId, 25);
  assert.deepEqual(payloads.map(payload => payload.idempotency_key), ['program-request', 'program-request']);
  assert.deepEqual(payloads[1].payment_calculation, paymentLead.payment_calculation);
});

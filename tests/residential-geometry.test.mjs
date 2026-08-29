import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePoints, pointDrafts, pointerPoint } from '../services/new-buildings/geometry.ts';

test('floor polygon coordinates survive percent editing and comma decimal input', () => {
  const points = [[0.123456, 0.1], [0.5, 0.25], [0.4, 1]];
  assert.deepEqual(parsePoints(pointDrafts(points)), points);
  assert.deepEqual(parsePoints([{ x: '12,5', y: '0' }, { x: '100', y: '0' }, { x: '100', y: '100' }]), [[0.125, 0], [1, 0], [1, 1]]);
  for (const value of ['', '-1', '101', 'NaN', '1e2', '<svg/>']) {
    assert.throws(() => parsePoints([{ x: value, y: '0' }, { x: '100', y: '0' }, { x: '100', y: '100' }]));
  }
});

test('pointer coordinates are relative to the displayed image at any viewport size', () => {
  assert.deepEqual(pointerPoint(250, 150, { left: 100, top: 50, width: 300, height: 200 }), [0.5, 0.5]);
  assert.deepEqual(pointerPoint(50, 150, { left: 100, top: 50, width: 300, height: 200 }), [0, 0.5]);
  assert.throws(() => pointerPoint(0, 0, { left: 0, top: 0, width: 0, height: 0 }));
});

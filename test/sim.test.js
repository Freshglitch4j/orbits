import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, step, launch, angDiff, DT } from '../js/sim.js';
import { LEVELS } from '../js/levels.js';
import { autoplay } from './autopilot.js';

test('angDiff liefert die kürzeste Differenz', () => {
  assert.ok(Math.abs(angDiff(0.1, -0.1) - 0.2) < 1e-12);
  assert.ok(Math.abs(angDiff(Math.PI - 0.1, -Math.PI + 0.1) + 0.2) < 1e-12);
  assert.ok(Math.abs(angDiff(7, 7 - 2 * Math.PI)) < 1e-12);
});

for (const level of LEVELS) {
  test(`${level.name}: mit dem Autopiloten lösbar`, () => {
    const res = autoplay(createState(level));
    assert.equal(res.won, true, `Autopilot scheitert: ${res.reason}`);
  });
}

test('Physik ist deterministisch', () => {
  const a = createState(LEVELS[2]);
  const b = createState(LEVELS[2]);
  const ra = autoplay(a);
  const rb = autoplay(b);
  assert.deepEqual(ra, rb);
  assert.deepEqual(a.ball, b.ball);
});

test('Ohne Schläger geht der Ball an der Wand verloren', () => {
  const s = createState({ ...LEVELS[0], start: { ring: 0, dir: 0, paddle: 180 } });
  launch(s);
  for (let n = 0; n < 240 && s.phase === 'play'; n++) step(s);
  assert.equal(s.phase, 'fail');
  assert.equal(s.failReason, 'wand');
});

test('Nach einem Fehler startet der Versuch neu', () => {
  const s = createState({ ...LEVELS[0], start: { ring: 0, dir: 0, paddle: 180 } });
  launch(s);
  for (let n = 0; n < Math.round(2 / DT); n++) step(s);
  assert.equal(s.phase, 'ready');
  assert.deepEqual(s.ball, { x: 0, y: 0, vx: 0, vy: 0 });
});

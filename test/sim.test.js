import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, step, launch, angDiff, bounceOut, DT } from '../js/sim.js';
import { LEVELS } from '../js/levels.js';
import { autoplay } from './autopilot.js';

test('angDiff liefert die kürzeste Differenz', () => {
  assert.ok(Math.abs(angDiff(0.1, -0.1) - 0.2) < 1e-12);
  assert.ok(Math.abs(angDiff(Math.PI - 0.1, -Math.PI + 0.1) + 0.2) < 1e-12);
  assert.ok(Math.abs(angDiff(7, 7 - 2 * Math.PI)) < 1e-12);
});

for (const level of LEVELS) {
  test(`${level.name}: mit dem Autopiloten lösbar, bei jedem Tempo`, () => {
    for (const tempo of [50, 60, 70, 80, 90, 100, 110, 120]) {
      const res = autoplay(createState(level, { speedFactor: tempo / 100 }));
      assert.equal(res.won, true, `Tempo ${tempo} %: Autopilot scheitert (${res.reason})`);
    }
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

test('Ohne Wandberührungen geht der Ball an der Wand verloren', () => {
  const s = createState({ ...LEVELS[0], wallHits: 0, start: { ring: 0, dir: 0, paddle: 180 } });
  launch(s);
  for (let n = 0; n < 240 && s.phase === 'play'; n++) step(s);
  assert.equal(s.phase, 'fail');
  assert.equal(s.failReason, 'wand');
});

test('Nach einem Fehler startet der Versuch neu', () => {
  const s = createState({ ...LEVELS[0], wallHits: 0, start: { ring: 0, dir: 0, paddle: 180 } });
  launch(s);
  for (let n = 0; n < Math.round(2 / DT); n++) step(s);
  assert.equal(s.phase, 'ready');
  assert.deepEqual(s.ball, { x: 0, y: 0, vx: 0, vy: 0 });
});

test('Innenwand prallt ab und zählt herunter, bei 0 ist der Ball verloren', () => {
  const s = createState({ ...LEVELS[0], wallHits: 2, start: { ring: 0, dir: 0, paddle: 180 } });
  launch(s);
  const hits = [];
  for (let n = 0; n < Math.round(10 / DT) && s.phase === 'play'; n++) {
    step(s);
    for (const e of s.events) if (e.type === 'wand') hits.push(e.left);
    s.events.length = 0;
  }
  assert.deepEqual(hits, [1, 0]);
  assert.equal(s.phase, 'fail');
  assert.equal(s.failReason, 'wand');
});

test('Tempo-Faktor verändert die Ballgeschwindigkeit', () => {
  const s = createState(LEVELS[0], { speedFactor: 0.5 });
  launch(s);
  assert.ok(Math.abs(Math.hypot(s.ball.vx, s.ball.vy) - LEVELS[0].speed * 0.5) < 1e-9);
});

test('Alle Level sind mit Pong, Mischung und umgekehrter Ablenkung lösbar', () => {
  const varianten = [
    { mode: 'pong', deflect: 57, reverse: false },
    { mode: 'mix', deflect: 25, reverse: false },
    { mode: 'mix', deflect: 25, reverse: true },
    { mode: 'mix', deflect: 40, reverse: false },
  ];
  for (const bounce of varianten) {
    for (const level of LEVELS) {
      const res = autoplay(createState(level, { bounce }));
      assert.equal(res.won, true, `${level.name} mit ${JSON.stringify(bounce)}: ${res.reason}`);
    }
  }
});

test('Mischung: mittiger Treffer spiegelt, Randtreffer lenkt nach', () => {
  const inward = -Math.PI / 2;                           // Schläger unten, Senkrechte zeigt nach oben
  const vx = Math.cos(Math.PI / 3), vy = Math.sin(Math.PI / 3);  // Ball kommt schräg von links oben
  const mitte = bounceOut({ mode: 'mix', deflect: 25 }, inward, vx, vy, 0);
  assert.ok(Math.abs(angDiff(mitte, -Math.PI / 3)) < 1e-9, 'Einfall = Ausfall');
  const rand = bounceOut({ mode: 'mix', deflect: 25 }, inward, vx, vy, -1);
  const randUm = bounceOut({ mode: 'mix', deflect: 25, reverse: true }, inward, vx, vy, -1);
  assert.ok(Math.abs(angDiff(rand, mitte) - 25 * Math.PI / 180) < 1e-9);
  assert.ok(Math.abs(angDiff(randUm, mitte) + 25 * Math.PI / 180) < 1e-9);
  const physik = bounceOut({ mode: 'physik', deflect: 25 }, inward, vx, vy, -1);
  assert.ok(Math.abs(angDiff(physik, mitte)) < 1e-9, 'Physik lenkt nicht nach');
});

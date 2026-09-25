/* Spielphysik von Orbits – deterministisch und ohne DOM.
   Fester Zeitschritt, kein Zufall: gleiche Eingaben ergeben immer denselben Ablauf.
   Das ist die Grundlage für reproduzierbare Speedrun-Routen und Skips.

   Koordinaten: x nach rechts, y nach unten.
   Winkel im Bogenmaß: 0 = rechts, π/2 = unten, -π/2 = oben (Leveldaten in Grad). */

export const DT = 1 / 240;
export const TAU = Math.PI * 2;

export const BALL_R = 9;
export const WALL = 8;             // Wandstärke der Ringe
export const PADDLE_INSET = 14;    // Schlägermitte liegt so weit innerhalb der Wandmitte
export const PADDLE_T = 8;         // Schlägerdicke
export const PADDLE_LEN = 92;      // Bogenlänge des Schlägers
export const PADDLE_SPEED = 10;    // höchste Schlägergeschwindigkeit in rad/s
export const MAX_DEFLECT = 1.0;    // Ablenkung am Schlägerrand in rad (≈ 57°)
const PADDLE_LEAD = 0.8;           // so weit darf das Schieben dem Schläger vorauslaufen
const FAIL_PAUSE = 0.7;            // Sekunden zwischen Fehler und Neustart
const OUT_MARGIN = 260;            // Abstand zu den Ringen, ab dem der Ball verloren ist
const LOST_TIME = 8;               // Sekunden außerhalb aller Ringe, bis der Ball als verirrt gilt

const rad = deg => deg * Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Kürzeste Winkeldifferenz a − b im Bereich (−π, π]. */
export function angDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d <= -Math.PI) d += TAU;
  return d;
}

export const paddleRadius = ring => ring.r - PADDLE_INSET;
export const paddleHalf = ring => PADDLE_LEN / 2 / paddleRadius(ring);

/** speedFactor verändert das Balltempo (Testeinstellung), 1 = Tempo aus den Leveldaten. */
export function createState(level, { speedFactor = 1 } = {}) {
  const rings = level.rings.map(r => ({
    x: r.x, y: r.y, r: r.r,
    gap: rad(r.gap),
    half: rad(r.gapWidth) / 2,
    goal: !!r.goal,
  }));
  const bounds = {
    minX: Math.min(...rings.map(r => r.x - r.r)) - OUT_MARGIN,
    maxX: Math.max(...rings.map(r => r.x + r.r)) + OUT_MARGIN,
    minY: Math.min(...rings.map(r => r.y - r.r)) - OUT_MARGIN,
    maxY: Math.max(...rings.map(r => r.y + r.r)) + OUT_MARGIN,
  };
  const s = {
    level, rings, bounds,
    speed: level.speed * speedFactor,
    maxWallHits: level.wallHits,
    wallLeft: level.wallHits,   // erlaubte Berührungen der Innenwände, für das ganze Level
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    active: 0,              // Ring, auf dessen Schiene der Schläger gerade fährt
    paddle: 0,              // Schlägerwinkel (nicht normiert)
    paddleTarget: 0,
    phase: 'ready',         // ready | play | fail | won
    failReason: null,
    failT: 0,
    outsideT: 0,
    events: [],             // Ereignisse für Klang und Anzeige, werden von außen geleert
  };
  resetAttempt(s);
  return s;
}

/** Setzt Ball, Schläger und Berührungen auf den Levelanfang zurück. */
export function resetAttempt(s) {
  const st = s.level.start;
  const ring = s.rings[st.ring];
  s.active = st.ring;
  s.ball = { x: ring.x, y: ring.y, vx: 0, vy: 0 };
  s.wallLeft = s.maxWallHits;
  s.paddle = s.paddleTarget = rad(st.paddle);
  s.phase = 'ready';
  s.failReason = null;
  s.failT = 0;
  s.outsideT = 0;
}

export function launch(s) {
  if (s.phase !== 'ready') return false;
  const a = rad(s.level.start.dir);
  s.ball.vx = Math.cos(a) * s.speed;
  s.ball.vy = Math.sin(a) * s.speed;
  s.phase = 'play';
  s.events.push({ type: 'start' });
  return true;
}

/** Schieben: Schlägerziel relativ verschieben. */
export function nudgePaddle(s, delta) {
  s.paddleTarget = clamp(s.paddleTarget + delta, s.paddle - PADDLE_LEAD, s.paddle + PADDLE_LEAD);
}

/** Zeigen: Schlägerziel auf einen absoluten Winkel setzen (kürzester Weg). */
export function aimPaddle(s, angle) {
  s.paddleTarget = s.paddle + angDiff(angle, s.paddle);
}

/** Ein fester Zeitschritt. */
export function step(s) {
  if (s.phase === 'ready' || s.phase === 'play') {
    const move = PADDLE_SPEED * DT;
    s.paddle += clamp(s.paddleTarget - s.paddle, -move, move);
  }

  if (s.phase === 'fail') {
    s.failT += DT;
    if (s.failT >= FAIL_PAUSE) resetAttempt(s);
    return;
  }

  if (s.phase === 'won') {
    // Ball gleitet in die Mitte des Zielrings
    const g = s.rings[s.active];
    s.ball.x += (g.x - s.ball.x) * 0.03;
    s.ball.y += (g.y - s.ball.y) * 0.03;
    return;
  }

  if (s.phase !== 'play') return;

  const b = s.ball;
  const px = b.x, py = b.y;
  b.x += b.vx * DT;
  b.y += b.vy * DT;

  let inside = false;
  for (let i = 0; i < s.rings.length; i++) {
    collideRing(s, i, px, py);
    if (s.phase !== 'play') return;
    const r = s.rings[i];
    if (Math.hypot(b.x - r.x, b.y - r.y) < r.r) inside = true;
  }

  s.outsideT = inside ? 0 : s.outsideT + DT;
  const bo = s.bounds;
  if (b.x < bo.minX || b.x > bo.maxX || b.y < bo.minY || b.y > bo.maxY) fail(s, 'leere');
  else if (s.outsideT > LOST_TIME) fail(s, 'verirrt');
}

function fail(s, reason) {
  s.phase = 'fail';
  s.failReason = reason;
  s.failT = 0;
  s.events.push({ type: 'fehler', reason });
}

function reflect(b, nx, ny) {
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    b.vx -= 2 * vn * nx;
    b.vy -= 2 * vn * ny;
    return true;
  }
  return false;
}

function collideRing(s, i, px, py) {
  const ring = s.rings[i];
  const b = s.ball;
  const dx = b.x - ring.x, dy = b.y - ring.y;
  const d = Math.hypot(dx, dy);
  const wasInside = Math.hypot(px - ring.x, py - ring.y) < ring.r;
  if (!wasInside && d > ring.r + WALL / 2 + BALL_R + 2) return;

  // Die beiden Kanten der Öffnung sind runde Enden und prallen immer ab
  const capMin = BALL_R + WALL / 2;
  for (const sgn of [-1, 1]) {
    const ea = ring.gap + sgn * ring.half;
    const ex = ring.x + Math.cos(ea) * ring.r;
    const ey = ring.y + Math.sin(ea) * ring.r;
    const cx = b.x - ex, cy = b.y - ey;
    const cd = Math.hypot(cx, cy);
    if (cd < capMin && cd > 0) {
      const nx = cx / cd, ny = cy / cd;
      if (reflect(b, nx, ny)) s.events.push({ type: 'kante' });
      b.x = ex + nx * capMin;
      b.y = ey + ny * capMin;
      return;
    }
  }

  const ang = Math.atan2(dy, dx);
  const inGap = Math.abs(angDiff(ang, ring.gap)) < ring.half;

  if (wasInside) {
    // Schläger: nur auf dem aktiven Ring, beliebig oft
    if (i === s.active && !ring.goal) {
      const pr = paddleRadius(ring);
      const inner = pr - PADDLE_T / 2;
      const vr = (b.vx * dx + b.vy * dy) / d;
      if (d + BALL_R >= inner && vr > 0) {
        const off = angDiff(ang, s.paddle);
        const ph = paddleHalf(ring);
        if (Math.abs(off) <= ph + BALL_R / pr) {
          // Wie bei Pong bestimmt die Trefferstelle den Abprallwinkel, nicht der Einfallswinkel
          const k = clamp(off / ph, -1, 1);
          const out = Math.atan2(-dy, -dx) - k * MAX_DEFLECT;
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(out) * sp;
          b.vy = Math.sin(out) * sp;
          const pd = inner - BALL_R;
          b.x = ring.x + dx / d * pd;
          b.y = ring.y + dy / d * pd;
          s.events.push({ type: 'schlag', ring: i });
          return;
        }
      }
    }
    // Innenwand: prallt ab und kostet eine Wandberührung; sind keine mehr übrig, ist der Ball verloren
    if (d + BALL_R >= ring.r - WALL / 2 && !inGap) {
      if (s.wallLeft <= 0) {
        fail(s, 'wand');
        return;
      }
      const nx = -dx / d, ny = -dy / d;
      if (reflect(b, nx, ny)) {
        s.wallLeft--;
        s.events.push({ type: 'wand', ring: i, left: s.wallLeft, x: ring.x - nx * ring.r, y: ring.y - ny * ring.r });
      }
      const pd = ring.r - WALL / 2 - BALL_R;
      b.x = ring.x - nx * pd;
      b.y = ring.y - ny * pd;
    }
  } else {
    // Außenwand: Ball prallt ab (Bande)
    if (d - BALL_R <= ring.r + WALL / 2 && !inGap) {
      const nx = dx / d, ny = dy / d;
      if (reflect(b, nx, ny)) s.events.push({ type: 'bande' });
      const pd = ring.r + WALL / 2 + BALL_R;
      b.x = ring.x + nx * pd;
      b.y = ring.y + ny * pd;
      return;
    }
    if (d < ring.r) enterRing(s, i);
  }
}

function enterRing(s, i) {
  const ring = s.rings[i];
  if (ring.goal) {
    s.active = i;
    s.phase = 'won';
    s.events.push({ type: 'ziel' });
    return;
  }
  if (i !== s.active) {
    s.active = i;
    // Neuer Ring: Schläger startet gegenüber der Öffnung
    s.paddle = s.paddleTarget = ring.gap + Math.PI;
  }
  s.events.push({ type: 'rein', ring: i });
}

/** Punkte für nicht verbrauchte Wandberührungen. */
export function score(s) {
  return s.wallLeft * 100;
}

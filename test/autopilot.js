/* Autopilot für Tests: fängt jeden Ball und zielt auf die Öffnung des nächsten Rings.
   Beweist, dass jedes Level lösbar ist, und prüft die Physik auf Determinismus. */

import { step, launch, aimPaddle, paddleRadius, paddleHalf, BALL_R, PADDLE_T, MAX_DEFLECT, angDiff, DT } from '../js/sim.js';

function landing(s) {
  const ring = s.rings[s.active];
  const b = s.ball;
  const R = paddleRadius(ring) - PADDLE_T / 2 - BALL_R;
  const sp = Math.hypot(b.vx, b.vy);
  const ux = b.vx / sp, uy = b.vy / sp;
  const qx = b.x - ring.x, qy = b.y - ring.y;
  const qu = qx * ux + qy * uy;
  const disc = qu * qu - (qx * qx + qy * qy - R * R);
  if (disc < 0) return null;
  const t = -qu + Math.sqrt(disc);
  return { x: b.x + ux * t, y: b.y + uy * t };
}

/** Kreuzt der Schuss von L in Richtung ang die Ringwand sauber innerhalb der Öffnung? */
function clearsGap(ring, L, ang) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const qx = L.x - ring.x, qy = L.y - ring.y;
  const qu = qx * ux + qy * uy;
  const disc = qu * qu - (qx * qx + qy * qy - ring.r * ring.r);
  if (disc < 0) return false;
  const t = -qu + Math.sqrt(disc);
  const a = Math.atan2(qy + uy * t, qx + ux * t);
  return Math.abs(angDiff(a, ring.gap)) < ring.half - (BALL_R + 6) / ring.r;
}

/** Steuert einen Zeitschritt. aimOffset verschiebt das Ziel entlang der Öffnung (in Einheiten). */
export function autopilotStep(s, aimOffset = 0) {
  if (s.phase === 'ready') launch(s);
  const ring = s.rings[s.active];
  const inside = Math.hypot(s.ball.x - ring.x, s.ball.y - ring.y) < ring.r;
  if (s.phase === 'play' && inside) {
    const L = landing(s);
    const next = s.rings[Math.min(s.active + 1, s.rings.length - 1)];
    const landAng = L && Math.atan2(L.y - ring.y, L.x - ring.x);
    if (L && Math.abs(angDiff(landAng, ring.gap)) < ring.half) {
      // Ball fliegt durch die Öffnung: Schläger aus dem Weg
      aimPaddle(s, ring.gap + Math.PI);
    } else if (L) {
      const hitAng = Math.atan2(L.y - ring.y, L.x - ring.x);
      const tx = next.x + Math.cos(next.gap) * next.r - Math.sin(next.gap) * aimOffset;
      const ty = next.y + Math.sin(next.gap) * next.r + Math.cos(next.gap) * aimOffset;
      let want = Math.atan2(ty - L.y, tx - L.x);
      if (!clearsGap(ring, L, want)) {
        // Direkter Weg verbaut: erst auf die Seite gegenüber der Öffnung spielen
        const R = paddleRadius(ring);
        const px = ring.x - Math.cos(ring.gap) * R, py = ring.y - Math.sin(ring.gap) * R;
        want = Math.atan2(py - L.y, px - L.x);
      }
      const k = Math.max(-1, Math.min(1, angDiff(hitAng + Math.PI, want) / MAX_DEFLECT));
      aimPaddle(s, hitAng - k * paddleHalf(ring));
    }
  }
  step(s);
}

/** Spielt ein Level bis zum Ziel oder Fehler. Liefert Ergebnis und benötigte Zeitschritte. */
export function autoplay(s, { aimOffset = 0, maxSeconds = 30 } = {}) {
  const max = Math.round(maxSeconds / DT);
  for (let n = 0; n < max; n++) {
    autopilotStep(s, aimOffset);
    if (s.phase === 'won') return { won: true, steps: n + 1 };
    if (s.phase === 'fail') return { won: false, steps: n + 1, reason: s.failReason };
  }
  return { won: false, steps: max, reason: 'zeit' };
}

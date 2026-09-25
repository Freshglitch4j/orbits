/* Orbits – Darstellung, Eingabe, Menüs und Zeitmessung. Die Physik steckt in sim.js. */

import {
  DT, TAU, BALL_R, WALL, PADDLE_T, PADDLE_SPEED,
  createState, step, launch, resetAttempt, nudgePaddle, aimPaddle,
  paddleRadius, paddleHalf, score, touchesLeft,
} from './sim.js';
import { LEVELS } from './levels.js';

const COL = {
  bg: '#070B14',
  grid: 'rgba(140, 160, 210, 0.10)',
  ring: '#5E6A8E',
  ringAktiv: '#DCE4FF',
  oeffnung: 'rgba(55, 226, 255, 0.35)',
  gold: '#F7C548',
  schlaeger: '#37E2FF',
  schlaegerLeer: 'rgba(55, 226, 255, 0.22)',
  ball: '#FFFFFF',
  rot: '#FF4D6A',
  punkt: 'rgba(220, 228, 255, 0.6)',
  punktLeer: 'rgba(220, 228, 255, 0.12)',
};

const FEHLER = {
  wand: ['Ball verloren', 'Der Ball hat die Innenwand berührt.'],
  leer: ['Keine Berührungen mehr', 'Jeder Ring erlaubt nur wenige Schläge.'],
  leere: ['Ins Leere geflogen', 'Der Ball hat das Spielfeld verlassen.'],
  verirrt: ['Ball verirrt', 'Zu lange außerhalb der Ringe.'],
};

const SCHIEBE_GAIN = 1.3;   // Empfindlichkeit beim Schieben

const $ = id => document.getElementById(id);
const canvas = $('spiel');
const ctx = canvas.getContext('2d');
const hud = $('hud');

/* ---------- Speicher ---------- */

const KEY = 'orbits.v1';
const store = { settings: { steuerung: 'schieben', ton: true }, best: { run: null, levels: {} } };
try {
  const d = JSON.parse(localStorage.getItem(KEY) || '{}');
  Object.assign(store.settings, d.settings);
  if (d.best) {
    store.best.run = d.best.run ?? null;
    store.best.levels = { ...d.best.levels };
  }
} catch { /* ohne Speicher spielbar */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* ignorieren */ }
}

/** Zeitschritte → „m:ss,hh“ */
function zeit(steps) {
  const cs = Math.floor(steps * 5 / 12);   // 240 Schritte = 100 Hundertstel
  const m = Math.floor(cs / 6000);
  const s = Math.floor(cs / 100) % 60;
  return `${m}:${String(s).padStart(2, '0')},${String(cs % 100).padStart(2, '0')}`;
}

/* ---------- Klang ---------- */

let actx = null;
function unlockAudio() {
  if (!store.settings.ton) return;
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  }
  if (actx.state === 'suspended') actx.resume();
}
function ton(freq, dur = 0.08, type = 'sine', vol = 0.12, delay = 0) {
  if (!actx || !store.settings.ton) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(actx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function vibe(ms) {
  if (store.settings.ton && navigator.vibrate) navigator.vibrate(ms);
}

/* ---------- Spielzustand ---------- */

let game = null;
const demo = createState(LEVELS[0]);   // Hintergrund im Menü

function startLevel(mode, index, runSteps = 0, results = []) {
  const level = LEVELS[index];
  game = {
    mode, index, level, results, runSteps,
    s: createState(level),
    levelSteps: 0,
    started: false,
    paused: false,
    tries: 1,
    winT: -1,
    dialogShown: false,
    trail: [],
    flash: 0,
  };
  pointerId = null;
  showScreen(null);
  hud.hidden = false;
  snapCamera();
}

function toMenu() {
  game = null;
  hud.hidden = true;
  $('meldung').hidden = true;
  refreshMenu();
  showScreen('menue');
  snapCamera();
}

function pause() {
  if (!game || game.paused || game.winT >= 0) return;
  game.paused = true;
  pointerId = null;
  const rows = [['Levelzeit', zeit(game.levelSteps)]];
  if (game.mode === 'run') rows.push(['Gesamtzeit', zeit(game.runSteps)]);
  dialog('Pause', rows, [
    ['Weiter', resume, true],
    ['Level neu starten', restartLevel],
    ['Zum Menü', toMenu],
  ]);
}

function resume() {
  showScreen(null);
  game.paused = false;
}

function restartLevel() {
  if (game.mode === 'uebung') return startLevel('uebung', game.index);
  // Im Run läuft die Zeit weiter – ein Neustart zählt wie ein Fehlversuch
  resetAttempt(game.s);
  game.tries++;
  game.trail = [];
  resume();
}

function win() {
  const g = game;
  g.winT = 0;
  const id = g.level.id;
  const prev = store.best.levels[id];
  g.newBest = prev == null || g.levelSteps < prev;
  if (g.newBest) store.best.levels[id] = g.levelSteps;
  g.points = score(g.s);
  g.left = touchesLeft(g.s);
  if (g.mode === 'run') {
    g.results.push({ name: g.level.name, steps: g.levelSteps });
    if (g.index === LEVELS.length - 1) {
      g.runNewBest = store.best.run == null || g.runSteps < store.best.run;
      if (g.runNewBest) store.best.run = g.runSteps;
    }
  }
  save();
  ton(523, 0.12, 'sine', 0.14);
  ton(659, 0.12, 'sine', 0.14, 0.09);
  ton(784, 0.12, 'sine', 0.14, 0.18);
  ton(1047, 0.25, 'sine', 0.14, 0.27);
  vibe(30);
}

function showWinDialog() {
  const g = game;
  g.dialogShown = true;
  const last = g.index === LEVELS.length - 1;

  if (g.mode === 'run' && last) {
    const rows = g.results.map((r, i) => [`${i + 1} · ${r.name}`, zeit(r.steps)]);
    rows.push(['Gesamtzeit', zeit(g.runSteps), g.runNewBest]);
    rows.push(['Bestzeit Run', zeit(store.best.run)]);
    dialog(g.runNewBest ? 'Neue Bestzeit!' : 'Run geschafft!', rows, [
      ['Neuer Run', () => startLevel('run', 0), true],
      ['Zum Menü', toMenu],
    ]);
    return;
  }

  const rows = [
    ['Levelzeit', zeit(g.levelSteps), g.newBest],
    ['Bestzeit', zeit(store.best.levels[g.level.id])],
    ['Versuche', String(g.tries)],
    ['Berührungen übrig', String(g.left)],
    ['Punkte', g.points.toLocaleString('de-AT')],
  ];
  if (g.mode === 'run') {
    rows.push(['Gesamtzeit', zeit(g.runSteps)]);
    dialog('Geschafft!', rows, [
      ['Weiter', () => startLevel('run', g.index + 1, g.runSteps, g.results), true],
      ['Run abbrechen', toMenu],
    ]);
  } else {
    const buttons = [['Nochmal', () => startLevel('uebung', g.index), !last]];
    if (!last) buttons.unshift(['Nächstes Level', () => startLevel('uebung', g.index + 1), true]);
    buttons.push(['Zum Menü', toMenu]);
    dialog('Geschafft!', rows, buttons.map(([l, f], i) => [l, f, i === 0]));
  }
}

function handleEvents() {
  const s = game.s;
  for (const e of s.events) {
    switch (e.type) {
      case 'start': game.started = true; break;
      case 'schlag': ton(440 + e.left * 70, 0.07, 'sine', 0.14); vibe(8); break;
      case 'bande': ton(260, 0.06, 'triangle', 0.12); break;
      case 'kante': ton(380, 0.05, 'triangle', 0.1); break;
      case 'rein': ton(660, 0.08, 'sine', 0.1); ton(880, 0.1, 'sine', 0.1, 0.07); break;
      case 'fehler':
        game.tries++;
        game.flash = 1;
        ton(140, 0.3, 'sawtooth', 0.08);
        vibe(60);
        break;
      case 'ziel': win(); break;
    }
  }
  s.events.length = 0;
}

/* ---------- Oberfläche ---------- */

function showScreen(id) {
  for (const sid of ['menue', 'uebung', 'dialog']) $(sid).hidden = sid !== id;
}

function dialog(title, rows, buttons) {
  $('dialog-titel').textContent = title;
  const dl = $('dialog-werte');
  dl.replaceChildren();
  for (const [k, v, neu] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    if (neu) dd.className = 'neu';
    dl.append(dt, dd);
  }
  const box = $('dialog-knoepfe');
  box.replaceChildren();
  for (const [label, fn, haupt] of buttons) {
    const b = document.createElement('button');
    b.textContent = label;
    if (haupt) b.className = 'haupt';
    b.addEventListener('click', fn);
    box.append(b);
  }
  showScreen('dialog');
}

function refreshMenu() {
  $('run-best').textContent = store.best.run != null
    ? `Bestzeit: ${zeit(store.best.run)}`
    : `${LEVELS.length} Level am Stück, auf Zeit`;
  $('steuerung').textContent = `Steuerung: ${store.settings.steuerung === 'zeigen' ? 'Zeigen' : 'Schieben'}`;
  $('ton').textContent = `Ton: ${store.settings.ton ? 'an' : 'aus'}`;
}

function openPractice() {
  const list = $('level-liste');
  list.replaceChildren();
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button');
    const name = document.createElement('span');
    name.textContent = `${i + 1} · ${lv.name}`;
    const best = document.createElement('span');
    best.className = 'best';
    const t = store.best.levels[lv.id];
    best.textContent = t != null ? zeit(t) : '–';
    b.append(name, best);
    b.addEventListener('click', () => startLevel('uebung', i));
    list.append(b);
  });
  showScreen('uebung');
}

$('run-start').addEventListener('click', () => { unlockAudio(); startLevel('run', 0); });
$('uebung-oeffnen').addEventListener('click', () => { unlockAudio(); openPractice(); });
$('uebung-zurueck').addEventListener('click', () => showScreen('menue'));
$('steuerung').addEventListener('click', () => {
  store.settings.steuerung = store.settings.steuerung === 'zeigen' ? 'schieben' : 'zeigen';
  save();
  refreshMenu();
});
$('ton').addEventListener('click', () => {
  store.settings.ton = !store.settings.ton;
  save();
  refreshMenu();
  unlockAudio();
});
$('pause').addEventListener('click', pause);

let hudCache = '';
let msgCache = '';
function updateHud() {
  if (!game) return;
  const g = game;
  const t = g.mode === 'run' ? g.runSteps : g.levelSteps;
  const info = `${g.mode === 'run' ? `Level ${g.index + 1}/${LEVELS.length}` : 'Übung'} · ${g.level.name}`;
  const key = `${t}|${info}|${g.tries}`;
  if (key !== hudCache) {
    hudCache = key;
    $('zeit').textContent = zeit(t);
    $('level-info').textContent = info;
    $('versuche').textContent = `Versuch ${g.tries}`;
  }

  const s = g.s;
  let title = '', text = '', cls = '';
  if (s.phase === 'ready') {
    title = g.started ? 'Tippen zum Weiterspielen' : 'Tippen zum Start';
    text = g.started ? '' : g.level.hint;
  } else if (s.phase === 'fail') {
    [title, text] = FEHLER[s.failReason] || ['Fehler', ''];
    cls = 'fehler';
  }
  const mkey = `${title}|${text}|${cls}`;
  if (mkey !== msgCache) {
    msgCache = mkey;
    const m = $('meldung');
    m.hidden = !title;
    m.className = cls;
    $('meldung-titel').textContent = title;
    $('meldung-text').textContent = text;
  }
}

/* ---------- Kamera ---------- */

const cam = { x: 0, y: 0, z: 1 };

function viewRect() {
  const top = hud.hidden ? 16 : hud.offsetHeight + 8;
  // Solange unten eine Meldung steht, rückt das Spielfeld nach oben
  const m = $('meldung');
  const bottom = m.hidden ? 24 : m.offsetHeight + 72;
  return { x: 0, y: top, w: innerWidth, h: Math.max(100, innerHeight - top - bottom) };
}

function camTarget() {
  let rings, ball = null;
  if (game) {
    const s = game.s;
    rings = [s.rings[s.active], s.rings[Math.min(s.active + 1, s.rings.length - 1)]];
    ball = s.ball;
  } else {
    rings = demo.rings;
  }
  const pad = WALL + 20;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const r of rings) {
    minX = Math.min(minX, r.x - r.r - pad); maxX = Math.max(maxX, r.x + r.r + pad);
    minY = Math.min(minY, r.y - r.r - pad); maxY = Math.max(maxY, r.y + r.r + pad);
  }
  if (ball) {
    minX = Math.min(minX, ball.x - 40); maxX = Math.max(maxX, ball.x + 40);
    minY = Math.min(minY, ball.y - 40); maxY = Math.max(maxY, ball.y + 40);
  }
  const v = viewRect();
  const z = Math.min(v.w / (maxX - minX), v.h / (maxY - minY), 2.5);
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z };
}

function snapCamera() {
  Object.assign(cam, camTarget());
}

function updateCamera(dt) {
  const t = camTarget();
  const k = 1 - Math.exp(-dt * 4);
  cam.x += (t.x - cam.x) * k;
  cam.y += (t.y - cam.y) * k;
  cam.z *= Math.exp(Math.log(t.z / cam.z) * k);
}

function toScreen(x, y) {
  const v = viewRect();
  return { x: (x - cam.x) * cam.z + v.x + v.w / 2, y: (y - cam.y) * cam.z + v.y + v.h / 2 };
}

/* ---------- Eingabe ---------- */

let pointerId = null;
let lastPt = null;

function aimAt(e) {
  const s = game.s;
  const ring = s.rings[s.active];
  const c = toScreen(ring.x, ring.y);
  aimPaddle(s, Math.atan2(e.clientY - c.y, e.clientX - c.x));
}

canvas.addEventListener('pointerdown', e => {
  if (!game || game.paused || game.winT >= 0 || pointerId !== null) return;
  unlockAudio();
  pointerId = e.pointerId;
  lastPt = { x: e.clientX, y: e.clientY };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ignorieren */ }
  if (game.s.phase === 'ready') launch(game.s);
  if (store.settings.steuerung === 'zeigen') aimAt(e);
});

canvas.addEventListener('pointermove', e => {
  if (!game || e.pointerId !== pointerId || game.paused) return;
  const s = game.s;
  if (store.settings.steuerung === 'zeigen') {
    aimAt(e);
  } else {
    // Schieben: Fingerbewegung entlang der Schiene projizieren
    const wx = (e.clientX - lastPt.x) / cam.z;
    const wy = (e.clientY - lastPt.y) / cam.z;
    const p = s.paddle;
    const along = wx * -Math.sin(p) + wy * Math.cos(p);
    nudgePaddle(s, along / paddleRadius(s.rings[s.active]) * SCHIEBE_GAIN);
  }
  lastPt = { x: e.clientX, y: e.clientY };
});

const endPointer = e => { if (e.pointerId === pointerId) pointerId = null; };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

// Tastatur zum Testen am Rechner: ← → drehen, Leertaste startet, Esc pausiert
const keys = new Set();
addEventListener('keydown', e => {
  if (!game) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys.add(e.key); e.preventDefault(); }
  if ((e.key === ' ' || e.key === 'ArrowUp') && !game.paused && game.winT < 0) {
    unlockAudio();
    launch(game.s);
    e.preventDefault();
  }
  if (e.key === 'Escape' || e.key === 'p') game.paused ? resume() : pause();
});
addEventListener('keyup', e => keys.delete(e.key));

function keyboardInput(dt) {
  const dir = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  if (dir) nudgePaddle(game.s, dir * PADDLE_SPEED * dt * 1.05);
}

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('gesturestart', e => e.preventDefault());

/* ---------- Zeichnen ---------- */

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
}
addEventListener('resize', resize);
resize();

function draw() {
  const dpr = canvas.width / innerWidth;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const v = viewRect();
  const z = cam.z;
  const ox = v.x + v.w / 2 - cam.x * z;
  const oy = v.y + v.h / 2 - cam.y * z;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);

  drawGrid(-ox / z, -oy / z, innerWidth / z, innerHeight / z, z);
  const s = game ? game.s : demo;
  drawRings(s);
  drawPaddle(s);
  if (game) {
    drawBall(s);
    if (game.flash > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(255, 77, 106, ${game.flash * 0.18})`;
      ctx.fillRect(0, 0, innerWidth, innerHeight);
    }
  }
}

function drawGrid(x0, y0, w, h, z) {
  const g = 60;
  const size = 2.2 / z;
  ctx.fillStyle = COL.grid;
  for (let x = Math.floor(x0 / g) * g; x < x0 + w; x += g) {
    for (let y = Math.floor(y0 / g) * g; y < y0 + h; y += g) {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
}

function drawRings(s) {
  ctx.lineCap = 'round';
  s.rings.forEach((ring, i) => {
    const active = game && i === s.active;
    if (ring.goal) {
      ctx.fillStyle = 'rgba(247, 197, 72, 0.06)';
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r - WALL / 2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(247, 197, 72, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 14, 0, TAU);
      ctx.stroke();
    }
    // Öffnung andeuten
    ctx.strokeStyle = ring.goal ? 'rgba(247, 197, 72, 0.35)' : COL.oeffnung;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, ring.gap - ring.half, ring.gap + ring.half);
    ctx.stroke();
    ctx.setLineDash([]);
    // Wand
    ctx.strokeStyle = ring.goal ? COL.gold : active ? COL.ringAktiv : COL.ring;
    ctx.lineWidth = WALL;
    if (ring.goal) { ctx.shadowColor = COL.gold; ctx.shadowBlur = 16; }
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, ring.gap + ring.half, ring.gap - ring.half + TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  // Verbleibende Berührungen des aktiven Rings als Punkte in der Mitte
  if (!game) return;
  const ring = s.rings[s.active];
  if (ring.goal) return;
  const n = ring.maxTouches;
  const gap = 14;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = k < ring.touches ? COL.punkt : COL.punktLeer;
    ctx.beginPath();
    ctx.arc(ring.x + (k - (n - 1) / 2) * gap, ring.y + 34, 3.5, 0, TAU);
    ctx.fill();
  }
}

function drawPaddle(s) {
  const ring = s.rings[s.active];
  if (ring.goal) return;
  const pr = paddleRadius(ring);
  const ph = paddleHalf(ring);
  const voll = ring.touches > 0;
  ctx.strokeStyle = voll ? COL.schlaeger : COL.schlaegerLeer;
  ctx.lineWidth = PADDLE_T;
  ctx.lineCap = 'round';
  if (voll) { ctx.shadowColor = COL.schlaeger; ctx.shadowBlur = 14; }
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, pr, s.paddle - ph, s.paddle + ph);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBall(s) {
  const b = s.ball;
  const tr = game.trail;
  for (let i = 1; i < tr.length; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${(i / tr.length) * 0.35})`;
    ctx.lineWidth = BALL_R * 2 * (i / tr.length);
    ctx.beginPath();
    ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
    ctx.lineTo(tr[i].x, tr[i].y);
    ctx.stroke();
  }

  if (s.phase === 'ready') {
    // Abschussrichtung andeuten
    const a = s.level.start.dir * Math.PI / 180;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(b.x + Math.cos(a) * 16, b.y + Math.sin(a) * 16);
    ctx.lineTo(b.x + Math.cos(a) * 70, b.y + Math.sin(a) * 70);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (s.phase === 'fail') {
    const t = s.failT / 0.7;
    ctx.strokeStyle = `rgba(255, 77, 106, ${Math.max(0, 1 - t)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R + t * 40, 0, TAU);
    ctx.stroke();
  }

  ctx.fillStyle = s.phase === 'fail' ? COL.rot : s.phase === 'won' ? COL.gold : COL.ball;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(b.x, b.y, BALL_R, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ---------- Hauptschleife ---------- */

let last = performance.now();
let acc = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  if (game && !game.paused) {
    keyboardInput(dt);
    acc += dt;
    while (acc >= DT) {
      acc -= DT;
      const before = game.s.phase;
      step(game.s);
      if (game.started && before !== 'won') {
        game.levelSteps++;
        game.runSteps++;
      }
    }
    handleEvents();

    const s = game.s;
    if (s.phase === 'play' || s.phase === 'won') {
      game.trail.push({ x: s.ball.x, y: s.ball.y });
      if (game.trail.length > 18) game.trail.shift();
    } else if (s.phase === 'ready') {
      game.trail = [];
    }
    game.flash = Math.max(0, game.flash - dt * 3);

    if (game.winT >= 0) {
      game.winT += dt;
      if (game.winT > 0.9 && !game.dialogShown) showWinDialog();
    }
    updateHud();
  } else {
    acc = 0;
    if (!game) demo.paddle += dt * 0.8;
  }

  // game kann durch einen Dialog-Knopf inzwischen gewechselt haben
  updateCamera(dt);
  draw();
  requestAnimationFrame(frame);
}

refreshMenu();
snapCamera();
requestAnimationFrame(frame);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline-Modus optional */ });
}

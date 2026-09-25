/* Erzeugt die App-Icons mit Playwright (Chromium) aus einer Canvas-Zeichnung.
   Aufruf: node tools/icons.mjs */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const draw = ([size, maskable]) => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#070B14';
  g.fillRect(0, 0, size, size);
  const k = size / 512 * (maskable ? 0.72 : 0.9);
  g.translate(size / 2, size / 2);
  g.scale(k, k);
  g.lineCap = 'round';
  const gap = -Math.PI / 2, half = 0.36;
  g.strokeStyle = '#DCE4FF';
  g.lineWidth = 26;
  g.beginPath();
  g.arc(0, 0, 200, gap + half, gap - half + Math.PI * 2);
  g.stroke();
  g.strokeStyle = '#37E2FF';
  g.shadowColor = '#37E2FF';
  g.shadowBlur = 30;
  g.lineWidth = 26;
  g.beginPath();
  g.arc(0, 0, 150, Math.PI / 2 + 0.15 - 0.42, Math.PI / 2 + 0.15 + 0.42);
  g.stroke();
  g.fillStyle = '#FFFFFF';
  g.shadowColor = '#FFFFFF';
  g.shadowBlur = 24;
  g.beginPath();
  g.arc(-28, -60, 30, 0, Math.PI * 2);
  g.fill();
  return c.toDataURL('image/png');
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, maskable] of [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['icon-180.png', 180, true],
]) {
  const url = await page.evaluate(draw, [size, maskable]);
  writeFileSync(new URL(`../icons/${file}`, import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();

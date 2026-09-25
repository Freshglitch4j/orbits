/* Leveldaten. Winkel in Grad: 0 = rechts, 90 = unten, -90 = oben.
   gap / gapWidth: Mitte und Breite der Öffnung. Der Ring mit goal: true ist das Ziel.
   start: Startring, Abschussrichtung des Balls und Startposition des Schlägers. */

export const LEVELS = [
  {
    id: 'l1',
    name: 'Erste Bahn',
    hint: 'Fang den Ball mit dem Schläger und schick ihn durch die Öffnung in den goldenen Ring.',
    speed: 320,
    touches: 5,
    rings: [
      { x: 0, y: 0, r: 150, gap: -90, gapWidth: 36 },
      { x: 0, y: -400, r: 150, gap: 90, gapWidth: 48, goal: true },
    ],
    start: { ring: 0, dir: 70, paddle: 90 },
  },
  {
    id: 'l2',
    name: 'Versatz',
    hint: 'Wo du den Ball auf dem Schläger triffst, bestimmt, wohin er fliegt.',
    speed: 340,
    touches: 5,
    rings: [
      { x: 0, y: 0, r: 150, gap: -60, gapWidth: 36 },
      { x: 230, y: -380, r: 150, gap: 120, gapWidth: 44, goal: true },
    ],
    start: { ring: 0, dir: 120, paddle: 90 },
  },
  {
    id: 'l3',
    name: 'Umkehr',
    hint: 'Jeder Ring hat nur eine Öffnung: Hinein und hinaus geht es durch dieselbe.',
    speed: 350,
    touches: 4,
    rings: [
      { x: -150, y: 0, r: 130, gap: -58, gapWidth: 36 },
      { x: 0, y: -340, r: 130, gap: 90, gapWidth: 64 },
      { x: 150, y: 0, r: 130, gap: -122, gapWidth: 44, goal: true },
    ],
    start: { ring: 0, dir: 100, paddle: 90 },
  },
];

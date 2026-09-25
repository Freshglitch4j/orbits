/* Leveldaten. Winkel in Grad: 0 = rechts, 90 = unten, -90 = oben.
   gap / gapWidth: Mitte und Breite der Öffnung. Der Ring mit goal: true ist das Ziel.
   wallHits: erlaubte Berührungen der Innenwände im ganzen Level (der Schläger zählt nicht).
   start: Startring, Abschussrichtung des Balls und Startposition des Schlägers. */

export const LEVELS = [
  {
    id: 'l1',
    name: 'Erste Bahn',
    hint: 'Fang den Ball mit dem Schläger und schick ihn durch die Öffnung in den goldenen Ring. Die Innenwand darfst du 10-mal berühren.',
    speed: 320,
    wallHits: 10,
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
    wallHits: 8,
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
    wallHits: 6,
    rings: [
      { x: -150, y: 0, r: 130, gap: -58, gapWidth: 36 },
      { x: 0, y: -340, r: 130, gap: 90, gapWidth: 64 },
      { x: 150, y: 0, r: 130, gap: -122, gapWidth: 44, goal: true },
    ],
    start: { ring: 0, dir: 100, paddle: 90 },
  },
];

# Orbits – Hinweise für KI-Assistenten

- Das vollständige Spielkonzept, alle Entscheidungen, offene Fragen und die nächsten Schritte stehen in `KONZEPT.md`. Vor jeder Arbeit lesen.
- Mobile-first PWA (installierbar, offline, Vollbild). Physik deterministisch mit festem Zeitschritt – Voraussetzung für reproduzierbare Speedrun-Routen und Skips. Kein `Math.random()` und keine Echtzeit in `js/sim.js`.
- Vanilla JavaScript mit ES-Modulen, kein Framework, kein Build-Schritt. Aufbau und Befehle stehen in `README.md`.
- `npm test` vor jedem Commit. Neue oder geänderte Level müssen mit dem Autopiloten (`test/autopilot.js`) lösbar sein.
- Bei jeder Änderung an ausgelieferten Dateien `CACHE` in `sw.js` hochzählen und neue Dateien in `FILES` eintragen.
- Sprache für UI, Doku und Commit-Messages: Deutsch. Zahlen im deutschen Format (Komma als Dezimaltrennzeichen).
- Entscheidungen, die im Gespräch getroffen werden, in `KONZEPT.md` nachtragen (offene Fragen abhaken, neue ergänzen).

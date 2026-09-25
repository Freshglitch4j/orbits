# Orbits

Mobile Game als PWA: eine Variante von Circle Pong. Der Schläger fährt auf der
Schiene eines fast geschlossenen Rings. Ziel ist, den Ball durch die Öffnung in
den nächsten Ring zu bringen, mit wenigen Berührungen und möglichst schnell.

Das vollständige Spielkonzept steht in [`KONZEPT.md`](KONZEPT.md).

## Stand: Prototyp v0.1

- 3 Level, spielbar als **Run** (am Stück, Gesamtzeit) oder einzeln in der **Übung**
- Schläger auf der Kreisschiene, Ball mit deterministischer Physik
- Berührungslimit pro Ring, Neustart nach Fehler, Bestzeiten auf dem Gerät
- Steuerung **Schieben** (Finger irgendwo bewegen, der Schläger folgt entlang der Schiene)
  oder **Zeigen** (Schläger fährt in Richtung des Fingers)
- Installierbar und offline spielbar

## Spielregeln

- Tippen startet den Ball.
- Berührt der Ball die **Innenwand** eines Rings, ist er verloren.
- Die **Außenwand** eines Rings wirkt als Bande.
- Jeder Ring erlaubt nur wenige Schläge (Punkte in der Ringmitte).
- Wer im goldenen Ring ankommt, hat das Level geschafft.
- Nicht verbrauchte Berührungen ergeben Punkte (später für Upgrades).

## Lokal starten

Kein Build-Schritt. Einen beliebigen statischen Webserver im Projektordner starten, z. B.:

```sh
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen. Am Rechner drehen ← → den Schläger,
die Leertaste startet, Esc pausiert.

## Auf dem Handy spielen

Über GitHub Pages: Repository-Einstellungen → **Pages** → Branch `main`, Ordner `/ (root)`.
Mit einem kostenlosen GitHub-Konto geht das nur bei einem **öffentlichen** Repository.
Danach die Seite im Handy-Browser öffnen und „Zum Startbildschirm hinzufügen“ wählen.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/sim.js` | Physik und Spielregeln, ohne DOM, fester Zeitschritt (1/240 s) |
| `js/levels.js` | Leveldaten (Ringe, Öffnungen, Start) |
| `js/main.js` | Darstellung (Canvas), Eingabe, Kamera, Menüs, Zeitmessung, Klang |
| `sw.js` | Service Worker für den Offline-Betrieb. **Bei jeder neuen Version `CACHE` hochzählen.** |
| `test/` | Tests mit `node --test`, inkl. Autopilot, der jedes Level lösen muss |
| `tools/icons.mjs` | Erzeugt die App-Icons (braucht Playwright) |

## Tests

```sh
npm test
```

Die Tests prüfen, dass jedes Level mit dem Autopiloten lösbar ist und die Physik
deterministisch bleibt. Neue Level daher immer mit einem Testlauf absichern.

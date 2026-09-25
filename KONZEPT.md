# Orbits – Spielkonzept (Arbeitstitel, im Brainstorming „Orbit-Kette“)

> Stand: 2026-09-25 · Ergebnis einer Brainstorming-Session (Mensch + KI), Prototyp v0.1 umgesetzt.
> Zweck dieser Datei: Übergabe an Entwickler/KI – alles, was bisher entschieden ist, was offen ist und was als Nächstes kommt.
> Sprache des Spiels & der Doku: Deutsch.

## 1. Pitch in einem Satz

Ein Physik-Geschicklichkeitsspiel, abgeleitet von „Circle Pong“: Der Spieler lenkt einen Ball mit einem Schläger, der auf der Schiene eines fast geschlossenen Rings läuft, durch dessen Öffnung und durch eine scheinbar chaotische, in Wahrheit deterministische Außenwelt in den nächsten Ring – mit begrenzten Berührungen, auf Zeit, mit Builds, die völlig unterschiedliche Routen (und Speedrun-Skips) ermöglichen.

## 2. Abgrenzung zu existierenden Spielen

„Circle Pong“ / „Circular Pong“ existiert bereits vielfach (Steam, App Store, itch.io, Browser): ein Kreis, ein Schläger auf der Kreisbahn, Ball im Inneren halten, Highscore/Survival.
**Unser Spiel unterscheidet sich durch:** Ziel ist, den Ball *hinaus* zu bringen (nicht drin zu halten), mehrere verkettete Ringe pro Level, eine Außenwelt zwischen den Ringen, Berührungslimit, Build-System, Speedrun-Struktur über 10 Level.

## 3. Designsäulen (vom Auftraggeber festgelegt)

1. **Kurz spielbar, langfristig motivierend** – ein Level ca. 1–2 min (spätere länger); Fortschritt über Upgrades.
2. **Builds statt einer Lösung** – Upgrades/Themen eröffnen verschiedene Wege durch dasselbe Level.
3. **Speedrun-Kern** – 10 Level, gespielt wird auf **Gesamtzeit** (kein ablaufender Timer, sondern fixes Ziel, Zeit zählt hoch). Es gibt einen offensichtlichen langsamen Weg; schnellere Wege/Skips entdeckt man durch Zufall, Erfahrung oder Upgrades.
4. **Fordernd** – mehrere Anläufe pro Level sind normal.
5. **Steuerung** – anfangs mit einem Daumen spielbar, spätere Level dürfen beide Hände verlangen.
6. **„Wirkt wie Glück, ist Können“** – die Außenwelt erscheint Anfängern zufällig, ist aber vollständig deterministisch und mit Erfahrung gezielt nutzbar.
7. **Treffer kosten etwas** – jede Schlägerberührung ist eine begrenzte Ressource.

## 4. Kernmechanik

- Ein **Level** = mehrere **Ringe** (fast vollständige Kreise mit **einer Öffnung**) + die **Außenwelt** dazwischen/darum herum + ein Ziel (letzter Ring / Zielzone).
- Der **Schläger** ist ein Kreissegment und fährt auf der Schiene des **aktuellen** Rings (wie auf einer Schiene, der Kreis selbst ist sichtbar als Wand bzw. Bahn).
- **Berührungslimit pro Ring** (z. B. 5): Ist es aufgebraucht, bevor der Ball den nächsten Ring erreicht → **Level startet neu**.
- Verlässt der Ball den Ring durch die Öffnung, fliegt er durch die **Außenwelt** und soll in den **nächsten Ring** gelangen; der Schläger wechselt auf dessen Schiene.
  - OFFEN: Muss der Ball exakt durch die Öffnung des nächsten Rings, oder wird er in der Nähe „eingefangen“?
- **Zeitlupen-Fenster**: Basisfähigkeit aller Spieler. Kurzes Eingriffsfenster (v. a. in der Außenwelt). Upgrades verlängern die verfügbare Zeitlupe.
- **Punkte**: Nicht verbrauchte Berührungen → Punkte → schalten Upgrades frei. (Belohnt effizientes Spiel = passt zum Speedrun.)
- **Physik muss deterministisch sein** (fester Zeitschritt, kein Zufall), damit Routen und Skips reproduzierbar sind.

## 5. Außenwelt

Elemente, die zufällig wirken, aber festen Regeln/Zyklen folgen. Muster sollen sichtbar, aber nicht sofort offensichtlich sein (Lichtpulse, Schatten, Geräusche).

**Bestätigt (Favoriten):**
- **Zahnräder** – drehen sich mit Kerben in fester Umlaufzeit; Ball prallt ab oder rutscht durch eine Kerbe. Wer im Takt schießt, trifft immer.
- **Billardkugeln** – liegen als Hindernisse im Weg, müssen erst beiseite geräumt werden; lösen Kettenreaktionen aus (Kugel trifft Schalter, Kugel stößt Kugel …).

**Weitere Kandidaten aus dem Brainstorming (nicht entschieden):**
Vogelschwarm (feste Lissajous-Bahn, lenkt ab) · Ebbe/Flut-Feld (periodisch anziehend/abstoßend) · Seifenblasen (tragen den Ball X Sekunden, platzen vorhersehbar) · Wurmloch-Paare (Austrittswinkel planbar) · drehbare Ring-Öffnungen (per Kompass/Magnet beeinflussbar).

**Jedes Level hat ein eigenes Thema** (z. B. Zahnrad-Level, Billard-Level), das den Weg zum Ziel prägt.

## 6. Build-System

**Prinzip:** Themen werden über **Verben** definiert (was sie mit Ball/Welt machen), nicht über Optik. Jedes Thema muss eine andere Route ermöglichen.

**Beispiel Billardkugel-Hindernis:**
| Build | Umgang | Folge |
|---|---|---|
| Vanilla | einzeln wegschießen | langsam, viele Berührungen |
| Feuer (zerstören) | Glutball sprengt Kugel | direkt, begrenzte Ladungen |
| Erde (durchschlagen) | schwerer Ball schiebt Reihe weg | direkt, träge Flugbahn |
| Luft (krümmen) | Kurvenball um die Kugeln | kein Räumen, Timing nötig |
| Schatten (umgehen) | Ball kurz durchlässig | am schnellsten, kurzes Fenster |

**Vorgeschlagene Struktur: 3×3-Matrix (vorläufig, Themen noch nicht final)**
- **Element = WAS passiert:** Feuer, Wasser, Luft (später evtl. Erde, Schatten/„Heimlichkeit“).
- **Quelle = WIE es ausgelöst wird:**
  - **Natur** – passiv, dauerhaft, einsteigerfreundlich.
  - **Technik** – aktiv per Tipp, präzise. (Der **Magnet** ist ein bestätigtes Technik-Upgrade.)
  - **Magie** – nur in der Zeitlupe, sehr stark, begrenzte Ladungen.
- Beispiel Luft: Natur = Ball leichter, Aufwinde · Technik = Gebläse am Schläger per Tipp · Magie = Flugbahn in Zeitlupe per Wisch umbiegen.

**Regeln:**
- Upgrades werden mit Punkten **freigeschaltet** und vor dem Run **ausgewählt** (Loadout). **Einmal gewählt, im Run nicht tauschbar.**
- Später ein **zweiter Slot** → Kombinationen/Synergien (z. B. Feuer + Luft = Feuerschweif).
- Die Build-Themen dürfen sich während der Levelentwicklung noch ändern; wenn das System nicht trägt, kann es vereinfacht werden.

## 7. Levelstruktur

- **10 Level**, Gesamtzeit zählt (Speedrun, Splits pro Level sinnvoll).
- **Erste Level „Vanilla“**: führen je ein Element ein, wenig Optionen.
- **Spätere Level**: kniffliger, mehr Routen, mehr Build-Relevanz, dürfen länger dauern und zwei Hände erfordern (z. B. zwei Ringe gleichzeitig steuern).
- **Jedes Level soll enthalten:** eine Präzisionsstelle (Zeitlupe), eine mögliche Kettenreaktion, mindestens einen versteckten Skip.

## 8. Spielgefühl

Gewünschte Gänsehaut-Momente (alle drei bestätigt):
- **a)** Ball fliegt in Zeitlupe knapp durch ein Zahnrad → zurück in Echtzeit.
- **b)** Kettenreaktion räumt das Level ab.
- **c)** Entdeckung eines Skips („Das geht?!“).

## 9. Kamera, Optik, Klang

- **Kamera** (vorläufig): folgt dem Ball nah. **Pinch zum Rauszoomen** auf Gesamtübersicht und zurück. Vorschlag: Rauszoomen pausiert nicht, sondern kostet Zeitlupen-Energie. Vor jedem Level optionaler, überspringbarer Überflug.
- **Optik/Klang**: einheitlicher Grundstil; Ball, Schweif, Schlägerfarbe und Aufprallgeräusche variieren leicht je Element/Build.

## 10. Technik

- **Plattform:** Mobile-first **PWA** (installierbar, offline über Service Worker, Vollbild via Manifest).
- **Eigenes Repository** (nicht im Repo der Vermögens-App).
- Vorschlag Stack: HTML + Canvas + JavaScript ohne Build-Schritt (wie das Vermögens-App-Repo) oder eine leichte 2D-Engine (Phaser/PixiJS). Physik selbst geschrieben mit festem Zeitschritt (Determinismus!).
- Speicherung: Fortschritt, Upgrades, Bestzeiten in localStorage/IndexedDB.
- Optional später: Ghost-Replay der Bestzeit (Eingaben aufzeichnen – funktioniert nur bei deterministischer Physik).

## 11. Stand der Umsetzung: Prototyp v0.1

Umgesetzt: PWA-Grundgerüst, 3 Level (Erste Bahn, Versatz, Umkehr), Run-Modus mit Gesamtzeit, Übungsmodus, Bestzeiten, zwei Steuerungsarten, Klang, Tests mit Autopilot. Aufbau siehe `README.md`.

**Vorläufige Regeln im Prototyp** (zum Testen gedacht, jederzeit änderbar):
- **Innenwand = Ball verloren** (wie bei Pong), **Außenwand = Bande** (prallt ab). Die Kanten der Öffnung prallen immer ab.
- **Abprall wie bei Pong/Arkanoid:** Die Trefferstelle auf dem Schläger bestimmt den Winkel (Mitte = gerade zurück, Rand = bis ca. 57°), der Einfallswinkel zählt nicht.
- **Eine Öffnung pro Ring**, durch die der Ball hinein und hinaus muss. Übergang: exakt durch die Öffnung (keine Einfangzone).
- Betritt der Ball einen neuen Ring, springt der Schläger dorthin, gegenüber der Öffnung.
- Schlägergeschwindigkeit begrenzt (10 rad/s), auch im Zeigen-Modus.
- Berührungen gelten pro Ring; kehrt der Ball in einen Ring zurück, zählen die bereits verbrauchten weiter.
- Punkte = übrige Berührungen × 100, übersprungene Ringe zählen voll (belohnt Skips).
- Fehler: kurze Anzeige (0,7 s), dann Neustart des Versuchs. Neuer Abschuss per Tipp.
- Zeitmessung über Simulationsschritte (deterministisch). Die Uhr startet mit dem ersten Abschuss eines Levels und läuft bei Fehlern weiter; zwischen den Leveln steht sie.
- Ball fliegt aus dem Spielfeld oder ist 8 s außerhalb aller Ringe → Fehler.
- Kamera zeigt aktuellen und nächsten Ring; kein Zoom per Pinch.

## 12. Offene Fragen

1. Neustart nach Scheitern: sofort per Tipp (Super-Meat-Boy-Stil) oder kurzer Moment, der zeigt, warum? *(v0.1: kurzer Moment mit Grund, dann Tipp)*
2. Übergang zwischen Ringen: exakt durch die Öffnung oder Einfangzone? *(v0.1: exakt)*
3. Wie viel Kontrolle in der Außenwelt außer Zeitlupe (z. B. ein Impuls-Tipp)?
4. Finale Build-Themen und Upgrade-Liste.
5. Kamera endgültig (Zoom-Kosten ja/nein).
6. Name des Spiels. *(Arbeitstitel: Orbits)*
7. Optik-Stil (minimalistisch-Neon / organisch / technisch). *(v0.1: minimalistisch-Neon)*
8. Innenwand tödlich oder Bande? Welche Steuerung (Schieben/Zeigen) fühlt sich besser an? *(nach Test auf dem Handy entscheiden)*

## 13. Nächste Schritte

- [x] Repo anlegen, PWA-Grundgerüst (index.html, manifest, service worker, Icons).
- [x] Ring, Schläger auf der Kreisschiene, Ball mit deterministischer Physik, Öffnung.
- [x] Mehrere Ringe + Übergang, Berührungslimit, Neustart.
- [x] Timer, Run-Modus, 3 Testlevel.
- [ ] Spielgefühl auf dem Handy testen, Regeln aus Abschnitt 11 bestätigen oder ändern.
- [ ] Erstes Außenwelt-Element (Zahnrad) und Zeitlupe (v0.2).
- [ ] Billardkugeln, Pinch-Zoom, weitere Level.
- [ ] Erst danach: Upgrades und Build-System.

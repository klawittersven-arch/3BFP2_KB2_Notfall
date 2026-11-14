# KB II – Notfallsituationen · digitale Übungen (3BFP2, Themenblock 2)

Kleine Web-App zu den Arbeitsblättern im Fach **KB II – Kommunikation in Notfall- und Krisensituationen**
(generalistische Pflegeausbildung, 2. Ausbildungsjahr, Themenblock 2, Leitfall „Reanimation – und nicht nur ich war hilflos“).
Die Schülerinnen und Schüler scannen den QR-Code auf dem Arbeitsblatt, bearbeiten am Smartphone eine Zuordnungsübung
und erhalten sofort Rückmeldung. Auf einer **Lehrerseite für den Beamer** sehen Sie live, wie weit Ihre Klasse ist
und welche Karten oft falsch sind.

Die SuS gelangen **nur über die QR-Codes** zu den Übungen. Die Startseite
(https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/) sagt nur: „Bitte scannen Sie den QR-Code auf Ihrem Arbeitsblatt.“

## Übungen (Woche 1, SW 6)

| Arbeitsblatt | Übung | Adresse (QR-Code in `qr/`) |
|---|---|---|
| AB 1 – Menschen im Notfall | Übung 1: Körper, Denken oder Gefühl? → Aufgabe 3 | `…/ab1a.html` |
| | Übung 2: Normal – oder ein Warnzeichen? → Aufgabe 4 | `…/ab1b.html` |
| AB 2 – Psychologische Erste Hilfe | Übung 1: Welches Wirkprinzip? → Aufgabe 1 | `…/ab2a.html` |
| | Übung 2 (für die Schnellen): Antwort-Check – was fehlt? | `…/ab2c.html` |

## Übungen (Woche 4, SW 9)

| Arbeitsblatt | Übung | Adresse (QR-Code in `qr/`) |
|---|---|---|
| Informationen geben in Krisen (raum `ab3`) | Übung (für die Schnellen): Hilfreich oder ungünstig? | `…/ab3a.html` |

### Belohnungsspiel „Diabetes Run!“ (nach der Übung `ab3a`)

- Wer die Übung **ehrlich löst** (nicht durchklickt), sieht unter „Das Wichtigste in Kürze“ den Kasten
  „Super gemacht! Zur Belohnung …“ mit dem Knopf **🎮 Jetzt spielen** → `spiel.html?ab=ab3a`.
  Es ist das Minispiel aus dem AB zur Beratung (Repository `kb2-beratung`): Endless Runner mit der Pixel-Krankenschwester,
  ein Lauf dauert selten länger als 2 Minuten, kein Ton.
- Name und Klasse kommen aus der Übung – keine zweite Eingabe. Nach jedem Lauf geht die **Bestleistung** an den Worker.
- Die **Lehrerseite** dieses Arbeitsblatts zeigt sie neben dem Namen: **🎮 340** · die höchste der Klasse mit **🏆**.
- Freigeschaltet für 12 Stunden auf diesem Handy; „Noch einmal üben“ nimmt die Freischaltung nicht zurück.
  Ohne gelöste Übung zeigt `spiel.html` nur „Lösen Sie zuerst die Übung …“.
- Nach „Game over“ erscheint zufällig ein Satz „Schon gewusst?“ – eine der sechs Regeln (Texte in `inhalte.js`, `spiel`).
- Ein Spiel an eine andere Übung hängen: in `inhalte.js` bei der Übung `belohnungsspiel: true` eintragen.

## Lehrerseiten für den Beamer (ohne Kennwort)

Je Klasse und Arbeitsblatt ein eigener Link – am besten als Lesezeichen auf dem Schul-Laptop speichern:

| | AB 1 | AB 2 |
|---|---|---|
| **3BFP2/1** (Frau Lohner) | https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-1-ab1.html | https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-1-ab2.html |
| **3BFP2/2** (Herr Klawitter) | https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-2-ab1.html | https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-2-ab2.html |

Woche 4 – Informationen geben in Krisen:
**3BFP2/1:** https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-1-ab3.html ·
**3BFP2/2:** https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-2-ab3.html

- Je Übung eine Spalte: „17 von 22 fertig“, Balken und **alle Namen mit ihrem Stand**:
  **✓ 9/12** = fertig, 9 von 12 Karten beim ersten Versuch richtig · **⚠ 5/12** = fertig, aber zu wenige beim ersten
  Versuch richtig (durchgeklickt?) · **6/12** = dabei · **–** = noch nicht begonnen · **↺** = musste wegen zu schneller
  Fehler neu starten (↺2 = zweimal). Fährt man mit der Maus über einen Namen, erscheint eine kurze Erklärung.
- **„Oft falsch beim ersten Versuch“**: die drei Karten, die Sie besprechen sollten. Antippen → die Karte erscheint groß,
  mit der Zahl der zuerst gewählten falschen Antworten (ohne Namen); **Auflösen** zeigt Lösung und Erklärung.
- Einen unpassenden Namen entfernen: mit der Maus über den Namen → **×**.
- **Liste leeren (neue Stunde)** löscht nur die Namen Ihrer Klasse für dieses Arbeitsblatt. Ohne Leeren wird nach
  12 Stunden ohne Aktivität automatisch gelöscht.
- Die Seiten sind bewusst **ohne Kennwort** erreichbar (Wunsch der Lehrkräfte). Wer die Adresse kennt, sieht die
  Vornamen mit Initiale und den Stand – die Seiten werden von Suchmaschinen nicht erfasst (`noindex`).

## So funktioniert eine Übung

- Beim ersten Öffnen geben die SuS **Vorname + Anfangsbuchstaben des Nachnamens** ein („Lena K.“; aus „Lena Kraus“
  wird automatisch „Lena K.“) und wählen ihre **Klasse** (3BFP2/1 oder 3BFP2/2). Das Handy merkt sich beides
  für alle Übungen; „ändern“ ist jederzeit möglich.
- Karten mit Aussagen, darunter die Antwortknöpfe. **Richtig:** grün mit ✓ und Erklärung. **Falsch:** orange mit ✗ und
  Tipp – die Lösung wird nie verraten. Manche Karten haben zwei richtige Antworten (wie im Erwartungshorizont der KA).
- Erst wenn alle Karten gelöst sind, erscheint z. B. **„Übung 1 abgeschlossen!“** mit dem Hinweis auf die nächste Aufgabe
  auf dem Arbeitsblatt und „Das Wichtigste in Kürze“. Wer durchklickt, bekommt „Hey, nicht einfach durchklicken!“
  (ohne den Hinweis auf die nächste Aufgabe).
- **Schutz gegen Durchklicken:** Nach einer falschen Antwort ist die Karte **5 Sekunden gesperrt** („Lesen Sie den
  Tipp – weiter in 3 s“). Wer **3 falsche Antworten innerhalb von 10 Sekunden** gibt, sieht „Zu schnell geklickt!“ und
  die Übung **beginnt von vorn**; die Lehrerseite zeigt dann ↺ beim Namen. Die Werte stehen in
  `docs/einstellungen.js` (`sperreNachFehlerSekunden`, `zuSchnell: { fehler, sekunden }`); `0` schaltet die
  jeweilige Funktion aus.

## Einrichten (einmalig, ca. 10 Minuten)

1. **GitHub Pages:** Repository → Settings → Pages → „Deploy from a branch“ → Branch **main**, Ordner **/docs** → Save.
   Nach 1–2 Minuten ist https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/ erreichbar.
2. **Cloudflare-Dashboard** → **Workers & Pages** → **Create application** → Repository verbinden (GitHub) →
   **3BFP2_KB2_Notfall** auswählen.
3. Einstellungen beim Anlegen:
   - Name des Workers: **`kb2-notfall-fortschritt`** (muss genau so heißen wie in `server/wrangler.jsonc`)
   - **Root directory / Pfad:** `server`
   - Build command: leer lassen · Deploy command: `npx wrangler deploy` (Voreinstellung)
4. **Deploy.** Cloudflare zeigt danach die Adresse – sie sollte
   `https://kb2-notfall-fortschritt.klawittersven.workers.dev` lauten. Zum Test im Browser öffnen:
   „Fortschrittsanzeige KB II – Notfallsituationen: läuft.“
5. Nur falls die Adresse anders lautet: auf GitHub `docs/einstellungen.js` öffnen → Stift → bei `serverAdresse`
   die richtige Adresse eintragen → Commit changes.

Ein Kennwort oder Secret ist **nicht** nötig. Solange der Worker nicht läuft, funktionieren die Übungen trotzdem –
nur die Lehrerseite zeigt dann „Keine Verbindung zum Server“.

## Datenschutz

- Übertragen werden nur: der eingegebene Name („Lena K.“), die Klasse, eine zufällige Geräte-Kennung, die Übung,
  die Zahl der gelösten Karten, die Zahl der Neustarts und die Nummern der Karten, die beim ersten Versuch falsch
  waren – beim Belohnungsspiel zusätzlich die Bestleistung (eine Zahl). Keine Anmeldung, keine Cookies, keine
  Analyse, keine fremden Skripte.
- Die Lehrerseite zeigt Fehler nur zusammengefasst für die Klasse, nicht je Person.
- Gelöscht wird automatisch nach 12 Stunden ohne Aktivität oder sofort mit „Liste leeren“.
- Die Daten liegen bei Cloudflare (Durable Object). Bitte im Zweifel mit der/dem Datenschutzbeauftragten der Schule abstimmen.

## Texte ändern und Übungen ergänzen

Alle Texte stehen in **`docs/inhalte.js`** – mit Anleitung oben in der Datei. Auf GitHub: Datei öffnen → Stift →
ändern → „Commit changes“. Nach 1–2 Minuten ist die Änderung online.

Neue Übungen für weitere Wochen (z. B. AB 3, AB 4 …): Abschnitt in `inhalte.js` ergänzen (`raum: 'ab3'`), die
Kennung in `werkzeuge/seiten_erzeugen.py` (`IDS`, `ABS`) und `werkzeuge/qr_erzeugen.py` (`IDS`) eintragen,
beide Skripte ausführen und `docs/sw.js` (`DATEIEN`, `VERSION`) anpassen. Der Worker muss dafür nicht geändert werden.

## QR-Codes

`qr/qr_ab1a.png` … `qr/qr_ab3a.png` (Fehlerkorrektur M, Ruhezone 4 Module). Neu erzeugen:
`python3 werkzeuge/qr_erzeugen.py` (benötigt `segno` oder `opencv-python`).
Die Arbeitsblätter und Lösungen liegen bewusst **nicht** in diesem Repository, denn es ist öffentlich.

## Tests

- `node tests/uebungen.test.js` prüft mit Playwright alle Übungen in Handygröße (360 px), Namenseingabe mit
  Klassenwahl, Senden des Fortschritts, Schutz gegen Durchklicken, die Lehrerseiten je Klasse und das Belohnungsspiel
  (Freischaltung, Lauf, Bestleistung neben dem Namen) – mit nachgebildetem Server.
- `cd server && node test/worker.test.js` prüft den Worker (Eingabeprüfung, Klassen-Räume, Entfernen, Leeren,
  Löschen nach 12 Stunden, Obergrenzen, Bestleistung im Belohnungsspiel).

## Dateien

```
docs/                    ← alles, was GitHub Pages veröffentlicht
  inhalte.js             ← ALLE Texte der Übungen
  einstellungen.js       ← Adresse des Workers, Klassen, Aktualisierungstakt, Wartezeit/Neustart, Sperrwörter
  app.js, style.css      ← Übungen (Handy)
  lehrer.js, lehrer.css  ← Lehrerseiten (Beamer)
  index.html             ← Startseite (nur Hinweis auf den QR-Code)
  spiel.html, spiel.js, spiel.css, pixel.js, logo-kbs.png   ← Belohnungsspiel „Diabetes Run!“
  ab1a.html … ab3a.html  ← die Übungen         (erzeugt mit werkzeuge/seiten_erzeugen.py)
  lehrer-3bfp2-1-ab1.html … lehrer-3bfp2-2-ab3.html   (ebenfalls erzeugt)
  sw.js                  ← Offline-Speicher (nach größeren Änderungen VERSION erhöhen)
server/                  ← Cloudflare Worker für die Fortschrittsanzeige
qr/                      ← QR-Codes
werkzeuge/               ← QR-Codes und Seiten erzeugen
tests/                   ← automatische Tests
```

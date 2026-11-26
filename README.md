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

## TB 2 neu ab KW 49 (Klausur am 12.01.2027) – Woche 1

Neue, kürzere Arbeitsblätter (je 45 min). Die Handy-Übungen sind nur **„Für die Schnellen“** (freiwillig) –
das Papier allein bereitet vollständig auf die Klassenarbeit vor; der QR-Kasten darf also auch gelöscht werden.
Die SuS starten die Übung **selbst** über den QR-Code (kein Beamer-Start nötig).

| Arbeitsblatt | Übung | Adresse (QR-Code in `qr/`) |
|---|---|---|
| Psychosoziale Unterstützung im Notfall | Hilft das – oder nicht? | `…/kb2ab02.html` |
| Gesprächshemmer im Notfall vermeiden | Förderer oder Hemmer? | `…/kb2ab03.html` |
| **Woche 2:** Angehörige im Notfall informieren – Schweigepflicht | Darf ich das sagen? | `…/kb2ab04.html` |
| **Woche 2:** Schlechte Nachrichten überbringen | Welcher SPIKES-Schritt? | `…/kb2ab05.html` |

Lehrerseiten Woche 1 (beide Übungen auf einer Seite): **3BFP2/1:** https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-1-kb2w1.html ·
**3BFP2/2:** https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-2-kb2w1.html

Lehrerseiten Woche 2: **3BFP2/1:** https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-1-kb2w2.html ·
**3BFP2/2:** https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-2-kb2w2.html

**Gemeinsamer Worker für KB I und KB II:** Die neuen KB-I-Übungen (Repository `3BFP2-kb1-notfall`, Ordner `docs/tb2/`)
melden an **diesen** Worker (Räume `k1-kb1w1` … `k2-kb1w4`). Dafür wurde nur das Raummuster in `server/src/logik.js`
erweitert (`k1-kb2w1` … `k2-kb2w9` und `k1-kb1w1` … `k2-kb1w9`); nach dem Zusammenführen in `main` veröffentlicht Cloudflare
den Worker automatisch. Weitere Wochen: Übung in `inhalte.js` mit `raum: 'kb2w2'` usw. ergänzen, Kennung und Woche in
`werkzeuge/seiten_erzeugen.py` (`IDS`, `ABS`) eintragen, Skript ausführen, `docs/sw.js` anpassen.

### Belohnungsspiel „Notfall-Run!“ (nach der Übung `ab3a`)

- Wer die Übung **ehrlich löst** (nicht durchklickt), sieht unter „Das Wichtigste in Kürze“ den Kasten
  „Super gemacht! Zur Belohnung …“ mit dem Knopf **🎮 Jetzt spielen** → `spiel.html?ab=ab3a`.
  Es ist der Endless Runner „Diabetes Run!“ aus dem AB zur Beratung (Repository `kb2-beratung`) mit derselben
  Pixel-Krankenschwester – neu gestaltet für den Themenblock Notfall: Notfallkoffer, Defi-Koffer, Leitkegel und
  Notfallwagen überspringen, unter Rauch ducken („Rauch steigt nach oben“), Doppelsprung über den Rettungswagen („112“),
  im Hintergrund ein Krankenhaus. Das Spiel spielt nachts (Nachtdienst, Mond und Sterne); bei Tag:
  in `inhalte.js` `tageszeit: 'tag'`. Ein Lauf dauert selten länger als 2 Minuten, kein Ton.
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

## Fall-Einführung „Zeitlupe“ (Einstieg in den Themenblock, SW 6 – und noch einmal in SW 13)

Der Leitfall „Reanimation und nicht nur ich war hilflos“ wird **Abschnitt für Abschnitt** erlebt. Die Lehrkraft
schaltet auf dem Beamer weiter, die Handys folgen automatisch. Der Falltext bleibt **Wort für Wort** wie auf dem
Arbeitsblatt (der Test `tests/fall.test.js` prüft das mit einer Prüfsumme).

| | Beamer (Lehrkraft, ohne Kennwort) |
|---|---|
| **3BFP2/1** | https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-1-fall.html |
| **3BFP2/2** | https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/lehrer-3bfp2-2-fall.html |

Handy: https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/fall.html – der QR-Code erscheint auf dem Beamer
(Datei `qr/qr_fall.png`, z. B. auch für eine Folie).

**Ablauf** (Weiter/Zurück mit den Knöpfen unten, den Pfeiltasten oder dem Presenter; die Punkte springen direkt zu einem Schritt):

Jedes Bild erscheint zuerst **im Vollbild** (Klick aufs Bild, Pfeiltaste oder Presenter = weiter); danach steht es
klein neben dem Text. Die Handys zeigen währenddessen nur das Bild und „Schauen Sie nach vorn.“

1. **Kaltstart:** Bild im Vollbild → *Satz zeigen*: „Sie kommen ins Zimmer. Frau Maler reagiert nicht.“ + „Schreiben Sie Ihre
   ersten Ideen sofort in Stichworten auf Ihren Zettel.“ → *10 Sekunden starten* → Countdown mit „Aufschreiben!“ → „Stopp!“
   (Stift und Zettel vorher bereitlegen lassen – so kann später niemand Antworten „übernehmen“, die erst danach gezeigt werden.)
2. **Ihre 10 Sekunden:** QR-Code, Namen mit ✓. Fragen: Was steht auf Ihrem Zettel? Wie sicher haben Sie sich gefühlt (1–5)?
3. **Vorstellung:** „Genau diese Situation hat Christin erlebt.“ – zwei Namenskarten (Christin, Frau Maler) mit Angaben
   aus dem Falltext, dann „Wir gehen zurück an den Anfang dieses Tages.“ Bewusst erst **nach** dem Kaltstart: Dort sollen
   die SuS selbst handeln, nicht Christin zuschauen. Mit Bild (`bild:` beim Schritt `personen`) erst Vollbild, dann
   das Bild links neben den Karten.
4. **Stationen 1–10:** 7 Abschnitte des Falls und 3 **zusätzliche Situationen**, in denen alles normal ist (🟢; nach
   „Am Morgen“, dann „Gegen neun“ und „Gegen zehn Uhr“). Sie stehen nicht im Fallbeispiel und ändern nichts am Fall –
   die SuS sollen nicht bei jeder Ampel „beobachten“ wählen. Sie sehen aus wie die anderen Stationen; beim Auflösen
   erscheint „Einschätzung: 🟢 Alles normal“ mit Begründung. Nicht im Zeitstrahl, nicht in „Den Fall bis hier lesen“.
   Die Stationen werden automatisch durchnummeriert. Ablauf je Station: Abschnitt groß zum Vorlesen → Frage auf dem Handy (Ampel 🟢🟡🔴 oder Auswahl) →
   *Ergebnis zeigen* (Abstimmung endet) → *Auflösen: Was hat Christin getan?* (der nächste Satz aus dem Fall, bei Ampel mit Markierung).
   Die Übergabe: Risiken auswählen (6 passen, 3 nicht) → *Auflösen: Was passt?* mit Begründung.
   Zum Mittagessen: aus 8 Aktionen die **3 wichtigsten Schritte in der richtigen Reihenfolge** antippen – Merkregel der
   Reanimationsleitlinien 2025: *Prüfen – Rufen – Drücken*. Ergebnis = je Platz, was die Klasse gewählt hat; Auflösung =
   ✓/✗, Merksatz, „ganz richtig: x von y“ und die gewählten unpassenden Aktionen mit Grund; die Handys zeigen ✓/✗ je Platz.
   Richtige Schritte und Ablenker stehen in `fall-inhalte.js` (`s5`: die ersten `anzahl` Antworten sind die richtigen;
   ohne `anzahl` werden alle Antworten sortiert).
   Später: **genau 3** von 9 Dingen wählen, die Christin am meisten helfen würden (6 helfen, 3 nicht). Ergebnis =
   Rangfolge der Klasse; Auflösung = ✓/✗ mit Grund und der Hinweis, dass die Rangfolge Gesprächsanlass ist.
5. **Zurückspulen:** Zeitstrahl der 7 Stationen des Fallbeispiels mit den Klassen-Ergebnissen und Christins Handeln. Frage: Ab wann hätte man den Notfall vielleicht verhindern können?
6. **Perspektiven-Runde:** Die Beamer-Seite teilt alle Angemeldeten **automatisch und gleichmäßig in 5 Gruppen** ein – eine
   je Person (Christin, die reanimierende Pflegekraft, die erstarrte Pflegekraft, die Angehörigen, Frau Maler). Das Handy zeigt
   „Ihre Gruppe bearbeitet: …“ und die Namen der Gruppe. Auf dem Beamer stehen die Namen bei jeder Gruppe, mit ✓ und Zahl,
   sobald jemand einen Eintrag geschickt hat („2 von 22 haben schon etwas geschickt“) – die Einträge selbst bleiben ohne Namen.
   Klick auf einen Namen setzt die Person in die nächste Gruppe; *Gruppen neu einteilen* mischt neu; wer später kommt, landet
   in der kleinsten Gruppe. Unpassende Einträge entfernt × am Eintrag.
7. **Ausblick:** Begriffsparkplatz, **Lernfragen drucken** und **Ergebnis sichern**.

**Lernfragen drucken** (in der Perspektiven-Runde und beim Ausblick): eine Seite mit allen Lernfragen der Gruppen, nach
Person sortiert, und den geparkten Begriffen – ohne Namen. Im Druckfenster auch „Als PDF speichern“, z. B. für die
Kolleginnen und Kollegen der anderen Kompetenzbereiche. Unpassende Einträge vorher mit × entfernen.

**Arbeitsblatt:** nur noch der Fall (unverändert) und als Hausaufgabe „Lesen Sie den ganzen Fall noch einmal in Ruhe.
Markieren Sie im Text alle Warnzeichen, die Christin bei Frau Maler beobachtet.“ – die Inhalte kommen im Fachunterricht.

**Jetzt am Smartphone:** Solange abgestimmt oder geschrieben wird, steht auf dem Beamer ein dunkler Balken mit 📱 und
dem Auftrag (z. B. „Wählen Sie genau 3 Dinge aus.“). Bei langen Abschnitten bleibt er beim Vorlesen unten
sichtbar. Nach *Ergebnis zeigen* verschwindet er. Die Sätze stehen in `fall-inhalte.js` bei `handyAuftrag`.

**Einleitung:** Vor jedem Abschnitt steht eine kurze Zeile, die nicht zum Falltext gehört, z. B. „Christin erzählt in der
Schule („ich“ = Christin, „sie“ = Frau Maler):“ oder „Christin erzählt weiter über Frau Maler:“ – zwischen den Abschnitten
wird abgestimmt, so bleibt klar, wer spricht. Die Zeilen stehen in `fall-inhalte.js` bei `einleitung`.

**Vorlesen:** Über jedem Abschnitt des Falls (und über „Christin erzählt weiter“) steht *🎲 Wer liest vor?*. Ein Klick
(oder Taste **V**) lost eine angemeldete Person aus und markiert den ersten Abschnitt gelb – mit dem Namen davor; der Text
ist dafür in Abschnitte zu 2–3 Sätzen geteilt (je Absatz, der Text selbst bleibt unverändert). *Nächster Abschnitt* (oder V)
lost die nächste Person aus, *↻ Jemand anderes* lost für denselben Abschnitt neu, beim letzten Abschnitt *✓ Fertig*.
Wer schon dran war, kommt erst wieder, wenn alle einmal dran waren. Die Handys markieren denselben Abschnitt; wer dran ist,
sieht oben „📢 Sie sind dran: Lesen Sie den gelben Abschnitt laut vor.“ Weiterschalten beendet das Vorlesen.

**Automatisch senden:** Antworten brauchen keinen „Senden“-Knopf. Einzelwahl und Ampel zählen beim Tippen,
Mehrfachauswahl kurz nach dem letzten Tippen. Bei „genau 3 wählen“ und bei der Reihenfolge wird gesendet, sobald die
Auswahl vollständig ist („Noch 1 wählen – dann wird Ihre Antwort automatisch gesendet.“); wird sie wieder
unvollständig, wird die Antwort zurückgezogen (der ✓ beim Namen verschwindet). Schaltet die Lehrkraft weiter, schicken
die Handys noch Ausstehendes mit. Nur die Perspektiven-Texte haben weiter „Senden“ (halbe Sätze sollen nicht auf dem
Beamer erscheinen); steht dort noch ungesendeter Text, zeigt das Handy „Noch nicht gesendet“, und beim Weiterschalten
wird er automatisch mitgeschickt.

**Begriffsparkplatz:** Auf dem Handy ist jedes Wort im Falltext antippbar. Tipp auf ein Wort → unten erscheint *Parken*;
ein Tipp auf das Wort daneben nimmt es dazu (z. B. „lebensverlängernden Maßnahmen“, höchstens 4 Wörter), noch einmal
tippen nimmt es wieder weg. Geparkte Wörter sind im Text gepunktet unterstrichen. Eintippen geht weiterhin. Auf dem
Beamer stehen die geparkten Wörter live in der Kopfzeile (häufigste zuerst) – so lassen sie sich schon während der
Stationen kurz klären; beim Ausblick erscheinen alle.

**SW 13:** Unten auf der Beamer-Seite *Abschluss (SW 13) – mit Vergleich* wählen und die Zeitlupe noch einmal spielen.
Alle Ergebnisse erscheinen dann neben denen der Einführung (z. B. Ampel bei der Wade: SW 6 → heute), am Ende stehen die
Lernfragen aus SW 6 („Können Sie sie jetzt beantworten?“).

- **Ergebnis sichern** speichert nur Zahlen und Texte **ohne Namen** – dauerhaft, bis es überschrieben wird. Namen und
  Einzelantworten werden wie bei den Übungen nach 12 Stunden gelöscht (oder mit *Liste leeren*).
- Ein neuer Durchgang beginnt immer mit einer leeren Liste – vorher sichern!
- **Bilder** (Kaltstart, Vorstellung und die Stationen Übergabe, Am Morgen, Gegen elf Uhr, Zum Mittagessen, Später) liegen in `docs/bilder/` – je groß für den Beamer (1600 px) und
  `-klein` für die Handys (800 px). Beamer: Kaltstart abgedunkelt im Hintergrund, bei den Stationen rechts neben dem Text,
  im Zeitstrahl als kleine Vorschau. Ein Bild tauschen: beide Dateien gleichen Namens ersetzen; welche Station welches
  Bild zeigt, steht in `fall-inhalte.js` (`bild:`). Die Bilder sind KI-erzeugt und zeigen keine echten Personen.
- Texte, Fragen und Antwortknöpfe stehen in **`docs/fall-inhalte.js`**. Die Kürzel (`kuerzel`) bitte nicht ändern, sonst
  passen die gesicherten Ergebnisse nicht mehr zu SW 13. Den **Falltext** dort nicht ändern.
- Die Handys fragen alle 3 Sekunden nach, welcher Schritt dran ist (`fallAbfrageSekunden` in `einstellungen.js`).
  Bei 25 SuS sind das rund 22 500 Anfragen in 45 Minuten (nur solange die Seite offen ist) – im kostenlosen Cloudflare-Tarif sind 100 000 pro Tag frei.

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
- Fall-Einführung: zusätzlich die gewählten Antworten und die geschriebenen Texte (Perspektiven, Begriffsparkplatz).
  Der Beamer zeigt Antworten nur zusammengezählt und Texte ohne Namen. „Ergebnis sichern“ speichert nur Zahlen und Texte
  ohne Namen.
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
- `node tests/fall.test.js` prüft die Fall-Einführung: Falltext unverändert (Prüfsumme), Ablauf mit Beamer und zwei Handys
  mit dem echten Worker (Kaltstart, Vorstellung, Ampel, Auflösen, Zurückspulen, Perspektiven mit KB, Begriffsparkplatz, Sichern, SW 13 mit Vergleich).
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
  spiel.html, spiel.js, spiel.css, pixel.js, logo-kbs.png   ← Belohnungsspiel „Notfall-Run!“
  fall.html, fall.js, fall.css            ← Fall-Einführung „Zeitlupe“ (Handy)
  fall-inhalte.js                         ← Texte der Fall-Einführung (Falltext NICHT ändern)
  bilder/                                 ← Bilder der Fall-Einführung (groß + „-klein“)
  lehrer-fall.js, lehrer-fall.css, qr_fall.png, lehrer-3bfp2-1-fall.html, lehrer-3bfp2-2-fall.html   ← Beamer
  ab1a.html … ab3a.html  ← die Übungen         (erzeugt mit werkzeuge/seiten_erzeugen.py)
  lehrer-3bfp2-1-ab1.html … lehrer-3bfp2-2-ab3.html   (ebenfalls erzeugt)
  sw.js                  ← Offline-Speicher (nach größeren Änderungen VERSION erhöhen)
server/                  ← Cloudflare Worker für die Fortschrittsanzeige (src/fall.js: Fall-Einführung)
qr/                      ← QR-Codes
werkzeuge/               ← QR-Codes und Seiten erzeugen
tests/                   ← automatische Tests
```

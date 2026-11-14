/* ==========================================================================
   FALL-EINFÜHRUNG „ZEITLUPE“ – Texte (Themenblock 2, Leitfall Frau Maler)
   ==========================================================================

   Handy:  fall.html (QR-Code auf dem Beamer)
   Beamer: lehrer-3bfp2-1-fall.html / lehrer-3bfp2-2-fall.html

   ACHTUNG – Falltext: Der Text des Fallbeispiels (unten bei „text“) ist der gemeinsame
   Leitfall aller Lehrkräfte und darf NICHT verändert werden. Er ist nur in Abschnitte
   aufgeteilt (Wort für Wort wie auf dem Arbeitsblatt). Der Test tests/fall.test.js prüft das.

   Alles andere (Fragen, Antwortknöpfe, Hinweise) dürfen Sie ändern – wie in inhalte.js:
   - nur ändern, was ZWISCHEN den Hochkommas ' … ' steht,
   - ein einfaches Hochkomma (') im Text als \' schreiben,
   - die Kürzel (kuerzel: 'STURZ' usw.) NICHT ändern, sonst passen gesicherte Ergebnisse
     aus der Einführung nicht mehr zu SW 13.

   Ablauf (die Lehrkraft schaltet mit „Weiter“ von Schritt zu Schritt):
     kaltstart     – nur Beamer: Satz + 10-Sekunden-Countdown (die Handys sind noch nicht dabei)
     fragen        – Anmelden per QR-Code, dann Fragen zum Kaltstart
     personen      – Vorstellung: Das sind Christin und Frau Maler (optional mit Bild)
     station       – Abschnitt des Falls → Frage → Ergebnis → was Christin getan hat (aufloesung)
     zurueckspulen – Zeitstrahl aller Stationen + Frage „Ab wann hätte man …?“
     perspektiven  – Gruppen: „Was hätte diese Person gebraucht?“ + Lernfrage
     ende          – Begriffsparkplatz, Ausblick, Ergebnis sichern

   Reihenfolge-Fragen (reihenfolge: true): Die Antworten stehen hier in der RICHTIGEN Reihenfolge,
   die Handys zeigen sie gemischt. Die SuS tippen sie nacheinander an (1., 2., 3. …).
   Mit „anzahl: 3“ werden nur die ersten 3 gesucht – die übrigen Antworten passen nicht (mit „grund“).

   Auftrag fürs Smartphone (handyAuftrag): steht während der Abstimmung groß auf dem Beamer
   („📱 Jetzt am Smartphone: …“), damit klar ist, dass die SuS etwas tun müssen. Ohne Angabe
   erzeugt die Beamer-Seite einen passenden Satz zur Frageart.

   Mehrfachauswahl mit „waehlen: 3“: Die SuS müssen genau 3 Antworten wählen (eine echte Entscheidung).

   Auflösung bei Auswahlfragen (optional): Haben die Antworten einer Station „passt: true/false“ und einen
   kurzen „grund“, zeigt „Auflösen“ auf dem Beamer und auf den Handys, was passt (✓) und was nicht (✗).

   Zusätzliche Situationen (extra: true): kurze Situationen, die NICHT im Fallbeispiel stehen und am Fall
   nichts ändern. Bei ihnen ist alles normal (🟢) – so müssen die SuS bei der Ampel wirklich unterscheiden und
   wählen nicht immer „beobachten“. Ihr Text steht beim Schritt (text: …), nicht oben im Falltext; sie erscheinen
   nicht im Zeitstrahl und nicht bei „Den Fall bis hier noch einmal lesen“. loesung = Einschätzung beim Auflösen.
   Die Stationen werden automatisch durchnummeriert (mit den zusätzlichen Situationen).

   Bilder (optional, bei kaltstart, personen und station): bild: { datei: 'bilder/station2.jpg', alt: '…' }
   Jedes Bild liegt zweimal in docs/bilder/: groß für den Beamer (1600 px breit) und mit „-klein“
   für die Handys (800 px), z. B. station2.jpg und station2-klein.jpg. Ein Bild darf nicht mehr
   zeigen als der Text bis zur Stopp-Stelle. alt = kurze Beschreibung (für Vorlese-Programme).
   ========================================================================== */

var FALL = {

  kopfzeile: 'Themenblock 2 – Notfallsituationen',
  titel: '„Reanimation und nicht nur ich war hilflos“',

  // Ampel für die Stationen 2 bis 4
  ampel: [
    { kuerzel: 'G', text: 'Alles normal', farbe: 'gruen', zeichen: '🟢' },
    { kuerzel: 'Y', text: 'Beobachten / nachfragen', farbe: 'gelb', zeichen: '🟡' },
    { kuerzel: 'R', text: 'Sofort melden', farbe: 'rot', zeichen: '🔴' }
  ],

  /* ------------------------------------------------------------------------
     Falltext in Abschnitten – NICHT ÄNDERN (siehe oben)
     teil: zu welchem Schritt der Abschnitt gehört · art: 'frage' (wird vorgelesen, dann
     wird abgestimmt) oder 'aufloesung' (was Christin getan hat) · absatz: true = neuer Absatz
     ------------------------------------------------------------------------ */
  text: [
    { teil: 's1', art: 'frage', absatz: true,
      text: 'Frau Maler ist seit gestern Nachmittag neu im Pflegeheim. Sie ist 71 Jahre alt und hatte vor 3 Wochen eine Hüft-TEP erhalten, von der sie sich noch nicht richtig erholt hat. Diese hat sie infolge eines Sturzes im Bad erhalten, bei dem sie sich eine Schenkelhalsfraktur zuzog: Ihr rechtes Bein war damals verkürzt und nach außen gedreht, und sie konnte nicht mehr aufstehen. Durch die Redon-Drainage kam sie in den ersten beiden Tagen gar nicht aus dem Bett. Trotz der Fast-Track-Chirurgie im Krankenhaus ist sie nicht alleine mobil, da sie vor einer Hüftluxation große Angst hat. Seit der Entlassung liegt sie die meiste Zeit im Bett. Laut Überleitungsbogen erhält sie täglich eine Heparin-Spritze zur Thromboseprophylaxe; die Bewegungsvorgaben der Klinik sind beigefügt.' },
    { teil: 's1', art: 'frage', absatz: true,
      text: 'Diese Informationen hatte Schülerin Christin während der Übergabe am Morgen erhalten, doch was dann folgte, hatte sie nicht erwartet.' },
    { teil: 's1', art: 'frage', absatz: true,
      text: 'Im darauffolgenden Schulblock erzählte Christin von ihren Erlebnissen im letzten pflegepraktischen Einsatz. Zuerst berichtete sie in Kurzfassung die Informationen aus der Übergabe, doch dann wurden alle plötzlich still:' },
    { teil: 's2', art: 'frage', absatz: true,
      text: '„[…] Am Morgen des besagten Tages unterstützte ich sie bei der Körperpflege an der Bettkante. Dabei klagte sie, ihre rechte Wade sei seit gestern dick und tue beim Auftreten weh.' },
    { teil: 's2', art: 'aufloesung', absatz: false,
      text: 'Ich dachte, das komme von der Operation, und habe es nicht weitergegeben.' },
    { teil: 's3', art: 'frage', absatz: false,
      text: 'Beim Frühstück verschluckte sie sich am Kaffee und hustete kräftig.' },
    { teil: 's3', art: 'aufloesung', absatz: false,
      text: 'Ich ließ sie husten, und nach kurzer Zeit war alles wieder gut. Ich war noch drei- bis viermal wegen anderer Pflegehandlungen bei ihr im Zimmer, worüber sie sich sichtlich freute.' },
    { teil: 's4', art: 'frage', absatz: false,
      text: 'Gegen elf Uhr wirkte sie unruhig, atmete schnell und sagte, sie bekomme schlecht Luft. Sie war blass, hatte kalten Schweiß auf der Stirn, ihr Puls lag bei 118/min und der Blutdruck bei 105/70 mmHg.' },
    { teil: 's4', art: 'aufloesung', absatz: false,
      text: 'Ich dachte, sie sei nur aufgeregt, weil alles neu für sie ist.' },
    { teil: 's5', art: 'frage', absatz: true,
      text: 'Zum Mittagessen wollte ich ihr das Essen bringen und fand sie ganz eigenartig im Bett liegend vor. Frau Maler war blau angelaufen, ihre Augen waren starr nach oben gerichtet und ihr Mund stand offen.' },
    { teil: 's5', art: 'aufloesung', absatz: false,
      text: 'Ich habe daraufhin sofort eine andere Schülerin losgeschickt, um eine Examinierte zu holen. In der Zwischenzeit versuchte ich, Frau Maler anzusprechen und den Puls zu fühlen. Beides ohne Erfolg. Obwohl zwei Pflegende sehr schnell kamen, schien mir die Zeit unendlich lang. Eine von ihnen hat sofort den Notarzt alarmiert und mit der Reanimation begonnen. Die andere war genauso überfordert wie ich und stand nur herum. Die Pflegekraft schrie während der Reanimation und erteilte uns Aufgaben, die mich jedoch überforderten. Ich verstand nicht, was ich machen sollte. Diese Hilflosigkeit und Unfähigkeit zum Handeln waren für mich sehr erschreckend. Außerdem hätte ich mir nur eine klare Anweisung gewünscht. Gleichzeitig war ich sehr erstaunt über die Hilflosigkeit der einen Pflegekraft. Anscheinend ist von dieser Reaktion des Körpers und des Kopfes keiner verschont. Auch dann nicht, wenn man über alle theoretischen Kenntnisse verfügt, um diese Situation zu meistern. Leider ist es in der Ausbildung nicht möglich, sämtliche Notfallsituationen mindestens einmal zu erleben. So bleibt einem nur die Hoffnung, in der entscheidenden Situation richtig reagieren zu können.' },
    { teil: 's6', art: 'frage', absatz: true,
      text: 'Nachdem der Notarzt mit Frau Maler gefahren war, hat eine Fachkraft die Angehörigen von Frau Maler per Telefon kontaktiert. Ich hätte gar nicht genau gewusst, wie ich eine solche Botschaft überbringen soll, und ich war froh, dass ich das nicht machen musste. Zudem war die Fachkraft danach ganz aufgeregt, da die Angehörigen erwähnten, dass sie eine Patientenverfügung hat und doch alle lebensverlängernden Maßnahmen verweigerte.' },
    { teil: 's6', art: 'aufloesung', absatz: false,
      text: 'Ich stellte mir die Frage, ob die Reanimation überhaupt zulässig war.' },
    { teil: 's7', art: 'frage', absatz: true,
      text: 'Später habe ich erfahren, dass Frau Maler wohl eine Lungenembolie hatte. Mir geht dieser Tag immer noch im Kopf herum, häufig träume ich davon und wache nachts kaltschweißig auf.“' }
  ],

  schritte: [

    { id: 'kalt', art: 'kaltstart', kurz: 'Kaltstart',
      satz: 'Sie kommen ins Zimmer. Frau Maler reagiert nicht.',
      aufforderung: 'Sie haben 10 Sekunden: Was tun Sie?',
      // Die SuS schreiben ihre ersten Ideen sofort auf (Stift und Zettel vorher bereitlegen lassen).
      // So kann sich später niemand an Antworten „erinnern“, die erst danach gezeigt werden.
      notiz: 'Schreiben Sie Ihre ersten Ideen sofort in Stichworten auf Ihren Zettel.',
      notizKurz: 'Aufschreiben!',
      sekunden: 10,
      stopp: 'Stopp!',
      handy: 'Schauen Sie nach vorn.',
      bild: { datei: 'bilder/kaltstart.jpg', alt: 'Blick von der Tür ins Zimmer: Frau Maler liegt reglos im Bett, ein Arm hängt über die Bettkante. Im Vordergrund ein Tablett mit Mittagessen.' } },

    { id: 'anmelden', art: 'fragen', kurz: 'Ihre 10 Sekunden',
      titel: 'Ihre 10 Sekunden',
      beamerText: 'Scannen Sie den QR-Code und melden Sie sich mit Ihrem Namen an.',
      handyAuftrag: 'Beantworten Sie die 2 Fragen. Nehmen Sie Ihren Zettel dazu.',
      hinweis: 'Der Fall ist belastend. Wenn es Ihnen zu viel wird, dürfen Sie kurz rausgehen.',
      fragen: [
        { id: 'kalttat', mehrfach: true,
          text: 'Was steht auf Ihrem Zettel?',
          hilfe: 'Kreuzen Sie nur an, was Sie in den 10 Sekunden aufgeschrieben haben.',
          optionen: [
            { kuerzel: 'NICHTS', text: 'Nichts – mir ist nichts eingefallen' },
            { kuerzel: 'ANSP', text: 'Frau Maler ansprechen oder anfassen' },
            { kuerzel: 'RUF', text: 'Laut um Hilfe rufen' },
            { kuerzel: 'ATEM', text: 'Die Atmung prüfen' },
            { kuerzel: 'PULS', text: 'Den Puls fühlen' },
            { kuerzel: 'NOT', text: 'Den Notruf wählen' },
            { kuerzel: 'HDM', text: 'Mit der Herzdruckmassage beginnen' },
            { kuerzel: 'HOL', text: 'Jemanden holen' },
            { kuerzel: 'ANDERS', text: 'Etwas anderes' }
          ] },
        { id: 'kaltsicher', skala: true,
          text: 'Wie sicher haben Sie sich in den 10 Sekunden gefühlt?',
          optionen: [
            { kuerzel: '1', text: 'sehr unsicher' },
            { kuerzel: '2', text: 'unsicher' },
            { kuerzel: '3', text: 'teils, teils' },
            { kuerzel: '4', text: 'sicher' },
            { kuerzel: '5', text: 'sehr sicher' }
          ] }
      ] },

    // Vorstellung der beiden Personen – erst NACH dem Kaltstart, damit die SuS dort selbst handeln.
    // Nur Angaben, die auch im Falltext stehen. Bild (optional): bild: { datei: 'bilder/personen.jpg', alt: '…' }
    { id: 'personen', art: 'personen', kurz: 'Vorstellung',
      titel: 'Das sind Christin und Frau Maler',
      vorspann: 'Genau diese Situation hat Christin erlebt.',
      personen: [
        { name: 'Christin', text: 'Auszubildende in der Pflege. Sie macht einen Praxiseinsatz im Pflegeheim.' },
        { name: 'Frau Maler', text: '71 Jahre alt. Sie ist seit gestern neu im Pflegeheim.' }
      ],
      nachspann: 'Wir gehen zurück an den Anfang dieses Tages.',
      handy: 'Schauen Sie nach vorn.',
      bild: { datei: 'bilder/personen.jpg', alt: 'Frau Maler sitzt aufrecht im Pflegebett. Christin steht neben dem Bett, eine Hand auf dem Bettgitter, und begrüßt sie lächelnd. Vor dem Bett steht ein Rollator.' } },

    { id: 's1', art: 'station', kurz: 'Die Übergabe', zeitstrahl: 'Übergabe',
      bild: { datei: 'bilder/station1.jpg', alt: 'Frau Maler sitzt im Pflegebett und schaut besorgt. Neben dem Bett steht ein Rollator.' },
      frage: { id: 's1', mehrfach: true,
        handyAuftrag: 'Wählen Sie alle Risiken, die Sie im Text finden.',
        text: 'Welche Risiken hat Frau Maler?',
        hilfe: 'Wählen Sie nur, was zum Text passt. Mehrere Antworten sind möglich.',
        optionen: [
          { kuerzel: 'STURZ', text: 'Sturz', passt: true, grund: 'schon einmal gestürzt; kann nicht alleine gehen' },
          { kuerzel: 'UNTERZ', text: 'Unterzuckerung', passt: false, grund: 'kein Diabetes bekannt' },
          { kuerzel: 'THROMB', text: 'Thrombose', passt: true, grund: 'liegt nach der Hüft-TEP viel im Bett – Heparin senkt das Risiko nur' },
          { kuerzel: 'DEKU', text: 'Dekubitus', passt: true, grund: 'liegt die meiste Zeit im Bett' },
          { kuerzel: 'WEG', text: 'Weglaufen aus dem Heim', passt: false, grund: 'kann nicht alleine gehen' },
          { kuerzel: 'PNEU', text: 'Pneumonie', passt: true, grund: 'liegt viel und bewegt sich wenig' },
          { kuerzel: 'KONTR', text: 'Kontraktur', passt: true, grund: 'bewegt sich wenig' },
          { kuerzel: 'KRAMPF', text: 'Krampfanfall', passt: false, grund: 'keine Epilepsie bekannt' },
          { kuerzel: 'LUX', text: 'Luxation der Hüfte', passt: true, grund: 'neue Hüft-TEP – Bewegungsvorgaben beachten' }
        ] } },

    { id: 's2', art: 'station', kurz: 'Am Morgen', zeitstrahl: 'Wade dick, Schmerzen',
      bild: { datei: 'bilder/station2.jpg', alt: 'Frau Maler sitzt auf der Bettkante und zeigt auf ihre rechte Wade. Die Auszubildende hockt neben ihr.' },
      frage: { id: 's2', ampel: true, text: 'Wie schätzen Sie das ein?', handyAuftrag: 'Wählen Sie eine Farbe: 🟢 🟡 🔴' },
      christin: { ampel: 'G', kurz: 'nicht weitergegeben' } },

    // Zusätzliche Situation (nicht im Fallbeispiel): alles normal
    { id: 'z1', art: 'station', extra: true, kurz: 'Nach der Körperpflege',
      text: 'Danach machte ich ihr Bett. Sie erzählte mir von ihrem Garten und lachte.',
      frage: { id: 'z1', ampel: true, text: 'Wie schätzen Sie das ein?', handyAuftrag: 'Wählen Sie eine Farbe: 🟢 🟡 🔴' },
      loesung: { ampel: 'G', text: 'Ein freundliches Gespräch. Hier gibt es nichts zu beobachten und nichts zu melden.' } },

    { id: 's3', art: 'station', kurz: 'Beim Frühstück', zeitstrahl: 'verschluckt, hustet',
      frage: { id: 's3', ampel: true, text: 'Wie schätzen Sie das ein?', handyAuftrag: 'Wählen Sie eine Farbe: 🟢 🟡 🔴' },
      christin: { ampel: 'Y', kurz: 'husten lassen' } },

    // Zusätzliche Situationen (nicht im Fallbeispiel): alles normal – passt zu „drei- bis viermal … bei ihr im Zimmer“
    { id: 'z2', art: 'station', extra: true, kurz: 'Gegen neun Uhr',
      text: 'Gegen neun Uhr cremte ich ihr den Rücken ein. Die Haut war gesund und nicht gerötet.',
      frage: { id: 'z2', ampel: true, text: 'Wie schätzen Sie das ein?', handyAuftrag: 'Wählen Sie eine Farbe: 🟢 🟡 🔴' },
      loesung: { ampel: 'G', text: 'Die Haut wurde kontrolliert: Sie ist gesund. Das ist ein guter Befund – kein Warnzeichen.' } },

    { id: 'z3', art: 'station', extra: true, kurz: 'Gegen zehn Uhr',
      text: 'Gegen zehn Uhr wollte sie fernsehen. Ich gab ihr die Fernbedienung, und sie bedankte sich.',
      frage: { id: 'z3', ampel: true, text: 'Wie schätzen Sie das ein?', handyAuftrag: 'Wählen Sie eine Farbe: 🟢 🟡 🔴' },
      loesung: { ampel: 'G', text: 'Ein normaler Wunsch. Hier gibt es nichts zu melden.' } },

    { id: 's4', art: 'station', kurz: 'Gegen elf Uhr', zeitstrahl: 'Atemnot, Puls 118',
      bild: { datei: 'bilder/station4.jpg', alt: 'Frau Maler liegt halb aufrecht im Bett, atmet mit offenem Mund und hält eine Hand auf der Brust. Die Auszubildende fühlt den Puls.' },
      frage: { id: 's4', ampel: true, text: 'Wie schätzen Sie das ein?', handyAuftrag: 'Wählen Sie eine Farbe: 🟢 🟡 🔴' },
      christin: { ampel: 'G', kurz: 'dachte: nur aufgeregt' } },

    { id: 's5', art: 'station', kurz: 'Zum Mittagessen', zeitstrahl: 'blau, reagiert nicht',
      bild: { datei: 'bilder/kaltstart.jpg', alt: 'Das Bild vom Anfang: Frau Maler liegt reglos im Bett, im Vordergrund das Tablett mit Mittagessen.' },
      // Die 3 wichtigsten Schritte nach den Reanimationsleitlinien 2025 (ERC/GRC): Prüfen – Rufen – Drücken.
      // Die ersten 3 Antworten sind die richtigen (in der richtigen Reihenfolge), die übrigen passen nicht.
      // Die Handys zeigen alle gemischt. Kürzel höchstens 4 Zeichen.
      frage: { id: 's5', reihenfolge: true, anzahl: 3,
        handyAuftrag: 'Tippen Sie die 3 wichtigsten Schritte in der richtigen Reihenfolge an.',
        text: 'Was sind die 3 wichtigsten Schritte? Tippen Sie sie in der richtigen Reihenfolge an.',
        hilfe: 'Tippen Sie zuerst Schritt 1, dann Schritt 2, dann Schritt 3. Noch einmal tippen nimmt einen Schritt wieder heraus.',
        merksatz: 'Prüfen – Rufen – Drücken',
        quelle: 'Nach den Reanimationsleitlinien 2025 (ERC/GRC)',
        optionen: [
          { kuerzel: 'ANSP', text: 'Ansprechen und an den Schultern rütteln', merk: 'Prüfen' },
          { kuerzel: 'RUF', text: 'Laut um Hilfe rufen und Notruf 112 wählen (lassen)', merk: 'Rufen' },
          { kuerzel: 'HDM', text: 'Mit der Herzdruckmassage beginnen', merk: 'Drücken' },
          { kuerzel: 'PULS', text: 'Den Puls fühlen', grund: 'kostet Zeit – geprüft werden Bewusstsein und Atmung' },
          { kuerzel: 'GEH', text: 'Selbst losgehen und Hilfe holen', grund: 'Frau Maler nicht allein lassen – laut rufen, andere holen lassen' },
          { kuerzel: 'HOCH', text: 'Den Oberkörper hochlagern', grund: 'Herzdruckmassage nur flach auf dem Rücken, auf harter Unterlage' },
          { kuerzel: 'WART', text: 'Abwarten, ob sie wieder zu sich kommt', grund: 'jede Sekunde zählt' },
          { kuerzel: 'ANGE', text: 'Die Angehörigen anrufen', grund: 'erst später – zuerst die Notfallversorgung' }
        ] } },

    { id: 's6', art: 'station', kurz: 'Nach der Reanimation', zeitstrahl: 'Patientenverfügung',
      frage: { id: 's6',
        text: 'War die Reanimation erlaubt?',
        handyAuftrag: 'Wählen Sie eine Antwort.',
        optionen: [
          { kuerzel: 'JA', text: 'Ja' },
          { kuerzel: 'NEIN', text: 'Nein' },
          { kuerzel: 'WN', text: 'Ich weiß es nicht' }
        ] } },

    { id: 's7', art: 'station', kurz: 'Später', zeitstrahl: 'Albträume',
      bild: { datei: 'bilder/station7.jpg', alt: 'Eine junge Frau sitzt nachts wach auf ihrem Bett und umarmt ihre Knie.' },
      // Genau 3 wählen (waehlen: 3) – so müssen die SuS sich entscheiden. Mehrere Antworten helfen (passt: true),
      // 3 helfen nicht (passt: false). Welche 3 am wichtigsten sind, ist Gesprächsanlass (hinweis bei der Auflösung).
      frage: { id: 's7', mehrfach: true, waehlen: 3,
        text: 'Welche 3 Dinge würden Christin jetzt am meisten helfen?',
        handyAuftrag: 'Wählen Sie genau 3 Dinge aus.',
        hilfe: 'Wählen Sie genau 3.',
        hinweis: 'Alle grünen Antworten können helfen. Welche zuerst? Das hängt von Christin ab – darüber lohnt sich das Gespräch.',
        optionen: [
          { kuerzel: 'REDEN', text: 'Mit einer Vertrauensperson darüber reden', passt: true, grund: 'Reden entlastet' },
          { kuerzel: 'TEAM', text: 'Eine Nachbesprechung im Team', passt: true, grund: 'gemeinsam verstehen, was passiert ist' },
          { kuerzel: 'NIX', text: 'Nichts – das geht von allein vorbei', passt: false, grund: 'Albträume über längere Zeit sind ein Warnzeichen' },
          { kuerzel: 'PA', text: 'Ein Gespräch mit ihrer Praxisanleitung', passt: true, grund: 'Begleitung in der Ausbildung' },
          { kuerzel: 'NORMAL', text: 'Erfahren, dass ihre Reaktion normal ist', passt: true, grund: 'Erstarren ist eine normale Reaktion im Notfall' },
          { kuerzel: 'SCHULD', text: 'Herausfinden, wer schuld war', passt: false, grund: 'es geht ums Lernen, nicht um Schuld' },
          { kuerzel: 'PROFI', text: 'Hilfe von Fachleuten, z. B. Psychologin', passt: true, grund: 'die Albträume halten an' },
          { kuerzel: 'VERG', text: 'Nicht mehr darüber reden und vergessen', passt: false, grund: 'Verdrängen hilft auf Dauer nicht' },
          { kuerzel: 'UEBEN', text: 'Reanimation üben, um sicherer zu werden', passt: true, grund: 'Übung gibt Sicherheit' }
        ] } },

    { id: 'zurueck', art: 'zurueckspulen', kurz: 'Zurückspulen',
      titel: 'Zurückspulen',
      vorspann: 'Frau Maler hatte wohl eine Lungenembolie.',
      frage: { id: 'zurueck',
        text: 'Ab wann hätte man den Notfall vielleicht verhindern können?',
        handyAuftrag: 'Wählen Sie einen Zeitpunkt.',
        optionen: [
          { kuerzel: 'S1', text: 'Schon bei der Übergabe' },
          { kuerzel: 'S2', text: 'Am Morgen (Körperpflege)' },
          { kuerzel: 'S3', text: 'Beim Frühstück' },
          { kuerzel: 'S4', text: 'Gegen elf Uhr' },
          { kuerzel: 'S5', text: 'Zum Mittagessen' },
          { kuerzel: 'NIE', text: 'Gar nicht – das war nicht zu verhindern' }
        ] } },

    { id: 'persp', art: 'perspektiven', kurz: 'Perspektiven',
      titel: 'Was hätte diese Person gebraucht?',
      // Die Beamer-Seite teilt alle Angemeldeten automatisch und gleichmäßig auf die Personen auf (eine Gruppe je Person).
      auftrag: 'Besprechen Sie in Ihrer Gruppe: Was hätte diese Person gebraucht? Jede und jeder schickt **mindestens einen Eintrag** – mit einer Lernfrage: Was müssen wir dafür lernen?',
      beamerAuftrag: 'Jede Gruppe bearbeitet eine Person.',
      handyAuftrag: 'Schreiben Sie: Was hätte Ihre Person gebraucht? Dazu eine Lernfrage. Tippen Sie dann auf „Senden“ – jede und jeder mindestens einmal.',
      gruppeTitel: 'Ihre Gruppe bearbeitet:',
      gruppeMit: 'In Ihrer Gruppe:',
      gruppeWarten: 'Ihre Lehrkraft teilt gleich die Gruppen ein …',
      personen: [
        { id: 'christin', text: 'Christin (Auszubildende)' },
        { id: 'pk1', text: 'Die Pflegekraft, die reanimiert hat' },
        { id: 'pk2', text: 'Die Pflegekraft, die nur herumstand' },
        { id: 'angeh', text: 'Die Angehörigen' },
        { id: 'maler', text: 'Frau Maler' }
      ],
      feldA: 'Diese Person hätte … gebraucht:',
      feldABeispiel: 'Stichworte genügen',
      feldB: 'Das müssen wir dafür lernen (Lernfrage):',
      satzanfaenge: ['Wie …?', 'Woran erkenne ich …?', 'Was muss ich tun, wenn …?', 'Warum …?', 'Wer darf …?'],
      gesendet: 'Gesendet! Sie können noch mehr schreiben.',
      nochNichtGesendet: 'Noch nicht gesendet – tippen Sie auf „Senden“.' },

    { id: 'ende', art: 'ende', kurz: 'Ausblick',
      titel: 'Wie geht es weiter?',
      beamerText: 'In den nächsten Wochen lernen wir in allen Fächern, was Christin gebraucht hätte.',
      handy: 'Danke! Sie bekommen jetzt das Arbeitsblatt mit dem ganzen Fall.' }
  ],

  begriffe: {
    titel: 'Begriffsparkplatz',
    text: 'Tippen Sie im Fall auf ein unklares Wort. Oder schreiben Sie es hier auf:',
    knopf: 'Parken',
    danke: 'Danke! Das Wort steht jetzt auf dem Begriffsparkplatz.',
    // Wörter im Falltext antippen (Handy)
    tippHinweis: 'Wort unklar? Tippen Sie darauf.',
    tippDazu: 'Tippen Sie auf das Wort daneben, um es dazuzunehmen.',
    tippKnopf: 'Parken',
    geparkt: 'geparkt',
    meine: 'Ihre geparkten Wörter:'
  },

  // Texte auf dem Handy
  handy: {
    warten: 'Hören Sie zu. Gleich geht es weiter.',
    nachVorn: 'Schauen Sie nach vorn.',
    ihreReihenfolge: 'Ihre Reihenfolge:',
    richtigeReihenfolge: 'Richtige Reihenfolge:',
    gesendet: 'Gesendet. Sie können Ihre Antwort noch ändern.',
    // Mehrfachauswahl und Reihenfolge werden automatisch gesendet (kein „Senden“-Knopf)
    automatisch: 'Tippen genügt – Ihre Antwort wird automatisch gesendet.',
    wirdGesendet: 'Wird gesendet …',
    nochWaehlen: 'Noch {x} wählen – dann wird Ihre Antwort automatisch gesendet.',
    nochTippen: 'Noch {x} antippen – dann wird Ihre Reihenfolge automatisch gesendet.',
    gesperrt: 'Die Abstimmung ist beendet.',
    ihreAntwort: 'Ihre Antwort:',
    keineAntwort: 'Sie haben nicht abgestimmt.',
    christinErzaehlt: 'Christin erzählt weiter:',
    einschaetzung: 'Einschätzung:',
    senden: 'Senden',
    bisher: 'Den Fall bis hier noch einmal lesen',
    keineVerbindung: 'Keine Verbindung – es wird weiter versucht …',
    nichtEingerichtet: 'Die Fall-Einführung ist noch nicht eingerichtet (serverAdresse in einstellungen.js).',
    station: 'Station {x} von {y}',
    datenschutz: 'Gespeichert werden nur Ihr Name, Ihre Klasse und Ihre Antworten. Auf dem Beamer sieht man, wer schon geantwortet hat. Die Antworten erscheinen nur zusammengezählt für die Klasse, Ihre Texte ohne Namen. Alles wird nach spätestens 12 Stunden automatisch gelöscht.'
  }
};

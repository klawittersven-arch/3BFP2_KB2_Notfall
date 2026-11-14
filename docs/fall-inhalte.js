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
     station       – Abschnitt des Falls → Frage → Ergebnis → was Christin getan hat (aufloesung)
     zurueckspulen – Zeitstrahl aller Stationen + Frage „Ab wann hätte man …?“
     perspektiven  – Gruppen: „Was hätte diese Person gebraucht?“ + Lernfrage
     ende          – Begriffsparkplatz, Ausblick, Ergebnis sichern

   Bilder (optional, bei kaltstart und station): bild: { datei: 'bilder/station2.jpg', alt: '…' }
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
      sekunden: 10,
      stopp: 'Stopp!',
      handy: 'Schauen Sie nach vorn.',
      bild: { datei: 'bilder/kaltstart.jpg', alt: 'Blick von der Tür ins Zimmer: Frau Maler liegt reglos im Bett, ein Arm hängt über die Bettkante. Im Vordergrund ein Tablett mit Mittagessen.' } },

    { id: 'anmelden', art: 'fragen', kurz: 'Ihre 10 Sekunden',
      titel: 'Ihre 10 Sekunden',
      beamerText: 'Scannen Sie den QR-Code und beantworten Sie zwei Fragen.',
      hinweis: 'Der Fall ist belastend. Wenn es Ihnen zu viel wird, dürfen Sie kurz rausgehen.',
      fragen: [
        { id: 'kalttat', mehrfach: true,
          text: 'Was haben Sie in den 10 Sekunden getan?',
          hilfe: 'Mehrere Antworten sind möglich.',
          optionen: [
            { kuerzel: 'NICHTS', text: 'Nichts – ich wusste nicht, was ich tun soll' },
            { kuerzel: 'ANSP', text: 'Frau Maler angesprochen oder angefasst' },
            { kuerzel: 'RUF', text: 'Laut um Hilfe gerufen' },
            { kuerzel: 'ATEM', text: 'Die Atmung geprüft' },
            { kuerzel: 'PULS', text: 'Den Puls gefühlt' },
            { kuerzel: 'NOT', text: 'Den Notruf gewählt' },
            { kuerzel: 'HDM', text: 'Mit der Herzdruckmassage begonnen' },
            { kuerzel: 'HOL', text: 'Jemanden geholt' }
          ] },
        { id: 'kaltsicher', skala: true,
          text: 'Wie sicher haben Sie sich gefühlt?',
          optionen: [
            { kuerzel: '1', text: 'sehr unsicher' },
            { kuerzel: '2', text: 'unsicher' },
            { kuerzel: '3', text: 'teils, teils' },
            { kuerzel: '4', text: 'sicher' },
            { kuerzel: '5', text: 'sehr sicher' }
          ] }
      ] },

    { id: 's1', art: 'station', nummer: 1, kurz: 'Die Übergabe', zeitstrahl: 'Übergabe',
      bild: { datei: 'bilder/station1.jpg', alt: 'Frau Maler sitzt im Pflegebett und schaut besorgt. Neben dem Bett steht ein Rollator.' },
      frage: { id: 's1', mehrfach: true,
        text: 'Welche Risiken sehen Sie bei Frau Maler?',
        hilfe: 'Mehrere Antworten sind möglich.',
        optionen: [
          { kuerzel: 'STURZ', text: 'Sturz' },
          { kuerzel: 'THROMB', text: 'Thrombose' },
          { kuerzel: 'DEKU', text: 'Dekubitus' },
          { kuerzel: 'PNEU', text: 'Pneumonie' },
          { kuerzel: 'KONTR', text: 'Kontraktur' },
          { kuerzel: 'LUX', text: 'Luxation der Hüfte' },
          { kuerzel: 'ANGST', text: 'Angst und Rückzug' }
        ] } },

    { id: 's2', art: 'station', nummer: 2, kurz: 'Am Morgen', zeitstrahl: 'Wade dick, Schmerzen',
      bild: { datei: 'bilder/station2.jpg', alt: 'Frau Maler sitzt auf der Bettkante und zeigt auf ihre rechte Wade. Die Auszubildende hockt neben ihr.' },
      frage: { id: 's2', ampel: true, text: 'Wie schätzen Sie das ein?' },
      christin: { ampel: 'G', kurz: 'nicht weitergegeben' } },

    { id: 's3', art: 'station', nummer: 3, kurz: 'Beim Frühstück', zeitstrahl: 'verschluckt, hustet',
      frage: { id: 's3', ampel: true, text: 'Wie schätzen Sie das ein?' },
      christin: { ampel: 'Y', kurz: 'husten lassen' } },

    { id: 's4', art: 'station', nummer: 4, kurz: 'Gegen elf Uhr', zeitstrahl: 'Atemnot, Puls 118',
      bild: { datei: 'bilder/station4.jpg', alt: 'Frau Maler liegt halb aufrecht im Bett, atmet mit offenem Mund und hält eine Hand auf der Brust. Die Auszubildende fühlt den Puls.' },
      frage: { id: 's4', ampel: true, text: 'Wie schätzen Sie das ein?' },
      christin: { ampel: 'G', kurz: 'dachte: nur aufgeregt' } },

    { id: 's5', art: 'station', nummer: 5, kurz: 'Zum Mittagessen', zeitstrahl: 'blau, reagiert nicht',
      bild: { datei: 'bilder/kaltstart.jpg', alt: 'Das Bild vom Anfang: Frau Maler liegt reglos im Bett, im Vordergrund das Tablett mit Mittagessen.' },
      frage: { id: 's5',
        text: 'Was tun Sie als Erstes?',
        optionen: [
          { kuerzel: 'ANSP', text: 'Frau Maler ansprechen oder anfassen' },
          { kuerzel: 'RUF', text: 'Laut um Hilfe rufen' },
          { kuerzel: 'ATEM', text: 'Die Atmung prüfen' },
          { kuerzel: 'PULS', text: 'Den Puls fühlen' },
          { kuerzel: 'NOT', text: 'Den Notruf wählen' },
          { kuerzel: 'HDM', text: 'Mit der Herzdruckmassage beginnen' },
          { kuerzel: 'HOL', text: 'Jemanden holen' },
          { kuerzel: 'WEISS', text: 'Ich weiß es nicht' }
        ] } },

    { id: 's6', art: 'station', nummer: 6, kurz: 'Nach der Reanimation', zeitstrahl: 'Patientenverfügung',
      frage: { id: 's6',
        text: 'War die Reanimation erlaubt?',
        optionen: [
          { kuerzel: 'JA', text: 'Ja' },
          { kuerzel: 'NEIN', text: 'Nein' },
          { kuerzel: 'WN', text: 'Ich weiß es nicht' }
        ] } },

    { id: 's7', art: 'station', nummer: 7, kurz: 'Später', zeitstrahl: 'Albträume',
      bild: { datei: 'bilder/station7.jpg', alt: 'Eine junge Frau sitzt nachts wach auf ihrem Bett und umarmt ihre Knie.' },
      frage: { id: 's7', mehrfach: true,
        text: 'Was braucht Christin jetzt?',
        hilfe: 'Mehrere Antworten sind möglich.',
        optionen: [
          { kuerzel: 'REDEN', text: 'Mit jemandem reden, dem sie vertraut' },
          { kuerzel: 'TEAM', text: 'Ein Gespräch im Team über den Notfall' },
          { kuerzel: 'PA', text: 'Hilfe von ihrer Praxisanleitung' },
          { kuerzel: 'PROFI', text: 'Hilfe von Fachleuten, z. B. Psychologin' },
          { kuerzel: 'UEBEN', text: 'Mehr Wissen und Übung für Notfälle' },
          { kuerzel: 'RUHE', text: 'Ruhe und Zeit' },
          { kuerzel: 'NIX', text: 'Nichts – das geht von allein vorbei' }
        ] } },

    { id: 'zurueck', art: 'zurueckspulen', kurz: 'Zurückspulen',
      titel: 'Zurückspulen',
      vorspann: 'Frau Maler hatte wohl eine Lungenembolie.',
      frage: { id: 'zurueck',
        text: 'Ab welcher Station hätte man den Notfall vielleicht verhindern können?',
        optionen: [
          { kuerzel: 'S1', text: '1 · Die Übergabe' },
          { kuerzel: 'S2', text: '2 · Am Morgen' },
          { kuerzel: 'S3', text: '3 · Beim Frühstück' },
          { kuerzel: 'S4', text: '4 · Gegen elf Uhr' },
          { kuerzel: 'S5', text: '5 · Zum Mittagessen' },
          { kuerzel: 'NIE', text: 'Gar nicht – das war nicht zu verhindern' }
        ] } },

    { id: 'persp', art: 'perspektiven', kurz: 'Perspektiven',
      titel: 'Was hätte diese Person gebraucht?',
      auftrag: 'Wählen Sie die Person Ihrer Gruppe. Schreiben Sie auf, was diese Person gebraucht hätte. Formulieren Sie dazu eine Lernfrage: Was müssen wir dafür lernen?',
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
      gesendet: 'Gesendet! Sie können noch mehr schreiben.' },

    { id: 'ende', art: 'ende', kurz: 'Ausblick',
      titel: 'Wie geht es weiter?',
      beamerText: 'In den nächsten Wochen lernen wir in allen Fächern, was Christin gebraucht hätte. In SW 13 spielen wir die Zeitlupe noch einmal.',
      handy: 'Danke! Sie bekommen jetzt das Arbeitsblatt mit dem ganzen Fall.' }
  ],

  // Kompetenzbereiche für die Zuordnung der Lernfragen auf dem Beamer
  kb: [
    { kuerzel: 'I', name: 'KB I' },
    { kuerzel: 'II', name: 'KB II' },
    { kuerzel: 'III', name: 'KB III' },
    { kuerzel: 'IV', name: 'KB IV' },
    { kuerzel: 'V', name: 'KB V' }
  ],

  begriffe: {
    titel: 'Begriffsparkplatz',
    text: 'Ein Wort ist unklar? Schreiben Sie es hier auf.',
    knopf: 'Parken',
    danke: 'Danke! Das Wort steht jetzt auf dem Begriffsparkplatz.'
  },

  // Texte auf dem Handy
  handy: {
    warten: 'Hören Sie zu. Gleich geht es weiter.',
    gesendet: 'Gesendet. Sie können Ihre Antwort noch ändern.',
    gesperrt: 'Die Abstimmung ist beendet.',
    ihreAntwort: 'Ihre Antwort:',
    keineAntwort: 'Sie haben nicht abgestimmt.',
    christinErzaehlt: 'Christin erzählt weiter:',
    senden: 'Senden',
    bisher: 'Den Fall bis hier noch einmal lesen',
    keineVerbindung: 'Keine Verbindung – es wird weiter versucht …',
    nichtEingerichtet: 'Die Fall-Einführung ist noch nicht eingerichtet (serverAdresse in einstellungen.js).',
    station: 'Station {x} von {y}',
    datenschutz: 'Gespeichert werden nur Ihr Name, Ihre Klasse und Ihre Antworten. Auf dem Beamer sieht man, wer schon geantwortet hat. Die Antworten erscheinen nur zusammengezählt für die Klasse, Ihre Texte ohne Namen. Alles wird nach spätestens 12 Stunden automatisch gelöscht.'
  }
};

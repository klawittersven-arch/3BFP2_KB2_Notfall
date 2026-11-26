/* ==========================================================================
   INHALTE – KB II · Notfallsituationen (3BFP2, Themenblock 2)
   Woche 1: AB 1 „Menschen im Notfall“ und AB 2 „Psychologische Erste Hilfe“
   Woche 4: AB „Informationen geben in Krisen“ (raum 'ab3')
   TB 2 neu ab KW 49, Woche 1: „Psychosoziale Unterstützung im Notfall“ und „Gesprächshemmer im Notfall vermeiden“ (raum 'kb2w1')
   ==========================================================================

   In dieser Datei stehen ALLE Texte der Übungen.
   Sie können die Texte hier ändern, ohne etwas vom Programm zu verstehen
   (auf GitHub: Datei öffnen → Stift „Edit this file“ → ändern → „Commit changes“;
   nach 1–2 Minuten ist die Änderung online).

   So ändern Sie einen Text sicher:
   - Ändern Sie nur, was ZWISCHEN den einfachen Hochkommas ' … ' steht.
   - Die Hochkommas selbst, die Kommas am Zeilenende und die Klammern
     { } [ ] müssen stehen bleiben.
   - Deutsche Anführungszeichen „ … “ dürfen Sie im Text frei verwenden.
     Ein einfaches Hochkomma (') im Text müssen Sie als \' schreiben.
   - **fett** funktioniert in Karten, Erklärungen, Tipps und Merksätzen.

   Aufbau einer Übung:
     ab          – Titel des Arbeitsblatts (erscheint in der Kopfzeile; bewusst ohne „AB 1“/„AB 2“)
     raum        – zu welchem Arbeitsblatt bzw. welcher Woche die Übung gehört ('ab1', 'ab2', 'ab3', 'kb2w1' …);
                   danach richtet sich die Lehrerseite für den Beamer.
     titel       – Überschrift der Übung (genau wie auf dem Arbeitsblatt)
     anweisung   – Arbeitsanweisung über den Karten
     vorspann    – (optional) grauer Kasten unter der Anweisung
     knoepfe     – die Antwortknöpfe: kuerzel (intern, nur GROSSBUCHSTABEN, höchstens 6)
                   und text (auf dem Knopf)
     hilfe       – (optional) aufklappbarer Hilfe-Kasten: titel + punkte
     mindestens  – so viele Karten müssen beim ERSTEN Versuch richtig sein,
                   sonst gibt es statt des Merksatzes „Nicht einfach durchklicken!“
     karten      – die Aussagen (siehe unten)
     merksatz    – erscheint erst, wenn alle Karten gelöst sind („Das Wichtigste in Kürze“)
     danach      – Hinweis nach dem Lösen unter „Übung 1 abgeschlossen!“: welche Aufgabe auf dem
                   Arbeitsblatt jetzt dran ist

   Aufbau einer Karte:
     nummer      – die Nummer auf der Karte
     text        – die Aussage
     richtig     – Kürzel der richtigen Antwort, z. B. 'K'
                   (mehrere richtige Antworten: ['SICH', 'BER'])
     erklaerung  – erscheint, wenn richtig geantwortet wurde
                   (bei mehreren richtigen Antworten auch je Antwort: { SICH: '…', BER: '…' })
     tipp        – erscheint nach einer falschen Antwort (die Lösung wird nie verraten)

   ========================================================================== */

var INHALTE = {

  /* ------------------------------------------------------------------------
     Texte, die auf allen Übungsseiten gleich sind
     ------------------------------------------------------------------------ */
  allgemein: {
    kopfzeile: 'KB II – Notfallsituationen',
    merksatzUeberschrift: 'Das Wichtigste in Kürze',
    // {x} und {y} werden automatisch durch Zahlen ersetzt.
    fortschritt: '{x} von {y} richtig',
    ersterVersuch: 'Beim ersten Versuch richtig: {x} von {y}',
    nochEinmal: 'Noch einmal üben',
    richtigText: 'Richtig!',
    falschText: 'Noch nicht richtig – versuchen Sie es noch einmal.',
    tippVorwort: 'Tipp:',
    // {x} = beim ersten Versuch richtig, {y} = Anzahl Karten, {z} = nötige Mindestzahl
    durchklickenTitel: 'Hey, nicht einfach durchklicken!',
    durchklickenText: 'Beim ersten Versuch richtig: {x} von {y} – nötig sind mindestens {z}. Lesen Sie jede Karte genau und überlegen Sie, bevor Sie antworten.',
    durchklickenKnopf: 'Übung neu starten',
    // Sperre nach einer falschen Antwort ({x} = Sekunden)
    sperreText: 'Lesen Sie den Tipp – weiter in {x} s',
    // Neustart, wenn in kurzer Zeit zu viele falsche Antworten kommen
    zuSchnellTitel: 'Zu schnell geklickt!',
    zuSchnellText: 'Sie haben in kurzer Zeit mehrere falsche Antworten gegeben. Lesen Sie jede Karte in Ruhe – die Übung beginnt von vorn.',
    // Überschrift nach dem Lösen ({x} = „Übung 1“ usw. – der Teil des Titels vor dem Doppelpunkt)
    fertigTitel: '{x} abgeschlossen!',

    // Namenseingabe (nur wenn die Fortschrittsanzeige eingerichtet ist, siehe einstellungen.js)
    nameTitel: 'Wer sind Sie?',
    nameText: 'Geben Sie Ihren **Vornamen** und den **ersten Buchstaben Ihres Nachnamens** ein und wählen Sie Ihre **Klasse**. Ihre Lehrkraft sieht auf dem Beamer, wie weit die Klasse ist.',
    nameBeispiel: 'z. B. Lena K.',
    klasseFrage: 'Ihre Klasse:',
    klasseFehler: 'Bitte wählen Sie Ihre Klasse.',
    nameKnopf: 'Los geht’s',
    nameFehler: 'Bitte so eingeben: Vorname, Leerzeichen, erster Buchstabe des Nachnamens – z. B. „Lena K.“',
    nameDatenschutz: 'Gespeichert werden nur Ihr Name, Ihre Klasse, Ihr Fortschritt und bei welchen Karten der erste Versuch falsch war (die Lehrkraft sieht das nur zusammengefasst für die Klasse). Alles wird nach spätestens 12 Stunden automatisch gelöscht.',
    nameAnzeige: 'Angemeldet als {x} · {y}',
    nameAendern: 'ändern',

    // Belohnung nach dem Lösen (nur bei Übungen mit „belohnungsspiel: true“, nicht nach dem Durchklicken)
    spielText: 'Super gemacht! Zur Belohnung dürfen Sie jetzt „Notfall-Run!“ spielen.',
    spielKnopf: '🎮 Jetzt spielen'
  },

  /* ========================================================================
     AB 1 – Menschen im Notfall
     ======================================================================== */

  ab1a: {
    ab: 'Menschen im Notfall',
    raum: 'ab1',
    titel: 'Übung 1: Körper, Denken oder Gefühl?',
    anweisung: 'So reagieren Menschen in einem Notfall. Ordnen Sie jede Reaktion zu: **Körper**, **Denken** oder **Gefühl**. Sie brauchen die Erklärungen für Aufgabe 3.',
    knoepfe: [
      { kuerzel: 'K', text: 'Körper' },
      { kuerzel: 'D', text: 'Denken' },
      { kuerzel: 'G', text: 'Gefühl' }
    ],
    hilfe: {
      titel: 'Hilfe: Woran erkenne ich die drei Bereiche?',
      punkte: [
        '**Körper:** Was passiert im Körper? (Herz, Atmung, Haut, Muskeln)',
        '**Denken:** Wie arbeitet der Kopf? (Aufmerksamkeit, Verstehen, Erinnern, Entscheiden)',
        '**Gefühl:** Was empfindet die Person? (z. B. Angst, Wut, Schuld)'
      ]
    },
    mindestens: 8,
    karten: [
      { nummer: 1,
        text: 'Das Herz rast und klopft bis zum Hals.',
        richtig: 'K',
        erklaerung: '**Körper:** Der **Sympathikus** schaltet auf Alarm. Stresshormone wie **Adrenalin** steigern Herzfrequenz und Blutdruck – der Körper bereitet sich auf **Kampf oder Flucht** vor.',
        tipp: 'Welches Organ ist hier gemeint?' },
      { nummer: 2,
        text: 'Christin: „Ich verstand nicht, was ich machen sollte.“',
        richtig: 'D',
        erklaerung: '**Denken:** Unter starkem Stress kann der Kopf Informationen schlechter aufnehmen und verarbeiten. Laute oder lange Anweisungen kommen dann nicht mehr an – kurze, klare Anweisungen helfen.',
        tipp: 'Geht es um den Körper, um ein Gefühl – oder darum, wie der Kopf arbeitet?' },
      { nummer: 3,
        text: 'Die Hände zittern, die Knie werden weich.',
        richtig: 'K',
        erklaerung: '**Körper:** Die Stresshormone spannen die Muskeln an und stellen Energie bereit. Zittern und weiche Knie sind typische Zeichen.',
        tipp: 'Welche Körperteile sind betroffen?' },
      { nummer: 4,
        text: 'Christin: „Diese Hilflosigkeit […] war für mich sehr erschreckend.“',
        richtig: 'G',
        erklaerung: '**Gefühl:** Hilflosigkeit und Erschrecken sind Gefühle. Sie sind nach einem Notfall häufig – auch bei erfahrenen Pflegenden.',
        tipp: 'Was empfindet Christin?' },
      { nummer: 5,
        text: 'Die zweite Pflegefachkraft „stand nur herum“.',
        richtig: 'D',
        erklaerung: '**Denken:** **Erstarren** ist eine typische Stressreaktion – der Kopf blockiert, Handeln ist für einen Moment nicht möglich. Das ist keine Faulheit und kein Desinteresse, sondern eine Schutzreaktion des Körpers.',
        tipp: 'Fehlt ihr die Kraft im Körper – oder blockiert etwas im Kopf?' },
      { nummer: 6,
        text: 'Christin: „Obwohl zwei Pflegende sehr schnell kamen, schien mir die Zeit unendlich lang.“',
        richtig: 'D',
        erklaerung: '**Denken:** Unter Stress verändert sich die Wahrnehmung – Sekunden fühlen sich wie Minuten an.',
        tipp: 'Wie nimmt Christin die Zeit wahr?' },
      { nummer: 7,
        text: 'Plötzlich bricht Christin der Schweiß aus.',
        richtig: 'K',
        erklaerung: '**Körper:** Schwitzen gehört zur Alarmreaktion des Sympathikus.',
        tipp: 'Wo zeigt sich das – an der Haut, im Kopf oder in der Stimmung?' },
      { nummer: 8,
        text: 'Tunnelblick: Man sieht nur noch die Patientin und bemerkt nicht, was um einen herum passiert.',
        richtig: 'D',
        erklaerung: '**Denken:** Die Aufmerksamkeit verengt sich auf die Gefahr. Andere Personen, Geräusche oder Anweisungen werden übersehen.',
        tipp: 'Es geht um die Aufmerksamkeit.' },
      { nummer: 9,
        text: 'Angst, etwas falsch zu machen.',
        richtig: 'G',
        erklaerung: '**Gefühl:** Angst ist das häufigste Gefühl im Notfall – bei Betroffenen, Angehörigen und Helfenden.',
        tipp: 'Was empfindet die Person?' },
      { nummer: 10,
        text: 'Hinterher kann sich Christin an manche Minuten nicht mehr erinnern.',
        richtig: 'D',
        erklaerung: '**Denken:** **Gedächtnislücken** sind nach extremem Stress häufig. Das Gehirn speichert in der Akutsituation nur Bruchstücke.',
        tipp: 'Was leistet hier der Kopf nicht?' },
      { nummer: 11,
        text: 'Wut auf die Kollegin, die einfach nur herumstand.',
        richtig: 'G',
        erklaerung: '**Gefühl:** Wut – auf andere oder auf sich selbst – ist eine häufige Reaktion nach einem Notfall.',
        tipp: 'Was empfindet die Person?' },
      { nummer: 12,
        text: 'Christin fragt sich: „Hätte ich etwas merken müssen?“ und fühlt sich schuldig.',
        richtig: 'G',
        erklaerung: '**Gefühl:** Schuldgefühle sind nach Notfällen häufig. Ob es Warnzeichen gab, klärt man später in Ruhe – in einer Nachbesprechung, ohne Vorwürfe.',
        tipp: 'Was empfindet Christin?' }
    ],
    merksatz: 'Im Notfall schaltet der **Sympathikus** auf Alarm: Stresshormone (z. B. **Adrenalin**) bereiten den Körper auf **Kampf oder Flucht** vor. Das zeigt sich im **Körper** (Herzrasen, Zittern, Schwitzen), im **Denken** (Tunnelblick, Erstarren, Gedächtnislücken) und in **Gefühlen** (Angst, Hilflosigkeit, Wut, Schuld). Diese Reaktionen sind **normal** – auch bei erfahrenen Pflegenden.',
    danach: 'Bearbeiten Sie jetzt **Aufgabe 3 „Stressreaktionen erklären“** auf dem Arbeitsblatt!'
  },

  ab1b: {
    ab: 'Menschen im Notfall',
    raum: 'ab1',
    titel: 'Übung 2: Normal – oder ein Warnzeichen?',
    anweisung: 'Wie geht es Pflegenden in den Tagen und Wochen nach einem Notfall? Entscheiden Sie: **normal** (klingt meist von selbst ab) oder **Warnzeichen** (Unterstützung anbieten und weitervermitteln). Sie brauchen die Erklärungen für Aufgabe 4.',
    knoepfe: [
      { kuerzel: 'N', text: 'normal' },
      { kuerzel: 'W', text: 'Warnzeichen' }
    ],
    hilfe: {
      titel: 'Hilfe: Worauf achte ich?',
      punkte: [
        '**Wie lange?** In den ersten Stunden und Tagen sind starke Reaktionen normal.',
        '**Wird es besser?** Normale Reaktionen werden mit der Zeit schwächer.',
        '**Wie stark?** Warnzeichen schränken Alltag, Arbeit oder Schlaf deutlich ein – oder die Person schadet sich selbst (z. B. mit Alkohol).'
      ]
    },
    mindestens: 7,
    karten: [
      { nummer: 1,
        text: 'Am Abend nach dem Notfall zittern Christin noch die Hände.',
        richtig: 'N',
        erklaerung: '**Normal:** Der Körper braucht Zeit, bis die Stresshormone abgebaut sind. Das klingt meist innerhalb von Stunden bis Tagen ab.',
        tipp: 'Wie viel Zeit ist seit dem Notfall vergangen?' },
      { nummer: 2,
        text: 'In der ersten Nacht schläft Christin schlecht und denkt immer wieder an Frau Maler.',
        richtig: 'N',
        erklaerung: '**Normal:** Wiederkehrende Gedanken und schlechter Schlaf in den ersten Tagen sind häufig. Das Gehirn verarbeitet das Erlebte.',
        tipp: 'Achten Sie auf die Zeitangabe.' },
      { nummer: 3,
        text: 'Vier Wochen später träumt Christin noch mehrmals pro Woche von der Reanimation und wacht schweißgebadet auf.',
        richtig: 'W',
        erklaerung: '**Warnzeichen:** Die Beschwerden halten **seit Wochen** an und werden nicht weniger. Christin sollte Unterstützung bekommen (z. B. Praxisanleitung, Schule, Betriebsarzt, psychosoziale Notfallversorgung, Psychotherapie). Ob eine Erkrankung vorliegt, klären Fachleute – nicht wir.',
        tipp: 'Achten Sie auf die Zeitangabe und darauf, ob es besser wird.' },
      { nummer: 4,
        text: 'Zwei Tage nach dem Notfall erzählt Christin ihrer Mitschülerin ausführlich, was passiert ist.',
        richtig: 'N',
        erklaerung: '**Normal – und hilfreich:** Über das Erlebte zu sprechen hilft beim Verarbeiten.',
        tipp: 'Schadet ihr das – oder hilft es ihr?' },
      { nummer: 5,
        text: 'Seit dem Notfall trinkt die Pflegefachkraft jeden Abend Alkohol, um einschlafen zu können.',
        richtig: 'W',
        erklaerung: '**Warnzeichen:** Alkohol oder Medikamente, um mit der Belastung fertigzuwerden, sind ein klares Warnzeichen. Ansprechen und Hilfe vermitteln (z. B. Betriebsarzt, Hausarzt, Beratungsstelle).',
        tipp: 'Womit versucht sie, die Belastung zu bewältigen?' },
      { nummer: 6,
        text: 'Christin meidet seit Wochen das Zimmer, in dem Frau Maler lag, und meldet sich deshalb krank.',
        richtig: 'W',
        erklaerung: '**Warnzeichen:** **Vermeiden** über Wochen und Arbeitsunfähigkeit zeigen, dass die Belastung nicht abnimmt. Weitervermitteln.',
        tipp: 'Kann Christin ihre Arbeit noch machen?' },
      { nummer: 7,
        text: 'Die Pflegefachkraft, die reanimiert hat, ist danach noch eine Stunde lang aufgewühlt und spricht sehr schnell.',
        richtig: 'N',
        erklaerung: '**Normal:** Auch Erfahrene reagieren auf einen Notfall. Die Aufregung lässt nach, wenn der Körper wieder zur Ruhe kommt.',
        tipp: 'Wie lange dauert die Reaktion an?' },
      { nummer: 8,
        text: 'Christin ist am Tag nach dem Notfall unkonzentriert und vergisst Kleinigkeiten.',
        richtig: 'N',
        erklaerung: '**Normal:** Konzentrationsprobleme in den ersten Tagen sind häufig. Hilfreich sind Pausen, klare Aufgaben und eine Ansprechperson.',
        tipp: 'Achten Sie auf die Zeitangabe.' },
      { nummer: 9,
        text: 'Die Kollegin zieht sich seit dem Notfall zurück, meidet die Pausen mit dem Team und trifft keine Freunde mehr. Nach drei Wochen ist es nicht besser.',
        richtig: 'W',
        erklaerung: '**Warnzeichen:** **Rückzug** über Wochen ohne Besserung. Ansprechen, Unterstützung anbieten und weitervermitteln.',
        tipp: 'Wird es mit der Zeit besser?' },
      { nummer: 10,
        text: 'Am Tag nach dem Notfall fragt sich Christin, ob sie etwas übersehen hat, und fühlt sich schuldig.',
        richtig: 'N',
        erklaerung: '**Normal:** Schuldgefühle sind in den ersten Tagen häufig. Ein Gespräch hilft, die Situation einzuordnen. Halten sie über Wochen an und belasten stark, werden sie zum Warnzeichen.',
        tipp: 'Wie viel Zeit ist vergangen?' }
    ],
    merksatz: 'In den **ersten Stunden und Tagen** sind starke Reaktionen **normal** (Zittern, schlechter Schlaf, Grübeln, Konzentrationsprobleme, Schuldgefühle). **Warnzeichen** sind: Beschwerden, die **über Wochen anhalten** oder zunehmen (z. B. Albträume, Wiedererleben), **Vermeiden** und **Rückzug**, **Arbeitsunfähigkeit**, **Alkohol oder Medikamente** zum Bewältigen. Dann: Unterstützung anbieten und **weitervermitteln**. Eine Diagnose (z. B. PTBS) stellen Fachleute.',
    danach: 'Bearbeiten Sie jetzt **Aufgabe 4 „Christin begleiten“** auf dem Arbeitsblatt!'
  },

  /* ========================================================================
     AB 2 – Psychologische Erste Hilfe: Ziele und Wirkprinzipien
     ======================================================================== */

  ab2a: {
    ab: 'Psychologische Erste Hilfe',
    raum: 'ab2',
    titel: 'Übung 1: Welches Wirkprinzip?',
    anweisung: 'Ordnen Sie jede Maßnahme einem der **fünf Wirkprinzipien nach Hobfoll et al.** zu. Manchmal passen zwei – dann ist beides richtig. Sie brauchen die Erklärungen für Aufgabe 1.',
    knoepfe: [
      { kuerzel: 'SICH', text: 'Sicherheit' },
      { kuerzel: 'BER', text: 'Beruhigung' },
      { kuerzel: 'WIRK', text: 'Selbst- und kollektive Wirksamkeit' },
      { kuerzel: 'VERB', text: 'Verbundenheit' },
      { kuerzel: 'HOFF', text: 'Hoffnung' }
    ],
    hilfe: {
      titel: 'Hilfe: die fünf Wirkprinzipien',
      punkte: [
        '**Sicherheit:** Gefahr beseitigen, vor Zuschauern abschirmen, nicht allein lassen',
        '**Beruhigung:** ruhig sprechen, Reize verringern, langsam atmen lassen',
        '**Selbst- und kollektive Wirksamkeit:** kleine, klare Aufgaben geben, eine Wahl lassen – „Ich kann etwas tun.“',
        '**Verbundenheit:** vertraute Menschen einbeziehen, Angehörige informieren',
        '**Hoffnung:** ehrliche, realistische Zuversicht – keine leeren Versprechen'
      ]
    },
    mindestens: 10,
    karten: [
      { nummer: 1,
        text: 'Sie bitten die Mitbewohnerinnen, den Raum zu verlassen, und ziehen den Vorhang zu.',
        richtig: ['SICH', 'BER'],
        erklaerung: {
          SICH: '**Sicherheit:** Abschirmen vor Zuschauern schützt die Würde und schafft einen geschützten Raum. (Beruhigung passt auch: weniger Reize, weniger Unruhe.)',
          BER: '**Beruhigung** passt: weniger Reize, weniger Unruhe. Meist wird Abschirmen der **Sicherheit** zugeordnet – es schützt die Würde.'
        },
        tipp: 'Wovor wird die betroffene Person geschützt?' },
      { nummer: 2,
        text: 'Sie sprechen langsam, leise und in kurzen Sätzen.',
        richtig: 'BER',
        erklaerung: '**Beruhigung:** Eine ruhige Stimme überträgt sich auf das Gegenüber und senkt die Erregung.',
        tipp: 'Was bewirkt eine ruhige Stimme beim Gegenüber?' },
      { nummer: 3,
        text: 'Sie bitten den aufgeregten Ehemann: „Bitte öffnen Sie dem Rettungsdienst die Haustür.“',
        richtig: 'WIRK',
        erklaerung: '**Selbstwirksamkeit:** Eine kleine, klare Aufgabe gibt das Gefühl, etwas tun zu können – das wirkt gegen Hilflosigkeit.',
        tipp: 'Was erlebt der Ehemann, wenn er eine Aufgabe hat?' },
      { nummer: 4,
        text: 'Eine Kollegin ruft die Tochter an, damit sie in die Klinik kommen kann.',
        richtig: 'VERB',
        erklaerung: '**Verbundenheit:** Vertraute Menschen geben Halt. Angehörige informieren und einbeziehen.',
        tipp: 'Wer wird hier zusammengebracht?' },
      { nummer: 5,
        text: '„Der Notarzt ist in fünf Minuten hier.“',
        richtig: ['HOFF', 'SICH'],
        erklaerung: {
          HOFF: '**Hoffnung:** Eine ehrliche, realistische Aussicht („Hilfe ist unterwegs“) gibt Zuversicht. Keine leeren Versprechen wie „Das wird schon wieder“. (Sicherheit passt auch.)',
          SICH: '**Sicherheit** passt: Die Information zeigt, dass Hilfe organisiert ist. Häufig wird sie der **Hoffnung** zugeordnet – sie gibt eine realistische Aussicht.'
        },
        tipp: 'Was gibt dieser Satz der betroffenen Person für die nächsten Minuten?' },
      { nummer: 6,
        text: 'Sie räumen die Glasscherben weg, bevor sich jemand verletzt.',
        richtig: 'SICH',
        erklaerung: '**Sicherheit:** Gefahren beseitigen – für Betroffene und Helfende – kommt zuerst.',
        tipp: 'Was wird hier verhindert?' },
      { nummer: 7,
        text: 'Sie sagen zur erstarrten Kollegin: „Sabine, hol bitte den Notfallkoffer aus dem Dienstzimmer.“',
        richtig: 'WIRK',
        erklaerung: '**Selbst- und kollektive Wirksamkeit:** Eine kurze, klare Aufgabe mit Namen holt die Kollegin aus der Erstarrung. Das Team handelt gemeinsam.',
        tipp: 'Was passiert mit der Kollegin, wenn sie eine klare Aufgabe bekommt?' },
      { nummer: 8,
        text: 'Sie atmen mit der Bewohnerin gemeinsam langsam ein und aus.',
        richtig: 'BER',
        erklaerung: '**Beruhigung:** Langsames Atmen dämpft die Alarmreaktion des Körpers.',
        tipp: 'Was bewirkt langsames Atmen im Körper?' },
      { nummer: 9,
        text: 'Sie sorgen dafür, dass das Kind nach dem Notfall bei seiner Mutter bleiben kann.',
        richtig: 'VERB',
        erklaerung: '**Verbundenheit:** In einer Krise sind vertraute Menschen die wichtigste Stütze – besonders für Kinder.',
        tipp: 'Wer gibt dem Kind Halt?' },
      { nummer: 10,
        text: 'Sie fragen die Bewohnerin: „Möchten Sie sich lieber hinsetzen oder hier stehen bleiben?“',
        richtig: 'WIRK',
        erklaerung: '**Selbstwirksamkeit:** Eine Wahl lassen gibt ein Stück Kontrolle zurück.',
        tipp: 'Wer entscheidet hier?' },
      { nummer: 11,
        text: '„Ich bleibe bei Ihnen.“',
        richtig: ['SICH', 'BER'],
        erklaerung: {
          SICH: '**Sicherheit:** Nicht allein gelassen zu werden gibt Halt. (Beruhigung passt auch.)',
          BER: '**Beruhigung** passt. Meist wird der Satz der **Sicherheit** zugeordnet: Die Person ist nicht allein.'
        },
        tipp: 'Was fürchten Menschen im Notfall oft am meisten?' },
      { nummer: 12,
        text: 'Nach dem Notfall setzt sich das Team zusammen und spricht über das Erlebte.',
        richtig: ['VERB', 'WIRK'],
        erklaerung: {
          VERB: '**Verbundenheit:** Gemeinsam darüber sprechen zeigt: Ich bin damit nicht allein. (Kollektive Wirksamkeit passt auch.)',
          WIRK: '**Kollektive Wirksamkeit** passt: Das Team stärkt sich gemeinsam. Meist wird das Gespräch der **Verbundenheit** zugeordnet.'
        },
        tipp: 'Was erlebt jede und jeder Einzelne in diesem Gespräch?' },
      { nummer: 13,
        text: 'Ein Bewohner ist gestürzt und blutet stark am Unterarm. Sie drücken fest auf die Wunde.',
        richtig: 'SICH',
        erklaerung: '**Sicherheit:** Auch Ihre medizinischen Maßnahmen lassen sich zuordnen – die Blutstillung wendet eine Gefahr ab. Sagen Sie dabei, was Sie tun („Ich drücke auf die Wunde, damit die Blutung aufhört.“). Das beruhigt zusätzlich.',
        tipp: 'Auch medizinische Maßnahmen gehören dazu. Was wird hier abgewendet?' },
      { nummer: 14,
        text: 'Sie versorgen einen gestürzten Bewohner und bitten ihn: „Halten Sie bitte mit Ihrer freien Hand die Kompresse fest.“',
        richtig: 'WIRK',
        erklaerung: '**Selbstwirksamkeit:** Auch der Verletzte selbst kann eine kleine, machbare Aufgabe bekommen. Er erlebt: „Ich kann etwas tun.“ Das gibt ihm ein Stück Kontrolle zurück.',
        tipp: 'Wer wird hier selbst aktiv?' }
    ],
    merksatz: 'Psychologische Erste Hilfe soll **Sicherheit geben, Stress verringern und Kontrolle zurückgeben**. Sie ersetzt keine Therapie. Die fünf Wirkprinzipien nach Hobfoll et al.: **Sicherheit** (Gefahr beseitigen, abschirmen, nicht allein lassen) · **Beruhigung** (ruhig sprechen, Reize verringern) · **Selbst- und kollektive Wirksamkeit** (kleine, klare Aufgaben, eine Wahl lassen) · **Verbundenheit** (vertraute Menschen einbeziehen) · **Hoffnung** (ehrliche, realistische Zuversicht).',
    danach: 'Bearbeiten Sie jetzt **Aufgabe 1 „Was hätte geholfen?“** auf dem Arbeitsblatt!'
  },

  ab2c: {
    ab: 'Psychologische Erste Hilfe',
    raum: 'ab2',
    titel: 'Übung 2: Antwort-Check – was fehlt?',
    anweisung: 'Prüfen Sie diese Antworten: Passt die Antwort zum **Operator** und ist sie **in Ordnung** – oder fehlt etwas?',
    knoepfe: [
      { kuerzel: 'OK', text: '✓ in Ordnung' },
      { kuerzel: 'KNAPP', text: 'nur genannt – zu knapp' },
      { kuerzel: 'BEGR', text: 'Begründung fehlt' },
      { kuerzel: 'FALL', text: 'Fallbezug fehlt' }
    ],
    hilfe: {
      titel: 'Hilfe: Was verlangen die Operatoren?',
      punkte: [
        '**nennen:** aufzählen, ohne Erklärung',
        '**beschreiben:** konkret darstellen – Wer? Was? Wie?',
        '**erklären:** Ursache → Wirkung herleiten',
        '**analysieren:** Ursachen und Zusammenhänge herausarbeiten',
        '**beurteilen:** prüfen und ein begründetes Urteil fällen',
        'Fast immer verlangt: **Bezug zum Fall**'
      ]
    },
    mindestens: 6,
    karten: [
      { nummer: 1,
        text: '**Aufgabe:** „Beschreiben Sie konkret zwei Maßnahmen, mit denen Sie Frau Kern stabilisieren.“ **Antwort:** „Beruhigen. Abschirmen.“',
        richtig: 'KNAPP',
        erklaerung: '**Nur genannt.** „Beschreiben“ verlangt: Wer macht was, wie, mit welchem Ziel? Zum Beispiel: „Ich spreche Frau Kern mit Namen an und sage ruhig: ‚Der Notarzt ist unterwegs.‘ Dann bitte ich sie, die Hand ihres Vaters zu halten.“',
        tipp: 'Wie viele Wörter hat die Antwort – und was verlangt „beschreiben“?' },
      { nummer: 2,
        text: '**Aufgabe:** „Beurteilen Sie, ob Christin Unterstützung braucht.“ **Antwort:** „Ja, Christin braucht Unterstützung.“',
        richtig: 'BEGR',
        erklaerung: '**Begründung fehlt.** „Beurteilen“ heißt: prüfen und das Urteil begründen – z. B.: Christin träumt noch im nächsten Schulblock häufig von dem Tag und wacht kaltschweißig auf. Die Beschwerden halten also an – deshalb …',
        tipp: 'Woran kann die Leserin erkennen, warum das Urteil stimmt?' },
      { nummer: 3,
        text: '**Aufgabe:** „Identifizieren Sie vier Unterstützungsbedarfe der Angehörigen von Frau Maler.“ **Antwort:** „Ehrliche Information, was passiert ist · eine feste Ansprechperson mit Telefonnummer · wissen, in welche Klinik Frau Maler gebracht wurde · jemand, der ihre Sorgen anhört.“',
        richtig: 'OK',
        erklaerung: '**In Ordnung:** vier Bedarfe, passend zum Fall. Bei „identifizieren“ reicht es, die Bedarfe treffend zu benennen.',
        tipp: 'Zählen Sie nach und prüfen Sie, ob alles zum Fall passt.' },
      { nummer: 4,
        text: '**Aufgabe:** „Ordnen Sie zwei Ihrer Maßnahmen jeweils einem Wirkprinzip nach Hobfoll et al. zu.“ **Antwort:** „Sicherheit und Hoffnung.“',
        richtig: 'KNAPP',
        erklaerung: '**Zu knapp:** Nur die Wirkprinzipien sind genannt – die **Maßnahmen** fehlen. Richtig wäre z. B.: „Ich bitte die Zuschauer, den Raum zu verlassen → Sicherheit.“',
        tipp: 'Was soll eigentlich zugeordnet werden?' },
      { nummer: 5,
        text: '**Aufgabe:** „Erklären Sie, warum Christin im Notfall nicht handeln konnte.“ **Antwort:** „Weil Stress im Notfall normal ist.“',
        richtig: ['BEGR', 'KNAPP'],
        erklaerung: {
          BEGR: '**Die Erklärung fehlt.** „Erklären“ heißt: Ursache → Wirkung herleiten. Zum Beispiel: Der plötzliche Notfall löst eine Alarmreaktion aus, der Sympathikus schüttet Stresshormone aus. Der Blick verengt sich und Christin erstarrt.',
          KNAPP: '**Zu knapp** stimmt auch: Es fehlt die Kette Ursache → Wirkung (Notfall → Sympathikus und Stresshormone → Tunnelblick, Erstarren).'
        },
        tipp: 'Wird erklärt, WIE der Stress zum Erstarren führt?' },
      { nummer: 6,
        text: '**Aufgabe:** „Beschreiben Sie eine mögliche emotionale Belastung von Frau Kern.“ **Antwort:** „Angehörige haben im Notfall oft Angst und fühlen sich hilflos.“',
        richtig: 'FALL',
        erklaerung: '**Fallbezug fehlt.** Die Antwort passt auf jeden Notfall. Besser: „Frau Kern hat Todesangst um ihren Vater, der plötzlich keine Luft bekommt – und kann selbst nichts tun.“',
        tipp: 'Kommen Frau Kern und ihre Situation in der Antwort vor?' },
      { nummer: 7,
        text: '**Aufgabe:** „Analysieren Sie das Verhalten der Pflegefachkraft, die während der Reanimation schrie, indem Sie zwei mögliche Ursachen beschreiben.“ **Antwort:** „Sie stand unter starkem Stress: Der Sympathikus schaltet auf Alarm, ihr Blick verengt sich, sie gibt laute, hektische Kommandos. Außerdem musste sie allein handeln, weil die Kollegin erstarrt war und die Schülerinnen unerfahren sind.“',
        richtig: 'OK',
        erklaerung: '**In Ordnung:** zwei Ursachen, beide beschrieben und auf den Fall bezogen.',
        tipp: 'Zählen Sie die Ursachen und prüfen Sie den Fallbezug.' },
      { nummer: 8,
        text: '**Aufgabe:** „Beurteilen Sie die Aussage: ‚Wer im Notfall erstarrt, ist für den Pflegeberuf nicht geeignet.‘“ **Antwort:** „Die Aussage trifft nicht zu. Erstarren ist eine normale Stressreaktion, die auch Erfahrene trifft – im Fall war auch eine examinierte Pflegefachkraft überfordert. Mit Training, klaren Anweisungen und Nachbesprechungen gewinnt man Sicherheit.“',
        richtig: 'OK',
        erklaerung: '**In Ordnung:** klares Urteil, begründet und mit Beleg aus dem Fall.',
        tipp: 'Gibt es ein Urteil, eine Begründung und einen Fallbezug?' }
    ],
    merksatz: '**nennen** = aufzählen · **beschreiben** = konkret darstellen (Wer? Was? Wie?) · **erklären** = Ursache → Wirkung · **analysieren** = Ursachen und Zusammenhänge herausarbeiten · **beurteilen** = prüfen und begründet urteilen. Fast immer verlangt: **Fallbezug**.',
    danach: 'Prüfen Sie mit diesen Regeln jetzt noch einmal Ihre Antworten auf beiden Arbeitsblättern!'
  },

  /* ========================================================================
     Woche 4 · AB „Informationen geben in Krisen“ (raum 'ab3')
     ======================================================================== */

  ab3a: {
    ab: 'Informationen geben in Krisen',
    raum: 'ab3',
    // Wer die Übung löst (nicht durchklickt), darf zur Belohnung „Notfall-Run!“ spielen.
    // Die Bestleistung erscheint auf der Lehrerseite neben dem Namen. false = kein Spiel.
    belohnungsspiel: true,
    titel: 'Übung: Hilfreich oder ungünstig?',
    anweisung: 'Das sagen oder tun Pflegende bei Angehörigen in einer Krise. Ist das **hilfreich**? Oder gegen welche **Regel** verstößt es?',
    knoepfe: [
      { kuerzel: 'OK', text: 'hilfreich' },
      { kuerzel: 'VIEL', text: 'zu viel auf einmal' },
      { kuerzel: 'FACH', text: 'Fachbegriffe' },
      { kuerzel: 'SCHW', text: 'Schweigen nicht ausgehalten' },
      { kuerzel: 'FRAGE', text: 'geschlossene Frage' },
      { kuerzel: 'EHRL', text: 'nicht ehrlich' }
    ],
    hilfe: {
      titel: 'Hilfe: die sechs Regeln',
      punkte: [
        '**1 Informationen dosieren:** kleine Einheiten, kurze Sätze, das Wichtigste zuerst',
        '**2 Einfache Sprache:** keine Fachbegriffe, keine Abkürzungen',
        '**3 Schweigen aushalten:** nach einer schweren Information eine Pause machen',
        '**4 Verständnis prüfen:** offen fragen – nicht „Haben Sie das verstanden?“',
        '**5 Ehrlich bleiben:** nichts versprechen, nicht spekulieren',
        '**6 Wiederholen und aufschreiben:** Telefonnummer und Namen aufschreiben'
      ]
    },
    mindestens: 7,
    karten: [
      { nummer: 1,
        text: 'Zum Sohn: „Ihr Vater hatte eine Hypoglykämie mit Vigilanzminderung. Wir haben ihm i. v. Glukose gegeben.“',
        richtig: 'FACH',
        erklaerung: '**Fachbegriffe:** „Hypoglykämie“, „Vigilanzminderung“ und „i. v.“ versteht der Sohn wahrscheinlich nicht. Besser: „Ihr Vater hatte sehr wenig Zucker im Blut und war kaum wach. Wir haben ihm Zucker über die Vene gegeben.“',
        tipp: 'Würde jemand ohne Pflegeausbildung jedes Wort verstehen?' },
      { nummer: 2,
        text: 'Zur Tochter: „Ich erzähle Ihnen jetzt Schritt für Schritt, was passiert ist.“',
        richtig: 'OK',
        erklaerung: '**Hilfreich (Regel 1):** Die Pflegekraft kündigt an, dass sie in kleinen Schritten erzählt. So kann sich die Tochter vorbereiten.',
        tipp: 'Verstößt dieser Satz gegen eine Regel – oder hilft er beim Dosieren?' },
      { nummer: 3,
        text: 'Zur Ehefrau: „Ihr Mann wird ganz sicher wieder gesund. Machen Sie sich keine Sorgen.“',
        richtig: 'EHRL',
        erklaerung: '**Nicht ehrlich:** Das ist ein Versprechen, das niemand halten kann. Falsche Hoffnung zerstört später das Vertrauen.',
        tipp: 'Kann die Pflegekraft das wirklich wissen?' },
      { nummer: 4,
        text: 'Die Pflegekraft hat eine schwere Nachricht überbracht. Die Tochter weint leise. Die Pflegekraft sagt sofort: „So, dann besprechen wir noch die Wäsche und die Besuchszeiten.“',
        richtig: 'SCHW',
        erklaerung: '**Schweigen nicht ausgehalten:** Nach einer schweren Nachricht braucht die Tochter Zeit. Besser: ruhig sitzen bleiben, warten – und dann: „Ich bin da. Nehmen Sie sich Zeit.“ Organisatorisches kommt später.',
        tipp: 'Was braucht die Tochter in diesem Moment?' },
      { nummer: 5,
        text: 'Zum Sohn: „Was haben Sie bis jetzt verstanden?“',
        richtig: 'OK',
        erklaerung: '**Hilfreich (Regel 4):** Eine offene Frage. Der Sohn muss in eigenen Worten antworten – so merkt die Pflegekraft, was angekommen ist.',
        tipp: 'Kann man auf diese Frage nur mit „Ja“ oder „Nein“ antworten?' },
      { nummer: 6,
        text: 'Zur Ehefrau: „Er ist gestürzt, die Hüfte ist wohl gebrochen, er wird heute noch operiert, danach kommt er auf die Intensivstation, bringen Sie bitte die Versichertenkarte mit, Besuchszeit ist von 14 bis 18 Uhr …“',
        richtig: 'VIEL',
        erklaerung: '**Zu viel auf einmal:** Im Schock kann die Ehefrau so viele Informationen nicht aufnehmen. Besser: kurze Sätze, das Wichtigste zuerst, dann eine Pause und das Verständnis prüfen.',
        tipp: 'Wie viele Informationen stecken in diesem einen Satz?' },
      { nummer: 7,
        text: 'Zur Tochter: „Das weiß ich leider nicht. Die Ärztin kann Ihnen das heute Nachmittag sagen.“',
        richtig: 'OK',
        erklaerung: '**Hilfreich (Regel 5):** Die Pflegekraft ist ehrlich und sagt, wer die Antwort geben kann. Sie spekuliert nicht.',
        tipp: 'Ist es schlimm, wenn eine Pflegekraft etwas nicht weiß?' },
      { nummer: 8,
        text: 'Zum Sohn: „Haben Sie alles verstanden? Gut, dann können Sie jetzt zu ihm.“',
        richtig: 'FRAGE',
        erklaerung: '**Geschlossene Frage:** Auf „Haben Sie alles verstanden?“ sagen fast alle „Ja“ – auch wenn sie wenig verstanden haben. Besser: „Was ist für Sie jetzt am wichtigsten?“',
        tipp: 'Welche Antwort gibt fast jeder auf diese Frage?' },
      { nummer: 9,
        text: 'Zur Tochter: „Das war bestimmt ein Herzinfarkt. So etwas habe ich schon oft gesehen.“',
        richtig: 'EHRL',
        erklaerung: '**Nicht ehrlich (spekuliert):** Die Pflegekraft vermutet eine Diagnose. Die Diagnose stellt die Ärztin oder der Arzt. Eine falsche Vermutung kann später viel Unruhe und Misstrauen auslösen.',
        tipp: 'Weiß die Pflegekraft das sicher – oder vermutet sie nur?' },
      { nummer: 10,
        text: 'Nach der schweren Nachricht bleibt die Pflegekraft ruhig sitzen und schaut den Ehemann an. Nach einer Weile sagt sie leise: „Ich bin da. Nehmen Sie sich Zeit.“',
        richtig: 'OK',
        erklaerung: '**Hilfreich (Regel 3):** Die Pflegekraft hält das Schweigen aus und bleibt zugewandt. Der Ehemann bekommt Zeit, die Nachricht zu verarbeiten.',
        tipp: 'Was macht die Pflegekraft in der Pause?' }
    ],
    merksatz: 'Informationen geben in Krisen: **dosieren** · **einfache Sprache** · **Schweigen aushalten** · **Verständnis offen prüfen** · **ehrlich bleiben** · **Wichtiges wiederholen und aufschreiben**.',
    danach: 'Prüfen Sie mit diesen Regeln noch einmal Ihre Reihenfolge in Aufgabe 2 auf dem Arbeitsblatt!'
  },

  /* ========================================================================
     TB 2 NEU AB KW 49 · Woche 1 (raum 'kb2w1')
     „Psychosoziale Unterstützung im Notfall“ und „Gesprächshemmer im Notfall vermeiden“
     Beide Übungen sind „Für die Schnellen“ (freiwillig) – das Papier allein bereitet auf die KA vor.
     Begriffe nach Pflegias (Bd. 2, Kap. 1.2.3; Bd. 1, S. 272, Tab. 1).
     ======================================================================== */

  kb2ab02: {
    ab: 'Psychosoziale Unterstützung im Notfall',
    raum: 'kb2w1',
    titel: 'Übung: Hilft das – oder nicht?',
    anweisung: 'Frau Maler um 11 Uhr: Sie hat Luftnot und große Angst. Christin wartet mit ihr auf die Pflegefachkraft. Hilft das, was Christin sagt oder tut?',
    knoepfe: [
      { kuerzel: 'H', text: 'hilft' },
      { kuerzel: 'N', text: 'hilft nicht' }
    ],
    hilfe: {
      titel: 'Hilfe: Was gehört zur psychosozialen Unterstützung?',
      punkte: [
        'sich vorstellen · nicht allein lassen · Zuspruch geben · vor Zuschauern abschirmen',
        'Körperkontakt – **nur wenn gewünscht** · aktiv zuhören · Hilfsangebote machen',
        'Pflegende selbst: tief durchatmen, nicht rennen, sicher auftreten, Hilfe nachfordern'
      ]
    },
    mindestens: 8,
    karten: [
      { nummer: 1, text: '„Frau Maler, ich bin Christin, die Pflegeschülerin. Ich bleibe bei Ihnen.“', richtig: 'H',
        erklaerung: '**Hilft:** Christin **stellt sich vor** und sagt, dass sie Frau Maler **nicht allein lässt**. Das gibt Sicherheit.',
        tipp: 'Weiß Frau Maler jetzt, wer bei ihr ist?' },
      { nummer: 2, text: 'Christin rennt aus dem Zimmer, um selbst die Pflegefachkraft zu suchen. Frau Maler bleibt allein.', richtig: 'N',
        erklaerung: '**Hilft nicht:** Frau Maler darf **nicht allein gelassen** werden. Besser: Klingel oder Notruf nutzen und im Zimmer bleiben.',
        tipp: 'Wie fühlt sich Frau Maler, wenn sie plötzlich allein ist?' },
      { nummer: 3, text: '„Die Pflegefachkraft ist gleich da. Ich sage Ihnen, was wir als Nächstes machen.“', richtig: 'H',
        erklaerung: '**Hilft:** **Zuspruch** – Christin macht Mut und erklärt, was passiert. Information verringert Angst.',
        tipp: 'Macht dieser Satz Mut?' },
      { nummer: 4, text: 'Die Zimmertür steht offen. Besucher bleiben auf dem Flur stehen und schauen. Christin schließt die Tür.', richtig: 'H',
        erklaerung: '**Hilft:** Christin **schirmt vor Zuschauern ab**. Neugierige Blicke sind für Betroffene unangenehm.',
        tipp: 'Möchten Sie in so einer Lage angestarrt werden?' },
      { nummer: 5, text: 'Christin hält Frau Malers Hand fest, obwohl Frau Maler die Hand wegzieht.', richtig: 'N',
        erklaerung: '**Hilft nicht:** Körperkontakt **nur, wenn gewünscht** – und respektvoll. Besser fragen: „Darf ich Ihre Hand halten?“',
        tipp: 'Was zeigt Frau Maler, wenn sie die Hand wegzieht?' },
      { nummer: 6, text: '„Keine Angst, Sie haben gar nichts. Sie sind nur aufgeregt.“', richtig: 'N',
        erklaerung: '**Hilft nicht:** Das ist nicht ehrlich und **spielt die Lage herunter**. Frau Maler hat Warnzeichen. Ehrlicher Zuspruch: „Hilfe ist unterwegs. Ich bleibe bei Ihnen.“',
        tipp: 'Stimmt dieser Satz? Fühlt sich Frau Maler ernst genommen?' },
      { nummer: 7, text: 'Frau Maler sagt: „Ich habe solche Angst.“ Christin: „Sie haben Angst. Ich bin da. Was spüren Sie gerade?“', richtig: 'H',
        erklaerung: '**Hilft:** Christin **hört aktiv zu** – sie wiederholt, was Frau Maler fühlt, und fragt nach.',
        tipp: 'Nimmt Christin die Angst ernst?' },
      { nummer: 8, text: '„Soll ich Ihre Tochter anrufen lassen?“', richtig: 'H',
        erklaerung: '**Hilft:** Ein **Hilfsangebot**. Frau Maler darf selbst entscheiden – das gibt ihr ein Stück Kontrolle zurück.',
        tipp: 'Was bietet Christin hier an?' },
      { nummer: 9, text: 'Christin atmet einmal tief durch, bevor sie ins Zimmer geht. Dann spricht sie ruhig und langsam.', richtig: 'H',
        erklaerung: '**Hilft:** Pflegende **sammeln sich innerlich** und **strahlen Ruhe aus**. Das überträgt sich auf Frau Maler.',
        tipp: 'Wie wirkt eine ruhige Pflegekraft auf eine ängstliche Patientin?' },
      { nummer: 10, text: 'Christin sagt laut und hektisch: „Oh Gott, was mache ich denn jetzt?“', richtig: 'N',
        erklaerung: '**Hilft nicht:** Hektik und Panik übertragen sich. Angst kann die Atemnot sogar verstärken. Besser: durchatmen, **sicher auftreten**, Hilfe holen.',
        tipp: 'Fühlt sich Frau Maler danach sicherer?' }
    ],
    merksatz: '**Psychosoziale Unterstützung im Notfall:** sich **vorstellen** · **nicht allein lassen** · **Zuspruch** geben · vor **Zuschauern abschirmen** · **Körperkontakt nur, wenn gewünscht** · **aktiv zuhören** · **Hilfsangebote** machen. Pflegende selbst: tief **durchatmen**, nicht rennen, **sicher auftreten**, rechtzeitig **Hilfe nachfordern**.',
    danach: 'Prüfen Sie jetzt noch einmal Ihre Abschlussaufgabe auf dem Arbeitsblatt!'
  },

  kb2ab03: {
    ab: 'Gesprächshemmer im Notfall vermeiden',
    raum: 'kb2w1',
    titel: 'Übung: Förderer oder Hemmer?',
    anweisung: 'Christin erzählt am Tag nach dem Notfall von ihren Albträumen. Fördert die Reaktion das Gespräch – oder hemmt sie es? In der Erklärung steht der genaue Begriff.',
    knoepfe: [
      { kuerzel: 'F', text: 'Gesprächsförderer' },
      { kuerzel: 'H', text: 'Gesprächshemmer' }
    ],
    hilfe: {
      titel: 'Hilfe: die Begriffe aus Pflegias',
      punkte: [
        '**Förderer:** Zuhören · Ich-Botschaften senden · Paraphrasieren und Respekt zeigen · Rückfragen · Fokussierung · Feedback',
        '**Hemmer:** Unterbrechen · Du-Botschaften senden · Eigene Erfahrungen und Ratschläge in den Vordergrund stellen · Bewerten statt akzeptieren · Unkonzentriertheit · Herunterspielen'
      ]
    },
    mindestens: 8,
    karten: [
      { nummer: 1, text: '„Ich merke, dass dich das sehr beschäftigt.“', richtig: 'F',
        erklaerung: '**Förderer: Ich-Botschaft senden.** Die Kollegin spricht von sich und von dem, was sie wahrnimmt – ohne Vorwurf.', tipp: 'Spricht die Kollegin von sich oder über Christin?' },
      { nummer: 2, text: '„Ach komm, anderen geht es viel schlechter.“', richtig: 'H',
        erklaerung: '**Hemmer: Herunterspielen.** Christins Belastung wird klein gemacht. Sie fühlt sich nicht ernst genommen.', tipp: 'Wird Christins Gefühl ernst genommen?' },
      { nummer: 3, text: '„Du sagst, du hast seitdem Albträume?“', richtig: 'F',
        erklaerung: '**Förderer: Paraphrasieren und Respekt zeigen** (auch Rückfrage). Die Kollegin wiederholt mit eigenen Worten und zeigt: Ich habe dich verstanden.', tipp: 'Was macht die Kollegin mit dem, was Christin gesagt hat?' },
      { nummer: 4, text: 'Während Christin erzählt, verdreht eine Kollegin die Augen.', richtig: 'H',
        erklaerung: '**Hemmer: Unterbrechen** – hier ohne Worte (nonverbal). Augenverdrehen zeigt Desinteresse und Ablehnung.', tipp: 'Man kann auch ohne Worte unterbrechen.' },
      { nummer: 5, text: '„Was war für dich am schlimmsten?“', richtig: 'F',
        erklaerung: '**Förderer: Rückfragen.** Nachhaken bei wichtigen Aussagen zeigt Interesse und hilft Christin, weiterzuerzählen.', tipp: 'Darf Christin weitererzählen?' },
      { nummer: 6, text: '„Du bist einfach zu empfindlich.“', richtig: 'H',
        erklaerung: '**Hemmer: Du-Botschaft senden** (und **Bewerten statt akzeptieren**). Das klingt nach Vorwurf – Christin wird sich zurückziehen.', tipp: 'Wie fühlt sich Christin nach diesem Satz?' },
      { nummer: 7, text: 'Der Praxisanleiter legt sein Handy weg, setzt sich zu Christin und schaut sie an.', richtig: 'F',
        erklaerung: '**Förderer: Fokussierung.** Er ist ganz bei Christin und ihrer Aussage.', tipp: 'Wo ist seine Aufmerksamkeit?' },
      { nummer: 8, text: '„Ich an deiner Stelle würde einfach nicht mehr daran denken.“', richtig: 'H',
        erklaerung: '**Hemmer: Eigene Erfahrungen und Ratschläge in den Vordergrund stellen.** Lösungen sollen aus der Person selbst kommen, nicht von außen.', tipp: 'Wessen Lösung steht hier im Vordergrund?' },
      { nummer: 9, text: 'Zu Frau Maler um 11 Uhr: „Ich sehe, dass Sie sehr schnell atmen. Ich bleibe bei Ihnen.“', richtig: 'F',
        erklaerung: '**Förderer: Feedback** (wertschätzend rückmelden, was man wahrnimmt) und Ich-Botschaft.', tipp: 'Sagt Christin, was sie wahrnimmt?' },
      { nummer: 10, text: 'Während Christin erzählt, telefoniert die Stationsleitung nebenbei.', richtig: 'H',
        erklaerung: '**Hemmer: Unkonzentriertheit.** Nebenbei andere Dinge erledigen zeigt: Du bist mir nicht wichtig.', tipp: 'Ist die Stationsleitung ganz bei Christin?' }
    ],
    merksatz: '**Gesprächsförderer:** Zuhören · Ich-Botschaften · Paraphrasieren und Respekt zeigen · Rückfragen · Fokussierung · Feedback. **Gesprächshemmer:** Unterbrechen · Du-Botschaften · Eigene Erfahrungen und Ratschläge in den Vordergrund stellen · Bewerten statt akzeptieren · Unkonzentriertheit · Herunterspielen. Nach einem Notfall sind Menschen verletzlich – Hemmer verstärken Angst, Scham und Schuldgefühle.',
    danach: 'Prüfen Sie jetzt noch einmal Ihre Sätze in Aufgabe 2 auf dem Arbeitsblatt: Welche Förderer haben Sie genutzt?'
  },
  /* ========================================================================
     TB 2 neu · Woche 2 · Angehörige im Notfall informieren – Schweigepflicht
     ======================================================================== */
  kb2ab04: {
    ab: 'Angehörige im Notfall informieren – Schweigepflicht',
    raum: 'kb2w2',
    titel: 'Übung: Darf ich das sagen?',
    anweisung: 'Jemand möchte etwas über eine Bewohnerin oder einen Bewohner wissen. Ist die Auskunft **erlaubt** oder **nicht erlaubt**?',
    knoepfe: [
      { kuerzel: 'J', text: 'Auskunft erlaubt' },
      { kuerzel: 'N', text: 'nicht erlaubt' }
    ],
    mindestens: 8,
    karten: [
      { nummer: 1, text: 'Der Notarzt fragt nach den Vorerkrankungen und Medikamenten.', richtig: 'J',
        erklaerung: '**Erlaubt:** Der Notarzt ist an der Behandlung beteiligt und braucht die Informationen.', tipp: 'Ist die Person an der Behandlung beteiligt?' },
      { nummer: 2, text: 'Eine Mitbewohnerin fragt, warum Frau Maler ins Krankenhaus gekommen ist.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Mitbewohner sind nicht beteiligt. Freundlich bleiben, aber nichts sagen und nichts andeuten.', tipp: 'Gilt die Schweigepflicht auch gegenüber Mitbewohnern?' },
      { nummer: 3, text: 'Die Tochter ruft an. In der Dokumentation ist sie als Bevollmächtigte eingetragen. Sie rufen unter der Nummer aus der Akte zurück.', richtig: 'J',
        erklaerung: '**Erlaubt:** Die Bevollmächtigte vertritt die Bewohnerin. Durch den Rückruf wissen Sie sicher, wer am Telefon ist.', tipp: 'Wer vertritt die Bewohnerin?' },
      { nummer: 4, text: 'Der Nachbar eines Bewohners fragt im Garten nach dessen Diagnose.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Nachbarn und Bekannte bekommen keine Auskunft.', tipp: 'Hat der Bewohner zugestimmt?' },
      { nummer: 5, text: 'Eine Kollegin aus einem anderen Wohnbereich fragt in der Pause neugierig nach dem Notfall.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Die Schweigepflicht gilt auch gegenüber Kolleginnen, die nicht an der Pflege beteiligt sind.', tipp: 'Ist die Kollegin an der Pflege beteiligt?' },
      { nummer: 6, text: 'Ein wacher, orientierter Bewohner sagt: „Sie dürfen meiner Frau alles sagen.“ Seine Frau fragt nach.', richtig: 'J',
        erklaerung: '**Erlaubt:** Der Bewohner hat Sie von der Schweigepflicht entbunden. Das wird dokumentiert – am besten schriftlich.', tipp: 'Wer darf von der Schweigepflicht entbinden?' },
      { nummer: 7, text: 'Ein Mann ruft an: „Ich bin der Sohn.“ Er steht nicht in der Dokumentation, die Bewohnerin ist bewusstlos.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Keine Entbindung, und Sie wissen nicht sicher, wer anruft. Auch Kinder brauchen die Zustimmung.', tipp: 'Steht er in der Dokumentation?' },
      { nummer: 8, text: 'Der Ehemann einer Bewohnerin fragt. Eine Zustimmung ist nicht dokumentiert.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Sogar Ehepartner brauchen die Zustimmung. Fragen Sie die Bewohnerin selbst, wenn sie entscheiden kann.', tipp: 'Gilt die Schweigepflicht auch gegenüber dem Ehepartner?' },
      { nummer: 9, text: 'Im Bus erzählen Sie einer Freundin vom Notfall – mit dem Namen der Bewohnerin.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Nicht in der Öffentlichkeit über Bewohner sprechen (Datenschutz, Schweigepflicht).', tipp: 'Wer hört im Bus alles mit?' },
      { nummer: 10, text: 'Eine Bewohnerin ist gestorben. Ihre Freundin fragt nach der Todesursache.', richtig: 'N',
        erklaerung: '**Nicht erlaubt:** Die Schweigepflicht gilt **auch nach dem Tod**.', tipp: 'Endet die Schweigepflicht mit dem Tod?' }
    ],
    merksatz: 'Die **Schweigepflicht** (§ 203 StGB) gilt gegenüber **allen, die nicht beteiligt sind** – auch gegenüber **Angehörigen**, **Ehepartnern**, **Mitbewohnern** und **nicht beteiligten Kolleginnen**, und **auch nach dem Tod**. Auskunft bekommen **Beteiligte** (Notarzt, Klinik), **Bevollmächtigte/Betreuer** und Personen, für die die Person die **Schweigepflicht aufgehoben** hat. Am Telefon im Zweifel **zurückrufen**.',
    danach: 'Prüfen Sie jetzt noch einmal Aufgabe 1 auf dem Arbeitsblatt!'
  },

  /* ========================================================================
     TB 2 neu · Woche 2 · Schlechte Nachrichten überbringen (SPIKES)
     ======================================================================== */
  kb2ab05: {
    ab: 'Schlechte Nachrichten überbringen',
    raum: 'kb2w2',
    titel: 'Übung: Welcher SPIKES-Schritt?',
    anweisung: 'Sätze und Handlungen aus Telefonaten mit Angehörigen. Zu welchem Schritt des **SPIKES-Schemas** gehören sie? (Setting = Rahmen · Perception = Wissensstand · Invitation = Einladung · Knowledge = Wissen · Emotions = Gefühle · Strategy and Summary = Plan und Zusammenfassung)',
    knoepfe: [
      { kuerzel: 'SET', text: 'S – Setting' },
      { kuerzel: 'P', text: 'P – Perception' },
      { kuerzel: 'I', text: 'I – Invitation' },
      { kuerzel: 'K', text: 'K – Knowledge' },
      { kuerzel: 'E', text: 'E – Emotions' },
      { kuerzel: 'STR', text: 'S – Strategy' }
    ],
    mindestens: 7,
    karten: [
      { nummer: 1, text: 'Sie gehen für das Telefonat in einen ruhigen Raum und legen die Akte bereit.', richtig: 'SET',
        erklaerung: '**Setting:** Den Rahmen vorbereiten – ruhig, ungestört, Unterlagen bereit.', tipp: 'Passiert das vor oder während der Nachricht?' },
      { nummer: 2, text: '„Haben Sie gerade einen Moment Zeit zum Sprechen?“', richtig: 'SET',
        erklaerung: '**Setting:** Klären, ob die Person gerade sprechen kann.', tipp: 'Geht es schon um die Nachricht?' },
      { nummer: 3, text: '„Was hat man Ihnen heute schon erzählt?“', richtig: 'P',
        erklaerung: '**Perception:** Erfragen, was die Person schon weiß.', tipp: 'Sie fragen nach dem Wissen der Angehörigen.' },
      { nummer: 4, text: '„Ich muss Ihnen leider etwas Ernstes sagen.“', richtig: 'I',
        erklaerung: '**Invitation:** Vorwarnen – die Person kann sich innerlich vorbereiten.', tipp: 'Kommt die Nachricht schon – oder wird sie angekündigt?' },
      { nummer: 5, text: '„Möchten Sie, dass ich Ihnen alles genau erkläre?“', richtig: 'I',
        erklaerung: '**Invitation:** Klären, wie viel die Person wissen möchte.', tipp: 'Sie fragen nach dem Wunsch, informiert zu werden.' },
      { nummer: 6, text: '„Ihr Vater ist heute Morgen im Bad gestürzt. Er ist jetzt im Krankenhaus.“', richtig: 'K',
        erklaerung: '**Knowledge:** Die Nachricht in kleinen Schritten und mit einfachen Worten.', tipp: 'Hier kommt die eigentliche Information.' },
      { nummer: 7, text: 'Sie machen eine Pause und fragen: „Konnten Sie mir folgen?“', richtig: 'K',
        erklaerung: '**Knowledge:** Pausen machen und prüfen, ob alles verstanden wurde.', tipp: 'Geht es um das Verstehen der Information?' },
      { nummer: 8, text: '„Das ist ein großer Schreck für Sie.“', richtig: 'E',
        erklaerung: '**Emotions:** Das Gefühl wahrnehmen und ansprechen.', tipp: 'Worum geht es: Fakten oder Gefühle?' },
      { nummer: 9, text: 'Die Tochter weint. Sie sagen nichts und warten.', richtig: 'E',
        erklaerung: '**Emotions:** Schweigen und Weinen aushalten.', tipp: 'Was braucht die Tochter gerade?' },
      { nummer: 10, text: '„Ich gebe Ihnen die Nummer der Station und rufe Sie heute Abend noch einmal an.“', richtig: 'STR',
        erklaerung: '**Strategy and Summary:** nächste Schritte, Ansprechperson, Rückruf.', tipp: 'Wie geht es nach dem Gespräch weiter?' }
    ],
    merksatz: '**SPIKES:** **S**etting – Rahmen vorbereiten, vorstellen, Zeit klären · **P**erception – was weiß die Person schon? · **I**nvitation – vorwarnen, wie viel möchte sie wissen? · **K**nowledge – in kleinen Schritten, einfache, eindeutige Worte, Pausen · **E**motions – Gefühle ansprechen, Schweigen aushalten · **S**trategy and Summary – zusammenfassen, nächste Schritte, Rückruf, dokumentieren.',
    danach: 'Prüfen Sie jetzt noch einmal Aufgabe 1 auf dem Arbeitsblatt!'
  },

  /* ========================================================================
     BELOHNUNGSSPIEL „Notfall-Run!“ (spiel.html) – Endless Runner aus „Diabetes Run!“, neu gestaltet für Notfallsituationen
     ======================================================================== */

  spiel: {
    titel: 'KBS Notfall-Run!',
    // 'nacht' = Nachtdienst (dunkler Himmel, Mond, Sterne) · 'tag' = bei Tag
    tageszeit: 'nacht',
    logoAlt: 'Logo der Schule',
    // {titel} = Titel der Übung ohne „Übung:“
    gesperrt: 'Das Spiel ist eine Belohnung: Lösen Sie zuerst die Übung „{titel}“.',
    zurUebungKnopf: 'Zur Übung',
    unbekannt: 'Bitte scannen Sie den QR-Code auf Ihrem Arbeitsblatt.',
    zurueckZurUebung: '← Zurück zur Übung',

    los: 'Los geht’s!',
    nochmal: 'Nochmal',
    zurueckZumStart: 'Zum Startbildschirm',
    // {x} wird durch die Punktzahl ersetzt
    bestleistung: 'Ihre Bestleistung: {x}',
    punkte: 'Punkte: {x}',
    neueBestleistung: 'Neue Bestleistung!',
    gameOver: 'Game over',
    pausiert: 'Pause – tippen Sie hier, um weiterzuspielen.',

    steuerungHandy: 'Tippen Sie unten auf „⬆ Springen“ oder „⬇ Ducken“. In der Luft noch einmal springen = Doppelsprung.',
    steuerungTastatur: 'Tastatur: Leertaste oder Pfeil hoch = springen, Pfeil runter = ducken.',
    spielidee: 'Nachtdienst! Die Hohenloher Pflegekraft eilt zu einem Notfall – doch unterwegs liegt einiges im Weg. Notfallkoffer, Defi-Koffer, Leitkegel, Notfallwagen und Schlaglöcher überspringen. Bei Rauch ducken – Rauch steigt nach oben! Und für den Rettungswagen braucht es einen Doppelsprung. Ab 30 Sekunden geht’s erst richtig los!',
    knopfDucken: '⬇ Ducken',
    knopfSpringen: '⬆ Springen',

    // Statuszeile: Bestleistung auf der Lehrerseite (Beamer)
    statusHinweis: '📡 Ihre Bestleistung erscheint auf dem Beamer neben Ihrem Namen.',
    statusGesendet: '📡 Ihre Bestleistung steht auf dem Beamer neben Ihrem Namen.',
    statusWartet: '📡 Ihre Bestleistung wird übertragen, sobald das Internet wieder geht.',
    statusNichtAufListe: '📡 Ihr Name steht gerade nicht auf der Liste der Lehrkraft. Öffnen Sie die Übung noch einmal, dann klappt es.',

    // Nach jedem „Game over“ erscheint zufällig einer dieser Sätze (Wiederholung der sechs Regeln).
    schonGewusstUeberschrift: 'Schon gewusst?',
    schonGewusst: [
      'Im Schock nehmen Menschen nur wenig auf. Viele erinnern sich später nur an den ersten Satz.',
      'Fachwörter verunsichern zusätzlich: „Wiederbelebung“ statt „Reanimation“.',
      'Nach einer schweren Nachricht: Pause machen, zugewandt bleiben – „Ich bin da. Nehmen Sie sich Zeit.“',
      'Auf „Haben Sie das verstanden?“ sagen fast alle „Ja“. Besser: „Was haben Sie verstanden?“',
      'Ehrlich bleiben: „Das weiß ich nicht. Die Ärztin oder der Arzt kann Ihnen das sagen.“',
      'Im Stress vergisst man viel: Telefonnummer und Namen aufschreiben.'
    ]
  }
};

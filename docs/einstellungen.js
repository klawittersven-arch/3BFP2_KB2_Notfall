/* ==========================================================================
   EINSTELLUNGEN – Fortschrittsanzeige für den Beamer
   ==========================================================================

   serverAdresse: die Adresse des Cloudflare-Workers, z. B.
     'https://kb2-notfall-fortschritt.klawittersven.workers.dev'
   (Sie sehen sie im Cloudflare-Dashboard unter Workers & Pages → kb2-notfall-fortschritt.)

   Steht hier '', funktionieren die Übungen ganz normal – nur ohne
   Namenseingabe und ohne Fortschrittsanzeige.

   klassen: Die SuS wählen beim Start ihre Klasse. Jede Klasse hat eigene Lehrerseiten
   (lehrer-3bfp2-1-ab1.html usw.). Das Kürzel (k1, k2) nicht ändern.
   ========================================================================== */

var EINSTELLUNGEN = {
  serverAdresse: 'https://kb2-notfall-fortschritt.klawittersven.workers.dev',

  klassen: [
    { kuerzel: 'k1', name: '3BFP2/1' },
    { kuerzel: 'k2', name: '3BFP2/2' }
  ],

  // So oft (in Sekunden) holt die Lehrerseite den neuen Stand.
  aktualisierenSekunden: 5,

  // Fall-Einführung „Zeitlupe“: So oft (in Sekunden) fragt jedes Handy nach, welcher Schritt dran ist.
  // Kleiner = die Handys folgen schneller, aber mehr Anfragen an den Worker (bei 25 SuS und 3 s:
  // rund 22 500 Anfragen in 45 Minuten – im kostenlosen Cloudflare-Tarif sind 100 000 pro Tag frei).
  fallAbfrageSekunden: 3,

  // Gegen Durchklicken (Kartenstapel, seit 26.11.2026 – wie in der ILS-App):
  // herzen: so viele Fehler pro Durchgang; ist das letzte Herz weg, kommt eine Lesepause und die Übung
  // beginnt neu (mit neu gemischten Karten). Die Lehrerseite zeigt das als ↺ beim Namen. 0 = ohne Herzen.
  herzen: 3,
  // So viele Karten hintereinander beim ersten Versuch richtig geben ein Herz zurück (0 = nie).
  herzZurueckNach: 5,
  // Lesepause in Sekunden, wenn alle Herzen weg sind.
  leerePauseSekunden: 20,
  // Lesezeit: Wer unmöglich schnell tippt, bekommt eine Warnung (zählt nicht); wer schnell und falsch
  // tippt, verliert ein Herz und bekommt eine Warnung. Nach 3 Warnungen kurze Lesepause (Sekunden).
  // Richtige Antworten zählen immer. false = ausgeschaltet.
  lesezeit: true,
  langsamPauseSekunden: 15,

  // Namen mit diesen Wortteilen werden abgelehnt (nur Kleinbuchstaben).
  sperrwoerter: [
    'arsch', 'fick', 'fotze', 'hure', 'nutte', 'wichs', 'schlampe', 'bitch',
    'fuck', 'shit', 'scheis', 'kacke', 'pisse', 'penis', 'pimmel', 'schwanz',
    'muschi', 'vagina', 'titte', 'porn', 'sex', 'nazi', 'hitler',
    'neger', 'nigg', 'kanake', 'zigeuner', 'schwuchtel', 'spast', 'mongo',
    'behindert', 'missgeburt', 'bastard', 'wixer', 'wixxer', 'opfer',
    'dick', 'cock', 'pussy', 'slut', 'whore', 'cunt', 'kill'
  ]
};

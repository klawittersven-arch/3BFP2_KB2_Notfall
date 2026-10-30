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

  // Gegen Durchklicken:
  // Nach einer falschen Antwort sind die Knöpfe dieser Karte so viele Sekunden gesperrt
  // (der Tipp soll gelesen werden). 0 = keine Sperre.
  sperreNachFehlerSekunden: 5,
  // Wer so viele falsche Antworten innerhalb so vieler Sekunden gibt, muss die Übung neu beginnen.
  // Die Lehrerseite zeigt das als ↺ beim Namen. fehler: 0 = ausgeschaltet.
  zuSchnell: { fehler: 3, sekunden: 10 },

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

/* Programmlogik der Handy-Übungen (Kartenstapel mit Herzen) und der Challenges.
 * Alle Texte der Übungen stehen in inhalte.js. Die Standardtexte für Herzen, Lesepause, Sterne, Bonus-Fall und
 * Challenge stehen unten in TEXTE; sie lassen sich in inhalte.js unter „allgemein“ mit demselben Namen überschreiben.
 *
 * Übung (<body data-uebung="kb2ab03">)
 *   – eine Karte nach der anderen, je Handy zufällig gemischt, ohne Muster (nie streng im Wechsel, nie nach Knöpfen
 *     sortiert, nie mehr als 3 gleiche Antworten hintereinander); beim Neuladen gleich, „Noch einmal üben“ mischt neu
 *   – Herzen (einstellungen.js: herzen, Standard 3): jeder Fehler kostet ein Herz; sind alle weg: Lesepause, dann
 *     beginnt die Übung neu (die Lehrerseite zeigt ↺). Serie: 5 Karten in Folge beim ersten Versuch richtig = 1 Herz zurück
 *   – Lesezeit (wie in der ILS-App): unmöglich schnell = zählt nicht, Warnung; schnell und falsch = Fehler und Warnung;
 *     nach 3 Warnungen kurze Lesepause. Richtige Antworten zählen immer.
 *   – Sterne am Ende: ★★★ ohne Fehler, ★★ mit 1–2 Fehlern, ★ geschafft (die beste Wertung geht an die Lehrerseite)
 *   – optional je Übung: aufwaermen (Reihenfolge antippen), schritt2 je Karte (Grund oder bessere Antwort wählen),
 *     bonus (Bonus-Fall nach dem Merksatz, ohne Herzen)
 * Challenge (<body data-modus="challenge" data-raum="kb2w1" data-quellen="kb2w1" data-anzahl="15">)
 *   – Karten aus allen Übungen einer Woche (data-quellen: mehrere Wochen = ganzer Themenblock), ein Versuch je Karte,
 *     100 Punkte je richtige Karte + Zeitbonus; das Ergebnis geht an die Bestenliste der Lehrerseite. */
(function () {
  'use strict';

  var A = INHALTE.allgemein || {};
  var E = window.EINSTELLUNGEN || {};
  var B = document.body;
  var CHALLENGE = B.getAttribute('data-modus') === 'challenge';
  var PRAEFIX = 'kb2-notfall-';   // eigener Speicher je Übung
  var GEMEINSAM = 'kb2-notfall-'; // Name, Klasse und Geräte-Kennung (gemeinsam mit den KB-I-Übungen)
  var RAUM_CH = B.getAttribute('data-raum') || '';
  var id = CHALLENGE ? 'challenge-' + RAUM_CH : B.getAttribute('data-uebung');
  var SPEICHER = PRAEFIX + id;
  var REIHENFOLGE = SPEICHER + '-reihenfolge';
  var GELOEST = PRAEFIX + 'geloest';
  var STERNE = PRAEFIX + 'sterne';
  var NAME = GEMEINSAM + 'name';
  var KLASSE = GEMEINSAM + 'klasse';
  var GERAET = GEMEINSAM + 'geraet';
  var NEUSTARTS = SPEICHER + '-neustarts';
  var SERVER = String(E.serverAdresse || '').replace(/\/+$/, '');
  var KLASSEN = E.klassen || [];
  var HERZEN = typeof E.herzen === 'number' ? Math.max(0, Math.floor(E.herzen)) : 3; // 0 = ohne Herzen
  var SERIE_HERZ = typeof E.herzZurueckNach === 'number' ? Math.max(0, Math.floor(E.herzZurueckNach)) : 5;
  var LEER_MS = 1000 * (typeof E.leerePauseSekunden === 'number' ? Math.max(0, E.leerePauseSekunden) : 20);
  var LANGSAM_MS = 1000 * (typeof E.langsamPauseSekunden === 'number' ? Math.max(0, E.langsamPauseSekunden) : 15);
  var LESEZEIT = E.lesezeit !== false;
  var SPERRE_MS = 1500;          // nach einem Fehler: kurz den Tipp lesen
  var CH_ANZEIGE_MS = 900;       // Challenge: so lange bleibt die Rückmeldung stehen

  var TEXTE = {
    karteVon: 'von {y}',
    weiterKnopf: 'Weiter',
    herzenLabel: '{x} von {y} Herzen',
    serieText: '🔥 {x}',
    herzZurueck: '🔥 {x} richtig in Folge – Sie bekommen ein Herz zurück!',
    langsam: 'Langsam! Lesen Sie zuerst die ganze Karte.',
    zuSchnellFalsch: 'Das ging zu schnell – lesen Sie jede Karte in Ruhe.',
    leerTitel: 'Keine Herzen mehr',
    leerText: 'Lesen Sie den Infotext auf Ihrem Arbeitsblatt noch einmal. Danach beginnt die Übung neu – mit neu gemischten Karten.',
    langsamTitel: 'Kurze Lesepause',
    langsamText: 'Sie haben mehrmals zu schnell getippt. Atmen Sie kurz durch – danach geht es weiter.',
    pauseNoch: 'Noch {x} Sekunden',
    sterneTitel: 'Ihre Wertung',
    sterneText: ['', 'Geschafft! Mit weniger Fehlern gibt es mehr Sterne.', 'Gut gemacht – nur wenige Fehler!', 'Perfekt – ganz ohne Fehler!'],
    sterneBest: 'Ihre beste Wertung: {x}',
    nochEinmalSterne: 'Noch einmal üben – für mehr Sterne',
    aufwaermenKnopf: 'Los geht’s mit den Karten',
    aufwaermenFalsch: 'Noch nicht. ',
    bonusKnopf: '⭐ Bonus-Fall: {x}',
    bonusHinweis: 'Freiwillig – ohne Herzen und ohne Punkte.',
    bonusGeschafft: '✓ Bonus-Fall geschafft',
    bonusZurueck: 'Zurück zur Zusammenfassung',
    bonusSchritt: 'Schritt {x} von {y}',
    challengeTitel: 'Alle Übungen dieser Woche geschafft!',
    challengeText: 'Jetzt können Sie in der **Wochen-Challenge** Punkte sammeln – die Besten werden in der nächsten Stunde geehrt.',
    challengeKnopf: '🏆 Zur Wochen-Challenge',
    chRegeln: '**{x} Karten** aus allen Übungen · **ein Versuch** je Karte · **100 Punkte** je richtige Karte · **Zeitbonus** bis 500 Punkte (je schneller, desto mehr – aber nur für richtige Antworten). Die Lösungen sehen Sie am Ende.',
    chStart: '▶ Challenge starten',
    chGesperrt: 'Die Wochen-Challenge öffnet sich, wenn Sie alle Übungen dieser Woche geschafft haben:',
    chKarte: 'Karte {x} von {y}',
    chErgebnis: '{x} Punkte',
    chRichtig: '{x} von {y} richtig · Zeit: {z}',
    chBest: 'Ihre Bestleistung: {x} Punkte',
    chFehlerTitel: 'Das war noch nicht richtig:',
    chAlleRichtig: 'Alle Karten richtig – stark!',
    chRichtigWaere: 'Richtig: {x}',
    chNochmal: '↻ Noch eine Runde (neue Karten)',
    chGesendet: 'Ihr Ergebnis steht in der Bestenliste Ihrer Klasse.',
    chDatenschutz: 'Für die Bestenliste werden Ihr Name, Ihre Klasse und Ihre Punkte bis zu 10 Tage gespeichert.'
  };
  function t(k) { return A[k] !== undefined ? A[k] : TEXTE[k]; }

  // ---------- Hilfsfunktionen ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(s) { // **fett** → <strong>, *kursiv* → <em>
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  }
  function ersetze(s, w) {
    return String(s).replace(/\{(\w)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; });
  }
  function richtigeListe(k) { return Array.isArray(k.richtig) ? k.richtig : [k.richtig]; }
  function erklaerungFuer(k, kuerzel) {
    if (k.erklaerung && typeof k.erklaerung === 'object') return k.erklaerung[kuerzel] || '';
    return k.erklaerung || '';
  }
  function lade(schluessel, art) {
    try { var s = (art || window.sessionStorage).getItem(schluessel); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function speichere(schluessel, wert, art) {
    try { (art || window.sessionStorage).setItem(schluessel, JSON.stringify(wert)); } catch (e) { /* ohne Speicher geht es auch */ }
  }
  function lokal() { try { return window.localStorage; } catch (e) { return null; } }
  function klasseName(kuerzel) {
    var k = KLASSEN.filter(function (x) { return x.kuerzel === kuerzel; })[0];
    return k ? k.name : null;
  }
  function zufallsZahl(n) { // 0 … n-1
    try { var a = new Uint32Array(1); window.crypto.getRandomValues(a); return a[0] % n; } catch (e) { return Math.floor(Math.random() * n); }
  }
  function mischeListe(liste) {
    var r = liste.slice();
    for (var i = r.length - 1; i > 0; i--) { var j = zufallsZahl(i + 1), x = r[i]; r[i] = r[j]; r[j] = x; }
    return r;
  }
  function folge(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  function woerter(s) { return String(s || '').replace(/\*/g, '').split(/\s+/).filter(Boolean).length; }
  function sterneText(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆'; return s; }
  function uhr(sek) { sek = Math.max(0, Math.round(sek)); return Math.floor(sek / 60) + ':' + ('0' + (sek % 60)).slice(-2); }

  // Name: „Vorname X.“ – nur nötig, wenn in einstellungen.js eine serverAdresse steht.
  function normalisiereName(roh) {
    var t2 = String(roh || '').replace(/\s+/g, ' ').trim();
    var m = t2.match(/^(.+) (\S)[^ ]*$/); // „Lena Kraus“ wird zu „Lena K.“
    if (!m) return null;
    var vor = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    var name = vor + ' ' + m[2].toUpperCase() + '.';
    if (name.length > 24 || !/^\p{L}[\p{L}' -]*\p{L} \p{L}\.$/u.test(name)) return null;
    var flach = name.toLowerCase().replace(/[^\p{L}]/gu, '');
    var sperr = (E.sperrwoerter || []).some(function (w) { return flach.indexOf(w) >= 0; });
    return sperr ? null : name;
  }
  function geraetId() {
    var l = lokal(), g = null;
    try { g = l && l.getItem(GERAET); } catch (e) { g = null; }
    if (g && /^[a-f0-9]{16,64}$/.test(g)) return g;
    var b = new Uint8Array(16);
    try { window.crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
    g = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    try { if (l) l.setItem(GERAET, g); } catch (e) { /* egal */ }
    return g;
  }
  function gespeichert(schluessel) { var l = lokal(); try { return l ? l.getItem(schluessel) : null; } catch (e) { return null; } }
  var name = SERVER ? normalisiereName(gespeichert(NAME)) : null;
  var klasse = SERVER ? gespeichert(KLASSE) : null;
  if (!klasseName(klasse)) klasse = null;

  // ---------- Seitenaufbau (gemeinsam) ----------
  var kartenBox = document.getElementById('karten');
  var endeBox = document.getElementById('merksatz-bereich');
  var nochEinmal = document.getElementById('noch-einmal');
  var nameBereich = document.getElementById('name-bereich');
  var nameZeile = document.getElementById('name-zeile');
  var uebungTeil = document.getElementById('uebung-teil');
  var leiste = document.querySelector('.fortschritt');
  var herzEl = document.createElement('span');
  herzEl.className = 'herzen';
  herzEl.id = 'herzen';
  leiste.appendChild(herzEl);
  var meldungEl = document.createElement('div');
  meldungEl.className = 'meldung';
  meldungEl.id = 'meldung';
  meldungEl.setAttribute('role', 'status');
  meldungEl.hidden = true;
  uebungTeil.insertBefore(meldungEl, document.getElementById('anweisung'));
  var meldungTimer = null;
  function melde(text, art) {
    meldungEl.textContent = text;
    meldungEl.className = 'meldung' + (art ? ' meldung-' + art : '');
    meldungEl.hidden = false;
    if (meldungTimer) clearTimeout(meldungTimer);
    meldungTimer = setTimeout(function () { meldungEl.hidden = true; }, 3200);
  }

  if (CHALLENGE) { challenge(); return; }

  /* ====================================================================================
     ÜBUNG: Kartenstapel mit Herzen
     ==================================================================================== */
  var U = INHALTE[id];
  var KARTEN = U.karten.map(function (k) { return { k: k, knoepfe: U.knoepfe }; });
  var N = KARTEN.length;

  // ---------- Reihenfolge der Karten (je Handy zufällig, ohne Antwortmuster) ----------
  function antwortFolge(r) { return r.map(function (i) { return richtigeListe(KARTEN[i].k)[0]; }); }
  function auffaellig(r) {
    var kz = U.knoepfe.map(function (b) { return b.kuerzel; });
    var f = antwortFolge(r), p = kz.length, periodisch = f.length > p, sortiert = true, verschieden = false, lauf = 1;
    for (var i = 1; i < f.length; i++) {
      if (i >= p && f[i] !== f[i - p]) periodisch = false;
      if (kz.indexOf(f[i]) < kz.indexOf(f[i - 1])) sortiert = false;
      if (f[i] !== f[0]) verschieden = true;
      lauf = f[i] === f[i - 1] ? lauf + 1 : 1;
      if (lauf > 3) return true;          // nie mehr als 3 gleiche Antworten hintereinander
    }
    return verschieden && (periodisch || sortiert);
  }
  function mische() {
    var r, versuche = 0;
    do { r = mischeListe(folge(N)); } while (auffaellig(r) && ++versuche < 80);
    return r;
  }
  function gueltigeReihenfolge(r) {
    if (!Array.isArray(r) || r.length !== N) return false;
    var gesehen = {};
    return r.every(function (i) {
      if (typeof i !== 'number' || i < 0 || i >= N || gesehen[i]) return false;
      gesehen[i] = true;
      return true;
    });
  }
  var reihenfolge = lade(REIHENFOLGE);
  if (!gueltigeReihenfolge(reihenfolge)) { reihenfolge = mische(); speichere(REIHENFOLGE, reihenfolge); }

  // ---------- Zustand eines Durchgangs ----------
  function neuerDurchgang() {
    return {
      karten: KARTEN.map(function (c) {
        var s2 = c.k.schritt2;
        return { geloest: false, falsch: [], gewaehlt: null, s2: false, falsch2: [],
          opt: s2 ? mischeListe(folge(s2.optionen.length)) : null };
      }),
      herzen: HERZEN, serie: 0, fehler: 0, warnungen: 0, pause: null, pos: 0, weiter: false,
      aufw: !U.aufwaermen, aufwFolge: U.aufwaermen ? mischeListe(folge(U.aufwaermen.schritte.length)) : null, aufwPos: 0,
      bonus: null
    };
  }
  var z = lade(SPEICHER);
  if (!z || !Array.isArray(z.karten) || z.karten.length !== N || typeof z.herzen !== 'number') z = neuerDurchgang();
  var neustarts = Math.min(99, Math.max(0, Number(gespeichert(NEUSTARTS)) || 0));
  function sichern() { speichere(SPEICHER, z); }

  function anzahlGeloest() { return z.karten.filter(function (k) { return k.geloest; }).length; }
  function anzahlErsterVersuch() {
    return z.karten.filter(function (k) { return k.geloest && !k.falsch.length && !k.falsch2.length; }).length;
  }
  function alleGeloest() { return anzahlGeloest() === N; }
  function aktuelleKarte() { return reihenfolge[Math.min(z.pos, N - 1)]; }
  function naechstePosition() {
    for (var s = 1; s <= N; s++) { var p = (z.pos + s) % N; if (!z.karten[reihenfolge[p]].geloest) return p; }
    return z.pos;
  }
  function sterneFuer(fehler) { return fehler === 0 ? 3 : (fehler <= 2 ? 2 : 1); }
  function besteSterne() { var l = lokal(); var s = l ? (lade(STERNE, l) || {}) : {}; return Number(s[id]) || 0; }

  // ---------- Fortschritt an die Lehrerseite ----------
  var wiederholung = null;
  function sende() {
    if (!SERVER || !name || !klasse || !U.raum) return;
    var daten = {
      raum: klasse + '-' + U.raum, uebung: id, geraet: geraetId(), name: name,
      geloest: anzahlGeloest(), gesamt: N, erster: anzahlErsterVersuch(), neu: neustarts,
      // je Karte die zuerst gewählte falsche Antwort, z. B. "2-D" (für die Besprechung am Beamer)
      falsch: z.karten.map(function (k, i) {
        return k.falsch.length ? KARTEN[i].k.nummer + '-' + k.falsch[0] : '';
      }).filter(function (x) { return x; })
    };
    var s = besteSterne();
    if (s) daten.sterne = s;
    var ok = function (r) { if (!r.ok) throw new Error('Status ' + r.status); };
    try {
      fetch(SERVER + '/fortschritt', {
        method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(daten), keepalive: true
      }).then(ok).catch(spaeter);
    } catch (e) { spaeter(); }
  }
  function spaeter() { // ohne Verbindung: in 10 s noch einmal den aktuellen Stand senden
    if (wiederholung) return;
    wiederholung = setTimeout(function () { wiederholung = null; sende(); }, 10000);
  }

  // ---------- Kopf, Anweisung, Hilfe ----------
  document.title = U.titel + ' – ' + A.kopfzeile;
  document.getElementById('kopfzeile').textContent = A.kopfzeile + ' · ' + U.ab;
  document.getElementById('titel').textContent = U.titel;
  document.getElementById('anweisung').innerHTML = fmt(U.anweisung);
  nochEinmal.textContent = A.nochEinmal;
  if (U.vorspann) {
    var v = document.createElement('p');
    v.className = 'vorspann';
    v.innerHTML = fmt(U.vorspann);
    document.getElementById('hilfe-platz').appendChild(v);
  }
  if (U.hilfe) {
    var d = document.createElement('details');
    d.className = 'hilfe';
    d.innerHTML = '<summary>' + esc(U.hilfe.titel) + '</summary><ul>' +
      U.hilfe.punkte.map(function (p) { return '<li>' + fmt(p) + '</li>'; }).join('') + '</ul>';
    document.getElementById('hilfe-platz').appendChild(d);
  }

  // Lange Beschriftungen: Knöpfe auf schmalen Handys untereinander statt nebeneinander
  function knopfKlasse(knoepfe) {
    var laengste = Math.max.apply(null, knoepfe.map(function (b) { return b.text.length; }));
    var lang = (knoepfe.length >= 3 && laengste > 6) || laengste > 16;
    var zweiMalZwei = knoepfe.length === 4 && laengste <= 16;
    return 'knoepfe knoepfe-' + knoepfe.length + (zweiMalZwei ? ' knoepfe-2x2' : (lang ? ' knoepfe-lang' : ''));
  }

  // ---------- Lesezeit (Schutz gegen Durchklicken, wie in der ILS-App) ----------
  var start = Date.now(), startSchluessel = '';
  function merkeStart(schluessel) { if (schluessel !== startSchluessel) { startSchluessel = schluessel; start = Date.now(); } }
  function leseZeit(c, schritt) {
    if (schritt === 2) {
      var s2 = c.k.schritt2;
      return Math.min(6, 0.3 + 0.06 * (woerter(s2.frage) + s2.optionen.reduce(function (n, o) { return n + woerter(o); }, 0)));
    }
    return Math.min(6, 0.8 + 0.1 * (woerter(c.k.text) + c.knoepfe.reduce(function (n, b) { return n + woerter(b.text); }, 0)));
  }
  // 2 = unmöglich schnell (zählt nicht), 1 = schnell (vor Ablauf der Lesezeit), 0 = in Ordnung
  function tempo(c, schritt, wiederholt) {
    if (!LESEZEIT || wiederholt) return 0;
    var sek = (Date.now() - start) / 1000, lese = leseZeit(c, schritt);
    if (sek < 0.35 * lese) return 2;
    return sek < lese ? 1 : 0;
  }

  // ---------- Pausen ----------
  function pause(art, ms) { z.pause = { art: art, bis: Date.now() + ms }; }
  setInterval(function () {
    if (z.pause) zeichne();
  }, 500);

  // ---------- Antworten ----------
  var sperreBis = 0;
  function antworte(i, kuerzel) {
    var c = KARTEN[i], zk = z.karten[i];
    if (z.pause || zk.geloest || zk.s2 || Date.now() < sperreBis || zk.falsch.indexOf(kuerzel) >= 0) return;
    var tp = tempo(c, 1, zk.falsch.length > 0);
    if (tp === 2) { warnung(); return; }
    if (richtigeListe(c.k).indexOf(kuerzel) >= 0) {
      zk.gewaehlt = kuerzel;
      if (c.k.schritt2 && (!c.k.schritt2.nur || c.k.schritt2.nur.indexOf(kuerzel) >= 0)) {
        zk.s2 = true;           // zweiter Schritt: Grund bzw. bessere Antwort wählen
        sichern();
        zeichne();
        return;
      }
      loese(i);
    } else {
      zk.falsch.push(kuerzel);
      fehler(tp === 1);
    }
  }
  function antworte2(i, j) {
    var c = KARTEN[i], zk = z.karten[i];
    if (z.pause || zk.geloest || !zk.s2 || Date.now() < sperreBis || zk.falsch2.indexOf(j) >= 0) return;
    var tp = tempo(c, 2, zk.falsch2.length > 0);
    if (tp === 2) { warnung(); return; }
    if (j === c.k.schritt2.richtig) { loese(i); } else { zk.falsch2.push(j); fehler(tp === 1); }
  }
  function loese(i) {
    var zk = z.karten[i];
    zk.geloest = true;
    zk.s2 = false;
    if (!zk.falsch.length && !zk.falsch2.length) {
      z.serie++;
      if (SERIE_HERZ && z.serie >= SERIE_HERZ) {
        if (HERZEN && z.herzen < HERZEN) { z.herzen++; melde(ersetze(t('herzZurueck'), { x: SERIE_HERZ }), 'gut'); }
        z.serie = 0;
      }
    }
    z.weiter = true;
    sichern();
    zeichne();
    sende();
  }
  function fehler(zuSchnell) {
    z.fehler++;
    z.serie = 0;
    if (HERZEN) z.herzen = Math.max(0, z.herzen - 1);
    sperreBis = Date.now() + SPERRE_MS;
    setTimeout(zeichne, SPERRE_MS + 30);
    if (zuSchnell) { z.warnungen++; melde(t('zuSchnellFalsch'), 'warnung'); }
    if (HERZEN && z.herzen <= 0) {
      pause('leer', LEER_MS);
      neustarts = Math.min(99, neustarts + 1);
      var l = lokal();
      try { if (l) l.setItem(NEUSTARTS, String(neustarts)); } catch (e) { /* egal */ }
    } else if (z.warnungen >= 3) {
      pause('langsam', LANGSAM_MS);
      z.warnungen = 0;
    }
    sichern();
    zeichne();
    sende();
  }
  function warnung() { // unmöglich schnell: zählt nicht, aber nach 3 Warnungen kurze Lesepause
    z.warnungen++;
    melde(t('langsam'), 'warnung');
    if (z.warnungen >= 3) { pause('langsam', LANGSAM_MS); z.warnungen = 0; }
    sichern();
    zeichne();
  }
  function weiter() {
    z.weiter = false;
    if (!alleGeloest()) z.pos = naechstePosition();
    sichern();
    zeichne();
    zeigeKarte();
  }
  // Nach „Weiter“ die nächste Karte direkt unter der Fortschrittsleiste zeigen (die Anweisung steht darüber)
  function zeigeKarte() {
    var ziel = alleGeloest() ? 0 : kartenBox.getBoundingClientRect().top + window.pageYOffset - leiste.offsetHeight - 8;
    window.scrollTo(0, Math.max(0, ziel));
  }
  function neuerVersuch() {
    z = neuerDurchgang();
    reihenfolge = mische();
    speichere(REIHENFOLGE, reihenfolge);
    sichern();
    meldungEl.hidden = true;
    zeichne();
    sende();
    window.scrollTo(0, 0);
  }

  // ---------- Anzeige ----------
  function zeichneStatus() {
    var g = anzahlGeloest();
    document.getElementById('fortschritt-text').textContent = ersetze(A.fortschritt, { x: g, y: N });
    document.getElementById('fortschritt-balken').style.width = (100 * g / N) + '%';
    var h = '';
    if (HERZEN) {
      for (var i = 0; i < HERZEN; i++) h += '<span class="herz' + (i < z.herzen ? '' : ' herz-weg') + '">' + (i < z.herzen ? '❤️' : '🤍') + '</span>';
    }
    if (z.serie >= 2) h += '<span class="serie">' + esc(ersetze(t('serieText'), { x: z.serie })) + '</span>';
    herzEl.innerHTML = h;
    herzEl.setAttribute('aria-label', HERZEN ? ersetze(t('herzenLabel'), { x: z.herzen, y: HERZEN }) : '');
  }

  function zeichne() {
    zeichneStatus();
    if (z.pause) {
      if (Date.now() < z.pause.bis) { zeichnePause(); return; }
      var art = z.pause.art;
      z.pause = null;
      if (art === 'leer') { neuerVersuch(); return; }
      sichern();
    }
    // „Noch einmal üben“ nur am Ende – während des Durchgangs würde ein Fehltipp alles zurücksetzen
    nochEinmal.hidden = !(alleGeloest() && !z.weiter) || !!(z.bonus && z.bonus.aktiv);
    if (z.bonus && z.bonus.aktiv) { endeBox.hidden = true; zeichneBonus(); return; }
    if (!z.aufw) { endeBox.hidden = true; zeichneAufwaermen(); return; }
    if (alleGeloest() && !z.weiter) { kartenBox.innerHTML = ''; zeichneEnde(); return; }
    endeBox.hidden = true;
    endeBox.innerHTML = '';
    zeichneKarte();
  }

  function zeichnePause() {
    var leer = z.pause.art === 'leer';
    var sek = Math.ceil((z.pause.bis - Date.now()) / 1000);
    endeBox.hidden = true;
    nochEinmal.hidden = true;
    kartenBox.innerHTML = '<section class="pause' + (leer ? ' pause-leer' : '') + '" role="alert">' +
      '<p class="pause-symbol" aria-hidden="true">' + (leer ? '💔' : '⏸️') + '</p>' +
      '<h2>' + esc(t(leer ? 'leerTitel' : 'langsamTitel')) + '</h2>' +
      '<p>' + esc(t(leer ? 'leerText' : 'langsamText')) + '</p>' +
      '<p class="pause-zeit">' + esc(ersetze(t('pauseNoch'), { x: sek })) + '</p></section>';
  }

  function zeichneKarte() {
    var pos = Math.min(z.pos, N - 1), i = reihenfolge[pos], c = KARTEN[i], k = c.k, zk = z.karten[i];
    merkeStart(i + '-' + (zk.s2 ? 2 : 1));
    var gesperrt = Date.now() < sperreBis;
    var knoepfe = c.knoepfe.map(function (b) {
      var falsch = zk.falsch.indexOf(b.kuerzel) >= 0;
      var richtig = zk.gewaehlt === b.kuerzel && (zk.geloest || zk.s2);
      var aus = zk.geloest || zk.s2 || falsch || gesperrt;
      return '<button type="button" class="antwort' + (falsch ? ' ist-falsch' : '') + (richtig ? ' ist-richtig' : '') + '" data-kuerzel="' + esc(b.kuerzel) + '"' + (aus ? ' disabled' : '') + '>' +
        '<span class="symbol" aria-hidden="true">' + (falsch ? '✗' : (richtig ? '✓' : '')) + '</span><span class="beschriftung">' + esc(b.text) + '</span></button>';
    }).join('');
    var html = '<section class="karte' + (zk.geloest ? ' karte-richtig' : (zk.falsch.length || zk.falsch2.length ? ' karte-tipp' : '')) + '" data-index="' + i + '" aria-labelledby="k-text">' +
      '<p class="karte-kopf"><span class="nummer">' + (pos + 1) + '</span> ' + esc(ersetze(t('karteVon'), { y: N })) + '</p>' +
      '<p class="karte-text" id="k-text">' + fmt(k.text) + '</p>' +
      '<div class="' + knopfKlasse(c.knoepfe) + '" role="group" aria-label="Antwort zu Karte ' + (pos + 1) + '">' + knoepfe + '</div>';
    if (k.schritt2 && (zk.s2 || (zk.geloest && zk.gewaehlt && (!k.schritt2.nur || k.schritt2.nur.indexOf(zk.gewaehlt) >= 0)))) {
      var s2 = k.schritt2;
      if (zk.s2 && !zk.falsch2.length) html += '<p class="s1-ok"><span aria-hidden="true">✓</span> ' + esc(A.richtigText) + '</p>';
      html += '<div class="schritt2"><p class="schritt2-frage">' + fmt(s2.frage) + '</p><div class="optionen">' +
        zk.opt.map(function (j) {
          var falsch = zk.falsch2.indexOf(j) >= 0, richtig = zk.geloest && j === s2.richtig;
          var aus = zk.geloest || falsch || gesperrt;
          return '<button type="button" class="antwort option' + (falsch ? ' ist-falsch' : '') + (richtig ? ' ist-richtig' : '') + '" data-option="' + j + '"' + (aus ? ' disabled' : '') + '>' +
            '<span class="symbol" aria-hidden="true">' + (falsch ? '✗' : (richtig ? '✓' : '')) + '</span><span class="beschriftung">' + fmt(s2.optionen[j]) + '</span></button>';
        }).join('') + '</div></div>';
    }
    var rm = '';
    if (zk.geloest) {
      rm = '<div class="rueckmeldung richtig"><p class="rm-kopf"><span aria-hidden="true">✓</span> ' + esc(A.richtigText) + '</p><p>' + fmt(erklaerungFuer(k, zk.gewaehlt)) + '</p>' +
        (k.schritt2 && k.schritt2.erklaerung ? '<p>' + fmt(k.schritt2.erklaerung) + '</p>' : '') + '</div>';
    } else if (zk.s2 && zk.falsch2.length) {
      rm = '<div class="rueckmeldung falsch"><p class="rm-kopf"><span aria-hidden="true">✗</span> ' + esc(A.falschText) + '</p><p><strong>' + esc(A.tippVorwort) + '</strong> ' + fmt(k.schritt2.tipp || k.tipp) + '</p></div>';
    } else if (zk.falsch.length && !zk.s2) {
      rm = '<div class="rueckmeldung falsch"><p class="rm-kopf"><span aria-hidden="true">✗</span> ' + esc(A.falschText) + '</p><p><strong>' + esc(A.tippVorwort) + '</strong> ' + fmt(k.tipp) + '</p></div>';
    }
    html += rm;
    if (zk.geloest) html += '<button type="button" class="knopf weiter-knopf" id="weiter-knopf">' + esc(t('weiterKnopf')) + ' →</button>';
    html += '</section>';
    kartenBox.innerHTML = html;
    Array.prototype.forEach.call(kartenBox.querySelectorAll('.antwort[data-kuerzel]'), function (btn) {
      btn.addEventListener('click', function () { antworte(i, btn.getAttribute('data-kuerzel')); });
    });
    Array.prototype.forEach.call(kartenBox.querySelectorAll('.option'), function (btn) {
      btn.addEventListener('click', function () { antworte2(i, Number(btn.getAttribute('data-option'))); });
    });
    var w = document.getElementById('weiter-knopf');
    if (w) { w.addEventListener('click', weiter); try { w.focus({ preventScroll: true }); } catch (e) { /* egal */ } }
  }

  // ---------- Aufwärmen: Reihenfolge antippen (ohne Herzen) ----------
  var aufwHinweis = '';
  function zeichneAufwaermen() {
    var W = U.aufwaermen, n = W.schritte.length;
    var fertig = z.aufwPos >= n;
    var html = '<section class="karte aufwaermen" data-aufwaermen="1"><p class="karte-kopf">' + esc(W.titel) + '</p>' +
      '<p class="karte-text">' + fmt(W.anweisung) + '</p><ol class="reihe-fertig">' +
      W.schritte.slice(0, z.aufwPos).map(function (s) { return '<li>' + fmt(s) + '</li>'; }).join('') + '</ol>';
    if (!fertig) {
      html += '<div class="reihe-auswahl">' + z.aufwFolge.filter(function (j) { return j >= z.aufwPos; }).map(function (j) {
        return '<button type="button" class="antwort reihe-teil" data-schritt="' + j + '">' + fmt(W.schritte[j]) + '</button>';
      }).join('') + '</div>';
      if (aufwHinweis) html += '<div class="rueckmeldung falsch"><p>' + fmt(aufwHinweis) + '</p></div>';
    } else {
      html += '<div class="rueckmeldung richtig"><p class="rm-kopf"><span aria-hidden="true">✓</span> ' + esc(A.richtigText) + '</p><p>' + fmt(W.fertig || '') + '</p></div>' +
        '<button type="button" class="knopf weiter-knopf" id="aufw-los">' + esc(t('aufwaermenKnopf')) + ' →</button>';
    }
    kartenBox.innerHTML = html + '</section>';
    Array.prototype.forEach.call(kartenBox.querySelectorAll('.reihe-teil'), function (btn) {
      btn.addEventListener('click', function () {
        var j = Number(btn.getAttribute('data-schritt'));
        if (j === z.aufwPos) { z.aufwPos++; aufwHinweis = ''; }
        else { aufwHinweis = t('aufwaermenFalsch') + (W.tipp || ''); btn.classList.add('wackeln'); }
        sichern();
        if (j === z.aufwPos - 1) zeichne(); else setTimeout(zeichne, 350);
      });
    });
    var los = document.getElementById('aufw-los');
    if (los) los.addEventListener('click', function () { z.aufw = true; sichern(); zeichne(); zeigeKarte(); });
  }

  // ---------- Ende: Sterne, Zusammenfassung, Bonus, Challenge ----------
  function wocheGeschafft() {
    if (!/^kb[12]w[1-4]$/.test(U.raum || '')) return false;
    var l = lokal(); var geloest = l ? (lade(GELOEST, l) || {}) : {};
    return Object.keys(INHALTE).filter(function (k) { return INHALTE[k] && INHALTE[k].karten && INHALTE[k].raum === U.raum; })
      .every(function (k) { return geloest[k]; });
  }
  function zeichneEnde() {
    var erster = anzahlErsterVersuch();
    var s = sterneFuer(z.fehler);
    var l = lokal();
    if (!HERZEN && U.mindestens && erster < U.mindestens) { // ohne Herzen: alte Mindestzahl gegen Durchklicken
      endeBox.hidden = false;
      endeBox.className = 'durchklicken';
      endeBox.innerHTML = '<h2>' + esc(A.durchklickenTitel) + '</h2><p>' + esc(ersetze(A.durchklickenText, { x: erster, y: N, z: U.mindestens })) + '</p>' +
        '<button type="button" class="knopf" id="neu-start">' + esc(A.durchklickenKnopf) + '</button>';
      nochEinmal.hidden = true;
      document.getElementById('neu-start').addEventListener('click', neuerVersuch);
      return;
    }
    if (l) {
      var geloest = lade(GELOEST, l) || {};
      if (!geloest[id]) { geloest[id] = Date.now(); speichere(GELOEST, geloest, l); }
      var st = lade(STERNE, l) || {};
      if (!st[id] || s > st[id]) { st[id] = s; speichere(STERNE, st, l); sende(); }
      if (U.belohnungsspiel) { // schaltet spiel.html?ab=… für 12 Stunden frei
        var frei = lade(PRAEFIX + 'spiel-frei', l) || {};
        if (!frei[id]) { frei[id] = Date.now(); speichere(PRAEFIX + 'spiel-frei', frei, l); }
      }
    }
    var best = besteSterne();
    endeBox.hidden = false;
    endeBox.className = 'abschluss';
    endeBox.innerHTML =
      '<div class="weiter" role="status"><p class="weiter-titel"><span aria-hidden="true">✓</span> ' + esc(ersetze(A.fertigTitel, { x: U.titel.split(':')[0] })) + '</p>' +
      (U.danach ? '<p class="weiter-text">' + fmt(U.danach) + '</p>' : '') + '</div>' +
      (HERZEN ? '<div class="sterne-box"><p class="sterne-titel">' + esc(t('sterneTitel')) + '</p>' +
        '<p class="sterne" aria-label="' + s + ' von 3 Sternen">' + sterneText(s) + '</p>' +
        '<p class="sterne-text">' + esc(t('sterneText')[s]) + '</p>' +
        (best > s ? '<p class="sterne-best">' + esc(ersetze(t('sterneBest'), { x: sterneText(best) })) + '</p>' : '') + '</div>' : '') +
      '<div class="merksatz"><h2><span aria-hidden="true">📝</span> ' + esc(A.merksatzUeberschrift) + '</h2>' +
      '<p class="merksatz-text">' + fmt(U.merksatz) + '</p>' +
      '<p class="erster-versuch">' + esc(ersetze(A.ersterVersuch, { x: erster, y: N })) + '</p></div>' +
      (U.bonus ? '<div class="bonus-box">' +
        (z.bonus && z.bonus.fertig ? '<p class="bonus-fertig">' + esc(t('bonusGeschafft')) + '</p>' : '') +
        '<button type="button" class="knopf bonus-knopf" id="bonus-start">' + esc(ersetze(t('bonusKnopf'), { x: U.bonus.titel })) + '</button>' +
        '<p class="hinweis-klein">' + esc(t('bonusHinweis')) + '</p></div>' : '') +
      (U.belohnungsspiel ? '<div class="belohnung"><p>' + esc(A.spielText) + '</p>' +
        '<a class="knopf" id="spiel-start" href="spiel.html?ab=' + encodeURIComponent(id) + '">' + esc(A.spielKnopf) + '</a></div>' : '') +
      (wocheGeschafft() ? '<div class="challenge-box"><p class="challenge-titel">' + esc(t('challengeTitel')) + '</p><p>' + fmt(t('challengeText')) + '</p>' +
        '<a class="knopf" id="challenge-start" href="challenge-' + esc(U.raum) + '.html">' + esc(t('challengeKnopf')) + '</a></div>' : '');
    nochEinmal.textContent = HERZEN && s < 3 ? t('nochEinmalSterne') : A.nochEinmal;
    var b = document.getElementById('bonus-start');
    if (b) b.addEventListener('click', function () {
      z.bonus = { aktiv: true, schritt: 0, falsch: [], fertig: z.bonus && z.bonus.fertig, opt: mischeListe(folge(U.bonus.schritte[0].optionen.length)), geloest: false };
      sichern();
      zeichne();
      window.scrollTo(0, 0);
    });
  }

  // ---------- Bonus-Fall (ohne Herzen) ----------
  function zeichneBonus() {
    var F = U.bonus, bz = z.bonus, n = F.schritte.length;
    if (bz.schritt >= n) {
      kartenBox.innerHTML = '<section class="karte bonus"><p class="karte-kopf">⭐ ' + esc(F.titel) + '</p>' +
        '<div class="rueckmeldung richtig"><p class="rm-kopf">' + esc(t('bonusGeschafft')) + '</p><p>' + fmt(F.schluss || '') + '</p></div>' +
        '<button type="button" class="knopf weiter-knopf" id="bonus-zurueck">' + esc(t('bonusZurueck')) + '</button></section>';
      document.getElementById('bonus-zurueck').addEventListener('click', function () {
        z.bonus = { aktiv: false, fertig: true };
        sichern();
        zeichne();
        window.scrollTo(0, 0);
      });
      return;
    }
    var S = F.schritte[bz.schritt];
    var html = '<section class="karte bonus" data-bonus-schritt="' + bz.schritt + '"><p class="karte-kopf">⭐ ' + esc(F.titel) + ' · ' +
      esc(ersetze(t('bonusSchritt'), { x: bz.schritt + 1, y: n })) + '</p>' +
      (bz.schritt === 0 && F.einleitung ? '<p class="bonus-einleitung">' + fmt(F.einleitung) + '</p>' : '') +
      '<p class="karte-text">' + fmt(S.text) + '</p><p class="schritt2-frage">' + fmt(S.frage) + '</p><div class="optionen">' +
      bz.opt.map(function (j) {
        var o = S.optionen[j], falsch = bz.falsch.indexOf(j) >= 0, richtig = bz.geloest && o.richtig;
        return '<button type="button" class="antwort option' + (falsch ? ' ist-falsch' : '') + (richtig ? ' ist-richtig' : '') + '" data-bonus="' + j + '"' +
          (bz.geloest || falsch ? ' disabled' : '') + '><span class="symbol" aria-hidden="true">' + (falsch ? '✗' : (richtig ? '✓' : '')) + '</span><span class="beschriftung">' + fmt(o.text) + '</span></button>';
      }).join('') + '</div>';
    var letzte = bz.geloest ? S.optionen.filter(function (o) { return o.richtig; })[0] : (bz.falsch.length ? S.optionen[bz.falsch[bz.falsch.length - 1]] : null);
    if (letzte) html += '<div class="rueckmeldung ' + (bz.geloest ? 'richtig' : 'falsch') + '"><p>' + fmt(letzte.reaktion) + '</p></div>';
    if (bz.geloest) html += '<button type="button" class="knopf weiter-knopf" id="bonus-weiter">' + esc(t('weiterKnopf')) + ' →</button>';
    kartenBox.innerHTML = html + '</section>';
    Array.prototype.forEach.call(kartenBox.querySelectorAll('[data-bonus]'), function (btn) {
      btn.addEventListener('click', function () {
        var j = Number(btn.getAttribute('data-bonus'));
        if (S.optionen[j].richtig) bz.geloest = true; else bz.falsch.push(j);
        sichern();
        zeichne();
      });
    });
    var w = document.getElementById('bonus-weiter');
    if (w) w.addEventListener('click', function () {
      bz.schritt++;
      bz.falsch = [];
      bz.geloest = false;
      if (bz.schritt < n) bz.opt = mischeListe(folge(F.schritte[bz.schritt].optionen.length));
      sichern();
      zeichne();
      window.scrollTo(0, 0);
    });
  }

  nochEinmal.addEventListener('click', neuerVersuch);
  zeichne();
  namensverwaltung(function () { sende(); });

  /* ====================================================================================
     CHALLENGE: Karten aus allen Übungen einer Woche – ein Versuch je Karte, Punkte und Zeitbonus
     ==================================================================================== */
  function challenge() {
    var QUELLEN = (B.getAttribute('data-quellen') || RAUM_CH).split(/\s+/).filter(Boolean);
    var ANZAHL = Number(B.getAttribute('data-anzahl')) || 15;
    var UIDS = Object.keys(INHALTE).filter(function (k) { return INHALTE[k] && INHALTE[k].karten && QUELLEN.indexOf(INHALTE[k].raum) >= 0; });
    var titel = B.getAttribute('data-titel') || 'Challenge';
    var offen = /[?&]offen=1\b/.test(location.search) || QUELLEN.length > 1;
    var BEST = SPEICHER + '-best';
    document.title = titel + ' – ' + A.kopfzeile;
    document.getElementById('kopfzeile').textContent = A.kopfzeile + ' · ' + (B.getAttribute('data-untertitel') || '');
    document.getElementById('titel').textContent = titel;
    nochEinmal.hidden = true;
    herzEl.innerHTML = '';

    function karte(ref) { var U2 = INHALTE[ref.u]; return { k: U2.karten[ref.i], knoepfe: U2.knoepfe }; }
    function ziehe() { // gleichmäßig aus allen Übungen, dann gemischt (nie mehr als 3 gleiche Antworten hintereinander)
      var toepfe = UIDS.map(function (u) { return mischeListe(folge(INHALTE[u].karten.length)).map(function (i) { return { u: u, i: i }; }); });
      var gezogen = [], t2 = mischeListe(folge(toepfe.length));
      while (gezogen.length < ANZAHL && toepfe.some(function (tp) { return tp.length; })) {
        t2.forEach(function (j) { if (gezogen.length < ANZAHL && toepfe[j].length) gezogen.push(toepfe[j].shift()); });
      }
      var r, versuche = 0;
      do {
        r = mischeListe(gezogen);
        var lauf = 1, ok = true;
        for (var i = 1; i < r.length; i++) {
          var a = richtigeListe(karte(r[i]).k)[0], b2 = richtigeListe(karte(r[i - 1]).k)[0];
          lauf = a === b2 ? lauf + 1 : 1;
          if (lauf > 3) { ok = false; break; }
        }
      } while (!ok && ++versuche < 80);
      return r;
    }
    function punkteFuer(richtig, gesamt, sek) { // wie auf dem Server (server/src/logik.js)
      return 100 * richtig + Math.round(500 * (gesamt ? richtig / gesamt : 0) * Math.max(0, 1 - sek / 600));
    }
    var c = lade(SPEICHER);
    if (!c || !Array.isArray(c.karten) || !c.karten.every(function (r) { return INHALTE[r.u] && INHALTE[r.u].karten[r.i]; })) c = { phase: 'start' };
    function sichernCh() { speichere(SPEICHER, c); }

    function geschaffteUebungen() { var l = lokal(); return l ? (lade(GELOEST, l) || {}) : {}; }
    function freigeschaltet() { if (offen) return true; var g = geschaffteUebungen(); return UIDS.every(function (u) { return g[u]; }); }

    var tick = null;
    function zeichneCh() {
      document.getElementById('fortschritt-text').textContent = c.phase === 'lauf' ? ersetze(t('chKarte'), { x: c.pos + 1, y: c.karten.length }) : '';
      document.getElementById('fortschritt-balken').style.width = c.phase === 'lauf' ? (100 * c.pos / c.karten.length) + '%' : (c.phase === 'ende' ? '100%' : '0');
      herzEl.innerHTML = c.phase === 'lauf' ? '<span class="uhr">⏱ ' + uhr((Date.now() - c.start) / 1000) + '</span>' : '';
      endeBox.hidden = true;
      if (c.phase === 'start') return zeichneStart();
      if (c.phase === 'lauf') return zeichneLauf();
      return zeichneErgebnis();
    }
    function zeichneStart() {
      var anw = document.getElementById('anweisung');
      if (!freigeschaltet()) {
        var g = geschaffteUebungen();
        anw.innerHTML = fmt(t('chGesperrt'));
        kartenBox.innerHTML = '<ul class="ch-liste">' + UIDS.map(function (u) {
          return '<li>' + (g[u] ? '✅ ' : '⬜ ') + esc(INHALTE[u].titel) + '</li>';
        }).join('') + '</ul>';
        return;
      }
      anw.innerHTML = fmt(ersetze(t('chRegeln'), { x: Math.min(ANZAHL, UIDS.reduce(function (n, u) { return n + INHALTE[u].karten.length; }, 0)) }));
      var best = Number(gespeichert(BEST)) || 0;
      kartenBox.innerHTML = (best ? '<p class="ch-best">' + esc(ersetze(t('chBest'), { x: best.toLocaleString('de-DE') })) + '</p>' : '') +
        '<button type="button" class="knopf ch-start" id="ch-start">' + esc(t('chStart')) + '</button>' +
        (SERVER ? '<p class="hinweis-klein">' + esc(t('chDatenschutz')) + '</p>' : '');
      document.getElementById('ch-start').addEventListener('click', function () {
        c = { phase: 'lauf', karten: ziehe(), antworten: [], pos: 0, start: Date.now() };
        sichernCh();
        zeichneCh();
        window.scrollTo(0, 0);
      });
    }
    var warte = false;
    function zeichneLauf() {
      document.getElementById('anweisung').innerHTML = '';
      if (!tick) tick = setInterval(function () { if (c.phase === 'lauf') herzEl.innerHTML = '<span class="uhr">⏱ ' + uhr((Date.now() - c.start) / 1000) + '</span>'; }, 1000);
      var ref = c.karten[c.pos], kk = karte(ref), a = c.antworten[c.pos];
      var richtige = richtigeListe(kk.k);
      kartenBox.innerHTML = '<section class="karte" data-index="' + c.pos + '" data-uebung="' + esc(ref.u) + '" data-karte="' + ref.i + '">' +
        '<p class="karte-kopf"><span class="nummer">' + (c.pos + 1) + '</span> ' + esc(ersetze(t('karteVon'), { y: c.karten.length })) +
        ' · <span class="ch-thema">' + esc(INHALTE[ref.u].titel.replace(/^Übung:\s*/, '')) + '</span></p>' +
        '<p class="karte-text">' + fmt(kk.k.text) + '</p>' +
        '<div class="' + knopfKlasse(kk.knoepfe) + '">' + kk.knoepfe.map(function (b) {
          var cls = '';
          if (a) { if (richtige.indexOf(b.kuerzel) >= 0) cls = ' ist-richtig'; else if (a.k === b.kuerzel) cls = ' ist-falsch'; }
          return '<button type="button" class="antwort' + cls + '" data-kuerzel="' + esc(b.kuerzel) + '"' + (a ? ' disabled' : '') + '>' +
            '<span class="symbol" aria-hidden="true">' + (cls === ' ist-richtig' ? '✓' : (cls === ' ist-falsch' ? '✗' : '')) + '</span><span class="beschriftung">' + esc(b.text) + '</span></button>';
        }).join('') + '</div></section>';
      Array.prototype.forEach.call(kartenBox.querySelectorAll('.antwort'), function (btn) {
        btn.addEventListener('click', function () {
          if (warte || c.antworten[c.pos]) return;
          var ku = btn.getAttribute('data-kuerzel');
          c.antworten[c.pos] = { k: ku, r: richtige.indexOf(ku) >= 0 };
          sichernCh();
          warte = true;
          zeichneLauf();
          setTimeout(function () {
            warte = false;
            c.pos++;
            if (c.pos >= c.karten.length) { c.phase = 'ende'; c.dauer = Math.round((Date.now() - c.start) / 1000); sendeCh(); }
            sichernCh();
            zeichneCh();
          }, CH_ANZEIGE_MS);
        });
      });
    }
    function zeichneErgebnis() {
      if (tick) { clearInterval(tick); tick = null; }
      var richtig = c.antworten.filter(function (a) { return a && a.r; }).length, gesamt = c.karten.length;
      var punkte = punkteFuer(richtig, gesamt, c.dauer);
      var best = Number(gespeichert(BEST)) || 0;
      if (punkte > best) { best = punkte; var l = lokal(); try { if (l) l.setItem(BEST, String(best)); } catch (e) { /* egal */ } }
      document.getElementById('anweisung').innerHTML = '';
      var falsche = c.karten.map(function (ref, n) { return { ref: ref, a: c.antworten[n] }; }).filter(function (x) { return !x.a || !x.a.r; });
      kartenBox.innerHTML = '<section class="ch-ergebnis"><p class="ch-punkte">' + esc(ersetze(t('chErgebnis'), { x: punkte.toLocaleString('de-DE') })) + '</p>' +
        '<p>' + esc(ersetze(t('chRichtig'), { x: richtig, y: gesamt, z: uhr(c.dauer) })) + '</p>' +
        '<p class="ch-best">' + esc(ersetze(t('chBest'), { x: best.toLocaleString('de-DE') })) + '</p>' +
        (SERVER && name && klasse ? '<p class="hinweis-klein">' + esc(t('chGesendet')) + '</p>' : '') + '</section>' +
        (falsche.length ? '<h2 class="ch-fehler-titel">' + esc(t('chFehlerTitel')) + '</h2>' + falsche.map(function (x) {
          var kk = karte(x.ref), r = richtigeListe(kk.k)[0];
          var label = kk.knoepfe.filter(function (b) { return b.kuerzel === r; })[0];
          return '<div class="karte ch-loesung"><p class="karte-text">' + fmt(kk.k.text) + '</p>' +
            '<p class="ch-richtig">✓ ' + esc(ersetze(t('chRichtigWaere'), { x: label ? label.text : r })) + '</p>' +
            '<p>' + fmt(erklaerungFuer(kk.k, r)) + '</p></div>';
        }).join('') : '<p class="ch-alle">' + esc(t('chAlleRichtig')) + '</p>') +
        '<button type="button" class="knopf ch-start" id="ch-nochmal">' + esc(t('chNochmal')) + '</button>';
      document.getElementById('ch-nochmal').addEventListener('click', function () {
        c = { phase: 'lauf', karten: ziehe(), antworten: [], pos: 0, start: Date.now() };
        sichernCh();
        zeichneCh();
        window.scrollTo(0, 0);
      });
    }
    function sendeCh() {
      if (!SERVER || !name || !klasse) return;
      var richtig = c.antworten.filter(function (a) { return a && a.r; }).length;
      try {
        fetch(SERVER + '/challenge', {
          method: 'POST', headers: { 'Content-Type': 'text/plain' }, keepalive: true,
          body: JSON.stringify({ raum: klasse + '-' + RAUM_CH, geraet: geraetId(), name: name, richtig: richtig, gesamt: c.karten.length, dauer: c.dauer })
        }).catch(function () { /* ohne Verbindung: kein Eintrag */ });
      } catch (e) { /* egal */ }
    }
    zeichneCh();
    namensverwaltung(function () { zeichneCh(); });
  }

  /* ====================================================================================
     Namenseingabe mit Klassenwahl (gemeinsam für Übung und Challenge)
     ==================================================================================== */
  function namensverwaltung(nachAnmeldung) {
    function zeigeName() {
      nameZeile.hidden = false;
      nameZeile.innerHTML = esc(ersetze(A.nameAnzeige, { x: name, y: klasseName(klasse) })) +
        ' · <button type="button" class="link-knopf" id="name-aendern">' + esc(A.nameAendern) + '</button>';
      document.getElementById('name-aendern').addEventListener('click', frageName);
    }
    function frageName() {
      uebungTeil.hidden = true;
      nameZeile.hidden = true;
      nameBereich.hidden = false;
      var klassenHtml = KLASSEN.map(function (k) {
        return '<label class="klasse-wahl"><input type="radio" name="klasse" value="' + esc(k.kuerzel) + '"' +
          (k.kuerzel === klasse ? ' checked' : '') + '><span>' + esc(k.name) + '</span></label>';
      }).join('');
      nameBereich.innerHTML = '<h2>' + esc(A.nameTitel) + '</h2><p>' + fmt(A.nameText) + '</p>' +
        '<form id="name-form" novalidate><label for="name-feld" class="unsichtbar">Name</label>' +
        '<input id="name-feld" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="30" placeholder="' + esc(A.nameBeispiel) + '" value="' + esc(name || '') + '">' +
        '<fieldset class="klassen"><legend>' + esc(A.klasseFrage) + '</legend>' + klassenHtml + '</fieldset>' +
        '<p class="name-fehler" id="name-fehler" role="alert" hidden></p>' +
        '<button type="submit" class="knopf">' + esc(A.nameKnopf) + '</button></form>' +
        '<p class="hinweis-klein">' + esc(A.nameDatenschutz) + '</p>';
      var feld = document.getElementById('name-feld');
      document.getElementById('name-form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var n = normalisiereName(feld.value);
        var gewaehlt = nameBereich.querySelector('input[name=klasse]:checked');
        var f = document.getElementById('name-fehler');
        if (!n) { f.textContent = A.nameFehler; f.hidden = false; feld.focus(); return; }
        if (!gewaehlt || !klasseName(gewaehlt.value)) { f.textContent = A.klasseFehler; f.hidden = false; return; }
        name = n;
        klasse = gewaehlt.value;
        var l = lokal();
        try { if (l) { l.setItem(NAME, n); l.setItem(KLASSE, klasse); } } catch (e) { /* egal */ }
        nameBereich.hidden = true;
        nameBereich.innerHTML = '';
        uebungTeil.hidden = false;
        zeigeName();
        nachAnmeldung();
      });
    }
    if (SERVER) {
      if (name && klasse) { zeigeName(); nachAnmeldung(); } else { frageName(); }
    }
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () { /* egal */ });
    }
  }
})();

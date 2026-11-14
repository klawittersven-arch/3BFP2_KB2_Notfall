/* Fall-Einführung „Zeitlupe“ – Handy-Seite (fall.html).
 * Die Lehrkraft schaltet auf dem Beamer von Schritt zu Schritt; das Handy fragt alle paar Sekunden ab,
 * welcher Schritt dran ist, und zeigt den passenden Abschnitt des Falls mit der Frage.
 * Alle Texte stehen in fall-inhalte.js. */
(function () {
  'use strict';

  var E = window.EINSTELLUNGEN || {};
  var F = FALL;
  var H = F.handy;
  var PRAEFIX = 'kb2-notfall-';          // Name, Klasse und Gerät gelten auch für die Übungen
  var NAME = PRAEFIX + 'name';
  var KLASSE = PRAEFIX + 'klasse';
  var GERAET = PRAEFIX + 'geraet';
  var SERVER = String(E.serverAdresse || '').replace(/\/+$/, '');
  var KLASSEN = E.klassen || [];
  var ABFRAGE_MS = 1000 * Math.max(2, Number(E.fallAbfrageSekunden) || 3);
  var STATIONEN = F.schritte.filter(function (s) { return s.art === 'station'; }).length;

  // ---------- Hilfsfunktionen ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function ersetze(s, w) { return s.replace(/\{(\w)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; }); }
  function lokal() { try { return window.localStorage; } catch (e) { return null; } }
  function holeLokal(k) { var l = lokal(); try { return l ? l.getItem(k) : null; } catch (e) { return null; } }
  function setzeLokal(k, v) { var l = lokal(); try { if (l) l.setItem(k, v); } catch (e) { /* egal */ } }
  function klasseName(kuerzel) {
    var k = KLASSEN.filter(function (x) { return x.kuerzel === kuerzel; })[0];
    return k ? k.name : null;
  }
  function gesperrtesWort(text) {
    var flach = String(text).toLowerCase().replace(/[^\p{L}]/gu, '');
    return (E.sperrwoerter || []).some(function (w) { return flach.indexOf(w) >= 0; });
  }
  function normalisiereName(roh) { // „Lena Kraus“ → „Lena K.“ (wie in den Übungen)
    var t = String(roh || '').replace(/\s+/g, ' ').trim();
    var m = t.match(/^(.+) (\S)[^ ]*$/);
    if (!m) return null;
    var name = m[1].charAt(0).toUpperCase() + m[1].slice(1) + ' ' + m[2].toUpperCase() + '.';
    if (name.length > 24 || !/^\p{L}[\p{L}' -]*\p{L} \p{L}\.$/u.test(name)) return null;
    return gesperrtesWort(name) ? null : name;
  }
  function geraetId() {
    var g = holeLokal(GERAET);
    if (g && /^[a-f0-9]{16,64}$/.test(g)) return g;
    var b = new Uint8Array(16);
    try { window.crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
    g = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    setzeLokal(GERAET, g);
    return g;
  }
  // Abschnitte des Falltexts zu Absätzen zusammensetzen
  // Jedes Wort des Falltexts wird antippbar (für den Begriffsparkplatz). Der Text selbst bleibt Zeichen für Zeichen gleich.
  var WORT = /^([^\p{L}\p{N}]*)(.*?[\p{L}\p{N}])([^\p{L}\p{N}]*)$/u;
  function woerterHtml(text) {
    return text.split(/(\s+)/).map(function (t) {
      if (!t || /^\s+$/.test(t)) return esc(t);
      var m = t.match(WORT);
      if (!m || !/\p{L}/u.test(m[2])) return esc(t);
      return esc(m[1]) + '<span class="f-wort" role="button" tabindex="0">' + esc(m[2]) + '</span>' + esc(m[3]);
    }).join('');
  }
  // Falltext in Absätzen; jeder Vorlese-Abschnitt in einem eigenen <span> (zum Markieren, wenn vorgelesen wird)
  function falltextHtml(teile) {
    var nr = 0;
    return leseAbsaetze(teile).map(function (abs) {
      return '<p>' + abs.map(function (txt) { return '<span class="f-lese" data-lese="' + (nr++) + '">' + woerterHtml(txt) + '</span>'; }).join(' ') + '</p>';
    }).join('');
  }
  // ---------- Vorlesen: Text in Abschnitte zu 2–3 Sätzen teilen (gleich in fall.js und lehrer-fall.js) ----------
  // Der Text selbst bleibt unverändert – er wird nur zum Hervorheben in Abschnitte eingeteilt (je Absatz).
  function saetze(text) {
    var grenze = /[.!?][“”"»)\]]*\s+(?=[A-ZÄÖÜ„"\[])/g, teile = [], start = 0, m;
    while ((m = grenze.exec(text))) { teile.push(text.slice(start, m.index + m[0].length)); start = m.index + m[0].length; }
    if (start < text.length) teile.push(text.slice(start));
    return teile;
  }
  // Absätze → je Absatz eine Liste von Abschnitten (Text); 1–3 Sätze, möglichst gleich groß
  function leseAbsaetze(teile) {
    var absaetze = [];
    teile.forEach(function (t, i) {
      if (t.absatz || i === 0) absaetze.push(t.text);
      else absaetze[absaetze.length - 1] += ' ' + t.text;
    });
    return absaetze.map(function (a) {
      var s = saetze(a), k = Math.ceil(s.length / 3), basis = Math.floor(s.length / k), mehr = s.length % k, aus = [], pos = 0;
      for (var i = 0; i < k; i++) {
        var n = basis + (i < mehr ? 1 : 0);
        aus.push(s.slice(pos, pos + n).join('').replace(/\s+$/, ''));
        pos += n;
      }
      return aus;
    });
  }
  function leseAnzahl(teile) { return leseAbsaetze(teile).reduce(function (n, a) { return n + a.length; }, 0); }
  // Welcher Text kann in dieser Phase vorgelesen werden? (Abschnitt vor der Abstimmung bzw. „Christin erzählt weiter“)
  function leseTeile(s, ph) {
    if (s.art !== 'station') return null;
    if (ph === 'frage') return abschnitte(s.id, 'frage');
    if (ph === 'aufloesung' && abschnitte(s.id, 'aufloesung').length) return abschnitte(s.id, 'aufloesung');
    return null;
  }

  // Stationen durchnummerieren (mit den zusätzlichen Situationen) und deren Text bereitlegen
  var EXTRA = {};
  (function () {
    var nr = 0;
    F.schritte.forEach(function (s) {
      if (s.art === 'station') s.nummer = ++nr;
      if (s.extra) EXTRA[s.id] = s;
    });
  })();
  // Abschnitte des Falltexts; bei zusätzlichen Situationen deren eigener Text (nicht im Fallbeispiel)
  function abschnitte(teil, art) {
    if (EXTRA[teil]) return !art || art === 'frage' ? [{ teil: teil, art: 'frage', absatz: true, text: EXTRA[teil].text }] : [];
    return F.text.filter(function (t) { return t.teil === teil && (!art || t.art === art); });
  }
  // Phasen eines Schritts (= Stufen, die mit „Weiter“ durchlaufen werden). Gleich in fall.js und lehrer-fall.js.
  // Ein Bild wird immer zuerst im Vollbild gezeigt, danach steht es klein neben dem Text.
  function hatPassung(q) { return !!(q && (q.reihenfolge || (q.optionen && q.optionen.some(function (o) { return o.passt !== undefined; })))); }
  function phasen(s) {
    var bild = s.bild ? ['bild'] : [];
    if (s.art === 'kaltstart') return bild.concat(['satz', 'countdown']);
    if (s.art === 'station') {
      var auf = F.text.some(function (t) { return t.teil === s.id && t.art === 'aufloesung'; }) || hatPassung(s.frage) || !!s.loesung;
      return bild.concat(['frage', 'ergebnis'], auf ? ['aufloesung'] : []);
    }
    if (s.art === 'fragen' || s.art === 'zurueckspulen') return ['frage', 'ergebnis'];
    if (s.art === 'personen') return bild.concat(['frage']);
    return ['frage'];
  }
  function aktuellePhase() { var s = schritt(); var p = phasen(s); return p[Math.min(stand.stufe, p.length - 1)]; }
  function abgestimmt() { var p = aktuellePhase(); return p === 'ergebnis' || p === 'aufloesung'; }
  function hatAufloesung(schritt) { return schritt.art === 'station' && (abschnitte(schritt.id, 'aufloesung').length > 0 || !!schritt.loesung); }

  // ---------- Zustand ----------
  var name = SERVER ? normalisiereName(holeLokal(NAME)) : null;
  var klasse = SERVER ? holeLokal(KLASSE) : null;
  if (!klasseName(klasse)) klasse = null;
  var stand = null;            // {schritt, stufe, durchgang, sitzung} vom Server
  var gezeichnet = '';         // welcher Stand zuletzt gezeichnet wurde
  var meine = null;            // {antworten: {}, texte: []} – gespeichert je Sitzung auf dem Handy
  var auswahl = {};            // Mehrfachauswahl, noch nicht gesendet
  var person = null;           // gewählte Person (Perspektiven)
  var timer = null, verbunden = true, ausstehend = {};

  function sitzungsSchluessel() { return PRAEFIX + 'fall-' + (stand ? stand.sitzung : ''); }
  function ladeMeine() {
    var s = holeLokal(sitzungsSchluessel());
    try { meine = s ? JSON.parse(s) : null; } catch (e) { meine = null; }
    if (!meine || typeof meine !== 'object') meine = { antworten: {}, texte: [] };
    if (!Array.isArray(meine.begriffe)) meine.begriffe = [];
  }
  function speichereMeine() { setzeLokal(sitzungsSchluessel(), JSON.stringify(meine)); }

  var raum = function () { return klasse + '-fall'; };

  // ---------- Server ----------
  function post(pfad, daten) {
    return fetch(SERVER + pfad, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(daten), keepalive: true
    }).then(function (r) { if (!r.ok && r.status !== 429) throw new Error('Status ' + r.status); return r; });
  }
  function sendeAntwort(frage, wert) {
    if (Array.isArray(wert) && !wert.length) delete meine.antworten[frage];   // leere Liste = Antwort zurückziehen
    else meine.antworten[frage] = wert;
    speichereMeine();
    ausstehend[frage] = wert;
    post('/fall/antwort', { raum: raum(), geraet: geraetId(), name: name, frage: frage, wert: wert })
      .then(function () { if (ausstehend[frage] === wert) delete ausstehend[frage]; zeigeLeiste(); })
      .catch(function () { setTimeout(function () { if (ausstehend[frage] === wert) sendeAntwort(frage, wert); }, 5000); zeigeLeiste(); });
  }
  // ---------- Automatisch senden (Mehrfachauswahl und Reihenfolge) ----------
  // Kein „Senden“-Knopf: Kurz nach dem letzten Tippen wird die Auswahl gesendet. Bei „genau 3 wählen“ und bei der
  // Reihenfolge erst, wenn sie vollständig ist; wird sie danach wieder unvollständig, wird die Antwort zurückgezogen.
  var AUTO_MS = 500;
  var sendeTimer = {};
  function zielWert(q) {
    if (q.reihenfolge) {
      var l = folge[q.id] || [];
      return l.length === folgeAnzahl(q) ? folgeAlsWert(q, l) : [];
    }
    var a = auswahl[q.id] || [];
    return (q.waehlen ? a.length === q.waehlen : a.length > 0) ? a.slice() : [];
  }
  function sendeAuswahl(q) {
    var ziel = zielWert(q), bisher = meine.antworten[q.id];
    if (!ziel.length && bisher === undefined) return false;                          // nichts gesendet, nichts zurückzuziehen
    if (bisher !== undefined && JSON.stringify(bisher) === JSON.stringify(ziel)) return false;
    sendeAntwort(q.id, ziel);
    return true;
  }
  function planeSenden(q) {
    clearTimeout(sendeTimer[q.id]);
    sendeTimer[q.id] = setTimeout(function () {
      delete sendeTimer[q.id];
      if (abgestimmt()) return;
      if (sendeAuswahl(q)) { var y = window.scrollY; neuZeichnen(); window.scrollTo(0, y); }
    }, AUTO_MS);
  }
  function sendeGeplante() {          // z. B. wenn die Lehrkraft weiterschaltet oder das Handy gesperrt wird
    Object.keys(sendeTimer).forEach(function (id) {
      clearTimeout(sendeTimer[id]);
      delete sendeTimer[id];
      var q = sucheFrage(id);
      if (q) sendeAuswahl(q);
    });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && meine) sendeGeplante(); });
  window.addEventListener('pagehide', function () { if (meine) sendeGeplante(); });

  function frage() {
    if (!SERVER || !name || !klasse) return;
    fetch(SERVER + '/fall/zustand?raum=' + encodeURIComponent(raum()) + '&geraet=' + geraetId(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (z) {
        verbunden = true;
        var neueSitzung = !stand || stand.sitzung !== z.sitzung;
        if (!neueSitzung && (stand.schritt !== z.schritt || stand.stufe !== z.stufe)) sendeGeplante();
        stand = z;
        if (neueSitzung) { ladeMeine(); auswahl = {}; folge = {}; }
        zeichne();
      })
      .catch(function () { verbunden = false; zeigeLeiste(); });
  }
  function starte() {
    stoppe();
    frage();
    timer = setInterval(function () { if (!document.hidden) frage(); }, ABFRAGE_MS);
  }
  function stoppe() { if (timer) { clearInterval(timer); timer = null; } }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && timer) frage(); });

  // ---------- Anzeige ----------
  var inhalt = document.getElementById('f-inhalt');
  var leiste = document.getElementById('f-leiste');
  var bisher = document.getElementById('f-bisher');
  var parkplatz = document.getElementById('f-parkplatz');
  var nameZeile = document.getElementById('name-zeile');
  var nameBereich = document.getElementById('name-bereich');
  var teil = document.getElementById('f-teil');

  document.title = 'Fall-Einführung – ' + F.kopfzeile;
  document.getElementById('kopfzeile').textContent = F.kopfzeile + ' · Fall-Einführung';
  document.getElementById('titel').textContent = F.titel;
  document.getElementById('f-bisher-titel').textContent = H.bisher;

  function schritt() { return stand ? F.schritte[Math.min(stand.schritt, F.schritte.length - 1)] : null; }

  function zeigeLeiste() {
    var s = schritt();
    var links = s ? (s.art === 'station' ? ersetze(H.station, { x: s.nummer, y: STATIONEN }) + ' · ' + s.kurz : s.kurz) : '';
    var offen = Object.keys(ausstehend).length;
    var rechts = !verbunden ? '<span class="f-warnung">' + esc(H.keineVerbindung) + '</span>' :
      (offen ? '<span class="f-warnung">Wird gesendet …</span>' : '');
    leiste.innerHTML = '<span>' + esc(links) + '</span>' + rechts;
  }

  function zeichne(erzwingen) {
    zeigeLeiste();
    var s = schritt();
    if (!s) return;
    var schluessel = stand.sitzung + '|' + stand.schritt + '|' + stand.stufe + '|' + (stand.gruppe || '');
    zeigeMitglieder();
    if (schluessel === gezeichnet && !erzwingen) { zeigeLesen(); return; }   // nichts Neues – Eingaben nicht zerstören
    if (schluessel !== gezeichnet) sendeEntwurf();         // weitergeschaltet: vergessenen Text nicht verlieren
    var gleicherSchritt = gezeichnet.split('|').slice(0, 2).join('|') === stand.sitzung + '|' + stand.schritt;
    gezeichnet = schluessel;
    if (!gleicherSchritt) { person = null; }
    var html = '';
    if (s.art === 'kaltstart') html = '<p class="f-gross">' + esc(s.handy) + '</p>';
    else if (s.art === 'fragen') html = fragenHtml(s);
    else if (s.art === 'personen') html = personenHtml(s);
    else if (s.art === 'station' && aktuellePhase() === 'bild') html = '<h2 class="f-titel"><span class="nummer">' + s.nummer + '</span>' + esc(s.kurz) + '</h2>' +
      '<img class="f-bild" src="' + esc(s.bild.datei.replace(/\.jpg$/, '-klein.jpg')) + '" alt="' + esc(s.bild.alt) + '" width="800" height="450">' +
      '<p class="f-gross">' + esc(H.nachVorn) + '</p>';
    else if (s.art === 'station') html = stationHtml(s);
    else if (s.art === 'zurueckspulen') html = '<h2 class="f-titel">' + esc(s.titel) + '</h2><p class="f-vorspann">' + esc(s.vorspann) + '</p>' + frageHtml(s.frage, stand.stufe >= 1);
    else if (s.art === 'perspektiven') html = perspektivenHtml(s);
    else if (s.art === 'ende') html = '<h2 class="f-titel">' + esc(s.titel) + '</h2><p class="f-gross">' + esc(s.handy) + '</p>';
    inhalt.innerHTML = html;
    verbinde(s);
    zeichneBisher(s);
    zeichneParkplatz(s);
    leereWortauswahl();
    markiereGeparkte();
    if (!gleicherSchritt) window.scrollTo(0, 0);
    zeigeLesen();
  }

  // ---------- Vorlesen: den Abschnitt markieren, der gerade gelesen wird ----------
  var leseIch = document.createElement('div');
  leseIch.className = 'f-lesen-ich';
  leseIch.setAttribute('role', 'status');
  leseIch.hidden = true;
  leseIch.textContent = H.leseDran;
  document.body.appendChild(leseIch);
  var letzteLesung = '';
  function zeigeLesen() {
    var l = stand && stand.lesen, s = schritt(), ph = s ? aktuellePhase() : null, box = null;
    if (l && s && leseTeile(s, ph)) box = ph === 'aufloesung' ? inhalt.querySelector('.f-aufloesung .f-falltext') : inhalt.querySelector(':scope > .f-falltext');
    Array.prototype.forEach.call(inhalt.querySelectorAll('.f-lese'), function (e) {
      var k = Number(e.getAttribute('data-lese')), drin = !!box && box.contains(e);
      e.classList.toggle('f-lesen-an', drin && k === l.abschnitt);
      e.classList.toggle('f-lesen-vorbei', drin && k < l.abschnitt);
    });
    var ich = !!(box && l.ich);
    leseIch.hidden = !ich;
    var neu = box ? stand.sitzung + '|' + stand.schritt + '|' + stand.stufe + '|' + l.abschnitt + '|' + ich : '';
    if (neu && neu !== letzteLesung) {     // neuer Abschnitt: dorthin scrollen; wer dran ist, spürt es (falls möglich)
      var el = box.querySelector('.f-lesen-an');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (ich && navigator.vibrate) { try { navigator.vibrate(200); } catch (e) { /* egal */ } }
    }
    letzteLesung = neu;
  }

  function fragenHtml(s) {
    return '<h2 class="f-titel">' + esc(s.titel) + '</h2>' +
      s.fragen.map(function (q) { return frageHtml(q, stand.stufe >= 1); }).join('');
  }

  // Vorstellung: (kleines Bild +) zwei Namenskarten, der Blick geht nach vorn
  function personenHtml(s) {
    return '<h2 class="f-titel">' + esc(s.titel) + '</h2>' +
      (s.bild ? '<img class="f-bild" src="' + esc(s.bild.datei.replace(/\.jpg$/, '-klein.jpg')) + '" alt="' + esc(s.bild.alt) + '" width="800" height="450">' : '') +
      s.personen.map(function (p) {
        return '<div class="f-vorstellung"><p class="f-vorstellung-name">' + esc(p.name) + '</p><p>' + esc(p.text) + '</p></div>';
      }).join('') +
      '<p class="f-gross">' + esc(s.handy) + '</p>';
  }

  function stationHtml(s) {
    var auf = aktuellePhase() === 'aufloesung' && hatAufloesung(s);
    return '<h2 class="f-titel"><span class="nummer">' + s.nummer + '</span>' + esc(s.kurz) + '</h2>' +
      (s.bild ? '<img class="f-bild" src="' + esc(s.bild.datei.replace(/\.jpg$/, '-klein.jpg')) + '" alt="' + esc(s.bild.alt) + '" width="800" height="450">' : '') +
      '<div class="f-falltext">' + falltextHtml(abschnitte(s.id, 'frage')) + '</div>' +
      '<p class="f-tipp-hinweis"><span aria-hidden="true">💡</span> ' + esc(F.begriffe.tippHinweis) + '</p>' +
      frageHtml(s.frage, abgestimmt(), aktuellePhase() === 'aufloesung') +
      (auf && s.loesung ? '<div class="f-aufloesung"><p class="f-auf-kopf">' + esc(H.einschaetzung) + '</p><p><strong>' +
        F.ampel.filter(function (o) { return o.kuerzel === s.loesung.ampel; }).map(function (o) { return o.zeichen + ' ' + esc(o.text); })[0] +
        '</strong> – ' + esc(s.loesung.text) + '</p></div>' :
       auf ? '<div class="f-aufloesung"><p class="f-auf-kopf">' + esc(H.christinErzaehlt) + '</p><div class="f-falltext">' +
        falltextHtml(abschnitte(s.id, 'aufloesung')) + '</div></div>' : '');
  }

  // Eine Frage: Ampel, Auswahl (eine Antwort), Mehrfachauswahl oder Skala
  function optionen(q) { return q.ampel ? F.ampel : q.optionen; }
  // ---------- Reihenfolge-Fragen ----------
  // Gesendet wird die Reihenfolge als Liste „Platz + Kürzel“ (z. B. '1ANSP', '2RUF' …) und 'OK', wenn alles stimmt.
  // So zählt der Server ohne Änderung, wie oft welcher Schritt auf welchem Platz steht.
  var folge = {};       // Frage → angetippte Kürzel in Reihenfolge (noch nicht gesendet)
  var mischung = {};    // Frage → gemischte Anzeige-Reihenfolge (bleibt, solange die Seite offen ist)
  function folgeAusWert(wert) {
    return (Array.isArray(wert) ? wert : []).filter(function (c) { return /^\d/.test(c); })
      .sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); })
      .map(function (c) { return c.replace(/^\d+/, ''); });
  }
  function folgeAnzahl(q) { return q.anzahl || q.optionen.length; }
  function folgeRichtig(q) { return q.optionen.slice(0, folgeAnzahl(q)).map(function (o) { return o.kuerzel; }); }
  function folgeAlsWert(q, liste) {
    var wert = liste.map(function (k, i) { return (i + 1) + k; });
    if (liste.join() === folgeRichtig(q).join()) wert.push('OK');
    return wert;
  }
  function gemischt(q) {
    if (mischung[q.id]) return mischung[q.id];
    var a = q.optionen.slice(), richtig = q.optionen.map(function (o) { return o.kuerzel; }).join();
    for (var n = 0; n < 20; n++) {          // nie zufällig in der richtigen Reihenfolge anzeigen
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      if (a.map(function (o) { return o.kuerzel; }).join() !== richtig) break;
    }
    return (mischung[q.id] = a);
  }
  function reihenfolgeHtml(q, gesperrt, aufgeloest) {
    var gesendet = folgeAusWert(meine.antworten[q.id]);
    if (!folge[q.id]) folge[q.id] = gesendet.slice();
    var liste = gesperrt ? gesendet : folge[q.id];
    var n = folgeAnzahl(q), richtig = folgeRichtig(q), voll = liste.length >= n;
    var opt = function (k) { return q.optionen.filter(function (o) { return o.kuerzel === k; })[0]; };
    var html;
    if (!aufgeloest) {
      html = '<div class="f-folge" role="group" aria-label="' + esc(q.text) + '">' + gemischt(q).map(function (o) {
        var platz = liste.indexOf(o.kuerzel);
        return '<button type="button" class="f-opt f-folge-opt' + (platz >= 0 ? ' f-an' : '') + '" data-folge="' + esc(q.id) +
          '" data-kuerzel="' + esc(o.kuerzel) + '"' + (gesperrt || (voll && platz < 0) ? ' disabled' : '') + '>' +
          '<span class="f-platz" aria-hidden="true">' + (platz >= 0 ? platz + 1 : '') + '</span><span>' + esc(o.text) + '</span></button>';
      }).join('') + '</div>';
      if (liste.length) {
        html += '<p class="f-unter">' + esc(H.ihreReihenfolge) + '</p><ol class="f-folge-liste">' +
          liste.map(function (k) { return '<li>' + esc(opt(k).text) + '</li>'; }).join('') + '</ol>';
      }
    } else {
      // Auflösung: eigene Reihenfolge mit ✓/✗ und die richtige Reihenfolge
      html = '<p class="f-unter">' + esc(H.ihreReihenfolge) + '</p><ol class="f-folge-liste">' + (gesendet.length ? gesendet.map(function (k, i) {
        var ok = richtig[i] === k, o = opt(k), pr = richtig.indexOf(k);
        return '<li class="' + (ok ? 'f-folge-ok' : 'f-folge-falsch') + '">' + (ok ? '✓ ' : '✗ ') + esc(o.text) +
          (ok ? '' : ' <small>(' + (pr >= 0 ? 'richtig: Platz ' + (pr + 1) : 'passt nicht: ' + esc(o.grund || '')) + ')</small>') + '</li>';
      }).join('') : '<li>' + esc(H.keineAntwort) + '</li>') + '</ol>' +
        '<p class="f-unter">' + esc(H.richtigeReihenfolge) + (q.merksatz ? ' <strong>' + esc(q.merksatz) + '</strong>' : '') + '</p>' +
        '<ol class="f-folge-liste f-folge-richtig">' + richtig.map(function (k) {
          var o = opt(k);
          return '<li>' + (o.merk ? esc(o.merk) + ': ' : '') + esc(o.text) + '</li>';
        }).join('') + '</ol>' + (q.quelle ? '<p class="f-hilfe">' + esc(q.quelle) + '</p>' : '');
    }
    var status = '';
    if (gesperrt && !aufgeloest) status = '<p class="f-status">' + esc(H.gesperrt) + (gesendet.length ? '' : ' ' + esc(H.keineAntwort)) + '</p>';
    else if (!gesperrt && liste.length < n) status = '<p class="f-status f-auto">' + esc(ersetze(H.nochTippen, { x: n - liste.length })) + '</p>';
    else if (!gesperrt && gesendet.join() === liste.join()) status = '<p class="f-status f-ok">✓ ' + esc(H.gesendet) + '</p>';
    else if (!gesperrt) status = '<p class="f-status">' + esc(H.wirdGesendet) + '</p>';
    return '<section class="f-frage" data-frage="' + esc(q.id) + '"><h3>' + esc(q.text) + '</h3>' +
      (q.hilfe && !gesperrt ? '<p class="f-hilfe">' + esc(q.hilfe) + '</p>' : '') + html +
      status + '</section>';
  }

  function frageHtml(q, gesperrt, aufgeloest) {
    if (q.reihenfolge) return reihenfolgeHtml(q, gesperrt, aufgeloest);
    var gewaehlt = meine.antworten[q.id];
    var liste = gewaehlt === undefined ? [] : (Array.isArray(gewaehlt) ? gewaehlt : [gewaehlt]);
    if (q.mehrfach && !auswahl[q.id]) auswahl[q.id] = liste.slice();
    var aktiv = q.mehrfach ? auswahl[q.id] : liste;
    var art = q.ampel ? 'f-ampel' : (q.skala ? 'f-skala' : 'f-wahl');
    var voll = q.waehlen && aktiv.length >= q.waehlen;   // genau x wählen: danach sind die übrigen gesperrt
    var knoepfe = optionen(q).map(function (o) {
      var an = aktiv.indexOf(o.kuerzel) >= 0;
      var passung = aufgeloest && o.passt !== undefined;
      return '<button type="button" class="f-opt' + (o.farbe ? ' f-' + o.farbe : '') + (an ? ' f-an' : '') +
        (passung ? (o.passt ? ' f-passt' : ' f-passt-nicht') : '') + '"' +
        ' data-frage="' + esc(q.id) + '" data-kuerzel="' + esc(o.kuerzel) + '" aria-pressed="' + (an ? 'true' : 'false') + '"' +
        (gesperrt || (voll && !an) ? ' disabled' : '') + '>' +
        (q.mehrfach ? '<span class="f-haken" aria-hidden="true">' + (an ? '☑' : '☐') + '</span>' : '') +
        (o.zeichen ? '<span aria-hidden="true">' + o.zeichen + '</span>' : '') +
        (q.skala ? '<strong>' + esc(o.kuerzel) + '</strong>' : '') +
        '<span>' + esc(o.text) + (passung ? '<small class="f-grund">' + (o.passt ? '✓ passt: ' : '✗ passt nicht: ') + esc(o.grund || '') + '</small>' : '') + '</span></button>';
    }).join('');
    var status = '';
    if (gesperrt) status = '<p class="f-status">' + esc(H.gesperrt) + (liste.length ? '' : ' ' + esc(H.keineAntwort)) + '</p>';
    else if (liste.length && !q.mehrfach) status = '<p class="f-status f-ok">✓ ' + esc(H.gesendet) + '</p>';
    else if (q.mehrfach && q.waehlen && aktiv.length < q.waehlen) status = '<p class="f-status f-auto">' + esc(ersetze(H.nochWaehlen, { x: q.waehlen - aktiv.length })) + '</p>';
    else if (q.mehrfach && liste.length && gleicheListe(liste, aktiv)) status = '<p class="f-status f-ok">✓ ' + esc(H.gesendet) + '</p>';
    else if (q.mehrfach && aktiv.length) status = '<p class="f-status">' + esc(H.wirdGesendet) + '</p>';
    else if (q.mehrfach) status = '<p class="f-status f-auto">' + esc(H.automatisch) + '</p>';
    return '<section class="f-frage" data-frage="' + esc(q.id) + '"><h3>' + esc(q.text) + '</h3>' +
      (q.hilfe ? '<p class="f-hilfe">' + esc(q.hilfe) + '</p>' : '') +
      '<div class="' + art + '" role="group" aria-label="' + esc(q.text) + '">' + knoepfe + '</div>' +
      status + '</section>';
  }
  function gleicheListe(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function sucheFrage(id) {
    var gefunden = null;
    F.schritte.forEach(function (s) {
      (s.fragen || (s.frage ? [s.frage] : [])).forEach(function (q) { if (q.id === id) gefunden = q; });
    });
    return gefunden;
  }
  function neuZeichnen() { zeichne(true); }

  function verbinde(s) {
    Array.prototype.forEach.call(inhalt.querySelectorAll('.f-opt'), function (b) {
      b.addEventListener('click', function () {
        var q = sucheFrage(b.getAttribute('data-frage'));
        var k = b.getAttribute('data-kuerzel');
        if (!q || abgestimmt()) return;
        if (q.mehrfach) {
          var a = auswahl[q.id];
          var i = a.indexOf(k);
          if (i >= 0) a.splice(i, 1); else if (!q.waehlen || a.length < q.waehlen) a.push(k);
          planeSenden(q);
        } else {
          sendeAntwort(q.id, k);
        }
        var y = window.scrollY;
        neuZeichnen();
        window.scrollTo(0, y);
      });
    });
    Array.prototype.forEach.call(inhalt.querySelectorAll('[data-folge]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-folge'), k = b.getAttribute('data-kuerzel');
        if (abgestimmt()) return;
        var a = folge[id], i = a.indexOf(k), q = sucheFrage(id);
        if (i >= 0) a.splice(i, 1);                     // noch einmal tippen = herausnehmen, die anderen rücken nach
        else if (a.length < folgeAnzahl(q)) a.push(k);
        planeSenden(q);
        var y = window.scrollY;
        neuZeichnen();
        window.scrollTo(0, y);
      });
    });
    if (s.art === 'perspektiven') verbindePerspektiven(s);
  }

  // ---------- Perspektiven-Runde ----------
  // Namen der Gruppe aktualisieren, ohne neu zu zeichnen (Eingaben bleiben erhalten)
  function zeigeMitglieder() {
    var el = document.getElementById('f-gruppe-namen');
    if (!el || !stand || !stand.mitglieder) return;
    var s = schritt();
    el.textContent = (s.gruppeMit || '') + ' ' + stand.mitglieder.join(', ');
  }
  function perspektivenHtml(s) {
    // Die Gruppe (= Person) teilt die Lehrkraft zu; ohne Gruppe wird gewartet
    if (!stand.gruppe) return '<h2 class="f-titel">' + esc(s.titel) + '</h2><p class="f-gross">' + esc(s.gruppeWarten) + '</p>';
    person = stand.gruppe;
    var meinePerson = s.personen.filter(function (x) { return x.id === person; })[0];
    var gruppe = '<div class="f-gruppe" data-gruppe="' + esc(person) + '"><p class="f-gruppe-titel">' + esc(s.gruppeTitel) + '</p>' +
      '<p class="f-gruppe-person" id="f-gruppe-person">' + esc(meinePerson ? meinePerson.text : person) + '</p>' +
      '<p class="f-gruppe-namen" id="f-gruppe-namen">' + esc(s.gruppeMit + ' ' + (stand.mitglieder || []).join(', ')) + '</p></div>';
    var formular = '';
    if (person) {
      formular = '<form id="f-persp-form" class="f-persp-form" novalidate>' +
        '<label for="f-a">' + esc(s.feldA) + '</label>' +
        '<textarea id="f-a" maxlength="200" rows="3" placeholder="' + esc(s.feldABeispiel) + '"></textarea>' +
        '<label for="f-b">' + esc(s.feldB) + '</label>' +
        '<div class="f-anfaenge">' + s.satzanfaenge.map(function (a) {
          return '<button type="button" class="f-anfang" data-anfang="' + esc(a.replace(/…\?$/, '').replace(/…$/, '').trim()) + '">' + esc(a) + '</button>';
        }).join('') + '</div>' +
        '<textarea id="f-b" maxlength="200" rows="3"></textarea>' +
        '<p class="name-fehler" id="f-persp-fehler" role="alert" hidden></p>' +
        '<p class="f-status f-noch-offen" id="f-persp-offen" hidden>' + esc(s.nochNichtGesendet) + '</p>' +
        '<button type="submit" class="knopf f-senden">' + esc(H.senden) + '</button></form>';
    }
    var eigene = meine.texte.filter(function (t) { return t.art === 'persp'; });
    var liste = eigene.length ? '<h3 class="f-unter">Ihre Antworten</h3><ul class="f-eigene">' + eigene.map(function (t) {
      var p = s.personen.filter(function (x) { return x.id === t.person; })[0];
      return '<li><strong>' + esc(p ? p.text : '') + '</strong>' + (t.a ? '<br>' + esc(t.a) : '') + (t.b ? '<br>❓ ' + esc(t.b) : '') + '</li>';
    }).join('') + '</ul>' : '';
    return '<h2 class="f-titel">' + esc(s.titel) + '</h2>' + gruppe + '<p>' + fmt(s.auftrag) + '</p>' + formular + liste;
  }
  // Noch nicht gesendeter Text in den Feldern? {person, a, b} oder null
  function entwurf() {
    var fa = document.getElementById('f-a'), fb = document.getElementById('f-b');
    if (!fa || !fb || !person) return null;
    var a = fa.value.replace(/\s+/g, ' ').trim(), b = fb.value.replace(/\s+/g, ' ').trim();
    return a || b ? { person: person, a: a.slice(0, 200), b: b.slice(0, 200) } : null;
  }
  // Schaltet die Lehrkraft weiter (oder ändert die Gruppe), wird ein vergessener Entwurf automatisch mitgeschickt
  function sendeEntwurf() {
    var e = entwurf();
    if (!e || gesperrtesWort(e.a + ' ' + e.b)) return;
    var daten = { raum: raum(), geraet: geraetId(), name: name, art: 'persp', person: e.person, a: e.a, b: e.b };
    meine.texte.push({ art: 'persp', person: e.person, a: e.a, b: e.b });
    speichereMeine();
    post('/fall/text', daten).catch(function () {});
  }

  function verbindePerspektiven(s) {
    Array.prototype.forEach.call(inhalt.querySelectorAll('.f-person'), function (b) {
      b.addEventListener('click', function () {
        person = b.getAttribute('data-person');
        neuZeichnen();
        var a = document.getElementById('f-a');
        if (a) a.focus();
      });
    });
    Array.prototype.forEach.call(inhalt.querySelectorAll('.f-anfang'), function (b) {
      b.addEventListener('click', function () {
        var feld = document.getElementById('f-b');
        feld.value = b.getAttribute('data-anfang') + ' ';
        feld.focus();
      });
    });
    var form = document.getElementById('f-persp-form');
    if (!form) return;
    var offen = document.getElementById('f-persp-offen');
    ['f-a', 'f-b'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () { offen.hidden = !entwurf(); });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = document.getElementById('f-a').value.replace(/\s+/g, ' ').trim();
      var b = document.getElementById('f-b').value.replace(/\s+/g, ' ').trim();
      var fehler = document.getElementById('f-persp-fehler');
      if (!a && !b) { fehler.textContent = 'Bitte schreiben Sie etwas in die Felder.'; fehler.hidden = false; return; }
      if (gesperrtesWort(a + ' ' + b)) { fehler.textContent = 'Bitte formulieren Sie das anders.'; fehler.hidden = false; return; }
      var daten = { raum: raum(), geraet: geraetId(), name: name, art: 'persp', person: person, a: a.slice(0, 200), b: b.slice(0, 200) };
      var knopf = form.querySelector('button[type=submit]');
      knopf.disabled = true;
      post('/fall/text', daten).then(function (r) {
        if (r.status === 429) throw new Error('voll');
        meine.texte.push({ art: 'persp', person: daten.person, a: daten.a, b: daten.b });
        speichereMeine();
        if (person === daten.person && document.getElementById('f-a')) {   // Felder leeren: der Text ist gesendet
          document.getElementById('f-a').value = '';
          document.getElementById('f-b').value = '';
        }
        neuZeichnen();
        var ok = document.createElement('p');
        ok.className = 'f-status f-ok';
        ok.setAttribute('role', 'status');
        ok.textContent = '✓ ' + s.gesendet;
        var f2 = document.getElementById('f-persp-form');
        if (f2) f2.parentNode.insertBefore(ok, f2);
      }).catch(function () {
        knopf.disabled = false;
        fehler.textContent = 'Nicht gesendet. Bitte noch einmal versuchen.';
        fehler.hidden = false;
      });
    });
  }

  // ---------- Den Fall bis hier noch einmal lesen ----------
  function zeichneBisher(s) {
    var index = stand.schritt;
    var teile = [];
    F.schritte.forEach(function (x, i) {
      if (x.art !== 'station' || x.extra || i > index) return;
      var alles = i < index || s.art !== 'station';
      abschnitte(x.id).forEach(function (t) {
        if (alles || t.art === 'frage' || (t.art === 'aufloesung' && aktuellePhase() === 'aufloesung')) teile.push(t);
      });
    });
    // nur ältere Stationen anzeigen – die aktuelle steht schon oben
    var nurFrueher = teile.filter(function (t) { return s.art !== 'station' || t.teil !== s.id; });
    bisher.hidden = !nurFrueher.length;
    document.getElementById('f-bisher-text').innerHTML = falltextHtml(nurFrueher);
  }

  // ---------- Begriffsparkplatz ----------
  function zeichneParkplatz(s) {
    if (s.art === 'kaltstart') { parkplatz.hidden = true; return; }
    if (!parkplatz.hidden && parkplatz.innerHTML) return;
    var B = F.begriffe;
    parkplatz.hidden = false;
    parkplatz.innerHTML = '<h2><span aria-hidden="true">🅿️</span> ' + esc(B.titel) + '</h2><p>' + esc(B.text) + '</p>' +
      '<form id="f-wort-form" class="f-wort-form" novalidate><label for="f-wort" class="unsichtbar">' + esc(B.titel) + '</label>' +
      '<input id="f-wort" type="text" maxlength="40" autocomplete="off" spellcheck="false">' +
      '<button type="submit" class="knopf">' + esc(B.knopf) + '</button></form><p class="f-status" id="f-wort-status" role="status"></p>' +
      '<p class="f-meine-woerter" id="f-meine-woerter" hidden></p>';
    zeigeMeineWoerter();
    document.getElementById('f-wort-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var feld = document.getElementById('f-wort');
      var st = document.getElementById('f-wort-status');
      var w = feld.value.replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!w) return;
      if (gesperrtesWort(w)) { st.textContent = 'Bitte formulieren Sie das anders.'; return; }
      parke(w).then(function () {
        feld.value = '';
        st.textContent = '✓ ' + B.danke;
      }).catch(function () { st.textContent = 'Nicht gesendet. Bitte noch einmal versuchen.'; });
    });
  }

  // Ein Wort parken (aus dem Text angetippt oder eingetippt)
  function parke(w) {
    return post('/fall/text', { raum: raum(), geraet: geraetId(), name: name, art: 'begriff', a: w }).then(function (r) {
      if (r.status === 429) throw new Error('voll');
      if (meine.begriffe.indexOf(w) < 0) meine.begriffe.push(w);
      speichereMeine();
      markiereGeparkte();
      zeigeMeineWoerter();
    });
  }
  function zeigeMeineWoerter() {
    var el = document.getElementById('f-meine-woerter');
    if (!el) return;
    el.hidden = !meine.begriffe.length;
    el.innerHTML = '<strong>' + esc(F.begriffe.meine) + '</strong> ' + meine.begriffe.map(esc).join(' · ');
  }
  function geparkteWoerter() {
    var menge = {};
    meine.begriffe.forEach(function (b) { b.toLowerCase().split(' ').forEach(function (x) { menge[x] = true; }); });
    return menge;
  }
  function markiereGeparkte() {
    var menge = geparkteWoerter();
    Array.prototype.forEach.call(document.querySelectorAll('.f-wort'), function (s) {
      s.classList.toggle('f-geparkt', !!menge[s.textContent.toLowerCase()]);
    });
  }

  // ---------- Wörter im Text antippen ----------
  // 1. Tipp: Wort wird markiert, unten erscheint „Parken“. Tipp auf das Wort daneben nimmt es dazu
  // (z. B. „lebensverlängernden Maßnahmen“), höchstens 4 Wörter / 40 Zeichen. Noch einmal tippen = abwählen.
  var wahl = null;          // { p: Absatz, von: Index, bis: Index }
  var leiste2 = document.createElement('div');
  leiste2.className = 'f-parkleiste';
  leiste2.id = 'f-parkleiste';
  leiste2.setAttribute('role', 'region');
  leiste2.setAttribute('aria-label', F.begriffe.titel);
  leiste2.hidden = true;
  document.body.appendChild(leiste2);
  var leisteTimer = null;

  function woerterIn(p) { return Array.prototype.slice.call(p.querySelectorAll('.f-wort')); }
  function wahlText(w) {
    return woerterIn(w.p).slice(w.von, w.bis + 1).map(function (s) { return s.textContent.replace(/-$/, ''); }).join(' ');
  }
  function waehle(span) {
    var p = span.closest('p');
    if (!p) return;
    var i = woerterIn(p).indexOf(span);
    if (wahl && wahl.p === p) {
      if (i >= wahl.von && i <= wahl.bis) {
        if (wahl.von === wahl.bis) { leereWortauswahl(); return; }
        if (i === wahl.von) wahl.von++;
        else if (i === wahl.bis) wahl.bis--;
        else wahl = { p: p, von: i, bis: i };
      } else if (i === wahl.bis + 1 || i === wahl.von - 1) {
        var neu = { p: p, von: Math.min(i, wahl.von), bis: Math.max(i, wahl.bis) };
        wahl = (neu.bis - neu.von < 4 && wahlText(neu).length <= 40) ? neu : { p: p, von: i, bis: i };
      } else {
        wahl = { p: p, von: i, bis: i };
      }
    } else {
      wahl = { p: p, von: i, bis: i };
    }
    zeigeWahl();
  }
  function zeigeWahl() {
    Array.prototype.forEach.call(document.querySelectorAll('.f-gewaehlt'), function (s) { s.classList.remove('f-gewaehlt'); });
    if (!wahl) { leiste2.hidden = true; return; }
    woerterIn(wahl.p).slice(wahl.von, wahl.bis + 1).forEach(function (s) { s.classList.add('f-gewaehlt'); });
    var B = F.begriffe;
    clearTimeout(leisteTimer);
    leiste2.hidden = false;
    leiste2.innerHTML = '<div class="f-pl-zeile"><span class="f-pl-wort">„' + esc(wahlText(wahl)) + '“</span>' +
      '<button type="button" class="knopf f-pl-parken" id="f-pl-parken"><span aria-hidden="true">🅿️</span> ' + esc(B.tippKnopf) + '</button>' +
      '<button type="button" class="f-pl-zu" id="f-pl-zu" aria-label="Abbrechen">×</button></div>' +
      '<p class="f-pl-hinweis">' + esc(B.tippDazu) + '</p>';
    document.getElementById('f-pl-zu').onclick = leereWortauswahl;
    document.getElementById('f-pl-parken').onclick = function () {
      var w = wahlText(wahl);
      if (gesperrtesWort(w)) { leereWortauswahl(); return; }
      this.disabled = true;
      parke(w).then(function () {
        wahl = null;
        zeigeWahl();
        leiste2.hidden = false;
        leiste2.innerHTML = '<p class="f-pl-ok" role="status">✓ „' + esc(w) + '“ ' + esc(B.geparkt) + '</p>';
        leisteTimer = setTimeout(function () { if (!wahl) leiste2.hidden = true; }, 2500);
      }).catch(function () {
        leiste2.innerHTML = '<p class="f-pl-ok f-warnung" role="status">Nicht gesendet. Bitte noch einmal tippen.</p>';
        wahl = null;
        leisteTimer = setTimeout(function () { if (!wahl) leiste2.hidden = true; }, 3000);
      });
    };
  }
  function leereWortauswahl() { wahl = null; zeigeWahl(); }
  document.addEventListener('click', function (ev) {
    var s = ev.target.closest ? ev.target.closest('.f-wort') : null;
    if (s) waehle(s);
  });
  document.addEventListener('keydown', function (ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('f-wort')) {
      ev.preventDefault();
      waehle(ev.target);
    }
  });

  // ---------- Namenseingabe mit Klassenwahl (wie in den Übungen) ----------
  function zeigeName() {
    nameZeile.hidden = false;
    nameZeile.innerHTML = 'Angemeldet als ' + esc(name) + ' · ' + esc(klasseName(klasse)) +
      ' · <button type="button" class="link-knopf" id="name-aendern">ändern</button>';
    document.getElementById('name-aendern').addEventListener('click', frageName);
  }
  function frageName() {
    stoppe();
    teil.hidden = true;
    nameBereich.hidden = false;
    var klassenHtml = KLASSEN.map(function (k) {
      return '<label class="klasse-wahl"><input type="radio" name="klasse" value="' + esc(k.kuerzel) + '"' +
        (k.kuerzel === klasse ? ' checked' : '') + '><span>' + esc(k.name) + '</span></label>';
    }).join('');
    nameBereich.innerHTML = '<h2>Wer sind Sie?</h2><p>Geben Sie Ihren <strong>Vornamen</strong> und den <strong>ersten Buchstaben Ihres Nachnamens</strong> ein und wählen Sie Ihre <strong>Klasse</strong>.</p>' +
      '<form id="name-form" novalidate><label for="name-feld" class="unsichtbar">Name</label>' +
      '<input id="name-feld" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="30" placeholder="z. B. Lena K." value="' + esc(name || '') + '">' +
      '<fieldset class="klassen"><legend>Ihre Klasse:</legend>' + klassenHtml + '</fieldset>' +
      '<p class="name-fehler" id="name-fehler" role="alert" hidden></p>' +
      '<button type="submit" class="knopf">Los geht’s</button></form>' +
      '<p class="hinweis-klein">' + esc(H.datenschutz) + '</p>';
    var feld = document.getElementById('name-feld');
    document.getElementById('name-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = normalisiereName(feld.value);
      var gewaehlt = nameBereich.querySelector('input[name=klasse]:checked');
      var f = document.getElementById('name-fehler');
      if (!n) { f.textContent = 'Bitte so eingeben: Vorname, Leerzeichen, erster Buchstabe des Nachnamens – z. B. „Lena K.“'; f.hidden = false; feld.focus(); return; }
      if (!gewaehlt || !klasseName(gewaehlt.value)) { f.textContent = 'Bitte wählen Sie Ihre Klasse.'; f.hidden = false; return; }
      var klasseNeu = gewaehlt.value !== klasse;
      name = n;
      klasse = gewaehlt.value;
      setzeLokal(NAME, n);
      setzeLokal(KLASSE, klasse);
      nameBereich.hidden = true;
      nameBereich.innerHTML = '';
      teil.hidden = false;
      if (klasseNeu) { stand = null; gezeichnet = ''; }
      zeigeName();
      starte();
    });
  }

  if (!SERVER) {
    inhalt.innerHTML = '<p class="f-gross">' + esc(H.nichtEingerichtet) + '</p>';
    return;
  }
  if (name && klasse) { zeigeName(); starte(); } else { frageName(); }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* egal */ });
  }
})();

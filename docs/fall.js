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
  function falltextHtml(teile) {
    var absaetze = [];
    teile.forEach(function (t, i) {
      if (t.absatz || i === 0) absaetze.push(esc(t.text));
      else absaetze[absaetze.length - 1] += ' ' + esc(t.text);
    });
    return absaetze.map(function (a) { return '<p>' + a + '</p>'; }).join('');
  }
  function abschnitte(teil, art) {
    return F.text.filter(function (t) { return t.teil === teil && (!art || t.art === art); });
  }
  function hatAufloesung(schritt) { return schritt.art === 'station' && abschnitte(schritt.id, 'aufloesung').length > 0; }

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
    meine.antworten[frage] = wert;
    speichereMeine();
    ausstehend[frage] = wert;
    post('/fall/antwort', { raum: raum(), geraet: geraetId(), name: name, frage: frage, wert: wert })
      .then(function () { if (ausstehend[frage] === wert) delete ausstehend[frage]; zeigeLeiste(); })
      .catch(function () { setTimeout(function () { if (ausstehend[frage] === wert) sendeAntwort(frage, wert); }, 5000); zeigeLeiste(); });
  }
  function frage() {
    if (!SERVER || !name || !klasse) return;
    fetch(SERVER + '/fall/zustand?raum=' + encodeURIComponent(raum()), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (z) {
        verbunden = true;
        var neueSitzung = !stand || stand.sitzung !== z.sitzung;
        stand = z;
        if (neueSitzung) { ladeMeine(); auswahl = {}; }
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
    var schluessel = stand.sitzung + '|' + stand.schritt + '|' + stand.stufe;
    if (schluessel === gezeichnet && !erzwingen) return;   // nichts Neues – Eingaben nicht zerstören
    var gleicherSchritt = gezeichnet.split('|').slice(0, 2).join('|') === stand.sitzung + '|' + stand.schritt;
    gezeichnet = schluessel;
    if (!gleicherSchritt) { person = null; }
    var html = '';
    if (s.art === 'kaltstart') html = '<p class="f-gross">' + esc(s.handy) + '</p>';
    else if (s.art === 'fragen') html = fragenHtml(s);
    else if (s.art === 'station') html = stationHtml(s);
    else if (s.art === 'zurueckspulen') html = '<h2 class="f-titel">' + esc(s.titel) + '</h2><p class="f-vorspann">' + esc(s.vorspann) + '</p>' + frageHtml(s.frage, stand.stufe >= 1);
    else if (s.art === 'perspektiven') html = perspektivenHtml(s);
    else if (s.art === 'ende') html = '<h2 class="f-titel">' + esc(s.titel) + '</h2><p class="f-gross">' + esc(s.handy) + '</p>';
    inhalt.innerHTML = html;
    verbinde(s);
    zeichneBisher(s);
    zeichneParkplatz(s);
    if (!gleicherSchritt) window.scrollTo(0, 0);
  }

  function fragenHtml(s) {
    return '<h2 class="f-titel">' + esc(s.titel) + '</h2>' +
      s.fragen.map(function (q) { return frageHtml(q, stand.stufe >= 1); }).join('');
  }

  function stationHtml(s) {
    var auf = stand.stufe >= 2 && hatAufloesung(s);
    return '<h2 class="f-titel"><span class="nummer">' + s.nummer + '</span>' + esc(s.kurz) + '</h2>' +
      (s.bild ? '<img class="f-bild" src="' + esc(s.bild.datei.replace(/\.jpg$/, '-klein.jpg')) + '" alt="' + esc(s.bild.alt) + '" width="800" height="450">' : '') +
      '<div class="f-falltext">' + falltextHtml(abschnitte(s.id, 'frage')) + '</div>' +
      frageHtml(s.frage, stand.stufe >= 1) +
      (auf ? '<div class="f-aufloesung"><p class="f-auf-kopf">' + esc(H.christinErzaehlt) + '</p><div class="f-falltext">' +
        falltextHtml(abschnitte(s.id, 'aufloesung')) + '</div></div>' : '');
  }

  // Eine Frage: Ampel, Auswahl (eine Antwort), Mehrfachauswahl oder Skala
  function optionen(q) { return q.ampel ? F.ampel : q.optionen; }
  function frageHtml(q, gesperrt) {
    var gewaehlt = meine.antworten[q.id];
    var liste = gewaehlt === undefined ? [] : (Array.isArray(gewaehlt) ? gewaehlt : [gewaehlt]);
    if (q.mehrfach && !auswahl[q.id]) auswahl[q.id] = liste.slice();
    var aktiv = q.mehrfach ? auswahl[q.id] : liste;
    var art = q.ampel ? 'f-ampel' : (q.skala ? 'f-skala' : 'f-wahl');
    var knoepfe = optionen(q).map(function (o) {
      var an = aktiv.indexOf(o.kuerzel) >= 0;
      return '<button type="button" class="f-opt' + (o.farbe ? ' f-' + o.farbe : '') + (an ? ' f-an' : '') + '"' +
        ' data-frage="' + esc(q.id) + '" data-kuerzel="' + esc(o.kuerzel) + '" aria-pressed="' + (an ? 'true' : 'false') + '"' +
        (gesperrt ? ' disabled' : '') + '>' +
        (q.mehrfach ? '<span class="f-haken" aria-hidden="true">' + (an ? '☑' : '☐') + '</span>' : '') +
        (o.zeichen ? '<span aria-hidden="true">' + o.zeichen + '</span>' : '') +
        (q.skala ? '<strong>' + esc(o.kuerzel) + '</strong>' : '') +
        '<span>' + esc(o.text) + '</span></button>';
    }).join('');
    var status = '';
    if (gesperrt) status = '<p class="f-status">' + esc(H.gesperrt) + (liste.length ? '' : ' ' + esc(H.keineAntwort)) + '</p>';
    else if (liste.length && !q.mehrfach) status = '<p class="f-status f-ok">✓ ' + esc(H.gesendet) + '</p>';
    else if (liste.length && q.mehrfach && gleicheListe(liste, aktiv)) status = '<p class="f-status f-ok">✓ ' + esc(H.gesendet) + '</p>';
    return '<section class="f-frage" data-frage="' + esc(q.id) + '"><h3>' + esc(q.text) + '</h3>' +
      (q.hilfe ? '<p class="f-hilfe">' + esc(q.hilfe) + '</p>' : '') +
      '<div class="' + art + '" role="group" aria-label="' + esc(q.text) + '">' + knoepfe + '</div>' +
      (q.mehrfach && !gesperrt ? '<button type="button" class="knopf f-senden" data-senden="' + esc(q.id) + '"' +
        (aktiv.length ? '' : ' disabled') + '>' + esc(H.senden) + '</button>' : '') +
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
        if (!q || stand.stufe >= 1 && s.art !== 'perspektiven') return;
        if (q.mehrfach) {
          var a = auswahl[q.id];
          var i = a.indexOf(k);
          if (i >= 0) a.splice(i, 1); else a.push(k);
        } else {
          sendeAntwort(q.id, k);
        }
        var y = window.scrollY;
        neuZeichnen();
        window.scrollTo(0, y);
      });
    });
    Array.prototype.forEach.call(inhalt.querySelectorAll('[data-senden]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-senden');
        if (!auswahl[id] || !auswahl[id].length) return;
        sendeAntwort(id, auswahl[id].slice());
        var y = window.scrollY;
        neuZeichnen();
        window.scrollTo(0, y);
      });
    });
    if (s.art === 'perspektiven') verbindePerspektiven(s);
  }

  // ---------- Perspektiven-Runde ----------
  function perspektivenHtml(s) {
    var personen = s.personen.map(function (p) {
      return '<button type="button" class="f-person' + (person === p.id ? ' f-an' : '') + '" data-person="' + esc(p.id) + '" aria-pressed="' + (person === p.id) + '">' + esc(p.text) + '</button>';
    }).join('');
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
        '<button type="submit" class="knopf f-senden">' + esc(H.senden) + '</button></form>';
    }
    var eigene = meine.texte.filter(function (t) { return t.art === 'persp'; });
    var liste = eigene.length ? '<h3 class="f-unter">Ihre Antworten</h3><ul class="f-eigene">' + eigene.map(function (t) {
      var p = s.personen.filter(function (x) { return x.id === t.person; })[0];
      return '<li><strong>' + esc(p ? p.text : '') + '</strong>' + (t.a ? '<br>' + esc(t.a) : '') + (t.b ? '<br>❓ ' + esc(t.b) : '') + '</li>';
    }).join('') + '</ul>' : '';
    return '<h2 class="f-titel">' + esc(s.titel) + '</h2><p>' + fmt(s.auftrag) + '</p>' +
      '<div class="f-personen" role="group" aria-label="Person">' + personen + '</div>' + formular + liste;
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
        meine.texte.push({ art: 'persp', person: person, a: daten.a, b: daten.b });
        speichereMeine();
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
      if (x.art !== 'station' || i > index) return;
      var alles = i < index || s.art !== 'station';
      abschnitte(x.id).forEach(function (t) {
        if (alles || t.art === 'frage' || (t.art === 'aufloesung' && stand.stufe >= 2)) teile.push(t);
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
      '<button type="submit" class="knopf">' + esc(B.knopf) + '</button></form><p class="f-status" id="f-wort-status" role="status"></p>';
    document.getElementById('f-wort-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var feld = document.getElementById('f-wort');
      var st = document.getElementById('f-wort-status');
      var w = feld.value.replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!w) return;
      if (gesperrtesWort(w)) { st.textContent = 'Bitte formulieren Sie das anders.'; return; }
      post('/fall/text', { raum: raum(), geraet: geraetId(), name: name, art: 'begriff', a: w }).then(function (r) {
        if (r.status === 429) throw new Error('voll');
        feld.value = '';
        st.textContent = '✓ ' + B.danke;
      }).catch(function () { st.textContent = 'Nicht gesendet. Bitte noch einmal versuchen.'; });
    });
  }

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

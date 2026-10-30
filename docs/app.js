/* Programmlogik der Übungen (Zuordnen mit sofortiger Rückmeldung; Selbstkontrolle).
 * Alle Texte stehen in inhalte.js – hier muss für Textänderungen nichts angepasst werden. */
(function () {
  'use strict';

  var A = INHALTE.allgemein;
  var E = window.EINSTELLUNGEN || {};
  var id = document.body.getAttribute('data-uebung');
  var U = INHALTE[id];
  var CHECK = U.art === 'check';
  var PRAEFIX = 'kb2-notfall-';
  var SPEICHER = PRAEFIX + id;
  var GELOEST = PRAEFIX + 'geloest';
  var NAME = PRAEFIX + 'name';
  var KLASSE = PRAEFIX + 'klasse';
  var GERAET = PRAEFIX + 'geraet';
  var SERVER = String(E.serverAdresse || '').replace(/\/+$/, '');
  var KLASSEN = E.klassen || [];
  // Gegen Durchklicken (Werte in einstellungen.js)
  var SPERRE_MS = 1000 * (typeof E.sperreNachFehlerSekunden === 'number' ? Math.max(0, E.sperreNachFehlerSekunden) : 5);
  var ZS = E.zuSchnell || { fehler: 3, sekunden: 10 };
  var ZS_ANZAHL = typeof ZS.fehler === 'number' ? ZS.fehler : 3;
  var ZS_MS = 1000 * (typeof ZS.sekunden === 'number' ? ZS.sekunden : 10);
  var NEUSTARTS = PRAEFIX + id + '-neustarts';
  var FEHLERZEITEN = SPEICHER + '-fehlerzeiten';

  // ---------- Hilfsfunktionen ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(s) { // **fett** → <strong>, *kursiv* → <em>
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  }
  function ersetze(s, w) {
    return s.replace(/\{(\w)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; });
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

  // ---------- Name, Klasse und Fortschrittsanzeige ----------
  // Name: „Vorname X.“ – nur nötig, wenn in einstellungen.js eine serverAdresse steht.
  function normalisiereName(roh) {
    var t = String(roh || '').replace(/\s+/g, ' ').trim();
    var m = t.match(/^(.+) (\S)[^ ]*$/); // „Lena Kraus“ wird zu „Lena K.“
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
  function gespeichert(schluessel) {
    var l = lokal();
    try { return l ? l.getItem(schluessel) : null; } catch (e) { return null; }
  }
  var name = SERVER ? normalisiereName(gespeichert(NAME)) : null;
  var klasse = SERVER ? gespeichert(KLASSE) : null;
  if (!klasseName(klasse)) klasse = null;
  var wiederholung = null;

  function sende() {
    if (!SERVER || !name || !klasse || !U.raum) return;
    var daten = {
      raum: klasse + '-' + U.raum, uebung: id, geraet: geraetId(), name: name,
      geloest: anzahlGeloest(), gesamt: U.karten.length, erster: anzahlErsterVersuch(), neu: neustarts,
      // je Karte die zuerst gewählte falsche Antwort, z. B. "2-D" (für die Besprechung am Beamer);
      // bei der Selbstkontrolle: die Punkte, die als „fehlt“ markiert wurden, z. B. "5-NEIN"
      falsch: zustand.map(function (z, i) {
        if (CHECK) return z.gewaehlt === U.fehlt ? U.karten[i].nummer + '-' + U.fehlt : '';
        return z.falsch.length ? U.karten[i].nummer + '-' + z.falsch[0] : '';
      }).filter(function (x) { return x; })
    };
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

  // ---------- Zustand ----------
  function leererZustand() {
    return U.karten.map(function () { return { geloest: false, falsch: [], gewaehlt: null }; });
  }
  var zustand = lade(SPEICHER);
  if (!zustand || zustand.length !== U.karten.length) zustand = leererZustand();
  var fehlerZeiten = lade(FEHLERZEITEN) || [];
  var neustarts = Math.min(99, Math.max(0, Number(gespeichert(NEUSTARTS)) || 0));
  function gesperrt(z) { return !z.geloest && z.sperreBis && Date.now() < z.sperreBis; }

  // ---------- Seite aufbauen ----------
  document.title = U.titel + ' – ' + A.kopfzeile;
  document.getElementById('kopfzeile').textContent = A.kopfzeile + ' · ' + U.ab;
  document.getElementById('titel').textContent = U.titel;
  document.getElementById('anweisung').innerHTML = fmt(U.anweisung);
  document.getElementById('noch-einmal').textContent = CHECK ? A.nochEinmalCheck : A.nochEinmal;
  var nameBereich = document.getElementById('name-bereich');
  var zuSchnellEl = document.createElement('div');
  zuSchnellEl.id = 'zu-schnell';
  zuSchnellEl.className = 'zu-schnell';
  zuSchnellEl.setAttribute('role', 'alert');
  zuSchnellEl.hidden = true;
  document.getElementById('uebung-teil').insertBefore(zuSchnellEl, document.getElementById('anweisung'));
  var nameZeile = document.getElementById('name-zeile');
  var uebungTeil = document.getElementById('uebung-teil');

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
  if (CHECK) document.body.classList.add('art-check');

  // Lange Beschriftungen: Knöpfe auf schmalen Handys untereinander statt nebeneinander
  var laengste = Math.max.apply(null, U.knoepfe.map(function (b) { return b.text.length; }));
  var lang = (U.knoepfe.length >= 3 && laengste > 6) || laengste > 16;
  // Vier Knöpfe mit mittellangen Beschriftungen: auf dem Handy 2 × 2 statt untereinander
  var zweiMalZwei = U.knoepfe.length === 4 && laengste <= 16;

  var kartenBox = document.getElementById('karten');
  var kartenEl = [];

  U.karten.forEach(function (k, i) {
    var el = document.createElement('section');
    el.className = 'karte';
    el.setAttribute('aria-labelledby', 'k' + i + '-text');
    var knoepfe = U.knoepfe.map(function (b) {
      return '<button type="button" class="antwort" data-kuerzel="' + esc(b.kuerzel) + '">' +
        '<span class="symbol" aria-hidden="true"></span><span class="beschriftung">' + esc(b.text) + '</span></button>';
    }).join('');
    el.innerHTML =
      '<p class="karte-text" id="k' + i + '-text"><span class="nummer">' + esc(k.nummer) + '</span>' + fmt(k.text) + '</p>' +
      '<div class="knoepfe knoepfe-' + U.knoepfe.length + (zweiMalZwei ? ' knoepfe-2x2' : (lang ? ' knoepfe-lang' : '')) + '" role="group" aria-label="Antwort zu Karte ' + esc(k.nummer) + '">' + knoepfe + '</div>' +
      '<div class="rueckmeldung" role="status" aria-live="polite"></div>';
    kartenBox.appendChild(el);
    kartenEl.push(el);
    Array.prototype.forEach.call(el.querySelectorAll('.antwort'), function (btn) {
      btn.addEventListener('click', function () { antworte(i, btn.getAttribute('data-kuerzel')); });
    });
  });

  // ---------- Antworten ----------
  function antworte(i, kuerzel) {
    var z = zustand[i];
    if (CHECK) { // Selbstkontrolle: jede Antwort zählt, umentscheiden ist erlaubt
      if (z.gewaehlt === kuerzel) return;
      z.geloest = true;
      z.gewaehlt = kuerzel;
    } else {
      if (z.geloest || z.falsch.indexOf(kuerzel) >= 0 || gesperrt(z)) return;
      if (richtigeListe(U.karten[i]).indexOf(kuerzel) >= 0) {
        z.geloest = true;
        z.gewaehlt = kuerzel;
        z.sperreBis = 0;
      } else {
        z.falsch.push(kuerzel);
        if (SPERRE_MS) z.sperreBis = Date.now() + SPERRE_MS;
        if (zuSchnell()) return;
      }
    }
    speichere(SPEICHER, zustand);
    if (zustand[i].geloest) document.getElementById('zu-schnell').hidden = true;
    zeichneKarte(i, true);
    aktualisiere(true);
    sende();
  }

  // Zu viele falsche Antworten in kurzer Zeit: Übung beginnt von vorn (die Lehrerseite zeigt ↺)
  function zuSchnell() {
    if (!ZS_ANZAHL) return false;
    var jetzt = Date.now();
    fehlerZeiten = fehlerZeiten.filter(function (t) { return jetzt - t < ZS_MS; });
    fehlerZeiten.push(jetzt);
    speichere(FEHLERZEITEN, fehlerZeiten);
    if (fehlerZeiten.length < ZS_ANZAHL) return false;
    fehlerZeiten = [];
    speichere(FEHLERZEITEN, fehlerZeiten);
    neustarts = Math.min(99, neustarts + 1);
    var l = lokal();
    try { if (l) l.setItem(NEUSTARTS, String(neustarts)); } catch (e) { /* egal */ }
    zuruecksetzen();
    var h = document.getElementById('zu-schnell');
    h.innerHTML = '<h2>' + esc(A.zuSchnellTitel) + '</h2><p>' + esc(A.zuSchnellText) + '</p>';
    h.hidden = false;
    return true;
  }

  // Gesperrte Karten: Countdown anzeigen und nach Ablauf wieder freigeben
  setInterval(function () {
    zustand.forEach(function (z, i) {
      if (!z.sperreBis || z.geloest) return;
      if (Date.now() >= z.sperreBis) { z.sperreBis = 0; speichere(SPEICHER, zustand); }
      zeichneKarte(i, false);
    });
  }, 500);

  function zeichneKarte(i, frisch) {
    var k = U.karten[i], z = zustand[i], el = kartenEl[i];
    var rm = el.querySelector('.rueckmeldung');
    Array.prototype.forEach.call(el.querySelectorAll('.antwort'), function (btn) {
      var ku = btn.getAttribute('data-kuerzel');
      var sym = btn.querySelector('.symbol');
      btn.classList.remove('ist-richtig', 'ist-falsch', 'ist-gewaehlt', 'ist-fehlt');
      btn.disabled = false;
      btn.removeAttribute('aria-pressed');
      sym.textContent = '';
      if (CHECK) {
        if (z.gewaehlt) btn.setAttribute('aria-pressed', ku === z.gewaehlt ? 'true' : 'false');
        if (ku === z.gewaehlt) btn.classList.add(ku === U.fehlt ? 'ist-fehlt' : 'ist-gewaehlt');
        return;
      }
      if (z.falsch.indexOf(ku) >= 0) { btn.classList.add('ist-falsch'); btn.disabled = true; sym.textContent = '✗'; }
      if (gesperrt(z)) btn.disabled = true;
      if (z.geloest) {
        btn.disabled = true;
        if (ku === z.gewaehlt) { btn.classList.add('ist-richtig'); sym.textContent = '✓'; }
      }
    });
    if (CHECK) {
      el.classList.toggle('karte-erfuellt', z.geloest && z.gewaehlt !== U.fehlt);
      el.classList.toggle('karte-fehlt', z.geloest && z.gewaehlt === U.fehlt);
      if (!z.geloest) { rm.className = 'rueckmeldung'; rm.innerHTML = ''; return; }
      var fehlt = z.gewaehlt === U.fehlt;
      rm.className = 'rueckmeldung ' + (fehlt ? 'falsch' : 'richtig');
      rm.innerHTML = '<p>' + esc(fehlt ? A.checkNein : A.checkJa) + '</p>';
      return;
    }
    el.classList.toggle('karte-richtig', z.geloest);
    el.classList.toggle('karte-tipp', !z.geloest && z.falsch.length > 0);
    if (z.geloest) {
      rm.className = 'rueckmeldung richtig';
      rm.innerHTML = '<p class="rm-kopf"><span aria-hidden="true">✓</span> ' + esc(A.richtigText) + '</p><p>' + fmt(erklaerungFuer(k, z.gewaehlt)) + '</p>';
    } else if (z.falsch.length) {
      rm.className = 'rueckmeldung falsch';
      rm.innerHTML = '<p class="rm-kopf"><span aria-hidden="true">✗</span> ' + esc(A.falschText) + '</p><p><strong>' + esc(A.tippVorwort) + '</strong> ' + fmt(k.tipp) + '</p>' +
        (gesperrt(z) ? '<p class="sperre">' + esc(ersetze(A.sperreText, { x: Math.ceil((z.sperreBis - Date.now()) / 1000) })) + '</p>' : '');
    } else {
      rm.className = 'rueckmeldung';
      rm.innerHTML = '';
    }
  }

  function anzahlGeloest() { return zustand.filter(function (z) { return z.geloest; }).length; }
  function anzahlErsterVersuch() {
    if (CHECK) return zustand.filter(function (z) { return z.geloest && z.gewaehlt !== U.fehlt; }).length;
    return zustand.filter(function (z) { return z.geloest && z.falsch.length === 0; }).length;
  }

  function aktualisiere(frisch) {
    var n = U.karten.length, g = anzahlGeloest();
    document.getElementById('fortschritt-text').textContent = ersetze(CHECK ? A.fortschrittCheck : A.fortschritt, { x: g, y: n });
    document.getElementById('fortschritt-balken').style.width = (100 * g / n) + '%';
    var bereich = document.getElementById('merksatz-bereich');
    var warSichtbar = !bereich.hidden;
    if (g < n) { bereich.hidden = true; bereich.innerHTML = ''; return; }

    var erster = anzahlErsterVersuch();
    var mind = U.mindestens || 0;
    bereich.hidden = false;
    if (!CHECK && erster < mind) {
      bereich.className = 'durchklicken';
      bereich.innerHTML = '<h2>' + esc(A.durchklickenTitel) + '</h2><p>' +
        esc(ersetze(A.durchklickenText, { x: erster, y: n, z: mind })) + '</p>' +
        '<button type="button" class="knopf" id="neu-start">' + esc(A.durchklickenKnopf) + '</button>';
      document.getElementById('neu-start').addEventListener('click', zuruecksetzen);
    } else {
      bereich.className = 'abschluss';
      bereich.innerHTML =
        '<div class="weiter" role="status"><p class="weiter-titel"><span aria-hidden="true">✓</span> ' + esc(ersetze(A.fertigTitel, { x: U.titel.split(':')[0] })) + '</p>' +
        (U.danach ? '<p class="weiter-text">' + fmt(U.danach) + '</p>' : '') + '</div>' +
        '<div class="merksatz"><h2><span aria-hidden="true">📝</span> ' + esc(A.merksatzUeberschrift) + '</h2>' +
        '<p class="merksatz-text">' + fmt(U.merksatz) + '</p>' +
        '<p class="erster-versuch">' + esc(ersetze(CHECK ? A.checkErgebnis : A.ersterVersuch, { x: erster, y: n })) + '</p></div>';
      var l = lokal();
      if (l) {
        var geloest = lade(GELOEST, l) || {};
        geloest[id] = Date.now();
        speichere(GELOEST, geloest, l);
      }
    }
    // Bei der Selbstkontrolle nur beim ersten Erscheinen hinunterscrollen (Umentscheiden soll nicht springen)
    if (frisch && !(CHECK && warSichtbar)) {
      setTimeout(function () {
        try { bereich.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { bereich.scrollIntoView(); }
      }, 150);
    }
  }

  function zuruecksetzen() {
    document.getElementById('zu-schnell').hidden = true;
    zustand = leererZustand();
    speichere(SPEICHER, zustand);
    var l = lokal();
    if (l) {
      var geloest = lade(GELOEST, l) || {};
      delete geloest[id];
      speichere(GELOEST, geloest, l);
    }
    kartenEl.forEach(function (el, i) { zeichneKarte(i, false); });
    aktualisiere(false);
    sende();
    window.scrollTo(0, 0);
  }

  document.getElementById('noch-einmal').addEventListener('click', zuruecksetzen);

  kartenEl.forEach(function (el, i) { zeichneKarte(i, false); });
  aktualisiere(false);

  // ---------- Namenseingabe mit Klassenwahl ----------
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
      sende();
    });
  }
  if (SERVER) {
    if (name && klasse) { zeigeName(); sende(); } else { frageName(); }
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* egal */ });
  }
})();

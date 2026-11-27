/* Minispiele zur Belohnung (seit 27.11.2026): „Herzdruck-Takt“, „Wespen-Alarm“, „Stör-Abwehr“.
 * Aufruf: minispiel.html?ab=kb2ab05 – nur freigeschaltet, wenn die Übung auf diesem Handy geschafft wurde.
 * Welche Übung welches Minispiel freischaltet, steht in inhalte.js (minispiel: 'herzdruck' | 'wespen' | 'stoerung').
 * Regeln (einstellungen.js): eine Runde dauert höchstens minispielSekunden (30), pro Freischaltung gibt es
 * minispielLaeufe (3) Läufe. Wer die Übung noch einmal schafft, bekommt neue Läufe.
 * Gesendet wird – wie bei „Notfall-Run!“ – nur die Bestleistung (eine Zahl); sie erscheint auf der Lehrerseite (🎮).
 * Dieses Gerüst kümmert sich um Freischaltung, Läufe, Uhr, Punkte, Herzen und Senden; die Spiele selbst stehen in
 * ms-herzdruck.js, ms-wespen.js und ms-stoerung.js (Texte jeweils oben in der Datei). */
(function () {
  'use strict';

  var E = window.EINSTELLUNGEN || {};
  var I = window.INHALTE || {};
  var SPIELE = window.MINISPIELE || {};
  var PRAEFIX = 'kb2-notfall-';   // eigener Speicher je Übung
  var GEMEINSAM = 'kb2-notfall-'; // Name, Klasse und Geräte-Kennung (gemeinsam mit den KB-I-Übungen)
  var SERVER = String(E.serverAdresse || '').replace(/\/+$/, '');
  var KLASSEN = E.klassen || [];
  var SEKUNDEN = Math.max(2, Math.min(30, Number(E.minispielSekunden) || 30));
  var LAEUFE = Math.max(1, Math.min(10, Math.round(Number(E.minispielLaeufe) || 3)));
  var FREI_MS = 12 * 3600000; // Freischaltung und Bestleistung gelten 12 Stunden (wie die Lehrerseite)

  var T = {
    gesperrt: 'Das Minispiel öffnet sich, wenn Sie die Übung „{titel}“ geschafft haben.',
    zurUebungKnopf: 'Zur Übung',
    zurUebung: '← Zurück zur Übung',
    unbekannt: 'Dieses Minispiel gibt es nicht. Öffnen Sie die Übung über den QR-Code auf dem Arbeitsblatt.',
    regel: '{s} Sekunden pro Runde · {y} Läufe',
    laeufe: 'Noch {x} von {y} Läufen',
    laeufeLeer: 'Ihre {y} Läufe sind verbraucht. Schaffen Sie die Übung noch einmal – dann gibt es {y} neue Läufe.',
    best: 'Ihre Bestleistung: {x} Punkte',
    los: '▶ Los!',
    ende: '⏱ Zeit um!',
    endeFrueh: 'Runde vorbei!',
    punkte: '{x} Punkte',
    neueBest: '🎉 Neue Bestleistung!',
    nochmal: '▶ Noch einmal ({x} übrig)',
    letzter: 'Das war Ihr letzter Lauf. Weiter geht es auf dem Arbeitsblatt!',
    wusstest: 'Schon gewusst?',
    pausiert: '⏸ Pausiert – hier tippen zum Weiterspielen',
    tonAn: '🔊 Ton: an',
    tonAus: '🔇 Ton: aus',
    statusGesendet: '✓ Ihre Bestleistung steht auf dem Beamer.',
    statusWartet: 'Bestleistung wird gesendet …',
    statusNichtAufListe: 'Ihr Name steht nicht (mehr) auf der Liste. Öffnen Sie die Übung noch einmal, dann zählt die Bestleistung.'
  };

  /* ---------- Hilfsfunktionen und Speicher (nur auf diesem Gerät) ---------- */
  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function ersetze(s, w) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; }); }
  function lokal() { try { return window.localStorage; } catch (e) { return null; } }
  function liesText(k) { var l = lokal(); try { return l ? l.getItem(k) : null; } catch (e) { return null; } }
  function lies(k) { try { var s = liesText(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function schreib(k, w) { var l = lokal(); try { if (l) l.setItem(k, JSON.stringify(w)); } catch (e) { /* egal */ } }
  function frisch(um) { return typeof um === 'number' && um <= Date.now() + 60000 && Date.now() - um < FREI_MS; }
  function zahl(n) { return Math.round(n).toLocaleString('de-DE'); }

  var AB = '';
  try { AB = new URLSearchParams(location.search).get('ab') || ''; } catch (e) { AB = ''; }
  var U = /^[a-z0-9]{1,12}$/.test(AB) && I[AB] && I[AB].minispiel ? I[AB] : null;
  var S = U ? SPIELE[U.minispiel] : null;
  var TITEL_UEBUNG = U ? U.titel.replace(/^Übung:\s*/, '') : '';

  function freiSeit() { var f = (lies(PRAEFIX + 'spiel-frei') || {})[AB]; return frisch(f) ? f : 0; }
  function laeufeGenutzt() {
    var l = (lies(PRAEFIX + 'minispiel-laeufe') || {})[AB];
    return l && l.frei === freiSeit() ? l.n : 0;  // neue Freischaltung → neue Läufe
  }
  function laufZaehlen() {
    var alle = lies(PRAEFIX + 'minispiel-laeufe') || {};
    alle[AB] = { frei: freiSeit(), n: laeufeGenutzt() + 1 };
    schreib(PRAEFIX + 'minispiel-laeufe', alle);
  }
  function uebrig() { return Math.max(0, LAEUFE - laeufeGenutzt()); }

  var BEST = PRAEFIX + 'spiel-best-' + AB;
  function persoenlicheBest() { var b = lies(BEST); return b && typeof b.punkte === 'number' && frisch(b.um) ? b.punkte : 0; }

  // Name, Klasse und Geräte-Kennung hat die Übung gespeichert (dieselben wie auf der Lehrerseite)
  var klasse = liesText(GEMEINSAM + 'klasse');
  var klasseInfo = KLASSEN.filter(function (k) { return k.kuerzel === klasse; })[0] || null;
  var name = liesText(GEMEINSAM + 'name');
  if (typeof name !== 'string' || name.length < 3 || name.length > 24) name = null;
  var geraet = liesText(GEMEINSAM + 'geraet');
  if (!geraet || !/^[a-f0-9]{16,64}$/.test(geraet)) geraet = null;
  var RAUM = U && U.raum && klasseInfo && name && geraet ? klasse + '-' + U.raum : null;

  /* ---------- Bestleistung an die Lehrerseite senden (nie während eines Laufs) ---------- */
  var senden = { zustand: SERVER && RAUM ? 'wartet' : 'aus', timer: null };
  var statusElement = null;
  function sendeBest() {
    if (senden.zustand === 'aus' || modus === 'lauf') return;
    var p = persoenlicheBest();
    if (p <= 0) return;
    if (senden.timer) { clearTimeout(senden.timer); senden.timer = null; }
    var nochmal = function () {
      senden.zustand = 'wartet';
      statusZeigen();
      senden.timer = setTimeout(function () { senden.timer = null; sendeBest(); }, 10000);
    };
    try {
      fetch(SERVER + '/spiel', {
        method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ raum: RAUM, geraet: geraet, punkte: p }), keepalive: true
      }).then(function (r) {
        if (r.ok) senden.zustand = 'ok';
        else if (r.status === 404) senden.zustand = 'fehlt';
        else return nochmal();
        statusZeigen();
      }).catch(nochmal);
    } catch (e) { nochmal(); }
  }
  function statusZeigen() {
    if (!statusElement) return;
    var text = senden.zustand === 'ok' ? T.statusGesendet : senden.zustand === 'fehlt' ? T.statusNichtAufListe :
      senden.zustand === 'wartet' && persoenlicheBest() > 0 ? T.statusWartet : '';
    statusElement.textContent = text;
    statusElement.hidden = !text;
  }

  /* ---------- Ton (nur wenn eingeschaltet; Standard: aus) ---------- */
  var tonAn = liesText(PRAEFIX + 'minispiel-ton') === '1';
  var audio = null;
  function ton(frequenz, dauer) {
    if (!tonAn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = frequenz || 880;
      g.gain.setValueAtTime(0.12, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + (dauer || 0.06));
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + (dauer || 0.06));
    } catch (e) { /* ohne Ton */ }
  }

  /* ---------- Seite ---------- */
  var body = document.body;
  var panel = document.getElementById('ms-panel');
  var leiste = document.getElementById('ms-leiste');
  var feld = document.getElementById('ms-feld');
  var modus = '';

  function panelLeeren() {
    panel.textContent = '';
    panel.hidden = false;
    statusElement = null;
    var innen = el('div', 'ms-innen');
    panel.appendChild(innen);
    panel.scrollTop = 0;
    return innen;
  }
  function knopf(text, klasse, fn) {
    var b = el('button', 'ms-knopf' + (klasse ? ' ' + klasse : ''), text);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function kopf(p) {
    var k = el('div', 'ms-kopf');
    k.appendChild(el('span', 'ms-symbol', S ? S.symbol : '🎮'));
    var t = el('div');
    t.appendChild(el('h1', null, S ? S.titel : 'Minispiel'));
    if (S && S.bezug) t.appendChild(el('p', 'ms-bezug', S.bezug));
    k.appendChild(t);
    p.appendChild(k);
  }
  function zurUebung(p) {
    var a = el('a', 'ms-link', T.zurUebung);
    a.href = U ? AB + '.html' : 'index.html';
    a.id = 'link-uebung';
    p.appendChild(a);
  }
  function statusZeile(p) {
    statusElement = el('p', 'ms-status');
    statusElement.id = 'spiel-status';
    statusElement.setAttribute('role', 'status');
    p.appendChild(statusElement);
    statusZeigen();
  }
  function menue(n) {
    modus = n;
    body.classList.remove('ms-lauf');
    leiste.hidden = true;
    feld.hidden = true;
  }

  function zeigeGesperrt() {
    menue('gesperrt');
    var p = panelLeeren();
    kopf(p);
    if (U && S) {
      p.appendChild(el('p', null, ersetze(T.gesperrt, { titel: TITEL_UEBUNG })));
      var a = el('a', 'ms-knopf', T.zurUebungKnopf);
      a.href = AB + '.html';
      p.appendChild(a);
    } else {
      p.appendChild(el('p', null, T.unbekannt));
    }
  }

  function zeigeStart() {
    if (!U || !S || !freiSeit()) { zeigeGesperrt(); return; }
    menue('start');
    var p = panelLeeren();
    kopf(p);
    if (name) p.appendChild(el('p', 'ms-name', name + (klasseInfo ? ' · ' + klasseInfo.name : '')));
    p.appendChild(el('p', null, S.idee));
    if (S.steuerung) p.appendChild(el('p', 'ms-steuerung', S.steuerung));
    p.appendChild(el('p', 'ms-regel', ersetze(T.regel, { s: SEKUNDEN, y: LAEUFE })));
    if (persoenlicheBest() > 0) p.appendChild(el('p', 'ms-best', ersetze(T.best, { x: zahl(persoenlicheBest()) })));
    if (uebrig() > 0) {
      var l = el('p', 'ms-laeufe', ersetze(T.laeufe, { x: uebrig(), y: LAEUFE }));
      l.id = 'ms-laeufe';
      p.appendChild(l);
      var los = knopf(T.los, '', laufStarten);
      los.id = 'knopf-los';
      p.appendChild(los);
      if (S.ton) {
        var t = knopf(tonAn ? T.tonAn : T.tonAus, 'ms-knopf-zweit', function () {
          tonAn = !tonAn;
          try { lokal().setItem(PRAEFIX + 'minispiel-ton', tonAn ? '1' : '0'); } catch (e) { /* egal */ }
          t.textContent = tonAn ? T.tonAn : T.tonAus;
          if (tonAn) ton(880, 0.05);
        });
        t.id = 'knopf-ton';
        p.appendChild(t);
      }
    } else {
      var leer = el('p', 'ms-hinweis', ersetze(T.laeufeLeer, { y: LAEUFE }));
      leer.id = 'ms-laeufe';
      p.appendChild(leer);
    }
    statusZeile(p);
    zurUebung(p);
    sendeBest();
  }

  /* ---------- Ein Lauf ---------- */
  var lauf = null;

  function leisteZeichnen() {
    if (!lauf) return;
    var rest = Math.max(0, SEKUNDEN * 1000 - lauf.zeit);
    lauf.balken.style.width = (100 * rest / (SEKUNDEN * 1000)) + '%';
    lauf.zeitText.textContent = Math.ceil(rest / 1000) + ' s';
    lauf.punkteText.textContent = ersetze(T.punkte, { x: zahl(Math.max(0, lauf.punkte)) });
    if (lauf.leben !== null) {
      var h = '';
      for (var i = 0; i < (S.leben || 0); i++) h += i < lauf.leben ? '❤️' : '🤍';
      lauf.herzText.textContent = h;
    }
  }

  function meldung(text, art) {
    if (!lauf) return;
    var m = lauf.meldung;
    m.textContent = text;
    m.className = 'ms-meldung zeigen' + (art ? ' ms-' + art : '');
    clearTimeout(lauf.meldungTimer);
    lauf.meldungTimer = setTimeout(function () { m.className = 'ms-meldung'; }, 1300);
  }
  function schwebe(text, x, y, art) {
    var s = el('div', 'ms-schwebe' + (art ? ' ms-' + art : ''), text);
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    feld.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 800);
  }
  function blitz(art) {
    feld.classList.remove('ms-blitz-schlecht', 'ms-blitz-gut');
    void feld.offsetWidth;
    feld.classList.add('ms-blitz-' + (art || 'schlecht'));
  }

  function laufStarten() {
    if (uebrig() <= 0 || modus === 'countdown' || modus === 'lauf') return;
    laufZaehlen();
    modus = 'countdown';
    body.classList.add('ms-lauf');
    panel.hidden = true;
    leiste.hidden = false;
    feld.hidden = false;
    feld.textContent = '';
    feld.className = '';
    leiste.textContent = '';
    var zeit = el('div', 'ms-zeit');
    var balken = el('span');
    zeit.appendChild(balken);
    var zeitText = el('span', 'ms-zeit-text');
    var punkteText = el('span', 'ms-punkte');
    punkteText.id = 'ms-punkte';
    var herzText = el('span', 'ms-herzen');
    herzText.id = 'ms-herzen';
    leiste.appendChild(zeitText);
    leiste.appendChild(zeit);
    leiste.appendChild(punkteText);
    if (S.leben) leiste.appendChild(herzText);
    var m = el('div', 'ms-meldung');
    m.id = 'ms-meldung';
    lauf = { zeit: 0, punkte: 0, leben: S.leben ? S.leben : null, balken: balken, zeitText: zeitText, punkteText: punkteText,
      herzText: herzText, meldung: m, meldungTimer: null, vorbei: false, pause: false, spiel: null, letzte: 0, raf: 0 };
    var api = {
      sekunden: SEKUNDEN,
      zeit: function () { return lauf ? lauf.zeit : 0; },
      anteil: function () { return lauf ? Math.min(1, lauf.zeit / (SEKUNDEN * 1000)) : 0; },
      laeuft: function () { return !!lauf && modus === 'lauf' && !lauf.pause && !lauf.vorbei; },
      punkte: function (n) { if (lauf && !lauf.vorbei) { lauf.punkte += n; leisteZeichnen(); } },
      leben: function (n) {
        if (!lauf || lauf.leben === null || lauf.vorbei) return lauf ? lauf.leben : 0;
        if (n !== undefined) { lauf.leben = Math.max(0, Math.min(S.leben, n)); leisteZeichnen(); if (lauf.leben === 0) setTimeout(function () { laufEnde(true); }, 450); }
        return lauf.leben;
      },
      meldung: meldung,
      schwebe: schwebe,
      blitz: blitz,
      ton: ton,
      vibriere: function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 60); } catch (e) { /* egal */ } },
      ende: function () { laufEnde(true); }
    };
    lauf.spiel = S.neu(feld, api);
    feld.appendChild(m);
    leisteZeichnen();
    // Countdown 3 – 2 – 1 (zählt nicht zur Spielzeit)
    var cd = el('div', 'ms-countdown', '3');
    cd.id = 'ms-countdown';
    feld.appendChild(cd);
    var n = 3;
    var schritt = function () {
      n -= 1;
      if (!lauf) return;
      if (n > 0) { cd.textContent = String(n); ton(660, 0.05); setTimeout(schritt, 600); return; }
      if (cd.parentNode) cd.parentNode.removeChild(cd);
      ton(990, 0.08);
      modus = 'lauf';
      lauf.letzte = performance.now();
      lauf.raf = requestAnimationFrame(rahmen);
    };
    setTimeout(schritt, 600);
  }

  function rahmen(jetzt) {
    if (!lauf || lauf.vorbei) return;
    var dt = Math.min(50, Math.max(0, jetzt - lauf.letzte));
    lauf.letzte = jetzt;
    if (!lauf.pause) {
      lauf.zeit += dt;
      if (lauf.spiel.tick) lauf.spiel.tick(dt, lauf.zeit);
      leisteZeichnen();
      if (lauf.zeit >= SEKUNDEN * 1000) { laufEnde(false); return; }
    }
    lauf.raf = requestAnimationFrame(rahmen);
  }

  function laufEnde(frueh) {
    if (!lauf || lauf.vorbei) return;
    lauf.vorbei = true;
    cancelAnimationFrame(lauf.raf);
    if (lauf.spiel.stopp) lauf.spiel.stopp();
    var punkte = Math.max(0, Math.round(lauf.punkte));
    var zeilen = lauf.spiel.ergebnis ? lauf.spiel.ergebnis() : [];
    var neu = punkte > persoenlicheBest();
    if (neu) schreib(BEST, { punkte: punkte, um: Date.now() });
    lauf = null;
    zeigeEnde(punkte, neu && punkte > 0, frueh, zeilen);
  }

  function zeigeEnde(punkte, neu, frueh, zeilen) {
    menue('ende');
    var p = panelLeeren();
    p.appendChild(el('h2', null, frueh ? T.endeFrueh : T.ende));
    var g = el('p', 'ms-gross', ersetze(T.punkte, { x: zahl(punkte) }));
    g.id = 'ergebnis-punkte';
    p.appendChild(g);
    if (neu) p.appendChild(el('p', 'ms-neu', T.neueBest));
    (zeilen || []).forEach(function (z) { p.appendChild(el('p', 'ms-zeile', z)); });
    if (persoenlicheBest() > 0) p.appendChild(el('p', 'ms-best', ersetze(T.best, { x: zahl(persoenlicheBest()) })));
    if (uebrig() > 0) {
      var n = knopf(ersetze(T.nochmal, { x: uebrig() }), '', laufStarten);
      n.id = 'knopf-nochmal';
      p.appendChild(n);
    } else {
      var l = el('p', 'ms-hinweis', T.letzter);
      l.id = 'ms-letzter';
      p.appendChild(l);
      var a = el('a', 'ms-knopf', T.zurUebungKnopf);
      a.href = AB + '.html';
      p.appendChild(a);
    }
    var liste = S.wusstest || [];
    if (liste.length) {
      var w = el('div', 'ms-wusstest');
      w.appendChild(el('strong', null, T.wusstest));
      w.appendChild(el('span', null, liste[Math.floor(Math.random() * liste.length)]));
      p.appendChild(w);
    }
    statusZeile(p);
    zurUebung(p);
    sendeBest();
  }

  /* ---------- Pause, wenn das Handy die Seite verlässt ---------- */
  var pauseKnopf = null;
  function pausieren() {
    if (!lauf || modus !== 'lauf' || lauf.pause) return;
    lauf.pause = true;
    pauseKnopf = knopf(T.pausiert, 'ms-pause', function () {
      if (lauf) { lauf.pause = false; lauf.letzte = performance.now(); if (lauf.spiel.weiter) lauf.spiel.weiter(); }
      if (pauseKnopf && pauseKnopf.parentNode) pauseKnopf.parentNode.removeChild(pauseKnopf);
      pauseKnopf = null;
    });
    pauseKnopf.id = 'ms-pause';
    feld.appendChild(pauseKnopf);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pausieren(); });
  window.addEventListener('pagehide', pausieren);

  document.title = (S ? S.titel : 'Minispiel') + ' – Minispiel';
  zeigeStart();

  // Für die automatischen Tests: Zustand abfragen und einzelne Dinge im Spiel erzeugen
  window.MiniSpiel = {
    zustand: function () { return { modus: modus, punkte: lauf ? lauf.punkte : null, leben: lauf ? lauf.leben : null, uebrig: uebrig() }; },
    erzeuge: function (art, opt) { return lauf && lauf.spiel && lauf.spiel.erzeuge ? lauf.spiel.erzeuge(art, opt || {}) : null; }
  };
})();

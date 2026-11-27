/* Lehrerseite für den Beamer: zeigt live, wie weit eine Klasse mit den Übungen eines Arbeitsblatts ist.
 * Je Klasse und Arbeitsblatt eine eigene Seite, z. B. lehrer-3bfp2-2-ab1.html (ohne Kennwort). */
(function () {
  'use strict';

  var E = window.EINSTELLUNGEN || {};
  var SERVER = String(E.serverAdresse || '').replace(/\/+$/, '');
  var SEKUNDEN = Math.max(2, Number(E.aktualisierenSekunden) || 5);
  var raum = document.body.getAttribute('data-raum');           // z. B. 'k2-ab1'
  var ab = raum.split('-')[1];                                   // z. B. 'ab1'
  var UEBUNGEN = Object.keys(INHALTE).filter(function (k) { return INHALTE[k].raum === ab; });
  // Gibt es auf diesem Arbeitsblatt eine Übung mit Belohnungsspiel? Dann steht die Bestleistung neben dem Namen.
  var MIT_SPIEL = UEBUNGEN.some(function (k) { return INHALTE[k].belohnungsspiel || INHALTE[k].minispiel; });
  var SPIEL_NAMEN = { herzdruck: 'Herzdruck-Takt', wespen: 'Wespen-Alarm', stoerung: 'Stör-Abwehr' };
  var SPIEL_NAME = UEBUNGEN.map(function (k) {
    return INHALTE[k].minispiel ? SPIEL_NAMEN[INHALTE[k].minispiel] || INHALTE[k].minispiel : INHALTE[k].belohnungsspiel ? 'Notfall-Run!' : '';
  }).filter(Boolean).join('“, „');
  // Wochen (kb1w1 … kb2w4) haben eine Wochen-Challenge, kb1w5/kb2w5 ist die TB2-Challenge zur Wiederholung (11.01.).
  var MIT_CHALLENGE = /^kb[12]w[1-5]$/.test(ab);
  var GESAMT_CHALLENGE = /^kb[12]w5$/.test(ab);
  var CHALLENGE_URL = location.href.replace(/[^/]*([?#].*)?$/, '') + 'challenge-' + ab + '.html?offen=1';
  var letzteBestenliste = [];

  var inhalt = document.getElementById('l-inhalt');
  var status = document.getElementById('l-status');
  var fuss = document.getElementById('l-fuss');
  var letzterStand = null, timer = null;
  var fehlerJeUebung = {}; // uid → [{ nr, anzahl, wahl: {kuerzel: anzahl} }] (für die Besprechung)

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(s) { // **fett** → <strong>, *kursiv* → <em>
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  }
  function kurz(s, n) {
    s = String(s).replace(/\*/g, '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function uhrzeit(ms) {
    var d = new Date(ms);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
  }

  // ---------- Server ----------
  function hole() {
    var url = SERVER + '/stand?raum=' + encodeURIComponent(raum);
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('Server antwortet mit ' + r.status);
      return r.json();
    }).then(function (daten) {
      letzterStand = daten;
      zeichne(daten);
      status.textContent = 'Stand ' + uhrzeit(daten.jetzt || Date.now()) + ' · ' + daten.eintraege.length +
        ' angemeldet · aktualisiert alle ' + SEKUNDEN + ' s';
      status.className = 'l-status';
    }).catch(function () {
      status.textContent = 'Keine Verbindung zum Server' + (letzterStand ? ' – angezeigt wird der letzte Stand' : '');
      status.className = 'l-status l-warnung';
    });
  }

  function sende(pfad, daten) {
    return fetch(SERVER + pfad, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(Object.assign({ raum: raum }, daten || {}))
    });
  }

  // ---------- Anzeige ----------
  function zeichne(daten) {
    var leute = daten.eintraege.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    var spitze = MIT_SPIEL ? Math.max.apply(null, [0].concat(leute.map(function (p) { return Number(p.spiel) || 0; }))) : 0;
    inhalt.innerHTML = UEBUNGEN.map(function (uid) {
      var U = INHALTE[uid];
      var n = U.karten.length;
      var mind = U.mindestens || 0;
      var zeilen = leute.map(function (p) {
        var u = (p.uebungen || {})[uid];
        var g = u ? Math.min(u.geloest, n) : -1;
        // Sterne gibt es erst am Ende – wer sie hat, hat die Übung mindestens einmal geschafft (auch wenn
        // „Noch einmal üben – für mehr Sterne“ den Zähler auf dem Handy gerade wieder auf 0 gesetzt hat).
        var schon = !!(u && u.sterne);
        return { p: p, u: u, g: g, fertig: g === n || schon, wieder: schon && g < n, klick: g === n && u.erster < mind };
      });
      var fertig = zeilen.filter(function (z) { return z.fertig; }).length;
      var dabei = zeilen.filter(function (z) { return z.g > 0 && !z.fertig; }).length;
      var gesamt = zeilen.length;
      var offen = gesamt - fertig - dabei;
      zeilen.sort(function (a, b) {
        if (a.fertig !== b.fertig) return a.fertig ? -1 : 1;
        if (a.g !== b.g) return b.g - a.g;
        return a.p.name.localeCompare(b.p.name, 'de');
      });
      var pillen = zeilen.map(function (z) {
        var anteil = z.fertig ? 100 : (z.g > 0 ? Math.round(100 * z.g / n) : 0);
        var art = z.fertig ? (z.klick && !(z.u && z.u.sterne) ? 'l-pille l-klick' : 'l-pille l-fertig') : (z.g > 0 ? 'l-pille l-dabei' : 'l-pille l-offen');
        var erster = z.u ? Math.min(z.u.erster, n) : 0;
        var neu = z.u && z.u.neu ? z.u.neu : 0;
        // fertig: ✓ bzw. ⚠ mit der Zahl der Karten, die beim ERSTEN Versuch richtig waren; sonst: gelöst/gesamt
        var sterne = z.u && z.u.sterne ? z.u.sterne : 0;
        var stand = z.fertig ? (sterne ? '★★★'.slice(0, sterne) + '☆☆☆'.slice(0, 3 - sterne) : (z.klick ? '⚠ ' : '✓ ') + erster + '/' + n) : (z.g >= 0 ? z.g + '/' + n : '–');
        if (neu) stand += ' ↺' + (neu > 1 ? neu : '');
        var punkte = MIT_SPIEL ? Number(z.p.spiel) || 0 : 0;
        var titel = (z.wieder ? 'fertig – beste Wertung ' + sterne + ' von 3 Sternen · übt gerade noch einmal (' + Math.max(0, z.g) + ' von ' + n + ')' :
          z.fertig ? 'fertig – ' + (sterne ? sterne + ' von 3 Sternen, ' : '') + 'beim ersten Versuch richtig: ' + erster + ' von ' + n :
          (z.g >= 0 ? 'dabei – gelöst: ' + z.g + ' von ' + n : 'noch nicht begonnen')) +
          (neu ? ' · ' + neu + '× alle Herzen verloren und neu gestartet' : '') +
          (punkte ? ' · Bestleistung im Spiel: ' + punkte + (punkte === spitze ? ' (höchste der Klasse)' : '') : '');
        // Bestleistung im Belohnungsspiel (🏆 = höchste der Klasse)
        var spielHtml = punkte ? '<span class="l-spiel' + (punkte === spitze ? ' l-spitze' : '') + '">' +
          (punkte === spitze ? '🏆 ' : '🎮 ') + punkte.toLocaleString('de-DE') + '</span>' : '';
        return '<li class="' + art + (neu ? ' l-neu' : '') + '" style="--anteil:' + anteil + '%"' + (titel ? ' title="' + esc(titel) + '"' : '') + '>' +
          '<span class="l-name">' + esc(z.p.name) + '</span><span class="l-stand">' + stand + '</span>' + spielHtml +
          '<button type="button" class="l-weg" data-id="' + esc(z.p.id) + '" data-name="' + esc(z.p.name) + '" aria-label="' + esc(z.p.name) + ' entfernen">×</button></li>';
      }).join('');
      // Welche Karten waren beim ersten Versuch am häufigsten falsch – und welche Antwort wurde gewählt?
      // (Ohne Kartennummer: Jedes Handy zeigt die Karten in einer anderen Reihenfolge.)
      var zaehler = {};
      zeilen.forEach(function (z) {
        if (!z.u || !z.u.falsch) return;
        z.u.falsch.forEach(function (x) {
          var teile = String(x).split('-');
          var nr = Number(teile[0]);
          if (!nr) return;
          var e = zaehler[nr] = zaehler[nr] || { nr: nr, anzahl: 0, wahl: {} };
          e.anzahl++;
          if (teile[1]) e.wahl[teile[1]] = (e.wahl[teile[1]] || 0) + 1;
        });
      });
      var liste = Object.keys(zaehler).map(function (nr) { return zaehler[nr]; })
        .sort(function (a, b) { return b.anzahl - a.anzahl || a.nr - b.nr; });
      fehlerJeUebung[uid] = liste;
      var oftHtml = liste.length ? '<h3>Oft falsch beim ersten Versuch <span class="l-klein">– antippen zum Besprechen</span></h3><ol class="l-oft">' +
        liste.slice(0, 3).map(function (o, i) {
          var karte = U.karten.filter(function (k) { return k.nummer === o.nr; })[0];
          return '<li><button type="button" class="l-oft-knopf" data-uebung="' + uid + '" data-index="' + i + '">' +
            '<strong>' + o.anzahl + '×</strong> ' + esc(kurz(karte ? karte.text : '', 90)) + '</button></li>';
        }).join('') + '</ol>' : '';
      var proz = function (x) { return gesamt ? (100 * x / gesamt) : 0; };
      return '<section class="l-karte" data-uebung="' + uid + '">' +
        '<h2>' + esc(U.titel) + '</h2>' +
        '<p class="l-zahl"><strong>' + fertig + '</strong> von ' + gesamt + ' fertig' +
        (dabei ? ' <span class="l-dabei-text">· ' + dabei + ' dabei</span>' : '') + '</p>' +
        '<div class="l-balken" role="img" aria-label="' + fertig + ' fertig, ' + dabei + ' dabei, ' + offen + ' noch nicht begonnen">' +
        '<span class="l-b-fertig" style="width:' + proz(fertig) + '%"></span>' +
        '<span class="l-b-dabei" style="width:' + proz(dabei) + '%"></span></div>' +
        (gesamt ? '<ul class="l-pillen">' + pillen + '</ul>' : '<p class="l-leer">Noch niemand angemeldet.</p>') +
        oftHtml + '</section>';
    }).join('') + (MIT_CHALLENGE ? challengeHtml(daten.challenge || []) : '');
    Array.prototype.forEach.call(inhalt.querySelectorAll('.l-oft-knopf'), function (b) {
      b.addEventListener('click', function () {
        besprechen(b.getAttribute('data-uebung'), Number(b.getAttribute('data-index')));
      });
    });
    verbindeChallenge();
    Array.prototype.forEach.call(inhalt.querySelectorAll('.l-weg'), function (b) {
      b.addEventListener('click', function () {
        if (!window.confirm('„' + b.getAttribute('data-name') + '“ von der Liste entfernen?')) return;
        sende('/entfernen', { id: b.getAttribute('data-id') }).then(hole, hole);
      });
    });
  }

  // ---------- Wochen-Challenge: Bestenliste, QR-Code für alle, Siegerehrung ----------
  function challengeHtml(liste) {
    letzteBestenliste = liste;
    var kopf = GESAMT_CHALLENGE ? '🏆 TB2-Challenge (Wiederholung)' : '🏆 Wochen-Challenge';
    var zeilen = liste.slice(0, 10).map(function (p, i) {
      return '<li class="l-ch-zeile"><span class="l-ch-platz">' + (i + 1) + '.</span><span class="l-ch-name">' + esc(p.name) + '</span>' +
        '<span class="l-ch-punkte">' + p.punkte.toLocaleString('de-DE') + '</span><span class="l-klein">' + p.richtig + '/' + p.gesamt +
        (p.runden > 1 ? ' · ' + p.runden + ' Runden' : '') + '</span>' +
        '<button type="button" class="l-weg l-ch-weg" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" aria-label="' + esc(p.name) + ' aus der Bestenliste entfernen">×</button></li>';
    }).join('');
    return '<section class="l-karte l-challenge">' +
      '<h2>' + kopf + '</h2>' +
      '<p class="l-klein">' + (GESAMT_CHALLENGE ? 'Karten aus allen vier Wochen – offen für alle über den QR-Code.' :
        'Freigeschaltet, wenn alle Übungen der Woche geschafft sind (oder für alle über den QR-Code). Je Name zählt die beste Runde.') + '</p>' +
      (liste.length ? '<ol class="l-ch-liste">' + zeilen + '</ol>' + (liste.length > 10 ? '<p class="l-klein">… und ' + (liste.length - 10) + ' weitere</p>' : '') :
        '<p class="l-leer">Noch keine Ergebnisse.</p>') +
      '<div class="l-ch-leiste">' +
      '<button type="button" class="l-knopf" id="l-ch-ehrung"' + (liste.length ? '' : ' disabled') + '>🏆 Siegerehrung</button>' +
      '<button type="button" class="l-knopf l-zweit" id="l-ch-qr">QR-Code für alle</button>' +
      '<button type="button" class="l-knopf l-zweit" id="l-ch-leeren"' + (liste.length ? '' : ' disabled') + '>Bestenliste leeren</button></div></section>';
  }
  function verbindeChallenge() {
    if (!MIT_CHALLENGE) return;
    var e = document.getElementById('l-ch-ehrung'), q = document.getElementById('l-ch-qr'), l = document.getElementById('l-ch-leeren');
    if (e) e.addEventListener('click', siegerehrung);
    if (q) q.addEventListener('click', zeigeQr);
    if (l) l.addEventListener('click', function () {
      if (!window.confirm('Die Bestenliste dieser Klasse löschen?')) return;
      sende('/challenge-leeren').then(hole, hole);
    });
    Array.prototype.forEach.call(inhalt.querySelectorAll('.l-ch-weg'), function (b) {
      b.addEventListener('click', function () {
        if (!window.confirm('„' + b.getAttribute('data-name') + '“ aus der Bestenliste entfernen?')) return;
        sende('/challenge-entfernen', { id: b.getAttribute('data-id') }).then(hole, hole);
      });
    });
  }
  var vollbild = null;
  function zeigeVollbild(html, klasse) {
    schliesseVollbild();
    vollbild = document.createElement('div');
    vollbild.className = 'l-vollbild ' + (klasse || '');
    vollbild.setAttribute('role', 'dialog');
    vollbild.setAttribute('aria-modal', 'true');
    vollbild.innerHTML = '<button type="button" class="l-knopf l-zweit l-vb-zu" id="l-vb-zu">Schließen (Esc)</button>' + html;
    document.body.appendChild(vollbild);
    document.getElementById('l-vb-zu').addEventListener('click', schliesseVollbild);
    document.addEventListener('keydown', vbTasten);
  }
  function schliesseVollbild() {
    if (!vollbild) return;
    document.removeEventListener('keydown', vbTasten);
    vollbild.parentNode.removeChild(vollbild);
    vollbild = null;
  }
  function vbTasten(ev) { if (ev.key === 'Escape') schliesseVollbild(); }
  function zeigeQr() {
    var svg = window.ILSQR ? window.ILSQR.svg(CHALLENGE_URL) : '';
    zeigeVollbild('<div class="l-qr-box"><h2>' + (GESAMT_CHALLENGE ? '🏆 TB2-Challenge' : '🏆 Wochen-Challenge') + '</h2>' +
      '<div class="l-qr">' + svg + '</div><p class="l-qr-url">' + esc(CHALLENGE_URL) + '</p>' +
      '<p>Scannen, Namen eingeben, los geht’s! Je Name zählt die beste Runde.</p></div>', 'l-vb-qr');
  }
  function siegerehrung() {
    var l = letzteBestenliste;
    if (!l.length) return;
    var platz = function (p, i, hoehe) {
      return p ? '<div class="l-podest l-podest-' + (i + 1) + '" style="--hoehe:' + hoehe + '"><p class="l-p-name">' + esc(p.name) + '</p>' +
        '<p class="l-p-punkte">' + p.punkte.toLocaleString('de-DE') + ' Punkte</p><div class="l-p-stufe"><span>' + (i + 1) + '</span></div></div>' : '<div class="l-podest"></div>';
    };
    var konfetti = '';
    for (var k = 0; k < 60; k++) {
      konfetti += '<i style="left:' + Math.round(Math.random() * 100) + '%;animation-delay:' + (Math.random() * 2.5).toFixed(2) + 's;background:' +
        ['#F2B600', '#3F6C72', '#1B6E35', '#D98B00', '#7B5EA7'][k % 5] + '"></i>';
    }
    zeigeVollbild('<div class="l-konfetti" aria-hidden="true">' + konfetti + '</div>' +
      '<h2 class="l-ehrung-titel">' + (GESAMT_CHALLENGE ? '🏆 TB2-Challenge' : '🏆 Wochen-Challenge') + ' – Siegerehrung</h2>' +
      '<div class="l-treppchen">' + platz(l[1], 1, '62%') + platz(l[0], 0, '86%') + platz(l[2], 2, '44%') + '</div>' +
      (l.length > 3 ? '<ol class="l-weitere">' + l.slice(3, 12).map(function (p, i) {
        return '<li><span class="l-w-platz">' + (i + 4) + '.</span><span class="l-w-name">' + esc(p.name) + '</span><span>' + p.punkte.toLocaleString('de-DE') + '</span></li>';
      }).join('') + '</ol>' : ''), 'l-vb-ehrung');
  }

  // ---------- Besprechen: eine Karte groß auf dem Beamer ----------
  // Zeigt die Aussage und bei den falschen Antworten, wie viele sie zuerst gewählt haben.
  // Die richtige Antwort bleibt verdeckt, bis „Auflösen“ geklickt wird. Keine Namen.
  var ansicht = null;
  function besprechen(uid, index) {
    var liste = (fehlerJeUebung[uid] || []).slice();
    if (!liste.length) return;
    index = Math.max(0, Math.min(index, liste.length - 1));
    var U = INHALTE[uid];
    var o = liste[index];
    var k = U.karten.filter(function (x) { return x.nummer === o.nr; })[0];
    if (!k) return;
    var richtige = Array.isArray(k.richtig) ? k.richtig : [k.richtig];
    if (!ansicht) {
      ansicht = document.createElement('div');
      ansicht.className = 'l-besprechen';
      ansicht.setAttribute('role', 'dialog');
      ansicht.setAttribute('aria-modal', 'true');
      document.body.appendChild(ansicht);
      document.addEventListener('keydown', tasten);
    }
    ansicht.setAttribute('data-uebung', uid);
    ansicht.setAttribute('data-index', index);
    var knoepfe = U.knoepfe.map(function (b) {
      var n = o.wahl[b.kuerzel] || 0;
      var istRichtig = richtige.indexOf(b.kuerzel) >= 0;
      return '<div class="l-b-antwort' + (istRichtig ? ' l-b-loesung' : '') + (n ? ' l-b-gewaehlt' : '') + '">' +
        '<span class="l-b-text">' + esc(b.text) + '</span>' +
        '<span class="l-b-zahl">' + (n ? n + '× zuerst gewählt' : '') + '</span></div>';
    }).join('');
    var gewaehlt = U.knoepfe.filter(function (b) { return o.wahl[b.kuerzel]; });
    var frage = gewaehlt.length === 1 ? 'Was spricht für „' + gewaehlt[0].text + '“ – und was dagegen?' :
      'Was spricht für die gewählten Antworten – und was dagegen?';
    var erklaerung = typeof k.erklaerung === 'object' ? (k.erklaerung[richtige[0]] || '') : (k.erklaerung || '');
    ansicht.innerHTML = '<div class="l-b-kopf"><span>' + esc(U.titel) + ' · beim ersten Versuch ' +
      o.anzahl + '× falsch</span><button type="button" class="l-knopf l-zweit" id="l-b-zu">Schließen</button></div>' +
      '<p class="l-b-aussage">' + fmt(k.text) + '</p>' +
      '<div class="l-b-knoepfe">' + knoepfe + '</div>' +
      '<p class="l-b-frage">' + esc(frage) + '</p>' +
      '<div class="l-b-erklaerung" hidden><strong>✓ Lösung:</strong> ' +
      fmt(erklaerung) + '</div>' +
      '<div class="l-b-leiste">' +
      '<button type="button" class="l-knopf" id="l-b-auf">Auflösen</button>' +
      (index > 0 ? '<button type="button" class="l-knopf l-zweit" id="l-b-zurueck">← Vorherige Karte</button>' : '') +
      (index < liste.length - 1 ? '<button type="button" class="l-knopf l-zweit" id="l-b-weiter">Nächste Karte →</button>' : '') +
      '</div>';
    document.getElementById('l-b-zu').addEventListener('click', schliesse);
    document.getElementById('l-b-auf').addEventListener('click', aufloesen);
    var z = document.getElementById('l-b-zurueck'), w = document.getElementById('l-b-weiter');
    if (z) z.addEventListener('click', function () { besprechen(uid, index - 1); });
    if (w) w.addEventListener('click', function () { besprechen(uid, index + 1); });
    document.getElementById('l-b-auf').focus();
  }
  function aufloesen() {
    if (!ansicht || !ansicht.querySelector('.l-b-erklaerung')) return;
    ansicht.classList.add('l-aufgeloest');
    ansicht.querySelector('.l-b-erklaerung').hidden = false;
    ansicht.querySelector('.l-b-frage').hidden = true;
    var b = document.getElementById('l-b-auf');
    if (b) b.hidden = true;
  }
  function schliesse() {
    if (!ansicht) return;
    document.removeEventListener('keydown', tasten);
    ansicht.parentNode.removeChild(ansicht);
    ansicht = null;
  }
  function tasten(ev) {
    if (!ansicht) return;
    var uid = ansicht.getAttribute('data-uebung'), i = Number(ansicht.getAttribute('data-index'));
    if (ev.key === 'Escape') schliesse();
    else if (ev.key === 'ArrowRight' && document.getElementById('l-b-weiter')) besprechen(uid, i + 1);
    else if (ev.key === 'ArrowLeft' && document.getElementById('l-b-zurueck')) besprechen(uid, i - 1);
  }

  function zeichneFuss() {
    fuss.innerHTML = '<button type="button" class="l-knopf l-zweit" id="l-leeren">Liste leeren (neue Stunde)</button>' +
      '<p class="l-hinweis">★★★ = fertig ohne Fehler · ★★☆ = 1–2 Fehler · ★☆☆ = geschafft (es zählt die beste Wertung) · ' +
      '6/12 = dabei · ↺ = alle Herzen verloren und neu gestartet. ' +
      (MIT_SPIEL ? '🎮 = Bestleistung im Belohnungsspiel „' + SPIEL_NAME + '“ (🏆 = höchste der Klasse). ' : '') +
      'Namen und Fortschritt werden nach spätestens 12 Stunden automatisch gelöscht' +
      (MIT_CHALLENGE ? ', die Bestenliste der Challenge nach 10 Tagen („Liste leeren“ lässt sie stehen).' : '.') + '</p>';
    document.getElementById('l-leeren').addEventListener('click', function () {
      if (!window.confirm('Alle Namen und Fortschritte dieser Klasse für dieses Arbeitsblatt löschen?')) return;
      sende('/leeren').then(hole, hole);
    });
  }

  function stoppe() { if (timer) { clearInterval(timer); timer = null; } }
  function starte() {
    stoppe();
    inhalt.innerHTML = '<p class="l-leer">Lade …</p>';
    zeichneFuss();
    hole();
    timer = setInterval(hole, SEKUNDEN * 1000);
  }

  if (!SERVER) {
    inhalt.innerHTML = '<section class="l-karte l-schmal"><h2>Noch nicht eingerichtet</h2>' +
      '<p>Tragen Sie in <code>docs/einstellungen.js</code> bei <code>serverAdresse</code> die Adresse Ihres Cloudflare-Workers ein ' +
      '(siehe README, Abschnitt „Fortschrittsanzeige einrichten“).</p></section>';
    return;
  }
  starte();
})();

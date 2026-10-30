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
    inhalt.innerHTML = UEBUNGEN.map(function (uid) {
      var U = INHALTE[uid];
      var n = U.karten.length;
      var mind = U.art === 'check' ? 0 : (U.mindestens || 0);
      var zeilen = leute.map(function (p) {
        var u = (p.uebungen || {})[uid];
        var g = u ? Math.min(u.geloest, n) : -1;
        return { p: p, u: u, g: g, fertig: g === n, klick: g === n && u.erster < mind };
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
        var anteil = z.g > 0 ? Math.round(100 * z.g / n) : 0;
        var art = z.fertig ? (z.klick ? 'l-pille l-klick' : 'l-pille l-fertig') : (z.g > 0 ? 'l-pille l-dabei' : 'l-pille l-offen');
        var stand = z.fertig ? (z.klick ? '⚠' : '✓') : (z.g >= 0 ? z.g + '/' + n : '–');
        var titel = z.klick ? 'fertig, aber beim ersten Versuch nur ' + z.u.erster + ' von ' + n + ' richtig' : '';
        return '<li class="' + art + '" style="--anteil:' + anteil + '%"' + (titel ? ' title="' + esc(titel) + '"' : '') + '>' +
          '<span class="l-name">' + esc(z.p.name) + '</span><span class="l-stand">' + stand + '</span>' +
          '<button type="button" class="l-weg" data-id="' + esc(z.p.id) + '" data-name="' + esc(z.p.name) + '" aria-label="' + esc(z.p.name) + ' entfernen">×</button></li>';
      }).join('');
      // Welche Karten waren beim ersten Versuch am häufigsten falsch – und welche Antwort wurde gewählt?
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
      var oftTitel = U.art === 'check' ? 'Oft nicht erfüllt' : 'Oft falsch beim ersten Versuch';
      var oftHtml = liste.length ? '<h3>' + oftTitel + ' <span class="l-klein">– antippen zum Besprechen</span></h3><ol class="l-oft">' +
        liste.slice(0, 3).map(function (o, i) {
          var karte = U.karten.filter(function (k) { return k.nummer === o.nr; })[0];
          return '<li><button type="button" class="l-oft-knopf" data-uebung="' + uid + '" data-index="' + i + '">' +
            '<strong>' + (U.art === 'check' ? 'Punkt ' : 'Karte ') + o.nr + ' · ' + o.anzahl + '×</strong> ' + esc(kurz(karte ? karte.text : '', 90)) + '</button></li>';
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
    }).join('');
    Array.prototype.forEach.call(inhalt.querySelectorAll('.l-oft-knopf'), function (b) {
      b.addEventListener('click', function () {
        besprechen(b.getAttribute('data-uebung'), Number(b.getAttribute('data-index')));
      });
    });
    Array.prototype.forEach.call(inhalt.querySelectorAll('.l-weg'), function (b) {
      b.addEventListener('click', function () {
        if (!window.confirm('„' + b.getAttribute('data-name') + '“ von der Liste entfernen?')) return;
        sende('/entfernen', { id: b.getAttribute('data-id') }).then(hole, hole);
      });
    });
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
    if (U.art === 'check') {
      // Selbstkontrolle: Punkt des Erwartungshorizonts groß zeigen – es gibt nichts aufzulösen
      ansicht.innerHTML = '<div class="l-b-kopf"><span>' + esc(U.titel) + ' · Punkt ' + o.nr + ' · ' +
        o.anzahl + '× nicht erfüllt</span><button type="button" class="l-knopf l-zweit" id="l-b-zu">Schließen</button></div>' +
        '<p class="l-b-aussage">' + fmt(k.text) + '</p>' +
        '<p class="l-b-frage">Woran erkennt man, dass dieser Punkt erfüllt ist? Wer findet ein eigenes Beispiel zum Fall?</p>' +
        '<div class="l-b-leiste">' +
        (index > 0 ? '<button type="button" class="l-knopf l-zweit" id="l-b-zurueck">← Vorheriger Punkt</button>' : '') +
        (index < liste.length - 1 ? '<button type="button" class="l-knopf l-zweit" id="l-b-weiter">Nächster Punkt →</button>' : '') +
        '</div>';
      document.getElementById('l-b-zu').addEventListener('click', schliesse);
      var zc = document.getElementById('l-b-zurueck'), wc = document.getElementById('l-b-weiter');
      if (zc) zc.addEventListener('click', function () { besprechen(uid, index - 1); });
      if (wc) wc.addEventListener('click', function () { besprechen(uid, index + 1); });
      document.getElementById('l-b-zu').focus();
      return;
    }
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
    ansicht.innerHTML = '<div class="l-b-kopf"><span>' + esc(U.titel) + ' · Karte ' + o.nr + ' · beim ersten Versuch ' +
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
      '<p class="l-hinweis">Namen und Fortschritt werden nach spätestens 12 Stunden automatisch gelöscht. ' +
      '⚠ = fertig, aber beim ersten Versuch zu oft falsch (durchgeklickt?).</p>';
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

/* Fall-Einführung „Zeitlupe“ – Beamer-Seite für die Lehrkraft (lehrer-3bfp2-1-fall.html, lehrer-3bfp2-2-fall.html).
 * Die Lehrkraft schaltet mit „Weiter“ (oder Pfeiltaste / Presenter) von Schritt zu Schritt; die Handys folgen.
 * Ohne Kennwort (wie die übrigen Lehrerseiten). Alle Texte stehen in fall-inhalte.js. */
(function () {
  'use strict';

  var E = window.EINSTELLUNGEN || {};
  var F = FALL;
  var SERVER = String(E.serverAdresse || '').replace(/\/+$/, '');
  var raum = document.body.getAttribute('data-raum');            // z. B. 'k2-fall'
  var ABFRAGE_MS = 2000;
  var HANDY_ADRESSE = new URL('fall.html', location.href).href;

  var buehne = document.getElementById('z-buehne');
  var steuer = document.getElementById('z-steuer');
  var status = document.getElementById('l-status');
  var fuss = document.getElementById('l-fuss');

  var stand = null;          // letzter Stand vom Server
  var ansicht = { schritt: 0, stufe: 0 };  // was gerade gezeigt wird (sofort, ohne auf den Server zu warten)
  var gezeichnet = '';
  var letztesHtml = '';
  var countdown = null, countdownRest = 0;
  var perspNachKb = false;
  var gesendetBis = 0;       // kurz nach einem Klick den Server-Stand für die Steuerung ignorieren

  // ---------- Hilfsfunktionen ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function uhrzeit(ms) {
    var d = new Date(ms);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function datum(ms) {
    var d = new Date(ms);
    return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + uhrzeit(ms);
  }
  function prozent(n, gesamt) { return gesamt ? Math.round(100 * n / gesamt) : 0; }
  function antworten(n) { return n + (n === 1 ? ' Antwort' : ' Antworten'); }
  function abschnitte(teil, art) { return F.text.filter(function (t) { return t.teil === teil && (!art || t.art === art); }); }
  function falltextHtml(teile) {
    var absaetze = [];
    teile.forEach(function (t, i) {
      if (t.absatz || i === 0) absaetze.push(esc(t.text));
      else absaetze[absaetze.length - 1] += ' ' + esc(t.text);
    });
    return absaetze.map(function (a) { return '<p>' + a + '</p>'; }).join('');
  }
  function schritt(i) { return F.schritte[Math.max(0, Math.min(i, F.schritte.length - 1))]; }
  function stufenAnzahl(s) {
    if (s.art === 'station') return abschnitte(s.id, 'aufloesung').length ? 3 : 2;
    if (s.art === 'kaltstart' || s.art === 'fragen' || s.art === 'zurueckspulen') return 2;
    return 1;
  }
  function optionen(q) { return q.ampel ? F.ampel : q.optionen; }
  function vergleich() {
    return stand && stand.steuerung.durchgang === 'sw13' && stand.archiv && stand.archiv.einf ? stand.archiv.einf : null;
  }

  // ---------- Server ----------
  function hole() {
    return fetch(SERVER + '/fall/stand?raum=' + encodeURIComponent(raum), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (d) {
        stand = d;
        if (Date.now() > gesendetBis) ansicht = { schritt: d.steuerung.schritt, stufe: d.steuerung.stufe };
        status.textContent = 'Stand ' + uhrzeit(d.jetzt) + ' · ' + d.leute.length + ' angemeldet · ' +
          (d.steuerung.durchgang === 'sw13' ? 'Abschluss (SW 13)' : 'Einführung (SW 6)');
        status.className = 'l-status';
        zeichne();
      })
      .catch(function () {
        status.textContent = 'Keine Verbindung zum Server' + (stand ? ' – angezeigt wird der letzte Stand' : '');
        status.className = 'l-status l-warnung';
      });
  }
  function sende(pfad, daten) {
    return fetch(SERVER + pfad, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(Object.assign({ raum: raum }, daten || {}))
    });
  }
  function gehe(schrittNr, stufe) {
    ansicht = { schritt: schrittNr, stufe: stufe };
    gesendetBis = Date.now() + 3000;
    if (stand) { stand.steuerung.schritt = schrittNr; stand.steuerung.stufe = stufe; }
    zeichne();
    sende('/fall/steuern', { schritt: schrittNr, stufe: stufe }).then(hole, hole);
  }
  function weiter() {
    var s = schritt(ansicht.schritt);
    if (ansicht.stufe < stufenAnzahl(s) - 1) gehe(ansicht.schritt, ansicht.stufe + 1);
    else if (ansicht.schritt < F.schritte.length - 1) gehe(ansicht.schritt + 1, 0);
  }
  function zurueck() {
    if (ansicht.stufe > 0) gehe(ansicht.schritt, ansicht.stufe - 1);
    else if (ansicht.schritt > 0) { var v = schritt(ansicht.schritt - 1); gehe(ansicht.schritt - 1, stufenAnzahl(v) - 1); }
  }
  function weiterText() {
    var s = schritt(ansicht.schritt);
    var n = stufenAnzahl(s);
    if (ansicht.stufe < n - 1) {
      if (s.art === 'kaltstart') return '10 Sekunden starten';
      if (s.art === 'station' && ansicht.stufe === 1) return 'Auflösen: Was hat Christin getan?';
      return 'Ergebnis zeigen';
    }
    if (ansicht.schritt >= F.schritte.length - 1) return '';
    var nx = schritt(ansicht.schritt + 1);
    return 'Weiter: ' + (nx.art === 'station' ? 'Station ' + nx.nummer + ' · ' : '') + nx.kurz;
  }

  // ---------- Zeichnen ----------
  function zeichne() {
    zeichneSteuerung();
    var s = schritt(ansicht.schritt);
    var schluessel = ansicht.schritt + '|' + ansicht.stufe;
    var neu = schluessel !== gezeichnet;
    gezeichnet = schluessel;
    if (s.art !== 'kaltstart' && countdown) { clearInterval(countdown); countdown = null; }
    document.body.classList.toggle('z-dunkel', s.art === 'kaltstart');
    if (s.art === 'kaltstart') { letztesHtml = ''; if (neu) zeichneKaltstart(s); return; }
    var html = '';
    if (s.art === 'fragen') html = fragenHtml(s);
    else if (s.art === 'station') html = stationHtml(s);
    else if (s.art === 'zurueckspulen') html = zurueckHtml(s);
    else if (s.art === 'perspektiven') html = perspektivenHtml(s);
    else if (s.art === 'ende') html = endeHtml(s);
    if (!neu && html === letztesHtml) return;   // nichts geändert: nicht neu zeichnen (kein Flackern, Klicks gehen nicht verloren)
    letztesHtml = html;
    var y = window.scrollY;
    buehne.innerHTML = html;
    if (!neu) window.scrollTo(0, y); else window.scrollTo(0, 0);
    verbinde();
  }

  function zeichneSteuerung() {
    var punkte = F.schritte.map(function (x, i) {
      return '<button type="button" class="z-punkt' + (i === ansicht.schritt ? ' z-jetzt' : '') + (i < ansicht.schritt ? ' z-vorbei' : '') +
        '" data-gehe="' + i + '" title="' + esc(x.kurz) + '">' + (x.art === 'station' ? x.nummer : esc(x.kurz.charAt(0))) + '</button>';
    }).join('');
    var wt = weiterText();
    steuer.innerHTML =
      '<button type="button" class="l-knopf l-zweit z-zurueck" id="z-zurueck"' + (ansicht.schritt === 0 && ansicht.stufe === 0 ? ' disabled' : '') + '>◀ Zurück</button>' +
      '<div class="z-punkte" role="group" aria-label="Schritte">' + punkte + '</div>' +
      (wt ? '<button type="button" class="l-knopf z-weiter" id="z-weiter">' + esc(wt) + ' ▶</button>' : '<span class="z-ende-hinweis">Ende</span>');
    document.getElementById('z-zurueck').onclick = zurueck;
    var w = document.getElementById('z-weiter');
    if (w) w.onclick = weiter;
    Array.prototype.forEach.call(steuer.querySelectorAll('[data-gehe]'), function (b) {
      b.onclick = function () { gehe(Number(b.getAttribute('data-gehe')), 0); };
    });
  }

  // Kaltstart: Satz groß, dann 10-Sekunden-Countdown
  // Bild als abgedunkelter Hintergrund (stärker abgedunkelt, solange der Countdown läuft)
  function kaltKopf(s, dunkel) {
    if (!s.bild) return '<div class="z-kalt">';
    return '<div class="z-kalt z-kalt-bild" role="img" aria-label="' + esc(s.bild.alt) + '" style="background-image:linear-gradient(rgba(15,28,32,' + dunkel +
      '),rgba(15,28,32,' + dunkel + ')),url(\'' + encodeURI(s.bild.datei) + '\')">';
  }
  function zeichneKaltstart(s) {
    if (countdown) { clearInterval(countdown); countdown = null; }
    if (ansicht.stufe === 0) {
      buehne.innerHTML = kaltKopf(s, 0.45) + '<p class="z-kalt-satz">' + esc(s.satz) + '</p><p class="z-kalt-frage">' + esc(s.aufforderung) + '</p></div>';
      return;
    }
    countdownRest = s.sekunden;
    var zeige = function () {
      buehne.innerHTML = kaltKopf(s, 0.7) + '<p class="z-kalt-satz">' + esc(s.satz) + '</p>' +
        (countdownRest > 0 ? '<p class="z-countdown" aria-live="off">' + countdownRest + '</p>' : '<p class="z-stopp" role="status">' + esc(s.stopp) + '</p>') + '</div>';
    };
    zeige();
    countdown = setInterval(function () {
      countdownRest--;
      zeige();
      if (countdownRest <= 0) { clearInterval(countdown); countdown = null; }
    }, 1000);
  }

  // Namen mit ✓, wenn die Frage(n) dieses Schritts beantwortet sind
  function namenHtml(frageIds) {
    if (!stand) return '';
    var leute = stand.leute.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    if (!leute.length) return '<p class="l-leer">Noch niemand angemeldet.</p>';
    var fertig = 0;
    var pillen = leute.map(function (p) {
      var ok = frageIds.every(function (id) { return p.beantwortet.indexOf(id) >= 0; });
      if (ok) fertig++;
      return '<li class="l-pille ' + (ok ? 'l-fertig' : 'l-offen') + '" style="--anteil:0%"><span class="l-name">' + esc(p.name) + '</span>' +
        '<span class="l-stand">' + (ok ? '✓' : '–') + '</span>' +
        '<button type="button" class="l-weg" data-person="' + esc(p.id) + '" data-name="' + esc(p.name) + '" aria-label="' + esc(p.name) + ' entfernen">×</button></li>';
    }).join('');
    return '<p class="l-zahl"><strong>' + fertig + '</strong> von ' + leute.length + ' haben geantwortet</p><ul class="l-pillen">' + pillen + '</ul>';
  }

  // Ergebnis einer Frage als Balken (Anteil der Personen, die diese Antwort gewählt haben)
  function ergebnisHtml(q, mitChristin) {
    var erg = (stand && stand.ergebnisse[q.id]) || {};
    var n = (stand && stand.anzahl[q.id]) || 0;
    var v = vergleich();
    var ve = v ? (v.ergebnisse[q.id] || {}) : null, vn = v ? (v.anzahl[q.id] || 0) : 0;
    if (q.skala) return skalaHtml(q, erg, n, ve, vn);
    var zeilen = optionen(q).map(function (o) {
      var p = prozent(erg[o.kuerzel] || 0, n);
      var christin = mitChristin && mitChristin.ampel === o.kuerzel;
      return '<div class="z-zeile' + (o.farbe ? ' z-' + o.farbe : '') + '">' +
        '<span class="z-option">' + (o.zeichen ? o.zeichen + ' ' : '') + esc(o.text) +
        (christin ? ' <span class="z-christin">← Christin: ' + esc(mitChristin.kurz) + '</span>' : '') + '</span>' +
        '<span class="z-spur"><span class="z-balken" style="width:' + p + '%"></span></span>' +
        '<span class="z-wert">' + (erg[o.kuerzel] || 0) + ' <small>(' + p + '\u00a0%)</small></span>' +
        (ve ? '<span class="z-option z-vgl-text">SW 6</span><span class="z-spur z-vgl"><span class="z-balken" style="width:' + prozent(ve[o.kuerzel] || 0, vn) + '%"></span></span>' +
          '<span class="z-wert z-vgl-text">' + prozent(ve[o.kuerzel] || 0, vn) + ' %</span>' : '') +
        '</div>';
    }).join('');
    return '<div class="z-ergebnis"><p class="z-ergebnis-kopf">' + esc(q.text) + ' <small>· ' + antworten(n) +
      (q.mehrfach ? ' · mehrere möglich' : '') + (ve ? ' · zum Vergleich: SW 6 (' + antworten(vn) + ')' : '') + '</small></p>' + zeilen + '</div>';
  }
  function skalaHtml(q, erg, n, ve, vn) {
    var summe = 0;
    q.optionen.forEach(function (o) { summe += Number(o.kuerzel) * (erg[o.kuerzel] || 0); });
    var vsumme = 0;
    if (ve) q.optionen.forEach(function (o) { vsumme += Number(o.kuerzel) * (ve[o.kuerzel] || 0); });
    var max = Math.max.apply(null, [1].concat(q.optionen.map(function (o) { return erg[o.kuerzel] || 0; })));
    var saeulen = q.optionen.map(function (o) {
      var a = erg[o.kuerzel] || 0;
      return '<div class="z-saeule"><span class="z-s-zahl">' + a + '</span><span class="z-s-balken" style="height:' + Math.round(100 * a / max) + '%"></span>' +
        '<span class="z-s-text"><strong>' + esc(o.kuerzel) + '</strong> ' + esc(o.text) + '</span></div>';
    }).join('');
    return '<div class="z-ergebnis"><p class="z-ergebnis-kopf">' + esc(q.text) + ' <small>· ' + antworten(n) + '</small></p>' +
      '<div class="z-skala">' + saeulen + '</div>' +
      '<p class="z-schnitt">Durchschnitt: <strong>' + (n ? (summe / n).toFixed(1).replace('.', ',') : '–') + '</strong>' +
      (ve && vn ? ' <span class="z-vgl-text">· SW 6: ' + (vsumme / vn).toFixed(1).replace('.', ',') + '</span>' : '') + '</p></div>';
  }

  function fragenHtml(s) {
    var ids = s.fragen.map(function (q) { return q.id; });
    if (ansicht.stufe === 0) {
      return '<section class="z-zwei"><div class="z-qr"><img src="qr_fall.png" alt="QR-Code zur Fall-Einführung">' +
        '<p class="z-adresse">' + esc(HANDY_ADRESSE.replace(/^https?:\/\//, '')) + '</p></div>' +
        '<div><h2 class="z-titel">' + esc(s.titel) + '</h2><p class="z-gross">' + esc(s.beamerText) + '</p>' +
        '<p class="z-hinweis">' + esc(s.hinweis) + '</p>' + namenHtml(ids) + '</div></section>';
    }
    return '<h2 class="z-titel">' + esc(s.titel) + '</h2><div class="z-raster">' +
      s.fragen.map(function (q) { return ergebnisHtml(q); }).join('') + '</div>';
  }

  function stationHtml(s) {
    var auf = ansicht.stufe >= 2;
    var kopf = '<h2 class="z-titel"><span class="z-nr">' + s.nummer + '</span>' + esc(s.kurz) + '</h2>';
    var text = '<div class="z-falltext' + (ansicht.stufe >= 1 ? ' z-klein' : '') + '">' + falltextHtml(abschnitte(s.id, 'frage')) + '</div>';
    var bild = s.bild ? '<figure class="z-bild"><img src="' + esc(s.bild.datei) + '" alt="' + esc(s.bild.alt) + '"></figure>' : '';
    var rahmen = function (inhalt) {
      if (!bild) return kopf + inhalt;
      return kopf + '<div class="z-station' + (ansicht.stufe >= 1 ? ' z-spaeter' : '') + '"><div class="z-station-text">' + inhalt + '</div>' + bild + '</div>';
    };
    if (ansicht.stufe === 0) {
      return rahmen(text + '<p class="z-frage">' + esc(s.frage.text) + '</p>' + namenHtml([s.frage.id]));
    }
    return rahmen(text +
      (auf ? '<div class="z-aufloesung"><p class="z-auf-kopf">Christin erzählt weiter:</p><div class="z-falltext">' +
        falltextHtml(abschnitte(s.id, 'aufloesung')) + '</div></div>' : '') +
      ergebnisHtml(s.frage, auf ? s.christin : null));
  }

  // Zeitstrahl: alle Stationen nebeneinander mit dem Klassen-Ergebnis und Christins Handeln
  function zeitstrahlHtml() {
    var stationen = F.schritte.filter(function (x) { return x.art === 'station'; });
    return '<ol class="z-zeitstrahl">' + stationen.map(function (x) {
      var q = x.frage;
      var erg = (stand && stand.ergebnisse[q.id]) || {};
      var n = (stand && stand.anzahl[q.id]) || 0;
      var inhalt;
      if (q.ampel) {
        inhalt = '<span class="z-mini">' + F.ampel.map(function (o) {
          return '<span class="z-mini-' + o.farbe + '" style="width:' + prozent(erg[o.kuerzel] || 0, n) + '%" title="' + esc(o.text) + '"></span>';
        }).join('') + '</span><span class="z-mini-legende">' + F.ampel.map(function (o) {
          return '<span class="z-nw">' + o.zeichen + ' ' + prozent(erg[o.kuerzel] || 0, n) + '\u00a0%</span>';
        }).join(' ') + '</span>' +
          (x.christin ? '<span class="z-christin-zs">Christin: ' + F.ampel.filter(function (o) { return o.kuerzel === x.christin.ampel; })[0].zeichen + ' ' + esc(x.christin.kurz) + '</span>' : '');
      } else {
        var oben = optionen(q).slice().sort(function (a, b) { return (erg[b.kuerzel] || 0) - (erg[a.kuerzel] || 0); })
          .filter(function (o) { return erg[o.kuerzel]; }).slice(0, 2);
        inhalt = oben.length ? '<span class="z-mini-legende">' + oben.map(function (o) { return esc(o.text) + ': ' + prozent(erg[o.kuerzel], n) + '\u00a0%'; }).join('<br>') + '</span>' : '<span class="z-mini-legende">–</span>';
      }
      return '<li>' + (x.bild ? '<img class="z-zs-bild" src="' + esc(x.bild.datei.replace(/\.jpg$/, '-klein.jpg')) + '" alt="">' : '') +
        '<span class="z-zs-nr">' + x.nummer + '</span><span class="z-zs-titel">' + esc(x.kurz) + '</span>' +
        '<span class="z-zs-was">' + esc(x.zeitstrahl || '') + '</span>' + inhalt + '</li>';
    }).join('') + '</ol>';
  }

  function zurueckHtml(s) {
    return '<h2 class="z-titel">' + esc(s.titel) + '</h2>' + zeitstrahlHtml() +
      '<p class="z-frage"><span class="z-vorspann">' + esc(s.vorspann) + '</span> ' + esc(s.frage.text) + '</p>' +
      (ansicht.stufe === 0 ? namenHtml([s.frage.id]) : ergebnisHtml(s.frage));
  }

  // Perspektiven: je Person eine Spalte – oder nach Kompetenzbereichen geordnet (Lernlandkarte)
  function karteHtml(t, mitPerson, s) {
    var p = s.personen.filter(function (x) { return x.id === t.person; })[0];
    return '<li class="z-pk">' + (mitPerson && p ? '<span class="z-pk-person">' + esc(p.text) + '</span>' : '') +
      (t.a ? '<span class="z-pk-a">' + esc(t.a) + '</span>' : '') +
      (t.b ? '<span class="z-pk-b">❓ ' + esc(t.b) + '</span>' : '') +
      '<span class="z-pk-leiste">' + F.kb.map(function (k) {
        return '<button type="button" class="z-kb' + (t.kb === k.kuerzel ? ' z-kb-an' : '') + '" data-kb="' + k.kuerzel + '" data-text="' + esc(t.id) + '" title="' + esc(k.name) + ' zuordnen">' + esc(k.kuerzel) + '</button>';
      }).join('') + '<button type="button" class="z-kb z-weg" data-weg="' + esc(t.id) + '" aria-label="Eintrag entfernen" title="Eintrag entfernen">×</button></span></li>';
  }
  function perspektivenHtml(s) {
    var texte = stand ? stand.texte.filter(function (t) { return t.art === 'persp'; }) : [];
    var spalten;
    if (!perspNachKb) {
      spalten = s.personen.map(function (p) {
        var eigene = texte.filter(function (t) { return t.person === p.id; });
        return '<section class="z-spalte"><h3>' + esc(p.text) + ' <small>' + eigene.length + '</small></h3><ul>' +
          eigene.map(function (t) { return karteHtml(t, false, s); }).join('') + '</ul></section>';
      }).join('');
    } else {
      spalten = F.kb.concat([{ kuerzel: '', name: 'Noch ohne KB' }]).map(function (k) {
        var eigene = texte.filter(function (t) { return t.kb === k.kuerzel; });
        return '<section class="z-spalte' + (k.kuerzel ? '' : ' z-ohne') + '"><h3>' + esc(k.name) + ' <small>' + eigene.length + '</small></h3><ul>' +
          eigene.map(function (t) { return karteHtml(t, true, s); }).join('') + '</ul></section>';
      }).join('');
    }
    return '<div class="z-persp-kopf"><h2 class="z-titel">' + esc(s.titel) + '</h2>' +
      '<button type="button" class="l-knopf l-zweit" id="z-ordnen">' + (perspNachKb ? 'Nach Personen ordnen' : 'Nach Kompetenzbereichen ordnen') + '</button></div>' +
      '<p class="z-hinweis-klein">' + texte.length + ' Einträge · Tippen Sie bei jedem Eintrag auf den passenden KB (I–V).</p>' +
      '<div class="z-spalten' + (perspNachKb ? ' z-sechs' : '') + '">' + spalten + '</div>';
  }

  function begriffeHtml(texte) {
    var zaehler = {};
    texte.filter(function (t) { return t.art === 'begriff'; }).forEach(function (t) {
      var k = t.a.toLowerCase();
      if (!zaehler[k]) zaehler[k] = { text: t.a, anzahl: 0, id: t.id };
      zaehler[k].anzahl++;
    });
    var liste = Object.keys(zaehler).map(function (k) { return zaehler[k]; }).sort(function (a, b) { return b.anzahl - a.anzahl || a.text.localeCompare(b.text, 'de'); });
    if (!liste.length) return '<p class="l-leer">Noch keine Begriffe geparkt.</p>';
    return '<ul class="z-woerter">' + liste.map(function (w) {
      return '<li><span>' + esc(w.text) + '</span>' + (w.anzahl > 1 ? '<small>' + w.anzahl + '×</small>' : '') +
        '<button type="button" class="z-kb z-weg" data-weg="' + esc(w.id) + '" aria-label="Begriff entfernen">×</button></li>';
    }).join('') + '</ul>';
  }

  function archivZeile() {
    if (!stand) return '';
    var d = stand.steuerung.durchgang;
    var a = stand.archiv[d];
    return a ? 'Gesichert: ' + datum(a.t) + ' (' + a.teilnehmende + ' Teilnehmende)' : 'Noch nicht gesichert.';
  }

  function endeHtml(s) {
    var texte = stand ? stand.texte : [];
    var v = vergleich();
    var alteFragen = v ? v.texte.filter(function (t) { return t.art === 'persp' && t.b; }) : [];
    return '<h2 class="z-titel">' + esc(s.titel) + '</h2><p class="z-gross">' + esc(s.beamerText) + '</p>' +
      '<section class="z-block"><h3>🅿️ ' + esc(F.begriffe.titel) + '</h3>' + begriffeHtml(texte) + '</section>' +
      (alteFragen.length ? '<section class="z-block"><h3>Ihre Lernfragen aus der Einführung (SW 6) – können Sie sie jetzt beantworten?</h3><ul class="z-alt">' +
        alteFragen.map(function (t) { return '<li>' + (t.kb ? '<span class="z-kb z-kb-an">' + esc(t.kb) + '</span> ' : '') + esc(t.b) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<section class="z-block"><h3>Ergebnis sichern</h3><p>Speichert die Ergebnisse dieser Stunde <strong>ohne Namen</strong> für den Vergleich in SW 13.</p>' +
      '<button type="button" class="l-knopf" data-sichern="1">💾 Ergebnis sichern</button> <span class="z-gesichert">' + esc(archivZeile()) + '</span></section>';
  }

  function verbinde() {
    Array.prototype.forEach.call(buehne.querySelectorAll('[data-person]'), function (b) {
      b.onclick = function () {
        if (!window.confirm('„' + b.getAttribute('data-name') + '“ mit allen Antworten entfernen?')) return;
        sende('/fall/entfernen', { id: b.getAttribute('data-person') }).then(hole, hole);
      };
    });
    Array.prototype.forEach.call(buehne.querySelectorAll('[data-kb]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-text'), kb = b.getAttribute('data-kb');
        var t = stand.texte.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        t.kb = t.kb === kb ? '' : kb;   // noch einmal tippen = Zuordnung aufheben
        gezeichnet = ''; zeichne();
        sende('/fall/kb', { id: id, kb: t.kb }).then(hole, hole);
      };
    });
    Array.prototype.forEach.call(buehne.querySelectorAll('[data-weg]'), function (b) {
      b.onclick = function () {
        if (!window.confirm('Diesen Eintrag entfernen?')) return;
        sende('/fall/text-weg', { id: b.getAttribute('data-weg') }).then(hole, hole);
      };
    });
    var o = document.getElementById('z-ordnen');
    if (o) o.onclick = function () { perspNachKb = !perspNachKb; gezeichnet = ''; zeichne(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-sichern]'), function (b) {
      b.onclick = sichern;
    });
  }

  function sichern() {
    var d = stand ? stand.steuerung.durchgang : 'einf';
    if (stand && stand.archiv[d] && !window.confirm('Für diesen Durchgang ist schon ein Ergebnis gesichert. Überschreiben?')) return;
    sende('/fall/sichern').then(function () { return hole(); }).then(zeichneFuss, zeichneFuss);
  }

  // ---------- Fußzeile: Durchgang, Sichern, Leeren ----------
  function zeichneFuss() {
    var d = stand ? stand.steuerung.durchgang : 'einf';
    fuss.innerHTML =
      '<div class="z-fuss-leiste"><fieldset class="z-durchgang"><legend>Durchgang:</legend>' +
      '<label><input type="radio" name="durchgang" value="einf"' + (d === 'einf' ? ' checked' : '') + '> Einführung (SW 6)</label>' +
      '<label><input type="radio" name="durchgang" value="sw13"' + (d === 'sw13' ? ' checked' : '') + '> Abschluss (SW 13) – mit Vergleich</label></fieldset>' +
      '<button type="button" class="l-knopf l-zweit" data-sichern="1">💾 Ergebnis sichern</button>' +
      '<button type="button" class="l-knopf l-zweit" id="l-leeren">Liste leeren (neue Stunde)</button></div>' +
      '<p class="l-hinweis">' + esc(archivZeile()) + ' · Weiter/Zurück auch mit den Pfeiltasten oder dem Presenter. ' +
      'Auf dem Beamer stehen Antworten nur zusammengezählt, Texte ohne Namen. Namen und Antworten werden nach spätestens 12 Stunden ' +
      'automatisch gelöscht; gesicherte Ergebnisse (ohne Namen) bleiben für den Vergleich in SW 13.</p>';
    Array.prototype.forEach.call(fuss.querySelectorAll('input[name=durchgang]'), function (r) {
      r.onchange = function () {
        if (!window.confirm('Neuer Durchgang: Namen und Antworten dieser Runde werden gelöscht (gesicherte Ergebnisse bleiben). Haben Sie das Ergebnis gesichert?')) { zeichneFuss(); return; }
        sende('/fall/steuern', { schritt: 0, stufe: 0, durchgang: r.value }).then(hole, hole).then(zeichneFuss);
      };
    });
    document.getElementById('l-leeren').onclick = function () {
      if (!window.confirm('Alle Namen und Antworten dieser Klasse löschen und von vorn beginnen? (Gesicherte Ergebnisse bleiben.)')) return;
      sende('/fall/leeren').then(hole, hole);
    };
    Array.prototype.forEach.call(fuss.querySelectorAll('[data-sichern]'), function (b) { b.onclick = sichern; });
  }

  // Pfeiltasten und Presenter (Bild ab/auf)
  document.addEventListener('keydown', function (ev) {
    var ziel = ev.target && ev.target.tagName;
    if (ziel === 'INPUT' || ziel === 'TEXTAREA' || ziel === 'SELECT') return;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); weiter(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); zurueck(); }
  });

  if (!SERVER) {
    buehne.innerHTML = '<section class="l-karte l-schmal"><h2>Noch nicht eingerichtet</h2>' +
      '<p>Tragen Sie in <code>docs/einstellungen.js</code> bei <code>serverAdresse</code> die Adresse Ihres Cloudflare-Workers ein.</p></section>';
    return;
  }
  zeichne();
  hole().then(zeichneFuss, zeichneFuss);
  setInterval(hole, ABFRAGE_MS);
  var fussDurchgang = null;
  setInterval(function () { // Fußzeile neu, wenn sich Durchgang oder Sicherung geändert hat
    if (!stand) return;
    var k = stand.steuerung.durchgang + JSON.stringify(Object.keys(stand.archiv).map(function (x) { return stand.archiv[x].t; }));
    if (k !== fussDurchgang) { fussDurchgang = k; zeichneFuss(); }
  }, 2000);
})();

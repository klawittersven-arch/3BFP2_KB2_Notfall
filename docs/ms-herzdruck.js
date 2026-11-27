/* Minispiel „Herzdruck-Takt“ (Belohnung, Bezug: Reanimation). Läuft in minispiel.html (Gerüst: minispiel.js).
 * 30 Sekunden im Takt auf den Brustkorb tippen. Punkte gibt es nur bei 100–120 pro Minute (wie bei der echten
 * Herzdruckmassage); eine Serie im Takt erhöht den Faktor. Am Anfang zeigt ein gelber Ring den Takt (110/min),
 * nach 8 Sekunden sind die SuS allein. Texte: T (hier oben) – nur zwischen den Hochkommas ändern. */
(function () {
  'use strict';

  var T = {
    titel: 'Herzdruck-Takt',
    symbol: '❤️',
    bezug: 'Reanimation – Herzdruckmassage',
    idee: 'Drücken Sie im richtigen Takt: 100- bis 120-mal pro Minute. Am Anfang zeigt ein gelber Ring den Takt – dann sind Sie allein.',
    steuerung: 'Tippen Sie mit dem Daumen auf den Brustkorb. Ein ruhiger, gleichmäßiger Takt bringt die meisten Punkte.',
    folgen: 'Drücken Sie mit dem gelben Ring!',
    ohneHilfe: 'Jetzt ohne Taktgeber – weiter so!',
    perfekt: 'Perfekt!',
    gut: 'Gut!',
    zuSchnell: 'Zu schnell!',
    zuLangsam: 'Zu langsam!',
    nichtAufhoeren: 'Nicht aufhören!',
    serie: 'Serie {x} · ×{m}',
    proMinute: 'pro Minute',
    ziel: 'Ziel: 100–120',
    ergebnisTakt: 'Ihr Takt im Schnitt: {x} pro Minute',
    ergebnisImTakt: 'Im Takt: {x} von {y}-mal gedrückt',
    wusstest: [
      'Herzdruckmassage: 100- bis 120-mal pro Minute, 5 bis 6 cm tief.',
      'Der Druckpunkt liegt in der Mitte des Brustkorbs – auf der unteren Hälfte des Brustbeins.',
      'Nach jedem Drücken den Brustkorb ganz entlasten – die Hände bleiben aber auf dem Brustkorb.',
      'Mit Beatmung: 30-mal drücken, 2-mal beatmen (30 : 2).',
      'Die Person liegt flach auf dem Rücken, auf einer harten Unterlage.'
    ]
  };

  var MIN = 100, MAX = 120;          // Takt mit Punkten (pro Minute)
  var PERFEKT_MIN = 105, PERFEKT_MAX = 115;
  var HILFE_MS = 8000;               // so lange zeigt der Ring den Takt
  var METRONOM_MS = 60000 / 110;
  var PAUSE_MS = 1500;               // längere Pause = „Nicht aufhören!“
  var SKALA_MIN = 60, SKALA_MAX = 160;

  function ersetze(s, w) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; }); }
  function lage(r) { return 100 * (Math.max(SKALA_MIN, Math.min(SKALA_MAX, r)) - SKALA_MIN) / (SKALA_MAX - SKALA_MIN); }

  var BRUST = '<svg viewBox="0 0 300 250" aria-hidden="true">' +
    '<rect x="122" y="0" width="56" height="70" rx="22" fill="#EDBE9C"/>' +
    '<path d="M14 250 C14 140 40 66 104 52 L196 52 C260 66 286 140 286 250 Z" fill="#F1C7A8" stroke="#D59C7B" stroke-width="4"/>' +
    '<path d="M70 120 Q105 132 138 122 M70 150 Q105 162 138 152 M162 122 Q195 132 230 120 M162 152 Q195 162 230 150" fill="none" stroke="#E2AC8C" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="150" y1="78" x2="150" y2="196" stroke="#E0A487" stroke-width="7" stroke-linecap="round"/>' +
    '<ellipse cx="150" cy="160" rx="58" ry="34" fill="#E3A985" stroke="#B9785A" stroke-width="3"/>' +
    '<ellipse cx="150" cy="150" rx="52" ry="30" fill="#EDBB98" stroke="#B9785A" stroke-width="3"/>' +
    '<path d="M116 136 v-14 M132 131 v-17 M148 129 v-18 M164 131 v-17" stroke="#B9785A" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';

  (window.MINISPIELE = window.MINISPIELE || {}).herzdruck = {
    titel: T.titel, symbol: T.symbol, bezug: T.bezug, idee: T.idee, steuerung: T.steuerung, wusstest: T.wusstest,
    leben: 0,
    ton: true,
    neu: function (feld, api) {
      feld.className = 'hd-feld';
      var skala = document.createElement('div');
      skala.className = 'hd-skala';
      skala.innerHTML = '<div class="hd-skala-text"><span>' + SKALA_MIN + '</span><span>' + T.ziel + '</span><span>' + SKALA_MAX + '</span></div>' +
        '<div class="hd-spur"><div class="hd-gruen" style="left:' + lage(MIN) + '%;width:' + (lage(MAX) - lage(MIN)) + '%"></div></div>' +
        '<div class="hd-nadel" id="hd-nadel" style="left:50%"></div>';
      var takt = document.createElement('div');
      takt.className = 'hd-takt';
      takt.id = 'hd-takt';
      takt.innerHTML = '– <small>' + T.proMinute + '</small>';
      var kombi = document.createElement('div');
      kombi.className = 'hd-kombi';
      kombi.id = 'hd-kombi';
      var brust = document.createElement('div');
      brust.className = 'hd-brust';
      brust.innerHTML = BRUST;
      var ring = document.createElement('div');
      ring.className = 'hd-ring';
      ring.id = 'hd-ring';
      feld.appendChild(skala);
      feld.appendChild(takt);
      feld.appendChild(kombi);
      feld.appendChild(brust);
      feld.appendChild(ring);
      var nadel = skala.querySelector('.hd-nadel');

      var letzte = null, intervalle = [], imTakt = 0, gedrueckt = 0, serie = 0, warnung = false;
      var hilfeAus = false, letzterSchlag = -1, begruesst = false, ringY = null;

      function ringLegen() {
        var br = brust.getBoundingClientRect(), fr = feld.getBoundingClientRect();
        if (!br.height) return;
        ringY = br.top - fr.top + br.height * (152 / 250);
        ring.style.top = (ringY - 60) + 'px';
      }
      function kombiZeigen(wort) {
        var m = 1 + Math.min(3, Math.floor(serie / 5));
        kombi.textContent = (wort ? wort + ' ' : '') + (serie >= 3 ? ersetze(T.serie, { x: serie, m: m }) : '');
      }
      function druck(e) {
        if (!api.laeuft()) return;
        if (e && e.preventDefault) e.preventDefault();
        var t = api.zeit();
        if (letzte !== null && t - letzte < 150) return; // Doppeltipp ignorieren
        brust.classList.add('drueck');
        setTimeout(function () { brust.classList.remove('drueck'); }, 90);
        api.ton(220, 0.05);
        if (letzte !== null) {
          var iv = t - letzte;
          gedrueckt++;
          if (iv <= PAUSE_MS) {
            intervalle.push(iv);
            var letzteDrei = intervalle.slice(-3);
            var schnitt = 60000 / (letzteDrei.reduce(function (a, b) { return a + b; }, 0) / letzteDrei.length);
            nadel.style.left = lage(schnitt) + '%';
            takt.innerHTML = Math.round(schnitt) + ' <small>' + T.proMinute + '</small>';
            var rate = 60000 / iv;
            if (rate >= MIN && rate <= MAX) {
              imTakt++;
              serie++;
              var perfekt = rate >= PERFEKT_MIN && rate <= PERFEKT_MAX;
              var p = (perfekt ? 15 : 10) * (1 + Math.min(3, Math.floor(serie / 5)));
              api.punkte(p);
              api.schwebe('+' + p, feld.clientWidth / 2, ringY !== null ? ringY - 70 : feld.clientHeight * 0.55);
              kombiZeigen(perfekt ? T.perfekt : T.gut);
            } else {
              serie = 0;
              kombiZeigen('');
              api.meldung(rate > MAX ? T.zuSchnell : T.zuLangsam, 'schlecht');
            }
          } else {
            serie = 0;
            kombiZeigen('');
          }
        }
        letzte = t;
        warnung = false;
      }
      feld.addEventListener('pointerdown', druck);
      window.addEventListener('resize', ringLegen);
      ringLegen();

      return {
        tick: function (dt, t) {
          if (!begruesst) { begruesst = true; ringLegen(); api.meldung(T.folgen); }
          if (t < HILFE_MS) {
            var phase = (t % METRONOM_MS) / METRONOM_MS;
            ring.style.transform = 'scale(' + (0.75 + 0.55 * phase) + ')';
            ring.style.opacity = String(1 - phase * 0.85);
            var schlag = Math.floor(t / METRONOM_MS);
            if (schlag !== letzterSchlag) { letzterSchlag = schlag; api.ton(880, 0.04); }
          } else if (!hilfeAus) {
            hilfeAus = true;
            ring.hidden = true;
            api.meldung(T.ohneHilfe, 'gut');
          }
          if (letzte !== null && !warnung && t - letzte > PAUSE_MS) {
            warnung = true;
            serie = 0;
            kombiZeigen('');
            api.meldung(T.nichtAufhoeren, 'schlecht');
          }
        },
        weiter: function () { letzte = null; }, // nach einer Pause neu ansetzen
        stopp: function () { feld.removeEventListener('pointerdown', druck); window.removeEventListener('resize', ringLegen); },
        ergebnis: function () {
          var z = [];
          if (intervalle.length) {
            var schnitt = intervalle.reduce(function (a, b) { return a + b; }, 0) / intervalle.length;
            z.push(ersetze(T.ergebnisTakt, { x: Math.round(60000 / schnitt) }));
          }
          z.push(ersetze(T.ergebnisImTakt, { x: imTakt, y: gedrueckt }));
          return z;
        },
        erzeuge: function () { return null; }
      };
    }
  };
})();

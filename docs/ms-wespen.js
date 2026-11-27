/* Minispiel „Wespen-Alarm“ (Belohnung, Bezug: Anaphylaxie nach Insektenstich). Läuft in minispiel.html (Gerüst: minispiel.js).
 * Sommerfest: Wespen fliegen auf die Limo zu – antippen verscheucht sie. Erreicht eine Wespe das Glas, gibt es einen
 * Stich (ein Herz weg). Der Adrenalin-Pen bringt Punkte und ein Herz zurück; Schmetterlinge stechen nicht – nicht antippen!
 * Es wird mit der Zeit schneller. Texte: T (hier oben) – nur zwischen den Hochkommas ändern. */
(function () {
  'use strict';

  var T = {
    titel: 'Wespen-Alarm',
    symbol: '🐝',
    bezug: 'Anaphylaxie – Insektenstich beim Sommerfest',
    idee: 'Beim Sommerfest fliegen Wespen auf die Limo zu. Tippen Sie die Wespen an, bevor sie das Glas erreichen. Es wird immer schneller!',
    steuerung: 'Wespe antippen = verscheuchen. Adrenalin-Pen antippen = Bonus und ein Herz zurück. Schmetterlinge stechen nicht – nicht antippen!',
    start: 'Schützen Sie die Limo!',
    gestochen: 'Autsch – gestochen!',
    knapp: 'Knapp!',
    pen: 'Adrenalin – Mittel der ersten Wahl!',
    falter: 'Schmetterlinge stechen nicht!',
    ergebnisWeg: 'Verscheuchte Wespen: {x}',
    ergebnisStiche: 'Gestochen: {x}-mal',
    wusstest: [
      'Zeichen einer Anaphylaxie nach einem Stich: z. B. Quaddeln, Juckreiz, Schwellungen, Atemnot, Schwindel.',
      'Bei einer Anaphylaxie ist Adrenalin das Mittel der ersten Wahl.',
      'Wer eine Allergie gegen Insektengift hat, trägt oft ein Notfallset mit Adrenalin-Autoinjektor bei sich.',
      'Bei Atemnot: Oberkörper hoch. Bei Schwindel ohne Atemnot: flach hinlegen, Beine hoch.',
      'Erste Maßnahme bei Anaphylaxie: die Zufuhr des Allergens stoppen – z. B. eine Infusion sofort abstellen.'
    ]
  };

  var WESPE = '<svg viewBox="0 0 54 44" aria-hidden="true">' +
    '<ellipse cx="25" cy="12" rx="11" ry="8" fill="#E4F3FB" stroke="#7FA7BC" stroke-width="1.5"/>' +
    '<ellipse cx="33" cy="11" rx="9" ry="7" fill="#E4F3FB" stroke="#7FA7BC" stroke-width="1.5"/>' +
    '<polygon points="4,27 -1,25 -1,29" fill="#222"/>' +
    '<ellipse cx="19" cy="27" rx="14" ry="9.5" fill="#F7C600" stroke="#222" stroke-width="2"/>' +
    '<path d="M13 18.5 v17 M21 17.5 v19" stroke="#222" stroke-width="4"/>' +
    '<ellipse cx="35" cy="26" rx="6" ry="6.5" fill="#222"/>' +
    '<circle cx="45" cy="25" r="7" fill="#F7C600" stroke="#222" stroke-width="2"/>' +
    '<circle cx="48" cy="23" r="2.6" fill="#222"/>' +
    '<path d="M44 18 l4 -6 M47 19 l6 -4" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>' +
    '</svg>';
  var PEN = '<svg viewBox="0 0 92 34" aria-hidden="true">' +
    '<rect x="2" y="5" width="72" height="24" rx="8" fill="#FFFFFF" stroke="#1F4E79" stroke-width="3"/>' +
    '<rect x="70" y="8" width="20" height="18" rx="5" fill="#F28C00" stroke="#1F4E79" stroke-width="3"/>' +
    '<text x="38" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#1F4E79">ADRENALIN</text>' +
    '</svg>';
  var GLAS = '<svg viewBox="0 0 64 92" aria-hidden="true">' +
    '<line x1="40" y1="2" x2="34" y2="40" stroke="#E0457B" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M6 18 L58 18 L52 88 L12 88 Z" fill="#FFF7C2" stroke="#7B9AA6" stroke-width="3"/>' +
    '<path d="M9 34 L55 34 L52 86 L12 86 Z" fill="#FFD84D"/>' +
    '<circle cx="22" cy="54" r="4" fill="#fff" opacity=".7"/><circle cx="38" cy="66" r="3" fill="#fff" opacity=".7"/>' +
    '<circle cx="14" cy="22" r="10" fill="#9BD14B" stroke="#5E8F2A" stroke-width="2"/>' +
    '</svg>';

  function abstand(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function ersetze(s, w) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; }); }

  (window.MINISPIELE = window.MINISPIELE || {}).wespen = {
    titel: T.titel, symbol: T.symbol, bezug: T.bezug, idee: T.idee, steuerung: T.steuerung, wusstest: T.wusstest,
    leben: 3,
    neu: function (feld, api) {
      feld.className = 'ws-feld';
      var tisch = document.createElement('div');
      tisch.className = 'ws-tisch';
      var glas = document.createElement('div');
      glas.className = 'ws-glas';
      glas.innerHTML = GLAS;
      var kuchen = document.createElement('div');
      kuchen.className = 'ws-kuchen';
      kuchen.textContent = '🍰';
      feld.appendChild(tisch);
      feld.appendChild(glas);
      feld.appendChild(kuchen);

      var W = feld.clientWidth || 360, H = feld.clientHeight || 640;
      var ziel = { x: W / 2, y: H - 100 };
      function masse() { W = feld.clientWidth || W; H = feld.clientHeight || H; ziel = { x: W / 2, y: H - 100 }; }
      window.addEventListener('resize', masse);

      var dinge = [];
      var naechsteWespe = 300, naechsterFalter = 4200, penZeiten = [9000, 19500], weg = 0, stiche = 0, begruesst = false;

      function element(klasse, html) {
        var e = document.createElement('div');
        e.className = 'ws-ding ' + klasse;
        if (html) e.innerHTML = html; else e.textContent = '🦋';
        feld.appendChild(e);
        return e;
      }
      function wespe(opt) {
        var seite = Math.random(), x, y;
        if (seite < 0.5) { x = 30 + Math.random() * (W - 60); y = -30; } else if (seite < 0.75) { x = -30; y = Math.random() * H * 0.55; } else { x = W + 30; y = Math.random() * H * 0.55; }
        if (opt && opt.x !== undefined) { x = opt.x; y = opt.y; }
        var d = { art: 'wespe', bx: x, by: y, x: x, y: y, still: !!(opt && opt.still), phase: Math.random() * 6, amp: 18 + Math.random() * 16,
          frequenz: 4 + Math.random() * 3, v: H * (0.15 + 0.27 * api.anteil()) * (0.85 + Math.random() * 0.3), e: element('ws-wespe', WESPE), weg: 0, breite: 54, hoehe: 44 };
        dinge.push(d);
        return d;
      }
      function falter(opt) {
        var links = Math.random() < 0.5;
        var d = { art: 'falter', x: links ? -30 : W + 30, by: H * (0.2 + Math.random() * 0.35), y: 0, vx: (links ? 1 : -1) * (70 + Math.random() * 40), phase: Math.random() * 6,
          still: !!(opt && opt.still), e: element('ws-falter'), breite: 48, hoehe: 48 };
        if (opt && opt.x !== undefined) { d.x = opt.x; d.by = opt.y; }
        d.y = d.by;
        dinge.push(d);
        return d;
      }
      function pen(opt) {
        var d = { art: 'pen', x: 60 + Math.random() * (W - 120), y: H * (0.25 + Math.random() * 0.3), bis: api.zeit() + 2600, e: element('ws-pen', PEN), breite: 92, hoehe: 34 };
        if (opt && opt.x !== undefined) { d.x = opt.x; d.y = opt.y; }
        if (opt && opt.still) d.bis = Infinity;
        dinge.push(d);
        return d;
      }
      function entferne(d) { if (d.e.parentNode) d.e.parentNode.removeChild(d.e); dinge.splice(dinge.indexOf(d), 1); }
      function zeichne(d) {
        var kipp = d.art === 'wespe' ? ((d.zx !== undefined ? d.zx : ziel.x) < d.x ? -1 : 1) : 1;
        d.e.style.transform = 'translate(' + (d.x - d.breite / 2) + 'px,' + (d.y - d.hoehe / 2) + 'px)' + (kipp < 0 ? ' scaleX(-1)' : '');
      }

      function tippen(ev) {
        if (!api.laeuft()) return;
        if (ev && ev.preventDefault) ev.preventDefault();
        var r = feld.getBoundingClientRect();
        var px = ev.clientX - r.left, py = ev.clientY - r.top;
        var bester = null, bestAbstand = 1e9;
        dinge.forEach(function (d) {
          if (d.weg) return;
          var radius = d.art === 'pen' ? 48 : d.art === 'falter' ? 30 : 38;
          var a = abstand(px, py, d.x, d.y);
          if (a < radius && a < bestAbstand) { bester = d; bestAbstand = a; }
        });
        if (!bester) return;
        if (bester.art === 'wespe') {
          var knapp = abstand(bester.x, bester.y, ziel.x, ziel.y) < 120;
          var p = knapp ? 15 : 10;
          api.punkte(p);
          api.schwebe('+' + p, bester.x, bester.y - 20);
          if (knapp) api.meldung(T.knapp, 'gut');
          weg++;
          bester.weg = 1;
          bester.e.classList.add('ws-weg');
          var dx = bester.x - ziel.x, dy = bester.y - ziel.y, l = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          bester.fx = dx / l; bester.fy = dy / l;
        } else if (bester.art === 'pen') {
          api.punkte(30);
          api.leben(api.leben() + 1);
          api.schwebe('+30 ❤️', bester.x, bester.y - 20);
          api.meldung(T.pen, 'gut');
          api.blitz('gut');
          entferne(bester);
        } else {
          api.punkte(-15);
          api.schwebe('−15', bester.x, bester.y - 20, 'schlecht');
          api.meldung(T.falter, 'schlecht');
          api.vibriere(80);
        }
      }
      feld.addEventListener('pointerdown', tippen);

      return {
        tick: function (dt, t) {
          if (!begruesst) { begruesst = true; masse(); api.meldung(T.start); }
          var s = dt / 1000, a = api.anteil();
          if (t >= naechsteWespe) {
            wespe();
            if (a > 0.55 && Math.random() < 0.35) wespe();
            naechsteWespe = t + Math.max(350, 1100 - 750 * a) * (0.8 + Math.random() * 0.4);
          }
          if (t >= naechsterFalter) { falter(); naechsterFalter = t + 3500 + Math.random() * 2000; }
          if (penZeiten.length && t >= penZeiten[0]) { penZeiten.shift(); pen(); }
          dinge.slice().forEach(function (d) {
            if (d.art === 'wespe') {
              if (d.weg) {
                d.x += d.fx * 600 * s; d.y += d.fy * 600 * s; d.weg += dt;
                if (d.weg > 500) { entferne(d); return; }
              } else {
                if (!d.still) {
                  var dx = ziel.x - d.bx, dy = ziel.y - d.by, l = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                  d.bx += dx / l * d.v * s; d.by += dy / l * d.v * s;
                  var naehe = Math.min(1, l / 160);
                  d.x = d.bx + (-dy / l) * Math.sin(t / 1000 * d.frequenz + d.phase) * d.amp * naehe;
                  d.y = d.by + (dx / l) * Math.sin(t / 1000 * d.frequenz + d.phase) * d.amp * naehe;
                  d.zx = ziel.x;
                }
                if (abstand(d.bx, d.by, ziel.x, ziel.y) < 30) {
                  stiche++;
                  entferne(d);
                  api.blitz('schlecht');
                  api.vibriere(150);
                  api.meldung(T.gestochen, 'schlecht');
                  api.leben(api.leben() - 1);
                  return;
                }
              }
            } else if (d.art === 'falter') {
              if (!d.still) {
                d.x += d.vx * s;
                d.y = d.by + Math.sin(t / 1000 * 5 + d.phase) * 22;
                if (d.x < -60 || d.x > W + 60) { entferne(d); return; }
              }
            } else if (d.art === 'pen' && t > d.bis) { entferne(d); return; }
            zeichne(d);
          });
        },
        stopp: function () { feld.removeEventListener('pointerdown', tippen); window.removeEventListener('resize', masse); },
        ergebnis: function () { return [ersetze(T.ergebnisWeg, { x: weg }), ersetze(T.ergebnisStiche, { x: stiche })]; },
        // Für die Tests: eine Wespe, einen Schmetterling oder einen Pen an eine Stelle setzen
        erzeuge: function (art, opt) {
          var d = art === 'pen' ? pen(opt) : art === 'falter' ? falter(opt) : wespe(opt);
          zeichne(d);
          return { x: d.x, y: d.y, zielX: ziel.x, zielY: ziel.y };
        }
      };
    }
  };
})();

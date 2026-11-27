/* Minispiel „Stör-Abwehr“ (Belohnung, Bezug: SPIKES – Setting, psychologische Erste Hilfe). Läuft in minispiel.html.
 * Sie führen ein Gespräch mit einer Angehörigen. Ringsum tauchen Störungen auf (Telefon, Tür, Fernseher …) –
 * schnell antippen, bevor sie das Gespräch stören (sonst ist ein Herz weg). Zeigt die Angehörige ein Gefühl
 * (sie weint, fragt, ist wütend), ist das KEINE Störung: nicht antippen – dafür gibt es Bonuspunkte.
 * Es wird mit der Zeit schneller. Texte: T (hier oben) – nur zwischen den Hochkommas ändern. */
(function () {
  'use strict';

  var T = {
    titel: 'Stör-Abwehr',
    symbol: '📵',
    bezug: 'SPIKES: Setting – ein ruhiger Rahmen für das Gespräch',
    idee: 'Sie sprechen mit einer Angehörigen. Ringsum tauchen Störungen auf. Tippen Sie jede Störung schnell weg – bevor sie das Gespräch unterbricht.',
    steuerung: 'Störung antippen = Ruhe. Zeigt die Angehörige ein Gefühl, ist das keine Störung – nicht antippen, einfach dableiben!',
    start: 'Halten Sie Störungen vom Gespräch fern!',
    ruhe: 'Ruhe!',
    gestoert: 'Gestört! Das Gespräch wird unterbrochen.',
    keineStoerung: 'Das ist keine Störung – bleiben Sie bei ihr!',
    zugehoert: 'Gut zugehört!',
    orte: [
      { id: 'tuer', icon: '🚪', name: 'Tür', stoerung: 'Tür geht auf!' },
      { id: 'telefon', icon: '☎️', name: 'Telefon', stoerung: 'Telefon klingelt!' },
      { id: 'fernseher', icon: '📺', name: 'Fernseher', stoerung: 'Fernseher läuft!' },
      { id: 'flur', icon: '👀', name: 'Flur', stoerung: 'Neugierige schauen!' },
      { id: 'handy', icon: '📱', name: 'Handy', stoerung: 'Handy piept!' },
      { id: 'fenster', icon: '🔨', name: 'Fenster', stoerung: 'Baulärm!' }
    ],
    gefuehle: [
      { icon: '😢', text: 'Sie weint.' },
      { icon: '❓', text: 'Sie hat eine Frage.' },
      { icon: '😠', text: 'Sie ist wütend.' },
      { icon: '😶', text: 'Sie schweigt lange.' }
    ],
    ergebnisWeg: 'Störungen abgewehrt: {x}',
    ergebnisSchnell: 'Am schnellsten: {x} Sekunden',
    ergebnisGefuehle: 'Gefühle ausgehalten: {x}-mal',
    wusstest: [
      'SPIKES beginnt mit S wie Setting: ein ruhiger Raum, Telefon lautlos, Zeit nehmen.',
      'Am Telefon zuerst fragen: „Können Sie gerade in Ruhe sprechen?“',
      'Gefühle sind keine Störung: Weinen und Schweigen aushalten (E wie Emotions).',
      'Psychologische Erste Hilfe: Betroffene vor Zuschauern abschirmen.',
      'Am Ende des Gesprächs: zusammenfassen und sagen, wie es weitergeht (Strategy and Summary).'
    ]
  };

  function ersetze(s, w) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return w[k] !== undefined ? w[k] : m; }); }

  (window.MINISPIELE = window.MINISPIELE || {}).stoerung = {
    titel: T.titel, symbol: T.symbol, bezug: T.bezug, idee: T.idee, steuerung: T.steuerung, wusstest: T.wusstest,
    leben: 3,
    neu: function (feld, api) {
      feld.className = 'st-feld';
      var raster = document.createElement('div');
      raster.className = 'st-orte';
      var orte = T.orte.map(function (o) {
        var e = document.createElement('div');
        e.className = 'st-ort';
        e.setAttribute('data-ort', o.id);
        e.innerHTML = '<span class="st-icon">' + o.icon + '</span><span class="st-name">' + o.name + '</span><span class="st-rest"></span>';
        raster.appendChild(e);
        return { o: o, e: e, name: e.querySelector('.st-name'), rest: e.querySelector('.st-rest'), aktiv: false, seit: 0, dauer: 0 };
      });
      var tisch = document.createElement('div');
      tisch.className = 'st-tisch';
      tisch.innerHTML = '<div class="st-gespraech">💬</div><div class="st-platte"></div>' +
        '<div class="st-person st-ich">🧑‍⚕️</div><div class="st-person st-sie" id="st-sie">👩</div><div class="st-blase" id="st-blase" hidden></div>';
      feld.appendChild(raster);
      feld.appendChild(tisch);
      var sie = tisch.querySelector('.st-sie'), blase = tisch.querySelector('.st-blase');

      var naechste = 600, naechstesGefuehl = 3500, gefuehl = null;
      var abgewehrt = 0, schnellste = null, ausgehalten = 0, begruesst = false;

      function aktiviere(ort) {
        var frei = orte.filter(function (x) { return !x.aktiv; });
        var x = ort ? orte.filter(function (y) { return y.o.id === ort; })[0] : frei[Math.floor(Math.random() * frei.length)];
        if (!x || x.aktiv) return null;
        x.aktiv = true;
        x.seit = api.zeit();
        x.dauer = Math.max(1100, 2400 - 1300 * api.anteil());
        x.e.classList.add('aktiv');
        x.name.textContent = x.o.stoerung;
        api.ton(1200, 0.05);
        return x;
      }
      function beruhige(x) {
        x.aktiv = false;
        x.e.classList.remove('aktiv');
        x.name.textContent = x.o.name;
        x.rest.style.width = '0';
      }
      function zeigeGefuehl() {
        var g = T.gefuehle[Math.floor(Math.random() * T.gefuehle.length)];
        gefuehl = { bis: api.zeit() + 2200 };
        blase.textContent = g.icon + ' ' + g.text;
        blase.hidden = false;
        sie.classList.add('st-gefuehl');
      }
      function gefuehlEnde(gut) {
        if (!gefuehl) return;
        gefuehl = null;
        blase.hidden = true;
        sie.classList.remove('st-gefuehl');
        if (gut) {
          ausgehalten++;
          api.punkte(5);
          var r = sie.getBoundingClientRect(), f = feld.getBoundingClientRect();
          api.schwebe('+5 ' + T.zugehoert, r.left - f.left + r.width / 2 - 30, r.top - f.top - 10);
        }
      }

      function tippen(ev) {
        if (!api.laeuft()) return;
        if (ev && ev.preventDefault) ev.preventDefault();
        var ziel = ev.target && ev.target.closest ? ev.target : null;
        var ortEl = ziel ? ziel.closest('.st-ort') : null;
        if (ortEl) {
          var x = orte.filter(function (y) { return y.e === ortEl; })[0];
          if (!x || !x.aktiv) return;
          var noch = Math.max(0, x.dauer - (api.zeit() - x.seit));
          var reaktion = api.zeit() - x.seit;
          if (schnellste === null || reaktion < schnellste) schnellste = reaktion;
          var p = 10 + Math.round(10 * noch / x.dauer);
          api.punkte(p);
          var r = ortEl.getBoundingClientRect(), f = feld.getBoundingClientRect();
          api.schwebe('+' + p, r.left - f.left + r.width / 2, r.top - f.top + r.height / 2);
          abgewehrt++;
          beruhige(x);
          return;
        }
        if (gefuehl && ziel && (ziel.closest('.st-sie') || ziel.closest('.st-blase'))) {
          gefuehlEnde(false);
          api.blitz('schlecht');
          api.vibriere(120);
          api.meldung(T.keineStoerung, 'schlecht');
          api.leben(api.leben() - 1);
        }
      }
      feld.addEventListener('pointerdown', tippen);

      return {
        tick: function (dt, t) {
          if (!begruesst) { begruesst = true; api.meldung(T.start); }
          var a = api.anteil();
          var hoechstens = 1 + Math.floor(a * 3);
          if (t >= naechste) {
            if (orte.filter(function (x) { return x.aktiv; }).length < hoechstens) aktiviere();
            naechste = t + Math.max(450, 1300 - 850 * a) * (0.85 + Math.random() * 0.3);
          }
          if (!gefuehl && t >= naechstesGefuehl) { zeigeGefuehl(); naechstesGefuehl = t + 3500 + Math.random() * 1800; }
          if (gefuehl && t >= gefuehl.bis) gefuehlEnde(true);
          orte.forEach(function (x) {
            if (!x.aktiv) return;
            var vergangen = t - x.seit;
            x.rest.style.width = Math.max(0, 100 * (1 - vergangen / x.dauer)) + '%';
            if (vergangen >= x.dauer) {
              beruhige(x);
              api.blitz('schlecht');
              api.vibriere(120);
              api.meldung(T.gestoert, 'schlecht');
              api.leben(api.leben() - 1);
            }
          });
        },
        stopp: function () { feld.removeEventListener('pointerdown', tippen); },
        ergebnis: function () {
          var z = [ersetze(T.ergebnisWeg, { x: abgewehrt })];
          if (schnellste !== null) z.push(ersetze(T.ergebnisSchnell, { x: (schnellste / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }));
          if (ausgehalten) z.push(ersetze(T.ergebnisGefuehle, { x: ausgehalten }));
          return z;
        },
        // Für die Tests: eine Störung an einem Ort oder ein Gefühl der Angehörigen auslösen
        erzeuge: function (art, opt) {
          if (art === 'gefuehl') { if (!gefuehl) zeigeGefuehl(); return { gefuehl: true }; }
          var x = aktiviere(opt.ort);
          return x ? { ort: x.o.id } : null;
        }
      };
    }
  };
})();

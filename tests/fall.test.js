/* Automatischer Test der Fall-Einführung „Zeitlupe“ (Playwright, Chromium).
 * Aufruf (im Repository-Ordner):  node tests/fall.test.js
 * Teil A: Der Falltext in docs/fall-inhalte.js ist Wort für Wort der Leitfall (Prüfsumme) – er darf nicht verändert werden.
 * Teil B: Ablauf mit Beamer-Seite und zwei Handys (360 px). Als Server dient der echte Worker (server/src/index.js)
 *         mit nachgebildetem Durable Object – Kaltstart, Anmelden, Ampel, Auflösen, Zurückspulen, Perspektiven
 *         mit KB-Zuordnung, Begriffsparkplatz, Ergebnis sichern, Durchgang SW 13 mit Vergleich.
 * Bildschirmfotos landen in tests/*.png (nicht im Repository). */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const DOCS = path.join(__dirname, '..', 'docs');
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const SERVER = 'https://fall.test';
// Prüfsumme des Falltexts (7 Absätze, mit \n verbunden) – so wie er auf dem Arbeitsblatt steht.
const FALLTEXT_SHA256 = '096e68087457dc2adeb07962af5a0e2ef3c11588c2f77459469ee79902175dbb';

let ok = 0, nok = 0;
const pruefe = (bed, text) => { if (bed) ok++; else { nok++; console.log('  ✗ ' + text); } };
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

function ladeFall() {
  const kontext = { window: {} };
  vm.createContext(kontext);
  vm.runInContext(fs.readFileSync(path.join(DOCS, 'fall-inhalte.js'), 'utf8') + ';this.FALL = FALL;', kontext);
  return kontext.FALL;
}

function webserver() {
  return new Promise((fertig) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(DOCS, p);
      if (!f.startsWith(DOCS) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      let inhalt = fs.readFileSync(f);
      if (p === '/einstellungen.js') {
        inhalt = inhalt.toString('utf8').replace(/serverAdresse: '[^']*'/, `serverAdresse: '${SERVER}'`)
          .replace(/fallAbfrageSekunden: \d+/, 'fallAbfrageSekunden: 2');
      }
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
      res.end(inhalt);
    }).listen(0, () => fertig(s));
  });
}

function umgebung(Raum) {
  const raeume = new Map();
  return {
    RAUM: {
      idFromName: (n) => n,
      get(id) {
        if (!raeume.has(id)) {
          const speicher = new Map();
          const state = { storage: { get: async (k) => structuredClone(speicher.get(k)), put: async (k, v) => { speicher.set(k, structuredClone(v)); } } };
          raeume.set(id, { raum: new Raum(state, {}), speicher });
        }
        const r = raeume.get(id);
        return { fetch: (url, init) => r.raum.fetch(new Request(url, init)) };
      }
    }
  };
}

(async () => {
  // ---------- Teil A: Falltext unverändert ----------
  const FALL = ladeFall();
  const absaetze = [];
  FALL.text.forEach((t, i) => { if (t.absatz || i === 0) absaetze.push(t.text); else absaetze[absaetze.length - 1] += ' ' + t.text; });
  const summe = crypto.createHash('sha256').update(absaetze.join('\n'), 'utf8').digest('hex');
  pruefe(summe === FALLTEXT_SHA256, 'Falltext unverändert (Prüfsumme) – bitte den Text des Fallbeispiels nicht ändern');
  pruefe(absaetze.length === 7, 'Falltext: 7 Absätze');
  pruefe(FALL.titel === '„Reanimation und nicht nur ich war hilflos“', 'Titel wie auf dem Arbeitsblatt');
  const stationen = FALL.schritte.filter((s) => s.art === 'station');
  const fallStationen = stationen.filter((s) => !s.extra), extra = stationen.filter((s) => s.extra);
  pruefe(fallStationen.length === 7 && fallStationen.every((s) => FALL.text.some((t) => t.teil === s.id && t.art === 'frage')), 'jede Station des Fallbeispiels hat einen Abschnitt des Falls');
  pruefe(extra.length === 3 && extra.every((s) => s.text && s.frage.ampel && s.loesung && !FALL.text.some((t) => t.teil === s.id)), 'zusätzliche Situationen: eigener Text, Ampel, Einschätzung – nicht im Falltext');
  pruefe(extra.every((s) => s.loesung.ampel === 'G'), 'zusätzliche Situationen: alle 🟢 (alles normal)');
  const kuerzel = new Set();
  FALL.schritte.forEach((s) => (s.fragen || (s.frage ? [s.frage] : [])).forEach((q) => {
    pruefe(!kuerzel.has(q.id), 'Frage-Kennung eindeutig: ' + q.id); kuerzel.add(q.id);
    pruefe(/^[a-z0-9]{1,12}$/.test(q.id), 'Frage-Kennung gültig: ' + q.id);
    (q.ampel ? FALL.ampel : q.optionen).forEach((o) => pruefe(/^[A-Z0-9]{1,6}$/.test(o.kuerzel), 'Kürzel gültig: ' + q.id + ' ' + o.kuerzel));
  }));

  // Bilder: beide Größen vorhanden, mit Beschreibung; Offline-Liste vollständig
  FALL.schritte.filter((s) => s.bild).forEach((s) => {
    const gross = path.join(DOCS, s.bild.datei), klein = gross.replace(/\.jpg$/, '-klein.jpg');
    pruefe(fs.existsSync(gross) && fs.existsSync(klein), 'Bild vorhanden (groß und klein): ' + s.bild.datei);
    pruefe(typeof s.bild.alt === 'string' && s.bild.alt.length > 10, 'Bildbeschreibung vorhanden: ' + s.id);
  });
  const swText = fs.readFileSync(path.join(DOCS, 'sw.js'), 'utf8');
  const swDateien = JSON.parse(swText.match(/var DATEIEN = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  pruefe(swDateien.every((d) => d === './' || fs.existsSync(path.join(DOCS, d))), 'sw.js: alle Dateien der Offline-Liste vorhanden');

  // ---------- Teil B: Ablauf im Browser ----------
  const { default: worker, Raum } = await import('../server/src/index.js');
  const env = umgebung(Raum);
  const web = await webserver();
  const BASIS = `http://127.0.0.1:${web.address().port}/`;
  const browser = await chromium.launch();
  const fremd = [];

  async function mitWorker(ctx) {
    await ctx.route('**/*', async (route) => {
      const req = route.request();
      const url = req.url();
      if (url.startsWith(SERVER)) {
        const antwort = await worker.fetch(new Request(url, { method: req.method(), headers: { 'Content-Type': 'text/plain' }, body: req.method() === 'POST' ? req.postData() : undefined }), env);
        const text = antwort.status === 204 ? '' : await antwort.text();
        return route.fulfill({ status: antwort.status, headers: Object.fromEntries(antwort.headers), body: text });
      }
      if (!url.startsWith(BASIS)) { fremd.push(url); return route.abort(); }
      return route.continue();
    });
  }

  const lehrerCtx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await mitWorker(lehrerCtx);
  const lehrer = await lehrerCtx.newPage();
  lehrer.on('dialog', (d) => d.accept());
  const fehlerJs = [];
  lehrer.on('pageerror', (e) => fehlerJs.push('Lehrer: ' + e.message));
  await lehrer.goto(BASIS + 'lehrer-3bfp2-2-fall.html');
  // Kaltstart: zuerst das Bild im Vollbild, dann der Satz, dann der Countdown
  await lehrer.waitForSelector('.z-vollbild img');
  await lehrer.waitForFunction(() => { const i = document.querySelector('.z-vollbild img'); return i.complete && i.naturalWidth >= 1600; });
  pruefe((await lehrer.getAttribute('.z-vollbild img', 'src')) === 'bilder/kaltstart.jpg', 'Beamer: Kaltstart beginnt mit dem Bild im Vollbild');
  pruefe(await lehrer.evaluate(() => { const r = document.querySelector('.z-vollbild').getBoundingClientRect(); return r.width === innerWidth && r.height === innerHeight; }), 'Beamer: Vollbild füllt den ganzen Bildschirm');
  pruefe((await lehrer.textContent('#z-weiter')).includes('Satz zeigen'), 'Beamer: Weiter-Knopf „Satz zeigen“');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_0_vollbild.png') });
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-kalt-satz');
  pruefe((await lehrer.textContent('.z-kalt-satz')).includes('Frau Maler reagiert nicht'), 'Beamer: Kaltstart-Satz');
  pruefe((await lehrer.textContent('.z-kalt-notiz')).includes('Stichworten auf Ihren Zettel'), 'Beamer: Kaltstart fordert zum Aufschreiben auf');
  pruefe(await lehrer.evaluate(() => document.body.classList.contains('z-dunkel')), 'Beamer: Kaltstart dunkel');
  pruefe((await lehrer.getAttribute('.z-kalt', 'style') || '').includes('bilder/kaltstart.jpg'), 'Beamer: Kaltstart-Bild als Hintergrund');
  pruefe(await lehrer.evaluate(async () => (await fetch('bilder/kaltstart.jpg')).ok), 'Beamer: Kaltstart-Bild ladbar');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_1_kaltstart.png') });
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-countdown');
  pruefe((await lehrer.textContent('.z-countdown')).trim() === '10', 'Beamer: Countdown beginnt bei 10');
  await warte(1300);
  pruefe(Number((await lehrer.textContent('.z-countdown')).trim()) <= 9, 'Beamer: Countdown läuft');
  pruefe((await lehrer.textContent('.z-kalt-notiz')).includes('Aufschreiben'), 'Beamer: während des Countdowns „Aufschreiben!“');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_1b_countdown.png') });

  // Zwei Handys
  async function handy(vorname, klasseText) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await mitWorker(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehlerJs.push(vorname + ': ' + e.message));
    await p.goto(BASIS + 'fall.html');
    await p.waitForSelector('#name-feld');
    await p.fill('#name-feld', vorname);
    await p.click(`.klasse-wahl:has-text("${klasseText}")`);
    await p.click('#name-form button[type=submit]');
    await p.waitForSelector('.f-gross');
    return p;
  }
  const h1 = await handy('Lena Kraus', '3BFP2/2');
  const h2 = await handy('Tim Berg', '3BFP2/2');
  pruefe((await h1.textContent('#name-zeile')).includes('Lena K.'), 'Handy: Name „Lena K.“');
  pruefe((await h1.textContent('.f-gross')).includes('Schauen Sie nach vorn'), 'Handy: Kaltstart → nach vorn schauen');

  // Schritt „Ihre 10 Sekunden“
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-qr img');
  pruefe(await lehrer.evaluate(() => { const i = document.querySelector('.z-qr img'); return i.complete && i.naturalWidth > 100; }), 'Beamer: QR-Code wird angezeigt');
  pruefe(!(await lehrer.$('.z-hinweis')) && !(await lehrer.textContent('.z-buehne')).includes('rausgehen'), 'Beamer: kein Hinweis „kurz rausgehen“');
  pruefe((await lehrer.textContent('.z-handy-auftrag')).includes('Jetzt am Smartphone: Beantworten Sie die 2 Fragen'), 'Beamer: „Jetzt am Smartphone“ beim Anmelden');
  await h1.waitForSelector('.f-frage[data-frage="kalttat"]', { timeout: 8000 });
  await h1.click('.f-opt[data-frage="kalttat"][data-kuerzel="ANSP"]');
  await h1.click('.f-opt[data-frage="kalttat"][data-kuerzel="RUF"]');
  pruefe(!(await h1.$('.f-frage[data-frage="kalttat"] .f-senden')), 'Handy: Mehrfachauswahl ohne „Senden“-Knopf');
  await h1.waitForSelector('.f-frage[data-frage="kalttat"] .f-ok', { timeout: 3000 });
  pruefe(true, 'Handy: Mehrfachauswahl wird automatisch gesendet');
  await h1.click('.f-opt[data-frage="kaltsicher"][data-kuerzel="2"]');
  await h2.waitForSelector('.f-frage[data-frage="kalttat"]', { timeout: 8000 });
  await h2.click('.f-opt[data-frage="kalttat"][data-kuerzel="NICHTS"]');
  await h2.waitForSelector('.f-frage[data-frage="kalttat"] .f-ok', { timeout: 3000 });
  await h2.click('.f-opt[data-frage="kaltsicher"][data-kuerzel="1"]');
  await warte(2600);
  const pillen = await lehrer.$$eval('.l-pille.l-fertig .l-name', (e) => e.map((x) => x.textContent));
  pruefe(pillen.length === 2 && pillen.includes('Lena K.') && pillen.includes('Tim B.'), 'Beamer: beide Namen mit ✓');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_2_anmelden.png'), fullPage: true });
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_anmelden.png'), fullPage: true });
  await lehrer.keyboard.press('ArrowRight'); // Ergebnis
  await lehrer.waitForSelector('.z-skala');
  pruefe((await lehrer.textContent('.z-schnitt')).includes('1,5'), 'Beamer: Durchschnitt Sicherheit 1,5');
  pruefe((await lehrer.textContent('.z-ergebnis')).includes('(50\u00a0%)'), 'Beamer: Anteile in Prozent');
  await h1.waitForSelector('.f-opt:disabled', { timeout: 8000 });
  pruefe((await h1.textContent('#f-inhalt')).includes('Die Abstimmung ist beendet'), 'Handy: nach „Ergebnis zeigen“ gesperrt');

  // Vorstellung: Christin und Frau Maler (nach dem Kaltstart, vor Station 1)
  pruefe((await lehrer.textContent('#z-weiter')).includes('Vorstellung'), 'Beamer: nach „Ihre 10 Sekunden“ kommt die Vorstellung');
  await lehrer.keyboard.press('ArrowRight');
  const personenSchritt = FALL.schritte.find((x) => x.id === 'personen');
  if (personenSchritt.bild) {
    await lehrer.waitForSelector('.z-vollbild');
    pruefe((await lehrer.textContent('.z-vollbild-titel')) === 'Vorstellung', 'Beamer: Vorstellung beginnt mit dem Bild im Vollbild');
    await lehrer.click('.z-vollbild');
    await lehrer.waitForSelector('.z-personen.z-mit-bild .z-bild img');
    pruefe(true, 'Beamer: Bild steht danach neben den Namenskarten');
  }
  await lehrer.waitForSelector('.z-person');
  const personenNamen = await lehrer.$$eval('.z-person-name', (e) => e.map((x) => x.textContent));
  pruefe(JSON.stringify(personenNamen) === JSON.stringify(['Christin', 'Frau Maler']), 'Beamer: Vorstellung zeigt Christin und Frau Maler');
  pruefe((await lehrer.textContent('.z-buehne')).includes('Genau diese Situation hat Christin erlebt.'), 'Beamer: Vorstellung knüpft an den Kaltstart an');
  pruefe(!(await lehrer.$('.z-vollbild')), 'Beamer: Namenskarten ohne Vollbild darüber');
  await h1.waitForSelector('#f-inhalt .f-vorstellung', { timeout: 8000 });
  pruefe((await h1.$$('#f-inhalt .f-vorstellung')).length === 2 && (await h1.textContent('#f-inhalt')).includes('Schauen Sie nach vorn'), 'Handy: Vorstellung mit 2 Karten, Blick nach vorn');
  pruefe((await h1.textContent('#f-leiste')).includes('Vorstellung'), 'Handy: Kopfzeile „Vorstellung“');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_2b_personen.png') });
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_personen.png'), fullPage: true });
  // Angaben auf den Karten stehen so auch im Falltext (keine erfundenen Fakten)
  const falltextGesamt = await lehrer.evaluate(() => window.FALL.text.map((t) => t.text).join(' '));
  pruefe(falltextGesamt.includes('71 Jahre') && falltextGesamt.includes('neu im Pflegeheim') && falltextGesamt.includes('Christin von ihren Erlebnissen im letzten pflegepraktischen Einsatz'), 'Vorstellung: Angaben stehen im Falltext');

  // Station 1 und 2 – jede beginnt mit dem Bild im Vollbild
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-vollbild');
  pruefe((await lehrer.textContent('.z-vollbild-titel')) === '1 · Die Übergabe', 'Beamer: Station 1 beginnt mit dem Bild im Vollbild');
  await h1.waitForSelector('#f-inhalt .f-bild', { timeout: 8000 });
  pruefe((await h1.textContent('#f-inhalt')).includes('Schauen Sie nach vorn') && !(await h1.$('#f-inhalt .f-frage')), 'Handy: während des Vollbilds nur Bild, noch kein Text');
  await lehrer.click('.z-vollbild'); // Klick aufs Bild = weiter
  await lehrer.waitForSelector('.z-falltext');
  pruefe(await lehrer.$('.z-bild img') !== null, 'Beamer: danach steht das Bild klein neben dem Text');
  pruefe((await lehrer.textContent('.z-falltext')).includes('Frau Maler ist seit gestern Nachmittag neu im Pflegeheim.'), 'Beamer: Station 1 zeigt den Falltext');
  await h1.waitForSelector('.f-frage[data-frage="s1"]', { timeout: 8000 });
  const stationenGesamt = FALL.schritte.filter((x) => x.art === 'station').length;
  pruefe(stationenGesamt === 10 && (await h1.textContent('#f-leiste')).includes('Station 1 von 10'), 'Handy: „Station 1 von 10“ (mit den zusätzlichen Situationen)');

  // Wörter im Falltext antippen → Begriffsparkplatz (der Text bleibt Zeichen für Zeichen gleich)
  const s1Absaetze = await h1.$$eval('#f-inhalt .f-falltext p', (ps) => ps.map((x) => x.textContent));
  pruefe(JSON.stringify(s1Absaetze) === JSON.stringify(absaetze.slice(0, 3)), 'Handy: Falltext mit antippbaren Wörtern unverändert');
  const beamerAbsaetze = await lehrer.$$eval('.z-buehne .z-falltext p', (ps) => ps.map((x) => x.textContent));
  pruefe(JSON.stringify(beamerAbsaetze) === JSON.stringify(absaetze.slice(0, 3)), 'Beamer: Falltext in Vorlese-Abschnitten unverändert');

  // Vorlesen: zufällig eine angemeldete Person, Abschnitt markiert (Beamer und Handys)
  pruefe((await lehrer.$$('.z-falltext .z-lese')).length === 5, 'Vorlesen: Station 1 hat 5 Abschnitte (2–3 Sätze)');
  await lehrer.click('[data-lesen="weiter"]');   // 🎲 Wer liest vor?
  await lehrer.waitForSelector('.z-lesen-an');
  const leser1 = await lehrer.textContent('.z-lese-wer strong');
  pruefe(['Lena K.', 'Tim B.'].includes(leser1) && (await lehrer.textContent('.z-lese-wer')).includes('Abschnitt 1 von 5'), 'Vorlesen: zufällige Person liest Abschnitt 1 von 5 (' + leser1 + ')');
  pruefe((await lehrer.getAttribute('.z-lesen-an', 'data-lese')) === '0' && (await lehrer.textContent('.z-lesen-an')).startsWith('Frau Maler ist seit gestern'), 'Vorlesen: Beamer markiert den 1. Abschnitt');
  pruefe((await lehrer.textContent('.z-leser-marke')).includes(leser1), 'Vorlesen: Name steht am Anfang des Abschnitts');
  const [dran, nichtDran] = leser1 === 'Lena K.' ? [h1, h2] : [h2, h1];
  await dran.waitForSelector('.f-lesen-an[data-lese="0"]', { timeout: 8000 });
  await dran.waitForSelector('.f-lesen-ich:not([hidden])', { timeout: 8000 });
  pruefe((await dran.textContent('.f-lesen-ich')).includes('Sie sind dran'), 'Vorlesen: Handy der Person zeigt „Sie sind dran“');
  await nichtDran.waitForSelector('.f-lesen-an[data-lese="0"]', { timeout: 8000 });
  pruefe(await nichtDran.isHidden('.f-lesen-ich'), 'Vorlesen: die anderen sehen die Markierung, aber nicht „Sie sind dran“');
  await dran.screenshot({ path: path.join(__dirname, 'fall_h_vorlesen.png') });
  await lehrer.click('[data-lesen="weiter"]');   // nächster Abschnitt
  await lehrer.waitForSelector('.z-lesen-an[data-lese="1"]');
  const leser2 = await lehrer.textContent('.z-lese-wer strong');
  pruefe(leser2 !== leser1 && (await lehrer.$$('.z-lesen-vorbei')).length === 1, 'Vorlesen: nächster Abschnitt, andere Person, der erste ist „gelesen“');
  await warte(900);   // sanftes Scrollen abwarten
  const lage = await lehrer.evaluate(() => { const r = document.querySelector('.z-lesen-an').getBoundingClientRect(); return [r.top, r.bottom, window.innerHeight]; });
  pruefe(lage[0] > 60 && lage[1] < lage[2] - 90, 'Vorlesen: markierter Abschnitt ist ganz zu sehen (' + lage.map(Math.round).join('/') + ')');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3a1_vorlesen.png') });
  await lehrer.click('[data-lesen="anders"]');   // ↻ jemand anderes
  await lehrer.waitForFunction((alt) => { const e = document.querySelector('.z-lese-wer strong'); return e && e.textContent !== alt; }, leser2);
  pruefe((await lehrer.getAttribute('.z-lesen-an', 'data-lese')) === '1', 'Vorlesen: „Jemand anderes“ – gleicher Abschnitt, andere Person');
  await lehrer.keyboard.press('v');   // Taste V = nächster Abschnitt
  await lehrer.waitForSelector('.z-lesen-an[data-lese="2"]');
  pruefe(true, 'Vorlesen: Taste V schaltet weiter');
  await h1.waitForSelector('.f-lesen-an[data-lese="2"]', { timeout: 8000 });
  pruefe((await h1.$$('.f-lesen-vorbei')).length === 2, 'Vorlesen: Handy folgt (Abschnitt 3, zwei schon gelesen)');
  for (let i = 0; i < 3; i++) await lehrer.click('[data-lesen="weiter"]');   // bis zum Ende: „✓ Fertig“
  await lehrer.waitForFunction(() => !document.querySelector('.z-lesen-an'));
  pruefe((await lehrer.textContent('[data-lesen="weiter"]')).includes('Wer liest vor'), 'Vorlesen: nach „Fertig“ keine Markierung mehr');
  await h1.waitForFunction(() => !document.querySelector('.f-lesen-an'), null, { timeout: 8000 });
  pruefe(await h1.isHidden('.f-lesen-ich') && await h2.isHidden('.f-lesen-ich'), 'Vorlesen: Handys ohne Markierung und ohne „Sie sind dran“');
  const wort = (t) => h1.locator('#f-inhalt .f-wort', { hasText: new RegExp('^' + t + '$') }).first();
  await wort('Heparin-Spritze').click();
  await h1.waitForSelector('#f-parkleiste:not([hidden])');
  pruefe((await h1.textContent('.f-pl-wort')) === '„Heparin-Spritze“', 'Handy: angetipptes Wort erscheint zum Parken');
  await wort('zur').click();
  pruefe((await h1.textContent('.f-pl-wort')) === '„Heparin-Spritze zur“', 'Handy: Wort daneben wird dazugenommen');
  await wort('zur').click();
  pruefe((await h1.textContent('.f-pl-wort')) === '„Heparin-Spritze“', 'Handy: noch einmal tippen nimmt es wieder weg');
  await h1.click('#f-pl-zu');
  pruefe(await h1.isHidden('#f-parkleiste'), 'Handy: Abbrechen schließt die Leiste');
  await wort('Fast-Track-Chirurgie').click();
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_wort.png') });
  await h1.click('#f-pl-parken');
  await h1.waitForSelector('.f-pl-ok:has-text("geparkt")');
  pruefe(await wort('Fast-Track-Chirurgie').evaluate((e) => e.classList.contains('f-geparkt')), 'Handy: geparktes Wort ist markiert');
  pruefe((await h1.textContent('#f-meine-woerter')).includes('Fast-Track-Chirurgie'), 'Handy: Liste der eigenen Wörter');
  await lehrer.waitForSelector('.z-park:not([hidden])', { timeout: 6000 });
  pruefe((await lehrer.textContent('.z-park')).includes('Fast-Track-Chirurgie'), 'Beamer: geparktes Wort live in der Kopfzeile');
  pruefe((await h1.$$('.f-frage[data-frage="s1"] .f-opt')).length === 9, 'Station 1: 9 Risiken zur Auswahl');
  await h1.click('.f-opt[data-kuerzel="THROMB"]');
  await h1.click('.f-opt[data-kuerzel="UNTERZ"]');
  await h1.waitForSelector('.f-frage[data-frage="s1"] .f-ok', { timeout: 3000 });
  await warte(400);
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3a0_station1_frage.png') });
  console.log('  (Info) Station 1 Abstimmung: Seitenhöhe ' + (await lehrer.evaluate(() => document.documentElement.scrollHeight + ' / Fenster ' + window.innerHeight)));
  pruefe((await lehrer.textContent('.z-handy-auftrag')).includes('Wählen Sie alle Risiken') && !(await lehrer.textContent('.z-handy-auftrag')).includes('Senden'), 'Beamer: Station 1 sagt, was am Smartphone zu tun ist');
  await lehrer.click('#z-weiter'); // Ergebnis
  pruefe((await lehrer.textContent('#z-weiter')).includes('Auflösen: Was passt?'), 'Beamer: Station 1 hat eine Auflösung');
  pruefe(!(await lehrer.$('.z-handy-auftrag')), 'Beamer: nach dem Abstimmen kein Smartphone-Auftrag mehr');
  pruefe(!(await lehrer.$('.z-passt-nicht')), 'Beamer: bei „Ergebnis zeigen“ noch nicht aufgelöst');
  await lehrer.click('#z-weiter'); // Auflösen
  await lehrer.waitForSelector('.z-passt-nicht');
  pruefe((await lehrer.$$('.z-passt')).length === 6 && (await lehrer.$$('.z-passt-nicht')).length === 3, 'Beamer: 6 passende, 3 unpassende Risiken markiert');
  pruefe((await lehrer.textContent('.z-passt-nicht')).includes('kein Diabetes bekannt'), 'Beamer: Begründung bei unpassendem Risiko');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3a_station1.png'), fullPage: true });
  await h1.waitForSelector('.f-opt.f-passt-nicht', { timeout: 8000 });
  pruefe((await h1.textContent('.f-opt[data-kuerzel="UNTERZ"]')).includes('passt nicht'), 'Handy: Rückmeldung zu eigener unpassender Wahl');
  pruefe((await h1.getAttribute('.f-opt[data-kuerzel="THROMB"]', 'class')).includes('f-passt'), 'Handy: Rückmeldung zu passender Wahl');
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_station1.png'), fullPage: true });
  await lehrer.click('#z-weiter'); // Station 2 (Vollbild)
  await lehrer.waitForSelector('.z-vollbild');
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-nr');
  pruefe((await lehrer.textContent('.z-falltext')).includes('ihre rechte Wade sei seit gestern dick'), 'Beamer: Station 2 bis zur Stopp-Stelle');
  pruefe(!(await lehrer.textContent('.z-buehne')).includes('habe es nicht weitergegeben'), 'Beamer: Christins Handeln noch verdeckt');
  await lehrer.waitForFunction(() => { const i = document.querySelector('.z-bild img'); return i && i.complete && i.naturalWidth >= 1600; });
  pruefe((await lehrer.getAttribute('.z-bild img', 'src')) === 'bilder/station2.jpg', 'Beamer: Bild zu Station 2 (große Fassung)');
  await h1.waitForSelector('.f-frage[data-frage="s2"]', { timeout: 8000 });
  pruefe(!(await h1.textContent('#f-inhalt')).includes('habe es nicht weitergegeben'), 'Handy: Christins Handeln noch verdeckt');
  await h1.waitForFunction(() => { const i = document.querySelector('.f-bild'); return i && i.complete && i.naturalWidth === 800; });
  pruefe((await h1.getAttribute('.f-bild', 'alt')).includes('rechte Wade'), 'Handy: Bild zu Station 2 (kleine Fassung, mit Beschreibung)');
  pruefe((await h1.textContent('#f-bisher-text')).includes('Frau Maler ist seit gestern'), 'Handy: „Den Fall bis hier lesen“ enthält Station 1');
  await h1.click('.f-ampel .f-rot');
  await h2.waitForSelector('.f-frage[data-frage="s2"]', { timeout: 8000 });
  await h2.click('.f-ampel .f-gruen');
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_station2.png'), fullPage: true });
  await warte(2300);
  await lehrer.click('#z-weiter'); // Ergebnis
  await lehrer.click('#z-weiter'); // Auflösen
  await lehrer.waitForSelector('.z-aufloesung');
  pruefe((await lehrer.textContent('.z-aufloesung')).includes('Ich dachte, das komme von der Operation, und habe es nicht weitergegeben.'), 'Beamer: Auflösung wörtlich');
  pruefe((await lehrer.textContent('.z-christin')).includes('nicht weitergegeben'), 'Beamer: Christins Ampel markiert');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3_station2.png'), fullPage: true });
  await h1.waitForSelector('.f-aufloesung', { timeout: 8000 });
  pruefe((await h1.textContent('.f-aufloesung')).includes('habe es nicht weitergegeben'), 'Handy: Auflösung erscheint');
  pruefe((await h1.getAttribute('.f-ampel .f-rot', 'aria-pressed')) === 'true', 'Handy: eigene Antwort bleibt sichtbar');

  // Zusätzliche Situation (nicht im Fallbeispiel): alles normal → Einschätzung beim Auflösen
  pruefe((await lehrer.textContent('#z-weiter')).includes('Station 3 · Nach der Körperpflege'), 'Beamer: nach Station 2 folgt die zusätzliche Situation als Station 3');
  await lehrer.click('#z-weiter');
  await lehrer.waitForSelector('.z-falltext');
  pruefe(!(await lehrer.$('.z-vollbild')), 'Beamer: zusätzliche Situation ohne Bild');
  pruefe((await lehrer.textContent('.z-titel')).includes('3') && (await lehrer.textContent('.z-falltext')).includes('erzählte mir von ihrem Garten'), 'Beamer: zusätzliche Situation sieht aus wie eine Station');
  await h1.waitForSelector('.f-frage[data-frage="z1"]', { timeout: 8000 });
  pruefe((await h1.textContent('#f-leiste')).includes('Station 3 von 10'), 'Handy: „Station 3 von 10“');
  pruefe(!(await h1.textContent('#f-bisher-text')).includes('Garten'), 'Handy: zusätzliche Situation nicht bei „Den Fall bis hier lesen“');
  await h1.click('.f-ampel .f-gelb');
  await h2.waitForSelector('.f-frage[data-frage="z1"]', { timeout: 8000 });
  await h2.click('.f-ampel .f-gruen');
  await warte(2300);
  await lehrer.click('#z-weiter'); // Ergebnis
  pruefe((await lehrer.textContent('#z-weiter')).includes('Auflösen: Was passt?'), 'Beamer: zusätzliche Situation hat eine Auflösung');
  await lehrer.click('#z-weiter'); // Auflösen
  await lehrer.waitForSelector('.z-einschaetzung');
  pruefe((await lehrer.textContent('.z-einschaetzung')).includes('🟢 Alles normal') && (await lehrer.textContent('.z-einschaetzung')).includes('nichts zu melden'), 'Beamer: Einschätzung „🟢 Alles normal“ mit Begründung');
  pruefe(!(await lehrer.$('.z-christin')), 'Beamer: keine „Christin“-Markierung bei der zusätzlichen Situation');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3e_extra.png') });
  await h1.waitForSelector('.f-aufloesung', { timeout: 8000 });
  pruefe((await h1.textContent('.f-aufloesung')).includes('Einschätzung') && (await h1.textContent('.f-aufloesung')).includes('Alles normal'), 'Handy: Einschätzung erscheint');
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_extra.png'), fullPage: true });
  pruefe((await lehrer.textContent('#z-weiter')).includes('Station 4 · Beim Frühstück'), 'Beamer: danach geht es mit dem Fall weiter (Station 4)');

  // Station 5: die 3 wichtigsten Schritte aus 8 in der richtigen Reihenfolge antippen
  const s5Index = FALL.schritte.findIndex((x) => x.id === 's5');
  const s5 = FALL.schritte[s5Index].frage;
  const richtig = s5.optionen.slice(0, s5.anzahl).map((o) => o.kuerzel);
  pruefe(s5.anzahl === 3 && s5.optionen.length === 8 && s5.optionen.slice(3).every((o) => o.grund), 'Station 5: 3 richtige aus 8, unpassende mit Grund');
  await lehrer.click(`[data-gehe="${s5Index}"]`);
  await lehrer.waitForSelector('.z-vollbild');
  await lehrer.keyboard.press('ArrowRight');
  await h1.waitForSelector('.f-frage[data-frage="s5"] .f-folge-opt', { timeout: 8000 });
  pruefe((await h1.$$('.f-folge-opt')).length === 8, 'Handy: Station 5 zeigt 8 Aktionen');
  const tippe = async (h, k) => h.click(`.f-folge-opt[data-kuerzel="${k}"]`);
  await tippe(h1, richtig[1]); await tippe(h1, richtig[0]);
  pruefe((await h1.textContent(`.f-folge-opt[data-kuerzel="${richtig[0]}"] .f-platz`)) === '2', 'Handy: angetippte Schritte bekommen ihre Platznummer');
  await tippe(h1, richtig[1]);   // wieder herausnehmen
  pruefe((await h1.textContent(`.f-folge-opt[data-kuerzel="${richtig[0]}"] .f-platz`)) === '1', 'Handy: herausnehmen – die anderen rücken nach');
  pruefe((await h1.textContent('.f-frage[data-frage="s5"] .f-auto')).includes('Noch 2 antippen'), 'Handy: „Noch 2 antippen – dann wird … automatisch gesendet“');
  await tippe(h1, richtig[1]); await tippe(h1, richtig[2]);
  pruefe(await h1.isDisabled('.f-folge-opt[data-kuerzel="PULS"]'), 'Handy: nach 3 Schritten sind die übrigen gesperrt');
  await h1.waitForSelector('.f-frage[data-frage="s5"] .f-ok', { timeout: 3000 });
  pruefe(true, 'Handy: Reihenfolge wird nach dem 3. Schritt automatisch gesendet');
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_station5.png'), fullPage: true });
  await h2.waitForSelector('.f-frage[data-frage="s5"] .f-folge-opt', { timeout: 8000 });
  for (const k of ['ANSP', 'PULS', 'RUF']) await tippe(h2, k);   // Puls fühlen passt nicht
  await h2.waitForSelector('.f-frage[data-frage="s5"] .f-ok', { timeout: 3000 });
  await warte(2300);
  await lehrer.click('#z-weiter'); // Ergebnis
  await lehrer.waitForSelector('.z-platz');
  pruefe((await lehrer.$$('.z-platz')).length === 3 && (await lehrer.textContent('.z-platz')).includes('Ansprechen'), 'Beamer: je Platz, was die Klasse gewählt hat');
  pruefe(!(await lehrer.$('.z-folge-ganz')) && !(await lehrer.$('.z-merksatz')), 'Beamer: Lösung erst bei „Auflösen“');
  await lehrer.click('#z-weiter'); // Auflösen
  await lehrer.waitForSelector('.z-folge-ganz');
  pruefe((await lehrer.textContent('.z-folge-ganz')).includes('1 von 2'), 'Beamer: „Ganz richtig: 1 von 2“');
  pruefe((await lehrer.textContent('.z-merksatz')).includes('Prüfen – Rufen – Drücken'), 'Beamer: Merksatz Prüfen – Rufen – Drücken');
  pruefe((await lehrer.textContent('.z-grundliste')).includes('Den Puls fühlen'), 'Beamer: gewählte unpassende Aktion mit Grund');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3b_station5.png'), fullPage: true });
  // Vorlesen auch bei „Christin erzählt weiter“ (langer Text: 5 Abschnitte zu 3 Sätzen)
  await lehrer.click('.z-aufloesung [data-lesen="weiter"]');
  await lehrer.waitForSelector('.z-aufloesung .z-lesen-an[data-lese="0"]');
  pruefe((await lehrer.textContent('.z-aufloesung .z-lese-wer')).includes('Abschnitt 1 von 5') && (await lehrer.textContent('.z-aufloesung .z-lesen-an')).startsWith('Ich habe daraufhin sofort'), 'Vorlesen: auch die Auflösung (Abschnitt 1 von 5)');
  await h1.waitForSelector('.f-aufloesung .f-lesen-an[data-lese="0"]', { timeout: 8000 });
  pruefe(!(await h1.$('#f-inhalt > .f-falltext .f-lesen-an')), 'Vorlesen: Handy markiert nur in der Auflösung');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3b1_vorlesen_aufl.png') });
  await h1.waitForSelector('.f-folge-ok', { timeout: 8000 });
  pruefe((await h1.$$('.f-folge-ok')).length === 3, 'Handy: richtige Wahl – alle 3 mit ✓');
  await h2.waitForSelector('.f-folge-falsch', { timeout: 8000 });
  const h2Falsch = await h2.$$eval('.f-folge-falsch', (e) => e.map((x) => x.textContent).join(' | '));
  pruefe(h2Falsch.includes('passt nicht') && h2Falsch.includes('richtig: Platz 2'), 'Handy: unpassende Aktion mit Grund, richtige auf falschem Platz mit richtigem Platz');

  // Station 7: genau 3 wählen – eine echte Entscheidung; Auflösung mit ✓/✗
  const s7Index = FALL.schritte.findIndex((x) => x.id === 's7');
  await lehrer.click(`[data-gehe="${s7Index}"]`);
  await lehrer.waitForSelector('.z-vollbild');
  await lehrer.keyboard.press('ArrowRight');
  await h1.waitForSelector('.f-frage[data-frage="s7"] .f-opt', { timeout: 8000 });
  pruefe((await lehrer.textContent('.z-handy-auftrag')).includes('Wählen Sie genau 3 Dinge aus'), 'Beamer: Station 7 – „Wählen Sie genau 3 Dinge aus“');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3d_handyauftrag.png') });
  for (const k of ['REDEN', 'TEAM']) await h1.click(`.f-opt[data-kuerzel="${k}"]`);
  pruefe((await h1.textContent('.f-frage[data-frage="s7"] .f-auto')).includes('Noch 1 wählen'), 'Handy: „Noch 1 wählen – dann … automatisch gesendet“');
  await warte(900);
  pruefe(!(await h1.$('.f-frage[data-frage="s7"] .f-ok')), 'Handy: bei 2 von 3 wird nichts gesendet');
  await h1.click('.f-opt[data-kuerzel="PROFI"]');
  pruefe(await h1.isDisabled('.f-opt[data-kuerzel="NIX"]'), 'Handy: nach 3 gewählten sind die übrigen gesperrt');
  await h1.waitForSelector('.f-frage[data-frage="s7"] .f-ok', { timeout: 3000 });
  await lehrer.waitForSelector('.l-pille.l-fertig:has-text("Lena K.")', { timeout: 6000 });
  pruefe(true, 'Beamer: ✓ bei Lena nach der 3. Auswahl');
  await h1.click('.f-opt[data-kuerzel="PROFI"]');   // wieder abwählen → Antwort wird zurückgezogen
  await lehrer.waitForSelector('.l-pille.l-offen:has-text("Lena K.")', { timeout: 6000 });
  pruefe((await h1.textContent('.f-frage[data-frage="s7"] .f-auto')).includes('Noch 1 wählen'), 'Handy + Beamer: nur 2 von 3 → Antwort zurückgezogen, ✓ weg');
  await h1.click('.f-opt[data-kuerzel="PROFI"]');
  await h1.waitForSelector('.f-frage[data-frage="s7"] .f-ok', { timeout: 3000 });
  await h2.waitForSelector('.f-frage[data-frage="s7"] .f-opt', { timeout: 8000 });
  for (const k of ['NIX', 'REDEN', 'SCHULD']) await h2.click(`.f-opt[data-kuerzel="${k}"]`);
  await h2.waitForSelector('.f-frage[data-frage="s7"] .f-ok', { timeout: 3000 });
  await warte(2300);
  await lehrer.click('#z-weiter'); // Ergebnis
  await lehrer.waitForSelector('.z-ergebnis .z-zeile');
  pruefe((await lehrer.textContent('.z-zeile')).includes('Vertrauensperson'), 'Beamer: Station 7 nach Häufigkeit sortiert (2× zuerst)');
  pruefe((await lehrer.textContent('.z-ergebnis-kopf')).includes('je 3 gewählt'), 'Beamer: „je 3 gewählt“');
  await lehrer.click('#z-weiter'); // Auflösen
  await lehrer.waitForSelector('.z-hinweis-aufl');
  pruefe((await lehrer.$$('.z-passt-nicht')).length === 3, 'Beamer: 3 nicht hilfreiche Antworten markiert');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_3c_station7.png'), fullPage: true });
  await h2.waitForSelector('.f-opt.f-passt-nicht', { timeout: 8000 });
  pruefe((await h2.textContent('.f-opt[data-kuerzel="NIX"]')).includes('passt nicht'), 'Handy: Rückmeldung zu „Nichts“');

  // Sprung zum Zurückspulen (Punkt in der Steuerleiste)
  const zurueckIndex = FALL.schritte.findIndex((s) => s.id === 'zurueck');
  await lehrer.click(`[data-gehe="${zurueckIndex}"]`);
  await lehrer.waitForSelector('.z-zeitstrahl');
  pruefe((await lehrer.$$('.z-zeitstrahl li')).length === 7, 'Beamer: Zeitstrahl mit den 7 Stationen des Fallbeispiels');
  pruefe(!(await lehrer.textContent('.z-zeitstrahl')).includes('Gegen neun Uhr'), 'Beamer: zusätzliche Situationen nicht im Zeitstrahl');
  pruefe(!(await h1.textContent('#f-bisher-text')).includes('Fernbedienung'), 'Handy: ganzer Fall ohne zusätzliche Situationen');
  pruefe((await lehrer.textContent('.z-handy-auftrag')).includes('Wählen Sie einen Zeitpunkt'), 'Beamer: Zurückspulen mit Smartphone-Auftrag');
  await lehrer.waitForFunction(() => [...document.querySelectorAll('.z-zs-bild')].every((i) => i.complete && i.naturalWidth > 0));
  pruefe((await lehrer.$$('.z-zs-bild')).length === 5, 'Beamer: Zeitstrahl mit 5 Bildern');
  pruefe((await lehrer.textContent('.z-zeitstrahl')).includes('🔴 50\u00a0%'), 'Beamer: Zeitstrahl zeigt Ampel-Anteile');
  await h1.waitForSelector('.f-frage[data-frage="zurueck"]', { timeout: 8000 });
  pruefe((await h1.textContent('#f-bisher-text')).includes('kaltschweißig auf.“'), 'Handy: beim Zurückspulen ist der ganze Fall nachlesbar');
  await h1.click('.f-opt[data-kuerzel="S2"]');
  await warte(2300);
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_4_zurueck.png'), fullPage: true });

  // Perspektiven: Gruppen werden automatisch eingeteilt, Namen stehen bei der Gruppe
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-spalten');
  await h1.waitForSelector('.f-gruppe', { timeout: 10000 });
  await h2.waitForSelector('.f-gruppe', { timeout: 10000 });
  const g1 = await h1.getAttribute('.f-gruppe', 'data-gruppe');
  let g2 = await h2.getAttribute('.f-gruppe', 'data-gruppe');
  pruefe(g1 && g2 && g1 !== g2, 'Gruppen: automatisch und gleichmäßig eingeteilt (' + g1 + ', ' + g2 + ')');
  pruefe((await h1.textContent('#f-gruppe-namen')).includes('Lena K.'), 'Handy: Namen der eigenen Gruppe');
  pruefe(!(await h1.$('.f-person')), 'Handy: Person nicht mehr selbst wählbar');
  await lehrer.waitForSelector('.z-mg');
  pruefe((await lehrer.textContent('.z-spalten')).includes('Lena K.') && (await lehrer.textContent('.z-persp-auftrag')).includes('0 von 2'), 'Beamer: Namen bei den Gruppen, „0 von 2 haben schon etwas geschickt“');
  await h1.fill('#f-a', 'eine klare Anweisung');
  await h1.click('.f-anfang:has-text("Wie")');
  pruefe((await h1.inputValue('#f-b')) === 'Wie ', 'Handy: Satzanfang wird eingefügt');
  await h1.fill('#f-b', 'Wie gebe ich im Notfall klare Anweisungen?');
  await h1.click('#f-persp-form button[type=submit]');
  await h1.waitForSelector('.f-eigene li');
  await warte(2300);
  pruefe((await lehrer.textContent('.z-mg-ok')).includes('Lena K.') && (await lehrer.textContent('.z-mg-ok')).includes('✓ 1'), 'Beamer: ✓ 1 beim Namen nach dem ersten Eintrag');
  // Lehrkraft setzt Tim in die nächste Gruppe
  await lehrer.click('.z-mg:has-text("Tim B.")');
  await h2.waitForFunction((alt) => { const e = document.querySelector('.f-gruppe'); return e && e.getAttribute('data-gruppe') !== alt; }, g2, { timeout: 8000 });
  const g2neu = await h2.getAttribute('.f-gruppe', 'data-gruppe');
  pruefe(g2neu && g2neu !== g2, 'Gruppen: Klick auf den Namen setzt in die nächste Gruppe, das Handy folgt');
  await h2.fill('#f-b', 'Wie überbringe ich eine schlechte Nachricht?');
  await h2.click('#f-persp-form button[type=submit]');
  await h2.waitForSelector('.f-eigene li');
  pruefe((await h2.inputValue('#f-b')) === '' && await h2.isHidden('#f-persp-offen'), 'Handy: nach dem Senden sind die Felder leer');
  // Lena schreibt noch etwas, vergisst aber „Senden“
  await h1.fill('#f-a', 'Ruhe und eine Pause');
  pruefe(await h1.isVisible('#f-persp-offen') && (await h1.textContent('#f-persp-offen')).includes('Noch nicht gesendet'), 'Handy: Hinweis „Noch nicht gesendet“');
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_perspektive.png'), fullPage: true });
  await warte(2300);
  const karten = await lehrer.$$eval('.z-pk', (e) => e.map((x) => x.textContent).join(' '));
  pruefe(karten.includes('eine klare Anweisung') && !karten.includes('Lena'), 'Beamer: Einträge selbst ohne Namen');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_5a_gruppen.png'), fullPage: true });
  pruefe(!(await lehrer.$('[data-kb]')) && !(await lehrer.$('#z-ordnen')), 'Beamer: keine KB-Zuordnung (nur × zum Entfernen)');
  pruefe(!(await lehrer.textContent('.z-buehne')).includes('passenden KB'), 'Beamer: kein Hinweis auf KB-Zuordnung');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_5_perspektiven.png'), fullPage: true });

  // Begriffsparkplatz und Ende
  await h2.fill('#f-wort', 'Redon-Drainage');
  await h2.click('#f-wort-form button');
  await h2.waitForSelector('#f-wort-status:has-text("Danke")');
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-woerter li', { timeout: 6000 });
  await h1.waitForSelector('.f-gross:has-text("Arbeitsblatt")', { timeout: 8000 });
  await warte(500);
  const standNachher = await lehrer.evaluate((u) => fetch(u).then((r) => r.json()), SERVER + '/fall/stand?raum=k2-fall');
  pruefe(standNachher.texte.some((t) => t.art === 'persp' && t.a === 'Ruhe und eine Pause'), 'Handy: vergessener Entwurf wird beim Weiterschalten automatisch gesendet');
  pruefe(standNachher.texte.filter((t) => t.a === 'eine klare Anweisung').length === 1, 'Handy: gesendete Einträge werden nicht doppelt geschickt');
  pruefe((await lehrer.textContent('.z-woerter')).includes('Redon-Drainage'), 'Beamer: Begriffsparkplatz');
  await lehrer.click('.z-block [data-sichern]');
  await lehrer.waitForSelector('.z-gesichert:has-text("Teilnehmende")', { timeout: 6000 });
  const gesichertText = await lehrer.textContent('.z-gesichert');
  pruefe(gesichertText.includes('2 Teilnehmende'), 'Beamer: Ergebnis gesichert: ' + gesichertText);
  await h1.waitForSelector('.f-gross:has-text("Arbeitsblatt")', { timeout: 8000 });
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_6_ende.png'), fullPage: true });

  // Kein waagerechtes Scrollen auf dem Handy
  for (const [n, p] of [['Lena', h1], ['Tim', h2]]) {
    const breit = await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    pruefe(breit, 'Handy ' + n + ': kein waagerechtes Scrollen');
  }

  // Durchgang SW 13: neue Sitzung, Vergleich mit SW 6
  await lehrer.click('input[name=durchgang][value=sw13]');
  await warte(2500);
  pruefe((await lehrer.textContent('#l-status')).includes('SW 13'), 'Beamer: Durchgang SW 13');
  await h1.waitForSelector('.f-gross:has-text("nach vorn")', { timeout: 8000 });
  const s2Index = FALL.schritte.findIndex((s) => s.id === 's2');
  await lehrer.click(`[data-gehe="${s2Index}"]`);
  await lehrer.waitForSelector('.z-vollbild');
  await lehrer.keyboard.press('ArrowRight');
  await h1.waitForSelector('.f-frage[data-frage="s2"]', { timeout: 8000 });
  pruefe((await h1.getAttribute('.f-ampel .f-rot', 'aria-pressed')) === 'false', 'Handy: neue Sitzung – alte Antwort nicht mehr markiert');
  pruefe((await lehrer.textContent('.z-handy-auftrag')).includes('Wählen Sie eine Farbe'), 'Beamer: Ampel mit Smartphone-Auftrag');
  await h1.click('.f-ampel .f-rot');
  await warte(2300);
  await lehrer.click('#z-weiter');
  await lehrer.waitForSelector('.z-vgl');
  pruefe((await lehrer.textContent('.z-ergebnis-kopf')).includes('zum Vergleich: SW 6 (2 Antworten)'), 'Beamer: Vergleich mit der Einführung');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_7_vergleich.png'), fullPage: true });
  const endeIndex = FALL.schritte.findIndex((s) => s.id === 'ende');
  await lehrer.click(`[data-gehe="${endeIndex}"]`);
  await lehrer.waitForSelector('.z-alt li');
  pruefe((await lehrer.textContent('.z-alt')).includes('klare Anweisungen'), 'Beamer SW 13: Lernfragen aus der Einführung');

  pruefe(fehlerJs.length === 0, 'keine JavaScript-Fehler: ' + fehlerJs.join(' | '));
  pruefe(fremd.length === 0, 'keine fremden Anfragen: ' + fremd.join(', '));

  await browser.close();
  web.close();
  console.log(`${ok} Prüfungen bestanden, ${nok} fehlgeschlagen`);
  process.exit(nok ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

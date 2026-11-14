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
  pruefe(stationen.length === 7 && stationen.every((s) => FALL.text.some((t) => t.teil === s.id && t.art === 'frage')), 'jede Station hat einen Abschnitt des Falls');
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
  pruefe(await lehrer.evaluate(() => document.body.classList.contains('z-dunkel')), 'Beamer: Kaltstart dunkel');
  pruefe((await lehrer.getAttribute('.z-kalt', 'style') || '').includes('bilder/kaltstart.jpg'), 'Beamer: Kaltstart-Bild als Hintergrund');
  pruefe(await lehrer.evaluate(async () => (await fetch('bilder/kaltstart.jpg')).ok), 'Beamer: Kaltstart-Bild ladbar');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_1_kaltstart.png') });
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-countdown');
  pruefe((await lehrer.textContent('.z-countdown')).trim() === '10', 'Beamer: Countdown beginnt bei 10');
  await warte(1300);
  pruefe(Number((await lehrer.textContent('.z-countdown')).trim()) <= 9, 'Beamer: Countdown läuft');

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
  pruefe((await lehrer.textContent('.z-hinweis')).includes('kurz rausgehen'), 'Beamer: Hinweis auf Belastung');
  await h1.waitForSelector('.f-frage[data-frage="kalttat"]', { timeout: 8000 });
  await h1.click('.f-opt[data-frage="kalttat"][data-kuerzel="ANSP"]');
  await h1.click('.f-opt[data-frage="kalttat"][data-kuerzel="RUF"]');
  await h1.click('[data-senden="kalttat"]');
  await h1.click('.f-opt[data-frage="kaltsicher"][data-kuerzel="2"]');
  await h2.waitForSelector('.f-frage[data-frage="kalttat"]', { timeout: 8000 });
  await h2.click('.f-opt[data-frage="kalttat"][data-kuerzel="NICHTS"]');
  await h2.click('[data-senden="kalttat"]');
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
  pruefe((await h1.textContent('#f-leiste')).includes('Station 1 von 7'), 'Handy: „Station 1 von 7“');

  // Wörter im Falltext antippen → Begriffsparkplatz (der Text bleibt Zeichen für Zeichen gleich)
  const s1Absaetze = await h1.$$eval('#f-inhalt .f-falltext p', (ps) => ps.map((x) => x.textContent));
  pruefe(JSON.stringify(s1Absaetze) === JSON.stringify(absaetze.slice(0, 3)), 'Handy: Falltext mit antippbaren Wörtern unverändert');
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
  await h1.click('[data-senden="s1"]');
  await warte(400);
  await lehrer.click('#z-weiter'); // Ergebnis
  pruefe((await lehrer.textContent('#z-weiter')).includes('Auflösen: Was passt?'), 'Beamer: Station 1 hat eine Auflösung');
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

  // Sprung zum Zurückspulen (Punkt in der Steuerleiste)
  const zurueckIndex = FALL.schritte.findIndex((s) => s.id === 'zurueck');
  await lehrer.click(`[data-gehe="${zurueckIndex}"]`);
  await lehrer.waitForSelector('.z-zeitstrahl');
  pruefe((await lehrer.$$('.z-zeitstrahl li')).length === 7, 'Beamer: Zeitstrahl mit 7 Stationen');
  await lehrer.waitForFunction(() => [...document.querySelectorAll('.z-zs-bild')].every((i) => i.complete && i.naturalWidth > 0));
  pruefe((await lehrer.$$('.z-zs-bild')).length === 5, 'Beamer: Zeitstrahl mit 5 Bildern');
  pruefe((await lehrer.textContent('.z-zeitstrahl')).includes('🔴 50\u00a0%'), 'Beamer: Zeitstrahl zeigt Ampel-Anteile');
  await h1.waitForSelector('.f-frage[data-frage="zurueck"]', { timeout: 8000 });
  pruefe((await h1.textContent('#f-bisher-text')).includes('kaltschweißig auf.“'), 'Handy: beim Zurückspulen ist der ganze Fall nachlesbar');
  await h1.click('.f-opt[data-kuerzel="S2"]');
  await warte(2300);
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_4_zurueck.png'), fullPage: true });

  // Perspektiven
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-spalten');
  await h1.waitForSelector('.f-person', { timeout: 8000 });
  await h1.click('.f-person[data-person="christin"]');
  await h1.fill('#f-a', 'eine klare Anweisung');
  await h1.click('.f-anfang:has-text("Wie")');
  pruefe((await h1.inputValue('#f-b')) === 'Wie ', 'Handy: Satzanfang wird eingefügt');
  await h1.fill('#f-b', 'Wie gebe ich im Notfall klare Anweisungen?');
  await h1.click('#f-persp-form button[type=submit]');
  await h1.waitForSelector('.f-eigene li');
  await h2.waitForSelector('.f-person', { timeout: 8000 });
  await h2.click('.f-person[data-person="angeh"]');
  await h2.fill('#f-b', 'Wie überbringe ich eine schlechte Nachricht?');
  await h2.click('#f-persp-form button[type=submit]');
  await h2.waitForSelector('.f-eigene li');
  await h1.screenshot({ path: path.join(__dirname, 'fall_h_perspektive.png'), fullPage: true });
  await warte(2300);
  pruefe((await lehrer.textContent('.z-spalten')).includes('eine klare Anweisung') && !(await lehrer.textContent('.z-spalten')).includes('Lena'), 'Beamer: Perspektive ohne Namen');
  await lehrer.click('.z-pk >> nth=0 >> .z-kb[data-kb="II"]');
  await warte(500);
  await lehrer.click('#z-ordnen');
  await lehrer.waitForSelector('.z-sechs');
  const spalteII = await lehrer.textContent('.z-spalte >> nth=1');
  pruefe(spalteII.includes('KB II') && spalteII.includes('klare Anweisungen'), 'Beamer: Lernfrage unter KB II einsortiert');
  await lehrer.screenshot({ path: path.join(__dirname, 'fall_5_perspektiven.png'), fullPage: true });

  // Begriffsparkplatz und Ende
  await h2.fill('#f-wort', 'Redon-Drainage');
  await h2.click('#f-wort-form button');
  await h2.waitForSelector('#f-wort-status:has-text("Danke")');
  await lehrer.keyboard.press('ArrowRight');
  await lehrer.waitForSelector('.z-woerter li', { timeout: 6000 });
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

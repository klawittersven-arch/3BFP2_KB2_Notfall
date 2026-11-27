/* Automatischer Test aller Übungen in Handygröße, der Challenges und der Lehrerseiten (Playwright, Chromium).
 * Aufruf (im Repository-Ordner):  node tests/uebungen.test.js
 * Seit 26.11.2026: Kartenstapel (eine Karte nach der anderen) mit Herzen, Serie, Lesezeit, Sternen und Wochen-Challenge.
 * Teil A:  jede Übung ohne Server – Aufwärmen, Tipp, Sperre nach Fehler, Schritt 2, Weiter, Sterne, Zusammenfassung,
 *          Bonus-Fall, zweite richtige Antwort, Neuladen, „Noch einmal üben“, Links nur zu Spiel/Challenge, 360 px.
 * Teil A2: Reihenfolge – je Handy anders, beim Neuladen gleich, Stapel folgt ihr, nie im Wechsel/sortiert/mehr als 3 gleiche.
 * Teil A3: Herzen (Lesepause und Neustart mit neuer Mischung, ↺ auf der Lehrerseite), Serie gibt ein Herz zurück,
 *          Lesezeit-Warnungen und Lesepause, schnelle falsche Antwort, Schritt 2 im Detail.
 * Teil B:  Namenseingabe mit Klassenwahl, Senden des Fortschritts inkl. Sterne (nachgebildeter Server).
 * Teil C:  Lehrerseiten je Klasse – Namen, Sterne, Oft falsch, Besprechen, Entfernen, Leeren.
 * Teil E:  Belohnungsspiel nach ab3a.
 * Teil F:  Wochen-Challenge auf dem Handy – gesperrt, Freischaltung, Lauf, Ergebnis, Senden; TB2-Challenge.
 * Teil G:  Bestenliste der Challenge auf der Lehrerseite – Siegerehrung, QR-Code, Entfernen, Leeren.
 * Teil H:  Minispiel „Stör-Abwehr“ nach kb2ab05 – gesperrt, Freischaltung, Spielen, 3 Läufe, neue Läufe, Pause, Lehrerseite.
 * Die Lesezeit ist außer in Teil A3 ausgeschaltet (sonst würden die schnellen Testklicks Warnungen auslösen). */
'use strict';
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const SERVER = 'https://fortschritt.test';
const P = 'kb2-notfall-';          // Speicher-Präfix dieser Übungen
const SPERRE = 1650;               // nach einem Fehler sind die Knöpfe 1,5 s gesperrt
const HANDY = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true };
const BEAMER = { viewport: { width: 1280, height: 720 } };

global.window = {};
eval(fs.readFileSync(path.join(DOCS, 'inhalte.js'), 'utf8') + ';global.I = INHALTE;');
const IDS = Object.keys(I).filter(k => I[k] && I[k].karten);
const richtigeVon = k => [].concat(k.richtig);
const falscheVon = (U, k) => U.knoepfe.map(b => b.kuerzel).filter(x => !richtigeVon(k).includes(x));
const nachNummer = (U, nr) => U.karten.find(k => k.nummer === nr);
const ohneSterne = s => String(s).replace(/\*\*?/g, '');
const woerter = s => String(s || '').replace(/\*/g, '').split(/\s+/).filter(Boolean).length;
const leseZeit = (U, k) => Math.min(6, 0.8 + 0.1 * (woerter(k.text) + U.knoepfe.reduce((n, b) => n + woerter(b.text), 0)));
const challengePunkte = (r, g, sek) => 100 * r + Math.round(500 * (g ? r / g : 0) * Math.max(0, 1 - sek / 600));

// einstellungen.js für die Tests anpassen
function einstellungen(text, server, o = {}) {
  text = text.replace(/serverAdresse: '[^']*'/, `serverAdresse: '${server}'`)
    .replace(/lesezeit: (true|false)/, `lesezeit: ${!!o.lesezeit}`)
    .replace(/leerePauseSekunden: [\d.]+/, `leerePauseSekunden: ${o.leer !== undefined ? o.leer : 1}`)
    .replace(/langsamPauseSekunden: [\d.]+/, `langsamPauseSekunden: ${o.langsam !== undefined ? o.langsam : 1}`);
  if (o.herzen !== undefined) text = text.replace(/herzen: \d+/, `herzen: ${o.herzen}`);
  if (o.sekunden !== undefined) text = text.replace(/minispielSekunden: \d+/, `minispielSekunden: ${o.sekunden}`);
  return text;
}

// Längste Folge gleicher Antworten
function laengsterLauf(f) { let m = f.length ? 1 : 0, l = 1; for (let i = 1; i < f.length; i++) { l = f[i] === f[i - 1] ? l + 1 : 1; m = Math.max(m, l); } return m; }

// Auffällige Antwortfolge (wie in docs/app.js): periodisch, nach Knöpfen sortiert oder mehr als 3 gleiche hintereinander
function auffaellig(f, kz) {
  const p = kz.length;
  let periodisch = f.length > p, sortiert = true, verschieden = false, lauf = 1;
  for (let i = 1; i < f.length; i++) {
    if (i >= p && f[i] !== f[i - p]) periodisch = false;
    if (kz.indexOf(f[i]) < kz.indexOf(f[i - 1])) sortiert = false;
    if (f[i] !== f[0]) verschieden = true;
    lauf = f[i] === f[i - 1] ? lauf + 1 : 1;
    if (lauf > 3) return true;
  }
  return verschieden && (periodisch || sortiert);
}

function webserver() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(DOCS, p);
      if (!f.startsWith(DOCS) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    }).listen(0, () => ok(s));
  });
}

// Nachgebildeter Fortschritts-Server (gleiche Schnittstelle wie server/src/index.js)
function fortschrittsServer() {
  const raeume = {}, challenge = {};
  const posts = [], spielPosts = [], chPosts = [];
  let nr = 0;
  const kopf = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const bestenliste = r => Object.values(challenge[r] || {})
    .map(p => ({ id: p.id, name: p.name, punkte: p.punkte, richtig: p.richtig, gesamt: p.gesamt, dauer: p.dauer, runden: p.runden, t: p.t }))
    .sort((a, b) => b.punkte - a.punkte || a.dauer - b.dauer || a.name.localeCompare(b.name, 'de'));
  return {
    posts, raeume, spielPosts, chPosts, challenge,
    async route(route) {
      const req = route.request();
      const url = new URL(req.url());
      const d = req.method() === 'POST' ? JSON.parse(req.postData()) : null;
      if (url.pathname === '/fortschritt') {
        posts.push(d);
        const r = raeume[d.raum] = raeume[d.raum] || {};
        const p = r[d.geraet] = r[d.geraet] || { id: 'id' + (++nr), uebungen: {} };
        p.name = d.name; p.t = Date.now();
        p.uebungen[d.uebung] = { geloest: d.geloest, gesamt: d.gesamt, erster: d.erster, neu: d.neu || 0, falsch: d.falsch, t: Date.now() };
        if (d.sterne) p.uebungen[d.uebung].sterne = d.sterne;
        return route.fulfill({ status: 204, headers: kopf });
      }
      if (url.pathname === '/spiel') {
        spielPosts.push(d);
        const p = (raeume[d.raum] || {})[d.geraet];
        if (!p) return route.fulfill({ status: 404, headers: kopf, body: '{"fehler":"nicht auf der Liste"}' });
        p.spiel = Math.max(p.spiel || 0, d.punkte);
        return route.fulfill({ status: 204, headers: kopf });
      }
      if (url.pathname === '/challenge') {
        chPosts.push(d);
        if (d.dauer < d.gesamt) return route.fulfill({ status: 400, headers: kopf, body: '{"fehler":"zu schnell"}' });
        const r = challenge[d.raum] = challenge[d.raum] || {};
        const punkte = challengePunkte(d.richtig, d.gesamt, d.dauer);
        const p = r[d.geraet] = r[d.geraet] || { id: 'ch' + (++nr), punkte: -1 };
        p.name = d.name; p.t = Date.now(); p.runden = (p.runden || 0) + 1;
        if (punkte > p.punkte || (punkte === p.punkte && d.dauer < p.dauer)) Object.assign(p, { punkte, richtig: d.richtig, gesamt: d.gesamt, dauer: d.dauer });
        return route.fulfill({ status: 204, headers: kopf });
      }
      if (url.pathname === '/challenge-leeren') { challenge[d.raum] = {}; return route.fulfill({ status: 204, headers: kopf }); }
      if (url.pathname === '/challenge-entfernen') {
        const r = challenge[d.raum] || {};
        for (const g of Object.keys(r)) if (r[g].id === d.id) delete r[g];
        return route.fulfill({ status: 204, headers: kopf });
      }
      if (req.method() === 'GET' && url.pathname === '/stand') {
        const raum = url.searchParams.get('raum');
        return route.fulfill({ status: 200, headers: kopf, body: JSON.stringify({ jetzt: Date.now(), eintraege: Object.values(raeume[raum] || {}), challenge: bestenliste(raum) }) });
      }
      if (url.pathname === '/leeren' || url.pathname === '/entfernen') {
        const r = raeume[d.raum] || {};
        for (const g of Object.keys(r)) if (url.pathname === '/leeren' || r[g].id === d.id) delete r[g];
        return route.fulfill({ status: 204, headers: kopf });
      }
      return route.fulfill({ status: 404, headers: kopf });
    }
  };
}

(async () => {
  const s = await webserver();
  const basis = `http://127.0.0.1:${s.address().port}/`;
  const browser = await chromium.launch();
  let ok = 0, nok = 0;
  const pruefe = (bed, text) => { if (bed) ok++; else { nok++; console.log('  ✗ ' + text); } };
  const fs1 = fortschrittsServer();

  function beobachte(page, fehler, erlaubt) {
    page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
    page.on('pageerror', e => fehler.push(String(e)));
    page.on('request', r => { if (!r.url().startsWith(basis) && !(erlaubt && r.url().startsWith(erlaubt))) fehler.push('fremde Anfrage: ' + r.url()); });
  }
  async function kontext(optionen, server, o) {
    const ctx = await browser.newContext(optionen);
    await ctx.route('**/einstellungen.js', async route => {
      const antwort = await route.fetch();
      await route.fulfill({ response: antwort, body: einstellungen(await antwort.text(), server ? SERVER + '/' : '', o) });
    });
    if (server) await ctx.route(SERVER + '/**', r => fs1.route(r));
    return ctx;
  }
  async function anmelden(p, n, klasse) {
    await p.fill('#name-feld', n);
    if (klasse) await p.check(`input[name=klasse][value=${klasse}]`);
    await p.click('#name-form button[type=submit]');
  }
  const text = (p, sel) => p.locator(sel).innerText();
  const herzWeg = p => p.locator('#herzen .herz-weg').count();
  const karteJetzt = p => p.locator('#karten .karte[data-index]');
  async function indexJetzt(p) { await karteJetzt(p).waitFor(); return Number(await karteJetzt(p).getAttribute('data-index')); }
  const sitzung = (p, schluessel) => p.evaluate(k => JSON.parse(sessionStorage.getItem(k) || 'null'), schluessel);
  const lokal = (p, schluessel) => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), schluessel);
  const breitOk = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

  // Aufwärmen: Schritte in der richtigen Reihenfolge antippen
  async function aufwaermen(p, U) {
    for (let j = 0; j < U.aufwaermen.schritte.length; j++) await p.click(`.reihe-teil[data-schritt="${j}"]`);
    await p.click('#aufw-los');
  }
  /* Löst Karten über den Stapel. o.fehler / o.fehler2: Kartennummern mit einem Fehler in Schritt 1 bzw. 2,
   * o.bis: so viele Karten, o.zweite: {nummer: Kürzel} (andere richtige Antwort), o.nachher(K, karte): Prüfung vor „Weiter“.
   * Rückgabe: Kartennummern in der gezeigten Reihenfolge. */
  async function spiele(p, U, o = {}) {
    const gezeigt = [];
    if (U.aufwaermen && await p.locator('[data-aufwaermen]').count()) await aufwaermen(p, U);
    const anzahl = o.bis || (U.karten.length - Number((await text(p, '#fortschritt-text')).split(' ')[0]));
    for (let n = 0; n < anzahl; n++) {
      const i = await indexJetzt(p), K = U.karten[i], karte = karteJetzt(p);
      gezeigt.push(K.nummer);
      if (o.fehler && o.fehler.has(K.nummer)) {
        await karte.locator(`button[data-kuerzel="${falscheVon(U, K)[0]}"]`).click();
        await p.waitForTimeout(SPERRE);
      }
      const r = (o.zweite && o.zweite[K.nummer]) || richtigeVon(K)[0];
      await karte.locator(`button[data-kuerzel="${r}"]`).click();
      if (K.schritt2 && (!K.schritt2.nur || K.schritt2.nur.includes(r))) {
        if (o.fehler2 && o.fehler2.has(K.nummer)) {
          await karte.locator(`.option[data-option="${K.schritt2.richtig === 0 ? 1 : 0}"]`).click();
          await p.waitForTimeout(SPERRE);
        }
        await karte.locator(`.option[data-option="${K.schritt2.richtig}"]`).click();
      }
      if (o.nachher) await o.nachher(K, karte, r);
      await p.click('#weiter-knopf');
    }
    return gezeigt;
  }

  /* ---------------- Teil A: jede Übung ohne Server ---------------- */
  {
    const ctx = await kontext(HANDY, false);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler);
    const geschafft = new Set();
    for (const id of IDS) {
      const U = I[id], N = U.karten.length;
      await page.goto(basis + id + '.html');
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      pruefe(await page.locator('#name-bereich').isHidden(), `${id}: ohne Server keine Namenseingabe`);
      pruefe(await page.locator('#karten .karte').count() === 1, `${id}: immer nur eine Karte sichtbar`);
      pruefe(await page.locator('#herzen .herz').count() === 3 && await herzWeg(page) === 0, `${id}: drei volle Herzen`);
      pruefe(await page.locator('#merksatz-bereich').isHidden() && !(await page.content()).includes(U.merksatz.slice(0, 40)), `${id}: Zusammenfassung verborgen und nicht vorab im Text`);
      pruefe(await page.locator('#noch-einmal').isHidden(), `${id}: „Noch einmal üben“ während der Übung verborgen`);
      if (U.aufwaermen) {
        const W = U.aufwaermen;
        pruefe(await page.locator('[data-aufwaermen]').isVisible() && await page.locator('.reihe-teil').count() === W.schritte.length, `${id}: Aufwärmen kommt zuerst`);
        await page.click(`.reihe-teil[data-schritt="${W.schritte.length - 1}"]`);
        await page.waitForTimeout(400);
        pruefe((await text(page, '[data-aufwaermen] .rueckmeldung')).includes('Noch nicht') && await page.locator('.reihe-fertig li').count() === 0, `${id}: Aufwärmen – falscher Schritt wird nicht angenommen`);
        for (let j = 0; j < W.schritte.length; j++) await page.click(`.reihe-teil[data-schritt="${j}"]`);
        pruefe(await page.locator('.reihe-fertig li').count() === W.schritte.length && await herzWeg(page) === 0, `${id}: Aufwärmen fertig, kostet kein Herz`);
        await page.screenshot({ path: path.join(__dirname, `handy-${id}-aufwaermen.png`) });
        await page.click('#aufw-los');
      }
      const i0 = await indexJetzt(page), K0 = U.karten[i0], karte = karteJetzt(page);
      pruefe((await text(page, '.karte-kopf')).includes('1 von ' + N) && (await text(page, '#fortschritt-text')).startsWith('0 von ' + N), `${id}: Karte „1 von ${N}“, Fortschritt 0`);
      pruefe(!(await text(page, '.karte-text')).includes('*'), `${id}: keine Sternchen im Kartentext`);
      const ueberlapp = await page.evaluate(() => {
        const b = [...document.querySelectorAll('#karten .antwort')].map(x => x.getBoundingClientRect());
        for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
          const a = b[i], c = b[j];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) return true;
        }
        return false;
      });
      pruefe(!ueberlapp, `${id}: Antwortknöpfe überlappen nicht`);
      // Falsch → Tipp, ein Herz weg, kurze Sperre
      const f0 = falscheVon(U, K0)[0], r0 = richtigeVon(K0)[0];
      await karte.locator(`button[data-kuerzel="${f0}"]`).click();
      pruefe(await karte.locator(`button[data-kuerzel="${r0}"]`).isDisabled(), `${id}: nach dem Fehler kurz gesperrt (Tipp lesen)`);
      pruefe((await text(page, '.rueckmeldung.falsch')).includes('Tipp') && (await text(page, '.rueckmeldung.falsch')).includes(ohneSterne(K0.tipp).slice(0, 20)), `${id}: Tipp nach falscher Antwort`);
      pruefe(await herzWeg(page) === 1 && await karte.locator(`button[data-kuerzel="${f0}"]`).isDisabled() && await page.locator('#weiter-knopf').count() === 0, `${id}: ein Herz weg, falscher Knopf gesperrt, kein „Weiter“`);
      await page.screenshot({ path: path.join(__dirname, `handy-${id}-tipp.png`) });
      await page.waitForTimeout(SPERRE);
      pruefe(await karte.locator(`button[data-kuerzel="${r0}"]`).isEnabled() && (await text(page, '#fortschritt-text')).startsWith('0 von'), `${id}: nach 1,5 s wieder frei`);
      await karte.locator(`button[data-kuerzel="${r0}"]`).click();
      if (K0.schritt2) {
        pruefe(await page.locator('.s1-ok').isVisible() && (await text(page, '.schritt2-frage')).length > 5 && await karte.locator(`button[data-kuerzel="${f0}"]`).isDisabled(), `${id}: nach Schritt 1 kommt Schritt 2`);
        await karte.locator(`.option[data-option="${K0.schritt2.richtig}"]`).click();
      }
      pruefe((await text(page, '.rueckmeldung.richtig')).includes(ohneSterne(typeof K0.erklaerung === 'object' ? K0.erklaerung[r0] : (K0.schritt2 && K0.schritt2.erklaerung) || K0.erklaerung).slice(0, 20)), `${id}: Erklärung nach richtiger Antwort`);
      pruefe((await text(page, '#fortschritt-text')).startsWith('1 von') && await page.locator('#weiter-knopf').isVisible(), `${id}: Karte gelöst, „Weiter“ sichtbar`);
      // Rest lösen – bei Übungen mit Schritt 2 ein Fehler im zweiten Schritt
      const s2 = U.karten.filter(k => k.schritt2 && k !== K0).map(k => k.nummer);
      await page.click('#weiter-knopf');
      const zweiteK = await karteJetzt(page).getAttribute('data-index');
      pruefe(zweiteK !== String(i0) && (await text(page, '.karte-kopf')).includes('2 von ' + N), `${id}: „Weiter“ zeigt die nächste Karte`);
      await spiele(page, U, { fehler2: new Set(s2.slice(0, 1)) });
      const fehlerZahl = 1 + (s2.length ? 1 : 0);
      const bereich = page.locator('#merksatz-bereich');
      pruefe(await bereich.isVisible() && (await bereich.innerText()).includes('Das Wichtigste in Kürze'), `${id}: Zusammenfassung sichtbar`);
      pruefe((await bereich.innerText()).includes(ohneSterne(U.danach).slice(0, 25)), `${id}: Hinweis, wie es weitergeht`);
      const nr = U.titel.split(':')[0];
      pruefe((await text(page, '.weiter')).includes(nr + ' abgeschlossen!'), `${id}: „${nr} abgeschlossen!“`);
      pruefe((await text(page, '.sterne')) === '★★☆' && (await text(page, '.sterne-text')).includes('wenige Fehler'), `${id}: ${fehlerZahl} Fehler → ★★☆`);
      pruefe((await text(page, '.erster-versuch')).includes(`${N - fehlerZahl} von ${N}`), `${id}: beim ersten Versuch richtig ${N - fehlerZahl} von ${N}`);
      pruefe(await page.locator('#noch-einmal').isVisible() && (await text(page, '#noch-einmal')).includes('mehr Sterne'), `${id}: „Noch einmal üben – für mehr Sterne“`);
      pruefe(((await lokal(page, P + 'sterne')) || {})[id] === 2 && ((await lokal(page, P + 'geloest')) || {})[id], `${id}: Sterne und „geschafft“ gespeichert`);
      geschafft.add(id);
      const erwartet = [];
      if (U.belohnungsspiel) erwartet.push('spiel.html?ab=' + id);
      if (U.minispiel) erwartet.push('minispiel.html?ab=' + id);
      if (/^kb2w[1-4]$/.test(U.raum) && IDS.filter(k => I[k].raum === U.raum).every(k => geschafft.has(k))) erwartet.push('challenge-' + U.raum + '.html');
      const links = await page.locator('a[href]').evaluateAll(a => a.map(x => x.getAttribute('href')));
      pruefe(links.join() === erwartet.join(), `${id}: Links nur zu Spiel/Challenge (${links.join() || 'keine'})`);
      await page.screenshot({ path: path.join(__dirname, `handy-${id}-ende.png`), fullPage: true });
      // Bonus-Fall (ohne Herzen)
      if (U.bonus) {
        const F = U.bonus, herzVorher = await herzWeg(page);
        await page.click('#bonus-start');
        pruefe(await page.locator('#noch-einmal').isHidden() && (await text(page, '.karte-kopf')).includes(`Schritt 1 von ${F.schritte.length}`), `${id}: Bonus-Fall startet mit Schritt 1`);
        for (let j = 0; j < F.schritte.length; j++) {
          const S = F.schritte[j];
          if (j === 0) {
            const fj = S.optionen.findIndex(o2 => !o2.richtig);
            await page.click(`[data-bonus="${fj}"]`);
            pruefe((await text(page, '.bonus .rueckmeldung.falsch')).includes(ohneSterne(S.optionen[fj].reaktion).slice(0, 20)) && await herzWeg(page) === herzVorher, `${id}: Bonus – Reaktion auf falsche Wahl, kein Herz weg`);
          }
          await page.click(`[data-bonus="${S.optionen.findIndex(o2 => o2.richtig)}"]`);
          await page.click('#bonus-weiter');
        }
        await page.screenshot({ path: path.join(__dirname, `handy-${id}-bonus.png`) });
        await page.click('#bonus-zurueck');
        pruefe(await page.locator('.bonus-fertig').isVisible() && await bereich.isVisible() && (await text(page, '.sterne')) === '★★☆', `${id}: Bonus geschafft, zurück bei der Zusammenfassung (Sterne unverändert)`);
      }
      // Neuladen behält den Stand
      await page.reload();
      pruefe((await text(page, '#fortschritt-text')).startsWith(`${N} von`) && await bereich.isVisible(), `${id}: Stand nach Neuladen erhalten`);
      // Zweiter Durchgang ohne Fehler (bei mehreren richtigen Antworten die zweite) → ★★★
      await page.click('#noch-einmal');
      pruefe((await text(page, '#fortschritt-text')).startsWith('0 von') && await herzWeg(page) === 0 && await bereich.isHidden(), `${id}: „Noch einmal üben“ setzt zurück`);
      const zweite = {};
      U.karten.filter(k => richtigeVon(k).length > 1).forEach(k => { zweite[k.nummer] = k.richtig[1]; });
      let zweiteOk = true;
      await spiele(page, U, {
        zweite,
        nachher: async (K, k, r) => {
          if (zweite[K.nummer] && !(await k.locator('.rueckmeldung.richtig').innerText()).includes(ohneSterne(K.erklaerung[r]).slice(0, 20))) zweiteOk = false;
        }
      });
      pruefe(zweiteOk, `${id}: zweite richtige Antwort mit eigener Erklärung`);
      pruefe((await text(page, '.sterne')) === '★★★' && (await text(page, '#noch-einmal')) === I.allgemein.nochEinmal, `${id}: ohne Fehler → ★★★`);
      pruefe(await breitOk(page), `${id}: kein waagerechtes Scrollen bei 360 px`);
    }
    // Dritter Durchgang mit Fehler: beste Wertung bleibt sichtbar
    await page.goto(basis + 'ab1b.html'); // Sitzung wurde oben geleert → neuer Durchgang
    await spiele(page, I.ab1b, { fehler: new Set([1, 2]) });
    pruefe((await text(page, '.sterne')) === '★★☆' && (await text(page, '.sterne-best')).includes('★★★'), 'A: 2 Fehler → ★★☆, darunter „Ihre beste Wertung: ★★★“');
    pruefe(((await lokal(page, P + 'sterne')) || {}).ab1b === 3, 'A: gespeichert bleibt die beste Wertung');
    await page.goto(basis + 'index.html');
    pruefe(await page.locator('a[href]').count() === 0, 'Startseite: keine Links zu den Übungen');
    pruefe((await page.locator('main').innerText()).includes('QR-Code'), 'Startseite: Hinweis auf den QR-Code');
    await page.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    pruefe((await text(page, '#l-inhalt')).includes('Noch nicht eingerichtet'), 'Lehrerseite ohne Server: Hinweis zur Einrichtung');
    pruefe(fehler.length === 0, 'Teil A: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil A2: Reihenfolge ---------------- */
  {
    const ctx = await kontext(HANDY, false);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler);
    for (const id of IDS) {
      const U = I[id], n = U.karten.length, kz = U.knoepfe.map(b => b.kuerzel);
      const folgen = new Set();
      let gueltig = true, ersteOk = true, unauffaellig = true;
      for (let v = 0; v < 8; v++) {
        await page.goto(basis + id + '.html');
        await page.evaluate(() => sessionStorage.clear());
        await page.reload();
        const r = await sitzung(page, P + id + '-reihenfolge');
        if (!r || [...r].sort((x, y) => x - y).join() !== [...Array(n).keys()].join()) gueltig = false;
        if (!U.aufwaermen && Number(await karteJetzt(page).getAttribute('data-index')) !== r[0]) ersteOk = false;
        if (auffaellig(r.map(i => richtigeVon(U.karten[i])[0]), kz)) unauffaellig = false;
        folgen.add(r.join());
      }
      pruefe(gueltig && ersteOk, `${id}: jede Karte genau einmal, der Stapel beginnt mit der ersten Karte der Reihenfolge`);
      pruefe(unauffaellig, `${id}: keine Antwortfolge im Wechsel, sortiert oder mit mehr als 3 gleichen hintereinander`);
      pruefe(folgen.size >= 2, `${id}: Reihenfolge zufällig (${folgen.size} verschiedene bei 8 Aufrufen)`);
      const vorher = (await sitzung(page, P + id + '-reihenfolge')).join();
      await page.reload();
      pruefe((await sitzung(page, P + id + '-reihenfolge')).join() === vorher, `${id}: Reihenfolge bleibt beim Neuladen gleich`);
    }
    // Der Stapel folgt der Reihenfolge; „Noch einmal üben“ mischt neu
    const U = I.ab1a;
    await page.goto(basis + 'ab1a.html');
    const r = await sitzung(page, P + 'ab1a-reihenfolge');
    const gezeigt = await spiele(page, U, {});
    pruefe(gezeigt.join() === r.map(i => U.karten[i].nummer).join(), 'A2: Karten kommen genau in der gemischten Reihenfolge');
    await page.click('#noch-einmal');
    pruefe((await sitzung(page, P + 'ab1a-reihenfolge')).join() !== r.join(), 'A2: „Noch einmal üben“ mischt neu');
    pruefe(fehler.length === 0, 'Teil A2: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil A3: Herzen, Serie, Lesezeit, Schritt 2 ---------------- */
  {
    // Herzen weg → Lesepause → Neustart mit neuer Mischung (mit Server: ↺ wird gesendet)
    const ctx = await kontext(HANDY, true, { leer: 2 });
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    const U = I.ab1b;
    await page.goto(basis + 'ab1b.html');
    await anmelden(page, 'Ben D.', 'k2');
    const r1 = await sitzung(page, P + 'ab1b-reihenfolge');
    await spiele(page, U, { bis: 2, fehler: new Set(U.karten.map(k => k.nummer)) });
    pruefe(await herzWeg(page) === 2 && (await text(page, '#fortschritt-text')).startsWith('2 von'), 'A3: zwei Fehler → zwei Herzen weg');
    const K = U.karten[await indexJetzt(page)];
    await karteJetzt(page).locator(`button[data-kuerzel="${falscheVon(U, K)[0]}"]`).click();
    pruefe(await page.locator('.pause.pause-leer').isVisible() && (await text(page, '.pause')).includes('Keine Herzen mehr') && (await text(page, '.pause')).includes('Sekunden'), 'A3: drittes Herz weg → Lesepause „Keine Herzen mehr“');
    pruefe(await page.locator('#karten .antwort').count() === 0, 'A3: in der Pause keine Antwortknöpfe');
    await page.screenshot({ path: path.join(__dirname, 'handy-herzen-leer.png') });
    await page.waitForTimeout(300);
    let letzter = fs1.posts[fs1.posts.length - 1];
    pruefe(letzter.neu === 1 && letzter.name === 'Ben D.', 'A3: Neustart wird gesendet (neu = 1)');
    await page.reload();
    pruefe(await page.locator('.pause.pause-leer').isVisible(), 'A3: Pause bleibt nach Neuladen');
    await page.waitForTimeout(2400);
    pruefe((await text(page, '#fortschritt-text')).startsWith('0 von') && await herzWeg(page) === 0 && await karteJetzt(page).isVisible(), 'A3: nach der Pause beginnt die Übung neu mit 3 Herzen');
    pruefe((await sitzung(page, P + 'ab1b-reihenfolge')).join() !== r1.join(), 'A3: neu gemischt');
    await page.waitForTimeout(300);
    letzter = fs1.posts[fs1.posts.length - 1];
    pruefe(letzter.neu === 1 && letzter.geloest === 0, 'A3: Neubeginn gesendet (0 gelöst, neu = 1)');
    // Serie: 5 richtige in Folge geben ein Herz zurück
    await spiele(page, U, { bis: 1, fehler: new Set(U.karten.map(k => k.nummer)) });
    pruefe(await herzWeg(page) === 1, 'A3: ein Fehler → ein Herz weg');
    await spiele(page, U, { bis: 2 });
    pruefe((await text(page, '#herzen .serie')).includes('🔥 2'), 'A3: Serie „🔥 2“ wird angezeigt');
    await page.screenshot({ path: path.join(__dirname, 'handy-serie.png') });
    await spiele(page, U, { bis: 2 });
    pruefe(await herzWeg(page) === 1, 'A3: nach 4 richtigen noch kein Herz zurück');
    const i5 = await indexJetzt(page);
    await karteJetzt(page).locator(`button[data-kuerzel="${richtigeVon(U.karten[i5])[0]}"]`).click();
    pruefe(await herzWeg(page) === 0 && (await text(page, '#meldung')).includes('Herz zurück') && await page.locator('#meldung.meldung-gut').isVisible(), 'A3: 5 richtige in Folge → Herz zurück, Meldung');
    pruefe(await page.locator('#herzen .serie').count() === 0, 'A3: Serie beginnt danach von vorn');
    await page.screenshot({ path: path.join(__dirname, 'handy-herz-zurueck.png') });
    await page.reload();
    pruefe((await text(page, '#fortschritt-text')).startsWith('6 von') && await herzWeg(page) === 0, 'A3: Herzen und Stand nach Neuladen erhalten');
    pruefe(fehler.length === 0, 'Teil A3 (Herzen): keine Konsolenfehler: ' + fehler.join(' | '));
    await ctx.close();
    // Lehrerseite zeigt ↺
    const c2 = await kontext(BEAMER, true);
    const p2 = await c2.newPage();
    await p2.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await p2.waitForSelector('.l-karte[data-uebung="ab1b"] .l-pille');
    const ben = p2.locator('.l-karte[data-uebung="ab1b"] .l-pille', { hasText: 'Ben D.' });
    pruefe((await ben.innerText()).includes('↺') && (await ben.getAttribute('title')).includes('alle Herzen verloren'), 'A3: Lehrerseite zeigt ↺ beim Namen: ' + (await ben.getAttribute('title')));
    await p2.screenshot({ path: path.join(__dirname, 'lehrer-neustart.png') });
    await c2.close();
  }
  {
    // Lesezeit: unmöglich schnell → Warnung (zählt nicht), 3 Warnungen → Lesepause; schnell und falsch → Herz weg + Warnung
    const ctx = await kontext(HANDY, false, { lesezeit: true, langsam: 2 });
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler);
    const U = I.ab1a;
    await page.goto(basis + 'ab1a.html');
    const K = U.karten[await indexJetzt(page)];
    const knopf = karteJetzt(page).locator(`button[data-kuerzel="${richtigeVon(K)[0]}"]`);
    await knopf.click();
    pruefe((await text(page, '#meldung')).includes('Langsam') && await page.locator('#meldung.meldung-warnung').isVisible(), 'A3: zu schnell getippt → Warnung „Langsam!“');
    pruefe((await text(page, '#fortschritt-text')).startsWith('0 von') && await herzWeg(page) === 0, 'A3: Warnung zählt nicht und kostet kein Herz');
    await page.screenshot({ path: path.join(__dirname, 'handy-lesezeit.png') });
    await knopf.click();
    await karteJetzt(page).locator(`button[data-kuerzel="${richtigeVon(K)[0]}"]`).click();
    pruefe(await page.locator('.pause:not(.pause-leer)').isVisible() && (await text(page, '.pause')).includes('Kurze Lesepause'), 'A3: 3 Warnungen → kurze Lesepause');
    await page.screenshot({ path: path.join(__dirname, 'handy-lesepause.png') });
    await page.waitForTimeout(2800); // Pause 2 s, die Anzeige prüft alle 0,5 s
    pruefe(await karteJetzt(page).isVisible() && await herzWeg(page) === 0, 'A3: nach der Lesepause geht es mit derselben Karte weiter');
    await page.waitForTimeout(Math.max(0, leseZeit(U, K) * 1000 - 2500));
    await karteJetzt(page).locator(`button[data-kuerzel="${richtigeVon(K)[0]}"]`).click();
    pruefe((await text(page, '#fortschritt-text')).startsWith('1 von'), 'A3: nach der Lesezeit zählt die Antwort');
    await page.click('#weiter-knopf');
    const K2 = U.karten[await indexJetzt(page)];
    await page.waitForTimeout(Math.round(leseZeit(U, K2) * 600));
    await karteJetzt(page).locator(`button[data-kuerzel="${falscheVon(U, K2)[0]}"]`).click();
    pruefe(await herzWeg(page) === 1 && (await text(page, '#meldung')).includes('zu schnell'), 'A3: schnell und falsch → Herz weg und Hinweis „zu schnell“');
    await page.waitForTimeout(SPERRE);
    await karteJetzt(page).locator(`button[data-kuerzel="${richtigeVon(K2)[0]}"]`).click();
    pruefe((await text(page, '#fortschritt-text')).startsWith('2 von'), 'A3: zweiter Versuch nach dem Tipp wird nicht mehr gebremst');
    pruefe(fehler.length === 0, 'Teil A3 (Lesezeit): keine Konsolenfehler: ' + fehler.join(' | '));
    await ctx.close();
  }
  {
    // Schritt 2 im Detail (Hemmer → bessere Antwort, Richtig/Falsch → Begründung)
    const ctx = await kontext(HANDY, false);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler);
    for (const id of IDS.filter(k => I[k].karten.some(c => c.schritt2))) {
      const U = I[id];
      await page.goto(basis + id + '.html');
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      while (!U.karten[await indexJetzt(page)].schritt2) await spiele(page, U, { bis: 1 });
      const vorher = (await text(page, '#fortschritt-text')).split(' ')[0];
      const K = U.karten[await indexJetzt(page)], karte = karteJetzt(page);
      await karte.locator(`button[data-kuerzel="${richtigeVon(K)[0]}"]`).click();
      pruefe(await page.locator('.s1-ok').isVisible() && (await text(page, '.schritt2-frage')).includes(ohneSterne(K.schritt2.frage).slice(0, 15)), `${id}: Schritt 2 mit eigener Frage`);
      pruefe((await text(page, '#fortschritt-text')).split(' ')[0] === vorher && await page.locator('#weiter-knopf').count() === 0, `${id}: Karte erst nach Schritt 2 gelöst`);
      pruefe(await page.locator('.option').count() === K.schritt2.optionen.length, `${id}: alle Optionen von Schritt 2 sichtbar`);
      await page.screenshot({ path: path.join(__dirname, `handy-${id}-schritt2.png`) });
      const fj = K.schritt2.richtig === 0 ? 1 : 0;
      await karte.locator(`.option[data-option="${fj}"]`).click();
      pruefe(await page.locator(`.option[data-option="${fj}"].ist-falsch`).count() === 1 && (await text(page, '.rueckmeldung.falsch')).includes(ohneSterne(K.schritt2.tipp || K.tipp).slice(0, 15)) && await herzWeg(page) === 1, `${id}: falsche Option → Tipp, Herz weg`);
      await page.waitForTimeout(SPERRE);
      await karte.locator(`.option[data-option="${K.schritt2.richtig}"]`).click();
      pruefe((await text(page, '.rueckmeldung.richtig')).includes(ohneSterne(K.schritt2.erklaerung || K.erklaerung).slice(0, 15)) && Number((await text(page, '#fortschritt-text')).split(' ')[0]) === Number(vorher) + 1, `${id}: richtige Option → Erklärung, Karte gelöst`);
      // Antwortlängen: Die richtige Option ist nicht auffällig länger als die anderen
      const laengen = U.karten.filter(c => c.schritt2).map(c => { const o = c.schritt2.optionen.map(x => ohneSterne(x).length); return o[c.schritt2.richtig] - Math.max(...o.filter((_, j) => j !== c.schritt2.richtig)); });
      pruefe(laengen.filter(d => d > 25).length === 0, `${id}: richtige Option in Schritt 2 nie deutlich länger als alle anderen (${laengen.join(', ')})`);
    }
    pruefe(fehler.length === 0, 'Teil A3 (Schritt 2): keine Konsolenfehler: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil B: Namenseingabe mit Klassenwahl und Fortschritt senden ---------------- */
  {
    const ctx = await kontext(HANDY, true);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    await page.goto(basis + 'ab1a.html');
    pruefe(await page.locator('#name-bereich').isVisible() && await page.locator('#uebung-teil').isHidden(), 'B: Namenseingabe zuerst, Karten danach');
    pruefe(await page.locator('input[name=klasse]').count() === 2, 'B: zwei Klassen zur Auswahl');
    pruefe((await text(page, '#name-bereich')).includes('10 Tage'), 'B: Datenschutzhinweis nennt die 10 Tage der Challenge');
    await page.screenshot({ path: path.join(__dirname, 'handy-name.png') });
    for (const falscherName of ['Lena', 'L K.', 'Arsch K.', '<b>x</b> K.']) {
      await anmelden(page, falscherName, 'k2');
      pruefe(await page.locator('#name-fehler').isVisible() && await page.locator('#uebung-teil').isHidden(), `B: ungültiger Name abgelehnt: ${falscherName}`);
    }
    await page.goto(basis + 'ab1a.html');
    await anmelden(page, 'Lena Kraus', null);
    pruefe((await text(page, '#name-fehler')).includes('Klasse') && await page.locator('#uebung-teil').isHidden(), 'B: ohne Klasse abgelehnt');
    await anmelden(page, '  lena   kraus ', 'k2');
    pruefe(await page.locator('#uebung-teil').isVisible() && (await text(page, '#name-zeile')).includes('Lena K. · 3BFP2/2'), 'B: Anzeige „Lena K. · 3BFP2/2“');
    await page.waitForTimeout(200);
    let l = fs1.posts[fs1.posts.length - 1];
    pruefe(l && l.name === 'Lena K.' && l.raum === 'k2-ab1' && l.geloest === 0, 'B: Anmeldung wird an Raum k2-ab1 gesendet (0 gelöst)');
    const U = I.ab1a;
    const erste = U.karten[await indexJetzt(page)];
    const f1 = falscheVon(U, erste)[0];
    await spiele(page, U, { bis: 6, fehler: new Set([erste.nummer]) });
    await page.waitForTimeout(200);
    l = fs1.posts[fs1.posts.length - 1];
    pruefe(l.geloest === 6 && l.uebung === 'ab1a' && l.gesamt === U.karten.length && !l.sterne, 'B: Fortschritt 6/12 gesendet (noch ohne Sterne)');
    pruefe(JSON.stringify(l.falsch) === JSON.stringify([erste.nummer + '-' + f1]) && l.erster === 5, 'B: Fehler beim ersten Versuch (Kartennummer, gewählte Antwort): ' + JSON.stringify(l.falsch));
    pruefe(/^[a-f0-9]{32}$/.test(l.geraet), 'B: zufällige Geräte-Kennung');
    // Andere Übung: kein erneutes Fragen nach dem Namen; fertig ohne Fehler → Sterne werden gesendet
    await page.goto(basis + 'ab2c.html');
    pruefe(await page.locator('#name-bereich').isHidden() && (await text(page, '#name-zeile')).includes('Lena K.'), 'B: Name und Klasse bleiben gespeichert');
    await spiele(page, I.ab2c, {});
    await page.waitForTimeout(200);
    l = fs1.posts[fs1.posts.length - 1];
    pruefe(l.raum === 'k2-ab2' && l.uebung === 'ab2c' && l.geloest === I.ab2c.karten.length && l.erster === I.ab2c.karten.length && l.sterne === 3, 'B: AB 2 fertig mit ★★★ gesendet: ' + JSON.stringify(l));
    // Name und Klasse ändern
    await page.goto(basis + 'ab1b.html');
    await page.click('#name-aendern');
    pruefe(await page.locator('#name-bereich').isVisible() && await page.locator('input[name=klasse][value=k2]').isChecked(), 'B: Ändern zeigt die bisherige Klasse');
    await anmelden(page, 'Anna-Lena K.', 'k1');
    pruefe((await text(page, '#name-zeile')).includes('Anna-Lena K. · 3BFP2/1'), 'B: geänderter Name und Klasse');
    await spiele(page, I.ab1b, {});
    await page.waitForTimeout(200);
    l = fs1.posts[fs1.posts.length - 1];
    pruefe(l.geloest === I.ab1b.karten.length && l.raum === 'k1-ab1' && l.sterne === 3, 'B: fertige Übung an neue Klasse gesendet');
    pruefe(await breitOk(page), 'B: kein waagerechtes Scrollen');
    pruefe(fehler.length === 0, 'Teil B: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil C: Lehrerseiten ---------------- */
  {
    // Klasse 3BFP2/2, AB 1: Daten direkt eintragen (Lena K. aus Teil B bleibt)
    const U = I.ab1a, n = U.karten.length, jetzt = Date.now();
    const fk = nr => nr + '-' + falscheVon(U, nachNummer(U, nr))[0];
    const raum = fs1.raeume['k2-ab1'];
    const lena = Object.values(raum).find(p => p.name === 'Lena K.');
    lena.uebungen.ab1a = { geloest: 6, gesamt: n, erster: 5, neu: 0, falsch: [fk(2)], t: jetzt };
    delete raum[Object.keys(raum).find(g => raum[g].name === 'Ben D.')];
    Object.assign(raum, {
      // Tim hat ★★★ geholt und übt gerade noch einmal (Zähler auf dem Handy wieder bei 4)
      ['1'.repeat(32)]: { id: 'tim1', name: 'Tim B.', t: jetzt, uebungen: { ab1a: { geloest: 4, gesamt: n, erster: 4, neu: 0, falsch: [], sterne: 3, t: jetzt } } },
      ['2'.repeat(32)]: { id: 'mia1', name: 'Mia S.', t: jetzt, uebungen: { ab1a: { geloest: 3, gesamt: n, erster: 1, neu: 0, falsch: [fk(1), fk(2)], t: jetzt } } },
      ['3'.repeat(32)]: { id: 'jon1', name: 'Jonas W.', t: jetzt, uebungen: { ab1a: { geloest: n, gesamt: n, erster: 6, neu: 1, falsch: [1, 2, 3, 4, 5, 6].map(fk), t: jetzt } } },
      ['4'.repeat(32)]: { id: 'ela1', name: 'Ela E.', t: jetzt, uebungen: { ab1a: { geloest: n, gesamt: n, erster: 9, neu: 2, falsch: [fk(7)], sterne: 1, t: jetzt } } }
    });
    const ctx = await kontext(BEAMER, true);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    page.on('dialog', d => d.accept());
    await page.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await page.waitForSelector('.l-karte[data-uebung="ab1a"] .l-pille');
    pruefe((await text(page, 'h1')).includes('3BFP2/2') && (await text(page, 'h1')).includes('AB 1'), 'C: Überschrift mit Klasse und AB');
    pruefe(await page.locator('#l-feld').count() === 0 && await page.locator('.l-challenge').count() === 0, 'C: kein Kennwort, keine Challenge bei AB 1');
    pruefe(await page.locator('.l-karte').count() === 2, 'C: zwei Übungen für AB 1');
    const a = page.locator('.l-karte[data-uebung="ab1a"]');
    const zahl = await a.locator('.l-zahl').innerText();
    pruefe(/^3 von 5 fertig · 2 dabei/.test(zahl), 'C: „3 von 5 fertig · 2 dabei“: ' + zahl);
    const pille = nm => a.locator('.l-pille', { hasText: nm });
    pruefe((await pille('Tim B.').innerText()).includes('★★★') && (await pille('Tim B.').getAttribute('title')).includes('noch einmal') && await a.locator('.l-fertig', { hasText: 'Tim B.' }).count() === 1, 'C: Tim B. ★★★ zählt als fertig, auch wenn er noch einmal übt: ' + await pille('Tim B.').getAttribute('title'));
    pruefe((await pille('Ela E.').innerText()).includes('★☆☆') && (await pille('Ela E.').innerText()).includes('↺2'), 'C: Ela E. ★☆☆ ↺2');
    pruefe((await pille('Mia S.').innerText()).includes('3/12') && (await pille('Lena K.').innerText()).includes('6/12'), 'C: dabei mit gelöst/gesamt');
    pruefe((await pille('Jonas W.').innerText()).includes('⚠ 6/12') && await a.locator('.l-klick').count() === 1, 'C: ältere Einträge ohne Sterne: Durchklicken (⚠) wird markiert');
    const oft = await a.locator('.l-oft li').allInnerTexts();
    pruefe(oft.length === 3 && oft[0].startsWith('3×') && oft[0].includes(ohneSterne(nachNummer(U, 2).text).slice(0, 15)), 'C: häufigster Fehler (Karte 2, ohne Nummer): ' + oft.join(' | '));
    await a.locator('.l-oft-knopf').first().click();
    const ansicht = page.locator('.l-besprechen');
    pruefe(await ansicht.isVisible() && (await ansicht.locator('.l-b-aussage').innerText()).includes(ohneSterne(nachNummer(U, 2).text).slice(0, 15)), 'C: Besprechen zeigt Karte 2');
    const gew = ansicht.locator('.l-b-gewaehlt');
    pruefe(await gew.count() >= 1 && (await gew.first().innerText()).includes('zuerst gewählt'), 'C: gewählte falsche Antwort mit Anzahl');
    pruefe(await ansicht.locator('.l-b-erklaerung').isHidden(), 'C: Erklärung vor dem Auflösen verborgen');
    pruefe(!(await ansicht.innerText()).includes('Lena') && !(await ansicht.innerText()).includes('Mia'), 'C: Besprechen ohne Namen');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-besprechen.png') });
    await page.click('#l-b-auf');
    pruefe(await ansicht.locator('.l-b-erklaerung').isVisible() && await page.locator('.l-aufgeloest .l-b-loesung').count() === 1, 'C: Auflösen zeigt Lösung und Erklärung');
    await page.keyboard.press('Escape');
    pruefe(await page.locator('.l-besprechen').count() === 0, 'C: Besprechen schließen mit Esc');
    pruefe((await text(page, '#l-status')).includes('5 angemeldet'), 'C: Statuszeile');
    pruefe((await text(page, '#l-fuss')).includes('★★★') && (await text(page, '#l-fuss')).includes('Herzen'), 'C: Fußzeile erklärt Sterne und ↺');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-ab1.png') });
    // Aktualisierung ohne Neuladen
    raum['f'.repeat(32)] = { id: 'neu1', name: 'Paul F.', t: Date.now(), uebungen: { ab1a: { geloest: n, gesamt: n, erster: n, falsch: [], sterne: 3, t: Date.now() } } };
    await page.waitForTimeout(5600);
    pruefe(/^4 von 6 fertig/.test(await a.locator('.l-zahl').innerText()), 'C: Anzeige aktualisiert sich selbst');
    await pille('Paul F.').locator('.l-weg').click({ force: true });
    await page.waitForTimeout(400);
    pruefe(!(await a.locator('.l-pille').allInnerTexts()).join(' ').includes('Paul F.'), 'C: Name entfernt');
    // Andere Klasse: eigene Seite, eigene Namen
    await page.goto(basis + 'lehrer-3bfp2-1-ab1.html');
    await page.waitForSelector('.l-karte');
    const k1 = await text(page, '#l-inhalt');
    pruefe(k1.includes('Anna-Lena K.') && !k1.includes('Mia S.') && !k1.includes('Tim B.'), 'C: 3BFP2/1 sieht nur ihre eigenen Namen');
    // AB 2
    await page.goto(basis + 'lehrer-3bfp2-2-ab2.html');
    await page.waitForSelector('.l-karte[data-uebung="ab2c"] .l-pille');
    const c2 = page.locator('.l-karte[data-uebung="ab2c"]');
    pruefe(await page.locator('.l-karte').count() === 2 && (await c2.innerText()).includes('Übung 2: Antwort-Check') && (await c2.locator('.l-pille', { hasText: 'Lena K.' }).innerText()).includes('★★★'), 'C: AB 2 zeigt Lena K. mit ★★★');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-ab2.png') });
    // Leeren
    await page.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await page.waitForSelector('.l-pille');
    await page.click('#l-leeren');
    await page.waitForTimeout(400);
    pruefe(await page.locator('.l-pille').count() === 0, 'C: Liste geleert');
    pruefe(Object.keys(fs1.raeume['k1-ab1']).length === 1, 'C: Leeren betrifft nur die eigene Klasse');
    pruefe(await breitOk(page), 'C: kein waagerechtes Scrollen');
    pruefe(fehler.length === 0, 'Teil C: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil E: Belohnungsspiel nach ab3a ---------------- */
  {
    const U = I.ab3a;
    const ctx = await kontext(HANDY, true);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    await page.goto(basis + 'spiel.html?ab=ab3a');
    pruefe((await text(page, '#panel')).includes('Lösen Sie zuerst die Übung „Hilfreich oder ungünstig?“') && await page.locator('#knopf-los').count() === 0, 'E: Spiel ohne gelöste Übung gesperrt');
    pruefe(await page.locator('#panel a.knopf[href="ab3a.html"]').count() === 1, 'E: gesperrt → Knopf „Zur Übung“');
    await page.goto(basis + 'spiel.html?ab=ab1a');
    pruefe((await text(page, '#panel')).includes('QR-Code'), 'E: Übung ohne Belohnungsspiel → kein Spiel');
    await page.goto(basis + 'ab3a.html');
    await anmelden(page, 'Ela Engel', 'k2');
    await spiele(page, U, {});
    const bel = page.locator('.belohnung');
    pruefe(await bel.isVisible() && (await bel.innerText()).includes('Notfall-Run!'), 'E: nach dem Lösen erscheint die Belohnung');
    pruefe(await page.locator('#spiel-start').getAttribute('href') === 'spiel.html?ab=ab3a', 'E: Knopf führt zu spiel.html?ab=ab3a');
    const unten = await page.evaluate(() => { const m = document.querySelector('.abschluss .merksatz'), b = document.querySelector('.belohnung'); return !!(m && b && (m.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)); });
    pruefe(unten, 'E: Belohnung steht unter „Das Wichtigste in Kürze“');
    await page.evaluate(() => document.querySelector('.belohnung').scrollIntoView({ block: 'end' }));
    await page.screenshot({ path: path.join(__dirname, 'handy-ab3a-belohnung.png') });
    await page.click('#spiel-start');
    await page.waitForSelector('#knopf-los');
    pruefe((await text(page, '#panel')).includes('Ela E. · 3BFP2/2'), 'E: Startbildschirm zeigt Name und Klasse aus der Übung');
    pruefe((await text(page, '#spiel-status')).includes('Beamer'), 'E: Hinweis, dass die Bestleistung auf dem Beamer erscheint');
    await page.click('#knopf-los');
    pruefe(await page.locator('#steuerung').isVisible() && fs1.spielPosts.length === 0, 'E: Lauf startet, vorher wird nichts gesendet');
    await page.waitForFunction(() => window.PflegeSprint.zustand().bildschirm === 'ende', null, { timeout: 30000 });
    const punkte = await page.evaluate(() => window.PflegeSprint.diag.letztePunkte);
    pruefe(punkte > 0 && (await text(page, '#ergebnis-punkte')).includes(String(punkte)), 'E: Game over mit Punkten: ' + punkte);
    await page.waitForTimeout(400);
    const sp = fs1.spielPosts[fs1.spielPosts.length - 1];
    pruefe(sp && sp.punkte === punkte && sp.raum === 'k2-ab3' && Object.keys(sp).length === 3, 'E: nur Raum, Geräte-Kennung und Bestleistung gesendet: ' + JSON.stringify(sp));
    pruefe((await text(page, '#spiel-status')).includes('steht auf dem Beamer'), 'E: Status „steht auf dem Beamer“');
    await page.screenshot({ path: path.join(__dirname, 'handy-spiel-ende.png') });
    await page.goto(basis + 'ab3a.html');
    await page.click('#noch-einmal');
    await page.goto(basis + 'spiel.html?ab=ab3a');
    pruefe(await page.locator('#knopf-los').count() === 1 && (await text(page, '#panel')).includes('Ihre Bestleistung: ' + punkte), 'E: nach „Noch einmal üben“ weiter spielbar, Bestleistung bleibt');
    pruefe(fehler.length === 0, 'Teil E (Handy): keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();

    // Alle Herzen weg → keine Belohnung, Spiel bleibt gesperrt
    const c3 = await kontext(HANDY, true, { leer: 30 });
    const p3 = await c3.newPage();
    await p3.goto(basis + 'ab3a.html');
    await anmelden(p3, 'Max M.', 'k2');
    const K = U.karten[await indexJetzt(p3)];
    for (const f of falscheVon(U, K).slice(0, 3)) { await karteJetzt(p3).locator(`button[data-kuerzel="${f}"]`).click(); await p3.waitForTimeout(SPERRE); }
    pruefe(await p3.locator('.pause-leer').isVisible() && await p3.locator('.belohnung').count() === 0, 'E: Herzen weg → Pause, keine Belohnung');
    await p3.goto(basis + 'spiel.html?ab=ab3a');
    pruefe(await p3.locator('#knopf-los').count() === 0, 'E: Herzen weg → Spiel gesperrt');
    await c3.close();

    // Lehrerseite: Bestleistung neben dem Namen, 🏆 bei der höchsten
    const ela = Object.values(fs1.raeume['k2-ab3']).find(p => p.name === 'Ela E.');
    pruefe(ela && ela.spiel === punkte, 'E: Bestleistung beim Namen gespeichert');
    fs1.raeume['k2-ab3']['9'.repeat(32)] = { id: 'spitze1', name: 'Tom T.', t: Date.now(), spiel: punkte + 500,
      uebungen: { ab3a: { geloest: 10, gesamt: 10, erster: 9, neu: 0, falsch: ['4-OK'], sterne: 2, t: Date.now() } } };
    const c4 = await kontext(BEAMER, true);
    const p4 = await c4.newPage();
    const f4 = [];
    beobachte(p4, f4, SERVER);
    await p4.goto(basis + 'lehrer-3bfp2-2-ab3.html');
    await p4.waitForSelector('.l-karte[data-uebung="ab3a"] .l-pille');
    const elaPille = p4.locator('.l-pille', { hasText: 'Ela E.' });
    const tomPille = p4.locator('.l-pille', { hasText: 'Tom T.' });
    pruefe((await elaPille.locator('.l-spiel').innerText()).includes('🎮 ' + punkte.toLocaleString('de-DE')), 'E: Lehrerseite zeigt 🎮 + Bestleistung bei Ela E.');
    pruefe((await tomPille.locator('.l-spiel').innerText()).includes('🏆') && (await tomPille.getAttribute('title')).includes('höchste der Klasse'), 'E: höchste Bestleistung mit 🏆');
    pruefe(await p4.locator('.l-pille', { hasText: 'Max M.' }).locator('.l-spiel').count() === 0, 'E: ohne Spiel keine Punktzahl');
    pruefe((await text(p4, '#l-fuss')).includes('Belohnungsspiel'), 'E: Fußzeile erklärt 🎮 und 🏆');
    await p4.screenshot({ path: path.join(__dirname, 'lehrer-ab3-spiel.png') });
    await p4.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await p4.waitForSelector('.l-karte');
    pruefe(!(await text(p4, '#l-fuss')).includes('Belohnungsspiel'), 'E: AB ohne Spiel – kein Hinweis auf das Spiel');
    pruefe(f4.length === 0, 'Teil E (Lehrerseite): keine Konsolenfehler: ' + f4.join(' | '));
    await c4.close();

    // Name nicht (mehr) auf der Liste → Hinweis statt Fehler
    const c5 = await kontext(HANDY, true);
    const p5 = await c5.newPage();
    await p5.goto(basis + 'ab3a.html');
    await anmelden(p5, 'Ida I.', 'k2');
    await spiele(p5, U, {});
    await p5.waitForTimeout(200);
    delete fs1.raeume['k2-ab3'][Object.keys(fs1.raeume['k2-ab3']).find(g => fs1.raeume['k2-ab3'][g].name === 'Ida I.')];
    await p5.click('#spiel-start');
    await p5.click('#knopf-los');
    await p5.waitForFunction(() => window.PflegeSprint.zustand().bildschirm === 'ende', null, { timeout: 30000 });
    await p5.waitForTimeout(400);
    pruefe((await text(p5, '#spiel-status')).includes('nicht auf der Liste'), 'E: nicht auf der Liste → Hinweis „Übung noch einmal öffnen“');
    await c5.close();
  }

  /* ---------------- Teil F: Wochen-Challenge auf dem Handy ---------------- */
  async function challengeLauf(page, falschBei, erwarteteAnzahl) {
    const gezogen = [];
    for (let pos = 0; pos < erwarteteAnzahl; pos++) {
      const k = page.locator('#karten .karte[data-uebung]');
      await k.waitFor();
      const u = await k.getAttribute('data-uebung'), i = Number(await k.getAttribute('data-karte'));
      const U = I[u], K = U.karten[i];
      gezogen.push({ u, i, r: richtigeVon(K)[0] });
      const wahl = falschBei.includes(pos) ? falscheVon(U, K)[0] : richtigeVon(K)[0];
      await page.waitForTimeout(150); // mindestens 1 s je Karte, sonst lehnt der Server ab
      await k.locator(`button[data-kuerzel="${wahl}"]`).click();
      if (pos === falschBei[0]) {
        pruefe(await page.locator('#karten .ist-falsch').count() === 1 && await page.locator('#karten .ist-richtig').count() >= 1 && await page.locator('#karten .antwort:enabled').count() === 0, 'F: falsche Antwort – Lösung sofort sichtbar, nur ein Versuch');
        await page.screenshot({ path: path.join(__dirname, 'handy-challenge-lauf.png') });
      }
      await page.waitForFunction(n => { const x = document.querySelector('#karten .karte[data-uebung]'); return !x || Number(x.getAttribute('data-index')) === n; }, pos + 1, { timeout: 5000 });
    }
    return gezogen;
  }
  {
    const ctx = await kontext(HANDY, true);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    const woche = IDS.filter(k => I[k].raum === 'kb2w1');
    await page.goto(basis + 'challenge-kb2w1.html');
    pruefe(await page.locator('#name-bereich').isVisible(), 'F: Challenge fragt zuerst nach dem Namen');
    await anmelden(page, 'Cem C.', 'k2');
    pruefe((await text(page, '#anweisung')).includes('öffnet sich') && await page.locator('.ch-liste li').count() === woche.length && await page.locator('#ch-start').count() === 0, 'F: gesperrt mit Liste der Übungen der Woche');
    pruefe((await text(page, '.ch-liste')).includes('⬜ ' + I[woche[0]].titel), 'F: offene Übungen mit ⬜');
    await page.screenshot({ path: path.join(__dirname, 'handy-challenge-gesperrt.png') });
    await page.goto(basis + woche[0] + '.html');
    await spiele(page, I[woche[0]], {});
    pruefe(await page.locator('#challenge-start').count() === 0, 'F: nach der ersten Übung der Woche noch kein Challenge-Knopf');
    await page.goto(basis + 'challenge-kb2w1.html');
    pruefe((await text(page, '.ch-liste')).includes('✅ ' + I[woche[0]].titel) && await page.locator('#ch-start').count() === 0, 'F: geschaffte Übung mit ✅, noch gesperrt');
    await page.goto(basis + woche[1] + '.html');
    await spiele(page, I[woche[1]], {});
    pruefe((await text(page, '.challenge-box')).includes('Wochen-Challenge'), 'F: alle Übungen der Woche geschafft → Challenge-Kasten');
    await page.click('#challenge-start');
    await page.waitForSelector('#ch-start');
    const anzahl = Math.min(15, woche.reduce((n, k) => n + I[k].karten.length, 0));
    pruefe((await text(page, '#anweisung')).includes(anzahl + ' Karten') && (await text(page, '#karten')).includes('10 Tage'), 'F: Startseite mit Regeln und Datenschutzhinweis');
    await page.screenshot({ path: path.join(__dirname, 'handy-challenge-start.png') });
    await page.click('#ch-start');
    pruefe((await text(page, '#fortschritt-text')) === `Karte 1 von ${anzahl}` && (await text(page, '#herzen')).includes('⏱'), 'F: Lauf mit Kartenzähler und Uhr');
    const gezogen = await challengeLauf(page, [2], anzahl);
    pruefe(new Set(gezogen.map(g => g.u + g.i)).size === anzahl && gezogen.every(g => woche.includes(g.u)), 'F: Karten nur aus der Woche, keine doppelt');
    const jeUebung = woche.map(u => gezogen.filter(g => g.u === u).length);
    pruefe(Math.max(...jeUebung) - Math.min(...jeUebung) <= 1, 'F: gleichmäßig aus allen Übungen gezogen: ' + jeUebung.join('/'));
    pruefe(laengsterLauf(gezogen.map(g => g.r)) <= 3, 'F: nie mehr als 3 gleiche Antworten hintereinander');
    await page.waitForSelector('.ch-ergebnis');
    await page.waitForTimeout(300);
    const post = fs1.chPosts[fs1.chPosts.length - 1];
    pruefe(post && Object.keys(post).sort().join() === 'dauer,geraet,gesamt,name,raum,richtig' && post.raum === 'k2-kb2w1' && post.name === 'Cem C.' && post.richtig === anzahl - 1 && post.gesamt === anzahl, 'F: Ergebnis gesendet (nur Raum, Gerät, Name, richtig, gesamt, Dauer): ' + JSON.stringify(post));
    const punkte = challengePunkte(post.richtig, post.gesamt, post.dauer);
    pruefe((await text(page, '.ch-punkte')).includes(punkte.toLocaleString('de-DE') + ' Punkte') && (await text(page, '.ch-ergebnis')).includes(`${anzahl - 1} von ${anzahl} richtig`), 'F: Punkte wie auf dem Server: ' + punkte);
    pruefe(await page.locator('.ch-loesung').count() === 1 && (await text(page, '.ch-loesung')).includes('Richtig:'), 'F: die falsche Karte wird mit Lösung gezeigt');
    pruefe((await text(page, '.ch-best')).includes(punkte.toLocaleString('de-DE')) && Number(await page.evaluate(k => localStorage.getItem(k), P + 'challenge-kb2w1-best')) === punkte, 'F: Bestleistung gespeichert');
    await page.screenshot({ path: path.join(__dirname, 'handy-challenge-ergebnis.png'), fullPage: true });
    const zahlPosts = fs1.chPosts.length;
    await page.reload();
    await page.waitForTimeout(300);
    pruefe(await page.locator('.ch-ergebnis').isVisible() && fs1.chPosts.length === zahlPosts, 'F: Neuladen zeigt das Ergebnis, ohne erneut zu senden');
    await page.click('#ch-nochmal');
    pruefe((await text(page, '#fortschritt-text')) === `Karte 1 von ${anzahl}`, 'F: „Noch eine Runde“ startet neu');
    pruefe(await breitOk(page), 'F: kein waagerechtes Scrollen');
    // Über den QR-Code der Lehrkraft (?offen=1) ohne geschaffte Übungen
    await page.goto(basis + 'challenge-kb2w2.html?offen=1');
    pruefe(await page.locator('#ch-start').count() === 1, 'F: ?offen=1 öffnet die Challenge ohne geschaffte Übungen');
    // TB2-Challenge (Wiederholung): offen, Karten aus allen Wochen
    await page.goto(basis + 'challenge-kb2w5.html');
    await page.click('#ch-start');
    const tb2 = await challengeLauf(page, [], 20);
    const kb2Ids = IDS.filter(k => /^kb2w[1-4]$/.test(I[k].raum));
    pruefe(new Set(tb2.map(g => g.u)).size === kb2Ids.length && tb2.every(g => kb2Ids.includes(g.u)), 'F: TB2-Challenge zieht aus allen Übungen der 4 Wochen');
    await page.waitForSelector('.ch-ergebnis');
    await page.waitForTimeout(300);
    pruefe(fs1.chPosts[fs1.chPosts.length - 1].raum === 'k2-kb2w5', 'F: TB2-Challenge an Raum k2-kb2w5 gesendet');
    pruefe(fehler.length === 0, 'Teil F: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
    // Ohne Server: Challenge spielbar, nichts gesendet
    const c2 = await kontext(HANDY, false);
    const p2 = await c2.newPage();
    const f2 = [];
    beobachte(p2, f2);
    await p2.goto(basis + 'challenge-kb2w3.html?offen=1');
    pruefe(await p2.locator('#name-bereich').isHidden() && !(await text(p2, '#karten')).includes('10 Tage'), 'F: ohne Server keine Namenseingabe und kein Datenschutzhinweis');
    pruefe(f2.length === 0, 'Teil F (ohne Server): keine fremden Anfragen: ' + f2.join(' | '));
    await c2.close();
  }

  /* ---------------- Teil G: Bestenliste auf der Lehrerseite ---------------- */
  {
    const r = fs1.challenge['k2-kb2w1'];
    const jetzt = Date.now();
    [['Ali A.', 1950, 15, 15, 60], ['Bea B.', 1480, 14, 15, 200], ['Cara C.', 1480, 14, 15, 180], ['Dan D.', 900, 9, 15, 400], ['Eva E.', 300, 3, 15, 590]]
      .forEach(([name, punkte, richtig, gesamt, dauer], j) => { r['g' + j] = { id: 'ch00' + j, name, punkte, richtig, gesamt, dauer, runden: 1, t: jetzt }; });
    const ctx = await kontext(BEAMER, true);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    page.on('dialog', d => d.accept());
    await page.goto(basis + 'lehrer-3bfp2-2-kb2w1.html');
    await page.waitForSelector('.l-challenge .l-ch-zeile');
    const zeilen = await page.locator('.l-ch-zeile .l-ch-name').allInnerTexts();
    const erwartet = Object.values(r).sort((a, b) => b.punkte - a.punkte || a.dauer - b.dauer).map(p => p.name);
    pruefe((await text(page, '.l-challenge')).includes('Wochen-Challenge') && zeilen.length === 6, 'G: Bestenliste mit 6 Einträgen: ' + zeilen.length);
    pruefe(zeilen.join() === erwartet.join() && zeilen.indexOf('Cara C.') < zeilen.indexOf('Bea B.'), 'G: sortiert nach Punkten, bei Gleichstand die schnellere zuerst: ' + zeilen.join(', '));
    pruefe((await text(page, '.l-ch-zeile:first-child')).includes(Object.values(r).find(p => p.name === erwartet[0]).punkte.toLocaleString('de-DE')), 'G: Punkte mit Tausenderpunkt');
    pruefe(zeilen.includes('Cem C.'), 'G: Ergebnis vom Handy (Cem C.) steht in der Liste');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-challenge.png') });
    await page.click('#l-ch-ehrung');
    pruefe((await text(page, '.l-podest-1')).includes(erwartet[0]) && (await text(page, '.l-podest-2')).includes(erwartet[1]) && (await text(page, '.l-podest-3')).includes(erwartet[2]), 'G: Siegerehrung – Treppchen 1–3');
    const weitere = await page.locator('.l-weitere li').allInnerTexts();
    pruefe(weitere.length === 3 && weitere[0].startsWith('4.'), 'G: Plätze ab 4 darunter: ' + weitere.join(' | '));
    await page.screenshot({ path: path.join(__dirname, 'lehrer-siegerehrung.png') });
    await page.keyboard.press('Escape');
    pruefe(await page.locator('.l-vollbild').count() === 0, 'G: Siegerehrung schließen mit Esc');
    await page.click('#l-ch-qr');
    pruefe(await page.locator('.l-qr svg').count() === 1 && (await text(page, '.l-qr-url')).endsWith('challenge-kb2w1.html?offen=1'), 'G: QR-Code führt zur offenen Challenge');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-challenge-qr.png') });
    await page.click('#l-vb-zu');
    await page.locator('.l-ch-zeile', { hasText: 'Eva E.' }).locator('.l-ch-weg').click();
    await page.waitForTimeout(400);
    pruefe(!(await page.locator('.l-ch-zeile').allInnerTexts()).join(' ').includes('Eva E.'), 'G: Eintrag aus der Bestenliste entfernt');
    await page.click('#l-leeren');
    await page.waitForTimeout(400);
    pruefe(await page.locator('.l-ch-zeile').count() === 5, '„Liste leeren“ lässt die Bestenliste stehen');
    await page.click('#l-ch-leeren');
    await page.waitForTimeout(400);
    pruefe(await page.locator('.l-ch-zeile').count() === 0 && await page.locator('#l-ch-ehrung').isDisabled(), 'G: Bestenliste geleert, Siegerehrung aus');
    await page.goto(basis + 'lehrer-3bfp2-2-kb2w5.html');
    await page.waitForSelector('.l-challenge');
    pruefe((await text(page, '.l-challenge')).includes('TB2-Challenge') && (await page.locator('.l-ch-zeile').allInnerTexts()).join(' ').includes('Cem C.'), 'G: TB2-Challenge-Seite mit eigener Bestenliste');
    pruefe(await breitOk(page), 'G: kein waagerechtes Scrollen');
    pruefe(fehler.length === 0, 'Teil G: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }


  /* ---------------- Teil H: Minispiel „Stör-Abwehr“ (Belohnung nach kb2ab05) ---------------- */
  {
    const ID = 'kb2ab05', U = I[ID];
    const ctx = await kontext(HANDY, true, { sekunden: 4 });
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    const zustand = () => page.evaluate(() => window.MiniSpiel.zustand());
    const ortKlicken = async (ort) => { const b = await page.locator(`.st-ort[data-ort="${ort}"]`).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    const laufBeginnen = async (knopf) => { await page.click(knopf); await page.waitForFunction(() => window.MiniSpiel.zustand().modus === 'lauf', null, { timeout: 5000 }); };
    const laufEnde = () => page.waitForFunction(() => window.MiniSpiel.zustand().modus === 'ende', null, { timeout: 12000 });
    pruefe(U.minispiel === 'stoerung', 'H: kb2ab05 schaltet „Stör-Abwehr“ frei');
    pruefe(IDS.filter(k => I[k].minispiel && /^kb2w1$/.test(I[k].raum)).length === 0, 'H: in Woche 1 noch kein Minispiel');
    await page.goto(basis + 'minispiel.html?ab=' + ID);
    pruefe((await text(page, '#ms-panel')).includes('geschafft') && await page.locator(`#ms-panel a.ms-knopf[href="${ID}.html"]`).count() === 1 && await page.locator('#knopf-los').count() === 0, 'H: ohne geschaffte Übung gesperrt, Knopf „Zur Übung“');
    await page.goto(basis + 'minispiel.html?ab=ab1a');
    pruefe((await text(page, '#ms-panel')).includes('gibt es nicht'), 'H: Übung ohne Minispiel → Hinweis');
    await page.goto(basis + ID + '.html');
    await anmelden(page, 'Nora Neu', 'k2');
    await spiele(page, U, {});
    pruefe((await text(page, '.belohnung.minispiel')).includes('Stör-Abwehr') && await page.locator('#spiel-start').getAttribute('href') === 'minispiel.html?ab=' + ID, 'H: nach der Übung: Kasten „Minispiel: Stör-Abwehr“');
    await page.click('#spiel-start');
    await page.waitForSelector('#knopf-los');
    pruefe((await text(page, 'h1')) === 'Stör-Abwehr' && (await text(page, '#ms-panel')).includes('Nora N. · 3BFP2/2') && (await text(page, '#ms-laeufe')).includes('Noch 3 von 3'), 'H: Start mit Name, Klasse und 3 Läufen');
    await page.screenshot({ path: path.join(__dirname, 'handy-minispiel-start.png') });
    // Lauf 1: Störung wegtippen, Gefühl NICHT wegtippen
    await laufBeginnen('#knopf-los');
    pruefe(await page.locator('#ms-leiste').isVisible() && (await text(page, '#ms-leiste')).includes('❤️'), 'H: Leiste mit Zeit, Punkten und Herzen');
    await page.evaluate(() => window.MiniSpiel.erzeuge('stoerung', { ort: 'telefon' }));
    pruefe(await page.locator('.st-ort[data-ort="telefon"].aktiv').count() === 1, 'H: Störung „Telefon klingelt!“ erscheint');
    await page.screenshot({ path: path.join(__dirname, 'handy-minispiel-lauf.png') });
    await ortKlicken('telefon');
    let z = await zustand();
    pruefe(z.punkte >= 10 && await page.locator('.st-ort[data-ort="telefon"].aktiv').count() === 0, 'H: Störung weggetippt → Punkte: ' + z.punkte);
    await page.evaluate(() => window.MiniSpiel.erzeuge('gefuehl'));
    const herzVorher = (await zustand()).leben;
    const sie = await page.locator('#st-sie').boundingBox();
    await page.mouse.click(sie.x + sie.width / 2, sie.y + sie.height / 2);
    pruefe((await zustand()).leben === herzVorher - 1 && (await text(page, '#ms-meldung')).includes('keine Störung'), 'H: Gefühl weggetippt → Herz weg, „Das ist keine Störung“');
    await laufEnde();
    await page.waitForTimeout(400);
    const p1 = Number((await text(page, '#ergebnis-punkte')).replace(/\D/g, ''));
    pruefe(p1 >= 10 && (await text(page, '#ms-panel')).includes('Störungen abgewehrt'), 'H: Ergebnis mit Punkten und Auswertung: ' + p1);
    const sp = fs1.spielPosts[fs1.spielPosts.length - 1];
    pruefe(sp && sp.raum === 'k2-kb2w2' && sp.punkte === p1 && Object.keys(sp).length === 3, 'H: nur Raum, Gerät und Bestleistung gesendet: ' + JSON.stringify(sp));
    pruefe((await text(page, '#spiel-status')).includes('Beamer'), 'H: „Bestleistung steht auf dem Beamer“');
    pruefe(await page.locator('#knopf-nochmal').isVisible() && (await text(page, '#knopf-nochmal')).includes('2 übrig'), 'H: „Noch einmal (2 übrig)“');
    await page.screenshot({ path: path.join(__dirname, 'handy-minispiel-ende.png'), fullPage: true });
    // Lauf 2: Störung verpassen → Herz weg; Pause beim Verlassen der Seite
    await laufBeginnen('#knopf-nochmal');
    await page.evaluate(() => window.MiniSpiel.erzeuge('stoerung', { ort: 'tuer' }));
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    pruefe(await page.locator('#ms-pause').isVisible(), 'H: Seite verlassen → Pause');
    await page.waitForTimeout(800);
    await page.click('#ms-pause');
    pruefe((await zustand()).modus === 'lauf' && await page.locator('#ms-pause').count() === 0, 'H: weiterspielen nach der Pause');
    await page.waitForTimeout(2700);
    pruefe((await zustand()).leben < 3, 'H: Störung verpasst → Herz weg');
    await laufEnde();
    // Lauf 3 – danach sind die Läufe verbraucht
    await laufBeginnen('#knopf-nochmal');
    await laufEnde();
    pruefe(await page.locator('#knopf-nochmal').count() === 0 && (await text(page, '#ms-letzter')).includes('letzter Lauf'), 'H: nach 3 Läufen kein „Noch einmal“');
    await page.reload();
    pruefe(await page.locator('#knopf-los').count() === 0 && (await text(page, '#ms-laeufe')).includes('verbraucht'), 'H: auch nach Neuladen keine weiteren Läufe');
    // Übung noch einmal schaffen → 3 neue Läufe
    await page.goto(basis + ID + '.html');
    await page.click('#noch-einmal');
    await spiele(page, U, {});
    await page.click('#spiel-start');
    await page.waitForSelector('#knopf-los');
    pruefe((await text(page, '#ms-laeufe')).includes('Noch 3 von 3'), 'H: Übung noch einmal geschafft → 3 neue Läufe');
    await page.goto(basis + ID + '.html');
    await page.goto(basis + 'minispiel.html?ab=' + ID);
    pruefe((await text(page, '#ms-laeufe')).includes('Noch 3 von 3'), 'H: Neuladen der fertigen Übung schaltet nicht erneut frei (Läufe zählen weiter)');
    pruefe(await breitOk(page), 'H: kein waagerechtes Scrollen');
    pruefe(fehler.length === 0, 'Teil H (Handy): keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
    // Lehrerseite der Woche: 🎮 beim Namen, Fußzeile nennt das Spiel
    const c2 = await kontext(BEAMER, true);
    const p2 = await c2.newPage();
    const f2 = [];
    beobachte(p2, f2, SERVER);
    await p2.goto(basis + 'lehrer-3bfp2-2-kb2w2.html');
    await p2.waitForSelector('.l-pille');
    const nora = p2.locator(`.l-karte[data-uebung="${ID}"] .l-pille`, { hasText: 'Nora N.' });
    pruefe(/(🎮|🏆) \d/.test(await nora.locator('.l-spiel').innerText()), 'H: Lehrerseite zeigt die Bestleistung bei Nora N. (🏆 = höchste der Klasse): ' + await nora.locator('.l-spiel').innerText());
    pruefe((await text(p2, '#l-fuss')).includes('Stör-Abwehr'), 'H: Fußzeile nennt „Stör-Abwehr“');
    await p2.goto(basis + 'lehrer-3bfp2-2-kb2w1.html');
    await p2.waitForSelector('.l-karte');
    pruefe(!(await text(p2, '#l-fuss')).includes('Belohnungsspiel'), 'H: Woche 1 ohne Minispiel – kein Hinweis');
    pruefe(f2.length === 0, 'Teil H (Lehrerseite): keine Konsolenfehler: ' + f2.join(' | '));
    await c2.close();
  }

  await browser.close();
  s.close();
  console.log(`${ok} Prüfungen bestanden, ${nok} fehlgeschlagen`);
  process.exit(nok ? 1 : 0);
})();

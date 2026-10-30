/* Automatischer Test aller Übungen in Handygröße und der Lehrerseiten (Playwright, Chromium).
 * Aufruf (im Repository-Ordner):  node tests/uebungen.test.js
 * Teil A: Übungen ohne Fortschrittsanzeige (serverAdresse leer) – Tipp, Zusammenfassung,
 *         Durchklicken, Zurücksetzen, kein waagerechtes Scrollen, keine fremden Anfragen.
 * Teil B: mit Fortschrittsanzeige – Namenseingabe mit Klassenwahl, Senden des Fortschritts (nachgebildeter Server).
 * Teil C: Lehrerseiten je Klasse – Anzeige der Namen und Zahlen, Besprechen, Selbstkontrolle, Entfernen, Leeren.
 * Teil D: Schutz gegen Durchklicken – Sperre nach Fehler, Neustart bei zu schnellen Fehlern, ↺ auf der Lehrerseite.
 * In Teil A–C sind Sperre und Neustart ausgeschaltet (sonst würden die schnellen Testklicks sie auslösen). */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const SERVER = 'https://fortschritt.test';
const IDS = ['ab1a', 'ab1b', 'ab2a', 'ab2b', 'ab2c'];

// einstellungen.js für die Tests anpassen: Serveradresse und (optional) Schutz gegen Durchklicken ausschalten
function einstellungen(text, server, schutz) {
  text = text.replace(/serverAdresse: '[^']*'/, `serverAdresse: '${server}'`);
  if (!schutz) {
    text = text.replace(/sperreNachFehlerSekunden: \d+/, 'sperreNachFehlerSekunden: 0')
      .replace(/zuSchnell: \{ fehler: \d+/, 'zuSchnell: { fehler: 0');
  }
  return text;
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
  const raeume = {};
  const posts = [];
  let nr = 0;
  const kopf = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  return {
    posts, raeume,
    async route(route) {
      const req = route.request();
      const url = new URL(req.url());
      if (req.method() === 'POST' && url.pathname === '/fortschritt') {
        const d = JSON.parse(req.postData());
        posts.push(d);
        const r = raeume[d.raum] = raeume[d.raum] || {};
        const p = r[d.geraet] = r[d.geraet] || { id: 'id' + (++nr), uebungen: {} };
        p.name = d.name; p.t = Date.now();
        p.uebungen[d.uebung] = { geloest: d.geloest, gesamt: d.gesamt, erster: d.erster, neu: d.neu || 0, falsch: d.falsch, t: Date.now() };
        return route.fulfill({ status: 204, headers: kopf });
      }
      if (req.method() === 'GET' && url.pathname === '/stand') {
        const r = raeume[url.searchParams.get('raum')] || {};
        return route.fulfill({ status: 200, headers: kopf, body: JSON.stringify({ jetzt: Date.now(), eintraege: Object.values(r) }) });
      }
      if (req.method() === 'POST' && (url.pathname === '/leeren' || url.pathname === '/entfernen')) {
        const d = JSON.parse(req.postData());
        const r = raeume[d.raum] || {};
        for (const g of Object.keys(r)) if (url.pathname === '/leeren' || r[g].id === d.id) delete r[g];
        return route.fulfill({ status: 204, headers: kopf });
      }
      return route.fulfill({ status: 404, headers: kopf });
    }
  };
}

(async () => {
  global.window = {};
  eval(fs.readFileSync(path.join(DOCS, 'inhalte.js'), 'utf8') + ';global.I = INHALTE;');
  const s = await webserver();
  const basis = `http://127.0.0.1:${s.address().port}/`;
  const browser = await chromium.launch();
  let ok = 0, nok = 0;
  const pruefe = (bed, text) => { if (bed) ok++; else { nok++; console.log('  ✗ ' + text); } };

  function beobachte(page, fehler, erlaubt) {
    page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
    page.on('pageerror', e => fehler.push(String(e)));
    page.on('request', r => { if (!r.url().startsWith(basis) && !(erlaubt && r.url().startsWith(erlaubt))) fehler.push('fremde Anfrage: ' + r.url()); });
  }

  /* ---------------- Teil A: Übungen ohne Fortschrittsanzeige ---------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    // Teil A prüft die Übungen ohne Server – die eingetragene Adresse wird hier geleert.
    await ctx.route('**/einstellungen.js', async route => {
      const antwort = await route.fetch();
      const text = einstellungen(await antwort.text(), '', false);
      await route.fulfill({ response: antwort, body: text });
    });
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler);
    for (const id of IDS) {
      const U = I[id];
      const check = U.art === 'check';
      await page.goto(basis + id + '.html');
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      pruefe(await page.locator('#name-bereich').isHidden(), `${id}: ohne Server keine Namenseingabe`);
      const karten = page.locator('.karte');
      pruefe(await karten.count() === U.karten.length, `${id}: Anzahl Karten`);
      pruefe(!(await page.locator('#merksatz-bereich').isVisible()), `${id}: Zusammenfassung anfangs verborgen`);
      pruefe(!(await page.content()).includes(U.merksatz.slice(0, 40)), `${id}: Zusammenfassung steht nicht vorab im Text`);
      pruefe(!(await page.locator('.karte-text').first().innerText()).includes('*'), `${id}: keine Sternchen im Kartentext (fett/kursiv umgesetzt)`);
      const bereich = page.locator('#merksatz-bereich');

      if (check) {
        // Selbstkontrolle: alles „erfüllt“, dann einen Punkt umentscheiden
        for (let i = 0; i < U.karten.length; i++) await karten.nth(i).locator('button[data-kuerzel="JA"]').click();
        pruefe(await bereich.isVisible() && (await bereich.innerText()).includes(`${U.karten.length} von ${U.karten.length}`), `${id}: Ergebnis „alle erfüllt“`);
        await karten.nth(4).locator(`button[data-kuerzel="${U.fehlt}"]`).click();
        pruefe((await bereich.innerText()).includes(`${U.karten.length - 1} von ${U.karten.length}`), `${id}: Umentscheiden ändert das Ergebnis`);
        pruefe(await karten.nth(4).locator('.ist-fehlt').count() === 1 && await karten.nth(4).locator('button[aria-pressed="true"]').count() === 1, `${id}: „fehlt“ ist markiert`);
        pruefe(!(await bereich.innerText()).includes('durchklicken'), `${id}: keine Durchklick-Warnung bei der Selbstkontrolle`);
        pruefe((await page.locator('.karte-text em').count()) > 0, `${id}: „z. B.“ kursiv`);
        await page.reload();
        pruefe((await page.locator('#fortschritt-text').innerText()).startsWith(`${U.karten.length} von`), `${id}: Stand nach Neuladen erhalten`);
        await page.click('#noch-einmal');
        pruefe((await page.locator('#fortschritt-text').innerText()).startsWith('0 von'), `${id}: Zurücksetzen`);
      } else {
        const k0 = U.karten[0];
        const falsch0 = U.knoepfe.map(b => b.kuerzel).find(k => ![].concat(k0.richtig).includes(k));
        await karten.nth(0).locator(`button[data-kuerzel="${falsch0}"]`).click();
        pruefe((await karten.nth(0).locator('.rueckmeldung').innerText()).includes('Tipp'), `${id}: Tipp nach falscher Antwort`);

        for (let i = 0; i < U.karten.length; i++) {
          const r = [].concat(U.karten[i].richtig)[0];
          await karten.nth(i).locator(`button[data-kuerzel="${r}"]`).click();
        }
        pruefe(await bereich.isVisible(), `${id}: Zusammenfassung sichtbar`);
        pruefe((await bereich.innerText()).includes('Das Wichtigste in Kürze'), `${id}: Zusammenfassung erscheint (bei 1 Fehler)`);
        pruefe((await bereich.innerText()).includes(U.danach.replace(/\*\*/g, '').slice(0, 25)), `${id}: Hinweis, wie es weitergeht`);
        const nr = U.titel.split(':')[0];
        pruefe(await page.locator('.weiter').first().isVisible() && (await page.locator('.weiter').innerText()).includes(nr + ' abgeschlossen!'), `${id}: Kasten „${nr} abgeschlossen!“ steht oben`);
        const vorMerksatz = await page.evaluate(() => { const w = document.querySelector('.weiter'), m = document.querySelector('.abschluss .merksatz'); return !!(w && m && (w.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING)); });
        pruefe(vorMerksatz, `${id}: Weiter-Hinweis steht vor der Zusammenfassung`);

        // Zweite richtige Antwort (wo vorhanden) wird ebenfalls akzeptiert
        const mehrfach = U.karten.findIndex(k => Array.isArray(k.richtig) && k.richtig.length > 1);
        if (mehrfach >= 0) {
          await page.click('#noch-einmal');
          const zweite = U.karten[mehrfach].richtig[1];
          await karten.nth(mehrfach).locator(`button[data-kuerzel="${zweite}"]`).click();
          pruefe(await karten.nth(mehrfach).locator('.ist-richtig').count() === 1 &&
            (await karten.nth(mehrfach).locator('.rueckmeldung').innerText()).includes(U.karten[mehrfach].erklaerung[zweite].replace(/\*\*/g, '').slice(0, 20)),
            `${id}: zweite richtige Antwort bei Karte ${U.karten[mehrfach].nummer} mit eigener Erklärung`);
          for (let i = 0; i < U.karten.length; i++) {
            if (i === mehrfach) continue;
            await karten.nth(i).locator(`button[data-kuerzel="${[].concat(U.karten[i].richtig)[0]}"]`).click();
          }
        }
        await page.reload();
        pruefe((await page.locator('#fortschritt-text').innerText()).startsWith(`${U.karten.length} von`), `${id}: Stand nach Neuladen erhalten`);
        await page.click('#noch-einmal');
        pruefe((await page.locator('#fortschritt-text').innerText()).startsWith('0 von'), `${id}: Zurücksetzen`);

        for (let i = 0; i < U.karten.length; i++) {
          const richtige = [].concat(U.karten[i].richtig);
          for (const b of U.knoepfe.map(x => x.kuerzel)) {
            if (richtige.includes(b)) continue;
            const btn = karten.nth(i).locator(`button[data-kuerzel="${b}"]`);
            if (await btn.isEnabled()) await btn.click();
          }
          await karten.nth(i).locator(`button[data-kuerzel="${richtige[0]}"]`).click();
        }
        pruefe((await bereich.innerText()).includes('nicht einfach durchklicken'), `${id}: Durchklicken erkannt`);
      }
      pruefe(await page.locator('a[href]').count() === 0, `${id}: keine Links zu anderen Seiten`);
      const breit = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      pruefe(breit, `${id}: kein waagerechtes Scrollen bei 360 px`);
      const ueberlapp = await page.evaluate(() => {
        const b = [...document.querySelectorAll('.karte')[0].querySelectorAll('.antwort')].map(x => x.getBoundingClientRect());
        for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
          const a = b[i], c = b[j];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) return true;
        }
        return false;
      });
      pruefe(!ueberlapp, `${id}: Antwortknöpfe überlappen nicht`);
      await page.screenshot({ path: path.join(__dirname, `handy-${id}.png`), fullPage: false });
      await page.click('#noch-einmal');
    }
    await page.goto(basis + 'index.html');
    pruefe(await page.locator('a[href]').count() === 0, 'Startseite: keine Links zu den Übungen');
    pruefe((await page.locator('main').innerText()).includes('QR-Code'), 'Startseite: Hinweis auf den QR-Code');
    await page.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    pruefe((await page.locator('#l-inhalt').innerText()).includes('Noch nicht eingerichtet'), 'Lehrerseite ohne Server: Hinweis zur Einrichtung');
    pruefe(fehler.length === 0, 'Teil A: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil B: Namenseingabe mit Klassenwahl und Fortschritt senden ---------------- */
  const fs1 = fortschrittsServer();
  async function kontextMitServer(optionen, schutz) {
    const ctx = await browser.newContext(optionen);
    await ctx.route('**/einstellungen.js', async route => {
      const antwort = await route.fetch();
      const text = einstellungen(await antwort.text(), SERVER + '/', !!schutz);
      await route.fulfill({ response: antwort, body: text });
    });
    await ctx.route(SERVER + '/**', r => fs1.route(r));
    return ctx;
  }
  async function anmelden(p, n, klasse) {
    await p.fill('#name-feld', n);
    if (klasse) await p.check(`input[name=klasse][value=${klasse}]`);
    await p.click('#name-form button[type=submit]');
  }
  {
    const ctx = await kontextMitServer({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    await page.goto(basis + 'ab1a.html');
    pruefe(await page.locator('#name-bereich').isVisible(), 'B: Namenseingabe erscheint');
    pruefe(await page.locator('#uebung-teil').isHidden(), 'B: Karten erst nach dem Namen');
    pruefe(await page.locator('input[name=klasse]').count() === 2, 'B: zwei Klassen zur Auswahl');
    await page.screenshot({ path: path.join(__dirname, 'handy-name.png') });
    for (const falscherName of ['Lena', 'L K.', 'Arsch K.', '<b>x</b> K.']) {
      await anmelden(page, falscherName, 'k2');
      pruefe(await page.locator('#name-fehler').isVisible() && await page.locator('#uebung-teil').isHidden(), `B: ungültiger Name abgelehnt: ${falscherName}`);
    }
    await page.goto(basis + 'ab1a.html');
    await anmelden(page, 'Lena Kraus', null);
    pruefe((await page.locator('#name-fehler').innerText()).includes('Klasse') && await page.locator('#uebung-teil').isHidden(), 'B: ohne Klasse abgelehnt');
    await anmelden(page, '  lena   kraus ', 'k2');
    pruefe(await page.locator('#uebung-teil').isVisible(), 'B: Karten nach gültigem Namen sichtbar');
    pruefe((await page.locator('#name-zeile').innerText()).includes('Lena K. · 3BFP2/2'), 'B: Anzeige „Lena K. · 3BFP2/2“');
    await page.waitForTimeout(200);
    pruefe(fs1.posts.length >= 1 && fs1.posts[fs1.posts.length - 1].name === 'Lena K.' && fs1.posts[fs1.posts.length - 1].raum === 'k2-ab1' && fs1.posts[fs1.posts.length - 1].geloest === 0, 'B: Anmeldung wird an Raum k2-ab1 gesendet (0 gelöst)');
    const U = I.ab1a;
    const karten = page.locator('.karte');
    const falsch0 = U.knoepfe.map(b => b.kuerzel).find(k => ![].concat(U.karten[1].richtig).includes(k));
    await karten.nth(1).locator(`button[data-kuerzel="${falsch0}"]`).click();
    for (let i = 0; i < 6; i++) await karten.nth(i).locator(`button[data-kuerzel="${[].concat(U.karten[i].richtig)[0]}"]`).click();
    await page.waitForTimeout(200);
    const letzter = fs1.posts[fs1.posts.length - 1];
    pruefe(letzter.geloest === 6 && letzter.raum === 'k2-ab1' && letzter.uebung === 'ab1a' && letzter.gesamt === U.karten.length, 'B: Fortschritt 6/12 gesendet');
    pruefe(JSON.stringify(letzter.falsch) === JSON.stringify(['2-' + falsch0]) && letzter.erster === 5, 'B: Fehler beim ersten Versuch (Karte 2, gewählte Antwort) gesendet: ' + JSON.stringify(letzter.falsch));
    pruefe(/^[a-f0-9]{32}$/.test(letzter.geraet), 'B: zufällige Geräte-Kennung');
    // Andere Übung: kein erneutes Fragen nach dem Namen
    await page.goto(basis + 'ab2b.html');
    pruefe(await page.locator('#name-bereich').isHidden() && (await page.locator('#name-zeile').innerText()).includes('Lena K.'), 'B: Name und Klasse bleiben gespeichert');
    for (let i = 0; i < I.ab2b.karten.length; i++) {
      await page.locator('.karte').nth(i).locator(`button[data-kuerzel="${i === 4 || i === 5 ? 'NEIN' : 'JA'}"]`).click();
    }
    await page.waitForTimeout(200);
    const check = fs1.posts[fs1.posts.length - 1];
    pruefe(check.raum === 'k2-ab2' && check.geloest === I.ab2b.karten.length && JSON.stringify(check.falsch) === '["5-NEIN","6-NEIN"]' && check.erster === I.ab2b.karten.length - 2, 'B: Selbstkontrolle sendet „fehlt“-Punkte: ' + JSON.stringify(check));
    // Name und Klasse ändern
    await page.goto(basis + 'ab1b.html');
    await page.click('#name-aendern');
    pruefe(await page.locator('#name-bereich').isVisible() && await page.locator('input[name=klasse][value=k2]').isChecked(), 'B: Ändern zeigt die bisherige Klasse');
    await anmelden(page, 'Anna-Lena K.', 'k1');
    pruefe((await page.locator('#name-zeile').innerText()).includes('Anna-Lena K. · 3BFP2/1'), 'B: geänderter Name und Klasse');
    for (let i = 0; i < I.ab1b.karten.length; i++) await page.locator('.karte').nth(i).locator(`button[data-kuerzel="${[].concat(I.ab1b.karten[i].richtig)[0]}"]`).click();
    await page.waitForTimeout(200);
    pruefe(fs1.posts[fs1.posts.length - 1].geloest === I.ab1b.karten.length && fs1.posts[fs1.posts.length - 1].raum === 'k1-ab1', 'B: fertige Übung an neue Klasse gesendet');
    const breit = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    pruefe(breit, 'B: kein waagerechtes Scrollen');
    pruefe(fehler.length === 0, 'Teil B: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();

    // Weitere Schüler der 3BFP2/2 (für die Lehreransicht)
    const n0 = I.ab1a.karten.length;
    const namen = [['Tim B.', n0, []], ['Mia S.', 3, [1, 2]], ['Jonas W.', n0, [1, 2, 3, 4, 5, 6]]];
    for (const [n, anzahl, falsch] of namen) {
      const c = await kontextMitServer({ viewport: { width: 360, height: 740 } });
      const p = await c.newPage();
      await p.goto(basis + 'ab1a.html');
      await anmelden(p, n, 'k2');
      for (let i = 0; i < anzahl; i++) {
        const k = p.locator('.karte').nth(i);
        if (falsch.includes(I.ab1a.karten[i].nummer)) {
          const f = I.ab1a.knoepfe.map(b => b.kuerzel).find(x => ![].concat(I.ab1a.karten[i].richtig).includes(x));
          await k.locator(`button[data-kuerzel="${f}"]`).click();
        }
        await k.locator(`button[data-kuerzel="${[].concat(I.ab1a.karten[i].richtig)[0]}"]`).click();
      }
      await p.waitForTimeout(150);
      await c.close();
    }
    // Lena K. ist inzwischen in 3BFP2/1 – ihr alter Eintrag in k2-ab1 bleibt (wie im echten Betrieb bis zum Leeren).
  }

  /* ---------------- Teil C: Lehrerseiten ---------------- */
  {
    const ctx = await kontextMitServer({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    page.on('dialog', d => d.accept());
    await page.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await page.waitForSelector('.l-karte[data-uebung="ab1a"]');
    pruefe((await page.locator('h1').innerText()).includes('3BFP2/2') && (await page.locator('h1').innerText()).includes('AB 1'), 'C: Überschrift mit Klasse und AB');
    pruefe(await page.locator('#l-feld').count() === 0, 'C: kein Kennwort nötig');
    pruefe(await page.locator('.l-karte').count() === 2, 'C: zwei Übungen für AB 1');
    const a = page.locator('.l-karte[data-uebung="ab1a"]');
    const zahl = await a.locator('.l-zahl').innerText();
    pruefe(/^2 von 4 fertig · 2 dabei/.test(zahl), 'C: „2 von 4 fertig · 2 dabei“ bei ab1a: ' + zahl);
    const pillen = await a.locator('.l-pille').allInnerTexts();
    pruefe(pillen.length === 4 && pillen.join(' ').includes('Mia S.') && pillen.join(' ').includes('3/12'), 'C: alle Namen mit Fortschritt: ' + pillen.join(' | '));
    pruefe(pillen.some(p => p.includes('Tim B.') && p.includes('✓ 12/12')) && pillen.some(p => p.includes('Jonas W.') && p.includes('⚠ 6/12')), 'C: fertig mit Zahl der beim ersten Versuch richtigen Karten: ' + pillen.join(' | '));
    pruefe(await a.locator('.l-klick').count() === 1, 'C: Durchklicken (Jonas W.) wird markiert');
    const oft = await a.locator('.l-oft li').allInnerTexts();
    pruefe(oft.length === 3 && oft[0].startsWith('Karte 2 · 3×'), 'C: häufigster Fehler Karte 2: ' + oft.join(' | '));
    await a.locator('.l-oft-knopf').first().click();
    const ansicht = page.locator('.l-besprechen');
    pruefe(await ansicht.isVisible(), 'C: Besprechen-Ansicht öffnet sich');
    pruefe((await ansicht.locator('.l-b-aussage').innerText()).includes('verstand nicht'), 'C: Besprechen zeigt Karte 2');
    const gew = ansicht.locator('.l-b-gewaehlt');
    pruefe(await gew.count() >= 1 && (await gew.first().innerText()).includes('zuerst gewählt'), 'C: gewählte falsche Antwort mit Anzahl');
    pruefe(await ansicht.locator('.l-b-erklaerung').isHidden(), 'C: Erklärung vor dem Auflösen verborgen');
    pruefe(!(await ansicht.innerText()).includes('Lena') && !(await ansicht.innerText()).includes('Mia'), 'C: Besprechen ohne Namen');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-besprechen.png') });
    await page.click('#l-b-auf');
    pruefe(await ansicht.locator('.l-b-erklaerung').isVisible() && await page.locator('.l-aufgeloest .l-b-loesung').count() === 1, 'C: Auflösen zeigt Lösung und Erklärung');
    await page.keyboard.press('Escape');
    pruefe(await page.locator('.l-besprechen').count() === 0, 'C: Besprechen schließen mit Esc');
    pruefe((await page.locator('#l-status').innerText()).includes('4 angemeldet'), 'C: Statuszeile');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-ab1.png') });
    // Aktualisierung ohne Neuladen
    fs1.raeume['k2-ab1']['f'.repeat(32)] = { id: 'neu1', name: 'Paul F.', t: Date.now(), uebungen: { ab1a: { geloest: 12, gesamt: 12, erster: 12, falsch: [], t: Date.now() } } };
    await page.waitForTimeout(5600);
    pruefe(/^3 von 5 fertig/.test(await a.locator('.l-zahl').innerText()), 'C: Anzeige aktualisiert sich selbst');
    await a.locator('.l-pille', { hasText: 'Paul F.' }).locator('.l-weg').click({ force: true });
    await page.waitForTimeout(400);
    pruefe(!(await a.locator('.l-pille').allInnerTexts()).join(' ').includes('Paul F.'), 'C: Name entfernt');
    // Andere Klasse: eigene Seite, eigene Namen
    await page.goto(basis + 'lehrer-3bfp2-1-ab1.html');
    await page.waitForSelector('.l-karte');
    const k1 = (await page.locator('#l-inhalt').innerText());
    pruefe(k1.includes('Anna-Lena K.') && !k1.includes('Mia S.') && !k1.includes('Tim B.'), 'C: 3BFP2/1 sieht nur ihre eigenen Namen');
    // AB 2 mit Selbstkontrolle: „Oft nicht erfüllt“
    await page.goto(basis + 'lehrer-3bfp2-2-ab2.html');
    await page.waitForSelector('.l-karte[data-uebung="ab2b"]');
    pruefe(await page.locator('.l-karte').count() === 3, 'C: drei Übungen für AB 2');
    const c2 = page.locator('.l-karte[data-uebung="ab2b"]');
    pruefe((await c2.innerText()).includes('Oft nicht erfüllt') && (await c2.locator('.l-oft li').first().innerText()).startsWith('Punkt 5 · 1×'), 'C: Selbstkontrolle zeigt „Oft nicht erfüllt“');
    pruefe(await c2.locator('.l-klick').count() === 0, 'C: bei der Selbstkontrolle keine Durchklick-Warnung');
    await c2.locator('.l-oft-knopf').first().click();
    pruefe(await page.locator('.l-besprechen').isVisible() && (await page.locator('.l-b-aussage').innerText()).includes('Maßnahme 2') && await page.locator('#l-b-auf').count() === 0, 'C: Punkt der Selbstkontrolle groß, ohne „Auflösen“');
    await page.screenshot({ path: path.join(__dirname, 'lehrer-check.png') });
    await page.keyboard.press('Escape');
    // Leeren
    await page.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await page.waitForSelector('.l-pille');
    await page.click('#l-leeren');
    await page.waitForTimeout(400);
    pruefe(await page.locator('.l-pille').count() === 0, 'C: Liste geleert');
    pruefe(Object.keys(fs1.raeume['k1-ab1']).length === 1, 'C: Leeren betrifft nur die eigene Klasse');
    const breit = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    pruefe(breit, 'C: kein waagerechtes Scrollen');
    pruefe(fehler.length === 0, 'Teil C: keine Konsolenfehler / fremden Anfragen: ' + fehler.join(' | '));
    await ctx.close();
  }

  /* ---------------- Teil D: Schutz gegen Durchklicken ---------------- */
  {
    const ctx = await kontextMitServer({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }, true);
    const page = await ctx.newPage();
    const fehler = [];
    beobachte(page, fehler, SERVER);
    await page.goto(basis + 'ab1b.html');
    await anmelden(page, 'Ben D.', 'k2');
    const U = I.ab1b;
    const karten = page.locator('.karte');
    const falschK = i => U.knoepfe.map(b => b.kuerzel).find(k => ![].concat(U.karten[i].richtig).includes(k));
    const richtigK = i => [].concat(U.karten[i].richtig)[0];
    // Sperre nach einer falschen Antwort
    await karten.nth(0).locator(`button[data-kuerzel="${falschK(0)}"]`).click();
    const r0 = karten.nth(0).locator(`button[data-kuerzel="${richtigK(0)}"]`);
    pruefe(await r0.isDisabled(), 'D: nach falscher Antwort sind die Knöpfe gesperrt');
    pruefe((await karten.nth(0).locator('.sperre').innerText()).includes('weiter in'), 'D: Countdown „weiter in … s“ sichtbar');
    await page.screenshot({ path: path.join(__dirname, 'handy-sperre.png') });
    await page.waitForTimeout(5400);
    pruefe(await r0.isEnabled() && await karten.nth(0).locator('.sperre').count() === 0, 'D: nach 5 s wieder freigegeben');
    // Zwei weitere schnelle Fehler (insgesamt 3 in 10 s) → Neustart
    await karten.nth(1).locator(`button[data-kuerzel="${falschK(1)}"]`).click();
    await karten.nth(2).locator(`button[data-kuerzel="${falschK(2)}"]`).click();
    await page.waitForTimeout(300);
    pruefe(await page.locator('#zu-schnell').isVisible() && (await page.locator('#zu-schnell').innerText()).includes('Zu schnell'), 'D: Hinweis „Zu schnell geklickt!“');
    pruefe((await page.locator('#fortschritt-text').innerText()).startsWith('0 von') && await page.locator('.ist-falsch').count() === 0, 'D: Übung beginnt von vorn');
    await page.screenshot({ path: path.join(__dirname, 'handy-zu-schnell.png') });
    const letzter = fs1.posts[fs1.posts.length - 1];
    pruefe(letzter.neu === 1 && letzter.geloest === 0 && letzter.name === 'Ben D.', 'D: Neustart wird gesendet (neu = 1)');
    // Eine richtige Antwort blendet den Hinweis aus; der Zähler bleibt
    await karten.nth(0).locator(`button[data-kuerzel="${richtigK(0)}"]`).click();
    pruefe(await page.locator('#zu-schnell').isHidden(), 'D: Hinweis verschwindet nach richtiger Antwort');
    await page.reload();
    await karten.nth(1).locator(`button[data-kuerzel="${richtigK(1)}"]`).click();
    await page.waitForTimeout(200);
    pruefe(fs1.posts[fs1.posts.length - 1].neu === 1, 'D: Zähler bleibt nach Neuladen erhalten');
    // Ein einzelner Fehler mit Pause löst keinen Neustart aus
    await karten.nth(2).locator(`button[data-kuerzel="${falschK(2)}"]`).click();
    pruefe(await page.locator('#zu-schnell').isHidden() && (await page.locator('#fortschritt-text').innerText()).startsWith('2 von'), 'D: einzelner Fehler → kein Neustart');
    pruefe(fehler.length === 0, 'Teil D: keine Konsolenfehler: ' + fehler.join(' | '));
    await ctx.close();
    // Lehrerseite zeigt ↺
    const c2 = await kontextMitServer({ viewport: { width: 1280, height: 720 } });
    const p2 = await c2.newPage();
    await p2.goto(basis + 'lehrer-3bfp2-2-ab1.html');
    await p2.waitForSelector('.l-karte[data-uebung="ab1b"] .l-pille');
    const ben = p2.locator('.l-karte[data-uebung="ab1b"] .l-pille', { hasText: 'Ben D.' });
    pruefe((await ben.innerText()).includes('↺') && (await ben.getAttribute('title')).includes('neu gestartet'), 'D: Lehrerseite zeigt ↺ beim Namen: ' + (await ben.innerText()) + ' / ' + (await ben.getAttribute('title')));
    await p2.screenshot({ path: path.join(__dirname, 'lehrer-neustart.png') });
    await c2.close();
  }

  await browser.close();
  s.close();
  console.log(`${ok} Prüfungen bestanden, ${nok} fehlgeschlagen`);
  process.exit(nok ? 1 : 0);
})();

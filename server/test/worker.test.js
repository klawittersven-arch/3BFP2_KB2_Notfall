// Lokaler Test des Workers mit nachgebildeter Cloudflare-Umgebung (ohne Abhängigkeiten).
// Aufruf im Ordner server/:  node test/worker.test.js
import worker, { Raum } from '../src/index.js';
import { AUFBEWAHRUNG_MS } from '../src/logik.js';

let ok = 0, nok = 0;
const pruefe = (bed, text) => { if (bed) ok++; else { nok++; console.log('  ✗ ' + text); } };

function umgebung() {
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
        return { fetch: (url, init) => r.raum.fetch(new Request(url, init)), _r: r };
      }
    },
    _raeume: raeume
  };
}

const B = 'https://w.test';
const post = (env, pfad, daten) => worker.fetch(new Request(B + pfad, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: typeof daten === 'string' ? daten : JSON.stringify(daten) }), env);
const get = (env, pfad) => worker.fetch(new Request(B + pfad), env);

const eintrag = (o = {}) => Object.assign({ raum: 'k2-ab1', uebung: 'ab1a', geraet: 'a'.repeat(32), name: 'Lena K.', geloest: 3, gesamt: 12, erster: 2, falsch: ['2-K', '5-G'] }, o);

const env = umgebung();

// CORS und Gesundheitscheck
let r = await worker.fetch(new Request(B + '/fortschritt', { method: 'OPTIONS' }), env);
pruefe(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === '*', 'OPTIONS mit CORS');
r = await get(env, '/');
pruefe(r.status === 200 && (await r.text()).includes('KB II'), 'Startseite antwortet');

// Fortschritt senden
r = await post(env, '/fortschritt', eintrag());
pruefe(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === '*', 'Fortschritt angenommen (204, CORS)');
r = await post(env, '/fortschritt', eintrag({ geraet: 'b'.repeat(32), name: 'Tim B.', geloest: 12, erster: 11, falsch: ['3-K'] }));
r = await post(env, '/fortschritt', eintrag({ geraet: 'b'.repeat(32), name: 'Tim B.', uebung: 'ab1b', geloest: 4, gesamt: 10, erster: 4, falsch: [] }));
pruefe(r.status === 204, 'zweite Übung desselben Geräts');
r = await post(env, '/fortschritt', eintrag({ raum: 'k2-ab2', uebung: 'ab2c', geloest: 8, gesamt: 8, erster: 6, falsch: ['5-OK', '6-KNAPP'] }));
pruefe(r.status === 204, 'AB 2 (Antwort-Check) angenommen');

// Ungültige Daten
const ungueltig = [
  ['kein JSON', 'xyz'], ['Raum ohne Klasse', eintrag({ raum: 'ab1' })], ['Raum mit Leerzeichen', eintrag({ raum: 'k2 ab1' })],
  ['Raum unbekanntes Format', eintrag({ raum: 'kx-ab1' })], ['Name leer', eintrag({ name: '' })],
  ['Name mit Zeichen', eintrag({ name: '<script>' })], ['Name zu lang', eintrag({ name: 'A'.repeat(30) + ' K.' })],
  ['Gerät', eintrag({ geraet: 'xyz' })], ['geloest > gesamt', eintrag({ geloest: 13 })],
  ['falsch-Liste', eintrag({ falsch: ['a'] })], ['falsch als Zahl', eintrag({ falsch: [2] })], ['falsch mit HTML', eintrag({ falsch: ['2-<b>'] })],
  ['zu groß', JSON.stringify(eintrag({ name: 'Lena K.', x: 'y'.repeat(5000) }))]
];
for (const [t, d] of ungueltig) {
  r = await post(env, '/fortschritt', d);
  pruefe(r.status === 400, 'abgelehnt: ' + t + ' (' + r.status + ')');
}

// Neustarts (wegen zu schneller Fehler) werden gespeichert und geprüft
r = await post(env, '/fortschritt', eintrag({ geraet: 'd'.repeat(32), name: 'Ben D.', raum: 'k2-ab2', uebung: 'ab2a', neu: 2 }));
pruefe(r.status === 204, 'Neustarts angenommen');
r = await post(env, '/fortschritt', eintrag({ neu: 150 }));
pruefe(r.status === 400, 'zu viele Neustarts abgelehnt');
r = await post(env, '/fortschritt', eintrag({ neu: 'x' }));
pruefe(r.status === 400, 'Neustarts als Text abgelehnt');
let sn = await (await get(env, '/stand?raum=k2-ab2')).json();
pruefe(sn.eintraege.find((e) => e.name === 'Ben D.').uebungen.ab2a.neu === 2, 'Neustarts im Stand');

// Stand abrufen (ohne Kennwort)
r = await get(env, '/stand?raum=k2-ab1');
let s = await r.json();
pruefe(r.status === 200 && s.eintraege.length === 2, 'Stand k2-ab1: 2 Einträge');
const tim = s.eintraege.find((e) => e.name === 'Tim B.');
pruefe(tim && tim.uebungen.ab1a.geloest === 12 && tim.uebungen.ab1b.geloest === 4, 'Stand: Übungen je Gerät');
pruefe(!JSON.stringify(s).includes('a'.repeat(32)), 'Stand enthält keine Geräte-Kennungen');
pruefe(typeof tim.id === 'string' && /^[a-z0-9]{4,16}$/.test(tim.id), 'Stand: kurze Kennung zum Entfernen');
r = await get(env, '/stand?raum=ab1');
pruefe(r.status === 400, 'Stand mit ungültigem Raum → 400');

// Klassen sind getrennt
await post(env, '/fortschritt', eintrag({ raum: 'k1-ab1', geraet: 'c'.repeat(32), name: 'Mia S.' }));
s = await (await get(env, '/stand?raum=k1-ab1')).json();
pruefe(s.eintraege.length === 1 && s.eintraege[0].name === 'Mia S.', 'Klasse 3BFP2/1 getrennt von 3BFP2/2');
s = await (await get(env, '/stand?raum=k2-ab1')).json();
pruefe(!s.eintraege.some((e) => e.name === 'Mia S.'), 'Mia S. erscheint nicht in 3BFP2/2');

// Namensänderung überschreibt
await post(env, '/fortschritt', eintrag({ name: 'Lena M.' }));
s = await (await get(env, '/stand?raum=k2-ab1')).json();
pruefe(s.eintraege.some((e) => e.name === 'Lena M.') && !s.eintraege.some((e) => e.name === 'Lena K.'), 'Name wird aktualisiert');

// Arbeitsblätter getrennt
s = await (await get(env, '/stand?raum=k2-ab2')).json();
pruefe(s.eintraege.length === 2 && JSON.stringify(s.eintraege.find((e) => e.uebungen.ab2c).uebungen.ab2c.falsch) === '["5-OK","6-KNAPP"]', 'AB 2 getrennt gespeichert');

// Entfernen
r = await post(env, '/entfernen', { raum: 'k2-ab1', id: 'ungültig!' });
pruefe(r.status === 400, 'Entfernen mit ungültiger Kennung → 400');
r = await post(env, '/entfernen', { raum: 'k2-ab1', id: tim.id });
s = await (await get(env, '/stand?raum=k2-ab1')).json();
pruefe(r.status === 204 && s.eintraege.length === 1, 'Entfernen eines Namens');

// Leeren betrifft nur diese Klasse und dieses AB
r = await post(env, '/leeren', { raum: 'k2-ab1' });
s = await (await get(env, '/stand?raum=k2-ab1')).json();
const s1 = await (await get(env, '/stand?raum=k1-ab1')).json();
pruefe(r.status === 204 && s.eintraege.length === 0 && s1.eintraege.length === 1, 'Liste leeren nur für 3BFP2/2, AB 1');

// Automatisches Löschen nach 12 Stunden
await post(env, '/fortschritt', eintrag());
const echtJetzt = Date.now;
Date.now = () => echtJetzt() + AUFBEWAHRUNG_MS + 1000;
s = await (await get(env, '/stand?raum=k2-ab1')).json();
Date.now = echtJetzt;
pruefe(s.eintraege.length === 0, 'Einträge nach 12 Stunden gelöscht');

// Obergrenze Geräte
const env3 = umgebung();
let letzte;
for (let i = 0; i < 125; i++) letzte = await post(env3, '/fortschritt', eintrag({ geraet: i.toString(16).padStart(32, '0') }));
pruefe(letzte.status === 429, 'Obergrenze von 120 Geräten pro Raum');

// Belohnungsspiel: Bestleistung neben dem Namen (Woche 4, raum ab3)
const env4 = umgebung();
const sp = (o = {}) => Object.assign({ raum: 'k2-ab3', geraet: 'e'.repeat(32), punkte: 420 }, o);
r = await post(env4, '/spiel', sp());
pruefe(r.status === 404, 'Spiel: unbekanntes Handy (nicht auf der Liste) → 404');
await post(env4, '/fortschritt', eintrag({ raum: 'k2-ab3', uebung: 'ab3a', geraet: 'e'.repeat(32), name: 'Ela E.', geloest: 10, gesamt: 10, erster: 9, falsch: ['4-OK'] }));
r = await post(env4, '/spiel', sp());
pruefe(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === '*', 'Spiel: Bestleistung angenommen (204, CORS)');
s = await (await get(env4, '/stand?raum=k2-ab3')).json();
pruefe(s.eintraege[0].spiel === 420 && s.eintraege[0].uebungen.ab3a.geloest === 10, 'Stand: Bestleistung neben Name und Fortschritt');
await post(env4, '/spiel', sp({ punkte: 100 }));
s = await (await get(env4, '/stand?raum=k2-ab3')).json();
pruefe(s.eintraege[0].spiel === 420, 'niedrigere Punktzahl ersetzt die Bestleistung nicht');
await post(env4, '/spiel', sp({ punkte: 777 }));
s = await (await get(env4, '/stand?raum=k2-ab3')).json();
pruefe(s.eintraege[0].spiel === 777, 'höhere Punktzahl ersetzt die Bestleistung');
await post(env4, '/fortschritt', eintrag({ raum: 'k2-ab3', uebung: 'ab3a', geraet: 'e'.repeat(32), name: 'Ela E.', geloest: 10, gesamt: 10, erster: 9, falsch: [] }));
s = await (await get(env4, '/stand?raum=k2-ab3')).json();
pruefe(s.eintraege[0].spiel === 777, 'neuer Fortschritt löscht die Bestleistung nicht');
for (const [t, d] of [['Punkte 0', sp({ punkte: 0 })], ['Punkte negativ', sp({ punkte: -5 })], ['Punkte Kommazahl', sp({ punkte: 1.5 })],
  ['Punkte zu hoch', sp({ punkte: 5000000 })], ['Punkte als Text', sp({ punkte: '99' })], ['Raum', sp({ raum: 'ab3' })], ['Gerät', sp({ geraet: 'x' })], ['kein JSON', 'xyz']]) {
  r = await post(env4, '/spiel', d);
  pruefe(r.status === 400, 'Spiel abgelehnt: ' + t + ' (' + r.status + ')');
}
s = await (await get(env4, '/stand?raum=k1-ab3')).json();
pruefe(s.eintraege.length === 0, 'Spiel: Klassen getrennt');
s = await (await get(env, '/stand?raum=k2-ab2')).json();
pruefe(s.eintraege.every((e) => e.spiel === undefined), 'Ohne Spiel kein Feld „spiel“ im Stand');

// Daten werden im Durable-Object-Speicher gesichert
await post(env, '/fortschritt', eintrag({ name: 'Mia S.' }));
const gespeichert = env._raeume.get('k2-ab1').speicher.get('daten');
pruefe(gespeichert && Object.keys(gespeichert).length === 1, 'Daten im Speicher gesichert');

// ---------- Fall-Einführung „Zeitlupe“ ----------
const envF = umgebung();
const fa = (o = {}) => Object.assign({ raum: 'k2-fall', geraet: 'f'.repeat(32), name: 'Lena K.', frage: 's2', wert: 'R' }, o);
const zst = async (raum = 'k2-fall') => (await get(envF, '/fall/zustand?raum=' + raum)).json();
const fst = async (raum = 'k2-fall') => (await get(envF, '/fall/stand?raum=' + raum)).json();

let z = await zst();
pruefe(z.schritt === 0 && z.stufe === 0 && z.durchgang === 'einf' && /^[a-z0-9]{4,16}$/.test(z.sitzung), 'Fall: Startzustand');
r = await get(envF, '/fall/zustand?raum=k2-ab1');
pruefe(r.status === 400, 'Fall: Arbeitsblatt-Raum wird abgelehnt');
r = await post(envF, '/fortschritt', eintrag({ raum: 'k2-fall' }));
pruefe(r.status === 400, 'Übungs-Fortschritt in Fall-Raum abgelehnt');

// Steuerung
r = await post(envF, '/fall/steuern', { raum: 'k2-fall', schritt: 3, stufe: 1 });
z = await zst();
pruefe(r.status === 204 && z.schritt === 3 && z.stufe === 1, 'Fall: Lehrerseite steuert Schritt und Stufe');
for (const [t, d] of [['Schritt negativ', { schritt: -1, stufe: 0 }], ['Schritt zu groß', { schritt: 99, stufe: 0 }], ['Stufe', { schritt: 1, stufe: 7 }],
  ['Durchgang', { schritt: 1, stufe: 0, durchgang: 'xyz' }], ['Raum', { raum: 'k2-ab1', schritt: 1, stufe: 0 }]]) {
  r = await post(envF, '/fall/steuern', Object.assign({ raum: 'k2-fall' }, d));
  pruefe(r.status === 400, 'Fall: Steuerung abgelehnt: ' + t);
}
// Vorlesen: Abschnitt und Person (kurzId) – ungültige Angaben werden abgelehnt
for (const [t, l] of [['Abschnitt negativ', { abschnitt: -1, person: '' }], ['Abschnitt zu groß', { abschnitt: 99, person: '' }],
  ['Person', { abschnitt: 0, person: 'X!' }], ['kein Objekt', 'abc']]) {
  r = await post(envF, '/fall/steuern', { raum: 'k2-fall', schritt: 3, stufe: 0, lesen: l });
  pruefe(r.status === 400, 'Fall: Vorlesen abgelehnt: ' + t);
}

// Antworten (einzeln und Mehrfachauswahl) und Zählung
r = await post(envF, '/fall/antwort', fa());
pruefe(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === '*', 'Fall: Antwort angenommen');
await post(envF, '/fall/antwort', fa({ geraet: '1'.repeat(32), name: 'Tim B.', wert: 'Y' }));
await post(envF, '/fall/antwort', fa({ geraet: '2'.repeat(32), name: 'Ela E.', wert: 'R' }));
await post(envF, '/fall/antwort', fa({ frage: 's1', wert: ['STURZ', 'THROMB', 'THROMB'] }));
await post(envF, '/fall/antwort', fa({ geraet: '1'.repeat(32), name: 'Tim B.', frage: 's1', wert: ['THROMB'] }));
await post(envF, '/fall/antwort', fa({ wert: 'G' })); // Antwort ändern
let fs1 = await fst();
pruefe(fs1.ergebnisse.s2.R === 1 && fs1.ergebnisse.s2.Y === 1 && fs1.ergebnisse.s2.G === 1 && fs1.anzahl.s2 === 3, 'Fall: Ampel gezählt, geänderte Antwort ersetzt die alte');
pruefe(fs1.ergebnisse.s1.THROMB === 2 && fs1.ergebnisse.s1.STURZ === 1 && fs1.anzahl.s1 === 2, 'Fall: Mehrfachauswahl gezählt (doppelte Kürzel nur einmal)');
pruefe(fs1.leute.length === 3 && fs1.leute.find((p) => p.name === 'Lena K.').beantwortet.sort().join() === 's1,s2', 'Fall: Namen mit beantworteten Fragen');
pruefe(!JSON.stringify(fs1).includes('f'.repeat(32)), 'Fall: Stand ohne Geräte-Kennungen');
pruefe(!JSON.stringify(fs1.leute).includes('"R"'), 'Fall: keine Einzelantworten je Name');
// Leere Liste = Antwort zurückziehen (automatisches Senden: Auswahl wieder unvollständig)
await post(envF, '/fall/antwort', fa({ geraet: '2'.repeat(32), name: 'Ela E.', frage: 's7', wert: ['REDEN', 'TEAM', 'PA'] }));
fs1 = await fst();
pruefe(fs1.anzahl.s7 === 1 && fs1.leute.find((p) => p.name === 'Ela E.').beantwortet.includes('s7'), 'Fall: Auswahl s7 gezählt');
r = await post(envF, '/fall/antwort', fa({ geraet: '2'.repeat(32), name: 'Ela E.', frage: 's7', wert: [] }));
fs1 = await fst();
pruefe(r.status === 204 && !fs1.anzahl.s7 && !fs1.ergebnisse.s7 && !fs1.leute.find((p) => p.name === 'Ela E.').beantwortet.includes('s7'), 'Fall: leere Liste zieht die Antwort zurück');
r = await post(envF, '/fall/antwort', fa({ geraet: '2'.repeat(32), name: 'Ela E.', frage: 's6', wert: [] }));
pruefe(r.status === 204 && !(await fst()).leute.find((p) => p.name === 'Ela E.').beantwortet.includes('s6'), 'Fall: Zurückziehen ohne vorherige Antwort schadet nicht');
for (const [t, d] of [['Frage', fa({ frage: 'S 2' })], ['Wert HTML', fa({ wert: '<b>' })], ['Wert Zahl', fa({ wert: 3 })], ['Liste zu lang', fa({ wert: Array(13).fill('A') })],
  ['Name', fa({ name: 'x' })], ['Gerät', fa({ geraet: 'zz' })], ['Raum', fa({ raum: 'k2-ab1' })], ['kein JSON', 'xyz']]) {
  r = await post(envF, '/fall/antwort', d);
  pruefe(r.status === 400, 'Fall: Antwort abgelehnt: ' + t);
}

// Texte: Perspektiven und Begriffsparkplatz
const tx = (o = {}) => Object.assign({ raum: 'k2-fall', geraet: 'f'.repeat(32), name: 'Lena K.', art: 'persp', person: 'christin', a: 'eine klare  Anweisung', b: 'Wie gebe ich im Notfall klare Anweisungen?' }, o);
r = await post(envF, '/fall/text', tx());
pruefe(r.status === 204, 'Fall: Perspektive angenommen');
await post(envF, '/fall/text', tx({ art: 'begriff', a: 'Redon-Drainage' }));
await post(envF, '/fall/text', tx({ geraet: '1'.repeat(32), name: 'Tim B.', art: 'begriff', a: 'redon-drainage' }));
await post(envF, '/fall/text', tx({ geraet: '1'.repeat(32), name: 'Tim B.', art: 'begriff', a: 'Luxation' }));
for (const [t, d] of [['leer', tx({ a: '', b: ' ' })], ['zu lang', tx({ a: 'x'.repeat(201) })], ['Person', tx({ person: 'Christin!' })], ['Art', tx({ art: 'x' })],
  ['Begriff leer', tx({ art: 'begriff', a: '' })], ['Begriff zu lang', tx({ art: 'begriff', a: 'y'.repeat(41) })]]) {
  r = await post(envF, '/fall/text', d);
  pruefe(r.status === 400, 'Fall: Text abgelehnt: ' + t);
}
fs1 = await fst();
const persp = fs1.texte.find((x) => x.art === 'persp');
pruefe(persp && persp.a === 'eine klare Anweisung' && persp.person === 'christin' && persp.kb === '' && !('name' in persp), 'Fall: Perspektive gesäubert, ohne Namen');
r = await post(envF, '/fall/kb', { raum: 'k2-fall', id: persp.id, kb: 'II' });
fs1 = await fst();
pruefe(r.status === 204 && fs1.texte.find((x) => x.id === persp.id).kb === 'II', 'Fall: Lehrkraft ordnet KB zu');
r = await post(envF, '/fall/kb', { raum: 'k2-fall', id: persp.id, kb: 'VI' });
pruefe(r.status === 400, 'Fall: unbekannter KB abgelehnt');
const redon = fs1.texte.find((x) => x.a === 'Redon-Drainage');
await post(envF, '/fall/text-weg', { raum: 'k2-fall', id: redon.id });
fs1 = await fst();
pruefe(fs1.texte.filter((x) => x.art === 'begriff').map((x) => x.a).join() === 'Luxation', 'Fall: Begriff entfernen entfernt alle gleichen Wörter');
let viele;
for (let i = 0; i < 16; i++) viele = await post(envF, '/fall/text', tx({ geraet: '3'.repeat(32), name: 'Max M.', art: 'begriff', a: 'Wort' + i }));
pruefe(viele.status === 429, 'Fall: höchstens 15 Texte je Handy');

// Ergebnis sichern (ohne Namen), neuer Durchgang SW 13 beginnt leer, Archiv bleibt
r = await post(envF, '/fall/sichern', { raum: 'k2-fall' });
fs1 = await fst();
const arch = fs1.archiv.einf;
pruefe(r.status === 204 && arch && arch.ergebnisse.s2.R === 1 && arch.teilnehmende === 4 && arch.texte.some((x) => x.kb === 'II'), 'Fall: Ergebnis gesichert');
pruefe(!JSON.stringify(fs1.archiv).includes('Lena') && !JSON.stringify(fs1.archiv).includes('f'.repeat(32)), 'Fall: gesichertes Ergebnis ohne Namen und Kennungen');
const alteSitzung = (await zst()).sitzung;
await post(envF, '/fall/steuern', { raum: 'k2-fall', schritt: 0, stufe: 0, durchgang: 'sw13' });
fs1 = await fst();
pruefe(fs1.steuerung.durchgang === 'sw13' && fs1.leute.length === 0 && fs1.texte.length === 0 && fs1.steuerung.sitzung !== alteSitzung, 'Fall: neuer Durchgang beginnt leer mit neuer Sitzung');
pruefe(fs1.archiv.einf && fs1.archiv.einf.ergebnisse.s2.R === 1, 'Fall: Ergebnis der Einführung bleibt erhalten');

// Person entfernen, Leeren, Klassen getrennt, 12 Stunden
await post(envF, '/fall/antwort', fa({ wert: 'R' }));
await post(envF, '/fall/text', tx());
fs1 = await fst();
r = await post(envF, '/fall/entfernen', { raum: 'k2-fall', id: fs1.leute[0].id });
fs1 = await fst();
pruefe(r.status === 204 && fs1.leute.length === 0 && fs1.texte.length === 0 && !fs1.anzahl.s2, 'Fall: Person mit Antworten und Texten entfernt');
await post(envF, '/fall/antwort', fa({ raum: 'k1-fall', name: 'Mia S.' }));
pruefe((await fst('k1-fall')).leute.length === 1 && (await fst()).leute.length === 0, 'Fall: Klassen getrennt');
await post(envF, '/fall/antwort', fa());
await post(envF, '/fall/steuern', { raum: 'k2-fall', schritt: 5, stufe: 2 });
r = await post(envF, '/fall/leeren', { raum: 'k2-fall' });
fs1 = await fst();
pruefe(r.status === 204 && fs1.leute.length === 0 && fs1.steuerung.schritt === 0 && fs1.steuerung.durchgang === 'sw13' && fs1.archiv.einf, 'Fall: Leeren (Durchgang und Archiv bleiben)');
await post(envF, '/fall/antwort', fa());
Date.now = () => echtJetzt() + AUFBEWAHRUNG_MS + 1000;
fs1 = await fst();
Date.now = echtJetzt;
pruefe(fs1.leute.length === 0 && fs1.archiv.einf, 'Fall: nach 12 Stunden gelöscht, gesichertes Ergebnis bleibt');
r = await post(envF, '/fall/archiv-loeschen', { raum: 'k2-fall', durchgang: 'einf' });
fs1 = await fst();
pruefe(r.status === 204 && !fs1.archiv.einf, 'Fall: gesichertes Ergebnis löschen');
pruefe(envF._raeume.get('k2-fall').speicher.get('fall') && envF._raeume.get('k2-fall').speicher.get('fallArchiv'), 'Fall: Daten im Durable-Object-Speicher');
// Gruppen für die Perspektiven-Runde
const envG = umgebung();
const gA = 'a'.repeat(32), gB = 'b'.repeat(32), gC = 'c'.repeat(32);
await post(envG, '/fall/antwort', fa({ geraet: gA, name: 'Lena K.' }));
await post(envG, '/fall/antwort', fa({ geraet: gB, name: 'Tim B.' }));
await post(envG, '/fall/antwort', fa({ geraet: gC, name: 'Mia S.' }));
let gs = await (await get(envG, '/fall/stand?raum=k2-fall')).json();
const idVon = (n) => gs.leute.find((p) => p.name === n).id;
pruefe(gs.leute.every((p) => p.gruppe === '' && p.eintraege === 0), 'Gruppen: anfangs ohne Gruppe');
r = await post(envG, '/fall/gruppen', { raum: 'k2-fall', zuordnung: { [idVon('Lena K.')]: 'christin', [idVon('Tim B.')]: 'christin', [idVon('Mia S.')]: 'angeh' } });
pruefe(r.status === 204, 'Gruppen: Lehrerseite teilt ein');
let gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gA)).json();
pruefe(gz.gruppe === 'christin' && JSON.stringify(gz.mitglieder) === '["Lena K.","Tim B."]', 'Gruppen: Handy erfährt Gruppe und Namen der Gruppe');
gz = await (await get(envG, '/fall/zustand?raum=k2-fall')).json();
pruefe(gz.gruppe === undefined && gz.mitglieder === undefined, 'Gruppen: ohne Gerät keine Gruppe im Zustand');
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + 'd'.repeat(32))).json();
pruefe(gz.gruppe === undefined, 'Gruppen: unbekanntes Gerät ohne Gruppe');
// Vorlesen: Handy erfährt den Abschnitt und ob es selbst dran ist, die Lehrerseite auch die Person
r = await post(envG, '/fall/steuern', { raum: 'k2-fall', schritt: 4, stufe: 1, lesen: { abschnitt: 2, person: idVon('Tim B.') } });
pruefe(r.status === 204, 'Vorlesen: Lehrerseite bestimmt Abschnitt und Person');
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gB)).json();
pruefe(gz.lesen && gz.lesen.abschnitt === 2 && gz.lesen.ich === true && gz.lesen.person === undefined, 'Vorlesen: Tims Handy weiß, dass es dran ist (ohne Kennung)');
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gA)).json();
pruefe(gz.lesen && gz.lesen.abschnitt === 2 && gz.lesen.ich === false, 'Vorlesen: andere Handys sehen nur den Abschnitt');
gz = await (await get(envG, '/fall/zustand?raum=k2-fall')).json();
pruefe(gz.lesen && gz.lesen.ich === false && gz.lesen.person === undefined, 'Vorlesen: ohne Gerät keine Person');
gs = await (await get(envG, '/fall/stand?raum=k2-fall')).json();
pruefe(gs.steuerung.lesen && gs.steuerung.lesen.person === idVon('Tim B.') && gs.steuerung.lesen.abschnitt === 2, 'Vorlesen: Lehrerseite bekommt die Person (nach dem Neuladen)');
r = await post(envG, '/fall/steuern', { raum: 'k2-fall', schritt: 4, stufe: 2 });
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gB)).json();
pruefe(r.status === 204 && gz.lesen === undefined, 'Vorlesen: Weiterschalten ohne „lesen“ beendet das Vorlesen');
gs = await (await get(envG, '/fall/stand?raum=k2-fall')).json();
await post(envG, '/fall/text', tx({ geraet: gA, name: 'Lena K.', person: 'christin' }));
await post(envG, '/fall/text', tx({ geraet: gA, name: 'Lena K.', art: 'begriff', a: 'Luxation' }));
gs = await (await get(envG, '/fall/stand?raum=k2-fall')).json();
pruefe(gs.leute.find((p) => p.name === 'Lena K.').eintraege === 1 && gs.leute.find((p) => p.name === 'Tim B.').eintraege === 0, 'Gruppen: Zahl der Perspektiven-Einträge je Name (Begriffe zählen nicht)');
pruefe(gs.leute.find((p) => p.name === 'Mia S.').gruppe === 'angeh', 'Gruppen: Gruppe im Stand');
await post(envG, '/fall/gruppen', { raum: 'k2-fall', zuordnung: { [idVon('Tim B.')]: 'pk1' } });
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gB)).json();
pruefe(gz.gruppe === 'pk1' && JSON.stringify(gz.mitglieder) === '["Tim B."]', 'Gruppen: eine Person umsetzen, die anderen bleiben');
await post(envG, '/fall/gruppen', { raum: 'k2-fall', ersetzen: true, zuordnung: { [idVon('Mia S.')]: 'maler' } });
gs = await (await get(envG, '/fall/stand?raum=k2-fall')).json();
pruefe(gs.leute.find((p) => p.name === 'Lena K.').gruppe === '' && gs.leute.find((p) => p.name === 'Mia S.').gruppe === 'maler', 'Gruppen: neu einteilen ersetzt alles');
for (const [t, d] of [['Raum', { raum: 'k2-ab1', zuordnung: {} }], ['keine Zuordnung', { raum: 'k2-fall' }], ['Liste statt Objekt', { raum: 'k2-fall', zuordnung: [] }],
  ['Gruppe ungültig', { raum: 'k2-fall', zuordnung: { abcd1234: 'Christin!' } }], ['Kennung ungültig', { raum: 'k2-fall', zuordnung: { 'x y': 'christin' } }]]) {
  r = await post(envG, '/fall/gruppen', d);
  pruefe(r.status === 400, 'Gruppen abgelehnt: ' + t);
}
await post(envG, '/fall/entfernen', { raum: 'k2-fall', id: idVon('Mia S.') });
gs = await (await get(envG, '/fall/stand?raum=k2-fall')).json();
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gC)).json();
pruefe(!gs.leute.some((p) => p.name === 'Mia S.') && gz.gruppe === undefined, 'Gruppen: entfernte Person verliert ihre Gruppe');
await post(envG, '/fall/gruppen', { raum: 'k2-fall', zuordnung: { [idVon('Lena K.')]: 'christin' } });
await post(envG, '/fall/leeren', { raum: 'k2-fall' });
await post(envG, '/fall/antwort', fa({ geraet: gA, name: 'Lena K.' }));
gz = await (await get(envG, '/fall/zustand?raum=k2-fall&geraet=' + gA)).json();
pruefe(gz.gruppe === undefined, 'Gruppen: „Liste leeren“ löscht die Gruppen');

r = await get(envF, '/fall/unbekannt?raum=k2-fall');
pruefe(r.status === 404, 'Fall: unbekannte Aktion → 404');

console.log(`${ok} Prüfungen bestanden, ${nok} fehlgeschlagen`);
process.exit(nok ? 1 : 0);

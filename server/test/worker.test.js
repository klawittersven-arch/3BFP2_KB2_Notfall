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
r = await post(env, '/fortschritt', eintrag({ raum: 'k2-ab2', uebung: 'ab2b', geloest: 8, gesamt: 8, erster: 6, falsch: ['5-NEIN', '6-NEIN'] }));
pruefe(r.status === 204, 'Selbstkontrolle (5-NEIN) angenommen');

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
pruefe(s.eintraege.length === 1 && JSON.stringify(s.eintraege[0].uebungen.ab2b.falsch) === '["5-NEIN","6-NEIN"]', 'AB 2 getrennt, Selbstkontrolle gespeichert');

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

// Daten werden im Durable-Object-Speicher gesichert
await post(env, '/fortschritt', eintrag({ name: 'Mia S.' }));
const gespeichert = env._raeume.get('k2-ab1').speicher.get('daten');
pruefe(gespeichert && Object.keys(gespeichert).length === 1, 'Daten im Speicher gesichert');

console.log(`${ok} Prüfungen bestanden, ${nok} fehlgeschlagen`);
process.exit(nok ? 1 : 0);

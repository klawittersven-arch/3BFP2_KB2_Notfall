// Cloudflare Worker: nimmt den Fortschritt der Handys entgegen und liefert ihn an die Lehrerseite.
//   POST /fortschritt   (Handy)          {raum, uebung, geraet, name, geloest, gesamt, erster, falsch}
//   GET  /stand?raum=k2-ab1              (Lehrerseite)
//   POST /entfernen     {raum, id}       (Lehrerseite: einen Namen entfernen)
//   POST /leeren        {raum}           (Lehrerseite: neue Stunde)
// Raum = Klasse + Arbeitsblatt, z. B. k2-ab1 (k1 = 3BFP2/1, k2 = 3BFP2/2).
// Auf Wunsch ohne Lehrer-Kennwort: Die Lehrerseiten sind über ihre Adresse erreichbar.
// Pro Raum gibt es ein Durable Object, das die Daten hält.

import { pruefeEintrag, pruefeRaum, aufraeumen, eintragen, stand, entfernen } from './logik.js';

const KOPF = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const MAX_BYTES = 4096;

function antwort(status, daten) {
  if (daten === undefined) return new Response(null, { status, headers: KOPF });
  return new Response(JSON.stringify(daten), { status, headers: { ...KOPF, 'Content-Type': 'application/json; charset=utf-8' } });
}

async function leseJson(request) {
  const text = await request.text();
  if (text.length > MAX_BYTES) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

function raumStub(env, raum) {
  return env.RAUM.get(env.RAUM.idFromName(raum));
}

async function anRaum(env, raum, aktion, nutzlast) {
  const r = await raumStub(env, raum).fetch('https://raum/' + aktion, {
    method: 'POST', body: JSON.stringify(nutzlast || {})
  });
  return r;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return antwort(204);

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('Fortschrittsanzeige KB II – Notfallsituationen: läuft.', { headers: { ...KOPF, 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    if (request.method === 'POST' && url.pathname === '/fortschritt') {
      const d = await leseJson(request);
      const p = pruefeEintrag(d);
      if (p.fehler) return antwort(400, { fehler: p.fehler });
      const r = await anRaum(env, p.eintrag.raum, 'eintragen', p.eintrag);
      return antwort(r.status === 200 ? 204 : 429);
    }

    if (request.method === 'GET' && url.pathname === '/stand') {
      const raum = url.searchParams.get('raum');
      if (!pruefeRaum(raum)) return antwort(400, { fehler: 'raum' });
      const r = await anRaum(env, raum, 'stand');
      return antwort(200, await r.json());
    }

    if (request.method === 'POST' && (url.pathname === '/leeren' || url.pathname === '/entfernen')) {
      const d = await leseJson(request);
      if (!d || !pruefeRaum(d.raum)) return antwort(400, { fehler: 'raum' });
      if (url.pathname === '/entfernen' && (typeof d.id !== 'string' || !/^[a-z0-9]{4,16}$/.test(d.id))) {
        return antwort(400, { fehler: 'id' });
      }
      await anRaum(env, d.raum, url.pathname.slice(1), { id: d.id });
      return antwort(204);
    }

    return antwort(404, { fehler: 'unbekannt' });
  }
};

// Ein Raum pro Klasse und Arbeitsblatt. Hält die Daten im Speicher und sichert sie im Durable-Object-Speicher.
export class Raum {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.daten = null;
  }

  async lade() {
    if (this.daten === null) this.daten = (await this.state.storage.get('daten')) || {};
    return this.daten;
  }

  async sichere() {
    await this.state.storage.put('daten', this.daten);
  }

  async fetch(request) {
    const aktion = new URL(request.url).pathname.slice(1);
    const nutzlast = await request.json();
    const jetzt = Date.now();
    const daten = await this.lade();
    let geaendert = aufraeumen(daten, jetzt);
    let status = 200;
    let ergebnis = {};

    if (aktion === 'eintragen') {
      const ok = eintragen(daten, nutzlast, jetzt, () => crypto.randomUUID().replace(/-/g, '').slice(0, 10));
      if (ok) geaendert = true; else status = 429;
    } else if (aktion === 'stand') {
      ergebnis = stand(daten, jetzt);
    } else if (aktion === 'entfernen') {
      if (entfernen(daten, nutzlast.id)) geaendert = true;
    } else if (aktion === 'leeren') {
      for (const g of Object.keys(daten)) delete daten[g];
      geaendert = true;
    } else {
      status = 404;
    }
    if (geaendert) await this.sichere();
    return new Response(JSON.stringify(ergebnis), { status, headers: { 'Content-Type': 'application/json' } });
  }
}

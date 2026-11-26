// Cloudflare Worker: nimmt den Fortschritt der Handys entgegen und liefert ihn an die Lehrerseite.
//   POST /fortschritt   (Handy)          {raum, uebung, geraet, name, geloest, gesamt, erster, falsch}
//   GET  /stand?raum=k2-ab1              (Lehrerseite)
//   POST /spiel         (Handy)          {raum, geraet, punkte}  Bestleistung im Belohnungsspiel
//   POST /entfernen     {raum, id}       (Lehrerseite: einen Namen entfernen)
//   POST /leeren        {raum}           (Lehrerseite: neue Stunde)
//   POST /challenge     (Handy)          {raum, geraet, name, richtig, gesamt, dauer}  Wochen-Challenge (Punkte rechnet der Server)
//   POST /challenge-entfernen {raum, id} · POST /challenge-leeren {raum}   (Lehrerseite: Bestenliste)
//   GET  /stand liefert zusätzlich challenge: [{id, name, punkte, richtig, gesamt, dauer, runden}] (bis zu 10 Tage)
// Raum = Klasse + Arbeitsblatt, z. B. k2-ab1 (k1 = 3BFP2/1, k2 = 3BFP2/2).
// Auf Wunsch ohne Lehrer-Kennwort: Die Lehrerseiten sind über ihre Adresse erreichbar.
// Pro Raum gibt es ein Durable Object, das die Daten hält.
//
// Fall-Einführung „Zeitlupe“ (fall.html), Raum = Klasse + '-fall', z. B. k2-fall:
//   GET  /fall/zustand?raum=k2-fall      (Handy, alle paar Sekunden: welcher Schritt ist dran?)
//   GET  /fall/stand?raum=k2-fall        (Lehrerseite)
//   POST /fall/antwort  {raum, geraet, name, frage, wert}            (Handy)
//   POST /fall/text     {raum, geraet, name, art, person, a, b}      (Handy: Perspektive oder Begriff)
//   POST /fall/steuern  {raum, schritt, stufe, durchgang, lesen}     (Lehrerseite: Weiter/Zurück, Vorlesen {abschnitt, person})
//   POST /fall/text-weg {raum, id} · /fall/kb {raum, id, kb} · /fall/entfernen {raum, id}
//   POST /fall/leeren {raum} · /fall/sichern {raum} · /fall/archiv-loeschen {raum, durchgang}
//   POST /fall/gruppen  {raum, zuordnung: {kurzId: gruppe}, ersetzen?}  (Lehrerseite: Perspektiven-Gruppen)
//   GET  /fall/zustand?raum=…&geraet=…  liefert dem Handy zusätzlich seine Gruppe und deren Namen

import {
  pruefeEintrag, pruefeRaum, pruefeSpiel, aufraeumen, eintragen, spielEintragen, stand, entfernen,
  pruefeChallenge, challengeEintragen, challengeAufraeumen, challengeStand, challengeEntfernen
} from './logik.js';
import {
  pruefeFallRaum, pruefeId, pruefeAntwort, pruefeText, pruefeSteuerung, pruefeKb, DURCHGAENGE,
  leererFall, fallAufraeumen, fallLeeren, antwortEintragen, textEintragen, textEntfernen, begriffEntfernen, textKb,
  personEntfernen, steuern, zustand, fallStand, schnappschuss, pruefeGruppen, gruppenSetzen
} from './fall.js';

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

    if (request.method === 'POST' && url.pathname === '/spiel') {
      const d = await leseJson(request);
      const p = pruefeSpiel(d);
      if (p.fehler) return antwort(400, { fehler: p.fehler });
      const r = await anRaum(env, p.eintrag.raum, 'spiel', p.eintrag);
      return r.status === 200 ? antwort(204) : antwort(404, { fehler: 'nicht auf der Liste' });
    }

    if (request.method === 'POST' && url.pathname === '/challenge') {
      const d = await leseJson(request);
      const p = pruefeChallenge(d);
      if (p.fehler) return antwort(400, { fehler: p.fehler });
      const r = await anRaum(env, p.eintrag.raum, 'challenge', p.eintrag);
      return antwort(r.status === 200 ? 204 : 429);
    }

    if (request.method === 'POST' && (url.pathname === '/challenge-leeren' || url.pathname === '/challenge-entfernen')) {
      const d = await leseJson(request);
      if (!d || !pruefeRaum(d.raum)) return antwort(400, { fehler: 'raum' });
      if (url.pathname === '/challenge-entfernen' && (typeof d.id !== 'string' || !/^[a-z0-9]{4,16}$/.test(d.id))) {
        return antwort(400, { fehler: 'id' });
      }
      await anRaum(env, d.raum, url.pathname.slice(1), { id: d.id });
      return antwort(204);
    }

    if (request.method === 'GET' && url.pathname === '/stand') {
      const raum = url.searchParams.get('raum');
      if (!pruefeRaum(raum)) return antwort(400, { fehler: 'raum' });
      const r = await anRaum(env, raum, 'stand');
      return antwort(200, await r.json());
    }

    if (url.pathname.startsWith('/fall/')) return fallAnfrage(request, env, url);

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

// ---------- Fall-Einführung „Zeitlupe“ ----------
async function fallAnfrage(request, env, url) {
  const aktion = url.pathname.slice('/fall/'.length);
  if (request.method === 'GET' && (aktion === 'zustand' || aktion === 'stand')) {
    const raum = url.searchParams.get('raum');
    if (!pruefeFallRaum(raum)) return antwort(400, { fehler: 'raum' });
    const geraet = url.searchParams.get('geraet');
    const r = await anRaum(env, raum, 'fall-' + aktion, aktion === 'zustand' && geraet && /^[a-f0-9]{16,64}$/.test(geraet) ? { geraet } : {});
    return antwort(200, await r.json());
  }
  if (request.method !== 'POST') return antwort(404, { fehler: 'unbekannt' });
  const d = await leseJson(request);
  let nutzlast = null;
  if (aktion === 'antwort') {
    const p = pruefeAntwort(d);
    if (p.fehler) return antwort(400, { fehler: p.fehler });
    nutzlast = p.eintrag;
  } else if (aktion === 'text') {
    const p = pruefeText(d);
    if (p.fehler) return antwort(400, { fehler: p.fehler });
    nutzlast = p.eintrag;
  } else if (aktion === 'steuern') {
    const p = pruefeSteuerung(d);
    if (p.fehler) return antwort(400, { fehler: p.fehler });
    nutzlast = Object.assign({ raum: d.raum }, p.eintrag);
  } else if (aktion === 'text-weg' || aktion === 'entfernen' || aktion === 'kb') {
    if (!d || !pruefeFallRaum(d.raum)) return antwort(400, { fehler: 'raum' });
    if (!pruefeId(d.id)) return antwort(400, { fehler: 'id' });
    if (aktion === 'kb' && !pruefeKb(d.kb)) return antwort(400, { fehler: 'kb' });
    nutzlast = { raum: d.raum, id: d.id, kb: d.kb };
  } else if (aktion === 'gruppen') {
    const p = pruefeGruppen(d);
    if (p.fehler) return antwort(400, { fehler: p.fehler });
    nutzlast = p.eintrag;
  } else if (aktion === 'leeren' || aktion === 'sichern' || aktion === 'archiv-loeschen') {
    if (!d || !pruefeFallRaum(d.raum)) return antwort(400, { fehler: 'raum' });
    if (aktion === 'archiv-loeschen' && DURCHGAENGE.indexOf(d.durchgang) < 0) return antwort(400, { fehler: 'durchgang' });
    nutzlast = { raum: d.raum, durchgang: d.durchgang };
  } else {
    return antwort(404, { fehler: 'unbekannt' });
  }
  const r = await anRaum(env, nutzlast.raum, 'fall-' + aktion, nutzlast);
  if (r.status === 200) return antwort(204);
  return antwort(r.status === 404 ? 404 : 429, { fehler: r.status === 404 ? 'nicht gefunden' : 'voll' });
}

// Ein Raum pro Klasse und Arbeitsblatt. Hält die Daten im Speicher und sichert sie im Durable-Object-Speicher.
export class Raum {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.daten = null;
    this.challenge = null; // Wochen-Challenge: beste Ergebnisse je Handy (bis zu 10 Tage)
    this.fall = null;     // Fall-Einführung: Steuerung, Namen, Antworten, Texte (12 Stunden)
    this.archiv = null;   // Fall-Einführung: gesicherte Ergebnisse ohne Namen (dauerhaft)
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
    if (aktion.startsWith('fall-')) return this.fallAktion(aktion.slice(5), nutzlast, jetzt);
    const daten = await this.lade();
    if (this.challenge === null) this.challenge = (await this.state.storage.get('challenge')) || {};
    let geaendert = aufraeumen(daten, jetzt);
    let chGeaendert = challengeAufraeumen(this.challenge, jetzt);
    let status = 200;
    let ergebnis = {};

    if (aktion === 'eintragen') {
      const ok = eintragen(daten, nutzlast, jetzt, () => crypto.randomUUID().replace(/-/g, '').slice(0, 10));
      if (ok) geaendert = true; else status = 429;
    } else if (aktion === 'spiel') {
      if (spielEintragen(daten, nutzlast, jetzt)) geaendert = true; else status = 404;
    } else if (aktion === 'stand') {
      ergebnis = stand(daten, jetzt);
      ergebnis.challenge = challengeStand(this.challenge);
    } else if (aktion === 'challenge') {
      if (challengeEintragen(this.challenge, nutzlast, jetzt, () => crypto.randomUUID().replace(/-/g, '').slice(0, 10))) chGeaendert = true; else status = 429;
    } else if (aktion === 'challenge-entfernen') {
      if (challengeEntfernen(this.challenge, nutzlast.id)) chGeaendert = true;
    } else if (aktion === 'challenge-leeren') {
      this.challenge = {};
      chGeaendert = true;
    } else if (aktion === 'entfernen') {
      if (entfernen(daten, nutzlast.id)) geaendert = true;
    } else if (aktion === 'leeren') {
      for (const g of Object.keys(daten)) delete daten[g];
      geaendert = true;
    } else {
      status = 404;
    }
    if (geaendert) await this.sichere();
    if (chGeaendert) await this.state.storage.put('challenge', this.challenge);
    return new Response(JSON.stringify(ergebnis), { status, headers: { 'Content-Type': 'application/json' } });
  }

  async fallAktion(aktion, nutzlast, jetzt) {
    const kurzId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    if (this.fall === null) this.fall = (await this.state.storage.get('fall')) || leererFall(kurzId);
    if (this.archiv === null) this.archiv = (await this.state.storage.get('fallArchiv')) || {};
    const f = this.fall;
    let geaendert = fallAufraeumen(f, jetzt, kurzId);
    let archivGeaendert = false;
    let status = 200;
    let ergebnis = {};

    if (aktion === 'zustand') {
      ergebnis = zustand(f, nutzlast && nutzlast.geraet);
    } else if (aktion === 'stand') {
      ergebnis = fallStand(f, this.archiv, jetzt);
    } else if (aktion === 'antwort') {
      if (antwortEintragen(f, nutzlast, jetzt, kurzId)) geaendert = true; else status = 429;
    } else if (aktion === 'text') {
      if (textEintragen(f, nutzlast, jetzt, kurzId)) geaendert = true; else status = 429;
    } else if (aktion === 'steuern') {
      steuern(f, nutzlast, jetzt, kurzId);
      geaendert = true;
    } else if (aktion === 'text-weg') {
      if (begriffEntfernen(f, nutzlast.id)) geaendert = true;
    } else if (aktion === 'kb') {
      if (textKb(f, nutzlast.id, nutzlast.kb)) geaendert = true; else status = 404;
    } else if (aktion === 'entfernen') {
      if (personEntfernen(f, nutzlast.id)) geaendert = true;
    } else if (aktion === 'leeren') {
      fallLeeren(f, kurzId);
      geaendert = true;
    } else if (aktion === 'gruppen') {
      gruppenSetzen(f, nutzlast);
      geaendert = true;
    } else if (aktion === 'sichern') {
      this.archiv[f.steuerung.durchgang] = schnappschuss(f, jetzt);
      archivGeaendert = true;
    } else if (aktion === 'archiv-loeschen') {
      delete this.archiv[nutzlast.durchgang];
      archivGeaendert = true;
    } else {
      status = 404;
    }
    if (geaendert) await this.state.storage.put('fall', f);
    if (archivGeaendert) await this.state.storage.put('fallArchiv', this.archiv);
    return new Response(JSON.stringify(ergebnis), { status, headers: { 'Content-Type': 'application/json' } });
  }
}

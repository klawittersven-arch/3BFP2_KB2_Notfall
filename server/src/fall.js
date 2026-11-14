// Fall-Einführung „Zeitlupe“ (fall.html): reine Logik ohne Cloudflare-Abhängigkeiten – lokal mit Node testbar.
// Die Lehrerseite steuert, welcher Schritt gerade dran ist; die Handys fragen das regelmäßig ab und
// schicken ihre Antworten (Ampel, Auswahl) und Texte (Perspektiven, Begriffsparkplatz).
// Mit „Ergebnis sichern“ wird eine Zusammenfassung OHNE Namen dauerhaft gespeichert (für den Vergleich in SW 13).

import { AUFBEWAHRUNG_MS, MAX_GERAETE } from './logik.js';

export const MAX_FRAGEN_JE_GERAET = 30;
export const MAX_TEXTE = 300;
export const MAX_TEXTE_JE_GERAET = 15;
export const MAX_TEXT = 200;      // Zeichen je Feld (Perspektive)
export const MAX_BEGRIFF = 40;    // Zeichen (Begriffsparkplatz)
export const MAX_SCHRITT = 40;
export const MAX_LESEABSCHNITT = 40;
export const DURCHGAENGE = ['einf', 'sw13'];

const FALL_RAUM = /^k[1-9]-fall$/;
const FRAGE = /^[a-z0-9]{1,12}$/;
const CODE = /^[A-Z0-9]{1,6}$/;
const GERAET = /^[a-f0-9]{16,64}$/;
const NAME = /^\p{L}[\p{L}' .-]{0,22}\p{L}\.?$/u;
const PERSON = /^[a-z0-9]{1,12}$/;
const KB = ['', 'I', 'II', 'III', 'IV', 'V'];
const ID = /^[a-z0-9]{4,16}$/;

export function pruefeFallRaum(raum) {
  return typeof raum === 'string' && FALL_RAUM.test(raum);
}
export function pruefeId(id) {
  return typeof id === 'string' && ID.test(id);
}

function neueSitzung(kurzId) { return kurzId(); }

export function leererFall(kurzId) {
  return { steuerung: { schritt: 0, stufe: 0, durchgang: 'einf', sitzung: neueSitzung(kurzId) }, leute: {}, antworten: {}, texte: [], t: 0 };
}

// Text säubern: Steuerzeichen raus, Leerraum zusammenfassen
function saeubere(s, max) {
  if (typeof s !== 'string') return null;
  const t = s.replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? null : t;
}

function pruefePerson(d) {
  if (!d || typeof d !== 'object') return 'keine Daten';
  if (!pruefeFallRaum(d.raum)) return 'raum';
  if (typeof d.geraet !== 'string' || !GERAET.test(d.geraet)) return 'geraet';
  const name = typeof d.name === 'string' ? d.name.replace(/\s+/g, ' ').trim() : '';
  if (name.length < 3 || name.length > 24 || !NAME.test(name)) return 'name';
  return null;
}

// Antwort vom Handy: {raum, geraet, name, frage, wert}; wert = Kürzel ('R') oder Liste von Kürzeln (['STURZ','THROMB'])
export function pruefeAntwort(d) {
  const f = pruefePerson(d);
  if (f) return { fehler: f };
  if (typeof d.frage !== 'string' || !FRAGE.test(d.frage)) return { fehler: 'frage' };
  let wert = d.wert;
  if (Array.isArray(wert)) {
    if (wert.length > 12 || !wert.every((x) => typeof x === 'string' && CODE.test(x))) return { fehler: 'wert' };
    wert = [...new Set(wert)];
  } else if (typeof wert !== 'string' || !CODE.test(wert)) {
    return { fehler: 'wert' };
  }
  return { eintrag: { raum: d.raum, geraet: d.geraet, name: d.name.replace(/\s+/g, ' ').trim(), frage: d.frage, wert } };
}

// Text vom Handy: Perspektive {art:'persp', person, a, b} oder Begriff {art:'begriff', a}
export function pruefeText(d) {
  const f = pruefePerson(d);
  if (f) return { fehler: f };
  const name = d.name.replace(/\s+/g, ' ').trim();
  if (d.art === 'persp') {
    if (typeof d.person !== 'string' || !PERSON.test(d.person)) return { fehler: 'person' };
    const a = saeubere(d.a === undefined ? '' : d.a, MAX_TEXT);
    const b = saeubere(d.b === undefined ? '' : d.b, MAX_TEXT);
    if (a === null || b === null) return { fehler: 'text' };
    if (!a && !b) return { fehler: 'leer' };
    return { eintrag: { raum: d.raum, geraet: d.geraet, name, art: 'persp', person: d.person, a, b } };
  }
  if (d.art === 'begriff') {
    const a = saeubere(d.a, MAX_BEGRIFF);
    if (!a) return { fehler: 'text' };
    return { eintrag: { raum: d.raum, geraet: d.geraet, name, art: 'begriff', person: '', a, b: '' } };
  }
  return { fehler: 'art' };
}

// Steuerung von der Lehrerseite: {raum, schritt, stufe, durchgang}
export function pruefeSteuerung(d) {
  if (!d || typeof d !== 'object' || !pruefeFallRaum(d.raum)) return { fehler: 'raum' };
  if (!Number.isInteger(d.schritt) || d.schritt < 0 || d.schritt > MAX_SCHRITT) return { fehler: 'schritt' };
  if (!Number.isInteger(d.stufe) || d.stufe < 0 || d.stufe > 3) return { fehler: 'stufe' };
  if (d.durchgang !== undefined && DURCHGAENGE.indexOf(d.durchgang) < 0) return { fehler: 'durchgang' };
  // Vorlesen (optional): welcher Abschnitt gerade gelesen wird und von wem (kurzId der Person, '' = niemand bestimmt)
  let lesen = null;
  if (d.lesen !== undefined && d.lesen !== null) {
    const l = d.lesen;
    if (typeof l !== 'object' || !Number.isInteger(l.abschnitt) || l.abschnitt < 0 || l.abschnitt > MAX_LESEABSCHNITT ||
      (l.person !== '' && !pruefeId(l.person))) return { fehler: 'lesen' };
    lesen = { abschnitt: l.abschnitt, person: l.person };
  }
  return { eintrag: { schritt: d.schritt, stufe: d.stufe, durchgang: d.durchgang, lesen } };
}

export function pruefeKb(kb) { return typeof kb === 'string' && KB.indexOf(kb) >= 0; }

// Nach 12 Stunden ohne Aktivität: Namen, Antworten und Texte löschen (die gesicherten Ergebnisse bleiben).
export function fallAufraeumen(f, jetzt, kurzId) {
  if (f.t && jetzt - f.t > AUFBEWAHRUNG_MS) { fallLeeren(f, kurzId); f.t = 0; return true; }
  return false;
}

export function fallLeeren(f, kurzId) {
  f.leute = {};
  f.antworten = {};
  f.texte = [];
  f.gruppen = {};
  f.steuerung.schritt = 0;
  f.steuerung.stufe = 0;
  f.steuerung.sitzung = neueSitzung(kurzId);
}

function anmelden(f, e, jetzt, kurzId) {
  let p = f.leute[e.geraet];
  if (!p) {
    if (Object.keys(f.leute).length >= MAX_GERAETE) return null;
    p = f.leute[e.geraet] = { id: kurzId(), name: e.name, t: jetzt };
  }
  p.name = e.name;
  p.t = jetzt;
  f.t = jetzt;
  return p;
}

// Eine leere Liste zieht die Antwort zurück (die Handys senden automatisch; wird eine Auswahl wieder
// unvollständig, z. B. nur 2 von 3, zählt sie nicht mehr).
export function antwortEintragen(f, e, jetzt, kurzId) {
  const a = f.antworten[e.geraet] || {};
  const zurueck = Array.isArray(e.wert) && e.wert.length === 0;
  if (!zurueck && a[e.frage] === undefined && Object.keys(a).length >= MAX_FRAGEN_JE_GERAET) return false;
  if (!anmelden(f, e, jetzt, kurzId)) return false;
  if (zurueck) delete a[e.frage]; else a[e.frage] = e.wert;
  f.antworten[e.geraet] = a;
  return true;
}

export function textEintragen(f, e, jetzt, kurzId) {
  if (f.texte.length >= MAX_TEXTE) return null;
  if (f.texte.filter((x) => x.geraet === e.geraet).length >= MAX_TEXTE_JE_GERAET) return null;
  if (!anmelden(f, e, jetzt, kurzId)) return null;
  const t = { id: kurzId(), geraet: e.geraet, art: e.art, person: e.person, a: e.a, b: e.b, kb: '', t: jetzt };
  f.texte.push(t);
  return t.id;
}

export function textEntfernen(f, id) {
  const vorher = f.texte.length;
  f.texte = f.texte.filter((x) => x.id !== id);
  return f.texte.length !== vorher;
}

// Begriffsparkplatz: ein Wort entfernen = alle gleichen Einträge (Groß-/Kleinschreibung egal) entfernen
export function begriffEntfernen(f, id) {
  const t = f.texte.filter((x) => x.id === id)[0];
  if (!t) return false;
  if (t.art !== 'begriff') return textEntfernen(f, id);
  const w = t.a.toLowerCase();
  f.texte = f.texte.filter((x) => !(x.art === 'begriff' && x.a.toLowerCase() === w));
  return true;
}

export function textKb(f, id, kb) {
  const t = f.texte.filter((x) => x.id === id)[0];
  if (!t) return false;
  t.kb = kb;
  return true;
}

export function personEntfernen(f, id) {
  for (const g of Object.keys(f.leute)) {
    if (f.leute[g].id === id) {
      delete f.leute[g];
      delete f.antworten[g];
      if (f.gruppen) delete f.gruppen[g];
      f.texte = f.texte.filter((x) => x.geraet !== g);
      return true;
    }
  }
  return false;
}

// Neuer Durchgang (Einführung ↔ SW 13) beginnt immer mit einer leeren Liste.
export function steuern(f, s, jetzt, kurzId) {
  if (s.durchgang && s.durchgang !== f.steuerung.durchgang) {
    f.steuerung.durchgang = s.durchgang;
    fallLeeren(f, kurzId);
  }
  f.steuerung.schritt = s.schritt;
  f.steuerung.stufe = s.stufe;
  f.steuerung.lesen = s.lesen || null;
  f.t = jetzt;
}

// Für die Handys: nur, welcher Schritt dran ist (klein, wird alle paar Sekunden abgefragt).
export function zustand(f, geraet) {
  const s = f.steuerung;
  const z = { schritt: s.schritt, stufe: s.stufe, durchgang: s.durchgang, sitzung: s.sitzung };
  // Vorlesen: ein Handy erfährt nur, welcher Abschnitt dran ist und ob es selbst vorliest
  if (s.lesen) {
    z.lesen = { abschnitt: s.lesen.abschnitt, ich: !!(geraet && s.lesen.person && f.leute[geraet] && f.leute[geraet].id === s.lesen.person) };
  }
  // Perspektiven-Runde: Gruppe dieses Handys und die Namen der Gruppe (damit sich die Gruppe findet)
  const gr = geraet && f.gruppen ? f.gruppen[geraet] : null;
  if (gr && f.leute[geraet]) {
    z.gruppe = gr;
    z.mitglieder = Object.keys(f.gruppen).filter((g) => f.gruppen[g] === gr && f.leute[g]).map((g) => f.leute[g].name).sort();
  }
  return z;
}

// Gruppen für die Perspektiven-Runde (von der Lehrerseite): {kurzId der Person: Gruppe} – '' nimmt aus der Gruppe.
// ersetzen = true: alle bisherigen Zuordnungen verwerfen (neu einteilen).
export function pruefeGruppen(d) {
  if (!d || typeof d !== 'object' || !pruefeFallRaum(d.raum)) return { fehler: 'raum' };
  const z = d.zuordnung;
  if (!z || typeof z !== 'object' || Array.isArray(z)) return { fehler: 'zuordnung' };
  const keys = Object.keys(z);
  if (keys.length > MAX_GERAETE) return { fehler: 'zuordnung' };
  for (const k of keys) {
    if (!ID.test(k) || typeof z[k] !== 'string' || (z[k] !== '' && !PERSON.test(z[k]))) return { fehler: 'zuordnung' };
  }
  return { eintrag: { raum: d.raum, zuordnung: z, ersetzen: d.ersetzen === true } };
}
export function gruppenSetzen(f, e) {
  if (!f.gruppen || e.ersetzen) f.gruppen = {};
  const geraetVon = {};
  for (const g of Object.keys(f.leute)) geraetVon[f.leute[g].id] = g;
  let n = 0;
  for (const id of Object.keys(e.zuordnung)) {
    const g = geraetVon[id];
    if (!g) continue;
    if (e.zuordnung[id]) f.gruppen[g] = e.zuordnung[id]; else delete f.gruppen[g];
    n++;
  }
  return n;
}

// Antworten zusammenzählen: { frage: { kuerzel: anzahl } } und { frage: anzahl Personen }
export function auswerten(f) {
  const ergebnisse = {}, anzahl = {};
  for (const g of Object.keys(f.antworten)) {
    if (!f.leute[g]) continue;
    const a = f.antworten[g];
    for (const frage of Object.keys(a)) {
      const e = ergebnisse[frage] = ergebnisse[frage] || {};
      anzahl[frage] = (anzahl[frage] || 0) + 1;
      (Array.isArray(a[frage]) ? a[frage] : [a[frage]]).forEach((k) => { e[k] = (e[k] || 0) + 1; });
    }
  }
  return { ergebnisse, anzahl };
}

// Für die Lehrerseite: Namen (mit den Fragen, die sie schon beantwortet haben), zusammengezählte Antworten
// (nicht je Person), Texte ohne Namen und die gesicherten Ergebnisse.
export function fallStand(f, archiv, jetzt) {
  const { ergebnisse, anzahl } = auswerten(f);
  return {
    jetzt,
    // die Lehrerseite bekommt beim Vorlesen auch die Person (nach dem Neuladen der Seite)
    steuerung: Object.assign(zustand(f), f.steuerung.lesen ? { lesen: { abschnitt: f.steuerung.lesen.abschnitt, person: f.steuerung.lesen.person } } : {}),
    leute: Object.keys(f.leute).map((g) => ({
      id: f.leute[g].id, name: f.leute[g].name, t: f.leute[g].t,
      beantwortet: Object.keys(f.antworten[g] || {}),
      gruppe: (f.gruppen && f.gruppen[g]) || '',
      // Wie viele Perspektiven-Einträge diese Person geschickt hat (nur die Zahl – die Texte bleiben ohne Namen)
      eintraege: f.texte.filter((x) => x.geraet === g && x.art === 'persp').length
    })),
    ergebnisse, anzahl,
    texte: f.texte.map((x) => ({ id: x.id, art: x.art, person: x.person, a: x.a, b: x.b, kb: x.kb, t: x.t })),
    archiv: archiv || {}
  };
}

// Zusammenfassung ohne Namen und ohne Geräte-Kennungen – bleibt dauerhaft (bis zum Überschreiben/Löschen).
export function schnappschuss(f, jetzt) {
  const { ergebnisse, anzahl } = auswerten(f);
  return {
    t: jetzt,
    teilnehmende: Object.keys(f.leute).length,
    ergebnisse, anzahl,
    texte: f.texte.map((x) => ({ art: x.art, person: x.person, a: x.a, b: x.b, kb: x.kb }))
  };
}

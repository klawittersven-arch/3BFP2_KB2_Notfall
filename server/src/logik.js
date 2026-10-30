// Reine Logik (ohne Cloudflare-Abhängigkeiten) – so lässt sie sich auch lokal mit Node testen.

export const AUFBEWAHRUNG_MS = 12 * 60 * 60 * 1000; // nach 12 Stunden ohne Aktivität löschen
export const MAX_GERAETE = 120;
export const MAX_UEBUNGEN = 12;

// Raum = Klasse + Arbeitsblatt, z. B. 'k2-ab1' (k1 = 3BFP2/1, k2 = 3BFP2/2)
const RAUM = /^k[1-9]-ab[1-9]$/;
const UEBUNG = /^[a-z0-9]{1,12}$/;
const GERAET = /^[a-f0-9]{16,64}$/;
const NAME = /^\p{L}[\p{L}' .-]{0,22}\p{L}\.?$/u;
const FALSCH = /^\d{1,3}-[A-Z]{1,6}$/; // Kartennummer und zuerst gewählte falsche Antwort, z. B. "2-F"

function ganzzahl(x, min, max) {
  return Number.isInteger(x) && x >= min && x <= max;
}

export function pruefeRaum(raum) {
  return typeof raum === 'string' && RAUM.test(raum);
}

// Prüft einen Fortschritts-Eintrag vom Handy. Gibt { fehler } oder { eintrag } zurück.
export function pruefeEintrag(d) {
  if (!d || typeof d !== 'object') return { fehler: 'keine Daten' };
  if (!pruefeRaum(d.raum)) return { fehler: 'raum' };
  if (typeof d.uebung !== 'string' || !UEBUNG.test(d.uebung)) return { fehler: 'uebung' };
  if (typeof d.geraet !== 'string' || !GERAET.test(d.geraet)) return { fehler: 'geraet' };
  const name = typeof d.name === 'string' ? d.name.replace(/\s+/g, ' ').trim() : '';
  if (name.length < 3 || name.length > 24 || !NAME.test(name)) return { fehler: 'name' };
  if (!ganzzahl(d.gesamt, 1, 100) || !ganzzahl(d.geloest, 0, d.gesamt) || !ganzzahl(d.erster, 0, d.gesamt)) {
    return { fehler: 'zahlen' };
  }
  const falsch = Array.isArray(d.falsch) ? d.falsch : [];
  if (falsch.length > 50 || !falsch.every((x) => typeof x === 'string' && FALSCH.test(x))) return { fehler: 'falsch' };
  return {
    eintrag: {
      raum: d.raum, uebung: d.uebung, geraet: d.geraet, name,
      geloest: d.geloest, gesamt: d.gesamt, erster: d.erster, falsch: [...new Set(falsch)]
    }
  };
}

// Entfernt Einträge, die älter als die Aufbewahrungszeit sind. Gibt true zurück, wenn sich etwas geändert hat.
export function aufraeumen(daten, jetzt) {
  let geaendert = false;
  for (const g of Object.keys(daten)) {
    if (!daten[g] || jetzt - daten[g].t > AUFBEWAHRUNG_MS) { delete daten[g]; geaendert = true; }
  }
  return geaendert;
}

// Trägt einen geprüften Eintrag ein. kurzId() liefert eine zufällige Kennung für die Lehreransicht.
export function eintragen(daten, e, jetzt, kurzId) {
  let p = daten[e.geraet];
  if (!p) {
    if (Object.keys(daten).length >= MAX_GERAETE) return false;
    p = daten[e.geraet] = { id: kurzId(), name: e.name, t: jetzt, uebungen: {} };
  }
  if (!p.uebungen[e.uebung] && Object.keys(p.uebungen).length >= MAX_UEBUNGEN) return false;
  p.name = e.name;
  p.t = jetzt;
  p.uebungen[e.uebung] = { geloest: e.geloest, gesamt: e.gesamt, erster: e.erster, falsch: e.falsch, t: jetzt };
  return true;
}

// Stand für die Lehreransicht – ohne Geräte-Kennungen der Handys.
export function stand(daten, jetzt) {
  return {
    jetzt,
    eintraege: Object.values(daten).map((p) => ({ id: p.id, name: p.name, t: p.t, uebungen: p.uebungen }))
  };
}

export function entfernen(daten, id) {
  for (const g of Object.keys(daten)) {
    if (daten[g].id === id) { delete daten[g]; return true; }
  }
  return false;
}

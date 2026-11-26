// Reine Logik (ohne Cloudflare-Abhängigkeiten) – so lässt sie sich auch lokal mit Node testen.

export const AUFBEWAHRUNG_MS = 12 * 60 * 60 * 1000; // nach 12 Stunden ohne Aktivität löschen
export const MAX_GERAETE = 120;
export const MAX_UEBUNGEN = 12;
export const MAX_PUNKTE = 1000000; // Belohnungsspiel: höchste mögliche Punktzahl (Schutz vor Unsinn)
// Wochen-Challenge: Name und Punkte bleiben bis zur Siegerehrung in der nächsten Stunde (höchstens 10 Tage).
export const CHALLENGE_AUFBEWAHRUNG_MS = 10 * 24 * 60 * 60 * 1000;
export const MAX_CHALLENGE = 150;

// Raum = Klasse + Arbeitsblatt bzw. Woche, z. B. 'k2-ab1' (k1 = 3BFP2/1, k2 = 3BFP2/2).
// Ab KW 49 (TB 2 neu) je Fach und Woche: 'k1-kb1w1' … 'k2-kb2w4' – auch die KB-I-Übungen (Repository 3BFP2-kb1-notfall, Ordner docs/tb2) melden hierher.
const RAUM = /^k[1-9]-(ab[1-9]|kb[12]w[1-9])$/;
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
  const neu = d.neu === undefined ? 0 : d.neu; // Neustarts wegen zu schneller Fehler
  if (!ganzzahl(neu, 0, 99)) return { fehler: 'neu' };
  const falsch = Array.isArray(d.falsch) ? d.falsch : [];
  if (falsch.length > 50 || !falsch.every((x) => typeof x === 'string' && FALSCH.test(x))) return { fehler: 'falsch' };
  const sterne = d.sterne === undefined ? 0 : d.sterne; // beste Wertung der Übung (1–3), 0 = noch keine
  if (!ganzzahl(sterne, 0, 3)) return { fehler: 'sterne' };
  return {
    eintrag: {
      raum: d.raum, uebung: d.uebung, geraet: d.geraet, name,
      geloest: d.geloest, gesamt: d.gesamt, erster: d.erster, neu, falsch: [...new Set(falsch)], sterne
    }
  };
}

// Prüft eine Bestleistung aus dem Belohnungsspiel. Gibt { fehler } oder { eintrag } zurück.
export function pruefeSpiel(d) {
  if (!d || typeof d !== 'object') return { fehler: 'keine Daten' };
  if (!pruefeRaum(d.raum)) return { fehler: 'raum' };
  if (typeof d.geraet !== 'string' || !GERAET.test(d.geraet)) return { fehler: 'geraet' };
  if (!ganzzahl(d.punkte, 1, MAX_PUNKTE)) return { fehler: 'punkte' };
  return { eintrag: { raum: d.raum, geraet: d.geraet, punkte: d.punkte } };
}

// Trägt die Bestleistung beim Namen ein – nur, wenn das Handy schon auf der Liste steht
// (also die Übung bearbeitet hat). Höhere Werte ersetzen niedrigere. Gibt false zurück, wenn unbekannt.
export function spielEintragen(daten, e, jetzt) {
  const p = daten[e.geraet];
  if (!p) return false;
  if (!p.spiel || e.punkte > p.spiel.punkte) p.spiel = { punkte: e.punkte, t: jetzt };
  p.t = jetzt;
  return true;
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
  p.uebungen[e.uebung] = { geloest: e.geloest, gesamt: e.gesamt, erster: e.erster, neu: e.neu || 0, falsch: e.falsch, t: jetzt };
  if (e.sterne) p.uebungen[e.uebung].sterne = e.sterne;
  return true;
}

// Stand für die Lehreransicht – ohne Geräte-Kennungen der Handys.
export function stand(daten, jetzt) {
  return {
    jetzt,
    eintraege: Object.values(daten).map((p) => {
      const e = { id: p.id, name: p.name, t: p.t, uebungen: p.uebungen };
      if (p.spiel) e.spiel = p.spiel.punkte; // Bestleistung im Belohnungsspiel
      return e;
    })
  };
}

export function entfernen(daten, id) {
  for (const g of Object.keys(daten)) {
    if (daten[g].id === id) { delete daten[g]; return true; }
  }
  return false;
}

// ---------- Wochen-Challenge ----------
// Punkte rechnet der Server selbst (wie das Handy): 100 je richtige Karte + Zeitbonus bis 500,
// der in 10 Minuten linear auf 0 fällt und nur anteilig zu den richtigen Karten zählt.
export function challengePunkte(richtig, gesamt, sek) {
  return 100 * richtig + Math.round(500 * (gesamt ? richtig / gesamt : 0) * Math.max(0, 1 - sek / 600));
}

// Prüft ein Challenge-Ergebnis vom Handy. Weniger als 1 Sekunde je Karte gilt als unmöglich (nicht gewertet).
export function pruefeChallenge(d) {
  if (!d || typeof d !== 'object') return { fehler: 'keine Daten' };
  if (!pruefeRaum(d.raum)) return { fehler: 'raum' };
  if (typeof d.geraet !== 'string' || !GERAET.test(d.geraet)) return { fehler: 'geraet' };
  const name = typeof d.name === 'string' ? d.name.replace(/\s+/g, ' ').trim() : '';
  if (name.length < 3 || name.length > 24 || !NAME.test(name)) return { fehler: 'name' };
  if (!ganzzahl(d.gesamt, 1, 40) || !ganzzahl(d.richtig, 0, d.gesamt)) return { fehler: 'zahlen' };
  if (!ganzzahl(d.dauer, 1, 24 * 60 * 60)) return { fehler: 'dauer' };
  if (d.dauer < d.gesamt) return { fehler: 'zu schnell' };
  return { eintrag: { raum: d.raum, geraet: d.geraet, name, richtig: d.richtig, gesamt: d.gesamt, dauer: d.dauer,
    punkte: challengePunkte(d.richtig, d.gesamt, d.dauer) } };
}

// Trägt ein Ergebnis ein – je Handy zählt das beste (bei Gleichstand das schnellere).
export function challengeEintragen(liste, e, jetzt, kurzId) {
  let p = liste[e.geraet];
  if (!p) {
    if (Object.keys(liste).length >= MAX_CHALLENGE) return false;
    p = liste[e.geraet] = { id: kurzId(), name: e.name, punkte: -1, t: jetzt };
  }
  p.name = e.name;
  if (e.punkte > p.punkte || (e.punkte === p.punkte && e.dauer < p.dauer)) {
    p.punkte = e.punkte; p.richtig = e.richtig; p.gesamt = e.gesamt; p.dauer = e.dauer;
  }
  p.runden = (p.runden || 0) + 1;
  p.t = jetzt;
  return true;
}

export function challengeAufraeumen(liste, jetzt) {
  let geaendert = false;
  for (const g of Object.keys(liste)) {
    if (!liste[g] || jetzt - liste[g].t > CHALLENGE_AUFBEWAHRUNG_MS) { delete liste[g]; geaendert = true; }
  }
  return geaendert;
}

// Bestenliste für die Lehrerseite – ohne Geräte-Kennungen, beste zuerst.
export function challengeStand(liste) {
  return Object.values(liste).filter((p) => p.punkte >= 0)
    .map((p) => ({ id: p.id, name: p.name, punkte: p.punkte, richtig: p.richtig, gesamt: p.gesamt, dauer: p.dauer, runden: p.runden || 1, t: p.t }))
    .sort((a, b) => b.punkte - a.punkte || a.dauer - b.dauer || a.name.localeCompare(b.name, 'de'));
}

export function challengeEntfernen(liste, id) {
  for (const g of Object.keys(liste)) {
    if (liste[g].id === id) { delete liste[g]; return true; }
  }
  return false;
}

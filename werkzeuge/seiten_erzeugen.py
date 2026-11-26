"""Erzeugt die Übungsseiten docs/ab1a.html … docs/ab2c.html und die Lehrerseiten (je Klasse und AB) aus Vorlagen,
dazu die Beamer-Seiten der Fall-Einführung „Zeitlupe“ (lehrer-3bfp2-1-fall.html, lehrer-3bfp2-2-fall.html).
Aufruf: python3 werkzeuge/seiten_erzeugen.py   (nur nötig, wenn eine Übung dazukommt)"""
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
IDS = ["ab1a", "ab1b", "ab2a", "ab2c", "ab3a", "kb2ab02", "kb2ab03", "kb2ab04", "kb2ab05"]
ABS = {"ab1": "AB 1 – Menschen im Notfall", "ab2": "AB 2 – Psychologische Erste Hilfe",
       "ab3": "Woche 4 – Informationen geben in Krisen",
       "kb2w1": "TB 2 neu · Woche 1 – Psychosoziale Unterstützung · Gesprächshemmer",
       "kb2w2": "TB 2 neu · Woche 2 – Schweigepflicht · Schlechte Nachrichten (SPIKES)"}
KLASSEN = {"k1": ("3BFP2/1", "3bfp2-1"), "k2": ("3BFP2/2", "3bfp2-2")}

VORLAGE = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#25434B">
<meta name="referrer" content="no-referrer">
<title>KB II – Notfallsituationen</title>
<link rel="stylesheet" href="style.css">
</head>
<body data-uebung="{id}">
<header class="kopf">
  <p class="kopfzeile" id="kopfzeile"></p>
  <h1 id="titel"></h1>
</header>
<div class="fortschritt" role="status">
  <span id="fortschritt-text"></span>
  <span class="fortschritt-spur" aria-hidden="true"><span class="fortschritt-balken" id="fortschritt-balken"></span></span>
</div>
<main class="inhalt">
  <div id="name-bereich" class="name-bereich" hidden></div>
  <div id="uebung-teil">
    <p class="name-zeile" id="name-zeile" hidden></p>
    <p class="anweisung" id="anweisung"></p>
    <div id="hilfe-platz"></div>
    <div id="karten"></div>
    <div id="merksatz-bereich" hidden></div>
    <button type="button" class="knopf knopf-zweit" id="noch-einmal"></button>
  </div>
</main>
<noscript><p class="inhalt">Bitte aktivieren Sie JavaScript, um die Übung zu bearbeiten.</p></noscript>
<script src="einstellungen.js"></script>
<script src="inhalte.js"></script>
<script src="app.js"></script>
</body>
</html>
"""

LEHRER = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>{titel} · Fortschritt</title>
<link rel="stylesheet" href="lehrer.css">
</head>
<body data-raum="{raum}">
<header class="l-kopf">
  <h1>{titel}</h1>
  <p id="l-status" class="l-status" role="status"></p>
</header>
<main id="l-inhalt" class="l-inhalt"></main>
<footer class="l-fuss" id="l-fuss"></footer>
<script src="einstellungen.js"></script>
<script src="inhalte.js"></script>
<script src="lehrer.js"></script>
</body>
</html>
"""

FALL_LEHRER = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>{titel} · Fall-Einführung (Beamer)</title>
<link rel="stylesheet" href="lehrer.css">
<link rel="stylesheet" href="lehrer-fall.css">
</head>
<body data-raum="{raum}">
<header class="l-kopf">
  <h1>{titel} · Fall-Einführung „Reanimation und nicht nur ich war hilflos“</h1>
  <p id="l-status" class="l-status" role="status"></p>
</header>
<main id="z-buehne" class="z-buehne"></main>
<footer class="l-fuss" id="l-fuss"></footer>
<nav class="z-steuer" id="z-steuer" aria-label="Steuerung"></nav>
<script src="einstellungen.js"></script>
<script src="fall-inhalte.js"></script>
<script src="lehrer-fall.js"></script>
</body>
</html>
"""

for i in IDS:
    (DOCS / f"{i}.html").write_text(VORLAGE.replace("{id}", i), encoding="utf-8")
lehrerseiten = []
for kk, (kname, kdatei) in KLASSEN.items():
    for ab, titel in ABS.items():
        datei = f"lehrer-{kdatei}-{ab}.html"
        (DOCS / datei).write_text(LEHRER.replace("{raum}", f"{kk}-{ab}").replace("{titel}", f"{kname} · {titel}"), encoding="utf-8")
        lehrerseiten.append(datei)
for kk, (kname, kdatei) in KLASSEN.items():
    datei = f"lehrer-{kdatei}-fall.html"
    (DOCS / datei).write_text(FALL_LEHRER.replace("{raum}", f"{kk}-fall").replace("{titel}", kname), encoding="utf-8")
    lehrerseiten.append(datei)
print("ok:", ", ".join(IDS), "+ Lehrerseiten", ", ".join(lehrerseiten))

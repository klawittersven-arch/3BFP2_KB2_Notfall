/* Pixel-Grafiken für „Notfall-Run!“ (Figur aus „Diabetes Run!“ übernommen) – alles selbst gezeichnet, keine Bilddateien.
 * Jede Grafik ist ein Raster aus Zeichen; jedes Zeichen steht für eine Farbe,
 * „.“ ist durchsichtig. Beim Start wird jede Grafik einmal in eine kleine
 * Offscreen-Leinwand gezeichnet und danach nur noch kopiert (drawImage). */
(function () {
  'use strict';

  var FARBEN = {
    // Figur: Krankenschwester
    O: '#1C1525',                        // Umrisslinie und Augen
    W: '#FFFFFF', w: '#DCE3E7',          // Haube und Kleid weiß, Schatten
    s: '#BEC7CE',                        // Strumpf des hinteren Beins
    K: '#F76892', k: '#D34677',          // Kreuz, Kragen, Gürtel und Schuhe rosa; hinterer Schuh
    H: '#964536', h: '#702F26',          // Haare, Haarschatten
    F: '#FCD2B5', c: '#FAA2A8',          // Haut, Wangen
    // Hindernisse (Notfall- und Krisensituationen)
    A: '#D7262F', a: '#A3161F',          // Notfallrot, dunkles Rot
    D: '#16B35A', d: '#0B5E2E',          // Defi-Koffer: kräftiges Grün mit dunklem Rand, Blitz dunkelgrün
    Y: '#F2C200',                        // Blitz, Scheinwerfer
    Q: '#F26B1D', q: '#B84A12',          // Leitkegel orange
    U: '#2F6BFF', u: '#A9C2FF',          // Blaulicht
    J: '#9AA0A5', j: '#C9CDD1', I: '#767D82', // Rauch
    M: '#5C6B70', m: '#2B2B2B',          // Metall, Reifen
    P: '#E3EAEC', X: '#D6EEF6'           // helles Metall, Fensterglas
  };

  /* ---------- Figur: Krankenschwester mit Haube (wie in „Gipfelsprint“) ---------- */
  // Jede Pose ist ein ganzes Raster: Kopf immer an derselben Stelle (Spalte 0–15), die unterste
  // Zeile steht auf der Fußlinie. Laufen: vier Bilder, das hintere Bein ist grau, damit sich die
  // Beine sichtbar abwechseln. Die Figur ist höher als die Trefferfläche (die bleibt unverändert).
  var FIGUR = {
    lauf1: [
      '......OOOOOO.....',
      '.....OwWWWWWO....',
      '....OwWWWKWWWO...',
      '....OwWWKKKWWO...',
      '....OwwWWKWWWO...',
      '...OHHwWWWWWHHO..',
      '..OHHHHHHHHHHHHO.',
      '.OhHHHHHFFFFFHHO.',
      'OhhHHHHFFFFFFFFO.',
      'OhFFHHHFFFOFFOFO.',
      'OhFFHHHFFFOFFOFO.',
      'OhhHHHHFFcFFcFFO.',
      '.OOHHHHFFFFFFFO..',
      '..OOHHHFFFFFOO...',
      '....OOWWKKWO.....',
      '..OOFWWWWKWWO.OO.',
      '.OFFOwOwWWWOFOFFO',
      'OFFOOOOwWWWOFFFFO',
      'OFFO.OKKKKKOOFFO.',
      '.OO.OwWWWWWO.OO..',
      '...OwwWWWWWWO....',
      '....OwwwWWWWO....',
      '..OOssOOOwwO.....',
      '.OsssO...OWWO....',
      'OkssO....OWWOOO..',
      'OkkO......OWKKKO.',
      'OkkO......OkkKKO.',
      '.OO........OOOO..'
    ],
    lauf2: [
      '......OOOOOO....',
      '.....OwWWWWWO...',
      '....OwWWWKWWWO..',
      '....OwWWKKKWWO..',
      '....OwwWWKWWWO..',
      '...OHHwWWWWWHHO.',
      '..OHHHHHHHHHHHHO',
      '.OhHHHHHFFFFFHHO',
      'OhhHHHHFFFFFFFFO',
      'OhFFHHHFFFOFFOFO',
      'OhFFHHHFFFOFFOFO',
      'OhhHHHHFFcFFcFFO',
      '.OOHHHHFFFFFFFO.',
      '..OOHHHFFFFFOO..',
      '....OOWWKKWOO...',
      '....OWWwWKWWO...',
      '...OFFOOwWWOFOO.',
      '..OFFOOwWWWOFFFO',
      '..OFFOKKKKKOOFFO',
      '...OOwwWWWWWOOO.',
      '....OwWWWWWWWO..',
      '...OwWWWwwwOO...',
      '....OOssOwwO....',
      '.....OssOwwO....',
      '....OksOwwO.....',
      '....OkkOKKO.....',
      '.....OkkOkKO....',
      '.....OOO.OOO....'
    ],
    lauf3: [
      '......OOOOOO.....',
      '.....OwWWWWWO....',
      '....OwWWWKWWWO...',
      '....OwWWKKKWWO...',
      '....OwwWWKWWWO...',
      '...OHHwWWWWWHHO..',
      '..OHHHHHHHHHHHHO.',
      '.OhHHHHHFFFFFHHO.',
      'OhhHHHHFFFFFFFFO.',
      'OhFFHHHFFFOFFOFO.',
      'OhFFHHHFFFOFFOFO.',
      'OhhHHHHFFcFFcFFO.',
      '.OOHHHHFFFFFFFO..',
      '..OOHHHFFFFFOO...',
      '....OOWWKKWO.....',
      '...OOWwWWKWWO.OO.',
      '..OFFOwWwWWwOOFFO',
      '.OFFOOOwWWWOFFFFO',
      'OFFO.OKKKKKOFFOO.',
      'OFFO.OwWWWwO.O...',
      '.OO.OwWWWWWWO....',
      '...OwwWwWWWWO....',
      '...OOWWOOssO.....',
      '..OWWWO..OssO....',
      '.OKWWO...OsssOO..',
      '.OKKO.....OskkkO.',
      '.OKKO.....OkkkkO.',
      '..OO......OOOOO..'
    ],
    lauf4: [
      '......OOOOOO....',
      '.....OwWWWWWO...',
      '....OwWWWKWWWO..',
      '....OwWWKKKWWO..',
      '....OwwWWKWWWO..',
      '...OHHwWWWWWHHO.',
      '..OHHHHHHHHHHHHO',
      '.OhHHHHHFFFFFHHO',
      'OhhHHHHFFFFFFFFO',
      'OhFFHHHFFFOFFOFO',
      'OhFFHHHFFFOFFOFO',
      'OhhHHHHFFcFFcFFO',
      '.OOHHHHFFFFFFFO.',
      '..OOHHHFFFFFOO..',
      '....OOWWKKWO....',
      '...OOWWwWKWWO...',
      '..OFFwOwWWWOFOO.',
      '.OFFOOOwWWWOFFFO',
      '.OFFOOKKKKKOOFFO',
      '..OO.OwWWWWO.OO.',
      '....OwwWWWWWO...',
      '...OwwWWWwwwO...',
      '....OOWssssO....',
      '.....OWsOssO....',
      '....OKWOOssO....',
      '....OKKOOkkO....',
      '....OOKO.OkkO...',
      '.....OO..OkkO...',
      '..........OOO...'
    ],
    sprung: [
      '......OOOOOO.......',
      '.....OwWWWWWO......',
      '....OwWWWKWWWO.....',
      '....OwWWKKKWWO.....',
      '....OwwWWKWWWO.....',
      '...OHHwWWWWWHHO....',
      '..OHHHHHHHHHHHHO...',
      '.OhHHHHHFFFFFHHO...',
      'OhhHHHHFFFFFFFFO...',
      'OhFFHHHFFFOFFOFO...',
      'OhFFHHHFFFOFFOFO...',
      'OhhHHHHFFcFFcFFOOO.',
      '.OOHHHHFFFFFFFOFFO.',
      '..OOHHHFFFFFOOOFFFO',
      '....OOWWKKWOOWFFFO.',
      '...OFWWwWKWWOWFOO..',
      '..OFFwOwwWWWOOO....',
      '.OFFOOOwWWWO.......',
      '.OFFO.OKKKKKO......',
      '..OO.OwWWWWWwO.....',
      '.....OwWWWWOWWO....',
      '....OwwWWWOWWO.....',
      '.....OwwOOKKO......',
      '.....OwWOOKKO......',
      '.....OWWO.OKO......',
      '....OWWO...O.......',
      '....OKKO...........',
      '....OKKO...........',
      '.....OKO...........',
      '......O............'
    ],
    // Ducken: Haube eine Zeile flacher, Körper zusammengekauert (Oberkante 16 px über dem Boden, unter dem Wespenschwarm)
    ducken: [
      '......OOOOOO....',
      '....OwWWWKWWWO..',
      '....OwWWKKKWWO..',
      '....OwwWWKWWWO..',
      '...OHHwWWWWWHHO.',
      '..OHHHHHHHHHHHHO',
      '.OhHHHHHFFFFFHHO',
      'OhhHHHHFFFFFFFFO',
      'OhFFHHHFFFOFFOFO',
      'OhFFHHHFFFOFFOFO',
      'OhhHHHHFFcFFcFFO',
      '.OOHHHHFFFFFFFO.',
      '..OOHHHFFFFFOO..',
      '...OFOWKKKWOFO..',
      '..OOwwWWWWWwwOO.',
      '...OkKKOOOKKkO..'
    ]
  };

  // name wird nicht mehr unterschieden (es gibt nur noch eine Figur)
  function figurRaster(name, pose) {
    return FIGUR[pose] || FIGUR.lauf2;
  }

  /* ---------- Hindernisse: Notfallkoffer, Defi, Leitkegel, Notfallwagen, Rauch, Rettungswagen ---------- */
  var GRAFIK = {
    notfallkoffer: [
      '.....mmmm.....',
      '....m....m....',
      'aAAAAAAAAAAAAa',
      'AAAAAAWWAAAAAA',
      'AAAAAAWWAAAAAA',
      'AAAAWWWWWWAAAA',
      'AAAAWWWWWWAAAA',
      'AAAAAAWWAAAAAA',
      'AAAAAAWWAAAAAA',
      'AAAAAAAAAAAAAA',
      'aaaaaaaaaaaaaa'
    ],
    defi: [
      '......mmmm......',
      '.....m....m.....',
      'mmmmmmmmmmmmmmmm',
      'mDDDDDDDDDDDDDDm',
      'mDDDWWWDDWWWDDDm',
      'mDDWWWWWWWWWWDDm',
      'mDDWWWWWdWWWWDDm',
      'mDDWWWWddWWWWDDm',
      'mDDDWWWWddWWDDDm',
      'mDDDDWWWWdWDDDDm',
      'mDDDDDWWWWDDDDDm',
      'mDDDDDDWWDDDDDDm',
      'mDDDDDDDDDDDDDDm',
      'mmmmmmmmmmmmmmmm'
    ],
    leitkegel: [
      '.....qQ.....',
      '.....QQ.....',
      '....qQQQ....',
      '....QQQQ....',
      '....WWWW....',
      '...WWWWWW...',
      '...qQQQQQ...',
      '...QQQQQQ...',
      '..qQQQQQQQ..',
      '..WWWWWWWW..',
      '..WWWWWWWW..',
      '.qQQQQQQQQQ.',
      '.QQQQQQQQQQ.',
      '.QQQQQQQQQQ.',
      'mmmmmmmmmmmm',
      'mmmmmmmmmmmm',
      'mmmmmmmmmmmm'
    ],
    notfallwagen: [
      'MMMMMMMMMMMMMMMMMM',
      'MPPPPPPPPPPPPPPPPM',
      'MAAAAAAAWWAAAAAAAM',
      'MAAAAAWWWWWWAAAAAM',
      'MAAAAAWWWWWWAAAAAM',
      'MAAAAAAAWWAAAAAAAM',
      'MaaaaaaaaaaaaaaaaM',
      'MAAAAAAAAAAAAAAAAM',
      'MAAAAAAPPPPAAAAAAM',
      'MaaaaaaaaaaaaaaaaM',
      'MAAAAAAAAAAAAAAAAM',
      'MAAAAAAPPPPAAAAAAM',
      'MaaaaaaaaaaaaaaaaM',
      'MMMMMMMMMMMMMMMMMM',
      '..M............M..',
      '.mmm..........mmm.',
      '.mMm..........mMm.',
      '.mmm..........mmm.'
    ],
    rtwKabine: [
      '....mmmmmmmmmUUUuumm',
      '...mWWWWWWWWWUUUuuWm',
      '..mWWWWWWWWWWWWWWWWm',
      '.mWWWWWWWWWWWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWXXXXXXXXXXWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWPPWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mAAAAAAAAAAAAAAAAAAm',
      'mAAAAAAAAAAAAAAAAAAm',
      'mAAAAAAAAAAAAAAAAAAm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mYYWWWWWWWWWWWWWWWWm',
      'mYYWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mWWWWWWWWWWWWWWWWWWm',
      'mmmmmmmmmmmmmmmmmmmm',
      'mmmmmmmmmmmmmmmmmmmm',
      'mmmmmmmmmmmmmmmmmmmm'
    ],
    rtwRad: [
      '..mmmmmm..',
      '.mmmmmmmm.',
      'mmmmPPmmmm',
      'mmmPmmPmmm',
      'mmPmmmmPmm',
      'mmPmmmmPmm',
      'mmmPmmPmmm',
      'mmmmPPmmmm',
      '.mmmmmmmm.',
      '..mmmmmm..'
    ],
    rtwSchrift: [
      '..A.....A....AAA.',
      '.AA....AA...A...A',
      'A.A...A.A.......A',
      '..A.....A......A.',
      '..A.....A.....A..',
      '..A.....A....A...',
      'AAAAA.AAAAA.AAAAA'
    ],
    rauch1: [
      '....jjjj......',
      '..jjJJJJjj....',
      '.jJJJJJJJJj...',
      'jJJJJJJIJJJjj.',
      'jJJJJJIIJJJJJj',
      'jJJJJJJJJJJJJj',
      '.jJJJIJJJJJJj.',
      '..jjJJJJJJjj..',
      '....jjjjjj....'
    ],
    rauch2: [
      '......jjjj....',
      '....jjJJJJjj..',
      '...jJJJJJJJJj.',
      '.jjJJJIJJJJJJj',
      'jJJJJJJIIJJJJj',
      'jJJJJJJJJJJJJj',
      '.jJJJJJJJIJJj.',
      '..jjJJJJJJjj..',
      '....jjjjjj....'
    ]
  };

  /* ---------- Ziffern (3 × 5) für die Punkteanzeige ---------- */
  var ZIFFERN = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '.##', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###']
  ];

  function leinwand(b, h) {
    var c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    return c;
  }

  function rasterZeichnen(raster, massstab) {
    massstab = massstab || 1;
    var b = 0;
    for (var i = 0; i < raster.length; i++) b = Math.max(b, raster[i].length);
    var c = leinwand(b * massstab, raster.length * massstab);
    var ctx = c.getContext('2d');
    for (var y = 0; y < raster.length; y++) {
      for (var x = 0; x < raster[y].length; x++) {
        var z = raster[y][x];
        if (z === '.' || !FARBEN[z]) continue;
        ctx.fillStyle = FARBEN[z];
        ctx.fillRect(x * massstab, y * massstab, massstab, massstab);
      }
    }
    return c;
  }

  function figur(name, pose, massstab) {
    return rasterZeichnen(figurRaster(name, pose || 'lauf2'), massstab);
  }

  // Ziffernblatt: 10 Ziffern nebeneinander, je 4 px breit (inkl. Abstand)
  function ziffernblatt(farbe) {
    var c = leinwand(40, 5);
    var ctx = c.getContext('2d');
    ctx.fillStyle = farbe;
    for (var d = 0; d < 10; d++) {
      for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 3; x++) {
          if (ZIFFERN[d][y][x] === '#') ctx.fillRect(d * 4 + x, y, 1, 1);
        }
      }
    }
    return c;
  }

  window.PIXEL = {
    FARBEN: FARBEN,
    GRAFIK: GRAFIK,
    figurRaster: figurRaster,
    rasterZeichnen: rasterZeichnen,
    figur: figur,
    ziffernblatt: ziffernblatt,
    leinwand: leinwand
  };
})();

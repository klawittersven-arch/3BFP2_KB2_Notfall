/* Offline-Speicher: Beim ersten Aufruf werden alle Dateien gespeichert, damit die Übungen
 * auch bei schwachem Schul-WLAN funktionieren. Strategie: zuerst das Netz (mit Zeitlimit),
 * sonst die gespeicherte Fassung – Textänderungen kommen so sofort an.
 * Nach größeren Änderungen VERSION erhöhen ('v2', 'v3' …). */
'use strict';
var VERSION = 'v3';
var CACHE = 'kb2-notfall-' + VERSION;
var ZEITLIMIT_MS = 4000;
var DATEIEN = ['./', 'index.html', 'inhalte.js', 'einstellungen.js', 'app.js', 'style.css',
  'ab1a.html', 'ab1b.html', 'ab2a.html', 'ab2b.html', 'ab2c.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(DATEIEN.map(function (d) { return new Request(d, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (namen) {
    return Promise.all(namen.filter(function (n) { return n.indexOf('kb2-notfall-') === 0 && n !== CACHE; })
      .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(new Promise(function (fertig) {
    var erledigt = false;
    function ausCache() {
      return caches.open(CACHE).then(function (c) { return c.match(req, { ignoreSearch: true }); });
    }
    var timer = setTimeout(function () {
      ausCache().then(function (r) { if (r && !erledigt) { erledigt = true; fertig(r); } });
    }, ZEITLIMIT_MS);
    fetch(req, { cache: 'no-cache' }).then(function (antwort) {
      if (antwort && antwort.ok && antwort.type === 'basic') {
        var kopie = antwort.clone();
        caches.open(CACHE).then(function (c) { return c.put(req, kopie); });
      }
      clearTimeout(timer);
      if (!erledigt) { erledigt = true; fertig(antwort); }
    }).catch(function () {
      clearTimeout(timer);
      ausCache().then(function (r) {
        if (!erledigt) { erledigt = true; fertig(r || new Response('Offline', { status: 503 })); }
      });
    });
  }));
});

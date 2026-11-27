/* 오사카 원정 · 서비스 워커 (PWA 오프라인)
   전략: Network-First — 네트워크를 먼저 시도하고, 실패하면 캐시.
   앱 업데이트가 바로 반영되고, 비행기 모드·지하철에서도 열립니다.
   캐시 버전을 올리면(v1 → v2) 예전 캐시는 자동 정리됩니다. */
var CACHE = 'osaka-trip-v1';

var CORE = [
  './',
  './index.html',
  './data.js',
  './qr-data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './images/d1-4.jpg',
  './images/d1-5.jpg',
  './images/d1-6.jpg',
  './images/d1-7.jpg',
  './images/d1-8.jpg',
  './images/d2-1.jpg',
  './images/d2-2.jpg',
  './images/d2-4.jpg',
  './images/d2-4b.jpg',
  './images/d2-5.jpg',
  './images/d2-7.jpg',
  './images/d3-2.jpg',
  './images/d3-3.jpg',
  './images/d3-4.jpg',
  './images/d3-5.jpg',
  './images/shop-biccamera.jpg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* 하나가 실패해도 설치가 멈추지 않게 개별 추가 */
      return Promise.all(CORE.map(function (u) {
        return c.add(u).catch(function () { /* 오프라인 설치 시 건너뜀 */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* 외부(CDN 등)는 건드리지 않음 */

  e.respondWith(
    fetch(req).then(function (res) {
      /* 네트워크 성공 → 캐시에 저장하고 그대로 반환 (업데이트 즉시 반영) */
      if (res && (res.status === 200 || res.type === 'opaque')) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      /* 네트워크 실패 → 캐시에서 찾기 (버전 쿼리 ?v= 는 무시하고 매칭) */
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        /* 내비게이션(페이지 이동)은 캐시된 index.html로 */
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match(req);
      });
    })
  );
});

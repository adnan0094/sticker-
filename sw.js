const CACHE_NAME = 'medicine-reminder-v1';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});

// يستقبل إشعارات Push من خادم الإشعارات عند ربطه لاحقًا.
self.addEventListener('push', event => {
  let data = { title: '🔔 تنبيه الدواء', body: 'حان وقت تناول دوائك' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './icon.svg',
    badge: './icon.svg',
    tag: data.tag || 'medicine-reminder',
    renotify: true,
    requireInteraction: true,
    data: { url: './index.html' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const existing = list.find(client => 'focus' in client);
    return existing ? existing.focus() : clients.openWindow('./index.html');
  }));
});

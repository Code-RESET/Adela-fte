// ============================================================
// service-worker.js
// Cache básico de los archivos estáticos del shell (cache-first).
// Al agregar módulos nuevos, súmalos a CORE_ASSETS si quieres que
// funcionen offline. Subir CACHE_VERSION cada vez que cambies
// archivos base para forzar actualización en los teléfonos.
// ============================================================

const CACHE_VERSION = "expediente-v5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/router.js",
  "./js/auth.js",
  "./js/firebase-config.js",
  "./js/util.js",
  "./js/db.js",
  "./js/dictado.js",
  "./js/formulario.js",
  "./js/formatos-nom004.js",
  "./js/documento-expediente.js",
  "./js/vendor/jspdf-4.2.1.umd.min.js",
  "./js/modules/dashboard.js",
  "./js/modules/pacientes.js",
  "./js/modules/paciente.js",
  "./js/modules/nota.js",
  "./js/modules/configuracion.js",
  "./assets/app-icon.svg",
  "./assets/dr-armando.jpg",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // No cachear llamadas a Firebase/Google — siempre red directa.
  // Los datos de pacientes NUNCA pasan por este caché (van a Firestore).
  if (event.request.url.includes("firebase") || event.request.url.includes("googleapis")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

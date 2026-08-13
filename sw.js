// Service worker minimo. Este proyecto depende de internet para hablar con
// Apps Script (no se puede registrar un gasto sin conexion), asi que aqui
// solo cacheamos el "cascaron" de la app (el HTML, el manifest y los iconos)
// para que abra rapido y sea instalable. Los datos siempre vienen en vivo.

const NOMBRE_CACHE = "centro-familiar-v3";
const ARCHIVOS_CASCARON = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(ARCHIVOS_CASCARON))
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves
          .filter((clave) => clave !== NOMBRE_CACHE)
          .map((clave) => caches.delete(clave))
      )
    )
  );
});

self.addEventListener("fetch", (evento) => {
  // Las llamadas a la API de Apps Script (script.google.com) NUNCA se cachean:
  // siempre deben ir en vivo, o los datos financieros quedarian desactualizados.
  if (evento.request.url.indexOf("script.google.com") !== -1) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respuestaCache) => {
      return respuestaCache || fetch(evento.request);
    })
  );
});

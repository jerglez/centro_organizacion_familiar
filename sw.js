// Service worker minimo. Este proyecto depende de internet para hablar con
// Apps Script (no se puede registrar un gasto sin conexion), asi que aqui
// solo cacheamos el "cascaron" de la app (el HTML, el manifest y los iconos)
// para que abra rapido y sea instalable. Los datos siempre vienen en vivo.

const NOMBRE_CACHE = "centro-familiar-v16";
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
  const url = new URL(evento.request.url);

  // Solo se intercepta lo que es de NUESTRO propio origen (index.html,
  // manifest.json, iconos). Cualquier peticion a otro dominio — Apps Script,
  // Google Identity Services, fuentes, chequeos internos de Google como
  // csp.withgoogle.com, etc. — se deja pasar SIN TOCAR. Antes solo excluiamos
  // "script.google.com", pero eso dejaba el service worker interceptando
  // peticiones internas de terceros que no le corresponden, causando el error
  // "Request mode is no-cors but redirect mode is not follow".
  if (url.origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respuestaCache) => {
      return respuestaCache || fetch(evento.request);
    })
  );
});

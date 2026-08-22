// Service worker minimo. Este proyecto depende de internet para hablar con
// Apps Script (no se puede registrar un gasto sin conexion), asi que aqui
// solo cacheamos el "cascaron" de la app (el HTML, el manifest y los iconos)
// para que abra rapido y sea instalable. Los datos siempre vienen en vivo.

const NOMBRE_CACHE = "centro-familiar-v18";
const ARCHIVOS_CASCARON = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (evento) => {
  // Activa la version nueva de inmediato, sin esperar a que el usuario
  // cierre TODAS las pestanas/instancias abiertas de la app — asi cada
  // actualizacion que subimos se aplica en la siguiente carga, no "en algun
  // momento futuro incierto".
  self.skipWaiting();
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(ARCHIVOS_CASCARON))
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    Promise.all([
      caches.keys().then((claves) =>
        Promise.all(
          claves
            .filter((clave) => clave !== NOMBRE_CACHE)
            .map((clave) => caches.delete(clave))
        )
      ),
      self.clients.claim() // toma control de las pestanas ya abiertas de inmediato
    ])
  );
});

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);

  // Solo se intercepta lo que es de NUESTRO propio origen (index.html,
  // manifest.json, iconos). Cualquier peticion a otro dominio — Apps Script,
  // Google Identity Services, fuentes, chequeos internos de Google como
  // csp.withgoogle.com, etc. — se deja pasar SIN TOCAR.
  if (url.origin !== self.location.origin) {
    return;
  }

  // El HTML principal SIEMPRE se pide primero a la red (mientras seguimos
  // actualizando la app casi a diario, no queremos que nadie se quede viendo
  // una version vieja guardada) — el cache solo se usa como respaldo si no
  // hay conexion. Los demas archivos (manifest, iconos) si usan cache primero,
  // porque casi nunca cambian.
  const esHtmlPrincipal = evento.request.mode === "navigate" || url.pathname.endsWith("index.html");

  if (esHtmlPrincipal) {
    evento.respondWith(
      fetch(evento.request)
        .then((respuestaRed) => {
          caches.open(NOMBRE_CACHE).then((cache) => cache.put(evento.request, respuestaRed.clone()));
          return respuestaRed;
        })
        .catch(() => caches.match(evento.request))
    );
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respuestaCache) => {
      return respuestaCache || fetch(evento.request);
    })
  );
});

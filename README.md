# Expediente Clínico — Dr. Armando de la Fuente Escandón

PWA de expediente clínico con dictado por voz, conforme a **NOM-004-SSA3-2012** (expediente clínico)
y **NOM-024-SSA3-2012** (registro electrónico para la salud).
Desarrollado por Code-Reset — Ing. Luis Ángel Díaz Bernal.

- App: https://code-reset.github.io/Adela-fte/ (al activar GitHub Pages)
- Demo con datos de ejemplo, sin Firebase: https://code-reset.github.io/Adela-fte/demo/
- Contexto completo del proyecto (decisiones, normas, pendientes): [`docs/CONTEXTO.md`](docs/CONTEXTO.md)

Stack: HTML + CSS + JS puro (ES6 modules), sin build. Firebase Auth + Firestore. Router por hash.

Diseño estilo iOS para iPhone: colores y tipografía del sistema de Apple, barra de pestañas inferior,
listas agrupadas, modo oscuro automático y respeto del notch. El color principal se cambia en `--accent`
(`css/styles.css`). Ícono de la app: `assets/app-icon.svg` (los PNG se generan a partir de él).

## Qué hace (fase 1)

- **Mi consultorio:** datos del médico (nombre, cédula) y del establecimiento, que van en cada nota.
- **Pacientes:** ficha de identificación (NOM-004 5.2.3 + NOM-024 Tabla 1), número de expediente consecutivo y búsqueda.
- **Historia clínica** (NOM-004 6.1) y **nota de evolución** (6.2), en el orden de la norma, con antecedentes gineco-obstétricos y control prenatal.
- **Dictado por campo** (🎤) con el reconocimiento de voz del navegador (es-MX). Gratis; mejor en Chrome; necesita internet.
- **Autoguardado** del borrador.
- **Firmar:** no deja firmar si falta un dato obligatorio de la norma; avisa si hay abreviaturas (5.11).
  La nota firmada queda **bloqueada**; se corrige con **adenda**.
- **Guardar** el expediente completo en PDF (portada con ficha e índice + cada nota firmada con sus adendas).
  En iPhone abre "Compartir" (Guardar en Archivos, AirDrop, Mail, WhatsApp); en PC lo descarga.
  También se puede guardar una sola nota. jsPDF va dentro del repo (`js/vendor/`, licencia MIT) para funcionar sin internet.
- **Imprimir** el expediente completo o una nota, con encabezado del consultorio y línea para firma autógrafa.
- **Exportar** los datos de un paciente (JSON) — NOM-024 6.6.6.
- **Bitácora** de auditoría de solo agregar — NOM-024 6.6.1.

Detalle norma → campo: [`docs/requisitos-nom-004.md`](docs/requisitos-nom-004.md).
Las definiciones de los formularios están en `js/formatos-nom004.js`: para mover o agregar un campo se edita ese archivo.

## Estructura

```
index.html, manifest.json, service-worker.js, css/styles.css
js/firebase-config.js   credenciales (+ modo emulador solo en localhost)
js/auth.js              login / logout
js/router.js            rutas #/modulo/param (MODULES)
js/db.js                todo el acceso a Firestore
js/formatos-nom004.js   campos de cada formato, con su numeral de la norma
js/formulario.js        pinta y lee formularios a partir de los formatos
js/dictado.js           dictado por voz
js/documento-expediente.js  PDF e impresión del expediente / de una nota
js/vendor/              jsPDF 4.2.1 (MIT)
js/util.js              utilidades (esc() contra XSS, fechas, edad)
js/modules/             dashboard, pacientes, paciente, nota, configuracion
firestore.rules         reglas de seguridad
tests/rules.test.mjs    pruebas de las reglas (emulador)
prueba-dictado.html     página aislada para probar el micrófono
```

## Puesta en marcha

1. Crear proyecto en Firebase. Al crear Firestore, elegir la región más cercana a México disponible.
2. Pegar el `firebaseConfig` real en `js/firebase-config.js`.
3. Authentication → habilitar **Correo/contraseña** y crear la cuenta del doctor desde la consola.
4. Publicar las reglas: `firebase deploy --only firestore:rules` (o copiar `firestore.rules` en la consola).
5. Publicar el sitio: Settings → Pages → Deploy from a branch → `main` → `/(root)`.
6. Entrar, llenar **Consultorio** y empezar.
7. Subir `CACHE_VERSION` en `service-worker.js` cada vez que cambien archivos base.

## Pruebas

Requiere Java (para el emulador). Solo para desarrollo; la app no usa npm.

```bash
cd tests && npm install && npm test        # reglas de Firestore (16 pruebas)
```

Probar la app completa contra emuladores: `firebase emulators:start --only firestore,auth --project demo-expediente`,
servir la carpeta (`python3 -m http.server 5173`) y abrir `http://localhost:5173/?emulador`.

## Pendientes conocidos

- Firma electrónica avanzada (e.firma), segundo factor de autenticación, consentimiento de aviso de privacidad,
  catálogo CIE-10 y Cuadro Básico — ver `docs/requisitos-nom-004.md` §11–12.
- Fase 2: dictado libre con IA (Claude) a través de un intermediario (Cloudflare Worker). La API key nunca va en el front-end.
- El médico revisa y firma cada nota y es responsable de su contenido.

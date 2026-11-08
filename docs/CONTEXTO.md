# Contexto del proyecto: Expediente Clínico por Dictado

Documento para continuar el trabajo en otro repo o conversación.
Resume lo decidido, lo construido, lo probado y lo pendiente al **8 de noviembre de 2026**.

- **Cliente:** Dr. Armando Alejandro de la Fuente Escandón, Ginecología y Obstetricia, Colposcopia.
- **Proveedor:** Code-Reset, Ing. Luis Ángel Díaz Bernal (Angel).
- **Repo:** `Code-RESET/Adela-fte` (público). El trabajo se migró aquí desde el repo privado
  `Code-RESET/Dr.armando-de-la-fuente` (rama `ccr-fc4ae847-lekgjq`), sin su historial.
  Los commits listados en la sección 5 son los de ese repo privado.

---

## 1. Qué pidió el doctor

- App de expediente clínico que cumpla la norma oficial.
- Que él **hable** y los datos se llenen solos.
- Usar Claude (ya lo contrató). El dictado con IA es la fase 2.
- Pedidos posteriores de Angel:
  - Estilo de app de iPhone, con colores cambiados.
  - Botones **Guardar** e **Imprimir** del expediente terminado.
  - Foto del doctor en el login y sin el reloj de Code-Reset.
  - Que también funcione en PC.

## 2. Datos reales del doctor y del consultorio

Tomados de su perfil público en Doctoralia, a partir de capturas que mandó Angel.

| Dato | Valor |
|---|---|
| Nombre completo | Armando Alejandro de la Fuente Escandón |
| Especialidad | Ginecología y Obstetricia, Colposcopia |
| Formación | Médico Cirujano (Universidad Autónoma de Guadalajara); Especialidad en Ginecología y Obstetricia; Diplomado en Colposcopia (Universidad Autónoma de Coahuila) |
| Cédulas (perfil) | 3394142 y 647025, **sin decir cuál es cuál** |
| Supuesto usado | 647025 = profesional, 3394142 = especialidad (por numeración). **Confirmar con el doctor** |
| Establecimiento | Corpo Med Dr. Armando Alejandro de la Fuente Escandón |
| Tipo | Consultorio de especialidad (consulta privada) |
| Domicilio | Avenida Allende 73 Oriente, Colonia Segundo de Cobián Centro, Código Postal 27000, Torreón, Coahuila |
| Teléfono | 871 716 3150 |
| Foto | `assets/dr-armando.jpg` (480×480, 24 KB, recortada de la foto que mandó Angel) |

En la app real estos datos **no van en el código**: el doctor los captura en la pestaña "Consultorio" y se guardan en Firestore. Solo están escritos en el login (nombre y especialidad) y en la demo.

---

## 3. Normas: lo que se verificó en el texto oficial

Angel subió los PDF del DOF y se leyeron completos.
- NOM-004-SSA3-2012: DOF 15/10/2012.
- NOM-024-SSA3-2012: DOF 30/11/2012.

El detalle de norma → campo está en `docs/requisitos-nom-004.md`, dentro del repo.

### Correcciones al resumen original de Angel
- La norma es de la **Secretaría de Salud**, no de COFEPRIS.
- La **CURP no la exige la NOM-004**, pero **sí la NOM-024** (Tabla 1). La app no debe generarla (NOM-024 6.5.1).
- La nota de evolución **no es SOAP**. Pide 6 puntos (6.2):
  - evolución;
  - signos vitales "según se considere necesario";
  - resultados de estudios;
  - diagnósticos;
  - **pronóstico**;
  - tratamiento, con **dosis, vía y periodicidad** de cada medicamento.
- **CIE-10 no es obligatorio** en la NOM-004. La NOM-024 lo lista como catálogo fundamental para registrar diagnósticos.
- La cédula profesional no está en el cuerpo de la NOM-004 (5.10 pide nombre completo y firma), pero el Apéndice A la evalúa. Se incluye.
- Los antecedentes gineco-obstétricos **sí son obligatorios** por remisión del 5.14 a las NOM de embarazo, planificación familiar, cáncer cervicouterino y violencia.

### Requisitos clave que moldearon el diseño
- **5.11, sin abreviaturas:** antes de firmar, la app avisa si detecta TA, FUM, G2P1, c/8h, etc.
- **5.11, sin enmendaduras** y **NOM-024 6.3.4 / 6.6.2, documentos inalterables:**
  - La nota firmada queda bloqueada.
  - Las correcciones se agregan como **adenda**, que tampoco se puede editar.
- **5.4:** conservar el expediente **5 años desde el último acto médico**.
  - No se borran pacientes ni notas firmadas.
  - Se registra `ultimoActoMedico`.
- **5.9 / 5.10:** cada nota lleva nombre, edad, sexo y número de expediente del paciente; fecha y hora; nombre, cédula y firma de quien la elabora.
- **5.2.1:** tipo, nombre y domicilio del establecimiento.
- **NOM-024 6.6.1:** trazabilidad, con una bitácora de solo agregar.
- **NOM-024 6.6.3:** usuario y contraseña; se *recomienda* segundo factor.
- **NOM-024 6.6.4:** autorización por roles. Hoy solo existe el rol del médico dueño de sus datos.
- **NOM-024 6.6.6:** exportar la información del paciente.
- **NOM-024 1.2:** obliga también a quien **desarrolla o comercializa** el sistema, o sea, a Code-Reset.
  - El capítulo 7 describe la **certificación** ante la DGIS: dictamen de verificación y certificado con vigencia de 2 años.
  - Pendiente: decisión legal con el doctor o un abogado.
- **Consentimiento informado (10.1):** obligatorio para cirugía mayor, anestesia y salpingoclasia, con 2 testigos. **No está construido.** Candidato a módulo futuro.
- Notas de hospitalización (8.x): fuera de alcance. Normalmente las elabora el hospital.

### Legal (no lo resuelven las normas)
- **Firma (5.10):** autógrafa, electrónica o digital "según disposiciones jurídicas".
  - Hoy la app hace un cierre electrónico y la hoja impresa trae línea para firma autógrafa.
  - Pendiente decidir si se integra la **e.firma del SAT**.
- **LFPDPPP:** los datos de salud son sensibles. Hace falta aviso de privacidad y consentimiento de cada paciente.

---

## 4. Decisiones técnicas tomadas

| Tema | Decisión | Por qué |
|---|---|---|
| Stack | Plantilla Code-Reset: HTML + CSS + JS puro con módulos ES6, sin build, router por hash, PWA | Regla fija del `CLAUDE.md` de Angel |
| Dónde se guardan los datos | **Firestore** (opción B), no IndexedDB local | Evita perder 5 años de expedientes si se rompe el equipo; multi-equipo (iPhone + PC) |
| Seguridad | Reglas de Firestore como la defensa real, con pruebas | Lección de un proyecto anterior: una función de permisos que existe pero no se llama no protege |
| Formularios | Generados desde `js/formatos-nom004.js`, con el numeral de la norma en cada campo | Cambiar o agregar un campo = editar un archivo |
| Firma | Copia ("congela") en la nota los datos del paciente, del médico y del establecimiento | Si después cambia la ficha, la nota firmada conserva lo de ese día |
| Dictado fase 1 | `SpeechRecognition` del navegador, `es-MX`, campo por campo | Gratis. Necesita internet y funciona mejor en Chrome |
| Dictado fase 2 | Claude vía un **intermediario** (Cloudflare Worker) | La API key nunca va en el front-end |
| PDF | jsPDF 4.2.1 **dentro del repo** (`js/vendor/`, MIT) | Funciona sin internet; texto real con acentos. Las versiones 2.5.x tienen vulnerabilidades |
| Guardar en iPhone | Web Share API con archivo (Guardar en Archivos, AirDrop, WhatsApp); descarga en PC | Las descargas de blob en una PWA instalada en iOS son problemáticas |
| Diseño | Estilo iOS: colores del sistema, claro y oscuro automático, barra de pestañas inferior, letra del sistema, sin Google Fonts | Pedido de Angel; carga más rápido y funciona offline |
| Papel | Tamaño carta | Estándar en México |

Modelo de Claude para la fase 2: `claude-sonnet-5-5` (o `claude-haiku-5-5`, más barato). **Los precios del resumen de Angel no se verificaron**; revisarlos en la página de precios de Anthropic antes de cotizar.

---

## 5. Lo construido (rama `ccr-fc4ae847-lekgjq`)

### Commits
```
672de1f Encabezado de notas: "Teléfono" en lugar de "Tel."
a3ababb Login: nombre completo del doctor y Colposcopia
554d55c Dictado: el texto reconocido va en su propio renglón
79d0ad0 Mostrar siempre el micrófono y explicar cuando no se puede dictar
3e00972 Quitar el logo (reloj) de Code-Reset del login
19298d7 Guardar e imprimir el expediente; foto del doctor en el login
d712f9e Diseño estilo iOS para iPhone e ícono nuevo de la app
ef695c2 Fase 1: expediente clínico conforme a NOM-004 y NOM-024
aba52a1 Agregar requisitos de la NOM-004-SSA3-2012 mapeados a campos de la app
ab6f687 Agregar prueba-dictado.html: dictado por campo con diagnóstico
6f307f3 Initial commit
```

### Estructura
```
index.html               login (foto, nombre, especialidad, créditos) + shell (barra superior + pestañas)
manifest.json            PWA: "Expediente", íconos 180/192/512
service-worker.js        caché del shell; CACHE_VERSION = "expediente-v5" (subir en cada cambio base)
css/styles.css           estilo iOS, claro/oscuro, impresión (@page carta)
assets/app-icon.svg      ícono fuente (expediente + cruz + micrófono); PNG generados de él
assets/icon-180/192/512.png
assets/dr-armando.jpg    foto del login
assets/logo.svg          logo Code-Reset (ya no se usa en la app)
js/firebase-config.js    config Firebase (PLACEHOLDER) + modo emulador solo en localhost con ?emulador
js/auth.js               login/logout con Firebase Auth
js/router.js             rutas #/modulo/param; MODULES con íconos; guardia de cambios sin guardar
js/db.js                 todo el acceso a Firestore
js/formatos-nom004.js    campos de cada formato con numeral; ficha; perfil; entidades INEGI; vías de administración; CURP_RE; validación; detector de abreviaturas
js/formulario.js         pinta y lee formularios; vista de solo lectura; texto plano para PDF
js/dictado.js            dictado por campo; botón 🎤 siempre visible; explica si no hay dictado
js/documento-expediente.js  PDF (jsPDF) e impresión del expediente o de una nota
js/util.js               esc() contra XSS, fechas, edad, avisos
js/modules/dashboard.js       Inicio
js/modules/pacientes.js       lista y búsqueda
js/modules/paciente.js        alta/edición de ficha; expediente; botones Guardar/Imprimir; exportar JSON
js/modules/nota.js            editor (borrador, autoguardado, firma) y vista firmada (adendas, PDF, imprimir)
js/modules/configuracion.js   "Consultorio": datos del médico y del establecimiento
js/vendor/jspdf-4.2.1.umd.min.js (+ licencia)
firestore.rules          reglas de seguridad
firebase.json            config del emulador (firestore 8080, auth 9099)
tests/rules.test.mjs     16 pruebas de reglas (emulador)
tests/package.json       solo para pruebas; la app no usa npm
prueba-dictado.html      página aislada para probar el micrófono, con diagnóstico
docs/requisitos-nom-004.md  lectura de NOM-004 y NOM-024 → campos
README.md
```

### Modelo de datos en Firestore
```
medicos/{uid}                                   perfil: nombreMedico, cedula, especialidad, cedulaEspecialidad,
                                                tipo/nombre/domicilio/telefonoEstablecimiento, institucion, razonSocial,
                                                siguienteExpediente (contador, solo sube)
medicos/{uid}/pacientes/{pid}                   ficha + numeroExpediente (inmutable) + ultimoActoMedico
medicos/{uid}/pacientes/{pid}/notas/{nid}       tipo: historia_clinica | evolucion; estado: borrador | firmada;
                                                campos{}; al firmar: firmadaEn (hora servidor), paciente{}, firma{}, establecimiento{}
.../notas/{nid}/adendas/{aid}                   texto, autor{uid,nombre,cedula}, creadaEn
medicos/{uid}/bitacora/{id}                     accion, uid, fecha (hora servidor), ids
```

### Reglas (`firestore.rules`), cubiertas por las 16 pruebas
- Solo el dueño (`request.auth.uid == uid`) lee o escribe bajo `medicos/{uid}`. `esDueno()` se llama en todas las reglas.
- Pacientes: no se borran; `numeroExpediente` y `creadoEn` no cambian.
- Notas:
  - se crean solo como borrador;
  - solo un borrador se edita o borra;
  - al firmar exigen `firmadaEn == request.time` y `firma.uid == auth.uid`;
  - una nota firmada no cambia ni se borra.
- Adendas: solo en notas firmadas, con hora del servidor y autor = usuario; no se editan ni se borran.
- Bitácora: solo crear, con hora del servidor; no se edita ni se borra.
- El contador de expedientes no retrocede.
- Limitación conocida: la bitácora la escribe el cliente. Para que no se pueda manipular haría falta Cloud Functions (plan Blaze).

### Formatos
- **Ficha del paciente:** nombre, apellidos, CURP (formato validado), sexo M/H, fecha de nacimiento, entidad de nacimiento, nacionalidad, domicilio, código postal, entidad/municipio/localidad de residencia, teléfono, grupo étnico, lengua indígena, estado civil, ocupación, escolaridad.
- **Historia clínica (6.1, en orden):**
  - Interrogatorio (antecedentes heredo-familiares, patológicos, tabaco/alcohol/otras sustancias, no patológicos).
  - Antecedentes gineco-obstétricos (5.14).
  - Padecimiento actual y tratamientos previos.
  - Interrogatorio por aparatos y sistemas.
  - Habitus exterior.
  - Signos vitales, peso y talla.
  - Exploración por regiones.
  - Resultados de estudios.
  - Diagnósticos.
  - Pronóstico.
  - Indicación terapéutica: medicamentos (nombre/dosis/vía/periodicidad/duración) e indicaciones.
- **Nota de evolución (6.2):** evolución, sustancias (en su caso), signos vitales (opcionales), control prenatal (opcional: semanas de gestación, fondo uterino, frecuencia cardiaca fetal, movimientos fetales), estudios, diagnósticos, pronóstico, tratamiento.

### Guardar e imprimir
- PDF con:
  - portada: ficha de identificación e **índice de documentos** (lo evalúa el Apéndice A de la NOM-004);
  - cada nota firmada en su propia página, con adendas;
  - pie de página con paciente, número de expediente, "Confidencial" y "Página x de y".
- Los **borradores no se incluyen**.
- Imprimir: hoja blanca, una nota por página, con línea para firma autógrafa.
- También existen "Guardar PDF" e "Imprimir" en cada nota firmada.
- Exportar JSON (NOM-024 6.6.6) como enlace secundario.

---

## 6. Pruebas realizadas (todas en contenedor; nada en dispositivos reales)

- Reglas de Firestore: **16/16** en el emulador (`cd tests && npm install && npm test`, requiere Java).
- Prueba completa contra emuladores de Auth y Firestore con Playwright, sin errores:
  - login, consultorio, paciente, historia clínica, nota de evolución con medicamento, firma y adenda;
  - búsqueda;
  - prueba de XSS: un nombre con `<img onerror>` se muestra como texto;
  - sin scroll horizontal en iPhone 13 (390 px), en claro y oscuro.
- PDF verificado con `pdftotext`: acentos, ñ y ¿? correctos; 5–6 páginas; nombre de archivo `Expediente-EXP-00001-Apellido-Nombre.pdf`.
- **No probado:**
  - Dictado con voz real.
  - Safari en iPhone real, Samsung Internet, instalación como PWA.
  - Hoja de Compartir de iOS.
  - CDN real de Firebase: `www.gstatic.com` estaba bloqueado en el contenedor; se probó con los mismos archivos 10.12.2 de npm.

Para correr la app contra emuladores:
```
firebase emulators:start --only firestore,auth --project demo-expediente
python3 -m http.server 5173      # desde la raíz del repo
# abrir http://localhost:5173/?emulador
```

---

## 7. Artefactos publicados (privados, cuenta de Angel)

| Qué | Liga | Notas |
|---|---|---|
| **Demo** de la app | https://claude.ai/artifact/HjyRzhkqEXKFVqANYFZq3d | Copia de la app con una base de datos de ejemplo en `localStorage` (clave `expediente-demo-v4`). Login con cualquier dato. En la demo: micrófono bloqueado (el 🎤 lo explica), Guardar/Imprimir muestran vista previa, `confirm()` siempre acepta. Datos reales del doctor y del consultorio; pacientes de ejemplo. |
| **Informe de avance** (doc) | https://claude.ai/artifact/GJ1frWRqsxwRqQBou1v8Tp | 6 secciones con capturas reales; exportado a PDF carta de 6 páginas (`Informe-Expediente-Clinico-Dr-de-la-Fuente.pdf`). |

Cómo se arma la demo:
- Copiar `css/ js/ assets/`.
- Reemplazar `firebase-config.js`, `auth.js` y `db.js` por versiones demo.
- En `documento-expediente.js`, agregar al inicio de `entregarPDF`: `if (window.__DEMO__) { imprimir(datos, uid); return "demo"; }`.
- Quitar del `index.html` el doctype/head/body y el registro del service worker.
- Agregar al CSS los bloques `[data-theme]`.

La demo está en la carpeta `demo/` del repo (ver `demo/README.md`) y se publica con Pages en `/demo/`.

---

## 8. Errores encontrados y corregidos en el camino
- **De la plantilla Code-Reset (afecta a todos los proyectos):** `#login-screen { display:flex }` le ganaba al atributo `hidden`, y el login seguía visible detrás de la app y en la impresión. Arreglo: `[hidden] { display: none !important; }`. **Pasar a la plantilla.**
- **De la plantilla:** `initRouter` agregaba un listener de `hashchange` en cada login, así que se duplicaba. Ya está corregido.
- Los botones 🎤 no aparecían (sin aviso) si el navegador no traía reconocimiento de voz. Ahora siempre aparecen y explican el motivo.
- El texto que se iba reconociendo apretaba el campo hasta dejarlo angosto en el iPhone. Ahora va en su propio renglón.
- "Tel." en el encabezado → "Teléfono" (5.11).

---

## 9. Pendientes

### Para publicar (Code-Reset)
1. Repo público: hecho (`Code-RESET/Adela-fte`, código en `main`).
2. Pages: Settings → Pages → Deploy from a branch → `main` → `/(root)`.
   App: `https://code-reset.github.io/Adela-fte/` · Demo: `https://code-reset.github.io/Adela-fte/demo/`.
3. Crear el proyecto Firebase y pegar el `firebaseConfig` real en `js/firebase-config.js`. No es secreto.
4. Activar Auth correo/contraseña, crear la cuenta del doctor y publicar las reglas: `firebase deploy --only firestore:rules`.
5. Probar en el iPhone del doctor: `prueba-dictado.html` en Safari **y** como app instalada. Hay reportes de que iOS limita SpeechRecognition en PWAs instaladas; si falla, usar el micrófono del teclado del iPhone como respaldo.
6. CORS del Worker de la fase 2: `https://code-reset.github.io`.

### Del doctor
- Confirmar cuál cédula es la profesional y cuál la de especialidad.
- Confirmar el encabezado de las notas (nombre, domicilio, teléfono).
- Aviso de privacidad y consentimiento de pacientes (LFPDPPP).
- Decidir firma: impresa y firmada a mano, o e.firma del SAT.
- Probar el dictado en consulta real y pedir ajustes de campos.

### Seguridad / repo público
- Nombres de otros clientes ligados a fallas: ya se quitaron del código y de este documento.
  Siguen en `CLAUDE.md`, que viene igual de la plantilla pública `code-reset-boilerplate`;
  es archivo de Angel: quitarlos ahí (y en la plantilla) solo si él lo pide.
- La foto del doctor queda pública si el repo es público.
- El correo de Angel aparece como autor en los commits. Opción: correo `noreply` de GitHub.
- `CLAUDE.md` pide "logo pequeño" en el login, pero Angel pidió quitarlo en este proyecto. Ofrecí actualizar la regla y no hubo respuesta.

### Funcionalidad futura
- **Fase 2:** dictado libre con Claude a través de un Cloudflare Worker. Claude devuelve JSON por campo; el doctor revisa y firma.
- Segundo factor de autenticación (Identity Platform).
- Catálogo CIE-10 para diagnósticos y Cuadro Básico para medicamentos.
- Consentimiento informado (NOM-004 10.1).
- Roles (asistente/recepción) si se necesitan.
- Notas de interconsulta y referencia (6.3, 6.4).
- Bitácora del lado del servidor (Cloud Functions).
- Respaldo/exportación periódica.

### Del plan comercial (resumen original de Angel, sin cambios)
- Fases: 1) formulario NOM-004 + dictado por campo, 2–3 semanas; 2) dictado con IA, 2–4 semanas; 3) pruebas en consultorio, 1–2 semanas. Al doctor: unos 2 meses.
- Precio sugerido, pendiente de que Angel lo defina:
  - Fase 1: $12,000–15,000 MXN.
  - Fase 2: $15,000–20,000 MXN.
  - Soporte: $800–1,200/mes.
  - Anticipo del 50 % por fase.

---

## 10. Notas para quien continúe
- Responder en español, explicar brevemente el "por qué" de cada decisión técnica (estilo de trabajo con Angel).
- No cambiar el stack sin que Angel lo pida.
- Al tocar archivos base, subir `CACHE_VERSION` en `service-worker.js`.
- Al agregar un módulo: copiar uno de `js/modules/`, escribir su `render(container, user, params)` y registrarlo en `MODULES` de `js/router.js`. Los módulos ocultos llevan `menu:false`.
- Al agregar o mover un campo de la norma: editar `js/formatos-nom004.js`. Formulario, validación, vista firmada y PDF lo toman solos.
- Todo dato que se pinte con `innerHTML` pasa por `esc()`.
- Mantener las 16 pruebas de reglas en verde y agregar una por cada regla nueva.

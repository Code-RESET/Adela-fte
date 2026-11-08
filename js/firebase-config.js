// ============================================================
// firebase-config.js
// Reemplazar DEFAULT_FB_CONFIG con las credenciales del proyecto
// Firebase de este cliente específico. Se deja embebido directo
// en el código (no solo en localStorage) porque en un proyecto anterior se
// detectó que localStorage se puede perder con actualizaciones
// del sistema operativo del teléfono.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DEFAULT_FB_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};

// Modo pruebas: SOLO en localhost y con ?emulador en la URL se conecta a
// los emuladores locales de Firebase (firebase emulators:start). En el
// sitio publicado esta condición nunca se cumple.
const USAR_EMULADOR =
  ["localhost", "127.0.0.1"].includes(location.hostname) &&
  new URLSearchParams(location.search).has("emulador");

const app = initializeApp(
  USAR_EMULADOR ? { ...DEFAULT_FB_CONFIG, apiKey: "demo", projectId: "demo-expediente" } : DEFAULT_FB_CONFIG
);

// Persistencia de almacenamiento local (evita que iOS/Android
// limpien datos en bajo almacenamiento).
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

export const auth = getAuth(app);
export const db = getFirestore(app);

if (USAR_EMULADOR) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  console.warn("Firebase: usando EMULADORES locales.");
}

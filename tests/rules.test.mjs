// Pruebas de firestore.rules con el emulador de Firestore.
// Correr:  cd tests && npm install && npm test   (requiere Java)
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp,
} from "firebase/firestore";

let env;
const DR = "doctor1";
const OTRO = "intruso";

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-expediente",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});
after(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

const dbDe = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const paciente = { nombre: "Ana", primerApellido: "López", sexo: "M", fechaNacimiento: "1990-01-01", domicilio: "x", numeroExpediente: 1 };
const firma = (uid = DR) => ({
  estado: "firmada", firmadaEn: serverTimestamp(),
  firma: { uid, nombre: "Dr. Prueba", cedula: "123" },
  paciente: { nombreCompleto: "Ana López", edad: 35, sexo: "M", numeroExpediente: 1 },
});

// Prepara: paciente + nota en borrador (sin pasar por reglas).
async function semilla({ firmada = false } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, `medicos/${DR}`), { nombreMedico: "Dr. Prueba", siguienteExpediente: 2 });
    await setDoc(doc(d, `medicos/${DR}/pacientes/p1`), paciente);
    await setDoc(doc(d, `medicos/${DR}/pacientes/p1/notas/n1`), {
      tipo: "evolucion", estado: firmada ? "firmada" : "borrador", campos: { evolucion: "x" },
      creadaEn: new Date(), ...(firmada ? { firmadaEn: new Date(), firma: { uid: DR, nombre: "Dr", cedula: "1" } } : {}),
    });
  });
}

// ---------- Aislamiento ----------
test("sin sesión no se lee nada", async () => {
  await semilla();
  await assertFails(getDoc(doc(anon(), `medicos/${DR}/pacientes/p1`)));
});

test("otro usuario NO lee ni escribe pacientes del doctor", async () => {
  await semilla();
  const d = dbDe(OTRO);
  await assertFails(getDoc(doc(d, `medicos/${DR}`)));
  await assertFails(getDoc(doc(d, `medicos/${DR}/pacientes/p1`)));
  await assertFails(getDoc(doc(d, `medicos/${DR}/pacientes/p1/notas/n1`)));
  await assertFails(setDoc(doc(d, `medicos/${DR}/pacientes/p2`), paciente));
  await assertFails(updateDoc(doc(d, `medicos/${DR}/pacientes/p1/notas/n1`), { campos: { evolucion: "hack" } }));
});

test("el doctor lee y crea sus pacientes", async () => {
  await semilla();
  const d = dbDe(DR);
  await assertSucceeds(getDoc(doc(d, `medicos/${DR}/pacientes/p1`)));
  await assertSucceeds(setDoc(doc(d, `medicos/${DR}/pacientes/p2`), { ...paciente, numeroExpediente: 2 }));
});

// ---------- Pacientes ----------
test("no se puede cambiar el número de expediente", async () => {
  await semilla();
  await assertFails(updateDoc(doc(dbDe(DR), `medicos/${DR}/pacientes/p1`), { numeroExpediente: 99 }));
  await assertSucceeds(updateDoc(doc(dbDe(DR), `medicos/${DR}/pacientes/p1`), { domicilio: "nuevo" }));
});

test("no se puede borrar un paciente (conservación 5 años)", async () => {
  await semilla();
  await assertFails(deleteDoc(doc(dbDe(DR), `medicos/${DR}/pacientes/p1`)));
});

test("el contador de expedientes no puede retroceder", async () => {
  await semilla();
  await assertFails(updateDoc(doc(dbDe(DR), `medicos/${DR}`), { siguienteExpediente: 1 }));
  await assertSucceeds(updateDoc(doc(dbDe(DR), `medicos/${DR}`), { siguienteExpediente: 3 }));
});

// ---------- Notas ----------
test("crear nota solo como borrador", async () => {
  await semilla();
  const col = collection(dbDe(DR), `medicos/${DR}/pacientes/p1/notas`);
  await assertSucceeds(addDoc(col, { tipo: "evolucion", estado: "borrador", campos: {}, creadaEn: serverTimestamp() }));
  await assertFails(addDoc(col, { tipo: "evolucion", ...firma(), campos: {} }));
  await assertFails(addDoc(col, { tipo: "receta_falsa", estado: "borrador", campos: {} }));
});

test("borrador se edita, se firma y luego queda bloqueado", async () => {
  await semilla();
  const ref = doc(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1`);
  await assertSucceeds(updateDoc(ref, { campos: { evolucion: "mejor" } }));
  await assertSucceeds(updateDoc(ref, { campos: { evolucion: "final" }, ...firma() }));
  // Ya firmada: nada se modifica ni se borra.
  await assertFails(updateDoc(ref, { campos: { evolucion: "cambio" } }));
  await assertFails(updateDoc(ref, { estado: "borrador" }));
  await assertFails(deleteDoc(ref));
});

test("no se puede firmar con fecha inventada", async () => {
  await semilla();
  const ref = doc(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1`);
  await assertFails(updateDoc(ref, { ...firma(), firmadaEn: new Date("2020-01-01") }));
});

test("no se puede firmar a nombre de otro usuario", async () => {
  await semilla();
  const ref = doc(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1`);
  await assertFails(updateDoc(ref, firma("otro-medico")));
});

test("no se puede poner firma en un borrador sin firmarlo", async () => {
  await semilla();
  const ref = doc(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1`);
  await assertFails(updateDoc(ref, { firma: { uid: DR, nombre: "x", cedula: "1" } }));
});

test("el borrador sí se puede borrar", async () => {
  await semilla();
  await assertSucceeds(deleteDoc(doc(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1`)));
});

test("no se puede cambiar el tipo de nota", async () => {
  await semilla();
  await assertFails(updateDoc(doc(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1`), { tipo: "historia_clinica" }));
});

// ---------- Adendas ----------
test("adenda solo en nota firmada, y no se edita ni borra", async () => {
  await semilla({ firmada: true });
  const d = dbDe(DR);
  const col = collection(d, `medicos/${DR}/pacientes/p1/notas/n1/adendas`);
  const adenda = { texto: "Corrección: dosis 500 mg", autor: { uid: DR, nombre: "Dr", cedula: "1" }, creadaEn: serverTimestamp() };
  const r = await assertSucceeds(addDoc(col, adenda));
  await assertFails(updateDoc(r, { texto: "otro" }));
  await assertFails(deleteDoc(r));
  await assertFails(addDoc(col, { ...adenda, autor: { uid: OTRO } }));
  await assertFails(addDoc(col, { ...adenda, texto: "" }));
});

test("no se agrega adenda a un borrador", async () => {
  await semilla();
  const col = collection(dbDe(DR), `medicos/${DR}/pacientes/p1/notas/n1/adendas`);
  await assertFails(addDoc(col, { texto: "x", autor: { uid: DR }, creadaEn: serverTimestamp() }));
});

// ---------- Bitácora ----------
test("bitácora: solo agregar, con hora del servidor", async () => {
  await semilla();
  const col = collection(dbDe(DR), `medicos/${DR}/bitacora`);
  const r = await assertSucceeds(addDoc(col, { accion: "x", uid: DR, fecha: serverTimestamp() }));
  await assertFails(updateDoc(r, { accion: "y" }));
  await assertFails(deleteDoc(r));
  await assertFails(addDoc(col, { accion: "x", uid: DR, fecha: new Date("2020-01-01") }));
  await assertFails(addDoc(collection(dbDe(OTRO), `medicos/${DR}/bitacora`), { accion: "x", uid: OTRO, fecha: serverTimestamp() }));
});

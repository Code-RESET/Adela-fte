// ============================================================
// db.js
// Todo el acceso a Firestore del expediente vive aquí, para que
// las reglas (firestore.rules) y el código se lean juntos.
//
// Estructura (todo cuelga del UID del médico):
//   medicos/{uid}                         perfil del médico y del consultorio
//   medicos/{uid}/pacientes/{pid}         ficha de identificación
//   medicos/{uid}/pacientes/{pid}/notas/{nid}             historia clínica / nota de evolución
//   medicos/{uid}/pacientes/{pid}/notas/{nid}/adendas/{aid} correcciones a notas firmadas
//   medicos/{uid}/bitacora/{id}           registro de auditoría (NOM-024 6.6.1)
//
// Reglas de la norma que se cumplen aquí y en firestore.rules:
//  - Una nota FIRMADA no se puede modificar ni borrar (NOM-004 5.11,
//    NOM-024 6.3.4 "documentos inalterables"). Se corrige con adenda.
//  - Pacientes y notas firmadas no se borran (conservación 5 años, NOM-004 5.4).
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  collection, getDocs, query, orderBy,
  serverTimestamp, runTransaction, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { edad, nombreCompleto } from "./util.js";

const medicoRef = (uid) => doc(db, "medicos", uid);
const pacientesCol = (uid) => collection(db, "medicos", uid, "pacientes");
const pacienteRef = (uid, pid) => doc(db, "medicos", uid, "pacientes", pid);
const notasCol = (uid, pid) => collection(db, "medicos", uid, "pacientes", pid, "notas");
const notaRef = (uid, pid, nid) => doc(db, "medicos", uid, "pacientes", pid, "notas", nid);
const adendasCol = (uid, pid, nid) => collection(db, "medicos", uid, "pacientes", pid, "notas", nid, "adendas");
const bitacoraCol = (uid) => collection(db, "medicos", uid, "bitacora");

// ---------------- Bitácora (trazabilidad) ----------------
// Solo se puede AGREGAR; las reglas impiden editar o borrar.
export async function registrar(uid, accion, detalle = {}) {
  try {
    await addDoc(bitacoraCol(uid), { accion, ...detalle, uid, fecha: serverTimestamp() });
  } catch (e) {
    console.warn("No se pudo registrar en bitácora:", e);
  }
}

// ---------------- Perfil del médico / consultorio ----------------
export async function leerPerfil(uid) {
  const s = await getDoc(medicoRef(uid));
  return s.exists() ? s.data() : {};
}

export async function guardarPerfil(uid, datos) {
  const limpio = { ...datos };
  delete limpio.siguienteExpediente; // el contador solo lo mueve crearPaciente()
  await setDoc(medicoRef(uid), { ...limpio, actualizadoEn: serverTimestamp() }, { merge: true });
  await registrar(uid, "perfil_actualizado");
}

// ---------------- Pacientes ----------------
export async function listarPacientes(uid) {
  const s = await getDocs(query(pacientesCol(uid), orderBy("primerApellido")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function leerPaciente(uid, pid) {
  const s = await getDoc(pacienteRef(uid, pid));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// Crea el paciente con número de expediente consecutivo (transacción:
// dos altas al mismo tiempo nunca reciben el mismo número).
export async function crearPaciente(uid, datos) {
  const nuevoRef = doc(pacientesCol(uid));
  await runTransaction(db, async (tx) => {
    const m = await tx.get(medicoRef(uid));
    const n = (m.exists() && m.data().siguienteExpediente) || 1;
    tx.set(medicoRef(uid), { siguienteExpediente: n + 1 }, { merge: true });
    tx.set(nuevoRef, {
      ...datos,
      numeroExpediente: n,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  });
  await registrar(uid, "paciente_creado", { pacienteId: nuevoRef.id });
  return nuevoRef.id;
}

export async function actualizarPaciente(uid, pid, datos) {
  const limpio = { ...datos };
  delete limpio.numeroExpediente; // inmutable (también lo bloquean las reglas)
  delete limpio.creadoEn;
  delete limpio.id;
  await updateDoc(pacienteRef(uid, pid), { ...limpio, actualizadoEn: serverTimestamp() });
  await registrar(uid, "paciente_actualizado", { pacienteId: pid });
}

// ---------------- Notas ----------------
export async function listarNotas(uid, pid) {
  const s = await getDocs(query(notasCol(uid, pid), orderBy("creadaEn", "desc")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function leerNota(uid, pid, nid) {
  const s = await getDoc(notaRef(uid, pid, nid));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function crearNota(uid, pid, tipo) {
  const r = await addDoc(notasCol(uid, pid), {
    tipo,
    estado: "borrador",
    campos: {},
    creadaEn: serverTimestamp(),
    actualizadaEn: serverTimestamp(),
  });
  await registrar(uid, "nota_creada", { pacienteId: pid, notaId: r.id, tipo });
  return r.id;
}

export async function guardarBorrador(uid, pid, nid, campos) {
  await updateDoc(notaRef(uid, pid, nid), { campos, actualizadaEn: serverTimestamp() });
}

export async function borrarBorrador(uid, pid, nid) {
  await deleteDoc(notaRef(uid, pid, nid));
  await registrar(uid, "borrador_eliminado", { pacienteId: pid, notaId: nid });
}

// Firma: congela en la nota los datos que exige la NOM-004 (5.9, 5.10):
// nombre, edad, sexo y expediente del paciente; nombre y cédula de quien
// la elabora; datos del establecimiento (5.2.1). Después de esto la nota
// ya no se puede cambiar.
export async function firmarNota(uid, pid, nid, campos, paciente, perfil) {
  const ahora = new Date();
  const batch = writeBatch(db);
  batch.update(notaRef(uid, pid, nid), {
    campos,
    estado: "firmada",
    firmadaEn: serverTimestamp(),
    actualizadaEn: serverTimestamp(),
    paciente: {
      nombreCompleto: nombreCompleto(paciente),
      edad: edad(paciente.fechaNacimiento, ahora),
      sexo: paciente.sexo,
      fechaNacimiento: paciente.fechaNacimiento,
      numeroExpediente: paciente.numeroExpediente,
      curp: paciente.curp || "",
      domicilio: paciente.domicilio || "",
      grupoEtnico: paciente.grupoEtnico || "",
      ocupacion: paciente.ocupacion || "",
      estadoCivil: paciente.estadoCivil || "",
      escolaridad: paciente.escolaridad || "",
    },
    firma: {
      uid,
      nombre: perfil.nombreMedico,
      cedula: perfil.cedula,
      especialidad: perfil.especialidad || "",
      cedulaEspecialidad: perfil.cedulaEspecialidad || "",
    },
    establecimiento: {
      tipo: perfil.tipoEstablecimiento,
      nombre: perfil.nombreEstablecimiento,
      domicilio: perfil.domicilioEstablecimiento,
      institucion: perfil.institucion || "",
      razonSocial: perfil.razonSocial || "",
      telefono: perfil.telefonoEstablecimiento || "",
    },
  });
  // Fecha del último acto médico: desde aquí corren los 5 años (5.4).
  batch.update(pacienteRef(uid, pid), { ultimoActoMedico: serverTimestamp() });
  await batch.commit();
  await registrar(uid, "nota_firmada", { pacienteId: pid, notaId: nid });
}

// ---------------- Adendas ----------------
export async function listarAdendas(uid, pid, nid) {
  const s = await getDocs(query(adendasCol(uid, pid, nid), orderBy("creadaEn")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function agregarAdenda(uid, pid, nid, texto, perfil) {
  const r = await addDoc(adendasCol(uid, pid, nid), {
    texto,
    autor: { uid, nombre: perfil.nombreMedico, cedula: perfil.cedula },
    creadaEn: serverTimestamp(),
  });
  await registrar(uid, "adenda_agregada", { pacienteId: pid, notaId: nid, adendaId: r.id });
}

// ---------------- Exportación (NOM-024 6.6.6) ----------------
export async function exportarExpediente(uid, pid) {
  const paciente = await leerPaciente(uid, pid);
  const notas = await listarNotas(uid, pid);
  for (const n of notas) n.adendas = await listarAdendas(uid, pid, n.id);
  await registrar(uid, "expediente_exportado", { pacienteId: pid });
  return { exportadoEn: new Date().toISOString(), paciente, notas };
}

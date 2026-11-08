// ============================================================
// db.js — VERSIÓN DEMO: misma API que la real, datos de ejemplo
// guardados solo en este navegador (localStorage). Nada va a la nube.
// ============================================================
const CLAVE = "expediente-demo-v4";
const ahora = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);
const copia = (o) => JSON.parse(JSON.stringify(o));
const hace = (dias, h = 10) => { const d = new Date(); d.setDate(d.getDate() - dias); d.setHours(h, 15, 0, 0); return d.toISOString(); };

function semilla() {
  const perfil = {
    nombreMedico: "Armando Alejandro de la Fuente Escandón", cedula: "647025", especialidad: "Ginecología y Obstetricia, Colposcopia",
    cedulaEspecialidad: "3394142",
    tipoEstablecimiento: "Consultorio de especialidad (consulta privada)", nombreEstablecimiento: "Corpo Med Dr. Armando Alejandro de la Fuente Escandón",
    domicilioEstablecimiento: "Avenida Allende 73 Oriente, Colonia Segundo de Cobián Centro, Código Postal 27000, Torreón, Coahuila", telefonoEstablecimiento: "871 716 3150", siguienteExpediente: 4,
  };
  const est = { tipo: perfil.tipoEstablecimiento, nombre: perfil.nombreEstablecimiento, domicilio: perfil.domicilioEstablecimiento, telefono: perfil.telefonoEstablecimiento };
  const firma = { uid: "demo", nombre: perfil.nombreMedico, cedula: perfil.cedula, especialidad: perfil.especialidad, cedulaEspecialidad: perfil.cedulaEspecialidad };
  const p1 = { id: "p1", nombre: "Paciente", primerApellido: "Ejemplo", segundoApellido: "Uno", sexo: "M", fechaNacimiento: "1992-04-18", entidadNacimiento: "05", nacionalidad: "Mexicana", domicilio: "Calle de ejemplo 123, Centro", municipioResidencia: "Torreón", entidadResidencia: "05", ocupacion: "Docente", numeroExpediente: 1, creadoEn: hace(30), ultimoActoMedico: hace(2) };
  const p2 = { id: "p2", nombre: "Paciente", primerApellido: "Ejemplo", segundoApellido: "Dos", sexo: "M", fechaNacimiento: "1985-09-03", nacionalidad: "Mexicana", domicilio: "Avenida de ejemplo 45", numeroExpediente: 2, creadoEn: hace(12) };
  const p3 = { id: "p3", nombre: "Paciente", primerApellido: "Ejemplo", segundoApellido: "Tres", sexo: "M", fechaNacimiento: "2000-01-27", nacionalidad: "Mexicana", domicilio: "Privada de ejemplo 8", numeroExpediente: 3, creadoEn: hace(1) };
  const snap = (p, edad) => ({ nombreCompleto: `${p.nombre} ${p.primerApellido} ${p.segundoApellido}`, edad, sexo: p.sexo, fechaNacimiento: p.fechaNacimiento, numeroExpediente: p.numeroExpediente, domicilio: p.domicilio, ocupacion: p.ocupacion || "" });
  const hc = {
    id: "n1", tipo: "historia_clinica", estado: "firmada", creadaEn: hace(30), firmadaEn: hace(30), paciente: snap(p1, 34), firma, establecimiento: est,
    campos: {
      antecedentesHeredofamiliares: "Madre con diabetes mellitus tipo 2. Padre con hipertensión arterial sistémica.",
      antecedentesPatologicos: "Niega enfermedades crónico-degenerativas, cirugías previas y alergias.",
      tabaco: "Niega", alcohol: "Ocasional, social", otrasSustancias: "Niega",
      antecedentesNoPatologicos: "Vivienda con todos los servicios. Esquema de vacunación completo.",
      menarca: 12, ritmoMenstrual: "Regular, cada 28 días por 5 días", fechaUltimaMenstruacion: "2026-08-20", inicioVidaSexual: 22,
      gestas: 2, partos: 1, cesareas: 0, abortos: 0, metodoPlanificacion: "Ninguno actualmente", ultimaCitologia: "Marzo de 2026, sin alteraciones",
      padecimientoActual: "Acude por retraso menstrual de seis semanas con prueba de embarazo en orina positiva. Refiere náusea matutina leve.",
      tratamientosPrevios: "Ninguno convencional, alternativo ni tradicional.",
      aparatosSistemas: "Digestivo: náusea matutina. Resto de aparatos y sistemas interrogados sin alteraciones.",
      habitusExterior: "Mujer de edad aparente a la cronológica, consciente, orientada, bien hidratada, marcha normal.",
      temperatura: 36.6, taSistolica: 110, taDiastolica: 70, frecuenciaCardiaca: 78, frecuenciaRespiratoria: 16, peso: 61.5, talla: 162,
      cabeza: "Normocéfalo, sin alteraciones.", cuello: "Tiroides no palpable, sin adenomegalias.", torax: "Campos pulmonares bien ventilados, ruidos cardiacos rítmicos. Mamas sin alteraciones.",
      abdomen: "Blando, depresible, no doloroso, útero no palpable por arriba de la sínfisis del pubis.", miembros: "Íntegros, sin edema.", genitales: "Genitales externos sin alteraciones. Cérvix cerrado, sin sangrado.",
      resultadosEstudios: "Prueba de embarazo en orina positiva. Sin otros estudios.",
      diagnosticos: "Embarazo de seis semanas por fecha de última menstruación.", pronostico: "Bueno para la madre y el producto.",
      medicamentos: [{ nombre: "Ácido fólico tabletas de 5 miligramos", dosis: "5 miligramos", via: "Oral", periodicidad: "Cada 24 horas", duracion: "Durante el primer trimestre" }],
      indicaciones: "Solicitar biometría hemática, química sanguínea, examen general de orina y ultrasonido obstétrico. Cita en cuatro semanas.",
    },
  };
  const ev = {
    id: "n2", tipo: "evolucion", estado: "firmada", creadaEn: hace(2), firmadaEn: hace(2), paciente: snap(p1, 34), firma, establecimiento: est,
    campos: {
      evolucion: "Evoluciona favorablemente. Disminuyó la náusea. Niega sangrado transvaginal y dolor abdominal.",
      temperatura: 36.5, taSistolica: 108, taDiastolica: 68, frecuenciaCardiaca: 76, frecuenciaRespiratoria: 16, peso: 62.3, talla: 162,
      semanasGestacion: 10, frecuenciaCardiacaFetal: 160,
      resultadosEstudios: "Ultrasonido obstétrico: embarazo intrauterino único, vivo, de diez semanas. Laboratorios dentro de parámetros normales.",
      diagnosticos: "Embarazo de diez semanas normoevolutivo.", pronostico: "Bueno para la madre y el producto.",
      medicamentos: [{ nombre: "Ácido fólico tabletas de 5 miligramos", dosis: "5 miligramos", via: "Oral", periodicidad: "Cada 24 horas", duracion: "Continuar" }],
      indicaciones: "Cita en cuatro semanas. Acudir a urgencias si presenta sangrado o dolor abdominal.",
    },
  };
  const borrador = { id: "n3", tipo: "historia_clinica", estado: "borrador", creadaEn: hace(1), campos: { padecimientoActual: "Acude a revisión ginecológica anual." } };
  return {
    perfil,
    pacientes: { p1, p2, p3 },
    notas: { p1: { n1: hc, n2: ev }, p3: { n3: borrador } },
    adendas: { n1: [{ id: "a1", texto: "Se agrega: la paciente refiere alergia a la penicilina, no mencionada en la primera consulta.", autor: { uid: "demo", nombre: firma.nombre, cedula: firma.cedula }, creadaEn: hace(29) }] },
    bitacora: [],
  };
}

let mem;
function leer() {
  if (mem) return mem;
  try { mem = JSON.parse(localStorage.getItem(CLAVE)); } catch { mem = null; }
  if (!mem) mem = semilla();
  return mem;
}
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(mem)); } catch {} }

export async function registrar(_uid, accion, detalle = {}) { leer().bitacora.push({ accion, ...detalle, fecha: ahora() }); guardar(); }
export async function leerPerfil() { return copia(leer().perfil); }
export async function guardarPerfil(_uid, datos) { Object.assign(leer().perfil, datos); guardar(); }
export async function listarPacientes() {
  return copia(Object.values(leer().pacientes)).sort((a, b) => String(a.primerApellido).localeCompare(b.primerApellido) || a.numeroExpediente - b.numeroExpediente);
}
export async function leerPaciente(_uid, pid) { const p = leer().pacientes[pid]; return p ? copia(p) : null; }
export async function crearPaciente(_uid, datos) {
  const s = leer(); const pid = id();
  s.pacientes[pid] = { ...datos, id: pid, numeroExpediente: s.perfil.siguienteExpediente++, creadoEn: ahora() };
  guardar(); return pid;
}
export async function actualizarPaciente(_uid, pid, datos) { const d = { ...datos }; delete d.numeroExpediente; Object.assign(leer().pacientes[pid], d); guardar(); }
export async function listarNotas(_uid, pid) {
  return copia(Object.values(leer().notas[pid] || {})).sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn));
}
export async function leerNota(_uid, pid, nid) { const n = leer().notas[pid]?.[nid]; return n ? copia(n) : null; }
export async function crearNota(_uid, pid, tipo) {
  const s = leer(); const nid = id();
  (s.notas[pid] ||= {})[nid] = { id: nid, tipo, estado: "borrador", campos: {}, creadaEn: ahora() };
  guardar(); return nid;
}
export async function guardarBorrador(_uid, pid, nid, campos) {
  const n = leer().notas[pid][nid]; if (n.estado !== "borrador") throw new Error("La nota ya está firmada."); n.campos = campos; guardar();
}
export async function borrarBorrador(_uid, pid, nid) {
  const s = leer(); if (s.notas[pid][nid].estado !== "borrador") throw new Error("No se puede borrar una nota firmada."); delete s.notas[pid][nid]; guardar();
}
export async function firmarNota(_uid, pid, nid, campos, paciente, perfil) {
  const s = leer(); const n = s.notas[pid][nid];
  if (n.estado !== "borrador") throw new Error("La nota ya está firmada.");
  const nac = new Date(paciente.fechaNacimiento + "T00:00:00"); const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear(); if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--;
  Object.assign(n, {
    campos, estado: "firmada", firmadaEn: ahora(),
    paciente: { nombreCompleto: [paciente.nombre, paciente.primerApellido, paciente.segundoApellido].filter(Boolean).join(" "), edad, sexo: paciente.sexo, fechaNacimiento: paciente.fechaNacimiento, numeroExpediente: paciente.numeroExpediente, curp: paciente.curp || "", domicilio: paciente.domicilio || "", grupoEtnico: paciente.grupoEtnico || "", ocupacion: paciente.ocupacion || "", estadoCivil: paciente.estadoCivil || "", escolaridad: paciente.escolaridad || "" },
    firma: { uid: "demo", nombre: perfil.nombreMedico, cedula: perfil.cedula, especialidad: perfil.especialidad || "", cedulaEspecialidad: perfil.cedulaEspecialidad || "" },
    establecimiento: { tipo: perfil.tipoEstablecimiento, nombre: perfil.nombreEstablecimiento, domicilio: perfil.domicilioEstablecimiento, institucion: perfil.institucion || "", razonSocial: perfil.razonSocial || "", telefono: perfil.telefonoEstablecimiento || "" },
  });
  s.pacientes[pid].ultimoActoMedico = ahora(); guardar();
}
export async function listarAdendas(_uid, _pid, nid) { return copia(leer().adendas[nid] || []); }
export async function agregarAdenda(_uid, _pid, nid, texto, perfil) {
  (leer().adendas[nid] ||= []).push({ id: id(), texto, autor: { uid: "demo", nombre: perfil.nombreMedico, cedula: perfil.cedula }, creadaEn: ahora() }); guardar();
}
export async function exportarExpediente(_uid, pid) {
  const notas = await listarNotas(_uid, pid); for (const n of notas) n.adendas = await listarAdendas(_uid, pid, n.id);
  return { exportadoEn: ahora(), paciente: await leerPaciente(_uid, pid), notas };
}

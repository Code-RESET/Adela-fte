// ============================================================
// formatos-nom004.js
// Definición de los formatos de nota TAL CUAL los pide la
// NOM-004-SSA3-2012 (DOF 15/10/2012). Los formularios se pintan
// a partir de aquí: para agregar o mover un campo, se cambia
// este archivo y no el HTML.
//
// Cada campo:
//   id        -> nombre con el que se guarda en Firestore
//   label     -> texto en pantalla (sin abreviaturas, num. 5.11)
//   tipo      -> texto | parrafo | numero | fecha | opciones | medicamentos
//   req       -> true = obligatorio por la norma: no se puede FIRMAR vacío
//   norma     -> numeral de la NOM-004 que lo pide (se muestra al médico)
//   dictado   -> true = lleva botón de micrófono
// Ver docs/requisitos-nom-004.md para la lectura completa de la norma.
// ============================================================

const SIGNOS_VITALES = (req, norma) => ({
  titulo: "Signos vitales, peso y talla",
  norma,
  campos: [
    { id: "temperatura", label: "Temperatura (°C)", tipo: "numero", paso: "0.1", req, norma },
    { id: "taSistolica", label: "Tensión arterial sistólica (mmHg)", tipo: "numero", req, norma },
    { id: "taDiastolica", label: "Tensión arterial diastólica (mmHg)", tipo: "numero", req, norma },
    { id: "frecuenciaCardiaca", label: "Frecuencia cardiaca (latidos por minuto)", tipo: "numero", req, norma },
    { id: "frecuenciaRespiratoria", label: "Frecuencia respiratoria (respiraciones por minuto)", tipo: "numero", req, norma },
    { id: "peso", label: "Peso (kg)", tipo: "numero", paso: "0.1", req, norma },
    { id: "talla", label: "Talla (cm)", tipo: "numero", paso: "0.1", req, norma },
  ],
  columnas: true,
});

const TRATAMIENTO = (norma) => ({
  titulo: "Tratamiento e indicaciones médicas",
  norma,
  campos: [
    {
      id: "medicamentos", label: "Medicamentos", tipo: "medicamentos", norma,
      ayuda: "Por cada medicamento la norma exige como mínimo dosis, vía de administración y periodicidad.",
    },
    { id: "indicaciones", label: "Otras indicaciones médicas", tipo: "parrafo", dictado: true, norma },
  ],
  // Al menos un medicamento o una indicación.
  reqAlguno: ["medicamentos", "indicaciones"],
});

// ------------------------------------------------------------
// HISTORIA CLÍNICA — num. 6.1 (los apartados van "en el orden señalado")
// ------------------------------------------------------------
export const HISTORIA_CLINICA = {
  tipo: "historia_clinica",
  titulo: "Historia clínica",
  norma: "6.1",
  secciones: [
    {
      titulo: "Interrogatorio",
      norma: "6.1.1",
      nota: "La ficha de identificación y el grupo étnico se toman de los datos del paciente.",
      campos: [
        { id: "antecedentesHeredofamiliares", label: "Antecedentes heredo-familiares", tipo: "parrafo", req: true, dictado: true, norma: "6.1.1" },
        { id: "antecedentesPatologicos", label: "Antecedentes personales patológicos", tipo: "parrafo", req: true, dictado: true, norma: "6.1.1" },
        { id: "tabaco", label: "Uso y dependencia del tabaco", tipo: "texto", req: true, dictado: true, norma: "6.1.1" },
        { id: "alcohol", label: "Uso y dependencia del alcohol", tipo: "texto", req: true, dictado: true, norma: "6.1.1" },
        { id: "otrasSustancias", label: "Uso y dependencia de otras sustancias psicoactivas", tipo: "texto", req: true, dictado: true, norma: "6.1.1" },
        { id: "antecedentesNoPatologicos", label: "Antecedentes personales no patológicos", tipo: "parrafo", req: true, dictado: true, norma: "6.1.1" },
      ],
    },
    {
      titulo: "Antecedentes gineco-obstétricos",
      norma: "5.14",
      nota: "Requeridos por las normas de atención del embarazo, planificación familiar y cáncer cérvico-uterino a las que remite el numeral 5.14.",
      campos: [
        { id: "menarca", label: "Menarca (edad en años)", tipo: "numero", norma: "5.14" },
        { id: "ritmoMenstrual", label: "Ritmo menstrual", tipo: "texto", dictado: true, norma: "5.14" },
        { id: "fechaUltimaMenstruacion", label: "Fecha de última menstruación", tipo: "fecha", norma: "5.14" },
        { id: "inicioVidaSexual", label: "Inicio de vida sexual activa (edad en años)", tipo: "numero", norma: "5.14" },
        { id: "gestas", label: "Gestas", tipo: "numero", norma: "5.14" },
        { id: "partos", label: "Partos", tipo: "numero", norma: "5.14" },
        { id: "cesareas", label: "Cesáreas", tipo: "numero", norma: "5.14" },
        { id: "abortos", label: "Abortos", tipo: "numero", norma: "5.14" },
        { id: "metodoPlanificacion", label: "Método de planificación familiar", tipo: "texto", dictado: true, norma: "5.14" },
        { id: "ultimaCitologia", label: "Última citología cervical (fecha y resultado)", tipo: "texto", dictado: true, norma: "5.14" },
      ],
      columnas: true,
    },
    {
      titulo: "Padecimiento actual",
      norma: "6.1.1",
      campos: [
        { id: "padecimientoActual", label: "Padecimiento actual", tipo: "parrafo", req: true, dictado: true, norma: "6.1.1" },
        { id: "tratamientosPrevios", label: "Tratamientos previos (convencionales, alternativos y tradicionales)", tipo: "parrafo", req: true, dictado: true, norma: "6.1.1" },
      ],
    },
    {
      titulo: "Interrogatorio por aparatos y sistemas",
      norma: "6.1.1",
      campos: [
        { id: "aparatosSistemas", label: "Interrogatorio por aparatos y sistemas", tipo: "parrafo", req: true, dictado: true, norma: "6.1.1" },
      ],
    },
    {
      titulo: "Exploración física",
      norma: "6.1.2",
      campos: [
        { id: "habitusExterior", label: "Habitus exterior", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
      ],
    },
    SIGNOS_VITALES(true, "6.1.2"),
    {
      titulo: "Exploración por regiones",
      norma: "6.1.2",
      campos: [
        { id: "cabeza", label: "Cabeza", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
        { id: "cuello", label: "Cuello", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
        { id: "torax", label: "Tórax", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
        { id: "abdomen", label: "Abdomen", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
        { id: "miembros", label: "Miembros", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
        { id: "genitales", label: "Genitales", tipo: "parrafo", req: true, dictado: true, norma: "6.1.2" },
      ],
    },
    {
      titulo: "Resultados de estudios",
      norma: "6.1.3",
      campos: [
        { id: "resultadosEstudios", label: "Resultados previos y actuales de estudios de laboratorio, gabinete y otros", tipo: "parrafo", req: true, dictado: true, norma: "6.1.3", ayuda: "Si no hay estudios, escribirlo así." },
      ],
    },
    {
      titulo: "Diagnósticos o problemas clínicos",
      norma: "6.1.4",
      campos: [
        { id: "diagnosticos", label: "Diagnósticos o problemas clínicos", tipo: "parrafo", req: true, dictado: true, norma: "6.1.4" },
      ],
    },
    {
      titulo: "Pronóstico",
      norma: "6.1.5",
      campos: [
        { id: "pronostico", label: "Pronóstico", tipo: "parrafo", req: true, dictado: true, norma: "6.1.5" },
      ],
    },
    { ...TRATAMIENTO("6.1.6"), titulo: "Indicación terapéutica" },
  ],
};

// ------------------------------------------------------------
// NOTA DE EVOLUCIÓN — num. 6.2 (consulta subsecuente)
// ------------------------------------------------------------
export const NOTA_EVOLUCION = {
  tipo: "evolucion",
  titulo: "Nota de evolución",
  norma: "6.2",
  secciones: [
    {
      titulo: "Evolución y actualización del cuadro clínico",
      norma: "6.2.1",
      campos: [
        { id: "evolucion", label: "Evolución y actualización del cuadro clínico", tipo: "parrafo", req: true, dictado: true, norma: "6.2.1" },
        { id: "sustancias", label: "Abuso y dependencia de tabaco, alcohol u otras sustancias psicoactivas (en su caso)", tipo: "texto", dictado: true, norma: "6.2.1" },
      ],
    },
    { ...SIGNOS_VITALES(false, "6.2.2"), nota: "La norma los pide \"según se considere necesario\"." },
    {
      titulo: "Control prenatal (en su caso)",
      norma: "5.14",
      nota: "Solo si la paciente está embarazada.",
      campos: [
        { id: "semanasGestacion", label: "Semanas de gestación", tipo: "numero", paso: "0.1", norma: "5.14" },
        { id: "fondoUterino", label: "Altura del fondo uterino (cm)", tipo: "numero", paso: "0.1", norma: "5.14" },
        { id: "frecuenciaCardiacaFetal", label: "Frecuencia cardiaca fetal (latidos por minuto)", tipo: "numero", norma: "5.14" },
        { id: "movimientosFetales", label: "Movimientos fetales", tipo: "texto", dictado: true, norma: "5.14" },
      ],
      columnas: true,
    },
    {
      titulo: "Resultados de estudios",
      norma: "6.2.3",
      campos: [
        { id: "resultadosEstudios", label: "Resultados relevantes de estudios solicitados previamente", tipo: "parrafo", dictado: true, norma: "6.2.3" },
      ],
    },
    {
      titulo: "Diagnósticos o problemas clínicos",
      norma: "6.2.4",
      campos: [
        { id: "diagnosticos", label: "Diagnósticos o problemas clínicos", tipo: "parrafo", req: true, dictado: true, norma: "6.2.4" },
      ],
    },
    {
      titulo: "Pronóstico",
      norma: "6.2.5",
      campos: [
        { id: "pronostico", label: "Pronóstico", tipo: "parrafo", req: true, dictado: true, norma: "6.2.5" },
      ],
    },
    TRATAMIENTO("6.2.6"),
  ],
};

export const FORMATOS = {
  [HISTORIA_CLINICA.tipo]: HISTORIA_CLINICA,
  [NOTA_EVOLUCION.tipo]: NOTA_EVOLUCION,
};

// ------------------------------------------------------------
// Datos del paciente (ficha de identificación) — num. 5.2.3 y 6.1.1
// ------------------------------------------------------------
// Entidades federativas (catálogo INEGI, NOM-024 Apéndice A).
// "NE" = nacido en el extranjero, "00" = no disponible (NOM-024 Tabla 1).
export const ENTIDADES = [
  ["01", "Aguascalientes"], ["02", "Baja California"], ["03", "Baja California Sur"], ["04", "Campeche"],
  ["05", "Coahuila de Zaragoza"], ["06", "Colima"], ["07", "Chiapas"], ["08", "Chihuahua"],
  ["09", "Ciudad de México"], ["10", "Durango"], ["11", "Guanajuato"], ["12", "Guerrero"],
  ["13", "Hidalgo"], ["14", "Jalisco"], ["15", "México"], ["16", "Michoacán de Ocampo"],
  ["17", "Morelos"], ["18", "Nayarit"], ["19", "Nuevo León"], ["20", "Oaxaca"],
  ["21", "Puebla"], ["22", "Querétaro"], ["23", "Quintana Roo"], ["24", "San Luis Potosí"],
  ["25", "Sinaloa"], ["26", "Sonora"], ["27", "Tabasco"], ["28", "Tamaulipas"],
  ["29", "Tlaxcala"], ["30", "Veracruz de Ignacio de la Llave"], ["31", "Yucatán"], ["32", "Zacatecas"],
  ["NE", "Nacido en el extranjero"], ["00", "No disponible"],
];

// Vías de administración más usadas (catálogo del Consejo de Salubridad
// General, NOM-024 Apéndice A). "Otra" permite escribirla.
export const VIAS_ADMINISTRACION = [
  "Oral", "Sublingual", "Intramuscular", "Intravenosa", "Subcutánea", "Intradérmica",
  "Vaginal", "Rectal", "Tópica", "Transdérmica", "Inhalada", "Nasal", "Oftálmica", "Ótica", "Otra",
];

// Ficha de identificación. Combina NOM-004 (5.2.3, 6.1.1) y los datos
// mínimos de identificación de la NOM-024 (Tabla 1, num. 6.5.3).
export const FICHA_PACIENTE = [
  { id: "nombre", label: "Nombre(s)", tipo: "texto", req: true, norma: "NOM-004 5.2.3 / NOM-024 Tabla 1" },
  { id: "primerApellido", label: "Primer apellido", tipo: "texto", req: true, norma: "NOM-004 5.2.3 / NOM-024 Tabla 1" },
  { id: "segundoApellido", label: "Segundo apellido (si lo tiene)", tipo: "texto", norma: "NOM-024 Tabla 1" },
  { id: "curp", label: "CURP", tipo: "texto", norma: "NOM-024 6.5.1", ayuda: "Tal como viene en el documento del paciente. La app no la genera (NOM-024 6.5.1)." },
  { id: "sexo", label: "Sexo", tipo: "opciones", opciones: [["M", "Mujer"], ["H", "Hombre"]], req: true, norma: "NOM-004 5.2.3 / NOM-024 Tabla 1" },
  { id: "fechaNacimiento", label: "Fecha de nacimiento", tipo: "fecha", req: true, norma: "NOM-004 5.2.3 / NOM-024 Tabla 1" },
  { id: "entidadNacimiento", label: "Entidad federativa de nacimiento", tipo: "opciones", opciones: ENTIDADES, norma: "NOM-024 Tabla 1" },
  { id: "nacionalidad", label: "Nacionalidad", tipo: "texto", norma: "NOM-024 Tabla 1", ayuda: "Ejemplo: Mexicana." },
  { id: "domicilio", label: "Domicilio (calle, número, colonia)", tipo: "parrafo", req: true, norma: "NOM-004 5.2.3" },
  { id: "codigoPostal", label: "Código postal", tipo: "texto", norma: "NOM-024 Apéndice A" },
  { id: "entidadResidencia", label: "Entidad federativa de residencia", tipo: "opciones", opciones: ENTIDADES, norma: "NOM-024 Tabla 1" },
  { id: "municipioResidencia", label: "Municipio de residencia", tipo: "texto", norma: "NOM-024 Tabla 1" },
  { id: "localidadResidencia", label: "Localidad de residencia", tipo: "texto", norma: "NOM-024 Tabla 1" },
  { id: "telefono", label: "Teléfono", tipo: "texto" },
  { id: "grupoEtnico", label: "Grupo étnico (en su caso)", tipo: "texto", norma: "NOM-004 6.1.1" },
  { id: "lenguaIndigena", label: "Lengua indígena (en su caso)", tipo: "texto", norma: "NOM-024 Apéndice A" },
  { id: "estadoCivil", label: "Estado civil", tipo: "texto" },
  { id: "ocupacion", label: "Ocupación", tipo: "texto" },
  { id: "escolaridad", label: "Escolaridad", tipo: "texto" },
];

// Formato de CURP (18 caracteres). Solo valida forma, no que exista en RENAPO.
export const CURP_RE = /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HMX](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;

// ------------------------------------------------------------
// Datos del médico y del establecimiento — num. 5.2.1, 5.2.2, 5.10
// ------------------------------------------------------------
export const PERFIL_MEDICO = [
  { id: "nombreMedico", label: "Nombre completo del médico", tipo: "texto", req: true, norma: "5.10" },
  { id: "cedula", label: "Cédula profesional", tipo: "texto", req: true, norma: "Apéndice A" },
  { id: "especialidad", label: "Especialidad", tipo: "texto" },
  { id: "cedulaEspecialidad", label: "Cédula de especialidad", tipo: "texto" },
  { id: "tipoEstablecimiento", label: "Tipo de establecimiento", tipo: "texto", req: true, norma: "5.2.1", ayuda: "Ejemplo: Consultorio de especialidad." },
  { id: "nombreEstablecimiento", label: "Nombre del establecimiento", tipo: "texto", req: true, norma: "5.2.1" },
  { id: "domicilioEstablecimiento", label: "Domicilio del establecimiento", tipo: "parrafo", req: true, norma: "5.2.1" },
  { id: "institucion", label: "Institución a la que pertenece (en su caso)", tipo: "texto", norma: "5.2.1" },
  { id: "razonSocial", label: "Razón o denominación social del propietario (en su caso)", tipo: "texto", norma: "5.2.2" },
  { id: "telefonoEstablecimiento", label: "Teléfono del consultorio", tipo: "texto" },
];

// Campos obligatorios que faltan. Devuelve una lista de etiquetas.
export function camposFaltantes(formato, valores) {
  const faltan = [];
  const vacio = (v) => v == null || String(v).trim() === "" || (Array.isArray(v) && v.length === 0);
  for (const s of formato.secciones) {
    for (const c of s.campos) {
      if (c.req && vacio(valores[c.id])) faltan.push(c.label);
    }
    if (s.reqAlguno && s.reqAlguno.every((id) => vacio(valores[id]))) {
      faltan.push(`${s.titulo} (al menos un medicamento o una indicación)`);
    }
  }
  // Cada medicamento debe traer dosis, vía y periodicidad (num. 6.2.6).
  for (const [i, m] of (valores.medicamentos || []).entries()) {
    for (const k of ["nombre", "dosis", "via", "periodicidad"]) {
      if (vacio(m[k])) faltan.push(`Medicamento ${i + 1}: ${{ nombre: "nombre", dosis: "dosis", via: "vía de administración", periodicidad: "periodicidad" }[k]}`);
    }
  }
  return faltan;
}

export function perfilFaltante(perfil) {
  return PERFIL_MEDICO.filter((c) => c.req && !String(perfil?.[c.id] ?? "").trim()).map((c) => c.label);
}

// ------------------------------------------------------------
// Abreviaturas comunes (num. 5.11: "sin abreviaturas").
// Solo AVISA antes de firmar; el médico decide.
// ------------------------------------------------------------
const ABREVIATURAS = [
  "TA", "FC", "FR", "FCF", "FUM", "FUP", "FPP", "IVSA", "HTA", "DM", "DM2", "IMC", "VO", "IV", "IM", "SC",
  "SDG", "AFU", "USG", "BH", "QS", "EGO", "PAP", "IVU", "EPI", "Rx", "Dx", "Tx", "Px", "Hx", "AHF", "APP", "APNP",
  "MPF", "DIU", "c/u", "SOS", "PRN", "cps", "tab", "amp",
];

export function buscarAbreviaturas(formato, valores) {
  const textos = [];
  for (const s of formato.secciones) {
    for (const c of s.campos) {
      if (c.tipo === "parrafo" || c.tipo === "texto") textos.push(valores[c.id] || "");
    }
  }
  for (const m of valores.medicamentos || []) textos.push(Object.values(m).join(" "));
  const texto = textos.join("\n");
  const encontradas = new Set();
  for (const a of ABREVIATURAS) {
    const re = new RegExp(`(^|[^\\p{L}])${a.replace("/", "\\/")}(?=$|[^\\p{L}])`, "u");
    if (re.test(texto)) encontradas.add(a);
  }
  // Patrones tipo "c/8h", "G2P1C1", "G3".
  if (/\bc\/\s?\d+\s?h/i.test(texto)) encontradas.add("c/8h (cada 8 horas)");
  if (/\bG\d+\s?P\d+/.test(texto) || /\bG\d+\b/.test(texto)) encontradas.add("G#P#");
  return [...encontradas];
}

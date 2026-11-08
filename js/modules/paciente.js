// ============================================================
// modules/paciente.js
// Rutas:
//   #/paciente/nuevo          alta (ficha de identificación)
//   #/paciente/{id}           expediente: ficha + lista de notas
//   #/paciente/{id}/editar    editar ficha
// ============================================================

import { FICHA_PACIENTE, CURP_RE, ENTIDADES, HISTORIA_CLINICA, NOTA_EVOLUCION } from "../formatos-nom004.js";
import { htmlCampo, leerCampos } from "../formulario.js";
import {
  leerPaciente, crearPaciente, actualizarPaciente, listarNotas, crearNota, exportarExpediente, registrar,
} from "../db.js";
import { esc, nombreCompleto, edadTexto, formatoExpediente, fechaLarga, fechaHora, aviso, ir } from "../util.js";
import { cargarExpediente, cargarJsPDF, construirPDF, entregarPDF, imprimir } from "../documento-expediente.js";

const TITULOS = { historia_clinica: HISTORIA_CLINICA.titulo, evolucion: NOTA_EVOLUCION.titulo };

export async function renderPaciente(container, user, params) {
  const [pid, accion] = params;
  if (!pid || pid === "nuevo") return renderFicha(container, user, null);
  const paciente = await leerPaciente(user.uid, pid);
  if (!paciente) {
    container.innerHTML = `<div class="alerta">Paciente no encontrado.</div>`;
    return;
  }
  if (accion === "editar") return renderFicha(container, user, paciente);
  return renderExpediente(container, user, paciente);
}

// ---------------- Ficha (alta / edición) ----------------
function renderFicha(container, user, paciente) {
  const valores = paciente || { nacionalidad: "Mexicana" };
  container.innerHTML = `
    <h2 class="titulo">${paciente ? "Editar ficha" : "Nuevo paciente"}</h2>
    <p class="sub">Ficha de identificación. Los campos con * son obligatorios por la norma.</p>
    <form id="form-ficha" class="tarjeta" novalidate>
      <div class="rejilla">${FICHA_PACIENTE.map((c) => htmlCampo(c, valores[c.id])).join("")}</div>
      <p id="ficha-error" class="error-text" hidden></p>
      <div class="acciones">
        <a class="btn-ghost" href="#/${paciente ? `paciente/${encodeURIComponent(paciente.id)}` : "pacientes"}">Cancelar</a>
        <button class="btn-primary btn-chico" type="submit">Guardar</button>
      </div>
    </form>`;

  const form = container.querySelector("#form-ficha");
  const err = container.querySelector("#ficha-error");
  form.querySelector('[name="curp"]').addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/\s/g, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = leerCampos(form, FICHA_PACIENTE);
    const faltan = FICHA_PACIENTE.filter((c) => c.req && !String(datos[c.id] ?? "").trim()).map((c) => c.label);
    const problemas = [];
    if (faltan.length) problemas.push(`Faltan: ${faltan.join(", ")}.`);
    if (datos.curp && !CURP_RE.test(datos.curp)) problemas.push("La CURP no tiene un formato válido (18 caracteres).");
    if (datos.fechaNacimiento && new Date(datos.fechaNacimiento) > new Date()) problemas.push("La fecha de nacimiento está en el futuro.");
    if (problemas.length) {
      err.textContent = problemas.join(" ");
      err.hidden = false;
      return;
    }
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      if (paciente) {
        await actualizarPaciente(user.uid, paciente.id, datos);
        ir(`paciente/${encodeURIComponent(paciente.id)}`);
      } else {
        const id = await crearPaciente(user.uid, datos);
        ir(`paciente/${encodeURIComponent(id)}`);
      }
      aviso("Ficha guardada.", "ok");
    } catch (e2) {
      err.textContent = `No se pudo guardar: ${e2.message}`;
      err.hidden = false;
      btn.disabled = false;
    }
  });
}

// ---------------- Expediente ----------------
async function renderExpediente(container, user, p) {
  const notas = await listarNotas(user.uid, p.id);
  registrar(user.uid, "expediente_consultado", { pacienteId: p.id });
  const entidad = (c) => (ENTIDADES.find(([k]) => k === c) || [, ""])[1];
  const tieneHistoria = notas.some((n) => n.tipo === "historia_clinica");
  const firmadas = notas.filter((n) => n.estado === "firmada").length;
  const borradores = notas.length - firmadas;

  container.innerHTML = `
    <div class="cabecera">
      <div>
        <h2 class="titulo">${esc(nombreCompleto(p))}</h2>
        <p class="sub">${esc(formatoExpediente(p.numeroExpediente))} · ${esc(p.sexo === "M" ? "Mujer" : p.sexo === "H" ? "Hombre" : "")} · ${esc(edadTexto(p.fechaNacimiento))}</p>
      </div>
      <a class="btn-ghost" href="#/paciente/${encodeURIComponent(p.id)}/editar">Editar ficha</a>
    </div>

    <div class="botones-expediente">
      <button class="btn-primary" id="guardar-exp" aria-label="Guardar expediente en PDF" ${firmadas ? "" : "disabled"}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>
        Guardar
      </button>
      <button class="btn-ghost" id="imprimir-exp" aria-label="Imprimir expediente" ${firmadas ? "" : "disabled"}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>
        Imprimir
      </button>
    </div>
    <p class="sub nota-botones">${firmadas
      ? `Incluye la ficha de identificación y ${firmadas} nota${firmadas > 1 ? "s" : ""} firmada${firmadas > 1 ? "s" : ""}, en PDF.${borradores ? ` ${borradores} borrador${borradores > 1 ? "es" : ""} sin firmar no se incluye${borradores > 1 ? "n" : ""}.` : ""}`
      : "Para guardar o imprimir el expediente primero firma al menos una nota."}</p>

    <details class="tarjeta">
      <summary>Ficha de identificación</summary>
      <dl class="rejilla">
        <div class="lect-campo"><dt>CURP</dt><dd>${esc(p.curp) || '<span class="vacio">Sin registro</span>'}</dd></div>
        <div class="lect-campo"><dt>Fecha de nacimiento</dt><dd>${esc(fechaLarga(p.fechaNacimiento))}</dd></div>
        <div class="lect-campo"><dt>Lugar de nacimiento</dt><dd>${esc(entidad(p.entidadNacimiento))}</dd></div>
        <div class="lect-campo"><dt>Domicilio</dt><dd>${esc(p.domicilio)}${p.municipioResidencia ? `, ${esc(p.municipioResidencia)}` : ""}${p.entidadResidencia ? `, ${esc(entidad(p.entidadResidencia))}` : ""}${p.codigoPostal ? `, C.P. ${esc(p.codigoPostal)}` : ""}</dd></div>
        <div class="lect-campo"><dt>Teléfono</dt><dd>${esc(p.telefono)}</dd></div>
        <div class="lect-campo"><dt>Último acto médico</dt><dd>${p.ultimoActoMedico ? esc(fechaLarga(p.ultimoActoMedico)) : "—"}</dd></div>
      </dl>
    </details>

    <div class="accesos">
      <button class="acceso" data-nueva="historia_clinica"><strong>+ Historia clínica</strong><span>${tieneHistoria ? "Ya tiene una; crear otra solo si es necesario" : "Primera consulta (NOM-004 6.1)"}</span></button>
      <button class="acceso" data-nueva="evolucion"><strong>+ Nota de evolución</strong><span>Consulta subsecuente (NOM-004 6.2)</span></button>
    </div>

    <h3 class="subtitulo">Notas del expediente</h3>
    <div id="notas" class="lista-ios">
      ${notas.length ? notas.map((n) => `
        <a class="fila-paciente" href="#/nota/${encodeURIComponent(p.id)}/${encodeURIComponent(n.id)}">
          <strong>${esc(TITULOS[n.tipo] || n.tipo)}</strong>
          <span>
            <span class="estado estado-${esc(n.estado)}">${n.estado === "firmada" ? "Firmada" : "Borrador"}</span>
            ${esc(fechaHora(n.firmadaEn || n.creadaEn))}
            ${n.campos?.diagnosticos ? ` · ${esc(String(n.campos.diagnosticos).slice(0, 80))}` : ""}
          </span>
        </a>`).join("") : `<p class="sub">Sin notas todavía.</p>`}
    </div>

    <p class="sub legal">
      Entregar copia del expediente solo con solicitud escrita del paciente, su representante o la autoridad (NOM-004 5.5.1 y 5.6).
      <br><button class="btn-texto chico" id="exportar">Exportar datos (archivo JSON, NOM-024 6.6.6)</button>
    </p>`;

  // Guardar / imprimir: los datos y el generador de PDF se preparan desde ya,
  // para que al tocar "Guardar" el PDF salga al instante (iOS solo permite
  // abrir "Compartir" justo después del toque).
  let listo = null;
  const preparar = firmadas
    ? Promise.all([cargarExpediente(user.uid, p.id), cargarJsPDF()])
        .then(([datos, jsPDF]) => (listo = { datos, jsPDF }))
        .catch((e) => { console.warn(e); return null; })
    : Promise.resolve(null);

  const btnGuardar = container.querySelector("#guardar-exp");
  btnGuardar.addEventListener("click", async () => {
    btnGuardar.disabled = true;
    const textoOriginal = btnGuardar.lastChild.textContent;
    try {
      if (!listo) {
        btnGuardar.lastChild.textContent = " Preparando…";
        await preparar;
        if (!listo) listo = { datos: await cargarExpediente(user.uid, p.id), jsPDF: await cargarJsPDF() };
      }
      const doc = construirPDF(listo.jsPDF, listo.datos);
      const r = await entregarPDF(doc, listo.datos, user.uid);
      if (r === "descargado") aviso("Expediente guardado en PDF.", "ok");
    } catch (e) {
      aviso(`No se pudo generar el PDF: ${e.message}`, "error");
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.lastChild.textContent = textoOriginal;
    }
  });

  container.querySelector("#imprimir-exp").addEventListener("click", async () => {
    try {
      const datos = listo?.datos || (await cargarExpediente(user.uid, p.id));
      imprimir(datos, user.uid);
    } catch (e) {
      aviso(`No se pudo preparar la impresión: ${e.message}`, "error");
    }
  });

  container.querySelectorAll("[data-nueva]").forEach((b) =>
    b.addEventListener("click", async () => {
      const tipo = b.dataset.nueva;
      if (tipo === "historia_clinica" && tieneHistoria && !confirm("Este paciente ya tiene historia clínica. ¿Crear otra?")) return;
      b.disabled = true;
      try {
        const nid = await crearNota(user.uid, p.id, tipo);
        ir(`nota/${encodeURIComponent(p.id)}/${encodeURIComponent(nid)}`);
      } catch (e) {
        aviso(`No se pudo crear la nota: ${e.message}`, "error");
        b.disabled = false;
      }
    })
  );

  container.querySelector("#exportar").addEventListener("click", async () => {
    try {
      const datos = await exportarExpediente(user.uid, p.id);
      const blob = new Blob([JSON.stringify(aPlano(datos), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${formatoExpediente(p.numeroExpediente)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      aviso(`No se pudo exportar: ${e.message}`, "error");
    }
  });
}

// Timestamps de Firestore -> texto ISO en el JSON exportado.
// (Se convierte antes de JSON.stringify porque Timestamp trae su propio toJSON.)
function aPlano(v) {
  if (v && typeof v.toDate === "function") return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(aPlano);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aPlano(x)]));
  return v;
}

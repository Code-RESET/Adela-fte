// ============================================================
// modules/nota.js
// Ruta: #/nota/{pacienteId}/{notaId}
// - Borrador: formulario con dictado y autoguardado.
// - Firmar: valida contra la norma, congela los datos y bloquea la nota.
// - Firmada: solo lectura + adendas + impresión.
// ============================================================

import { FORMATOS, camposFaltantes, perfilFaltante, buscarAbreviaturas } from "../formatos-nom004.js";
import {
  htmlSeccion, htmlSeccionLectura, leerCampos, camposDeFormato, conectarMedicamentos,
} from "../formulario.js";
import { activarDictado, detenerDictado } from "../dictado.js";
import {
  leerNota, leerPaciente, leerPerfil, guardarBorrador, firmarNota, borrarBorrador,
  listarAdendas, agregarAdenda, registrar,
} from "../db.js";
import { setGuardiaSalida } from "../router.js";
import { htmlHojaNota, imprimir, cargarJsPDF, construirPDF, entregarPDF } from "../documento-expediente.js";
import {
  esc, nombreCompleto, edadTexto, formatoExpediente, fechaHora, fechaLarga, aviso, ir,
} from "../util.js";

// Aviso del navegador si se cierra la pestaña con cambios sin guardar.
let hayPendientes = () => false;
window.addEventListener("beforeunload", (e) => {
  if (hayPendientes()) { e.preventDefault(); e.returnValue = ""; }
});

export async function renderNota(container, user, params) {
  const [pid, nid] = params;
  container.innerHTML = `<p class="cargando">Cargando nota…</p>`;
  const [nota, paciente, perfil] = await Promise.all([
    leerNota(user.uid, pid, nid),
    leerPaciente(user.uid, pid),
    leerPerfil(user.uid),
  ]);
  if (!nota || !paciente) {
    container.innerHTML = `<div class="alerta">Nota no encontrada.</div>`;
    return;
  }
  const formato = FORMATOS[nota.tipo];
  if (nota.estado === "firmada") return renderFirmada(container, user, paciente, nota, formato);
  return renderBorrador(container, user, paciente, nota, formato, perfil);
}

// ============================================================
// BORRADOR
// ============================================================
function renderBorrador(container, user, paciente, nota, formato, perfil) {
  const pid = paciente.id;
  const nid = nota.id;
  const defs = camposDeFormato(formato);
  const valores = nota.campos || {};

  container.innerHTML = `
    <div class="cabecera">
      <div>
        <h2 class="titulo">${esc(formato.titulo)} <span class="estado estado-borrador">Borrador</span></h2>
        <p class="sub">
          <a href="#/paciente/${encodeURIComponent(pid)}">${esc(nombreCompleto(paciente))}</a> ·
          ${esc(formatoExpediente(paciente.numeroExpediente))} · ${esc(edadTexto(paciente.fechaNacimiento))} ·
          ${paciente.sexo === "M" ? "Mujer" : paciente.sexo === "H" ? "Hombre" : ""}
        </p>
      </div>
      <span id="estado-guardado" class="sub"></span>
    </div>
    <p class="sub">Toca 🎤 para dictar un campo. Redacta sin abreviaturas (NOM-004 5.11). Los campos con * son obligatorios para firmar.</p>
    <form id="form-nota" autocomplete="off">
      ${formato.secciones.map((s) => htmlSeccion(s, valores)).join("")}
    </form>
    <div id="faltantes"></div>
    <div class="acciones barra-acciones">
      <button class="btn-ghost" id="borrar">Eliminar</button>
      <button class="btn-ghost" id="guardar">Guardar</button>
      <button class="btn-primary btn-chico" id="firmar">Firmar</button>
    </div>`;

  const form = container.querySelector("#form-nota");
  const estadoEl = container.querySelector("#estado-guardado");
  let sucio = false;
  let timer = null;

  const guardar = async () => {
    clearTimeout(timer);
    if (!sucio) return;
    sucio = false;
    estadoEl.textContent = "Guardando…";
    try {
      await guardarBorrador(user.uid, pid, nid, leerCampos(form, defs));
      estadoEl.textContent = `Guardado ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
    } catch (e) {
      sucio = true;
      estadoEl.textContent = "Sin guardar";
      aviso(`No se pudo guardar el borrador: ${e.message}`, "error");
    }
  };
  const marcar = () => {
    sucio = true;
    estadoEl.textContent = "Cambios sin guardar";
    clearTimeout(timer);
    timer = setTimeout(guardar, 2000); // autoguardado 2 s después de dejar de escribir
  };

  form.addEventListener("input", marcar);
  form.addEventListener("change", marcar);
  conectarMedicamentos(form, marcar, (fila) => activarDictado(fila));
  activarDictado(form);
  setGuardiaSalida(guardar); // guarda al cambiar de pantalla
  hayPendientes = () => sucio && document.body.contains(form);

  container.querySelector("#guardar").addEventListener("click", async () => {
    sucio = true;
    await guardar();
  });

  container.querySelector("#borrar").addEventListener("click", async () => {
    if (!confirm("¿Eliminar este borrador? No se puede deshacer.")) return;
    clearTimeout(timer);
    sucio = false;
    setGuardiaSalida(null);
    await borrarBorrador(user.uid, pid, nid);
    ir(`paciente/${encodeURIComponent(pid)}`);
  });

  container.querySelector("#firmar").addEventListener("click", async () => {
    detenerDictado();
    const campos = leerCampos(form, defs);
    const caja = container.querySelector("#faltantes");
    caja.innerHTML = "";

    const faltaPerfil = perfilFaltante(perfil);
    if (faltaPerfil.length) {
      caja.innerHTML = `<div class="alerta">Antes de firmar completa <a href="#/configuracion">Mi consultorio</a>: ${faltaPerfil.map(esc).join(", ")}.</div>`;
      caja.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const faltan = camposFaltantes(formato, campos);
    if (faltan.length) {
      caja.innerHTML = `<div class="alerta"><strong>La norma pide estos datos antes de firmar:</strong><ul>${faltan.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>`;
      caja.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const abrev = buscarAbreviaturas(formato, campos);
    if (abrev.length && !confirm(
      `Se encontraron posibles abreviaturas: ${abrev.join(", ")}.\n\n` +
      "La NOM-004 (5.11) pide redactar sin abreviaturas. ¿Firmar de todos modos?"
    )) return;
    if (!confirm(
      "Al firmar, la nota queda cerrada con la fecha y hora de ahora y ya NO se podrá modificar.\n" +
      "Las correcciones posteriores se agregan como adenda.\n\n¿Firmar la nota?"
    )) return;

    const btn = container.querySelector("#firmar");
    btn.disabled = true;
    try {
      clearTimeout(timer);
      sucio = false;
      setGuardiaSalida(null);
      await firmarNota(user.uid, pid, nid, campos, paciente, perfil);
      aviso("Nota firmada.", "ok");
      renderNota(container, user, [pid, nid]);
    } catch (e) {
      aviso(`No se pudo firmar: ${e.message}`, "error");
      btn.disabled = false;
    }
  });
}

// ============================================================
// FIRMADA (solo lectura)
// ============================================================
async function renderFirmada(container, user, paciente, nota, formato) {
  const pid = paciente.id;
  const nid = nota.id;
  const adendas = await listarAdendas(user.uid, pid, nid);
  registrar(user.uid, "nota_consultada", { pacienteId: pid, notaId: nid });
  // Datos para guardar/imprimir solo esta nota.
  const datos = { paciente, perfil: {}, notas: [{ ...nota, adendas }], borradores: 0, soloNota: true };
  let jsPDF = null;
  cargarJsPDF().then((j) => (jsPDF = j)).catch(() => {});

  container.innerHTML = `
    <div class="no-imprimir cabecera">
      <a href="#/paciente/${encodeURIComponent(pid)}">‹ ${esc(nombreCompleto(paciente))}</a>
      <div class="acciones" style="margin:0">
        <button class="btn-ghost" id="guardar-pdf">Guardar PDF</button>
        <button class="btn-ghost" id="imprimir">Imprimir</button>
      </div>
    </div>

    ${htmlHojaNota(nota, adendas)}

    <form id="form-adenda" class="tarjeta no-imprimir">
      <h3 class="subtitulo">Agregar adenda</h3>
      <p class="sub">Para corregir o completar esta nota. Queda con fecha, hora y autor, y tampoco se puede modificar.</p>
      <div class="campo"><div class="control"><textarea name="texto" rows="3" data-dictado required></textarea></div></div>
      <button class="btn-primary btn-chico" type="submit">Agregar adenda</button>
    </form>`;

  container.querySelector("#imprimir").addEventListener("click", () => imprimir(datos, user.uid));

  const btnPdf = container.querySelector("#guardar-pdf");
  btnPdf.addEventListener("click", async () => {
    btnPdf.disabled = true;
    try {
      const doc = construirPDF(jsPDF || (await cargarJsPDF()), datos);
      const r = await entregarPDF(doc, datos, user.uid);
      if (r === "descargado") aviso("Nota guardada en PDF.", "ok");
    } catch (e) {
      aviso(`No se pudo generar el PDF: ${e.message}`, "error");
    } finally {
      btnPdf.disabled = false;
    }
  });

  const formA = container.querySelector("#form-adenda");
  activarDictado(formA);
  formA.addEventListener("submit", async (e) => {
    e.preventDefault();
    detenerDictado();
    const texto = formA.texto.value.trim();
    if (!texto) return;
    if (!confirm("La adenda no se podrá modificar después. ¿Agregarla?")) return;
    const perfil = await leerPerfil(user.uid);
    if (perfilFaltante(perfil).length) {
      aviso("Completa Mi consultorio antes de agregar adendas.", "error");
      return;
    }
    try {
      await agregarAdenda(user.uid, pid, nid, texto, perfil);
      aviso("Adenda agregada.", "ok");
      renderNota(container, user, [pid, nid]);
    } catch (err) {
      aviso(`No se pudo agregar: ${err.message}`, "error");
    }
  });
}

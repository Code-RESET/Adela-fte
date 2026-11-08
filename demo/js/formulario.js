// ============================================================
// formulario.js
// Pinta formularios a partir de las definiciones de
// formatos-nom004.js y lee sus valores. Así todos los módulos
// usan los mismos campos, etiquetas y numerales de la norma.
// ============================================================

import { esc, fechaLarga } from "./util.js";
import { VIAS_ADMINISTRACION } from "./formatos-nom004.js";

const opcionesDe = (c) => (c.opciones || []).map((o) => (Array.isArray(o) ? o : [o, o]));

function etiquetaNorma(c) {
  const req = c.req ? '<span class="req" title="Obligatorio por la norma">*</span>' : "";
  const num = c.norma ? `<span class="num-norma">${esc(String(c.norma).startsWith("NOM") || String(c.norma).startsWith("Ap") ? c.norma : "NOM-004 " + c.norma)}</span>` : "";
  return `${esc(c.label)}${req} ${num}`;
}

// ---------------- Edición ----------------
export function htmlCampo(c, valor) {
  const id = `f-${c.id}`;
  const v = valor ?? "";
  const dict = c.dictado ? "data-dictado" : "";
  const ayuda = c.ayuda ? `<small class="ayuda">${esc(c.ayuda)}</small>` : "";
  let control;
  switch (c.tipo) {
    case "parrafo":
      control = `<textarea id="${id}" name="${c.id}" rows="3" ${dict}>${esc(v)}</textarea>`;
      break;
    case "numero":
      control = `<input id="${id}" name="${c.id}" type="number" inputmode="decimal" step="${c.paso || "1"}" value="${esc(v)}" />`;
      break;
    case "fecha":
      control = `<input id="${id}" name="${c.id}" type="date" value="${esc(v)}" />`;
      break;
    case "opciones":
      control = `<select id="${id}" name="${c.id}"><option value="">—</option>${opcionesDe(c)
        .map(([val, txt]) => `<option value="${esc(val)}" ${String(v) === String(val) ? "selected" : ""}>${esc(txt)}</option>`)
        .join("")}</select>`;
      break;
    case "medicamentos":
      return htmlMedicamentos(c, Array.isArray(valor) ? valor : []);
    default:
      control = `<input id="${id}" name="${c.id}" type="text" value="${esc(v)}" ${dict} />`;
  }
  return `<div class="campo"><label for="${id}">${etiquetaNorma(c)}</label><div class="control">${control}</div>${ayuda}</div>`;
}

function filaMedicamento(m = {}) {
  const vias = VIAS_ADMINISTRACION.map((x) => `<option ${m.via === x ? "selected" : ""}>${esc(x)}</option>`).join("");
  return `
    <div class="med-fila">
      <div class="control"><input data-k="nombre" placeholder="Medicamento y presentación" value="${esc(m.nombre)}" data-dictado /></div>
      <div class="control"><input data-k="dosis" placeholder="Dosis" value="${esc(m.dosis)}" data-dictado /></div>
      <div class="control"><select data-k="via"><option value="">Vía…</option>${vias}</select></div>
      <div class="control"><input data-k="periodicidad" placeholder="Periodicidad (cada cuánto)" value="${esc(m.periodicidad)}" data-dictado /></div>
      <div class="control"><input data-k="duracion" placeholder="Duración (opcional)" value="${esc(m.duracion)}" data-dictado /></div>
      <button type="button" class="btn-ghost med-quitar" aria-label="Quitar medicamento">✕</button>
    </div>`;
}

function htmlMedicamentos(c, lista) {
  return `
    <div class="campo" data-meds="${c.id}">
      <label>${etiquetaNorma(c)}</label>
      ${c.ayuda ? `<small class="ayuda">${esc(c.ayuda)}</small>` : ""}
      <div class="med-lista">${lista.map(filaMedicamento).join("")}</div>
      <button type="button" class="btn-ghost med-agregar">+ Agregar medicamento</button>
    </div>`;
}

// Conecta los botones de agregar/quitar medicamento. onCambio se llama al modificar.
export function conectarMedicamentos(root, onCambio, alAgregar) {
  root.querySelectorAll("[data-meds]").forEach((caja) => {
    const lista = caja.querySelector(".med-lista");
    caja.querySelector(".med-agregar").addEventListener("click", () => {
      lista.insertAdjacentHTML("beforeend", filaMedicamento());
      alAgregar?.(lista.lastElementChild);
      onCambio?.();
    });
    lista.addEventListener("click", (e) => {
      if (e.target.closest(".med-quitar")) {
        e.target.closest(".med-fila").remove();
        onCambio?.();
      }
    });
  });
}

export function htmlSeccion(s, valores) {
  const nota = s.nota ? `<p class="seccion-nota">${esc(s.nota)}</p>` : "";
  return `
    <fieldset class="seccion">
      <legend>${esc(s.titulo)} ${s.norma ? `<span class="num-norma">NOM-004 ${esc(s.norma)}</span>` : ""}</legend>
      ${nota}
      <div class="${s.columnas ? "rejilla" : ""}">
        ${s.campos.map((c) => htmlCampo(c, valores[c.id])).join("")}
      </div>
    </fieldset>`;
}

// Lee los valores de una lista de definiciones de campo.
export function leerCampos(root, defs) {
  const out = {};
  for (const c of defs) {
    if (c.tipo === "medicamentos") {
      out[c.id] = [...root.querySelectorAll(`[data-meds="${c.id}"] .med-fila`)]
        .map((f) => Object.fromEntries([...f.querySelectorAll("[data-k]")].map((el) => [el.dataset.k, el.value.trim()])))
        .filter((m) => Object.values(m).some(Boolean));
      continue;
    }
    const el = root.querySelector(`[name="${c.id}"]`);
    if (!el) continue;
    out[c.id] = c.tipo === "numero" ? (el.value === "" ? "" : Number(el.value)) : el.value.trim();
  }
  return out;
}

export function camposDeFormato(formato) {
  return formato.secciones.flatMap((s) => s.campos);
}

// ---------------- Solo lectura (notas firmadas / impresión) ----------------

// Valor como texto plano (para PDF).
export function textoPlano(c, v) {
  if (v == null || v === "") return "";
  if (c.tipo === "fecha") return fechaLarga(v);
  if (c.tipo === "opciones") {
    const o = opcionesDe(c).find(([val]) => String(val) === String(v));
    return o ? o[1] : String(v);
  }
  return String(v);
}

function textoValor(c, v) {
  if (v == null || v === "") return '<span class="vacio">Sin registro</span>';
  if (c.tipo === "fecha") return esc(fechaLarga(v));
  if (c.tipo === "opciones") {
    const o = opcionesDe(c).find(([val]) => String(val) === String(v));
    return esc(o ? o[1] : v);
  }
  return esc(v).replace(/\n/g, "<br>");
}

export function htmlSeccionLectura(s, valores) {
  // Si la sección tiene un solo campo con el mismo nombre, no se repite el título.
  const unico = s.campos.length === 1 && s.campos[0].label === s.titulo;
  const filas = s.campos
    .map((c) => {
      const v = valores[c.id];
      if (c.tipo === "medicamentos") {
        if (!v?.length) return "";
        return `<div class="lect-campo"><dt>${esc(c.label)}</dt><dd><ol class="med-leer">${v
          .map((m) => `<li><strong>${esc(m.nombre)}</strong> — dosis: ${esc(m.dosis)}; vía: ${esc(m.via)}; periodicidad: ${esc(m.periodicidad)}${m.duracion ? `; duración: ${esc(m.duracion)}` : ""}</li>`)
          .join("")}</ol></dd></div>`;
      }
      // Campos opcionales vacíos no se imprimen; los obligatorios sí.
      if (!c.req && (v == null || v === "")) return "";
      return `<div class="lect-campo">${unico ? "" : `<dt>${esc(c.label)}</dt>`}<dd>${textoValor(c, v)}</dd></div>`;
    })
    .join("");
  if (!filas) return "";
  return `<section class="lect-seccion"><h3>${esc(s.titulo)}</h3><dl class="${s.columnas ? "rejilla" : ""}">${filas}</dl></section>`;
}

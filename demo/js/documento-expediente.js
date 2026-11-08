// ============================================================
// documento-expediente.js
// Arma el documento del expediente (o de una sola nota) para:
//   - GUARDAR: PDF con jsPDF (texto real, se puede buscar y copiar).
//     En iPhone abre la hoja de compartir (Guardar en Archivos, AirDrop,
//     Mail, WhatsApp); en PC lo descarga.
//   - IMPRIMIR: hoja HTML + diálogo de impresión del sistema.
// Solo incluye notas FIRMADAS: un borrador no es parte del expediente
// hasta que el médico lo firma.
// jsPDF va dentro del repo (js/vendor) para funcionar sin internet; se
// carga solo cuando hace falta.
// ============================================================

import { FORMATOS, ENTIDADES, FICHA_PACIENTE } from "./formatos-nom004.js";
import { htmlSeccionLectura, textoPlano } from "./formulario.js";
import { leerPaciente, leerPerfil, listarNotas, listarAdendas, registrar } from "./db.js";
import { esc, nombreCompleto, formatoExpediente, fechaHora, fechaLarga, aFecha } from "./util.js";

const JSPDF_URL = new URL("./vendor/jspdf-4.2.1.umd.min.js", import.meta.url).href;

// ------------------------------------------------------------
// Datos
// ------------------------------------------------------------
// Devuelve { paciente, perfil, notas (firmadas, de la más antigua a la
// más reciente, con .adendas), borradores (cuántos hay sin firmar) }.
export async function cargarExpediente(uid, pid, soloNotaId = null) {
  const [paciente, perfil, todas] = await Promise.all([
    leerPaciente(uid, pid),
    leerPerfil(uid),
    listarNotas(uid, pid),
  ]);
  let notas = todas.filter((n) => n.estado === "firmada");
  if (soloNotaId) notas = notas.filter((n) => n.id === soloNotaId);
  notas.sort((a, b) => (aFecha(a.firmadaEn) || 0) - (aFecha(b.firmadaEn) || 0));
  await Promise.all(notas.map(async (n) => { n.adendas = await listarAdendas(uid, pid, n.id); }));
  return {
    paciente,
    perfil,
    notas,
    borradores: todas.filter((n) => n.estado !== "firmada").length,
    soloNota: Boolean(soloNotaId),
  };
}

const sexoTexto = (s) => (s === "M" ? "Mujer" : s === "H" ? "Hombre" : s || "");
const entidadTexto = (c) => (ENTIDADES.find(([k]) => k === c) || [, ""])[1];

function establecimientoDe(datos) {
  // Preferimos el que quedó congelado en la última nota firmada; si no hay, el perfil actual.
  const ult = datos.notas[datos.notas.length - 1]?.establecimiento;
  if (ult) return ult;
  const p = datos.perfil || {};
  return {
    nombre: p.nombreEstablecimiento, tipo: p.tipoEstablecimiento, domicilio: p.domicilioEstablecimiento,
    institucion: p.institucion, razonSocial: p.razonSocial, telefono: p.telefonoEstablecimiento,
  };
}

function nombreArchivo(datos) {
  const limpio = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const p = datos.paciente;
  const base = datos.soloNota ? "Nota" : "Expediente";
  return `${base}-${formatoExpediente(p.numeroExpediente)}-${limpio(p.primerApellido)}-${limpio(p.nombre)}.pdf`;
}

// ------------------------------------------------------------
// HTML (pantalla e impresión)
// ------------------------------------------------------------
// Hoja de una nota firmada. La usan la vista de la nota y la impresión.
export function htmlHojaNota(nota, adendas = []) {
  const formato = FORMATOS[nota.tipo];
  const est = nota.establecimiento || {};
  const pac = nota.paciente || {};
  const firma = nota.firma || {};
  const esHistoria = nota.tipo === "historia_clinica";
  return `
    <article class="hoja">
      <header class="hoja-encabezado">
        <div>
          <strong>${esc(est.nombre)}</strong><br>
          ${esc(est.tipo)}${est.institucion ? ` · ${esc(est.institucion)}` : ""}${est.razonSocial ? ` · ${esc(est.razonSocial)}` : ""}<br>
          ${esc(est.domicilio)}${est.telefono ? ` · Teléfono ${esc(est.telefono)}` : ""}
        </div>
        <div class="hoja-tipo">
          <strong>${esc(formato.titulo)}</strong><br>
          ${esc(fechaHora(nota.firmadaEn))}
        </div>
      </header>

      <section class="hoja-paciente">
        <div><span>Paciente</span>${esc(pac.nombreCompleto)}</div>
        <div><span>Edad</span>${pac.edad != null ? `${esc(pac.edad)} años` : ""}</div>
        <div><span>Sexo</span>${esc(sexoTexto(pac.sexo))}</div>
        <div><span>Expediente</span>${esc(formatoExpediente(pac.numeroExpediente))}</div>
        ${esHistoria ? `
          <div><span>Fecha de nacimiento</span>${esc(fechaLarga(pac.fechaNacimiento))}</div>
          <div><span>CURP</span>${esc(pac.curp) || "—"}</div>
          <div class="ancho"><span>Domicilio</span>${esc(pac.domicilio)}</div>
          ${pac.grupoEtnico ? `<div><span>Grupo étnico</span>${esc(pac.grupoEtnico)}</div>` : ""}
          ${pac.ocupacion ? `<div><span>Ocupación</span>${esc(pac.ocupacion)}</div>` : ""}
          ${pac.estadoCivil ? `<div><span>Estado civil</span>${esc(pac.estadoCivil)}</div>` : ""}
          ${pac.escolaridad ? `<div><span>Escolaridad</span>${esc(pac.escolaridad)}</div>` : ""}
        ` : ""}
      </section>

      ${formato.secciones.map((s) => htmlSeccionLectura(s, nota.campos || {})).join("")}

      <footer class="hoja-firma">
        <div class="linea-firma"></div>
        <div><strong>${esc(firma.nombre)}</strong></div>
        <div>Cédula profesional ${esc(firma.cedula)}${firma.especialidad ? ` · ${esc(firma.especialidad)}` : ""}${firma.cedulaEspecialidad ? ` · Cédula de especialidad ${esc(firma.cedulaEspecialidad)}` : ""}</div>
        <div class="sub">Nota cerrada en el sistema: ${esc(fechaHora(nota.firmadaEn))} · No modificable</div>
      </footer>

      ${adendas.length ? `
        <section class="lect-seccion">
          <h3>Adendas</h3>
          ${adendas.map((a) => `
            <div class="adenda">
              <div class="sub">${esc(fechaHora(a.creadaEn))} · ${esc(a.autor?.nombre)} · Cédula ${esc(a.autor?.cedula)}</div>
              <div>${esc(a.texto).replace(/\n/g, "<br>")}</div>
            </div>`).join("")}
        </section>` : ""}
    </article>`;
}

function htmlPortada(datos) {
  const p = datos.paciente;
  const est = establecimientoDe(datos);
  const filas = FICHA_PACIENTE.map((c) => {
    let v = p[c.id];
    if (c.id === "entidadNacimiento" || c.id === "entidadResidencia") v = entidadTexto(v);
    else v = textoPlano(c, v);
    return v ? `<div><span>${esc(c.label.replace(/ \(.*\)$/, ""))}</span>${esc(v)}</div>` : "";
  }).join("");
  return `
    <article class="hoja">
      <header class="hoja-encabezado">
        <div>
          <strong>${esc(est.nombre)}</strong><br>
          ${esc(est.tipo)}<br>${esc(est.domicilio)}
        </div>
        <div class="hoja-tipo"><strong>Expediente clínico</strong><br>${esc(formatoExpediente(p.numeroExpediente))}</div>
      </header>
      <section class="lect-seccion"><h3>Ficha de identificación</h3></section>
      <section class="hoja-paciente">${filas}</section>
      <section class="lect-seccion">
        <h3>Índice de documentos</h3>
        ${datos.notas.length
          ? `<ol class="med-leer">${datos.notas.map((n) => `<li>${esc(FORMATOS[n.tipo].titulo)} — ${esc(fechaHora(n.firmadaEn))}${n.adendas?.length ? ` (${n.adendas.length} adenda${n.adendas.length > 1 ? "s" : ""})` : ""}</li>`).join("")}</ol>`
          : `<p class="vacio">Sin notas firmadas.</p>`}
      </section>
      <p class="sub">Documento generado: ${esc(fechaHora(new Date()))} · Información confidencial (NOM-004-SSA3-2012, numeral 5.5).</p>
    </article>`;
}

// ------------------------------------------------------------
// IMPRIMIR
// ------------------------------------------------------------
export function imprimir(datos, uid) {
  document.getElementById("impresion")?.remove();
  const cont = document.createElement("div");
  cont.id = "impresion";
  cont.innerHTML = (datos.soloNota ? "" : htmlPortada(datos)) +
    datos.notas.map((n) => htmlHojaNota(n, n.adendas || [])).join("");
  document.body.appendChild(cont);
  document.body.classList.add("imprimiendo");
  const limpiar = () => {
    document.body.classList.remove("imprimiendo");
    cont.remove();
    window.removeEventListener("afterprint", limpiar);
  };
  window.addEventListener("afterprint", limpiar);
  registrar(uid, datos.soloNota ? "nota_impresa" : "expediente_impreso", {
    pacienteId: datos.paciente.id, ...(datos.soloNota ? { notaId: datos.notas[0]?.id } : {}),
  });
  // Pequeña espera para que el navegador pinte la hoja antes de imprimir.
  setTimeout(() => window.print(), 50);
}

// ------------------------------------------------------------
// GUARDAR (PDF)
// ------------------------------------------------------------
let jspdfPromesa = null;
export function cargarJsPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (!jspdfPromesa) {
    jspdfPromesa = new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = JSPDF_URL;
      s.onload = () => (window.jspdf?.jsPDF ? ok(window.jspdf.jsPDF) : mal(new Error("jsPDF no cargó")));
      s.onerror = () => { jspdfPromesa = null; mal(new Error("No se pudo cargar el generador de PDF")); };
      document.head.appendChild(s);
    });
  }
  return jspdfPromesa;
}

// Las fuentes estándar del PDF usan WinAnsi (español completo). Lo que no
// cabe ahí (emojis, símbolos raros) se sustituye para no imprimir basura.
const EXTRA_WINANSI = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function pdfTexto(t) {
  return String(t ?? "")
    .normalize("NFC")
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->").replace(/\t/g, "  ")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, (ch) => (EXTRA_WINANSI.includes(ch) ? ch : "?"));
}

const AZUL = [0, 85, 212];
const GRIS = [100, 100, 106];
const NEGRO = [0, 0, 0];

// Construye el PDF (síncrono). Devuelve el objeto jsPDF.
export function construirPDF(jsPDF, datos) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const AN = doc.internal.pageSize.getWidth();
  const AL = doc.internal.pageSize.getHeight();
  const M = 18;               // margen
  const ANCHO = AN - 2 * M;
  const PIE = AL - 14;
  let y = M;

  const nuevaPagina = () => { doc.addPage(); y = M; };
  const asegurar = (alto) => { if (y + alto > PIE - 4) nuevaPagina(); };

  // Escribe texto con salto de línea y de página.
  function escribir(texto, { size = 10.5, bold = false, color = NEGRO, x = M, ancho = ANCHO, interlineado = 1.35, alinear = "left", despues = 0 } = {}) {
    const t = pdfTexto(texto);
    if (!t) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const altoLinea = (size * 0.3528) * interlineado;
    for (const linea of doc.splitTextToSize(t, ancho)) {
      asegurar(altoLinea);
      const xx = alinear === "center" ? AN / 2 : alinear === "right" ? x + ancho : x;
      doc.text(linea, xx, y + altoLinea * 0.75, { align: alinear });
      y += altoLinea;
    }
    y += despues;
  }
  const raya = (color = [200, 200, 204]) => { doc.setDrawColor(...color); doc.setLineWidth(0.2); doc.line(M, y, AN - M, y); y += 3; };

  function encabezado(est, tituloDerecha, subtituloDerecha) {
    const y0 = y;
    escribir(est.nombre, { size: 12, bold: true, ancho: ANCHO * 0.6 });
    escribir([est.tipo, est.institucion, est.razonSocial].filter(Boolean).join(" · "), { size: 9, color: GRIS, ancho: ANCHO * 0.6 });
    escribir([est.domicilio, est.telefono ? `Teléfono ${est.telefono}` : ""].filter(Boolean).join(" · "), { size: 9, color: GRIS, ancho: ANCHO * 0.6 });
    const yIzq = y;
    y = y0;
    escribir(tituloDerecha, { size: 12, bold: true, color: AZUL, x: M + ANCHO * 0.62, ancho: ANCHO * 0.38, alinear: "right" });
    escribir(subtituloDerecha, { size: 9, color: GRIS, x: M + ANCHO * 0.62, ancho: ANCHO * 0.38, alinear: "right" });
    y = Math.max(y, yIzq) + 2;
    raya();
  }

  // Rejilla de pares etiqueta/valor en 2 columnas.
  function pares(lista) {
    const col = ANCHO / 2;
    for (let i = 0; i < lista.length; i += 2) {
      const fila = lista.slice(i, i + 2);
      asegurar(10);
      const y0 = y;
      let yMax = y;
      fila.forEach(([et, val], j) => {
        y = y0;
        escribir(et, { size: 8, color: GRIS, x: M + j * col, ancho: col - 4 });
        escribir(val || "—", { size: 10, x: M + j * col, ancho: col - 4 });
        yMax = Math.max(yMax, y);
      });
      y = yMax + 1.5;
    }
  }

  function tituloSeccion(t) {
    asegurar(12);
    y += 2.5;
    escribir(t.toUpperCase(), { size: 8.5, bold: true, color: AZUL });
    y += 0.8;
  }

  // ---------- Portada ----------
  const p = datos.paciente;
  const est = establecimientoDe(datos);
  if (!datos.soloNota) {
    encabezado(est, "Expediente clínico", formatoExpediente(p.numeroExpediente));
    tituloSeccion("Ficha de identificación");
    pares(FICHA_PACIENTE.map((c) => {
      let v = p[c.id];
      v = (c.id === "entidadNacimiento" || c.id === "entidadResidencia") ? entidadTexto(v) : textoPlano(c, v);
      return v ? [c.label.replace(/ \(.*\)$/, ""), v] : null;
    }).filter(Boolean));
    tituloSeccion("Índice de documentos");
    if (datos.notas.length) {
      datos.notas.forEach((n, i) => escribir(
        `${i + 1}. ${FORMATOS[n.tipo].titulo} — ${fechaHora(n.firmadaEn)}${n.adendas?.length ? ` (${n.adendas.length} adenda${n.adendas.length > 1 ? "s" : ""})` : ""}`,
        { size: 10, despues: 0.5 }
      ));
    } else {
      escribir("Sin notas firmadas.", { size: 10, color: GRIS });
    }
    y += 4;
    escribir(`Documento generado: ${fechaHora(new Date())} · Contiene datos personales sensibles: información confidencial (NOM-004-SSA3-2012, numeral 5.5; LFPDPPP).`, { size: 8.5, color: GRIS });
  }

  // ---------- Notas ----------
  datos.notas.forEach((nota, idx) => {
    if (!datos.soloNota || idx > 0) nuevaPagina();
    const formato = FORMATOS[nota.tipo];
    const pac = nota.paciente || {};
    const firma = nota.firma || {};
    encabezado(nota.establecimiento || est, formato.titulo, fechaHora(nota.firmadaEn));

    const datosPac = [
      ["Paciente", pac.nombreCompleto],
      ["Expediente", formatoExpediente(pac.numeroExpediente)],
      ["Edad", pac.edad != null ? `${pac.edad} años` : ""],
      ["Sexo", sexoTexto(pac.sexo)],
    ];
    if (nota.tipo === "historia_clinica") {
      datosPac.push(["Fecha de nacimiento", fechaLarga(pac.fechaNacimiento)], ["CURP", pac.curp]);
      datosPac.push(["Domicilio", pac.domicilio]);
      for (const [k, et] of [["grupoEtnico", "Grupo étnico"], ["ocupacion", "Ocupación"], ["estadoCivil", "Estado civil"], ["escolaridad", "Escolaridad"]]) {
        if (pac[k]) datosPac.push([et, pac[k]]);
      }
    }
    pares(datosPac);
    raya();

    const campos = nota.campos || {};
    for (const s of formato.secciones) {
      const unico = s.campos.length === 1 && s.campos[0].label === s.titulo;
      const items = [];
      for (const c of s.campos) {
        const v = campos[c.id];
        if (c.tipo === "medicamentos") {
          if (v?.length) items.push(["med", c, v]);
          continue;
        }
        const t = textoPlano(c, v);
        if (!t && !c.req) continue;
        items.push(["campo", c, t || "Sin registro"]);
      }
      if (!items.length) continue;
      tituloSeccion(s.titulo);
      if (s.columnas) {
        pares(items.map(([, c, t]) => [c.label, t]));
        continue;
      }
      for (const [tipo, c, val] of items) {
        if (tipo === "med") {
          escribir(c.label, { size: 8, color: GRIS });
          val.forEach((m, i) => escribir(
            `${i + 1}. ${m.nombre} — dosis: ${m.dosis}; vía: ${m.via}; periodicidad: ${m.periodicidad}${m.duracion ? `; duración: ${m.duracion}` : ""}`,
            { size: 10, x: M + 3, ancho: ANCHO - 3, despues: 0.6 }
          ));
        } else {
          if (!unico) escribir(c.label, { size: 8, color: GRIS });
          escribir(val, { size: 10, despues: 1.4 });
        }
      }
    }

    // Firma
    asegurar(34);
    y += 16;
    doc.setDrawColor(...NEGRO); doc.setLineWidth(0.3);
    doc.line(AN / 2 - 35, y, AN / 2 + 35, y);
    y += 2;
    escribir(firma.nombre, { size: 10.5, bold: true, alinear: "center" });
    escribir(
      `Cédula profesional ${firma.cedula || ""}${firma.especialidad ? ` · ${firma.especialidad}` : ""}${firma.cedulaEspecialidad ? ` · Cédula de especialidad ${firma.cedulaEspecialidad}` : ""}`,
      { size: 9, alinear: "center" }
    );
    escribir(`Nota cerrada en el sistema: ${fechaHora(nota.firmadaEn)} · No modificable`, { size: 8, color: GRIS, alinear: "center" });

    // Adendas
    if (nota.adendas?.length) {
      tituloSeccion("Adendas");
      for (const a of nota.adendas) {
        escribir(`${fechaHora(a.creadaEn)} · ${a.autor?.nombre || ""} · Cédula ${a.autor?.cedula || ""}`, { size: 8, color: GRIS });
        escribir(a.texto, { size: 10, despues: 2 });
      }
    }
  });

  // ---------- Pie de página ----------
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.setDrawColor(220, 220, 224);
    doc.line(M, AL - 12, AN - M, AL - 12);
    doc.text(pdfTexto(`${nombreCompleto(p)} · ${formatoExpediente(p.numeroExpediente)} · Confidencial`), M, AL - 8);
    doc.text(`Página ${i} de ${total}`, AN - M, AL - 8, { align: "right" });
  }

  doc.setProperties({
    title: `${datos.soloNota ? "Nota" : "Expediente clínico"} ${formatoExpediente(p.numeroExpediente)}`,
    subject: "Expediente clínico (NOM-004-SSA3-2012)",
    author: est.nombre || "",
    creator: "Expediente Clínico — Code-Reset",
  });
  return doc;
}

// Entrega el PDF: hoja de compartir en iPhone/Android, descarga en PC.
// Debe llamarse dentro del toque del usuario (iOS lo exige para compartir).
export async function entregarPDF(doc, datos, uid) {
  if (window.__DEMO__) { imprimir(datos, uid); return "demo"; } // demo: vista previa en pantalla
  const nombre = nombreArchivo(datos);
  const blob = doc.output("blob");
  const archivo = new File([blob], nombre, { type: "application/pdf" });
  registrar(uid, datos.soloNota ? "nota_pdf" : "expediente_pdf", { pacienteId: datos.paciente.id });
  const esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (esMovil && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre });
      return "compartido";
    } catch (e) {
      if (e.name === "AbortError") return "cancelado";
      // Si compartir falla, se descarga.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "descargado";
}

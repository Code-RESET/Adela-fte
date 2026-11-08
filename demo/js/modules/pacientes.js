// ============================================================
// modules/pacientes.js
// Lista y búsqueda de pacientes.
// ============================================================

import { listarPacientes } from "../db.js";
import { esc, nombreCompleto, edadTexto, formatoExpediente, fechaLarga } from "../util.js";

const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function renderPacientes(container, user) {
  container.innerHTML = `<p class="cargando">Cargando pacientes…</p>`;
  const pacientes = await listarPacientes(user.uid);

  container.innerHTML = `
    <div class="cabecera">
      <h2 class="titulo">Pacientes</h2>
      <a class="btn-primary btn-chico" href="#/paciente/nuevo">+ Nuevo paciente</a>
    </div>
    <input id="buscar" class="buscar" type="search" placeholder="Buscar por nombre, CURP o número de expediente" autocomplete="off" />
    <div id="lista" class="lista-ios"></div>`;

  const lista = container.querySelector("#lista");
  const pintar = (filtro = "") => {
    const f = normalizar(filtro);
    const vis = pacientes.filter((p) =>
      !f || normalizar(`${nombreCompleto(p)} ${p.curp} ${formatoExpediente(p.numeroExpediente)} ${p.numeroExpediente}`).includes(f)
    );
    lista.innerHTML = vis.length
      ? vis.map((p) => `
          <a class="fila-paciente" href="#/paciente/${encodeURIComponent(p.id)}">
            <strong>${esc(nombreCompleto(p))}</strong>
            <span>${esc(formatoExpediente(p.numeroExpediente))} · ${esc(edadTexto(p.fechaNacimiento))}${p.ultimoActoMedico ? ` · última atención ${esc(fechaLarga(p.ultimoActoMedico))}` : ""}</span>
          </a>`).join("")
      : `<p class="sub">${pacientes.length ? "Sin resultados." : "Todavía no hay pacientes registrados."}</p>`;
  };
  container.querySelector("#buscar").addEventListener("input", (e) => pintar(e.target.value));
  pintar();
}

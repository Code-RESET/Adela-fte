// ============================================================
// modules/configuracion.js
// Datos del médico y del establecimiento. Se capturan una vez y se
// copian a cada nota al firmarla (NOM-004 5.2.1, 5.2.2 y 5.10).
// ============================================================

import { PERFIL_MEDICO, perfilFaltante } from "../formatos-nom004.js";
import { htmlCampo, leerCampos } from "../formulario.js";
import { leerPerfil, guardarPerfil } from "../db.js";
import { aviso, esc } from "../util.js";

export async function renderConfiguracion(container, user) {
  container.innerHTML = `<p class="cargando">Cargando…</p>`;
  const perfil = await leerPerfil(user.uid);
  const faltan = perfilFaltante(perfil);

  container.innerHTML = `
    <h2 class="titulo">Mi consultorio</h2>
    <p class="sub">Estos datos aparecen en el encabezado de cada nota. Sin los obligatorios (*) no se puede firmar.</p>
    ${faltan.length ? `<div class="alerta">Faltan: ${faltan.map(esc).join(", ")}.</div>` : ""}
    <form id="form-perfil" class="tarjeta">
      ${PERFIL_MEDICO.map((c) => htmlCampo(c, perfil[c.id])).join("")}
      <button class="btn-primary" type="submit">Guardar</button>
    </form>`;

  container.querySelector("#form-perfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await guardarPerfil(user.uid, leerCampos(e.target, PERFIL_MEDICO));
      aviso("Datos del consultorio guardados.", "ok");
      renderConfiguracion(container, user);
    } catch (err) {
      aviso(`No se pudo guardar: ${err.message}`, "error");
      btn.disabled = false;
    }
  });
}

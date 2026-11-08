// ============================================================
// modules/dashboard.js
// Inicio: accesos rápidos y avisos de configuración pendiente.
// ============================================================

import { leerPerfil } from "../db.js";
import { perfilFaltante } from "../formatos-nom004.js";
import { dictadoDisponible } from "../dictado.js";
import { esc } from "../util.js";

export async function renderDashboard(container, user) {
  const perfil = await leerPerfil(user.uid);
  const faltan = perfilFaltante(perfil);
  container.innerHTML = `
    <h2 class="titulo">Inicio</h2>
    <p class="sub">${esc(perfil.nombreMedico || user?.email || "")}</p>
    ${faltan.length ? `<div class="alerta">Antes de firmar notas, completa <a href="#/configuracion">Mi consultorio</a> (faltan: ${faltan.map(esc).join(", ")}).</div>` : ""}
    ${dictadoDisponible() ? "" : `<div class="alerta">Aquí no está disponible el dictado de la app. Puedes dictar con el micrófono del teclado del teléfono.</div>`}
    <div class="accesos">
      <a class="acceso" href="#/paciente/nuevo"><strong>+ Nuevo paciente</strong><span>Ficha de identificación</span></a>
      <a class="acceso" href="#/pacientes"><strong>Buscar paciente</strong><span>Abrir expediente, historia clínica o nota de evolución</span></a>
    </div>
    <p class="sub legal">
      Expediente conforme a NOM-004-SSA3-2012 y NOM-024-SSA3-2012. Las notas firmadas no se pueden modificar;
      las correcciones se agregan como adenda. El médico revisa y firma cada nota y es responsable de su contenido.
    </p>`;
}

// ============================================================
// router.js
// Router simple por hash (#/ruta/param1/param2). No recarga la página.
// Cada módulo nuevo del proyecto se registra en MODULES abajo:
// eso es lo único que hay que tocar para agregar una sección.
// ============================================================

import { renderDashboard } from "./modules/dashboard.js";
import { renderPacientes } from "./modules/pacientes.js";
import { renderPaciente } from "./modules/paciente.js";
import { renderNota } from "./modules/nota.js";
import { renderConfiguracion } from "./modules/configuracion.js";
import { detenerDictado } from "./dictado.js";

// Registro de módulos.
// path   -> primera parte después de #/ en la URL
// label  -> texto del menú (si menu:false no aparece en el menú)
// render -> función (container, user, params) que pinta la vista;
//           params son las partes de la URL después del path.
// Íconos de la barra de pestañas (trazos de 24x24, estilo iOS).
const ICONOS = {
  inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  pacientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.1 4.4 1.8 5 4.9"/>',
  consultorio: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M12 8v6M9 11h6"/>',
};

const MODULES = [
  { path: "dashboard", label: "Inicio", icon: ICONOS.inicio, render: renderDashboard },
  { path: "pacientes", label: "Pacientes", icon: ICONOS.pacientes, render: renderPacientes },
  { path: "configuracion", label: "Consultorio", icon: ICONOS.consultorio, render: renderConfiguracion },
  { path: "paciente", label: "Paciente", render: renderPaciente, menu: false, activo: "pacientes" },
  { path: "nota", label: "Nota", render: renderNota, menu: false, activo: "pacientes" },
];

const nav = document.getElementById("app-nav");
const content = document.getElementById("app-content");

let currentUser = null;
let iniciado = false;

// Un módulo puede registrar aquí una función para avisar de cambios sin
// guardar antes de salir (la usa el editor de notas).
let guardiaSalida = null;
export function setGuardiaSalida(fn) {
  guardiaSalida = fn;
}

function buildNav() {
  nav.innerHTML = MODULES.filter((m) => m.menu !== false)
    .map((m) => `<a href="#/${m.path}" data-path="${m.path}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${m.icon || ""}</svg><span>${m.label}</span></a>`)
    .join("");
}

function setActiveLink(path) {
  nav.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.dataset.path === path);
    if (a.dataset.path === path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

async function renderRoute() {
  if (guardiaSalida) {
    const g = guardiaSalida;
    guardiaSalida = null;
    await g();
  }
  detenerDictado();
  const partes = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const path = partes[0] || MODULES[0]?.path;
  const mod = MODULES.find((m) => m.path === path) || MODULES[0];
  if (!mod) return;

  setActiveLink(mod.activo || mod.path);
  content.innerHTML = "";
  window.scrollTo(0, 0);
  try {
    await mod.render(content, currentUser, partes.slice(1));
  } catch (e) {
    console.error(e);
    content.innerHTML = `<div class="tarjeta error-text">No se pudo cargar esta sección: ${String(e.message || e).replace(/</g, "&lt;")}</div>`;
  }
}

export function initRouter(user) {
  currentUser = user;
  buildNav();
  if (!iniciado) {
    window.addEventListener("hashchange", renderRoute);
    iniciado = true;
  }
  renderRoute();
}

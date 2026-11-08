// ============================================================
// auth.js — VERSIÓN DEMO (sin Firebase). Acepta cualquier correo.
// ============================================================
import { initRouter } from "./router.js";
window.__DEMO__ = true;

// En la página de vista previa no existen las ventanas de confirmación del
// navegador; en la demo se acepta todo.
window.confirm = () => true;

// Imprimir / Guardar: en la demo se muestra la hoja en pantalla.
window.print = () => {
  const imp = document.getElementById("impresion");
  if (!imp) return;
  document.body.classList.remove("imprimiendo");
  document.body.classList.add("vista-previa");
  const barra = document.createElement("div");
  barra.className = "vista-previa-barra";
  barra.innerHTML = `<span>Vista previa del documento. En la app instalada este botón guarda el PDF o abre la impresora.</span><button class="btn-primary btn-chico" type="button">Cerrar</button>`;
  imp.prepend(barra);
  barra.querySelector("button").addEventListener("click", () => {
    imp.remove();
    document.body.classList.remove("vista-previa");
  });
  imp.scrollTop = 0;
};

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const usuario = { uid: "demo", email: "demo@consultorio.mx" };

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  loginScreen.hidden = true;
  appShell.hidden = false;
  if (!location.hash) location.hash = "#/dashboard";
  initRouter(usuario);
});
document.getElementById("logout-btn").addEventListener("click", () => {
  appShell.hidden = true;
  loginScreen.hidden = false;
});

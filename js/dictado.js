// ============================================================
// dictado.js
// Dictado por campo con el reconocimiento de voz del navegador
// (SpeechRecognition, es-MX). Gratis; necesita internet y funciona
// mejor en Chrome. Fase 1 del proyecto.
//
// Uso: activarDictado(contenedor)
//  - Busca los campos con atributo data-dictado y les pone un botón 🎤.
//  - Un solo campo escucha a la vez.
//  - Lo dictado se AGREGA al texto existente; nunca lo borra.
// ============================================================

import { aviso } from "./util.js";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const ERRORES = {
  "not-allowed": "Micrófono bloqueado. Actívalo en el candado de la barra de direcciones.",
  "service-not-allowed": "El navegador no permite el dictado en esta página.",
  "no-speech": "No se detectó voz. Habla más cerca del micrófono.",
  "audio-capture": "No se encontró micrófono en el equipo.",
  "network": "El dictado necesita internet y no hay conexión.",
  "language-not-supported": "Este navegador no reconoce español de México.",
};

let activo = null; // { rec, boton, campo }

export function dictadoDisponible() {
  return Boolean(SR);
}

export function detenerDictado() {
  if (activo) activo.rec.stop();
}

// Por qué no se puede dictar aquí (o null si sí se puede).
function motivoSinDictado() {
  let enMarco = false;
  try { enMarco = window.self !== window.top; } catch { enMarco = true; }
  if (enMarco) return "Esta vista previa no permite usar el micrófono. En la app publicada sí funciona.";
  if (!window.isSecureContext) return "El dictado solo funciona en una dirección segura (https).";
  if (!SR) {
    const esIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return esIOS
      ? "Este modo de abrir la app no trae dictado. Ábrela en Safari, o usa el micrófono del teclado del iPhone."
      : "Este navegador no trae dictado. Usa Chrome, o el micrófono del teclado.";
  }
  return null;
}

export function activarDictado(root) {
  const motivo = motivoSinDictado();
  root.querySelectorAll("[data-dictado]").forEach((campo) => {
    if (campo.dataset.dictadoListo || campo.disabled || campo.readOnly) return;
    campo.dataset.dictadoListo = "1";
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "mic";
    boton.textContent = "🎤";
    boton.title = "Dictar";
    boton.setAttribute("aria-label", "Dictar este campo");
    const parcial = document.createElement("div");
    parcial.className = "dictado-parcial";
    campo.insertAdjacentElement("afterend", boton);
    boton.insertAdjacentElement("afterend", parcial);
    if (motivo) {
      // El botón se ve igual, pero explica por qué no escucha y qué hacer.
      boton.classList.add("mic-no-disponible");
      boton.addEventListener("click", () => {
        aviso(`${motivo} Mientras tanto: toca el campo y usa el 🎤 del teclado.`, "error");
        campo.focus();
      });
    } else {
      boton.addEventListener("click", () => alternar(campo, boton, parcial));
    }
  });
}

function alternar(campo, boton, parcial) {
  if (activo && activo.campo === campo) return activo.rec.stop();
  if (activo) {
    activo.rec.onend = null;
    activo.rec.abort();
    activo.boton.classList.remove("on");
    activo.parcial.textContent = "";
    activo = null;
  }
  iniciar(campo, boton, parcial);
}

function iniciar(campo, boton, parcial) {
  const rec = new SR();
  rec.lang = "es-MX";
  rec.continuous = true;
  rec.interimResults = true;

  const base = campo.value ? campo.value.trimEnd() + " " : "";
  let final = "";

  rec.onstart = () => boton.classList.add("on");
  rec.onresult = (ev) => {
    let p = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) final += r[0].transcript;
      else p += r[0].transcript;
    }
    campo.value = base + final.trim();
    parcial.textContent = p;
    campo.dispatchEvent(new Event("input", { bubbles: true })); // dispara el autoguardado
  };
  rec.onerror = (ev) => {
    if (ev.error !== "aborted") aviso(ERRORES[ev.error] || `Error de dictado: ${ev.error}`, "error");
  };
  rec.onend = () => {
    boton.classList.remove("on");
    parcial.textContent = "";
    activo = null;
  };

  activo = { rec, boton, campo, parcial };
  try {
    rec.start();
  } catch (e) {
    aviso(`No se pudo iniciar el dictado: ${e.message}`, "error");
    activo = null;
  }
}

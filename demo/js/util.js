// ============================================================
// util.js
// Funciones pequeñas que usan varios módulos.
// esc() es OBLIGATORIO al pintar con innerHTML cualquier dato que
// venga de Firestore o del usuario: evita que un texto como
// "<img onerror=...>" se ejecute como código (XSS).
// ============================================================

export function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Convierte Timestamp de Firestore, Date o string a Date.
export function aFecha(v) {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  if (v instanceof Date) return v;
  // "AAAA-MM-DD" se interpreta como fecha local, no UTC.
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [a, m, d] = v.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

export function fechaLarga(v) {
  const d = aFecha(v);
  return d ? d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export function fechaHora(v) {
  const d = aFecha(v);
  return d
    ? d.toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
}

// Edad en años cumplidos a una fecha dada (por defecto hoy).
export function edad(fechaNacimiento, aLaFecha = new Date()) {
  const n = aFecha(fechaNacimiento);
  const r = aFecha(aLaFecha);
  if (!n || !r) return null;
  let e = r.getFullYear() - n.getFullYear();
  const m = r.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < n.getDate())) e--;
  return e;
}

export function edadTexto(fechaNacimiento, aLaFecha) {
  const e = edad(fechaNacimiento, aLaFecha);
  return e == null ? "" : `${e} ${e === 1 ? "año" : "años"}`;
}

export function nombreCompleto(p) {
  return [p?.nombre, p?.primerApellido, p?.segundoApellido].filter(Boolean).join(" ");
}

// Número de expediente legible: 1 -> "EXP-00001"
export function formatoExpediente(n) {
  return n == null ? "" : `EXP-${String(n).padStart(5, "0")}`;
}

// Aviso flotante breve.
export function aviso(msg, tipo = "info") {
  document.querySelectorAll(".toast").forEach((t) => t.remove()); // uno a la vez, como en iOS
  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), tipo === "error" ? 5000 : 2500);
}

export function ir(ruta) {
  location.hash = `#/${ruta}`;
}

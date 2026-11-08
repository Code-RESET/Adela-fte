# Demo del expediente (sin Firebase)

Copia de la app con una base de datos de ejemplo guardada solo en el navegador (`localStorage`).
Sirve para mostrar el avance sin conectar Firebase. Acepta cualquier correo y contraseña.

Diferencias con la app real (`../`):
- `js/firebase-config.js`, `js/auth.js` y `js/db.js` son versiones demo.
- `js/documento-expediente.js`: en demo, "Guardar" muestra la vista previa en pantalla.
- `window.confirm` siempre acepta y `window.print` muestra la hoja en pantalla.
- Datos del doctor y del consultorio reales; pacientes de ejemplo.

Para regenerarla tras cambios en la app: copiar `css/`, `js/` y `assets/` de la raíz
y volver a aplicar esas diferencias. Borrar los datos de ejemplo: subir `CLAVE` en `js/db.js`.

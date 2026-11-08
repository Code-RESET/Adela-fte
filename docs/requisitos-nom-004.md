# Requisitos NOM-004-SSA3-2012 → campos de la app

Fuente: DOF, lunes 15 de octubre de 2012 (Cuarta Sección), texto completo revisado.
Alcance: consulta general y de especialidad (consultorio). Los numerales entre
corchetes son de la norma; "Ap. A" = Apéndice A (informativo, modelo de evaluación).

> Esto es una lectura técnica para diseñar la app, no una opinión legal.

---

## 1. Datos generales del expediente [5.2]

| Campo | Numeral | Nota |
|---|---|---|
| Tipo, nombre y domicilio del establecimiento | 5.2.1 | Configuración del consultorio, se captura una vez |
| Institución a la que pertenece (en su caso) | 5.2.1 | Opcional |
| Razón/denominación social del propietario (en su caso) | 5.2.2 | Opcional |
| Nombre, **sexo, edad** y domicilio del paciente | 5.2.3 | Edad se calcula de la fecha de nacimiento |
| Número único de expediente | 5.9, Ap. A D1.2 | Lo genera la app |

**La NOM-004 no exige CURP**, pero la **NOM-024 sí** (Tabla 1, ver sección 12): se captura
siempre que el paciente la tenga. La app no la genera (NOM-024 6.5.1).

## 2. Encabezado de TODA nota [5.9, 5.10]

- Nombre completo del paciente, edad, sexo, número de expediente
- Fecha y hora de elaboración
- Nombre completo de quien la elabora
- Firma autógrafa, electrónica o digital "sujeta a las disposiciones jurídicas aplicables"
- Cédula profesional: no está en el cuerpo de la norma, pero el Ap. A la evalúa → **incluirla**

## 3. Reglas de redacción [5.11] — impactan el dictado

- Lenguaje técnico-médico, **sin abreviaturas** → la IA (fase 2) debe expandir
  "TA", "FUM", "G2P1" a texto completo en el contenido de las notas.
- **Sin enmendaduras ni tachaduras** → en versión electrónica: una nota firmada
  queda **bloqueada**; las correcciones se agregan como adenda con fecha, hora y autor.
  Nunca se borra ni se sobrescribe.

## 4. Historia clínica [6.1] — en este orden

### 4.1 Interrogatorio [6.1.1]
- Ficha de identificación
- Grupo étnico (en su caso)
- Antecedentes heredo-familiares
- Antecedentes personales patológicos, **incluido uso y dependencia de tabaco, alcohol y otras sustancias psicoactivas**
- Antecedentes personales no patológicos
- Padecimiento actual, **indagando tratamientos previos convencionales, alternativos y tradicionales**
- **Interrogatorio por aparatos y sistemas**

### 4.2 Exploración física [6.1.2]
- **Habitus exterior**
- Signos vitales: temperatura, tensión arterial, frecuencia cardiaca, frecuencia respiratoria
- Peso y talla
- Cabeza, cuello, tórax, abdomen, miembros y genitales

### 4.3 Resto
- Resultados previos y actuales de laboratorio, gabinete y otros [6.1.3]
- Diagnósticos o problemas clínicos [6.1.4] (CIE-10 no es obligatorio; se puede ofrecer como ayuda)
- **Pronóstico** [6.1.5]
- Indicación terapéutica [6.1.6]
- Ap. A también evalúa: terapéutica empleada y resultados (medicamento, vía, dosis, periodicidad)

## 5. Nota de evolución [6.2]

La norma **no pide formato SOAP**; pide estos 6 puntos:

1. Evolución y actualización del cuadro clínico (en su caso tabaco/alcohol/sustancias)
2. Signos vitales, según se considere necesario
3. Resultados relevantes de estudios solicitados previamente
4. Diagnósticos o problemas clínicos
5. **Pronóstico**
6. Tratamiento e indicaciones; medicamentos con **dosis, vía de administración y periodicidad** (mínimo)

Se puede presentar en pantalla agrupado como SOAP, siempre que estos 6 campos existan.
Recomendación: el medicamento como sub-formulario (nombre / dosis / vía / periodicidad),
no texto libre, para que nunca falte uno de los tres datos.

## 6. Otras notas de consultorio (cuando apliquen)

| Nota | Numeral | Contenido mínimo |
|---|---|---|
| Interconsulta | 6.3 | Criterios diagnósticos, plan de estudios, sugerencias diagnósticas y tratamiento |
| Referencia/traslado | 6.4 | Establecimiento que envía y receptor; resumen clínico: motivo de envío, impresión diagnóstica, terapéutica empleada |
| Resumen clínico | 4.10 | Padecimiento actual, diagnósticos, tratamientos, evolución, pronóstico, estudios |

## 7. Consentimiento informado [10.1] — relevante en ginecoobstetricia

Obligatorio, entre otros, para: ingreso hospitalario, cirugía mayor, anestesia general
o regional, **salpingoclasia**, procedimientos de alto riesgo.

Contenido mínimo [10.1.1]: institución (en su caso), nombre del establecimiento, título,
lugar y fecha, acto autorizado, riesgos y beneficios, autorización para contingencias,
nombre y firma del paciente (o familiar/tutor/representante), nombre y firma del médico,
**nombre y firma de dos testigos**.

## 8. Normas relacionadas que también aplican [5.14]

El expediente debe observar además las NOM de los numerales 3.2, 3.5, 3.8, 3.15, entre otras.
Para este consultorio las relevantes son (la NOM-004 cita versiones viejas "o las que las sustituyan"):

- **Atención de la mujer durante embarazo, parto y puerperio** (cita NOM-007-SSA2-1993) → control prenatal
- **Planificación familiar** (cita NOM-005-SSA2-1993)
- **Cáncer cérvico-uterino** (cita NOM-014-SSA2-1994)
- **Violencia familiar, sexual y contra las mujeres** (NOM-046-SSA2-2005)

Por eso los antecedentes gineco-obstétricos (gestas, partos, cesáreas, abortos, FUM,
semanas de gestación, método de planificación, citologías) **no son solo una sugerencia**:
se sostienen vía 5.14. Pendiente: revisar las versiones vigentes de esas normas.

## 9. Conservación y confidencialidad

- Conservar **mínimo 5 años desde el último acto médico** [5.4]
- El expediente es propiedad del prestador; el paciente tiene derechos de titularidad sobre sus datos [5.4]
- Solo se entrega a terceros con solicitud escrita del paciente/tutor/representante [5.5.1],
  o a autoridades judiciales, de procuración de justicia o administrativas [5.6, 5.7]
- Uso en docencia/publicación con fotos que identifiquen: autorización escrita del paciente [5.5]
- Si hay contrato de servicios con el paciente, copia en el expediente [5.19]

## 10. Fuera de alcance (hospitalización, salvo que el doctor lo pida)

Notas de urgencias [7], ingreso, pre/postoperatoria, egreso [8], hoja de enfermería [9.1],
egreso voluntario [10.2], notificación al MP [10.3], defunción [10.5].
Normalmente las elabora el hospital donde opera, en su propio expediente.

## 11. Pendientes legales (no se resuelven con esta norma)

- **Firma electrónica** [5.10]: un botón "Firmar" no equivale por sí solo a firma
  electrónica con validez legal. Definir si se usa e.firma (SAT) o se imprime y firma autógrafa.
- **NOM-024-SSA3-2012**: revisada, ver sección 12.
- **LFPDPPP**: aviso de privacidad y consentimiento para datos sensibles.

---

## 12. NOM-024-SSA3-2012 — Sistemas de registro electrónico para la salud

Fuente: DOF, viernes 30 de noviembre de 2012 (Segunda Sección). Texto completo revisado.

### Qué pide y cómo lo cubre la app

| Requisito | Numeral | En la app |
|---|---|---|
| Documentos electrónicos **estructurados e inalterables** | 6.3.4, 6.6.2 | Nota firmada bloqueada por `firestore.rules`; correcciones solo por adenda |
| Datos completos e inalterados | 5.9 | Ídem; pacientes y notas firmadas no se pueden borrar |
| Confidencialidad, integridad, disponibilidad, **trazabilidad** y no repudio | 6.6.1 | Cada médico solo ve lo suyo; **bitácora** de solo agregar (alta, edición, firma, consulta, impresión, exportación) con hora del servidor |
| Autenticación con usuario y contraseña; **se recomienda segundo factor** | 6.6.3 | Firebase Auth (correo + contraseña). Segundo factor: pendiente (ver abajo) |
| Autorización **basada en roles** | 6.6.4 | Hoy hay un solo rol (médico dueño de sus datos). Si se agrega asistente/recepción, se definen roles en las reglas |
| Permitir **firma electrónica avanzada** | 6.6.2 | Pendiente: integrar e.firma (SAT). Hoy: cierre electrónico + impresión con firma autógrafa |
| **Exportar** la información del paciente | 6.6.6 | Botón "Exportar expediente (archivo JSON)" |
| Controles sobre los **consentimientos** del titular | 6.6.6 | Pendiente: registro del consentimiento de aviso de privacidad por paciente |
| Datos mínimos de identificación (Tabla 1) | 6.5.3 | CURP, nombre, apellidos, fecha de nacimiento, entidad de nacimiento, sexo (M/H), nacionalidad, folio (= número de expediente), entidad/municipio/localidad de residencia |
| Catálogos fundamentales (Apéndice A) | 6.4.2 | Entidades federativas (INEGI) y vías de administración: sí. CIE-10 para diagnósticos y Cuadro Básico de medicamentos: pendiente |
| Interoperabilidad (HL7 CDA, Guías y Formatos de la DGIS) | 6.1, 6.3.1 | Solo aplica al **intercambio** con otros prestadores; fuera de alcance de la fase 1 |

### Ojo: a quién obliga

- Obliga a los establecimientos que adopten un sistema electrónico **y a quien tenga derechos de
  propiedad, autoría, distribución o comercialización del sistema** (1.2). Es decir, **también a Code-Reset**.
- El capítulo 7 describe la **certificación** del sistema ante la DGIS (dictamen de verificación,
  certificado con vigencia de 2 años, 7.5.3). Hay que decidir con el doctor y, de preferencia, con un
  abogado si se busca certificar o cómo se comunica que no está certificado.

### Pendientes derivados de la NOM-024

1. Segundo factor de autenticación (Firebase Auth lo soporta con SMS o app TOTP; requiere Identity Platform).
2. Firma electrónica avanzada (e.firma del SAT).
3. Consentimiento del paciente (aviso de privacidad, LFPDPPP) registrado en el expediente.
4. Catálogo CIE-10 para diagnósticos y Cuadro Básico para medicamentos.
5. Bitácora a prueba de manipulación del cliente: hoy la escribe la app; con Cloud Functions
   (plan Blaze de Firebase) la escribiría el servidor.
6. Definir respaldo/exportación periódica para garantizar disponibilidad por 5 años.

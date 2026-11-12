/*
 * Utilidades comunes del frontend SCOSIE.
 * Regla de seguridad: cualquier dato que venga de la BD o del usuario se
 * inserta con textContent o pasa por escapeHTML() / la plantilla html``.
 */

/** Escapa caracteres especiales para insertar texto dentro de HTML. */
export function escapeHTML(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Marca un fragmento como HTML de confianza (generado por nuestro código). */
class HtmlSeguro {
  constructor(texto) { this.texto = texto; }
  toString() { return this.texto; }
}
export const seguro = (texto) => new HtmlSeguro(texto);

/**
 * Plantilla etiquetada: html`<td>${dato}</td>` escapa automáticamente cada
 * valor interpolado. Los arreglos se unen y los HtmlSeguro se dejan tal cual.
 */
export function html(partes, ...valores) {
  const convertir = (v) => {
    if (v instanceof HtmlSeguro) return v.texto;
    if (Array.isArray(v)) return v.map(convertir).join('');
    return escapeHTML(v);
  };
  let salida = partes[0];
  valores.forEach((v, i) => { salida += convertir(v) + partes[i + 1]; });
  return seguro(salida);
}

/* ---------------- Fechas y horas ---------------- */

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const dos = (n) => String(n).padStart(2, '0');

/**
 * Convierte la fecha que manda la API a un Date local.
 * Ojo: mysql2 serializa las columnas DATE como ISO en UTC
 * (p. ej. "2026-11-11T06:00:00.000Z" para el 11 de nov en CDMX), así que
 * se interpreta con new Date() y se muestra en hora local del navegador.
 * Si llega solo "YYYY-MM-DD" se toma como fecha local (sin desfase).
 */
export function aFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return isNaN(valor) ? null : valor;
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) return new Date(+soloFecha[1], +soloFecha[2] - 1, +soloFecha[3]);
  const d = new Date(valor);
  return isNaN(d) ? null : d;
}

/** "YYYY-MM-DD" en hora local (sirve para comparar "¿es hoy?"). */
export function claveDia(valor = new Date()) {
  const d = aFecha(valor);
  if (!d) return '';
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export const esHoy = (valor) => claveDia(valor) === claveDia(new Date());

/** "mié 24 oct 2026" */
export function formatoFechaCorta(valor) {
  const d = aFecha(valor);
  if (!d) return '—';
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** "miércoles, 24 de octubre de 2026" */
export function formatoFechaLarga(valor = new Date()) {
  const d = aFecha(valor);
  if (!d) return '—';
  return `${DIAS_LARGOS[d.getDay()]}, ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Convierte un TIME de MySQL ("07:42:00") a "07:42". Nulo → "--:--". */
export function formatoHora(valor) {
  if (!valor) return '--:--';
  const m = /^(\d{1,2}):(\d{2})/.exec(String(valor));
  return m ? `${dos(m[1])}:${m[2]}` : String(valor);
}

/** Horas entre dos TIME ("07:30:00", "17:00:00") → 9.5. Nulo si falta alguna. */
export function horasEntre(entrada, salida) {
  const min = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
  const a = min(entrada), b = min(salida);
  if (a === null || b === null || b < a) return null;
  return Math.round(((b - a) / 60) * 10) / 10;
}

/** Hora actual "14:28:40". */
export const horaActual = (d = new Date()) => `${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;

/** Actualiza un elemento cada segundo con la función de formato dada. */
export function iniciarReloj(elemento, formato = horaActual) {
  if (!elemento) return () => {};
  const pintar = () => { elemento.textContent = formato(new Date()); };
  pintar();
  const id = setInterval(pintar, 1000);
  return () => clearInterval(id);
}

/* ---------------- Personas ---------------- */

/** "Carlos Mendoza Ruiz" → "CM" */
export function iniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const letras = partes.length === 1 ? partes[0].slice(0, 2) : partes[0][0] + partes[1][0];
  return letras.toUpperCase();
}

/** Avatar circular con iniciales (sin imágenes externas). */
export function avatar(nombre, tamano = 'w-9 h-9 text-label-md') {
  return html`<span class="${tamano} inline-flex items-center justify-center rounded-full bg-primary-container text-on-primary font-semibold shrink-0" aria-hidden="true">${iniciales(nombre)}</span>`;
}

/* ---------------- Badges y etiquetas ---------------- */

// Tonos de badge según DESIGN.md (texto contrastado + fondo tinte + borde).
const TONOS = {
  info: 'bg-info-tinte text-info-texto border-info-borde',
  proceso: 'bg-aviso-tinte text-aviso-texto border-aviso-borde',
  ok: 'bg-ok-tinte text-ok-texto border-ok-borde',
  archivo: 'bg-archivo-tinte text-archivo-texto border-archivo-borde',
  peligro: 'bg-peligro-tinte text-peligro-texto border-peligro-borde',
  neutro: 'bg-surface-container text-on-surface-variant border-outline-variant/60',
};

export function badge(texto, tono = 'neutro', { punto = false } = {}) {
  const clases = TONOS[tono] || TONOS.neutro;
  const marca = punto ? seguro('<span class="w-1.5 h-1.5 rounded-full bg-current"></span>') : '';
  return html`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-label-sm whitespace-nowrap ${clases}">${marca}${texto}</span>`;
}

/** Badge para el estado de una obra (columna OBRAS.estado, texto libre). */
export function badgeEstadoObra(estado) {
  const e = String(estado || '').toLowerCase();
  if (e.includes('termin') || e.includes('cerrad')) return badge(estado, 'ok');
  if (e.includes('proceso') || e.includes('ejecuci') || e.includes('activa')) return badge(estado, 'proceso', { punto: true });
  if (e.includes('cotiz') || e.includes('planea')) return badge(estado, 'info');
  if (e.includes('archiv') || e.includes('cancel')) return badge(estado, 'archivo');
  return badge(estado || 'Sin estado', 'neutro');
}

/** Etiqueta que marca que una sección usa datos de mock.js. */
export function chipDemo() {
  return seguro('<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-outline text-label-sm text-on-surface-variant bg-surface-container-lowest whitespace-nowrap" title="Esta sección aún no tiene endpoint; muestra datos de mock.js"><span class="material-symbols-outlined text-[14px]">science</span>Datos de ejemplo</span>');
}

/* ---------------- Estados de carga / vacío / error ---------------- */

function bloqueEstado(icono, titulo, detalle, tono) {
  const color = tono === 'error' ? 'text-peligro-texto' : 'text-on-surface-variant';
  const spin = icono === 'progress_activity' ? ' animate-spin' : '';
  return html`<div class="flex flex-col items-center justify-center text-center gap-space-xs py-space-2xl px-space-lg ${color}" role="${tono === 'error' ? 'alert' : 'status'}">
    <span class="material-symbols-outlined text-[32px]${spin}">${icono}</span>
    <p class="text-title-md">${titulo}</p>
    ${detalle ? html`<p class="text-body-sm text-on-surface-variant max-w-sm">${detalle}</p>` : ''}
  </div>`;
}

export const estadoCarga = (texto = 'Cargando…') => bloqueEstado('progress_activity', texto, '', 'carga');
export const estadoVacio = (texto = 'Sin registros', detalle = '') => bloqueEstado('inbox', texto, detalle, 'vacio');
/**
 * Estado de error. Con reintentar=true agrega un botón data-accion="reintentar"
 * que la página conecta con su función de carga.
 */
export function estadoError(detalle = 'Intenta de nuevo más tarde.', { reintentar = true } = {}) {
  const boton = reintentar
    ? html`<div class="flex justify-center -mt-space-lg pb-space-xl"><button type="button" data-accion="reintentar" class="inline-flex items-center gap-1 h-10 px-space-md rounded border border-slate-300 bg-white text-label-md text-primary-container hover:bg-slate-50 hover:border-slate-400"><span class="material-symbols-outlined text-[18px]">refresh</span>Reintentar</button></div>`
    : '';
  return html`${bloqueEstado('error', 'No se pudieron cargar los datos', detalle, 'error')}${boton}`;
}

/** Conecta los botones "Reintentar" de un contenedor con una función. */
export function alReintentar(contenedor, funcion) {
  contenedor?.addEventListener('click', (e) => {
    if (e.target.closest('[data-accion="reintentar"]')) funcion();
  });
}

/** Igual que los anteriores pero dentro de una fila de tabla. */
export function filaEstado(columnas, contenido) {
  return html`<tr><td colspan="${columnas}">${contenido}</td></tr>`;
}

/** Inserta HTML generado con html`` en un elemento. */
export function pintar(elemento, contenido) {
  if (elemento) elemento.innerHTML = String(contenido);
}

/* ---------------- Avisos flotantes ---------------- */

export function mostrarAviso(mensaje, tono = 'info') {
  let caja = document.getElementById('sie-avisos');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'sie-avisos';
    caja.className = 'fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2';
    caja.setAttribute('aria-live', 'polite');
    document.body.appendChild(caja);
  }
  const iconos = { info: 'info', ok: 'check_circle', peligro: 'error', proceso: 'schedule' };
  const aviso = document.createElement('div');
  aviso.className = `flex items-start gap-2 p-space-md rounded border shadow-elev-3 text-body-md ${TONOS[tono] || TONOS.info}`;
  const icono = document.createElement('span');
  icono.className = 'material-symbols-outlined text-[20px]';
  icono.textContent = iconos[tono] || 'info';
  const texto = document.createElement('p');
  texto.className = 'flex-1';
  texto.textContent = mensaje;
  aviso.append(icono, texto);
  caja.appendChild(aviso);
  setTimeout(() => aviso.remove(), 5000);
}

/** Formato de moneda MXN: 485000 → "$485,000 MXN" */
export function formatoMXN(valor) {
  const n = Number(valor);
  if (!isFinite(n)) return '—';
  return `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN`;
}

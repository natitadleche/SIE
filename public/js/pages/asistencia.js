/*
 * Mi Asistencia (asistencia.html).
 *  - Mi check-in: reloj en vivo y datos de la sesión (reales); obra vigente desde
 *    GET /api/trabajador/asignaciones (real); estatus, historial y métricas desde
 *    mock.js (sin endpoint). Entrada/salida: pendientes de endpoint.
 *  - Monitor general (JefeAdmin/Admin): GET /api/jefe/asistencia-obras (real),
 *    incluida la ubicación registrada en ASISTENCIA_DIARIA.
 */
import { montarLayout } from '../layout.js';
import { esAdministrativo, ETIQUETAS_ROL } from '../session.js';
import * as api from '../api.js';
import {
  html, pintar, avatar, badge, chipDemo, estadoCarga, estadoVacio, estadoError, alReintentar, mostrarAviso,
  esHoy, aFecha, formatoFechaLarga, formatoFechaCorta, formatoHora, horasEntre,
} from '../utils.js';

const sesion = montarLayout('asistencia', 'Mi Asistencia');
const $ = (id) => document.getElementById(id);
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const JORNADA_SEMANAL_MAX = 48; // horas (jornada máxima semanal de referencia)
let asistenciaHoy = null;       // registro (mock) de hoy del usuario
let monitorCargado = false;

/* =====================================================================
 * Pestañas (solo administración ve "Monitor general")
 * ===================================================================== */

function cambiarVista(vista) {
  $('vista-individual').classList.toggle('hidden', vista !== 'individual');
  $('vista-monitor').classList.toggle('hidden', vista !== 'monitor');
  $('vista-monitor').classList.toggle('flex', vista === 'monitor');
  document.querySelectorAll('#pestanas [data-vista]').forEach((b) => {
    const activa = b.dataset.vista === vista;
    b.setAttribute('aria-selected', String(activa));
    b.className = `inline-flex items-center gap-space-xs h-10 px-space-md rounded text-label-md ${activa
      ? 'bg-surface-container-lowest text-primary shadow-elev-1' : 'text-on-surface-variant hover:text-on-surface'}`;
  });
  if (vista === 'monitor' && !monitorCargado) cargarMonitor();
}

/* =====================================================================
 * Reloj
 * ===================================================================== */

function iniciarRelojGrande() {
  const dos = (n) => String(n).padStart(2, '0');
  const pintarHora = () => {
    const d = new Date();
    const h = d.getHours() % 12 || 12;
    $('reloj-grande').textContent = `${dos(h)}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
    $('reloj-ampm').textContent = d.getHours() < 12 ? 'a. m.' : 'p. m.';
    $('fecha-grande').textContent = capitalizar(formatoFechaLarga(d));
  };
  pintarHora();
  setInterval(pintarHora, 1000);
}

/* =====================================================================
 * Mi check-in
 * ===================================================================== */

function pintarUsuario() {
  pintar($('ind-usuario'), html`${avatar(sesion.nombre, 'w-14 h-14 text-title-md')}
    <div class="min-w-0">
      <p class="text-headline-md text-on-surface truncate">${sesion.nombre}</p>
      <p class="text-body-sm text-on-surface-variant flex flex-wrap items-center gap-x-space-sm">
        <span>${ETIQUETAS_ROL[sesion.rol] || sesion.rol}</span>
        <span class="tabular">ID de usuario #${sesion.id_usuario}</span>
      </p>
    </div>`);
}

function pintarEstatus(r) {
  if (!r.ok) {
    pintar($('ind-estatus'), html`<p class="text-label-sm uppercase text-on-surface-variant">Estatus hoy</p>
      <p class="text-body-md text-peligro-texto">No disponible</p>`);
    return;
  }
  const a = r.data;
  let texto; let color;
  if (!a.hora_entrada) { texto = 'Sin registrar entrada'; color = 'bg-aviso'; }
  else if (!a.hora_salida) { texto = `En turno desde ${formatoHora(a.hora_entrada)}`; color = 'bg-ok'; }
  else { texto = `Jornada cerrada ${formatoHora(a.hora_entrada)}–${formatoHora(a.hora_salida)}`; color = 'bg-archivo'; }
  pintar($('ind-estatus'), html`<div class="flex items-center justify-between gap-space-sm">
      <p class="text-label-sm uppercase text-on-surface-variant">Estatus hoy</p>${r.mock ? chipDemo() : ''}</div>
    <p class="mt-1 text-title-md text-on-surface flex items-center gap-space-xs"><span class="w-2.5 h-2.5 rounded-full ${color}"></span>${texto}</p>`);

  // La salida solo tiene sentido si hay entrada sin salida.
  const puedeSalir = Boolean(a.hora_entrada && !a.hora_salida);
  $('btn-salida').setAttribute('aria-disabled', String(!puedeSalir));
  $('btn-salida').classList.toggle('opacity-60', !puedeSalir);
  $('btn-salida-ayuda').textContent = puedeSalir ? 'Cierra tu jornada de hoy' : 'Requiere registrar la entrada primero';
}

function pintarObraVigente(r) {
  const encabezado = html`<p class="text-label-sm uppercase text-on-surface-variant">Obra asignada hoy</p>`;
  if (!r.ok) {
    pintar($('ind-obra'), html`${encabezado}<p class="mt-1 text-body-md text-peligro-texto">No se pudo consultar: ${r.error}</p>`);
    return;
  }
  const hoy = r.data.filter((f) => esHoy(f.fecha_asignacion));
  if (hoy.length === 0) {
    pintar($('ind-obra'), html`${encabezado}<p class="mt-1 text-title-md text-on-surface-variant">Sin obra asignada hoy</p>
      <p class="text-body-sm text-on-surface-variant">Consulta tu asignación con la administración.</p>`);
    return;
  }
  const o = hoy[0];
  pintar($('ind-obra'), html`${encabezado}<p class="mt-1 text-title-lg text-on-surface">${o.obra}</p>
    <p class="text-body-sm text-on-surface-variant">${o.direccion || 'Sin dirección registrada'}</p>`);
}

function pintarUbicacion(rHoy, rHist) {
  const titulo = html`<div class="flex items-center justify-between gap-space-sm">
    <p class="text-title-md text-on-surface">Ubicación registrada</p>${rHoy.mock ? chipDemo() : ''}</div>`;
  const icono = html`<span class="w-11 h-11 shrink-0 rounded bg-secondary-fixed text-secondary inline-flex items-center justify-center"><span class="material-symbols-outlined">location_on</span></span>`;
  if (!rHoy.ok) {
    pintar($('ind-ubicacion'), html`<div class="flex gap-space-md">${icono}<div class="flex-1">${titulo}
      <p class="text-body-sm text-peligro-texto">${rHoy.error}</p></div></div>`);
    return;
  }
  let detalle;
  if (rHoy.data.ubicacion) {
    detalle = html`<p class="text-body-md">${rHoy.data.ubicacion}</p><p class="text-body-sm text-on-surface-variant">Registrada con la entrada de hoy.</p>`;
  } else {
    const ultima = rHist.ok ? rHist.data.find((f) => f.ubicacion) : null;
    detalle = html`<p class="text-body-md text-on-surface-variant">Aún no hay ubicación registrada hoy.</p>
      ${ultima ? html`<p class="text-body-sm text-on-surface-variant">Última registrada: <strong class="text-on-surface">${ultima.ubicacion}</strong> (${formatoFechaCorta(ultima.fecha)})</p>` : ''}`;
  }
  pintar($('ind-ubicacion'), html`<div class="flex gap-space-md">${icono}<div class="flex-1 min-w-0">${titulo}${detalle}</div></div>`);
}

function pintarMetricas(r) {
  const hoyD = new Date();
  const titulo = html`<div class="flex items-start justify-between gap-space-sm">
    <h2 class="text-title-lg text-on-surface flex items-center gap-space-xs"><span class="material-symbols-outlined text-secondary">speed</span>Métricas del mes</h2>
    ${r.mock ? chipDemo() : ''}</div>`;
  if (!r.ok) { pintar($('ind-metricas'), html`${titulo}${estadoError(r.error)}`); return; }

  // Se calculan a partir del historial (mismo origen que la tabla).
  const delMes = r.data.filter((f) => { const d = aFecha(f.fecha); return d.getMonth() === hoyD.getMonth() && d.getFullYear() === hoyD.getFullYear(); });
  const horas = delMes.reduce((s, f) => s + (horasEntre(f.hora_entrada, f.hora_salida) || 0), 0);
  const minutos = delMes.map((f) => { const [h, m] = f.hora_entrada.split(':'); return (+h) * 60 + (+m); });
  const prom = minutos.length ? Math.round(minutos.reduce((a, b) => a + b, 0) / minutos.length) : null;
  const promTexto = prom === null ? '--:--' : `${String(Math.floor(prom / 60)).padStart(2, '0')}:${String(prom % 60).padStart(2, '0')}`;

  // Semana actual (lunes a hoy)
  const lunes = new Date(hoyD); lunes.setHours(0, 0, 0, 0); lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  const semana = r.data.filter((f) => aFecha(f.fecha) >= lunes)
    .reduce((s, f) => s + (horasEntre(f.hora_entrada, f.hora_salida) || 0), 0);
  const pct = Math.min(100, Math.round((semana / JORNADA_SEMANAL_MAX) * 100));

  const caja = (valor, etiqueta, color = 'text-primary') => html`<div class="rounded bg-surface-container-low border border-linea p-space-sm text-center">
    <p class="text-headline-lg ${color} tabular">${valor}</p><p class="text-label-sm uppercase text-on-surface-variant">${etiqueta}</p></div>`;

  pintar($('ind-metricas'), html`${titulo}
    <div class="mt-space-md grid grid-cols-3 gap-space-sm">
      ${caja(delMes.length, 'Días laborados')}
      ${caja(Math.round(horas), 'Horas')}
      ${caja(promTexto, 'Entrada prom.', 'text-secondary')}
    </div>
    <div class="mt-space-md rounded bg-surface-container-low border border-linea p-space-md">
      <div class="flex items-center justify-between text-body-sm"><span class="text-on-surface-variant">Horas de esta semana</span>
        <strong class="tabular">${semana.toFixed(1)} / ${JORNADA_SEMANAL_MAX} h</strong></div>
      <div class="mt-space-xs h-2 rounded-full bg-surface-container overflow-hidden" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-secondary" style="width:${pct}%"></div></div>
      <p class="mt-space-xs text-body-sm text-on-surface-variant text-right">${pct}% de la jornada semanal máxima</p>
    </div>`);
}

function pintarHistorial(rHoy, rHist) {
  pintar($('historial-chip'), rHist.mock ? chipDemo() : '');
  if (!rHist.ok) { pintar($('ind-historial'), estadoError(rHist.error)); return; }

  const filas = [...rHist.data];
  // Fila de hoy al inicio (con lo que haya de hoy)
  if (rHoy.ok && !filas.some((f) => esHoy(f.fecha))) filas.unshift({ ...rHoy.data, obra: null, hoy: true });
  if (filas.length === 0) { pintar($('ind-historial'), estadoVacio('Sin registros', 'Aún no tienes asistencias registradas.')); return; }

  const total = (f) => { const h = horasEntre(f.hora_entrada, f.hora_salida); return h === null ? '—' : `${h.toFixed(1)} h`; };
  const estado = (f) => {
    if (!f.hora_entrada) return badge('En espera de entrada', 'neutro');
    if (!f.hora_salida) return esHoy(f.fecha) ? badge('En turno', 'proceso', { punto: true }) : badge('Sin salida', 'peligro');
    return badge('Completa', 'ok');
  };

  pintar($('ind-historial'), html`
    <div class="hidden md:block overflow-x-auto">
      <table class="tabla-sie w-full text-left">
        <thead class="bg-slate-50 border-b-2 border-linea"><tr class="text-label-sm uppercase text-archivo-texto">
          <th scope="col" class="px-space-lg py-space-sm">Fecha</th>
          <th scope="col" class="px-space-md py-space-sm">Entrada</th>
          <th scope="col" class="px-space-md py-space-sm">Salida</th>
          <th scope="col" class="px-space-md py-space-sm">Obra</th>
          <th scope="col" class="px-space-md py-space-sm text-right">Total</th>
          <th scope="col" class="px-space-md py-space-sm">Ubicación registrada</th>
          <th scope="col" class="px-space-md py-space-sm">Estado</th>
        </tr></thead>
        <tbody>${filas.map((f) => html`<tr class="border-b border-linea last:border-0">
          <td class="px-space-lg py-space-sm text-body-md whitespace-nowrap">${esHoy(f.fecha) ? html`<span class="inline-flex items-center gap-1 font-semibold"><span class="w-2 h-2 rounded-full bg-secondary"></span>Hoy</span>` : formatoFechaCorta(f.fecha)}</td>
          <td class="px-space-md py-space-sm text-tabular-code">${formatoHora(f.hora_entrada)}</td>
          <td class="px-space-md py-space-sm text-tabular-code">${formatoHora(f.hora_salida)}</td>
          <td class="px-space-md py-space-sm text-body-md">${f.obra || '—'}</td>
          <td class="px-space-md py-space-sm text-tabular-code text-right">${total(f)}</td>
          <td class="px-space-md py-space-sm text-body-sm text-on-surface-variant">${f.ubicacion || '—'}</td>
          <td class="px-space-md py-space-sm">${estado(f)}</td>
        </tr>`)}</tbody>
      </table>
    </div>
    <ul class="md:hidden divide-y divide-linea">${filas.map((f) => html`<li class="p-space-md flex flex-col gap-1">
      <div class="flex items-center justify-between gap-space-sm"><p class="text-title-md">${esHoy(f.fecha) ? 'Hoy' : formatoFechaCorta(f.fecha)}</p>${estado(f)}</div>
      <p class="text-body-sm tabular">Entrada <strong>${formatoHora(f.hora_entrada)}</strong> · Salida <strong>${formatoHora(f.hora_salida)}</strong> · ${total(f)}</p>
      <p class="text-body-sm text-on-surface-variant">${f.obra || 'Sin obra'}${f.ubicacion ? ` · ${f.ubicacion}` : ''}</p>
    </li>`)}</ul>`);
}

async function cargarIndividual() {
  pintarUsuario();
  pintar($('ind-estatus'), html`<p class="text-label-sm uppercase text-on-surface-variant">Estatus hoy</p><p class="text-body-md text-on-surface-variant">Cargando…</p>`);
  pintar($('ind-obra'), estadoCarga('Consultando asignación…'));
  pintar($('ind-ubicacion'), estadoCarga());
  pintar($('ind-metricas'), estadoCarga());
  pintar($('ind-historial'), estadoCarga('Cargando historial…'));

  const [rHoy, rHist, rAsig] = await Promise.all([
    api.miAsistenciaHoy(sesion.id_usuario),
    api.historialAsistencia(sesion.id_usuario),
    api.misAsignaciones(sesion.id_usuario),
  ]);
  asistenciaHoy = rHoy.ok ? rHoy.data : null;
  pintarEstatus(rHoy);
  pintarObraVigente(rAsig);
  pintarUbicacion(rHoy, rHist);
  pintarMetricas(rHist);
  pintarHistorial(rHoy, rHist);
}

/** Botones de registro: maquetados; sin endpoint muestran un aviso. */
function configurarBotones() {
  $('btn-entrada').addEventListener('click', async () => {
    if (asistenciaHoy && asistenciaHoy.hora_entrada) {
      mostrarAviso('Ya registraste tu entrada de hoy.', 'info');
      return;
    }
    const r = await api.registrarEntrada(sesion.id_usuario, null);
    if (r.pendiente) mostrarAviso('Funcionalidad pendiente de endpoint: la entrada aún no se guarda en la base de datos.', 'proceso');
    else if (!r.ok) mostrarAviso(r.error, 'peligro');
  });
  $('btn-salida').addEventListener('click', async () => {
    if ($('btn-salida').getAttribute('aria-disabled') === 'true') {
      mostrarAviso('Primero registra tu entrada de hoy.', 'info');
      return;
    }
    const r = await api.registrarSalida(sesion.id_usuario);
    if (r.pendiente) mostrarAviso('Funcionalidad pendiente de endpoint: la salida aún no se guarda en la base de datos.', 'proceso');
    else if (!r.ok) mostrarAviso(r.error, 'peligro');
  });
}

/* =====================================================================
 * Monitor general (JefeAdmin / Admin)
 * ===================================================================== */

async function cargarMonitor() {
  monitorCargado = true;
  pintar($('mon-resumen'), '');
  pintar($('mon-tabla'), estadoCarga('Cargando asistencia de hoy…'));

  const r = await api.asistenciaObras();
  if (!r.ok) { pintar($('mon-tabla'), estadoError(r.error)); return; }

  const hoy = r.data.filter((f) => esHoy(f.fecha))
    .sort((a, b) => String(a.hora_entrada).localeCompare(String(b.hora_entrada)));
  const enTurno = hoy.filter((f) => !f.hora_salida).length;
  const conUbicacion = hoy.filter((f) => f.ubicacion).length;

  const resumen = (icono, valor, texto) => html`<div class="bg-surface-container-lowest border border-linea rounded-lg shadow-elev-1 p-space-lg flex items-center gap-space-md">
    <span class="w-11 h-11 rounded bg-surface-container text-primary-container inline-flex items-center justify-center"><span class="material-symbols-outlined">${icono}</span></span>
    <div><p class="text-headline-lg text-primary tabular">${valor}</p><p class="text-label-sm uppercase text-on-surface-variant">${texto}</p></div></div>`;
  pintar($('mon-resumen'), html`${resumen('how_to_reg', hoy.length, 'Entradas registradas hoy')}
    ${resumen('engineering', enTurno, 'En turno')}${resumen('location_on', conUbicacion, 'Con ubicación registrada')}`);

  if (hoy.length === 0) {
    pintar($('mon-tabla'), estadoVacio('Sin registros', 'Nadie ha registrado entrada hoy.'));
    return;
  }
  const estado = (f) => (f.hora_salida ? badge('Salida registrada', 'ok') : badge('En turno', 'proceso', { punto: true }));
  pintar($('mon-tabla'), html`
    <div class="hidden md:block overflow-x-auto">
      <table class="tabla-sie w-full text-left">
        <thead class="bg-slate-50 border-b-2 border-linea"><tr class="text-label-sm uppercase text-archivo-texto">
          <th scope="col" class="px-space-lg py-space-sm">Trabajador</th>
          <th scope="col" class="px-space-md py-space-sm">Entrada</th>
          <th scope="col" class="px-space-md py-space-sm">Salida</th>
          <th scope="col" class="px-space-md py-space-sm">Obra</th>
          <th scope="col" class="px-space-md py-space-sm">Ubicación registrada</th>
          <th scope="col" class="px-space-md py-space-sm">Estado</th>
        </tr></thead>
        <tbody>${hoy.map((f) => html`<tr class="border-b border-linea last:border-0">
          <td class="px-space-lg py-space-sm"><div class="flex items-center gap-space-sm">${avatar(f.empleado)}
            <div class="min-w-0"><p class="text-title-md truncate">${f.empleado}</p><p class="text-body-sm text-on-surface-variant tabular">${f.telefono || 'Sin teléfono'}</p></div></div></td>
          <td class="px-space-md py-space-sm text-tabular-code">${formatoHora(f.hora_entrada)}</td>
          <td class="px-space-md py-space-sm text-tabular-code whitespace-nowrap">${f.hora_salida ? formatoHora(f.hora_salida) : html`<span class="text-on-surface-variant">En turno…</span>`}</td>
          <td class="px-space-md py-space-sm text-body-md">${f.obra_actual || badge('Sin obra asignada', 'archivo')}</td>
          <td class="px-space-md py-space-sm text-body-md">${f.ubicacion
            ? html`<span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-secondary">location_on</span>${f.ubicacion}</span>`
            : html`<span class="text-on-surface-variant">Sin ubicación</span>`}</td>
          <td class="px-space-md py-space-sm">${estado(f)}</td>
        </tr>`)}</tbody>
      </table>
    </div>
    <ul class="md:hidden divide-y divide-linea">${hoy.map((f) => html`<li class="p-space-md flex flex-col gap-space-xs">
      <div class="flex items-center gap-space-sm">${avatar(f.empleado)}<p class="flex-1 min-w-0 text-title-md truncate">${f.empleado}</p>${estado(f)}</div>
      <p class="text-body-sm tabular">Entrada <strong>${formatoHora(f.hora_entrada)}</strong> · Salida <strong>${formatoHora(f.hora_salida)}</strong></p>
      <p class="text-body-sm">${f.obra_actual || 'Sin obra asignada'}</p>
      <p class="text-body-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span>${f.ubicacion || 'Sin ubicación'}</p>
    </li>`)}</ul>`);
}

/* =====================================================================
 * Arranque
 * ===================================================================== */

function iniciar() {
  if (!sesion) return;
  iniciarRelojGrande();
  configurarBotones();
  alReintentar($('vista-individual'), cargarIndividual);
  alReintentar($('vista-monitor'), cargarMonitor);

  if (esAdministrativo(sesion.rol)) {
    $('pestanas').classList.replace('hidden', 'inline-flex');
    document.querySelectorAll('#pestanas [data-vista]').forEach((b) => b.addEventListener('click', () => cambiarVista(b.dataset.vista)));
  }
  cambiarVista('individual');
  cargarIndividual();
}

iniciar();

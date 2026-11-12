/*
 * Panel General (panel.html).
 *  - JefeAdmin / Admin: KPI y tabla desde GET /api/jefe/asistencia-obras.
 *  - Personal: sus asignaciones desde GET /api/trabajador/asignaciones
 *    (filtradas en el cliente por id_usuario; ver nota en api.js).
 *  - Bitácoras del día: mock.js (sin endpoint).
 */
import { montarLayout } from '../layout.js';
import { esAdministrativo, ETIQUETAS_ROL } from '../session.js';
import * as api from '../api.js';
import {
  html, pintar, avatar, badge, chipDemo, estadoCarga, estadoVacio, estadoError, alReintentar,
  esHoy, claveDia, formatoFechaLarga, formatoFechaCorta, formatoHora,
} from '../utils.js';

const sesion = montarLayout('panel', 'Panel General');
const $ = (id) => document.getElementById(id);
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** Arranque de la página (se invoca al final del módulo, ya declaradas las constantes). */
function iniciar() {
  if (!sesion) return;
  $('saludo-nombre').textContent = sesion.nombre;
  $('saludo-rol').lastElementChild.textContent = ETIQUETAS_ROL[sesion.rol] || sesion.rol;
  $('saludo-fecha').textContent = capitalizar(formatoFechaLarga());

  if (esAdministrativo(sesion.rol)) {
    alReintentar($('sie-main'), cargarAdmin);
    cargarAdmin();
  } else {
    alReintentar($('sie-main'), cargarPersonal);
    cargarPersonal();
  }
}

/* =====================================================================
 * Componentes compartidos
 * ===================================================================== */

const CLASE_TARJETA = 'bg-surface-container-lowest border border-linea rounded-lg shadow-elev-1';

/** Tarjeta KPI. `valor` grande; si `textoLargo` es true se usa tamaño menor. */
function tarjetaKpi({ titulo, icono, valor, unidad = '', nota = '', barra = null, demo = false, textoLargo = false }) {
  const tamano = textoLargo ? 'text-title-lg' : 'text-headline-xl-mobile md:text-headline-xl';
  const pct = barra === null ? null : Math.max(0, Math.min(100, Math.round(barra)));
  return html`<article class="${CLASE_TARJETA} p-space-lg flex flex-col gap-space-sm">
    <div class="flex items-start justify-between gap-space-sm">
      <h3 class="text-label-sm uppercase text-on-surface-variant">${titulo}</h3>
      <span class="w-10 h-10 rounded bg-surface-container text-primary-container inline-flex items-center justify-center" aria-hidden="true">
        <span class="material-symbols-outlined">${icono}</span>
      </span>
    </div>
    <p class="flex items-baseline flex-wrap gap-x-space-xs">
      <span class="${tamano} text-primary tabular">${valor}</span>
      <span class="text-body-md text-on-surface-variant">${unidad}</span>
    </p>
    <div class="text-body-sm text-on-surface-variant flex flex-wrap items-center gap-space-xs">${nota}${demo ? chipDemo() : ''}</div>
    ${pct === null ? '' : html`<div class="mt-auto h-1.5 rounded-full bg-surface-container overflow-hidden" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="h-full rounded-full bg-secondary" style="width:${pct}%"></div></div>`}
  </article>`;
}

function esqueletoKpis(n) {
  const una = html`<div class="${CLASE_TARJETA} p-space-lg h-[150px] animate-pulse flex flex-col gap-space-md">
    <div class="h-3 w-1/2 rounded bg-surface-container"></div><div class="h-8 w-1/3 rounded bg-surface-container"></div>
    <div class="h-3 w-2/3 rounded bg-surface-container"></div></div>`;
  return html`${Array.from({ length: n }, () => una)}`;
}

/** Envuelve un estado (carga/vacío/error) para que ocupe toda la cuadrícula. */
const celdaCompleta = (contenido) => html`<div class="col-span-full ${CLASE_TARJETA}">${contenido}</div>`;

/** Fila de avatares superpuestos (máx. 4 + contador). */
function grupoAvatares(nombres) {
  const visibles = nombres.slice(0, 4);
  const resto = nombres.length - visibles.length;
  return html`<div class="flex -space-x-2" aria-label="${nombres.join(', ')}">
    ${visibles.map((n) => html`<span class="ring-2 ring-white rounded-full" title="${n}">${avatar(n, 'w-8 h-8 text-[11px]')}</span>`)}
    ${resto > 0 ? html`<span class="w-8 h-8 ring-2 ring-white rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold inline-flex items-center justify-center">+${resto}</span>` : ''}
  </div>`;
}

/** Tarjeta de obra (imagen local + datos reales). */
function tarjetaObra({ nombre, etiqueta, cuerpo }) {
  return html`<article class="${CLASE_TARJETA} hover:shadow-elev-2 transition-shadow overflow-hidden flex flex-col">
    <div class="relative h-28 bg-nav">
      <img src="assets/obra-placeholder.svg" alt="" class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-nav/90 via-nav/30 to-transparent"></div>
      <span class="absolute top-2 left-2">${etiqueta}</span>
      <h3 class="absolute bottom-2 left-3 right-3 text-title-md text-white line-clamp-2">${nombre}</h3>
    </div>
    <div class="p-space-md flex flex-col gap-space-sm flex-1">${cuerpo}</div>
  </article>`;
}

const dato = (titulo, valor) => html`<div class="min-w-0">
  <dt class="text-label-sm uppercase text-on-surface-variant">${titulo}</dt>
  <dd class="text-body-md text-on-surface tabular break-words">${valor}</dd></div>`;

/* =====================================================================
 * Vista JefeAdmin / Admin
 * ===================================================================== */

const estadoTabla = { filas: [], vista: 'hoy', filtro: 'todos', busqueda: '' };

/** Clasifica una fila de asistencia. */
function clasificar(f) {
  if (f.hora_salida) return 'salida';
  return esHoy(f.fecha) ? 'turno' : 'sin-salida';
}

const ESTADOS = {
  turno: () => badge('En turno', 'proceso', { punto: true }),
  salida: () => badge('Salida registrada', 'ok'),
  'sin-salida': () => badge('Sin salida registrada', 'peligro'),
};

async function cargarAdmin() {
  $('obras-kicker').textContent = 'Despliegue técnico';
  $('titulo-obras').textContent = 'Obras con personal hoy';
  pintar($('kpis'), esqueletoKpis(4));
  pintar($('obras'), celdaCompleta(estadoCarga('Cargando obras…')));
  pintar($('seccion-tabla'), estadoCarga('Cargando asistencia…'));

  const [asis, bit] = await Promise.all([api.asistenciaObras(), api.resumenBitacorasHoy()]);

  if (!asis.ok) {
    $('saludo-resumen').textContent = '';
    pintar($('kpis'), celdaCompleta(estadoError(asis.error)));
    pintar($('obras'), celdaCompleta(estadoError(asis.error, { reintentar: false })));
    pintar($('seccion-tabla'), estadoError(asis.error, { reintentar: false }));
    return;
  }

  const filas = asis.data;
  const hoy = filas.filter((f) => esHoy(f.fecha));
  const personasHoy = new Set(hoy.map((f) => `${f.empleado}|${f.telefono}`)).size;
  const enTurno = hoy.filter((f) => !f.hora_salida).length;
  const obrasHoy = new Set(hoy.map((f) => f.obra_actual).filter(Boolean));

  $('saludo-resumen').textContent = obrasHoy.size
    ? `· Personal registrado hoy en ${obrasHoy.size} ${obrasHoy.size === 1 ? 'obra' : 'obras'}`
    : '· Aún no hay registros de asistencia hoy';

  // --- KPI (3 reales + 1 mock) ---
  pintar($('kpis'), html`
    ${tarjetaKpi({ titulo: 'Personal que asistió hoy', icono: 'groups', valor: personasHoy, unidad: personasHoy === 1 ? 'persona' : 'personas',
      nota: `${hoy.length} ${hoy.length === 1 ? 'registro' : 'registros'} de entrada hoy` })}
    ${tarjetaKpi({ titulo: 'Obras activas hoy', icono: 'precision_manufacturing', valor: obrasHoy.size, unidad: 'con personal',
      nota: obrasHoy.size ? [...obrasHoy].join(', ') : 'Sin personal asignado a obra hoy' })}
    ${tarjetaKpi({ titulo: 'Personal en turno', icono: 'engineering', valor: enTurno, unidad: 'sin salida aún',
      nota: `${hoy.length - enTurno} con salida registrada`, barra: hoy.length ? (enTurno / hoy.length) * 100 : 0 })}
    ${bit.ok
      ? tarjetaKpi({ titulo: 'Bitácoras registradas hoy', icono: 'fact_check', valor: bit.data.registradas, unidad: 'reportes',
        nota: `${bit.data.sincronizadas_notion} sincronizadas con Notion`, demo: true })
      : celdaCompleta(estadoError(bit.error, { reintentar: false }))}
  `);

  // --- Tarjetas de obra (agrupadas desde la asistencia de hoy) ---
  const porObra = new Map();
  hoy.filter((f) => f.obra_actual).forEach((f) => {
    if (!porObra.has(f.obra_actual)) porObra.set(f.obra_actual, []);
    porObra.get(f.obra_actual).push(f);
  });
  $('obras-nota').textContent = `${porObra.size} ${porObra.size === 1 ? 'obra' : 'obras'} con asistencia registrada hoy`;

  if (porObra.size === 0) {
    pintar($('obras'), celdaCompleta(estadoVacio('Sin obras con personal hoy',
      'Las obras aparecen aquí cuando alguien registra su entrada y tiene una asignación de obra para hoy.')));
  } else {
    pintar($('obras'), html`${[...porObra].map(([obra, gente]) => {
      const nombres = [...new Set(gente.map((g) => g.empleado))];
      const entradas = gente.map((g) => g.hora_entrada).filter(Boolean).sort();
      const vehiculos = [...new Set(gente.map((g) => g.id_vehiculo).filter((v) => v != null))];
      const turno = gente.filter((g) => !g.hora_salida).length;
      return tarjetaObra({
        nombre: obra,
        etiqueta: badge('En obra hoy', 'proceso', { punto: true }),
        cuerpo: html`
          <p class="text-label-sm uppercase text-on-surface-variant">Personal presente (${nombres.length})</p>
          ${grupoAvatares(nombres)}
          <dl class="grid grid-cols-2 gap-space-sm mt-auto pt-space-sm border-t border-linea">
            ${dato('Primera entrada', formatoHora(entradas[0]))}
            ${dato('En turno', `${turno} de ${gente.length}`)}
            ${dato('Vehículos', vehiculos.length ? vehiculos.map((v) => `#${v}`).join(', ') : 'Ninguno')}
          </dl>`,
      });
    })}`);
  }

  // --- Tabla de asistencia ---
  estadoTabla.filas = filas;
  montarTablaAdmin();
}

function montarTablaAdmin() {
  pintar($('seccion-tabla'), html`
    <div class="p-space-lg flex flex-col lg:flex-row lg:items-start gap-space-md border-b border-linea">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-space-sm">
          <h2 class="text-headline-md text-on-surface">Asistencia y presencia del día</h2>
          <span id="tabla-conteo" class="px-2 py-0.5 rounded-full bg-primary-container text-white text-label-sm tabular"></span>
        </div>
        <p class="text-body-sm text-on-surface-variant mt-1">Registros de ASISTENCIA_DIARIA con su obra y vehículo asignados (últimos 50).</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-space-sm">
        <div class="inline-flex p-1 rounded bg-surface-container self-start" role="tablist" aria-label="Periodo">
          <button type="button" role="tab" data-vista="hoy" class="px-space-md h-9 rounded text-label-md">Hoy</button>
          <button type="button" role="tab" data-vista="todos" class="px-space-md h-9 rounded text-label-md">Historial reciente</button>
        </div>
        <label class="relative">
          <span class="sr-only">Buscar por trabajador u obra</span>
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-apagado" aria-hidden="true">search</span>
          <input id="tabla-buscar" type="search" placeholder="Buscar trabajador u obra…"
                 class="w-full sm:w-64 h-12 md:h-10 pl-10 pr-3 rounded border border-slate-300 bg-white text-body-md focus:border-electrico focus:ring-[3px] focus:ring-electrico/20 focus:outline-none">
        </label>
      </div>
    </div>
    <div id="tabla-filtros" class="px-space-lg py-space-sm flex flex-wrap items-center gap-space-xs bg-surface-container-low border-b border-linea"></div>
    <div id="tabla-cuerpo"></div>
    <p id="tabla-pie" class="px-space-lg py-space-sm text-body-sm text-on-surface-variant border-t border-linea"></p>
  `);

  $('seccion-tabla').querySelectorAll('[data-vista]').forEach((b) =>
    b.addEventListener('click', () => { estadoTabla.vista = b.dataset.vista; estadoTabla.filtro = 'todos'; renderTablaAdmin(); }));
  $('tabla-buscar').addEventListener('input', (e) => { estadoTabla.busqueda = e.target.value.trim().toLowerCase(); renderTablaAdmin(); });
  $('tabla-filtros').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filtro]');
    if (b) { estadoTabla.filtro = b.dataset.filtro; renderTablaAdmin(); }
  });
  renderTablaAdmin();
}

function renderTablaAdmin() {
  const { vista, filtro, busqueda } = estadoTabla;
  const base = vista === 'hoy' ? estadoTabla.filas.filter((f) => esHoy(f.fecha)) : estadoTabla.filas;

  // Pestañas
  $('seccion-tabla').querySelectorAll('[data-vista]').forEach((b) => {
    const activa = b.dataset.vista === vista;
    b.setAttribute('aria-selected', String(activa));
    b.className = `px-space-md h-9 rounded text-label-md ${activa ? 'bg-surface-container-lowest text-primary shadow-elev-1' : 'text-on-surface-variant hover:text-on-surface'}`;
  });

  // Filtros con conteo
  const cuenta = (fn) => base.filter(fn).length;
  const filtros = [
    ['todos', 'Todos', base.length],
    ['turno', 'En turno', cuenta((f) => clasificar(f) === 'turno')],
    ['salida', 'Salida registrada', cuenta((f) => clasificar(f) === 'salida')],
    ['sin-salida', 'Sin salida registrada', cuenta((f) => clasificar(f) === 'sin-salida')],
    ['sin-obra', 'Sin obra asignada', cuenta((f) => !f.obra_actual)],
  ].filter(([id, , n]) => id === 'todos' || n > 0 || id === filtro);
  pintar($('tabla-filtros'), html`<span class="text-label-sm uppercase text-on-surface-variant mr-space-xs">Filtrar por:</span>
    ${filtros.map(([id, texto, n]) => html`<button type="button" data-filtro="${id}" aria-pressed="${id === filtro}"
      class="h-8 px-space-sm rounded-full text-label-md border ${id === filtro ? 'bg-primary-container text-white border-primary-container' : 'bg-white text-on-surface-variant border-outline-variant hover:border-outline'}">${texto} (${n})</button>`)}`);

  // Aplicar filtro y búsqueda
  let visibles = base;
  if (filtro === 'sin-obra') visibles = visibles.filter((f) => !f.obra_actual);
  else if (filtro !== 'todos') visibles = visibles.filter((f) => clasificar(f) === filtro);
  if (busqueda) {
    visibles = visibles.filter((f) =>
      `${f.empleado} ${f.obra_actual || ''} ${f.telefono || ''}`.toLowerCase().includes(busqueda));
  }

  $('tabla-conteo').textContent = `${base.length} ${base.length === 1 ? 'registro' : 'registros'}`;
  $('tabla-pie').textContent = `Mostrando ${visibles.length} de ${base.length}`;

  if (visibles.length === 0) {
    const detalle = base.length === 0
      ? (vista === 'hoy' ? 'Nadie ha registrado entrada hoy.' : 'No hay registros de asistencia.')
      : 'Ningún registro coincide con el filtro o la búsqueda.';
    pintar($('tabla-cuerpo'), estadoVacio('Sin registros', detalle));
    return;
  }

  const conFecha = vista !== 'hoy';
  const obraCelda = (f) => f.obra_actual
    ? html`<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-low border border-linea text-label-md text-primary-container"><span class="material-symbols-outlined text-[16px]">domain</span>${f.obra_actual}</span>`
    : badge('Sin obra asignada', 'archivo');
  const salidaCelda = (f) => f.hora_salida
    ? formatoHora(f.hora_salida)
    : html`<span class="text-on-surface-variant">${esHoy(f.fecha) ? 'En turno…' : '—'}</span>`;

  pintar($('tabla-cuerpo'), html`
    <!-- Tabla (tablet y escritorio) -->
    <div class="hidden md:block overflow-x-auto">
      <table class="tabla-sie w-full text-left">
        <thead class="bg-slate-50 border-b-2 border-linea">
          <tr class="text-label-sm uppercase text-archivo-texto">
            <th scope="col" class="px-space-lg py-space-sm">Trabajador</th>
            ${conFecha ? html`<th scope="col" class="px-space-md py-space-sm">Fecha</th>` : ''}
            <th scope="col" class="px-space-md py-space-sm">Entrada</th>
            <th scope="col" class="px-space-md py-space-sm">Salida</th>
            <th scope="col" class="px-space-md py-space-sm">Obra asignada</th>
            <th scope="col" class="px-space-md py-space-sm">Vehículo</th>
            <th scope="col" class="px-space-md py-space-sm">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${visibles.map((f) => html`<tr class="border-b border-linea last:border-0">
            <td class="px-space-lg py-space-sm">
              <div class="flex items-center gap-space-sm">${avatar(f.empleado)}
                <div class="min-w-0"><p class="text-title-md text-on-surface truncate">${f.empleado}</p>
                <p class="text-body-sm text-on-surface-variant tabular">${f.telefono || 'Sin teléfono'}</p></div></div>
            </td>
            ${conFecha ? html`<td class="px-space-md py-space-sm text-body-md whitespace-nowrap">${formatoFechaCorta(f.fecha)}</td>` : ''}
            <td class="px-space-md py-space-sm text-tabular-code whitespace-nowrap">${formatoHora(f.hora_entrada)}</td>
            <td class="px-space-md py-space-sm text-tabular-code whitespace-nowrap">${salidaCelda(f)}</td>
            <td class="px-space-md py-space-sm">${obraCelda(f)}</td>
            <td class="px-space-md py-space-sm text-body-md whitespace-nowrap">${f.id_vehiculo != null ? `#${f.id_vehiculo}` : '—'}</td>
            <td class="px-space-md py-space-sm">${ESTADOS[clasificar(f)]()}</td>
          </tr>`)}
        </tbody>
      </table>
    </div>
    <!-- Lista (móvil) -->
    <ul class="md:hidden divide-y divide-linea">
      ${visibles.map((f) => html`<li class="p-space-md flex flex-col gap-space-sm">
        <div class="flex items-center gap-space-sm">${avatar(f.empleado)}
          <div class="flex-1 min-w-0"><p class="text-title-md truncate">${f.empleado}</p>
          <p class="text-body-sm text-on-surface-variant tabular">${conFecha ? formatoFechaCorta(f.fecha) : f.telefono || 'Sin teléfono'}</p></div>
          ${ESTADOS[clasificar(f)]()}
        </div>
        <div class="flex flex-wrap items-center gap-x-space-lg gap-y-1 text-body-sm">
          <span>Entrada <strong class="tabular">${formatoHora(f.hora_entrada)}</strong></span>
          <span>Salida <strong class="tabular">${f.hora_salida ? formatoHora(f.hora_salida) : '—'}</strong></span>
          ${f.id_vehiculo != null ? html`<span>Vehículo <strong>#${f.id_vehiculo}</strong></span>` : ''}
        </div>
        <div>${obraCelda(f)}</div>
      </li>`)}
    </ul>
  `);
}

/* =====================================================================
 * Vista Personal
 * ===================================================================== */

async function cargarPersonal() {
  $('obras-kicker').textContent = 'Mis obras';
  $('titulo-obras').textContent = 'Obras asignadas';
  $('kpis').classList.replace('xl:grid-cols-4', 'xl:grid-cols-3');
  pintar($('kpis'), esqueletoKpis(3));
  pintar($('obras'), celdaCompleta(estadoCarga('Cargando tus obras…')));
  pintar($('seccion-tabla'), estadoCarga('Cargando tus asignaciones…'));

  const r = await api.misAsignaciones(sesion.id_usuario);
  if (!r.ok) {
    pintar($('kpis'), celdaCompleta(estadoError(r.error)));
    pintar($('obras'), celdaCompleta(estadoError(r.error, { reintentar: false })));
    pintar($('seccion-tabla'), estadoError(r.error, { reintentar: false }));
    return;
  }

  const filas = [...r.data].sort((a, b) => claveDia(b.fecha_asignacion).localeCompare(claveDia(a.fecha_asignacion)));
  const obras = new Map();
  filas.forEach((f) => {
    if (!obras.has(f.obra)) obras.set(f.obra, { direccion: f.direccion, fechas: new Set(), herramientas: new Set() });
    const o = obras.get(f.obra);
    o.fechas.add(claveDia(f.fecha_asignacion));
    if (f.herramienta_prestada) o.herramientas.add(f.herramienta_prestada);
  });
  const deHoy = filas.filter((f) => esHoy(f.fecha_asignacion));
  const obraHoy = [...new Set(deHoy.map((f) => f.obra))];
  const herramientas = new Set(filas.map((f) => f.id_herramienta).filter((h) => h != null));

  $('saludo-resumen').textContent = obraHoy.length ? `· Hoy estás asignado a ${obraHoy.join(', ')}` : '· No tienes asignación de obra para hoy';

  pintar($('kpis'), html`
    ${tarjetaKpi({ titulo: 'Obras asignadas', icono: 'precision_manufacturing', valor: obras.size, unidad: obras.size === 1 ? 'obra' : 'obras',
      nota: `${filas.length ? new Set(filas.map((f) => claveDia(f.fecha_asignacion))).size : 0} días con asignación` })}
    ${tarjetaKpi({ titulo: 'Asignación de hoy', icono: 'today', valor: obraHoy.length ? obraHoy.join(', ') : 'Sin asignación',
      textoLargo: true, nota: obraHoy.length ? 'Según ASIGNACION_OBRAS' : 'Consulta con tu supervisor' })}
    ${tarjetaKpi({ titulo: 'Herramientas prestadas', icono: 'construction', valor: herramientas.size, unidad: herramientas.size === 1 ? 'herramienta' : 'herramientas',
      nota: 'Préstamos registrados en tus obras' })}
  `);

  $('obras-nota').textContent = `${obras.size} ${obras.size === 1 ? 'obra' : 'obras'}`;
  if (obras.size === 0) {
    pintar($('obras'), celdaCompleta(estadoVacio('No tienes obras asignadas',
      'Cuando la administración te asigne a una obra aparecerá aquí.')));
  } else {
    pintar($('obras'), html`${[...obras].map(([nombre, o]) => {
      const fechas = [...o.fechas].sort();
      const hoy = o.fechas.has(claveDia());
      return tarjetaObra({
        nombre,
        etiqueta: hoy ? badge('Asignada hoy', 'proceso', { punto: true }) : badge('Asignada', 'info'),
        cuerpo: html`
          <p class="flex items-start gap-1 text-body-sm text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] mt-px">location_on</span><span class="line-clamp-2">${o.direccion || 'Sin dirección registrada'}</span></p>
          <dl class="grid grid-cols-2 gap-space-sm mt-auto pt-space-sm border-t border-linea">
            ${dato('Días asignado', fechas.length)}
            ${dato('Última fecha', formatoFechaCorta(fechas[fechas.length - 1]))}
          </dl>
          <div>
            <p class="text-label-sm uppercase text-on-surface-variant">Herramientas prestadas</p>
            <p class="text-body-md">${o.herramientas.size ? [...o.herramientas].join(', ') : 'Ninguna'}</p>
          </div>`,
      });
    })}`);
  }

  // Tabla: mis asignaciones
  pintar($('seccion-tabla'), html`
    <div class="p-space-lg border-b border-linea">
      <h2 class="text-headline-md text-on-surface">Mis asignaciones</h2>
      <p class="text-body-sm text-on-surface-variant mt-1">Obras asignadas por fecha y herramientas prestadas (Vista_Mis_Asignaciones).</p>
    </div>
    ${filas.length === 0 ? estadoVacio('Sin registros', 'No hay asignaciones registradas a tu nombre.') : html`
    <div class="overflow-x-auto">
      <table class="tabla-sie w-full text-left min-w-[560px]">
        <thead class="bg-slate-50 border-b-2 border-linea">
          <tr class="text-label-sm uppercase text-archivo-texto">
            <th scope="col" class="px-space-lg py-space-sm">Fecha</th>
            <th scope="col" class="px-space-md py-space-sm">Obra</th>
            <th scope="col" class="px-space-md py-space-sm">Dirección</th>
            <th scope="col" class="px-space-md py-space-sm">Herramienta prestada</th>
          </tr>
        </thead>
        <tbody>${filas.map((f) => html`<tr class="border-b border-linea last:border-0">
          <td class="px-space-lg py-space-sm text-body-md whitespace-nowrap">${formatoFechaCorta(f.fecha_asignacion)}
            ${esHoy(f.fecha_asignacion) ? badge('Hoy', 'info') : ''}</td>
          <td class="px-space-md py-space-sm text-title-md">${f.obra}</td>
          <td class="px-space-md py-space-sm text-body-md text-on-surface-variant">${f.direccion || '—'}</td>
          <td class="px-space-md py-space-sm text-body-md">${f.herramienta_prestada || '—'}</td>
        </tr>`)}</tbody>
      </table>
    </div>`}
  `);
}

iniciar();

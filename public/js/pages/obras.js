/*
 * Obras e Instalaciones (obras.html) — solo JefeAdmin / Admin.
 *  - Listado, KPI, filtros y expediente: mock.js (no existe GET /api/obras).
 *  - Alta de nueva obra: se valida en el cliente; NO se envía (pendiente de
 *    POST /api/obras con INSERT INTO OBRAS).
 * Solo se muestran campos que existen en la tabla OBRAS (más el nombre del
 * cliente y conteos derivados de ASIGNACION_OBRAS / USO_MATERIALES).
 */
import { montarLayout } from '../layout.js';
import * as api from '../api.js';
import {
  html, pintar, badge, badgeEstadoObra, chipDemo, estadoCarga, estadoVacio, estadoError, alReintentar, mostrarAviso,
  aFecha, claveDia, formatoFechaCorta, formatoMXN,
} from '../utils.js';

const sesion = montarLayout('obras', 'Obras e Instalaciones');
const $ = (id) => document.getElementById(id);

const ESTADOS = ['Cotizada', 'En Proceso', 'Terminada'];
// Color del borde superior de cada tarjeta según el estado (DESIGN.md).
const BORDE_ESTADO = { 'En Proceso': 'border-t-aviso', Terminada: 'border-t-ok', Cotizada: 'border-t-info' };

const estado = { obras: [], clientes: [], esMock: false, vista: 'tarjetas', buscar: '', fEstado: '', fCliente: '' };

const codigo = (o) => `OB-${String(o.id_obra).padStart(3, '0')}`;
const esFutura = (fecha) => aFecha(fecha) > aFecha(claveDia());

/* =====================================================================
 * Carga
 * ===================================================================== */
async function cargar() {
  pintar($('kpis'), html`<div class="col-span-full bg-surface-container-lowest border border-linea rounded-lg">${estadoCarga()}</div>`);
  pintar($('listado'), html`<div class="bg-surface-container-lowest border border-linea rounded-lg">${estadoCarga('Cargando obras…')}</div>`);

  const [ro, rc] = await Promise.all([api.obras(), api.clientes()]);
  if (!ro.ok) {
    pintar($('kpis'), '');
    pintar($('listado'), html`<div class="bg-surface-container-lowest border border-linea rounded-lg">${estadoError(ro.error)}</div>`);
    return;
  }
  estado.obras = ro.data;
  estado.esMock = Boolean(ro.mock);
  estado.clientes = rc.ok ? rc.data : [];
  pintar($('listado-chip'), estado.esMock ? chipDemo() : '');
  llenarFiltros();
  pintarKpis();
  pintarListado();
}

function llenarFiltros() {
  const opciones = (sel, lista) => {
    const actual = sel.value;
    sel.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
    lista.forEach(([valor, texto]) => sel.add(new Option(texto, valor))); // Option usa texto plano
    sel.value = actual;
  };
  opciones($('f-estado'), ESTADOS.map((e) => [e, e]));
  opciones($('f-cliente'), estado.clientes.map((c) => [String(c.id_cliente), c.nombre]));
  opciones($('obra-cliente'), estado.clientes.map((c) => [String(c.id_cliente), c.nombre]));
}

/* =====================================================================
 * KPI
 * ===================================================================== */
function pintarKpis() {
  const por = (e) => estado.obras.filter((o) => o.estado === e);
  const suma = (lista) => lista.reduce((s, o) => s + Number(o.presupuesto || 0), 0);
  const proceso = por('En Proceso'); const cotizadas = por('Cotizada'); const terminadas = por('Terminada');
  const personal = proceso.reduce((s, o) => s + (o.personal_asignado || 0), 0);

  pintar($('conteo-activas'), estado.obras.length
    ? html`<span class="px-2 py-0.5 rounded-full bg-primary-container text-white text-label-md align-middle">${proceso.length} en proceso</span>` : '');

  const kpi = (titulo, icono, valor, nota, colorNota = 'text-on-surface-variant') => html`<article class="bg-surface-container-lowest border border-linea rounded-lg shadow-elev-1 p-space-lg flex items-start gap-space-md">
    <div class="flex-1 min-w-0"><h3 class="text-label-sm uppercase text-on-surface-variant">${titulo}</h3>
      <p class="mt-1 text-headline-md text-primary tabular break-words">${valor}</p>
      <p class="text-body-sm ${colorNota}">${nota}</p></div>
    <span class="w-11 h-11 shrink-0 rounded bg-surface-container text-primary-container inline-flex items-center justify-center"><span class="material-symbols-outlined">${icono}</span></span>
  </article>`;

  pintar($('kpis'), html`
    ${kpi('En proceso', 'engineering', `${proceso.length} ${proceso.length === 1 ? 'obra' : 'obras'}`, `${personal} personas asignadas`, 'text-secondary')}
    ${kpi('Presupuesto en proceso', 'payments', formatoMXN(suma(proceso)), `de ${formatoMXN(suma(estado.obras))} en total`)}
    ${kpi('Cotizadas', 'request_quote', `${cotizadas.length} ${cotizadas.length === 1 ? 'obra' : 'obras'}`, `${formatoMXN(suma(cotizadas))} por confirmar`, 'text-info-texto')}
    ${kpi('Terminadas', 'task_alt', `${terminadas.length} ${terminadas.length === 1 ? 'obra' : 'obras'}`, `${formatoMXN(suma(terminadas))} ejecutados`, 'text-ok-texto')}
    ${estado.esMock ? html`<p class="col-span-full -mt-space-sm flex justify-end">${chipDemo()}</p>` : ''}
  `);
}

/* =====================================================================
 * Listado (tarjetas / tabla)
 * ===================================================================== */
function filtradas() {
  const q = estado.buscar;
  return estado.obras.filter((o) =>
    (!estado.fEstado || o.estado === estado.fEstado)
    && (!estado.fCliente || String(o.id_cliente) === estado.fCliente)
    && (!q || `${codigo(o)} ${o.nombre} ${o.cliente || ''} ${o.direccion || ''}`.toLowerCase().includes(q)));
}

function tarjeta(o) {
  const futura = esFutura(o.fecha_inicio);
  return html`<article class="bg-surface-container-lowest border border-linea border-t-4 ${BORDE_ESTADO[o.estado] || 'border-t-outline'} rounded-lg shadow-elev-1 hover:shadow-elev-2 transition-shadow p-space-lg flex flex-col gap-space-md">
    <div class="flex items-start justify-between gap-space-sm">
      <p class="text-label-md text-secondary tabular">${codigo(o)}</p>${badgeEstadoObra(o.estado)}
    </div>
    <h3 class="text-title-lg text-on-surface">${o.nombre}</h3>
    <div class="flex flex-col gap-1 text-body-sm">
      <p class="flex items-start gap-1 text-on-surface"><span class="material-symbols-outlined text-[18px] text-apagado">domain</span>${o.cliente || 'Sin cliente'}</p>
      <p class="flex items-start gap-1 text-on-surface-variant"><span class="material-symbols-outlined text-[18px] text-apagado">location_on</span><span class="line-clamp-2">${o.direccion || 'Sin dirección registrada'}</span></p>
    </div>
    <dl class="grid grid-cols-2 gap-space-sm rounded bg-surface-container-low border border-linea p-space-md">
      <div><dt class="text-label-sm uppercase text-on-surface-variant">${o.estado === 'Cotizada' ? 'Presupuesto estimado' : 'Presupuesto'}</dt>
        <dd class="text-title-md text-on-surface tabular">${o.presupuesto != null ? formatoMXN(o.presupuesto) : '—'}</dd></div>
      <div><dt class="text-label-sm uppercase text-on-surface-variant">${futura ? 'Inicio programado' : 'Fecha de inicio'}</dt>
        <dd class="text-title-md text-on-surface">${formatoFechaCorta(o.fecha_inicio)}</dd></div>
    </dl>
    <div class="flex flex-wrap gap-x-space-lg gap-y-1 text-body-sm text-on-surface-variant">
      <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">groups</span>${o.personal_asignado || 0} personas asignadas</span>
      <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">inventory_2</span>${o.materiales_registrados || 0} registros de material</span>
    </div>
    <button type="button" data-expediente="${o.id_obra}" class="mt-auto h-12 md:h-10 inline-flex items-center justify-center gap-space-xs rounded bg-surface-container-low hover:bg-surface-container border border-linea text-primary-container text-label-md">
      <span class="material-symbols-outlined text-[20px]">folder_open</span>Ver expediente
    </button>
  </article>`;
}

function tabla(lista) {
  return html`<div class="bg-surface-container-lowest border border-linea rounded-lg shadow-elev-1 overflow-x-auto">
    <table class="tabla-sie w-full min-w-[820px] text-left">
      <thead class="bg-slate-50 border-b-2 border-linea"><tr class="text-label-sm uppercase text-archivo-texto">
        <th scope="col" class="px-space-lg py-space-sm">Código</th>
        <th scope="col" class="px-space-md py-space-sm">Obra</th>
        <th scope="col" class="px-space-md py-space-sm">Cliente</th>
        <th scope="col" class="px-space-md py-space-sm">Estado</th>
        <th scope="col" class="px-space-md py-space-sm text-right">Presupuesto</th>
        <th scope="col" class="px-space-md py-space-sm">Inicio</th>
        <th scope="col" class="px-space-md py-space-sm text-right">Personal</th>
        <th scope="col" class="px-space-md py-space-sm"><span class="sr-only">Acciones</span></th>
      </tr></thead>
      <tbody>${lista.map((o) => html`<tr class="border-b border-linea last:border-0">
        <td class="px-space-lg py-space-sm text-tabular-code text-secondary whitespace-nowrap">${codigo(o)}</td>
        <td class="px-space-md py-space-sm text-title-md">${o.nombre}</td>
        <td class="px-space-md py-space-sm text-body-md">${o.cliente || '—'}</td>
        <td class="px-space-md py-space-sm">${badgeEstadoObra(o.estado)}</td>
        <td class="px-space-md py-space-sm text-tabular-code text-right whitespace-nowrap">${o.presupuesto != null ? formatoMXN(o.presupuesto) : '—'}</td>
        <td class="px-space-md py-space-sm text-body-md whitespace-nowrap">${formatoFechaCorta(o.fecha_inicio)}</td>
        <td class="px-space-md py-space-sm text-tabular-code text-right">${o.personal_asignado || 0}</td>
        <td class="px-space-md py-space-sm text-right"><button type="button" data-expediente="${o.id_obra}" class="w-10 h-10 inline-flex items-center justify-center rounded text-primary-container hover:bg-surface-container" aria-label="Ver expediente de ${o.nombre}" title="Ver expediente"><span class="material-symbols-outlined">folder_open</span></button></td>
      </tr>`)}</tbody>
    </table></div>`;
}

function pintarListado() {
  // Botones de vista
  document.querySelectorAll('[data-vista]').forEach((b) => {
    const activa = b.dataset.vista === estado.vista;
    b.setAttribute('aria-pressed', String(activa));
    b.className = `inline-flex items-center gap-1 h-10 md:h-8 px-space-md rounded text-label-md ${activa ? 'bg-surface-container-lowest text-primary shadow-elev-1' : 'text-on-surface-variant hover:text-on-surface'}`;
  });

  const lista = filtradas();
  $('listado-info').textContent = `Mostrando ${lista.length} de ${estado.obras.length} obras`;
  if (estado.obras.length === 0) {
    pintar($('listado'), html`<div class="bg-surface-container-lowest border border-linea rounded-lg">${estadoVacio('Sin obras registradas', 'Registra la primera obra con el botón "Registrar nueva obra".')}</div>`);
    return;
  }
  if (lista.length === 0) {
    pintar($('listado'), html`<div class="bg-surface-container-lowest border border-linea rounded-lg">${estadoVacio('Sin resultados', 'Ninguna obra coincide con los filtros.')}</div>`);
    return;
  }
  pintar($('listado'), estado.vista === 'tabla'
    ? tabla(lista)
    : html`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter-sm md:gap-gutter">${lista.map(tarjeta)}</div>`);
}

/* =====================================================================
 * Expediente (panel lateral)
 * ===================================================================== */
let focoPrevio = null;

function abrirExpediente(id) {
  const o = estado.obras.find((x) => String(x.id_obra) === String(id));
  if (!o) return;
  focoPrevio = document.activeElement;
  $('drawer-codigo').textContent = codigo(o);
  $('drawer-titulo').textContent = o.nombre;
  const fila = (t, v) => html`<div class="py-space-sm flex justify-between gap-space-md border-b border-linea last:border-0">
    <dt class="text-body-sm text-on-surface-variant">${t}</dt><dd class="text-body-md text-on-surface text-right">${v}</dd></div>`;
  const pendiente = (titulo, icono, tabla) => html`<div class="rounded border border-dashed border-outline-variant p-space-md flex gap-space-sm text-body-sm text-on-surface-variant">
    <span class="material-symbols-outlined text-[20px]">${icono}</span>
    <div><p class="text-title-md text-on-surface">${titulo}</p><p>Disponible cuando exista el endpoint de detalle (${tabla}).</p></div></div>`;

  pintar($('drawer-cuerpo'), html`
    <div class="flex items-center justify-between gap-space-sm">${badgeEstadoObra(o.estado)}${estado.esMock ? chipDemo() : ''}</div>
    <section><h3 class="text-label-sm uppercase text-on-surface-variant mb-space-xs">Datos generales</h3>
      <dl>${fila('Cliente', o.cliente || '—')}${fila('Dirección', o.direccion || '—')}
        ${fila('Presupuesto', o.presupuesto != null ? formatoMXN(o.presupuesto) : '—')}
        ${fila(esFutura(o.fecha_inicio) ? 'Inicio programado' : 'Fecha de inicio', formatoFechaCorta(o.fecha_inicio))}
        ${fila('Personal asignado', `${o.personal_asignado || 0} personas`)}
        ${fila('Registros de material', o.materiales_registrados || 0)}</dl>
    </section>
    <section class="flex flex-col gap-space-sm"><h3 class="text-label-sm uppercase text-on-surface-variant">Detalle</h3>
      ${pendiente('Cuadrilla asignada', 'groups', 'ASIGNACION_OBRAS')}
      ${pendiente('Bitácoras y evidencias', 'photo_camera', 'BITACORAS')}
      ${pendiente('Materiales utilizados', 'inventory_2', 'USO_MATERIALES')}
      ${pendiente('Herramientas prestadas', 'construction', 'PRESTAMO_HERRAMIENTAS')}
    </section>`);

  $('drawer').classList.replace('hidden', 'flex');
  $('drawer-fondo').classList.remove('hidden');
  $('drawer').querySelector('[data-cerrar-drawer]').focus();
}

function cerrarExpediente() {
  $('drawer').classList.replace('flex', 'hidden');
  $('drawer-fondo').classList.add('hidden');
  focoPrevio?.focus();
}

/* =====================================================================
 * Modal: alta de obra (validación en cliente, sin envío)
 * ===================================================================== */
function abrirModal() {
  focoPrevio = document.activeElement;
  $('form-obra').reset();
  limpiarErrores();
  $('modal-obra').classList.replace('hidden', 'flex');
  $('obra-nombre').focus();
}

function cerrarModal() {
  $('modal-obra').classList.replace('flex', 'hidden');
  focoPrevio?.focus();
}

function marcar(id, mensaje) {
  const p = document.querySelector(`.error-campo[data-para="${id}"]`);
  if (p) { p.textContent = mensaje || ''; p.classList.toggle('hidden', !mensaje); }
  $(id).setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  $(id).classList.toggle('border-peligro', Boolean(mensaje));
}

function limpiarErrores() {
  ['obra-nombre', 'obra-cliente', 'obra-presupuesto'].forEach((id) => marcar(id, ''));
  $('obra-resultado').classList.add('hidden');
}

async function guardarObra(e) {
  e.preventDefault();
  limpiarErrores();
  const nombre = $('obra-nombre').value.trim();
  const idCliente = $('obra-cliente').value;
  const presTexto = $('obra-presupuesto').value;
  const presupuesto = presTexto === '' ? null : Number(presTexto);

  const errores = {
    'obra-nombre': !nombre ? 'Escribe el nombre de la obra.' : nombre.length < 5 ? 'El nombre es demasiado corto.' : '',
    'obra-cliente': !idCliente ? 'Selecciona un cliente.' : '',
    // DECIMAL(10,2) admite hasta 99,999,999.99
    'obra-presupuesto': presupuesto !== null && (!isFinite(presupuesto) || presupuesto < 0 || presupuesto > 99999999.99)
      ? 'Escribe un monto entre 0 y 99,999,999.99.' : '',
  };
  Object.entries(errores).forEach(([id, m]) => marcar(id, m));
  const primero = Object.keys(errores).find((id) => errores[id]);
  if (primero) { $(primero).focus(); return; }

  const datos = {
    nombre,
    direccion: $('obra-direccion').value.trim() || null,
    presupuesto,
    fecha_inicio: $('obra-fecha').value || null,
    estado: $('obra-estado').value,
    id_cliente: Number(idCliente),
  };
  const r = await api.crearObra(datos);
  if (r.pendiente) {
    pintar($('obra-resultado'), html`<div class="flex items-start gap-space-sm p-space-md rounded border bg-aviso-tinte text-aviso-texto border-aviso-borde text-body-md">
      <span class="material-symbols-outlined text-[20px]">schedule</span>
      <p class="flex-1"><strong>Datos válidos.</strong> Funcionalidad pendiente de endpoint: la obra no se guardó en la base de datos (falta POST /api/obras).</p></div>`);
    $('obra-resultado').classList.remove('hidden');
    $('obra-resultado').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    mostrarAviso('Validación correcta. El alta de obras está pendiente de endpoint.', 'proceso');
  } else if (!r.ok) {
    mostrarAviso(r.error, 'peligro');
  }
}

/* =====================================================================
 * Arranque
 * ===================================================================== */
function iniciar() {
  if (!sesion) return;
  alReintentar($('listado'), cargar);

  $('f-buscar').addEventListener('input', (e) => { estado.buscar = e.target.value.trim().toLowerCase(); pintarListado(); });
  $('f-estado').addEventListener('change', (e) => { estado.fEstado = e.target.value; pintarListado(); });
  $('f-cliente').addEventListener('change', (e) => { estado.fCliente = e.target.value; pintarListado(); });
  document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => { estado.vista = b.dataset.vista; pintarListado(); }));
  $('listado').addEventListener('click', (e) => {
    const b = e.target.closest('[data-expediente]');
    if (b) abrirExpediente(b.dataset.expediente);
  });

  $('btn-nueva').addEventListener('click', abrirModal);
  $('form-obra').addEventListener('submit', guardarObra);
  document.querySelectorAll('[data-cerrar-modal]').forEach((b) => b.addEventListener('click', cerrarModal));
  $('modal-obra').addEventListener('click', (e) => { if (e.target === $('modal-obra')) cerrarModal(); });
  document.querySelectorAll('[data-cerrar-drawer]').forEach((b) => b.addEventListener('click', cerrarExpediente));
  $('drawer-fondo').addEventListener('click', cerrarExpediente);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('modal-obra').classList.contains('hidden')) cerrarModal();
    else if (!$('drawer').classList.contains('hidden')) cerrarExpediente();
  });

  cargar().then(() => {
    // dashboard.html enlaza con obras.html?nueva=1 para abrir el formulario.
    if (new URLSearchParams(location.search).get('nueva') === '1') abrirModal();
  });
}

iniciar();

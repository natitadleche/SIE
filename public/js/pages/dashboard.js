/*
 * Dashboard Administrativo (dashboard.html) — solo JefeAdmin / Admin.
 *  - Asistencia semanal: derivada de GET /api/jefe/asistencia-obras (real).
 *  - Todo lo demás: mock.js (sin endpoint), marcado con "Datos de ejemplo".
 * Gráficas en SVG/HTML propio (como en Stitch), sin librerías.
 */
import { montarLayout } from '../layout.js';
import * as api from '../api.js';
import {
  html, seguro, pintar, badge, chipDemo, estadoCarga, estadoVacio, estadoError, alReintentar,
  claveDia, aFecha, formatoFechaCorta, formatoMXN,
} from '../utils.js';

const sesion = montarLayout('dashboard', 'Dashboard Administrativo');
const $ = (id) => document.getElementById(id);
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const fmt = (n) => Number(n).toLocaleString('es-MX');

/** Encabezado común de cada tarjeta de gráfica. */
function encabezado(kicker, titulo, extra = '') {
  return html`<div class="flex flex-wrap items-start justify-between gap-space-sm mb-space-lg">
    <div><p class="text-label-sm uppercase text-secondary tracking-wider">${kicker}</p>
    <h2 class="text-title-lg text-on-surface">${titulo}</h2></div>${extra}</div>`;
}

/** Ejecuta una carga por sección: muestra carga, error con reintento o el resultado. */
async function seccion(id, cabecera, cargar, pintarDatos) {
  const el = $(id);
  pintar(el, html`${cabecera}${estadoCarga()}`);
  const r = await cargar();
  if (!r.ok) { pintar(el, html`${cabecera}${estadoError(r.error)}`); return; }
  pintarDatos(el, r);
}

/* =====================================================================
 * Aviso de bitácoras sin sincronizar (mock)
 * ===================================================================== */
async function cargarBanner() {
  const r = await api.resumenBitacorasHoy();
  if (!r.ok) { pintar($('banner-bitacoras'), ''); return; }
  const pendientes = r.data.registradas - r.data.sincronizadas_notion;
  if (pendientes <= 0) { pintar($('banner-bitacoras'), ''); return; }
  pintar($('banner-bitacoras'), html`<div class="flex flex-col sm:flex-row sm:items-center gap-space-md p-space-md rounded-lg border bg-aviso-tinte border-aviso-borde text-aviso-texto" role="status">
    <span class="w-10 h-10 shrink-0 rounded bg-white/70 inline-flex items-center justify-center"><span class="material-symbols-outlined">sync_problem</span></span>
    <div class="flex-1"><p class="text-title-md">${pendientes} ${pendientes === 1 ? 'bitácora de hoy' : 'bitácoras de hoy'} sin sincronizar con Notion</p>
    <p class="text-body-sm">De ${r.data.registradas} registradas hoy en BITACORAS (columna sincronizado_notion).</p></div>
    ${chipDemo()}</div>`);
}

/* =====================================================================
 * Tarjetas de resumen (mock)
 * ===================================================================== */
function tarjetaResumen({ titulo, icono, valor, unidad, desglose }) {
  return html`<article class="bg-surface-container-lowest border border-linea rounded-lg shadow-elev-1 p-space-lg flex flex-col gap-space-sm">
    <div class="flex items-start justify-between gap-space-sm">
      <h3 class="text-label-sm uppercase text-on-surface-variant">${titulo}</h3>
      <span class="material-symbols-outlined text-secondary">${icono}</span>
    </div>
    <p class="flex items-baseline gap-space-xs"><span class="text-headline-xl-mobile md:text-headline-xl text-primary tabular">${valor}</span>
      <span class="text-body-md text-on-surface-variant">${unidad}</span></p>
    <div class="mt-auto flex flex-wrap gap-space-xs">${desglose}</div>
  </article>`;
}

/** Cuenta elementos por el campo `estado`. */
function contarPorEstado(lista) {
  return lista.reduce((m, x) => { m[x.estado] = (m[x.estado] || 0) + 1; return m; }, {});
}

async function cargarResumen() {
  pintar($('resumen'), html`<div class="col-span-full bg-surface-container-lowest border border-linea rounded-lg">${estadoCarga()}</div>`);
  const [ro, rp, rh, rv] = await Promise.all([api.obras(), api.resumenPlantilla(), api.herramientas(), api.vehiculos()]);
  const fallo = [ro, rp, rh, rv].find((r) => !r.ok);
  if (fallo) { pintar($('resumen'), html`<div class="col-span-full bg-surface-container-lowest border border-linea rounded-lg">${estadoError(fallo.error)}</div>`); return; }

  const eo = contarPorEstado(ro.data);
  const eh = contarPorEstado(rh.data);
  const ev = contarPorEstado(rv.data);
  const tonoObra = { 'En Proceso': 'proceso', Terminada: 'ok', Cotizada: 'info' };
  const chips = (conteo, tonos = {}) => Object.entries(conteo).map(([k, n]) => badge(`${n} ${k}`, tonos[k] || 'neutro'));
  const activas = eo['En Proceso'] || 0;

  pintar($('resumen'), html`
    ${tarjetaResumen({ titulo: 'Obras e instalaciones', icono: 'precision_manufacturing', valor: activas, unidad: 'en proceso', desglose: chips(eo, tonoObra) })}
    ${tarjetaResumen({ titulo: 'Plantilla', icono: 'groups', valor: rp.data.total, unidad: 'usuarios',
      desglose: [badge(`${rp.data.por_rol.Personal} personal de campo`, 'neutro'),
        badge(`${rp.data.por_rol.JefeAdmin + rp.data.por_rol.Admin} administración`, 'neutro'),
        badge(`${rp.data.saben_manejar} saben manejar`, 'info')] })}
    ${tarjetaResumen({ titulo: 'Herramientas', icono: 'construction', valor: rh.data.length, unidad: 'en inventario',
      desglose: chips(eh, { Disponible: 'ok', Prestada: 'info', 'En mantenimiento': 'proceso' }) })}
    ${tarjetaResumen({ titulo: 'Flotilla', icono: 'local_shipping', valor: rv.data.length, unidad: 'vehículos',
      desglose: chips(ev, { 'En uso': 'info', Disponible: 'ok', 'En taller': 'proceso' }) })}
    <p class="col-span-full -mt-space-sm flex justify-end">${chipDemo()}</p>
  `);
}

/* =====================================================================
 * Presupuesto por obra: barras horizontales, un solo tono (mock)
 * ===================================================================== */
function cargarPresupuesto() {
  const cab = encabezado('Obras', 'Presupuesto por obra (MXN)', chipDemo());
  return seccion('graf-presupuesto', cab, api.obras, (el, r) => {
    const filas = [...r.data].sort((a, b) => b.presupuesto - a.presupuesto);
    if (filas.length === 0) { pintar(el, html`${cab}${estadoVacio('Sin obras registradas')}`); return; }
    const max = Math.max(...filas.map((o) => o.presupuesto));
    const total = filas.reduce((s, o) => s + Number(o.presupuesto), 0);
    pintar(el, html`${cab}
      <ul class="flex flex-col gap-space-md">${filas.map((o) => {
        const pct = Math.max(1, (o.presupuesto / max) * 100);
        return html`<li title="${o.nombre}: ${formatoMXN(o.presupuesto)} · ${o.estado}">
          <div class="flex items-baseline justify-between gap-space-sm text-body-md">
            <span class="truncate text-on-surface">${o.nombre}</span>
            <span class="shrink-0 text-tabular-code text-on-surface">${formatoMXN(o.presupuesto)}</span>
          </div>
          <div class="mt-1 h-3 rounded-r bg-surface-container-low">
            <div class="h-full rounded-r bg-secondary hover:bg-primary-container transition-colors" style="width:${pct.toFixed(1)}%"></div>
          </div>
        </li>`;
      })}</ul>
      <p class="mt-space-lg pt-space-sm border-t border-linea text-body-sm text-on-surface-variant flex justify-between gap-space-sm">
        <span>${filas.length} obras</span><span>Total presupuestado: <strong class="text-on-surface tabular">${formatoMXN(total)}</strong></span></p>`);
  });
}

/* =====================================================================
 * Asistencia de los últimos 7 días: línea + área (REAL)
 * ===================================================================== */
function cargarAsistenciaSemanal() {
  const cab = encabezado('Asistencia', 'Personal con entrada, últimos 7 días');
  return seccion('graf-asistencia', cab, api.asistenciaObras, (el, r) => {
    // Personas distintas con registro por día
    const dias = [];
    for (let n = 6; n >= 0; n--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n);
      dias.push({ clave: claveDia(d), fecha: d, personas: new Set() });
    }
    r.data.forEach((f) => {
      const dia = dias.find((x) => x.clave === claveDia(f.fecha));
      if (dia) dia.personas.add(`${f.empleado}|${f.telefono}`);
    });
    const valores = dias.map((d) => d.personas.size);
    if (valores.every((v) => v === 0)) {
      pintar(el, html`${cab}${estadoVacio('Sin registros', 'No hay asistencia registrada en los últimos 7 días.')}`);
      return;
    }

    // Geometría del SVG
    // viewBox cercano al ancho real de la tarjeta para que el texto se lea a ~11px.
    const W = 380; const H = 190; const izq = 26; const der = 22; const arr = 12; const abj = 24;
    const maxY = Math.max(2, ...valores);
    const x = (i) => izq + (i * (W - izq - der)) / 6;
    const y = (v) => arr + (1 - v / maxY) * (H - arr - abj);
    const puntos = valores.map((v, i) => [x(i), y(v)]);
    const linea = puntos.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
    const area = `${linea} L${x(6).toFixed(1)},${(H - abj).toFixed(1)} L${x(0).toFixed(1)},${(H - abj).toFixed(1)} Z`;
    const marcas = [...new Set([0, Math.round(maxY / 2), maxY])];

    const hoy = valores[6];
    const extra = html`<div class="text-right"><p class="text-headline-lg text-primary tabular">${hoy}</p>
      <p class="text-label-sm uppercase text-on-surface-variant">personas hoy</p></div>`;

    pintar(el, html`${encabezado('Asistencia', 'Personal con entrada, últimos 7 días', extra)}
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="Personas con entrada por día en los últimos 7 días">
        ${marcas.map((m) => seguro(`<g><line x1="${izq}" x2="${W - der}" y1="${y(m)}" y2="${y(m)}" stroke="#E2E8F0" stroke-width="1"/>
          <text x="${izq - 8}" y="${y(m) + 4}" text-anchor="end" font-size="11" fill="#64748B">${m}</text></g>`))}
        <path d="${area}" fill="#006398" fill-opacity="0.08"/>
        <path d="${linea}" fill="none" stroke="#006398" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${puntos.map(([px, py], i) => seguro(`<g>
          <circle cx="${px}" cy="${py}" r="5" fill="#006398" stroke="#ffffff" stroke-width="2"/>
          <circle cx="${px}" cy="${py}" r="16" fill="transparent"><title>${DIAS_CORTOS[dias[i].fecha.getDay()]} ${dias[i].fecha.getDate()}: ${valores[i]} ${valores[i] === 1 ? 'persona' : 'personas'}</title></circle>
          <text x="${px}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#43474e">${DIAS_CORTOS[dias[i].fecha.getDay()]} ${dias[i].fecha.getDate()}</text></g>`))}
      </svg>
      <p class="mt-space-sm text-body-sm text-on-surface-variant flex items-start gap-1">
        <span class="material-symbols-outlined text-[16px]">info</span>
        Calculado con los últimos 50 registros de Vista_Control_Asistencia_Admin (límite actual del endpoint).</p>`);
  });
}

/* =====================================================================
 * Materiales más usados (mock) — sin barras: cada material tiene su unidad
 * ===================================================================== */
function cargarMateriales() {
  const cab = encabezado('Almacén', 'Materiales más usados este mes', chipDemo());
  return seccion('materiales', cab, api.consumoMateriales, (el, r) => {
    if (r.data.length === 0) { pintar(el, html`${cab}${estadoVacio('Sin consumo registrado este mes')}`); return; }
    pintar(el, html`${cab}<ul class="divide-y divide-linea">${r.data.map((m, i) => html`<li class="py-space-sm flex items-center gap-space-md">
      <span class="w-7 h-7 shrink-0 rounded-full bg-surface-container text-label-md text-primary-container inline-flex items-center justify-center tabular">${i + 1}</span>
      <span class="flex-1 min-w-0 text-body-md text-on-surface">${m.material}</span>
      <span class="shrink-0 text-right"><strong class="text-title-md text-on-surface tabular">${fmt(m.cantidad)}</strong>
        <span class="text-body-sm text-on-surface-variant">${m.unidad}</span></span>
    </li>`)}</ul>
    <p class="mt-space-sm text-body-sm text-on-surface-variant">Cantidades de USO_MATERIALES en la unidad de medida de cada material.</p>`);
  });
}

/* =====================================================================
 * Herramientas por estado: dona (mock)
 * Paleta validada (dataviz/validate_palette.js): verde, azul, ámbar de DESIGN.md.
 * ===================================================================== */
const COLORES_ESTADO = { Disponible: '#16A34A', Prestada: '#0284C7', 'En mantenimiento': '#CA8A04' };

function cargarHerramientas() {
  const cab = encabezado('Activos', 'Herramientas por estado', chipDemo());
  return seccion('graf-herramientas', cab, api.herramientas, (el, r) => {
    const total = r.data.length;
    if (total === 0) { pintar(el, html`${cab}${estadoVacio('Sin herramientas registradas')}`); return; }
    const conteo = contarPorEstado(r.data);
    const orden = Object.keys(COLORES_ESTADO).filter((k) => conteo[k]).concat(Object.keys(conteo).filter((k) => !COLORES_ESTADO[k]));

    // Segmentos con stroke-dasharray y 2px de separación
    const R = 60; const C = 2 * Math.PI * R; const SEP = 2;
    let acumulado = 0;
    const segmentos = orden.map((k) => {
      const largo = (conteo[k] / total) * C;
      const s = seguro(`<circle r="${R}" cx="80" cy="80" fill="none" stroke="${COLORES_ESTADO[k] || '#74777f'}" stroke-width="20"
        stroke-dasharray="${Math.max(0, largo - SEP).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acumulado).toFixed(2)}"
        transform="rotate(-90 80 80)"><title>${k}: ${conteo[k]}</title></circle>`);
      acumulado += largo;
      return s;
    });

    pintar(el, html`${cab}<div class="flex flex-col sm:flex-row items-center gap-space-lg">
      <svg viewBox="0 0 160 160" class="w-36 h-36 shrink-0" role="img" aria-label="Herramientas por estado">
        <circle r="${R}" cx="80" cy="80" fill="none" stroke="#eff4ff" stroke-width="20"/>
        ${segmentos}
        <text x="80" y="80" text-anchor="middle" font-size="28" font-weight="700" fill="#022448">${total}</text>
        <text x="80" y="98" text-anchor="middle" font-size="10" letter-spacing="1" fill="#43474e">EQUIPOS</text>
      </svg>
      <ul class="flex-1 min-w-0 w-full flex flex-col gap-space-sm">${orden.map((k) => html`<li class="flex items-start gap-space-sm text-body-md">
        <span class="w-3 h-3 mt-1 rounded-sm shrink-0" style="background:${COLORES_ESTADO[k] || '#74777f'}"></span>
        <span class="flex-1 min-w-0 text-on-surface">${k}</span>
        <span class="shrink-0 text-right tabular"><strong class="text-on-surface">${conteo[k]}</strong>
          <span class="text-body-sm text-on-surface-variant"> · ${Math.round((conteo[k] / total) * 100)}%</span></span>
      </li>`)}</ul></div>`);
  });
}

/* =====================================================================
 * Actividad reciente (mock)
 * ===================================================================== */
const ICONO_ACTIVIDAD = { bitacora: 'photo_camera', prestamo: 'construction', vehiculo: 'local_shipping' };

function cargarActividad() {
  const cab = encabezado('Registro', 'Actividad reciente', chipDemo());
  return seccion('actividad', cab, api.actividadReciente, (el, r) => {
    if (r.data.length === 0) { pintar(el, html`${cab}${estadoVacio('Sin actividad reciente')}`); return; }
    pintar(el, html`${cab}<ul class="flex flex-col gap-space-sm">${r.data.map((a) => html`<li class="flex gap-space-md p-space-md rounded bg-surface-container-low border border-linea">
      <span class="w-10 h-10 shrink-0 rounded bg-primary-container text-white inline-flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">${ICONO_ACTIVIDAD[a.tipo] || 'info'}</span></span>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-baseline justify-between gap-x-space-sm"><p class="text-title-md text-on-surface">${a.titulo}</p>
          <p class="text-body-sm text-on-surface-variant tabular">${formatoFechaCorta(a.fecha)}</p></div>
        <p class="text-body-md text-on-surface-variant">${a.detalle}</p>
      </div></li>`)}</ul>`);
  });
}

/* =====================================================================
 * Préstamos sin devolver (mock)
 * ===================================================================== */
const DIAS_ALERTA = 7;

function cargarPrestamos() {
  const cab = encabezado('Herramientas', 'Préstamos sin devolver', chipDemo());
  return seccion('prestamos', cab, api.prestamosAbiertos, (el, r) => {
    if (r.data.length === 0) { pintar(el, html`${cab}${estadoVacio('Sin préstamos abiertos')}`); return; }
    const hoy = aFecha(claveDia());
    pintar(el, html`${cab}<ul class="flex flex-col gap-space-sm">${r.data.map((p) => {
      const dias = Math.round((hoy - aFecha(p.fecha_prestamo)) / 86400000);
      const vencido = dias > DIAS_ALERTA;
      return html`<li class="p-space-md rounded border ${vencido ? 'bg-peligro-tinte border-peligro-borde' : 'bg-surface-container-low border-linea'}">
        <div class="flex items-start justify-between gap-space-sm">
          <p class="text-title-md text-on-surface">${p.herramienta}</p>
          ${vencido ? badge(`${dias} días`, 'peligro') : badge(`${dias} ${dias === 1 ? 'día' : 'días'}`, 'neutro')}
        </div>
        <p class="text-body-sm text-on-surface-variant">${p.trabajador} · ${p.obra}</p>
        <p class="text-body-sm text-on-surface-variant">Prestada el ${formatoFechaCorta(p.fecha_prestamo)}</p>
      </li>`;
    })}</ul>
    <p class="mt-space-sm text-body-sm text-on-surface-variant">Se resaltan los préstamos con más de ${DIAS_ALERTA} días.</p>`);
  });
}

/* =====================================================================
 * Arranque
 * ===================================================================== */
function iniciar() {
  if (!sesion) return;
  // Cada tarjeta reintenta solo su propia carga.
  const secciones = {
    resumen: cargarResumen, 'graf-presupuesto': cargarPresupuesto, 'graf-asistencia': cargarAsistenciaSemanal,
    materiales: cargarMateriales, 'graf-herramientas': cargarHerramientas, actividad: cargarActividad, prestamos: cargarPrestamos,
  };
  Object.entries(secciones).forEach(([id, fn]) => { alReintentar($(id), fn); fn(); });
  cargarBanner();
}

iniciar();

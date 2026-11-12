/*
 * Layout común: sidebar + barra superior. Se define UNA sola vez aquí y
 * cada página protegida lo monta con montarLayout('<id de página>').
 *
 * Responsive (DESIGN.md):
 *   < 768px      → barra superior con botón de menú y cajón lateral.
 *   768–1279px   → riel fijo de 72px solo con íconos.
 *   >= 1280px    → sidebar completo de 260px.
 * Las medidas y el comportamiento por ancho están en css/app.css.
 */
import { protegerPagina, tienePermiso, cerrarSesion, ETIQUETAS_ROL } from './session.js';
import { html, seguro, iniciales, iniciarReloj } from './utils.js';

/**
 * Menú completo. Los ítems sin href no tienen pantalla todavía y se muestran
 * deshabilitados con "Próximamente". Los ítems con href solo se muestran si
 * el rol tiene permiso (PERMISOS en session.js).
 */
const MENU = [
  { grupo: 'Principal', items: [
    { id: 'panel', texto: 'Panel General', icono: 'dashboard', href: 'panel.html' },
    { id: 'asistencia', texto: 'Mi Asistencia', icono: 'badge', href: 'asistencia.html' },
    { id: 'dashboard', texto: 'Dashboard Administrativo', icono: 'analytics', href: 'dashboard.html' },
  ] },
  { grupo: 'Gestión operativa', items: [
    { id: 'obras', texto: 'Obras e Instalaciones', icono: 'precision_manufacturing', href: 'obras.html' },
    { id: 'bitacoras', texto: 'Bitácoras y Evidencias', icono: 'fact_check' },
    { id: 'personal', texto: 'Personal y Cuadrillas', icono: 'group', href: 'personal.html' },
    { id: 'clientes', texto: 'Clientes y Contratos', icono: 'handshake' },
  ] },
  { grupo: 'Logística e inventarios', items: [
    { id: 'herramientas', texto: 'Herramientas y Equipos', icono: 'construction' },
    { id: 'materiales', texto: 'Materiales', icono: 'inventory_2' },
    { id: 'vehiculos', texto: 'Flotilla de Vehículos', icono: 'local_shipping' },
  ] },
  { grupo: 'Gestión especializada', items: [
    { id: 'dictamenes', texto: 'Dictámenes Eléctricos', icono: 'verified' },
    { id: 'reportes', texto: 'Reportes y Estadísticas', icono: 'query_stats' },
    { id: 'configuracion', texto: 'Configuración', icono: 'settings' },
  ] },
];

const CLASE_LINK = 'sie-nav-link flex items-center gap-space-sm min-h-[40px] px-space-sm py-2 rounded border-l-4 transition-colors';

function itemMenu(item, activo, rol) {
  // Ítem sin pantalla: deshabilitado
  if (!item.href) {
    return html`<li>
      <span class="${CLASE_LINK} border-transparent text-nav-texto/50 cursor-not-allowed" aria-disabled="true" title="${item.texto} — Próximamente">
        <span class="material-symbols-outlined text-[20px]">${item.icono}</span>
        <span class="sie-etiqueta flex-1 min-w-0 flex flex-col leading-tight">
          <span class="text-body-md truncate">${item.texto}</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-nav-texto/60">Próximamente</span>
        </span>
      </span>
    </li>`;
  }
  // Ítem sin permiso para este rol: no se muestra
  if (!tienePermiso(rol, item.id)) return '';

  const estilo = activo
    ? 'border-electrico bg-white/[0.08] text-white font-semibold'
    : 'border-transparent text-nav-texto hover:bg-white/5 hover:text-white';
  return html`<li>
    <a href="${item.href}" class="${CLASE_LINK} ${estilo}" title="${item.texto}" ${activo ? seguro('aria-current="page"') : ''}>
      <span class="material-symbols-outlined text-[20px] ${activo ? 'icono-relleno' : ''}">${item.icono}</span>
      <span class="sie-etiqueta flex-1 text-body-md truncate">${item.texto}</span>
    </a>
  </li>`;
}

function plantillaSidebar(paginaActual, sesion) {
  const grupos = MENU.map((g) => {
    const items = g.items.map((it) => itemMenu(it, it.id === paginaActual, sesion.rol));
    return html`<div class="flex flex-col gap-space-xxs">
      <p class="sie-etiqueta px-space-sm pb-1 text-label-sm uppercase text-nav-texto/70">${g.grupo}</p>
      <ul class="flex flex-col gap-space-xxs">${items}</ul>
    </div>`;
  });

  return html`<aside id="sie-sidebar" class="fixed inset-y-0 left-0 z-50 bg-nav flex flex-col overflow-hidden" aria-label="Menú principal">
    <div class="h-16 shrink-0 px-space-lg flex items-center gap-space-sm border-b border-white/10 sie-nav-link">
      <span class="w-9 h-9 rounded bg-electrico text-white inline-flex items-center justify-center" aria-hidden="true">
        <span class="material-symbols-outlined icono-relleno text-[22px]">bolt</span>
      </span>
      <span class="sie-etiqueta flex flex-col">
        <span class="text-title-md text-white leading-none tracking-tight">SCOSIE</span>
        <span class="text-label-sm uppercase text-primary-fixed-dim mt-1">Control Eléctrico</span>
      </span>
      <button type="button" id="sie-cerrar-menu" class="ml-auto md:hidden w-10 h-10 inline-flex items-center justify-center rounded text-nav-texto hover:bg-white/10" aria-label="Cerrar menú">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <div class="sie-etiqueta px-space-md pt-space-md">
      <div class="bg-white/5 border border-white/10 rounded px-space-sm py-space-xs">
        <p class="text-label-sm uppercase text-nav-texto flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-[16px]">shield_person</span>Perfil de operación
        </p>
        <p class="mt-1 text-label-md text-white">${ETIQUETAS_ROL[sesion.rol] || sesion.rol}</p>
      </div>
    </div>

    <nav class="flex-1 min-h-0 overflow-y-auto px-space-sm py-space-md md:pt-space-lg xl:pt-space-md flex flex-col gap-space-md">${grupos}</nav>

    <div class="p-space-sm border-t border-white/10">
      <button type="button" data-accion="salir" class="${CLASE_LINK} w-full border-transparent text-nav-texto hover:bg-white/5 hover:text-white" title="Cerrar sesión">
        <span class="material-symbols-outlined text-[20px]">logout</span>
        <span class="sie-etiqueta text-body-md">Cerrar sesión</span>
      </button>
    </div>
  </aside>
  <div id="sie-backdrop" class="fixed inset-0 z-40 bg-[rgba(15,37,55,0.5)] backdrop-blur-[4px] hidden" aria-hidden="true"></div>`;
}

function plantillaTopbar(titulo, sesion) {
  return html`<header id="sie-topbar" class="fixed top-0 right-0 h-16 z-30 bg-surface-container-lowest border-b border-linea shadow-elev-1 flex items-center gap-space-md px-margin-mobile md:px-margin xl:px-margin-desktop">
    <button type="button" id="sie-abrir-menu" class="md:hidden -ml-2 w-10 h-10 inline-flex items-center justify-center rounded text-on-surface hover:bg-surface-container" aria-label="Abrir menú" aria-controls="sie-sidebar" aria-expanded="false">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <div class="min-w-0 flex-1">
      <p class="text-label-sm uppercase text-on-surface-variant hidden sm:block">SCOSIE</p>
      <p class="text-title-md text-on-surface truncate">${titulo}</p>
    </div>

    <div id="sie-conexion" class="hidden items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container text-label-sm text-on-surface-variant" role="status"></div>

    <div class="hidden md:flex flex-col text-right">
      <span class="text-label-sm uppercase text-on-surface-variant">Hora local</span>
      <span id="sie-reloj" class="text-label-md tabular text-on-surface">--:--:--</span>
    </div>

    <div class="flex items-center gap-space-sm md:pl-space-md md:border-l border-linea">
      <span class="w-9 h-9 inline-flex items-center justify-center rounded-full bg-primary-container text-on-primary text-label-md" aria-hidden="true">${iniciales(sesion.nombre)}</span>
      <div class="hidden sm:flex flex-col leading-tight max-w-[180px]">
        <span class="text-title-md text-on-surface truncate">${sesion.nombre}</span>
        <span class="text-label-sm text-secondary truncate">${ETIQUETAS_ROL[sesion.rol] || sesion.rol}</span>
      </div>
      <button type="button" data-accion="salir" class="w-10 h-10 inline-flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface" title="Cerrar sesión" aria-label="Cerrar sesión">
        <span class="material-symbols-outlined">logout</span>
      </button>
    </div>
  </header>`;
}

/** Pinta el indicador de conexión con el resultado de la última llamada a la API. */
function escucharConexion() {
  const el = document.getElementById('sie-conexion');
  const estados = {
    ok: ['bg-ok', 'Servidor conectado'],
    error: ['bg-aviso', 'Servidor con errores'],
    offline: ['bg-peligro', 'Sin conexión'],
  };
  window.addEventListener('sie:conexion', (e) => {
    const [color, texto] = estados[e.detail.estado] || estados.offline;
    // Se muestra (solo >= 1024px) hasta que hay un resultado real que reportar.
    el.classList.add('lg:inline-flex');
    el.replaceChildren();
    const punto = document.createElement('span');
    punto.className = `w-2 h-2 rounded-full ${color}`;
    el.append(punto, document.createTextNode(texto));
  });
}

/** Abre/cierra el cajón lateral en móvil. */
function configurarMenuMovil() {
  const sidebar = document.getElementById('sie-sidebar');
  const fondo = document.getElementById('sie-backdrop');
  const boton = document.getElementById('sie-abrir-menu');
  const abrir = (si) => {
    sidebar.dataset.abierto = si ? 'true' : 'false';
    fondo.classList.toggle('hidden', !si);
    boton.setAttribute('aria-expanded', String(si));
    if (si) sidebar.querySelector('a, button')?.focus();
  };
  boton.addEventListener('click', () => abrir(true));
  fondo.addEventListener('click', () => abrir(false));
  document.getElementById('sie-cerrar-menu').addEventListener('click', () => abrir(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrir(false); });
}

/**
 * Valida la sesión, monta sidebar + topbar y muestra la página.
 * Regresa la sesión, o null si se redirigió al login.
 */
export function montarLayout(paginaActual, titulo) {
  const sesion = protegerPagina(paginaActual);
  if (!sesion) return null;

  document.body.insertAdjacentHTML('afterbegin',
    String(plantillaSidebar(paginaActual, sesion)) + String(plantillaTopbar(titulo, sesion)));

  document.querySelectorAll('[data-accion="salir"]').forEach((b) => b.addEventListener('click', cerrarSesion));
  configurarMenuMovil();
  escucharConexion();
  iniciarReloj(document.getElementById('sie-reloj'));

  document.body.classList.add('sie-lista');
  return sesion;
}

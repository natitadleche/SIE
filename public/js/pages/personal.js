/*
 * Personal y Cuadrillas (personal.html) — solo JefeAdmin / Admin.
 *  - Alta de trabajador: POST /api/registrar (REAL). El rol 'Personal' lo fuerza
 *    el procedimiento RegistrarTrabajador en la BD.
 *  - Listado de personal: mock.js (no existe GET de usuarios).
 *
 * Se eligió una página propia en lugar de una pestaña del Dashboard porque el
 * menú ya tiene "Personal y Cuadrillas", el permiso 'personal' es independiente
 * del de 'dashboard' en session.js y la sección crecerá (cuadrillas, edición).
 */
import { montarLayout } from '../layout.js';
import * as api from '../api.js';
import { html, pintar, avatar, badge, chipDemo, estadoCarga, estadoVacio, estadoError, alReintentar, mostrarAviso } from '../utils.js';

const sesion = montarLayout('personal', 'Personal y Cuadrillas');
const $ = (id) => document.getElementById(id);
const registradosSesion = []; // altas hechas desde esta pantalla (solo memoria)

/* ---------- Validación ---------- */

function marcar(id, mensaje) {
  const input = $(id);
  const p = document.querySelector(`.error-campo[data-para="${id}"]`);
  if (p) { p.textContent = mensaje || ''; p.classList.toggle('hidden', !mensaje); }
  input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  input.classList.toggle('border-peligro', Boolean(mensaje));
}

function validar() {
  const nombre = $('alta-nombre').value.trim();
  const telefono = $('alta-telefono').value.trim();
  const pass = $('alta-password').value;
  const pass2 = $('alta-password2').value;
  const errores = {
    'alta-nombre': !nombre ? 'Escribe el nombre completo.' : nombre.length < 3 ? 'El nombre es demasiado corto.' : '',
    'alta-telefono': !telefono ? 'Escribe el teléfono.' : !/^\d{10}$/.test(telefono) ? 'El teléfono debe tener 10 dígitos.' : '',
    'alta-password': !pass ? 'Escribe una contraseña.' : pass.length < 6 ? 'Usa al menos 6 caracteres.' : '',
    'alta-password2': pass2 !== pass ? 'Las contraseñas no coinciden.' : '',
  };
  Object.entries(errores).forEach(([id, m]) => marcar(id, m));
  const primero = Object.keys(errores).find((id) => errores[id]);
  if (primero) $(primero).focus();
  return !primero;
}

function resultado(tono, mensaje) {
  const clases = tono === 'ok' ? 'bg-ok-tinte text-ok-texto border-ok-borde' : 'bg-peligro-tinte text-peligro-texto border-peligro-borde';
  pintar($('alta-resultado'), html`<div class="flex items-start gap-space-sm p-space-md rounded border ${clases} text-body-md">
    <span class="material-symbols-outlined text-[20px]">${tono === 'ok' ? 'check_circle' : 'error'}</span><p class="flex-1">${mensaje}</p></div>`);
  $('alta-resultado').classList.toggle('hidden', !mensaje);
}

function ocupado(si) {
  $('alta-enviar').disabled = si;
  $('alta-enviar-texto').textContent = si ? 'Registrando…' : 'Registrar trabajador';
  $('alta-enviar-icono').textContent = si ? 'progress_activity' : 'how_to_reg';
  $('alta-enviar-icono').classList.toggle('animate-spin', si);
}

/* ---------- Envío ---------- */

async function enviar(e) {
  e.preventDefault();
  resultado('', '');
  if (!validar()) return;

  const datos = {
    nombre: $('alta-nombre').value.trim(),
    telefono: $('alta-telefono').value.trim(),
    contacto: $('alta-contacto').value.trim() || null,
    sabe_manejar: $('alta-manejar').checked,
    password: $('alta-password').value,
  };
  ocupado(true);
  const r = await api.registrarTrabajador(datos);
  ocupado(false);

  if (!r.ok) {
    resultado('error', r.status >= 500 ? 'No se pudo registrar: la base de datos rechazó la operación.' : r.error);
    return;
  }
  resultado('ok', `${datos.nombre} quedó registrado con rol Personal. Ya puede iniciar sesión con su teléfono.`);
  mostrarAviso('Trabajador registrado correctamente.', 'ok');
  registradosSesion.unshift({ nombre: datos.nombre, telefono: datos.telefono, sabe_manejar: datos.sabe_manejar });
  pintarRegistradosSesion();
  $('form-alta').reset();
  $('alta-nombre').focus();
}

function pintarRegistradosSesion() {
  const el = $('registrados-sesion');
  el.classList.toggle('hidden', registradosSesion.length === 0);
  pintar(el, html`<h2 class="text-title-md text-ok-texto flex items-center gap-space-xs"><span class="material-symbols-outlined">task_alt</span>Registrados en esta sesión</h2>
    <ul class="mt-space-sm flex flex-col gap-space-xs">${registradosSesion.map((p) => html`<li class="flex items-center gap-space-sm text-body-md text-on-surface">
      ${avatar(p.nombre, 'w-8 h-8 text-[11px]')}<span class="flex-1 min-w-0 truncate">${p.nombre}</span><span class="tabular text-body-sm text-on-surface-variant">${p.telefono}</span></li>`)}</ul>`);
}

/* ---------- Listado (mock) ---------- */

async function cargarLista() {
  pintar($('lista-personal'), estadoCarga());
  const r = await api.personal();
  pintar($('lista-chip'), r.mock ? chipDemo() : '');
  if (!r.ok) { pintar($('lista-personal'), estadoError(r.error)); return; }
  if (r.data.length === 0) { pintar($('lista-personal'), estadoVacio('Sin registros', 'Aún no hay personal de campo.')); return; }
  pintar($('lista-personal'), html`<ul class="divide-y divide-linea">${r.data.map((p) => html`<li class="px-space-lg py-space-sm flex items-center gap-space-sm">
    ${avatar(p.nombre)}
    <div class="flex-1 min-w-0"><p class="text-title-md text-on-surface truncate">${p.nombre}</p>
      <p class="text-body-sm text-on-surface-variant tabular">${p.telefono}</p></div>
    ${p.sabe_manejar ? badge('Maneja', 'info') : ''}
  </li>`)}</ul>`);
}

function iniciar() {
  if (!sesion) return;
  $('form-alta').addEventListener('submit', enviar);
  $('form-alta').addEventListener('reset', () => {
    resultado('', '');
    document.querySelectorAll('#form-alta .campo').forEach((c) => marcar(c.id, ''));
  });
  // Solo dígitos en el teléfono
  $('alta-telefono').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });
  alReintentar($('lista-personal'), cargarLista);
  cargarLista();
}

iniciar();

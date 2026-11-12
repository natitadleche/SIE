/*
 * Página de inicio de sesión (index.html) → POST /api/login.
 */
import { login } from '../api.js';
import { guardarSesion, obtenerSesion, ETIQUETAS_ROL } from '../session.js';
import { html, pintar } from '../utils.js';

const form = document.getElementById('form-login');
const inputTel = document.getElementById('login-telefono');
const inputPass = document.getElementById('login-password');
const cajaError = document.getElementById('error-login');
const boton = document.getElementById('btn-entrar');

/* ---------- Avisos al llegar (cierre de sesión / sin permiso) ---------- */
const motivo = new URLSearchParams(location.search).get('motivo');
const sesionActual = obtenerSesion();

function aviso(tono, icono, contenido) {
  const clases = tono === 'aviso'
    ? 'bg-aviso-tinte text-aviso-texto border-aviso-borde'
    : 'bg-ok-tinte text-ok-texto border-ok-borde';
  const caja = document.getElementById('aviso-motivo');
  pintar(caja, html`<div class="flex items-start gap-space-sm p-space-md rounded border ${clases} text-body-md" role="status">
    <span class="material-symbols-outlined text-[20px]">${icono}</span><div class="flex-1">${contenido}</div></div>`);
  caja.classList.remove('hidden');
}

if (motivo === 'permiso' && sesionActual) {
  // Hay sesión pero el rol no tiene acceso a la página solicitada.
  aviso('aviso', 'block', html`Tu perfil (<strong>${ETIQUETAS_ROL[sesionActual.rol] || sesionActual.rol}</strong>) no tiene acceso a esa sección.
    <a href="panel.html" class="block mt-1 font-semibold underline">Volver al Panel General</a>`);
} else if (motivo === 'salida') {
  aviso('ok', 'check_circle', html`Sesión cerrada correctamente.`);
} else if (sesionActual) {
  // Ya hay sesión activa: no tiene caso mostrar el login.
  location.replace('panel.html');
}

/* ---------- Mostrar / ocultar contraseña ---------- */
const btnVer = document.getElementById('ver-password');
btnVer.addEventListener('click', () => {
  const visible = inputPass.type === 'text';
  inputPass.type = visible ? 'password' : 'text';
  btnVer.setAttribute('aria-pressed', String(!visible));
  btnVer.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
  btnVer.querySelector('span').textContent = visible ? 'visibility' : 'visibility_off';
});

/* ---------- Validación en el cliente ---------- */
function marcarCampo(input, idError, mensaje) {
  const p = document.getElementById(idError);
  p.textContent = mensaje || '';
  p.classList.toggle('hidden', !mensaje);
  input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  input.classList.toggle('border-peligro', Boolean(mensaje));
}

function validar() {
  const tel = inputTel.value.trim();
  const pass = inputPass.value;
  let ok = true;
  if (!tel) { marcarCampo(inputTel, 'error-telefono', 'Escribe tu teléfono.'); ok = false; }
  else if (!/^\d{7,20}$/.test(tel)) { marcarCampo(inputTel, 'error-telefono', 'El teléfono solo debe contener números.'); ok = false; }
  else marcarCampo(inputTel, 'error-telefono', '');
  if (!pass) { marcarCampo(inputPass, 'error-password', 'Escribe tu contraseña.'); ok = false; }
  else marcarCampo(inputPass, 'error-password', '');
  return ok;
}

function mostrarError(mensaje) {
  pintar(cajaError, html`<div class="flex items-start gap-space-sm p-space-md rounded border bg-peligro-tinte text-peligro-texto border-peligro-borde text-body-md">
    <span class="material-symbols-outlined text-[20px]">error</span><p class="flex-1">${mensaje}</p></div>`);
  cajaError.classList.toggle('hidden', !mensaje);
}

function ocupado(si) {
  boton.disabled = si;
  document.getElementById('btn-entrar-texto').textContent = si ? 'Verificando…' : 'Entrar';
  const icono = document.getElementById('btn-entrar-icono');
  icono.textContent = si ? 'progress_activity' : 'login';
  icono.classList.toggle('animate-spin', si);
}

/* ---------- Envío ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarError('');
  if (!validar()) return;

  ocupado(true);
  const r = await login(inputTel.value.trim(), inputPass.value);
  ocupado(false);

  if (!r.ok) {
    mostrarError(r.status === 401 ? 'Teléfono o contraseña incorrectos.' : r.error);
    inputPass.select();
    return;
  }
  guardarSesion(r.data);
  location.replace('panel.html');
});

/*
 * Capa de acceso a datos. Las páginas NUNCA llaman a fetch directamente:
 * usan estas funciones. Todas regresan { ok, data, error, mock }.
 *
 * Las funciones marcadas con TODO(endpoint) todavía regresan datos de
 * mock.js; para conectarlas a la BD solo hay que cambiar su cuerpo aquí.
 */
import * as mock from './mock.js';

/* ---------- Indicador de conexión (lo escucha layout.js) ---------- */
function avisarConexion(estado) {
  // estado: 'ok' | 'error' (el servidor respondió con error) | 'offline'
  window.dispatchEvent(new CustomEvent('sie:conexion', { detail: { estado } }));
}

function mensajePorEstado(status) {
  if (status === 401) return 'Credenciales incorrectas.';
  if (status === 404) return 'El recurso solicitado no existe.';
  if (status >= 500) return 'El servidor no pudo consultar la base de datos.';
  return 'Ocurrió un error inesperado.';
}

/** Envoltura de fetch con manejo uniforme de errores. */
async function solicitar(ruta, { metodo = 'GET', cuerpo } = {}) {
  try {
    const opciones = { method: metodo, headers: { Accept: 'application/json' } };
    if (cuerpo !== undefined) {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(cuerpo);
    }
    const res = await fetch(ruta, opciones);
    let json = null;
    try { json = await res.json(); } catch { /* respuesta sin JSON */ }

    avisarConexion(res.status >= 500 ? 'error' : 'ok');
    if (!res.ok || !json || json.success === false) {
      // En 5xx el servidor solo dice "Error interno"; se muestra un texto más claro.
      const error = res.status >= 500 ? mensajePorEstado(res.status) : (json && json.message) || mensajePorEstado(res.status);
      return { ok: false, data: null, error, status: res.status };
    }
    return { ok: true, data: json, error: null, status: res.status };
  } catch {
    avisarConexion('offline');
    return { ok: false, data: null, error: 'No se pudo conectar con el servidor.', status: 0 };
  }
}

/** Respuesta simulada para secciones sin endpoint (con pequeña espera). */
function simulado(datos, espera = 250) {
  return new Promise((resolver) =>
    setTimeout(() => resolver({ ok: true, data: structuredClone(datos), error: null, mock: true }), espera));
}

/* =====================================================================
 * Endpoints REALES (server.js)
 * ===================================================================== */

/** POST /api/login → { id_usuario, nombre, rol } */
export async function login(telefono, password) {
  const r = await solicitar('/api/login', { metodo: 'POST', cuerpo: { telefono, password } });
  return r.ok ? { ...r, data: r.data.user } : r;
}

/** POST /api/registrar → { message } (el rol 'Personal' lo fuerza el procedimiento) */
export async function registrarTrabajador({ nombre, telefono, contacto, sabe_manejar, password }) {
  const r = await solicitar('/api/registrar', {
    metodo: 'POST',
    cuerpo: { nombre, telefono, contacto, sabe_manejar, password },
  });
  return r.ok ? { ...r, data: { message: r.data.message } } : r;
}

/** GET /api/jefe/asistencia-obras → filas de Vista_Control_Asistencia_Admin (máx. 50) */
export async function asistenciaObras() {
  const r = await solicitar('/api/jefe/asistencia-obras');
  return r.ok ? { ...r, data: r.data.data || [] } : r;
}

/**
 * GET /api/trabajador/asignaciones → filas de Vista_Mis_Asignaciones.
 * La vista NO filtra por usuario (regresa las de todo el personal), así que
 * se filtra aquí por id_usuario. Debe corregirse en el backend.
 */
export async function misAsignaciones(idUsuario) {
  const r = await solicitar('/api/trabajador/asignaciones');
  if (!r.ok) return r;
  const filas = (r.data.data || []).filter((f) => String(f.id_usuario) === String(idUsuario));
  return { ...r, data: filas };
}

/* =====================================================================
 * Secciones SIN endpoint (datos de mock.js)
 * Se irán agregando por etapa.
 * ===================================================================== */

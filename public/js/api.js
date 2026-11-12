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
 * ===================================================================== */

/** Resumen de bitácoras del día (Panel General). */
export function resumenBitacorasHoy() {
  // TODO(endpoint): GET /api/bitacoras/resumen-hoy
  //   SELECT COUNT(*) AS registradas, SUM(sincronizado_notion) AS sincronizadas_notion
  //   FROM BITACORAS WHERE fecha = CURDATE();
  return simulado(mock.resumenBitacorasHoy);
}

/** Registro de asistencia de hoy del usuario (Mi Asistencia). */
export function miAsistenciaHoy(idUsuario) {
  // TODO(endpoint): GET /api/asistencia/hoy?id_usuario=…
  //   SELECT fecha, hora_entrada, hora_salida, ubicacion
  //   FROM ASISTENCIA_DIARIA WHERE id_usuario = ? AND fecha = CURDATE();
  void idUsuario;
  return simulado(mock.miAsistenciaHoy);
}

/** Historial de asistencias del usuario (Mi Asistencia). */
export function historialAsistencia(idUsuario) {
  // TODO(endpoint): GET /api/asistencia/historial?id_usuario=…
  //   SELECT ad.fecha, ad.hora_entrada, ad.hora_salida, ad.ubicacion, o.nombre AS obra
  //   FROM ASISTENCIA_DIARIA ad
  //   LEFT JOIN ASIGNACION_OBRAS ao ON ao.id_usuario = ad.id_usuario AND ao.fecha = ad.fecha
  //   LEFT JOIN OBRAS o ON o.id_obra = ao.id_obra
  //   WHERE ad.id_usuario = ? ORDER BY ad.fecha DESC LIMIT 30;
  void idUsuario;
  return simulado(mock.historialAsistencia);
}

/** Respuesta común para acciones que todavía no tienen endpoint. */
const pendiente = () => Promise.resolve({
  ok: false, data: null, pendiente: true, error: 'Funcionalidad pendiente de endpoint.',
});

/** Registrar entrada del día. */
export function registrarEntrada(idUsuario, ubicacion) {
  // TODO(endpoint): POST /api/asistencia/entrada  { id_usuario, ubicacion }
  //   INSERT INTO ASISTENCIA_DIARIA (id_usuario, fecha, hora_entrada, ubicacion)
  //   VALUES (?, CURDATE(), CURTIME(), ?);
  void idUsuario; void ubicacion;
  return pendiente();
}

/** Registrar salida del día. */
export function registrarSalida(idUsuario) {
  // TODO(endpoint): POST /api/asistencia/salida  { id_usuario }
  //   UPDATE ASISTENCIA_DIARIA SET hora_salida = CURTIME()
  //   WHERE id_usuario = ? AND fecha = CURDATE() AND hora_salida IS NULL;
  void idUsuario;
  return pendiente();
}

/** Listado de obras con su cliente (Dashboard y Obras). */
export function obras() {
  // TODO(endpoint): GET /api/obras
  //   SELECT o.*, c.nombre AS cliente,
  //     (SELECT COUNT(DISTINCT ao.id_usuario) FROM ASIGNACION_OBRAS ao WHERE ao.id_obra = o.id_obra) AS personal_asignado,
  //     (SELECT COUNT(*) FROM USO_MATERIALES um WHERE um.id_obra = o.id_obra) AS materiales_registrados
  //   FROM OBRAS o LEFT JOIN CLIENTES c ON c.id_cliente = o.id_cliente ORDER BY o.fecha_inicio DESC;
  const conCliente = mock.obras.map((o) => ({
    ...o, cliente: (mock.clientes.find((c) => c.id_cliente === o.id_cliente) || {}).nombre || null,
  }));
  return simulado(conCliente);
}

/** Catálogo de clientes (formulario de obra). */
export function clientes() {
  // TODO(endpoint): GET /api/clientes  →  SELECT id_cliente, nombre, rfc FROM CLIENTES ORDER BY nombre;
  return simulado(mock.clientes);
}

/** Alta de obra: se valida en el cliente, pero todavía no se envía. */
export function crearObra(datos) {
  // TODO(endpoint): POST /api/obras  { nombre, direccion, presupuesto, fecha_inicio, estado, id_cliente }
  //   INSERT INTO OBRAS (nombre, direccion, presupuesto, fecha_inicio, estado, id_cliente)
  //   VALUES (?, ?, ?, ?, ?, ?);
  void datos;
  return pendiente();
}

/** Plantilla por rol (Dashboard). */
export function resumenPlantilla() {
  // TODO(endpoint): GET /api/personal/resumen
  //   SELECT rol, COUNT(*) AS total, SUM(sabe_manejar) AS saben_manejar FROM USUARIOS GROUP BY rol;
  return simulado(mock.resumenPlantilla);
}

/** Herramientas con su estado (Dashboard). */
export function herramientas() {
  // TODO(endpoint): GET /api/herramientas  →  SELECT id_herramienta, nombre, numero_serie, estado FROM HERRAMIENTAS;
  return simulado(mock.herramientas);
}

/** Vehículos con su estado (Dashboard). */
export function vehiculos() {
  // TODO(endpoint): GET /api/vehiculos  →  SELECT id_vehiculo, placas, modelo, estado FROM VEHICULOS;
  return simulado(mock.vehiculos);
}

/** Consumo de materiales del mes (Dashboard). */
export function consumoMateriales() {
  // TODO(endpoint): GET /api/materiales/consumo-mes
  //   SELECT m.nombre AS material, m.unidad_medida AS unidad, SUM(um.cantidad) AS cantidad
  //   FROM USO_MATERIALES um JOIN MATERIALES m ON m.id_material = um.id_material
  //   WHERE um.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  //   GROUP BY m.id_material ORDER BY cantidad DESC LIMIT 5;
  return simulado(mock.consumoMateriales);
}

/** Préstamos de herramienta sin devolver (Dashboard). */
export function prestamosAbiertos() {
  // TODO(endpoint): GET /api/prestamos/abiertos
  //   SELECT h.nombre AS herramienta, u.nombre AS trabajador, o.nombre AS obra, ph.fecha_prestamo
  //   FROM PRESTAMO_HERRAMIENTAS ph
  //   JOIN HERRAMIENTAS h ON h.id_herramienta = ph.id_herramienta
  //   JOIN USUARIOS u ON u.id_usuario = ph.id_usuario
  //   JOIN OBRAS o ON o.id_obra = ph.id_obra
  //   WHERE ph.fecha_devolucion IS NULL ORDER BY ph.fecha_prestamo;
  return simulado(mock.prestamosAbiertos);
}

/** Actividad reciente (Dashboard). */
export function actividadReciente() {
  // TODO(endpoint): GET /api/actividad-reciente
  //   (SELECT 'bitacora' AS tipo, b.fecha, u.nombre, o.nombre AS obra, b.comentarios AS detalle FROM BITACORAS b …)
  //   UNION ALL (SELECT 'prestamo', ph.fecha_prestamo, … FROM PRESTAMO_HERRAMIENTAS ph …)
  //   UNION ALL (SELECT 'vehiculo', av.fecha, … FROM ASIGNACION_VEHICULOS av …)
  //   ORDER BY fecha DESC LIMIT 10;
  return simulado(mock.actividadReciente);
}

/** Listado de personal (página Personal). */
export function personal() {
  // TODO(endpoint): GET /api/personal
  //   SELECT id_usuario, nombre, telefono, contacto_emergencia, sabe_manejar, rol FROM USUARIOS ORDER BY nombre;
  //   (Nunca devolver la columna password.)
  return simulado(mock.personal);
}

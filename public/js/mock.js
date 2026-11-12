/*
 * Datos de ejemplo para las secciones que aún no tienen endpoint.
 * Solo api.js importa este archivo. Cada bloque indica qué tabla de
 * creacion.sql lo respaldaría cuando exista el endpoint.
 * Los nombres son ficticios y no representan registros reales.
 */

/* ---------- Panel General ---------- */

// Respaldo futuro: BITACORAS (fecha = CURDATE()), columna sincronizado_notion.
export const resumenBitacorasHoy = {
  registradas: 7,
  sincronizadas_notion: 4,
};

/* ---------- Mi Asistencia ---------- */

// Fecha local "YYYY-MM-DD" de hace n días (los datos siempre quedan vigentes).
function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const dos = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

// Respaldo futuro: ASISTENCIA_DIARIA WHERE id_usuario = ? AND fecha = CURDATE().
// Sin entrada registrada todavía.
export const miAsistenciaHoy = {
  fecha: haceDias(0),
  hora_entrada: null,
  hora_salida: null,
  ubicacion: null,
};

// Respaldo futuro: ASISTENCIA_DIARIA + ASIGNACION_OBRAS + OBRAS del usuario (últimos días).
// Se omiten los domingos para que parezca una semana laboral.
const OBRAS_EJEMPLO = [
  ['Plaza Galerías – Tableros', 'Plaza Galerías, Morelia'],
  ['Nave Industrial Norte – Subestación', 'Parque Industrial Morelia, Nave Norte'],
];
const HORARIOS = [
  ['07:55:00', '17:05:00'], ['08:02:00', '17:30:00'], ['07:58:00', '16:30:00'],
  ['08:00:00', '17:00:00'], ['07:47:00', '16:40:00'], ['07:50:00', '17:15:00'],
  ['07:42:00', '17:00:00'], ['08:05:00', '17:20:00'], ['07:56:00', '16:55:00'],
];
export const historialAsistencia = (() => {
  const filas = [];
  for (let n = 1; filas.length < HORARIOS.length; n++) {
    const fecha = haceDias(n);
    if (new Date(`${fecha}T12:00:00`).getDay() === 0) continue; // domingo
    const [obra, ubicacion] = OBRAS_EJEMPLO[filas.length % 3 === 2 ? 1 : 0];
    const [hora_entrada, hora_salida] = HORARIOS[filas.length];
    filas.push({ fecha, hora_entrada, hora_salida, obra, ubicacion });
  }
  return filas;
})();

/* ---------- Catálogo de obras (Dashboard y Obras e Instalaciones) ---------- */

// Respaldo futuro: CLIENTES
export const clientes = [
  { id_cliente: 1, nombre: 'Desarrollos Comerciales del Valle S.A. de C.V.', rfc: 'DCV1503125A1' },
  { id_cliente: 2, nombre: 'Naves Industriales del Bajío S.A.', rfc: 'NIB0807223B4' },
  { id_cliente: 3, nombre: 'Inmobiliaria Corporativa Reforma', rfc: 'ICR1110059C7' },
  { id_cliente: 4, nombre: 'Logística Michoacana S.A.P.I.', rfc: 'LMI1902148D2' },
  { id_cliente: 5, nombre: 'Manufacturas Valle de Morelia', rfc: 'MVM0506301E9' },
];

// Respaldo futuro: OBRAS JOIN CLIENTES + conteos de ASIGNACION_OBRAS y USO_MATERIALES.
// fecha_inicio relativa a hoy para que los datos no envejezcan (negativo = fecha futura).
export const obras = [
  { id_obra: 1, nombre: 'Instalación de fuerza y alumbrado Plaza Galerías', direccion: 'Av. Camelinas 3233, Morelia, Mich.',
    presupuesto: 485000, fecha_inicio: haceDias(30), estado: 'En Proceso', id_cliente: 1, personal_asignado: 4, materiales_registrados: 3 },
  { id_obra: 2, nombre: 'Mantenimiento de subestación Nave Industrial Norte', direccion: 'Parque Industrial Morelia, Calle 3 #120',
    presupuesto: 340000, fecha_inicio: haceDias(20), estado: 'En Proceso', id_cliente: 2, personal_asignado: 3, materiales_registrados: 2 },
  { id_obra: 3, nombre: 'Adecuación eléctrica de oficinas Centro', direccion: 'Av. Madero Poniente 450, Centro, Morelia, Mich.',
    presupuesto: 190000, fecha_inicio: haceDias(-10), estado: 'Cotizada', id_cliente: 3, personal_asignado: 0, materiales_registrados: 0 },
  { id_obra: 4, nombre: 'Alumbrado LED estacionamiento Plaza Oriente', direccion: 'Periférico Paseo de la República 5000, Morelia, Mich.',
    presupuesto: 125000, fecha_inicio: haceDias(90), estado: 'Terminada', id_cliente: 1, personal_asignado: 0, materiales_registrados: 4 },
  { id_obra: 5, nombre: 'Subestación principal Parque Logístico Tarímbaro', direccion: 'Carretera Morelia–Salamanca km 8, Tarímbaro, Mich.',
    presupuesto: 1240000, fecha_inicio: haceDias(45), estado: 'En Proceso', id_cliente: 4, personal_asignado: 6, materiales_registrados: 5 },
  { id_obra: 6, nombre: 'Reubicación de acometida Manufacturas Valle', direccion: 'Calle Poniente 140, Ciudad Industrial, Morelia, Mich.',
    presupuesto: 88500, fecha_inicio: haceDias(-20), estado: 'Cotizada', id_cliente: 5, personal_asignado: 0, materiales_registrados: 0 },
];

/* ---------- Dashboard Administrativo ---------- */

// Respaldo futuro: USUARIOS agrupado por rol y sabe_manejar.
export const resumenPlantilla = { total: 16, por_rol: { JefeAdmin: 1, Admin: 1, Personal: 14 }, saben_manejar: 6 };

// Respaldo futuro: HERRAMIENTAS (estado).
const herramientasPorEstado = (estado, n, desde) =>
  Array.from({ length: n }, (_, i) => ({ id_herramienta: desde + i, estado }));
export const herramientas = [
  ...herramientasPorEstado('Disponible', 31, 1),
  ...herramientasPorEstado('Prestada', 23, 32),
  ...herramientasPorEstado('En mantenimiento', 6, 55),
];

// Respaldo futuro: VEHICULOS (estado).
export const vehiculos = [
  { id_vehiculo: 1, placas: 'PNM-123-A', modelo: 'Nissan NP300 2021', estado: 'En uso' },
  { id_vehiculo: 2, placas: 'PRT-456-B', modelo: 'Toyota Hilux 2019', estado: 'Disponible' },
  { id_vehiculo: 3, placas: 'PSR-789-C', modelo: 'Nissan NP300 2022', estado: 'En uso' },
  { id_vehiculo: 4, placas: 'PTU-012-D', modelo: 'Ford Transit 2020', estado: 'En uso' },
  { id_vehiculo: 5, placas: 'PVW-345-E', modelo: 'Chevrolet S10 2018', estado: 'En taller' },
];

// Respaldo futuro: SUM(USO_MATERIALES.cantidad) del mes por material.
export const consumoMateriales = [
  { material: 'Cable THW calibre 10 AWG (cobre)', unidad: 'm', cantidad: 2400 },
  { material: 'Tubo conduit pared delgada 3/4 pulg.', unidad: 'tramo', cantidad: 480 },
  { material: 'Conector glándula 3/4 pulg.', unidad: 'pza', cantidad: 350 },
  { material: 'Interruptor termomagnético 1P 20A', unidad: 'pza', cantidad: 120 },
];

// Respaldo futuro: PRESTAMO_HERRAMIENTAS WHERE fecha_devolucion IS NULL.
export const prestamosAbiertos = [
  { herramienta: 'Megóhmetro Megger MIT420', trabajador: 'Mauricio López Torres', obra: 'Mantenimiento de subestación Nave Industrial Norte', fecha_prestamo: haceDias(12) },
  { herramienta: 'Multímetro Fluke 87V', trabajador: 'Carlos Mendoza Ruiz', obra: 'Instalación de fuerza y alumbrado Plaza Galerías', fecha_prestamo: haceDias(4) },
  { herramienta: 'Rotomartillo Bosch SDS Plus', trabajador: 'Roberto Gómez López', obra: 'Instalación de fuerza y alumbrado Plaza Galerías', fecha_prestamo: haceDias(2) },
];

// Respaldo futuro: UNION de BITACORAS, PRESTAMO_HERRAMIENTAS y ASIGNACION_VEHICULOS recientes.
export const actividadReciente = [
  { tipo: 'bitacora', fecha: haceDias(0), titulo: 'Bitácora registrada', detalle: 'Carlos Mendoza Ruiz en Plaza Galerías: peinado de tablero y prueba de aislamiento.' },
  { tipo: 'prestamo', fecha: haceDias(0), titulo: 'Préstamo de herramienta', detalle: 'Rotomartillo Bosch SDS Plus a Roberto Gómez López para Plaza Galerías.' },
  { tipo: 'vehiculo', fecha: haceDias(1), titulo: 'Vehículo asignado', detalle: 'Nissan NP300 (PNM-123-A) a Carlos Mendoza Ruiz rumbo a Plaza Galerías.' },
  { tipo: 'bitacora', fecha: haceDias(1), titulo: 'Bitácora registrada', detalle: 'Mauricio López Torres en Nave Industrial Norte: mantenimiento a transformador.' },
];

/* ---------- Personal ---------- */

// Respaldo futuro: SELECT id_usuario, nombre, telefono, sabe_manejar, rol FROM USUARIOS.
export const personal = [
  { id_usuario: 3, nombre: 'Carlos Mendoza Ruiz', telefono: '4430000001', sabe_manejar: true, rol: 'Personal' },
  { id_usuario: 4, nombre: 'Roberto Gómez López', telefono: '4430000002', sabe_manejar: false, rol: 'Personal' },
  { id_usuario: 5, nombre: 'Mauricio López Torres', telefono: '4430000003', sabe_manejar: true, rol: 'Personal' },
  { id_usuario: 6, nombre: 'Alberto Pérez Castro', telefono: '4430000004', sabe_manejar: false, rol: 'Personal' },
];

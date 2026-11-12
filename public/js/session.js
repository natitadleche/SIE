/*
 * Manejo de sesión en el navegador (sessionStorage).
 *
 * IMPORTANTE: esto es SOLO experiencia de usuario, NO es seguridad.
 * Cualquiera puede editar sessionStorage desde las herramientas del
 * navegador y llamar a la API directamente. La autorización real debe
 * hacerse en el backend (sesión/token y verificación de rol por endpoint).
 */

const CLAVE = 'scosie.sesion';

/**
 * Permisos por rol: qué páginas puede abrir cada rol.
 * Editar aquí si cambia la regla de negocio.
 */
export const PERMISOS = {
  JefeAdmin: ['panel', 'asistencia', 'dashboard', 'obras', 'personal'],
  Admin:     ['panel', 'asistencia', 'dashboard', 'obras', 'personal'],
  Personal:  ['panel', 'asistencia'],
};

/** Nombre legible de cada rol para mostrar en la interfaz. */
export const ETIQUETAS_ROL = {
  JefeAdmin: 'Jefe Administrador',
  Admin: 'Administrador',
  Personal: 'Personal de campo',
};

export const esAdministrativo = (rol) => rol === 'JefeAdmin' || rol === 'Admin';

/** Guarda solo los datos necesarios del usuario (nunca la contraseña). */
export function guardarSesion(usuario) {
  const datos = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };
  sessionStorage.setItem(CLAVE, JSON.stringify(datos));
  return datos;
}

/** Lee la sesión; regresa null si no existe o está mal formada. */
export function obtenerSesion() {
  try {
    const datos = JSON.parse(sessionStorage.getItem(CLAVE));
    if (datos && datos.id_usuario != null && datos.nombre && PERMISOS[datos.rol]) return datos;
  } catch { /* JSON inválido: se trata como sin sesión */ }
  return null;
}

export function tienePermiso(rol, pagina) {
  return (PERMISOS[rol] || []).includes(pagina);
}

/**
 * Guard de página: si no hay sesión o el rol no tiene acceso,
 * redirige a index.html (con el motivo) y regresa null.
 */
export function protegerPagina(pagina) {
  const sesion = obtenerSesion();
  if (!sesion) {
    location.replace('index.html');
    return null;
  }
  if (!tienePermiso(sesion.rol, pagina)) {
    location.replace('index.html?motivo=permiso');
    return null;
  }
  return sesion;
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE);
  location.replace('index.html?motivo=salida');
}

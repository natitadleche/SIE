-- ========================================================
-- 1. CREACION DE LA BASE DE DATOS
-- ========================================================
CREATE DATABASE IF NOT EXISTS ControlObrasSIE;
USE ControlObrasSIE;

-- ========================================================
-- 2. CREACION DE TABLAS: CATALOGOS (Sin llaves foraneas)
-- ========================================================
-- Dependencias: NINGUNA (Es independiente)
CREATE TABLE CLIENTES (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    rfc VARCHAR(15),
    giro_comercial VARCHAR(100)
);

-- Dependencias: NINGUNA (Es independiente)
CREATE TABLE USUARIOS (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    contacto_emergencia VARCHAR(150),
    sabe_manejar BOOLEAN DEFAULT FALSE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL 
);

-- Dependencias: NINGUNA (Es independiente)
CREATE TABLE MATERIALES (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20)
);

-- Dependencias: NINGUNA (Es independiente)
CREATE TABLE HERRAMIENTAS (
    id_herramienta INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    numero_serie VARCHAR(50),
    estado VARCHAR(50) 
);

-- Dependencias: NINGUNA (Es independiente)
CREATE TABLE VEHICULOS (
    id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    placas VARCHAR(20) NOT NULL,
    modelo VARCHAR(100),
    estado VARCHAR(50) 
);

-- ========================================================
-- 3. CREACION DE TABLAS: DEPENDENCIAS NIVEL 1
-- ========================================================
-- Dependencias: Depende de CLIENTES (id_cliente)
CREATE TABLE OBRAS (
    id_obra INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    presupuesto DECIMAL(10,2),
    fecha_inicio DATE,
    estado VARCHAR(50), 
    id_cliente INT,
    FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente)
);

-- Dependencias: Depende de USUARIOS (id_usuario)
CREATE TABLE ASISTENCIA_DIARIA (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    ubicacion VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
);

-- ========================================================
-- 4. CREACION DE TABLAS: TRANSACCIONALES
-- ========================================================
-- Dependencias: Depende de USUARIOS (id_usuario) y OBRAS (id_obra)
CREATE TABLE ASIGNACION_OBRAS (
    id_usuario INT,
    id_obra INT,
    fecha DATE,
    PRIMARY KEY (id_usuario, id_obra, fecha),
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario),
    FOREIGN KEY (id_obra) REFERENCES OBRAS(id_obra)
);

-- Dependencias: Depende de HERRAMIENTAS (id_herramienta), OBRAS (id_obra) y USUARIOS (id_usuario)
CREATE TABLE PRESTAMO_HERRAMIENTAS (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    id_herramienta INT,
    id_obra INT,
    id_usuario INT,
    fecha_prestamo DATE,
    fecha_devolucion DATE,
    FOREIGN KEY (id_herramienta) REFERENCES HERRAMIENTAS(id_herramienta),
    FOREIGN KEY (id_obra) REFERENCES OBRAS(id_obra),
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
);

-- Dependencias: Depende de OBRAS (id_obra) y MATERIALES (id_material)
CREATE TABLE USO_MATERIALES (
    id_uso_material INT AUTO_INCREMENT PRIMARY KEY,
    id_obra INT,
    id_material INT,
    cantidad DECIMAL(10,2) NOT NULL,
    fecha DATE,
    FOREIGN KEY (id_obra) REFERENCES OBRAS(id_obra),
    FOREIGN KEY (id_material) REFERENCES MATERIALES(id_material)
);

-- Dependencias: Depende de VEHICULOS (id_vehiculo), USUARIOS (id_usuario) y OBRAS (id_obra)
CREATE TABLE ASIGNACION_VEHICULOS (
    id_asig_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_vehiculo INT,
    id_usuario INT,
    id_obra INT,
    fecha DATE,
    FOREIGN KEY (id_vehiculo) REFERENCES VEHICULOS(id_vehiculo),
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario),
    FOREIGN KEY (id_obra) REFERENCES OBRAS(id_obra)
);

-- Dependencias: Depende de OBRAS (id_obra) y USUARIOS (id_usuario)
CREATE TABLE BITACORAS (
    id_bitacora INT AUTO_INCREMENT PRIMARY KEY,
    id_obra INT,
    id_usuario INT,
    fecha DATE NOT NULL,
    comentarios TEXT,
    url_foto VARCHAR(255),
    sincronizado_notion BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_obra) REFERENCES OBRAS(id_obra),
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
);

-- ========================================================
-- 5. CREACION DE VISTAS POR TIPO DE USUARIO
-- ========================================================

-- Vista para Trabajadores
CREATE VIEW Vista_Mis_Asignaciones AS
SELECT 
    u.id_usuario,
    u.nombre AS trabajador,
    o.nombre AS obra,
    o.direccion,
    ao.fecha AS fecha_asignacion,
    ph.id_herramienta,
    h.nombre AS herramienta_prestada
FROM USUARIOS u
JOIN ASIGNACION_OBRAS ao ON u.id_usuario = ao.id_usuario
JOIN OBRAS o ON ao.id_obra = o.id_obra
LEFT JOIN PRESTAMO_HERRAMIENTAS ph ON u.id_usuario = ph.id_usuario AND o.id_obra = ph.id_obra
LEFT JOIN HERRAMIENTAS h ON ph.id_herramienta = h.id_herramienta
WHERE u.rol = 'Personal';

-- Vista para Administracion
CREATE VIEW Vista_Control_Asistencia_Admin AS
SELECT 
    ad.fecha,
    u.nombre AS empleado,
    u.telefono,
    ad.hora_entrada,
    ad.hora_salida,
    ad.ubicacion,
    o.nombre AS obra_actual,
    av.id_vehiculo
FROM ASISTENCIA_DIARIA ad
JOIN USUARIOS u ON ad.id_usuario = u.id_usuario
LEFT JOIN ASIGNACION_OBRAS ao ON u.id_usuario = ao.id_usuario AND ad.fecha = ao.fecha
LEFT JOIN OBRAS o ON ao.id_obra = o.id_obra
LEFT JOIN ASIGNACION_VEHICULOS av ON u.id_usuario = av.id_usuario AND ad.fecha = av.fecha;

-- Vista para el Jefe
CREATE VIEW Vista_Dictamenes_Jefe AS
SELECT 
    c.nombre AS cliente,
    c.rfc,
    o.id_obra,
    o.nombre AS proyecto,
    o.presupuesto,
    o.estado,
    b.fecha AS fecha_bitacora,
    b.comentarios AS reporte_tecnico,
    b.url_foto AS evidencia_nube,
    b.sincronizado_notion
FROM CLIENTES c
JOIN OBRAS o ON c.id_cliente = o.id_cliente
LEFT JOIN BITACORAS b ON o.id_obra = b.id_obra
ORDER BY c.nombre, o.fecha_inicio DESC;

-- ========================================================
-- 6. CREACION DE USUARIOS DEL GESTOR (DBMS) Y PERMISOS
-- ========================================================
CREATE USER IF NOT EXISTS 'jefe_app'@'localhost' IDENTIFIED BY 'PasswordJefe123';
CREATE USER IF NOT EXISTS 'admin_app'@'localhost' IDENTIFIED BY 'PasswordAdmin123';
CREATE USER IF NOT EXISTS 'trabajador_app'@'localhost' IDENTIFIED BY 'PasswordTrabajador123';

-- Permisos Jefe
GRANT SELECT, INSERT, UPDATE, DELETE ON ControlObrasSIE.* TO 'jefe_app'@'localhost';

-- Permisos Administracion
GRANT ALL PRIVILEGES ON ControlObrasSIE.* TO 'admin_app'@'localhost';

-- Permisos Trabajador
GRANT SELECT ON ControlObrasSIE.Vista_Mis_Asignaciones TO 'trabajador_app'@'localhost';
GRANT INSERT ON ControlObrasSIE.ASISTENCIA_DIARIA TO 'trabajador_app'@'localhost';
GRANT INSERT ON ControlObrasSIE.BITACORAS TO 'trabajador_app'@'localhost';
GRANT INSERT, UPDATE ON ControlObrasSIE.PRESTAMO_HERRAMIENTAS TO 'trabajador_app'@'localhost';
GRANT INSERT ON ControlObrasSIE.USO_MATERIALES TO 'trabajador_app'@'localhost';

FLUSH PRIVILEGES;

-- ========================================================
-- 7. INSERCION DE DATOS INICIALES (Cuentas Gerenciales)
-- ========================================================
INSERT INTO USUARIOS (nombre, telefono, password, rol) 
VALUES ('Nataly Jacobo', '4433702199', 'hash_password_jefe', 'JefeAdmin');

INSERT INTO USUARIOS (nombre, telefono, password, rol) 
VALUES ('Admin Oficina', '4432997158', 'hash_password_admin', 'Admin');

-- ========================================================
-- 8. PROCEDIMIENTO ALMACENADO PARA REGISTRO DE PERSONAL
-- ========================================================
DELIMITER //

CREATE PROCEDURE RegistrarTrabajador(
    IN p_nombre VARCHAR(150),
    IN p_telefono VARCHAR(20),
    IN p_contacto_emergencia VARCHAR(150),
    IN p_sabe_manejar BOOLEAN,
    IN p_password VARCHAR(255)
)
BEGIN
    -- Fuerza el rol 'Personal' por seguridad desde la base de datos
    INSERT INTO USUARIOS (nombre, telefono, contacto_emergencia, sabe_manejar, password, rol)
    VALUES (p_nombre, p_telefono, p_contacto_emergencia, p_sabe_manejar, p_password, 'Personal');
END //

DELIMITER ;

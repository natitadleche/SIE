-- ========================================================
-- DATOS DE PRUEBA / DEMOSTRACIÓN — ControlObrasSIE
-- ========================================================
-- Ejecutar UNA sola vez, justo después de creacion.sql, sobre la BD recién creada.
-- Las fechas son relativas a CURDATE(), así que siempre hay datos de HOY
-- y de los 4 días anteriores sin importar cuándo se ejecute.
--
-- Trabajadores de prueba (rol 'Personal', contraseñas en TEXTO PLANO,
-- igual que el resto del esquema actual; solo para demostración):
--   Carlos Mendoza Ruiz     tel. 4430000001   contraseña: carlos123
--   Roberto Gómez López     tel. 4430000002   contraseña: roberto123
--   Mauricio López Torres   tel. 4430000003   contraseña: mauricio123
--   Alberto Pérez Castro    tel. 4430000004   contraseña: alberto123
--
-- Escenario:
--   - Obra 1 (En Proceso): Carlos y Roberto.  Obra 2 (En Proceso): Mauricio y Alberto.
--   - Obra 3 Terminada y Obra 4 Cotizada (sin personal asignado).
--   - HOY: Carlos, Roberto y Mauricio registraron entrada y aún no salida;
--     Alberto no se ha presentado. Hace 2 días Roberto faltó.
--   - Carlos maneja la camioneta 1 todos los días y tiene un multímetro prestado.
--
-- Para deshacer todo: volver a ejecutar creacion.sql sobre una BD limpia
-- (DROP DATABASE ControlObrasSIE;) — este script no está pensado para revertirse por partes.
-- ========================================================

USE ControlObrasSIE;

START TRANSACTION;

-- --------------------------------------------------------
-- 1. CATÁLOGOS INDEPENDIENTES
-- --------------------------------------------------------

-- Clientes
INSERT INTO CLIENTES (nombre, telefono, rfc, giro_comercial)
VALUES ('Desarrollos Comerciales del Valle S.A. de C.V.', '4431112233', 'DCV1503125A1', 'Centros comerciales');
SET @c1 = LAST_INSERT_ID();

INSERT INTO CLIENTES (nombre, telefono, rfc, giro_comercial)
VALUES ('Naves Industriales del Bajío S.A.', '4612223344', 'NIB0807223B4', 'Parques industriales');
SET @c2 = LAST_INSERT_ID();

INSERT INTO CLIENTES (nombre, telefono, rfc, giro_comercial)
VALUES ('Inmobiliaria Corporativa Reforma', '5553334455', 'ICR1110059C7', 'Oficinas corporativas');
SET @c3 = LAST_INSERT_ID();

-- Trabajadores: se usa el mismo procedimiento que el alta de la aplicación
-- (fuerza rol = 'Personal').
CALL RegistrarTrabajador('Carlos Mendoza Ruiz',   '4430000001', 'Laura Ruiz (esposa) 4431000001',   TRUE,  'carlos123');
CALL RegistrarTrabajador('Roberto Gómez López',   '4430000002', 'Ana López (madre) 4431000002',     FALSE, 'roberto123');
CALL RegistrarTrabajador('Mauricio López Torres', '4430000003', 'Pedro López (hermano) 4431000003', TRUE,  'mauricio123');
CALL RegistrarTrabajador('Alberto Pérez Castro',  '4430000004', 'Sofía Castro (esposa) 4431000004', FALSE, 'alberto123');

SET @w1 = (SELECT id_usuario FROM USUARIOS WHERE telefono = '4430000001');
SET @w2 = (SELECT id_usuario FROM USUARIOS WHERE telefono = '4430000002');
SET @w3 = (SELECT id_usuario FROM USUARIOS WHERE telefono = '4430000003');
SET @w4 = (SELECT id_usuario FROM USUARIOS WHERE telefono = '4430000004');

-- Materiales
INSERT INTO MATERIALES (nombre, descripcion, unidad_medida)
VALUES ('Cable THW calibre 10 AWG (cobre)', 'Conductor de cobre con aislamiento THW-LS 90 °C, 600 V', 'm');
SET @m1 = LAST_INSERT_ID();

INSERT INTO MATERIALES (nombre, descripcion, unidad_medida)
VALUES ('Tubo conduit pared delgada 3/4"', 'Tubo galvanizado de 3 m para canalización', 'tramo');
SET @m2 = LAST_INSERT_ID();

INSERT INTO MATERIALES (nombre, descripcion, unidad_medida)
VALUES ('Interruptor termomagnético 1P 20A', 'Interruptor enchufable para centro de carga', 'pza');
SET @m3 = LAST_INSERT_ID();

-- Herramientas
INSERT INTO HERRAMIENTAS (nombre, numero_serie, estado) VALUES ('Multímetro Fluke 87V', 'FLK87V-0001', 'Prestada');
SET @h1 = LAST_INSERT_ID();
INSERT INTO HERRAMIENTAS (nombre, numero_serie, estado) VALUES ('Megóhmetro Megger MIT420', 'MGR420-0002', 'Disponible');
INSERT INTO HERRAMIENTAS (nombre, numero_serie, estado) VALUES ('Rotomartillo Bosch SDS Plus', 'BSHSDS-0003', 'Disponible');
INSERT INTO HERRAMIENTAS (nombre, numero_serie, estado) VALUES ('Ponchadora hidráulica 12 ton', 'PCH12T-0004', 'En mantenimiento');

-- Vehículos
INSERT INTO VEHICULOS (placas, modelo, estado) VALUES ('PNM-123-A', 'Nissan NP300 2021', 'En uso');
SET @v1 = LAST_INSERT_ID();
INSERT INTO VEHICULOS (placas, modelo, estado) VALUES ('PRT-456-B', 'Toyota Hilux 2019', 'Disponible');

-- --------------------------------------------------------
-- 2. OBRAS (dependen de CLIENTES)
-- --------------------------------------------------------
INSERT INTO OBRAS (nombre, direccion, presupuesto, fecha_inicio, estado, id_cliente)
VALUES ('Instalación de fuerza y alumbrado Plaza Galerías', 'Av. Camelinas 3233, Morelia, Mich.',
        485000.00, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'En Proceso', @c1);
SET @o1 = LAST_INSERT_ID();

INSERT INTO OBRAS (nombre, direccion, presupuesto, fecha_inicio, estado, id_cliente)
VALUES ('Mantenimiento de subestación Nave Industrial Norte', 'Parque Industrial Morelia, Calle 3 #120',
        340000.00, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'En Proceso', @c2);
SET @o2 = LAST_INSERT_ID();

INSERT INTO OBRAS (nombre, direccion, presupuesto, fecha_inicio, estado, id_cliente)
VALUES ('Alumbrado LED estacionamiento Plaza Oriente', 'Periférico Paseo de la República 5000, Morelia, Mich.',
        125000.00, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 'Terminada', @c1);
SET @o3 = LAST_INSERT_ID();

INSERT INTO OBRAS (nombre, direccion, presupuesto, fecha_inicio, estado, id_cliente)
VALUES ('Adecuación eléctrica de oficinas Centro', 'Av. Madero Poniente 450, Centro, Morelia, Mich.',
        190000.00, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Cotizada', @c3);

-- --------------------------------------------------------
-- 3. ASISTENCIA DIARIA (depende de USUARIOS) — últimos 5 días incluido HOY
--    HOY sin hora de salida (turno en curso). Alberto falta hoy; Roberto faltó hace 2 días.
-- --------------------------------------------------------
INSERT INTO ASISTENCIA_DIARIA (id_usuario, fecha, hora_entrada, hora_salida, ubicacion) VALUES
-- Hace 4 días
(@w1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:42:00', '17:05:00', 'Plaza Galerías, Morelia'),
(@w2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:50:00', '17:00:00', 'Plaza Galerías, Morelia'),
(@w3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:30:00', '16:45:00', 'Parque Industrial Morelia, Nave Norte'),
(@w4, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:05:00', '17:10:00', 'Parque Industrial Morelia, Nave Norte'),
-- Hace 3 días
(@w1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '07:55:00', '17:30:00', 'Plaza Galerías, Morelia'),
(@w2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '07:44:00', '17:00:00', 'Plaza Galerías, Morelia'),
(@w3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '07:20:00', '16:30:00', 'Parque Industrial Morelia, Nave Norte'),
(@w4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '07:58:00', '17:00:00', 'Parque Industrial Morelia, Nave Norte'),
-- Hace 2 días (Roberto no asistió)
(@w1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:02:00', '17:30:00', 'Plaza Galerías, Morelia'),
(@w3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '07:35:00', '17:15:00', 'Parque Industrial Morelia, Nave Norte'),
(@w4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:00:00', '16:50:00', 'Parque Industrial Morelia, Nave Norte'),
-- Ayer
(@w1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:58:00', '16:30:00', 'Plaza Galerías, Morelia'),
(@w2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:47:00', '16:40:00', 'Plaza Galerías, Morelia'),
(@w3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:25:00', '17:05:00', 'Parque Industrial Morelia, Nave Norte'),
(@w4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:10:00', '17:20:00', 'Parque Industrial Morelia, Nave Norte'),
-- HOY (sin salida todavía; Alberto ausente)
(@w1, CURDATE(), '07:42:00', NULL, 'Plaza Galerías, Morelia'),
(@w2, CURDATE(), '07:44:00', NULL, 'Plaza Galerías, Morelia'),
(@w3, CURDATE(), '07:20:00', NULL, 'Parque Industrial Morelia, Nave Norte');

-- --------------------------------------------------------
-- 4. ASIGNACIÓN DE OBRAS (USUARIOS + OBRAS) — mismas fechas
--    Las vistas cruzan asistencia y asignación por (id_usuario, fecha).
--    Se asigna también a quien faltó: la asignación es la planeación del día.
-- --------------------------------------------------------
INSERT INTO ASIGNACION_OBRAS (id_usuario, id_obra, fecha) VALUES
(@w1, @o1, DATE_SUB(CURDATE(), INTERVAL 4 DAY)), (@w2, @o1, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(@w3, @o2, DATE_SUB(CURDATE(), INTERVAL 4 DAY)), (@w4, @o2, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(@w1, @o1, DATE_SUB(CURDATE(), INTERVAL 3 DAY)), (@w2, @o1, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(@w3, @o2, DATE_SUB(CURDATE(), INTERVAL 3 DAY)), (@w4, @o2, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(@w1, @o1, DATE_SUB(CURDATE(), INTERVAL 2 DAY)), (@w2, @o1, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(@w3, @o2, DATE_SUB(CURDATE(), INTERVAL 2 DAY)), (@w4, @o2, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(@w1, @o1, DATE_SUB(CURDATE(), INTERVAL 1 DAY)), (@w2, @o1, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(@w3, @o2, DATE_SUB(CURDATE(), INTERVAL 1 DAY)), (@w4, @o2, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(@w1, @o1, CURDATE()), (@w2, @o1, CURDATE()),
(@w3, @o2, CURDATE()), (@w4, @o2, CURDATE());

-- --------------------------------------------------------
-- 5. ASIGNACIÓN DE VEHÍCULOS (VEHICULOS + USUARIOS + OBRAS)
--    Carlos (sabe manejar) lleva la camioneta 1 a la obra 1 todos los días.
-- --------------------------------------------------------
INSERT INTO ASIGNACION_VEHICULOS (id_vehiculo, id_usuario, id_obra, fecha) VALUES
(@v1, @w1, @o1, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(@v1, @w1, @o1, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(@v1, @w1, @o1, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(@v1, @w1, @o1, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(@v1, @w1, @o1, CURDATE());

-- --------------------------------------------------------
-- 6. PRÉSTAMO DE HERRAMIENTAS (HERRAMIENTAS + OBRAS + USUARIOS)
--    Multímetro prestado a Carlos para la obra 1, aún sin devolver.
-- --------------------------------------------------------
INSERT INTO PRESTAMO_HERRAMIENTAS (id_herramienta, id_obra, id_usuario, fecha_prestamo, fecha_devolucion)
VALUES (@h1, @o1, @w1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), NULL);

-- --------------------------------------------------------
-- 7. USO DE MATERIALES (OBRAS + MATERIALES)
-- --------------------------------------------------------
INSERT INTO USO_MATERIALES (id_obra, id_material, cantidad, fecha) VALUES
(@o1, @m1, 250.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(@o1, @m3,  12.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(@o2, @m2,  30.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(@o3, @m1, 400.00, DATE_SUB(CURDATE(), INTERVAL 60 DAY));

COMMIT;

-- Verificación rápida (opcional):
-- SELECT * FROM Vista_Control_Asistencia_Admin ORDER BY fecha DESC;
-- SELECT * FROM Vista_Mis_Asignaciones;

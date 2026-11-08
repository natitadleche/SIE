const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. INICIAR SESIÓN
app.post('/api/login', (req, res) => {
    const { telefono, password } = req.body;
    const query = "SELECT id_usuario, nombre, rol FROM USUARIOS WHERE telefono = ? AND password = ?";
    
    db.query(query, [telefono, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Error interno" });
        if (results.length > 0) res.json({ success: true, user: results[0] });
        else res.status(401).json({ success: false, message: "Datos incorrectos" });
    });
});

// 2. REGISTRO TRABAJADOR
app.post('/api/registrar', (req, res) => {
    const { nombre, telefono, contacto, sabe_manejar, password } = req.body;
    const query = "CALL RegistrarTrabajador(?, ?, ?, ?, ?)";
    
    db.query(query, [nombre, telefono, contacto, sabe_manejar, password], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Error al crear cuenta" });
        res.json({ success: true, message: "Trabajador registrado exitosamente." });
    });
});

// 3. PANTALLA PRINCIPAL: ASISTENCIA Y OBRAS
app.get('/api/jefe/asistencia-obras', (req, res) => {
    // Consulta la vista que creaste en SQL que cruza asistencia con obras
    db.query("SELECT * FROM Vista_Control_Asistencia_Admin ORDER BY fecha DESC LIMIT 50", (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Error al consultar base de datos" });
        res.json({ success: true, data: results });
    });
});

// 4. VISTA PARA EL TRABAJADOR (Asignaciones)
app.get('/api/trabajador/asignaciones', (req, res) => {
    db.query("SELECT * FROM Vista_Mis_Asignaciones", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: results });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

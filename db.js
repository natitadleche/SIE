const mysql = require('mysql2');

// Conexión a la base de datos MySQL
// Se utiliza el usuario admin_app que tiene permisos de lectura/escritura y para invocar procedimientos
const pool = mysql.createPool({
    host: 'localhost',
    user: 'admin_app',
    password: 'PasswordAdmin123',
    database: 'ControlObrasSIE',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("Pool de conexión a base de datos inicializado.");

module.exports = pool;

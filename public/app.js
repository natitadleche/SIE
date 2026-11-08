function mostrarMensaje(texto, tipo) {
    const msgDiv = document.getElementById('mensaje');
    msgDiv.textContent = texto;
    msgDiv.className = 'message ' + tipo;
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.style.display = 'none', 4000);
}

// 1. INICIO DE SESIÓN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const telefono = document.getElementById('login-telefono').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, password })
    });
    const data = await res.json();

    if (data.success) {
        mostrarDashboard(data.user);
    } else {
        mostrarMensaje(data.message, 'error');
    }
});

// 2. CONFIGURAR PANEL DE CONTROL
function mostrarDashboard(user) {
    // Ocultar login
    document.getElementById('form-login').classList.remove('active');
    document.getElementById('form-login').style.display = 'none';
    
    // Mostrar dashboard ampliado
    const dashboard = document.getElementById('form-dashboard');
    dashboard.style.display = 'block';
    document.getElementById('main-container').style.maxWidth = '1000px'; 
    
    document.getElementById('dash-title').textContent = `Panel Gerencial - ${user.nombre}`;
    document.getElementById('dash-subtitle').textContent = `Nivel de Acceso: ${user.rol}`;

    const menu = document.getElementById('dash-menu');
    
    // Generar el índice solo para JefeAdmin
    if (user.rol === 'JefeAdmin') {
        menu.innerHTML = `
            <button class="btn" style="flex: 1; padding: 10px;" onclick="cambiarSeccion('principal')">🏠 Principal</button>
            <button class="btn" style="flex: 1; padding: 10px;" onclick="cambiarSeccion('personal')">👷 Personal</button>
            <button class="btn" style="flex: 1; padding: 10px;" onclick="cambiarSeccion('herramientas')">🔧 Herramientas</button>
            <button class="btn" style="flex: 1; padding: 10px;" onclick="cambiarSeccion('vehiculos')">🚗 Vehículos</button>
            <button class="btn" style="flex: 1; padding: 10px;" onclick="cambiarSeccion('clientes')">🏢 Clientes</button>
            <button class="btn" style="flex: 1; padding: 10px;" onclick="cambiarSeccion('obras')">🏗️ Obras</button>
        `;
        cambiarSeccion('principal'); // Abrir pestaña principal por defecto
    }
}

// 3. NAVEGACIÓN DEL ÍNDICE
function cambiarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-admin').forEach(el => el.style.display = 'none');
    // Mostrar la seleccionada
    document.getElementById(`sec-${seccion}`).style.display = 'block';

    // Disparar la consulta a la BD dependiendo de la pestaña
    if(seccion === 'principal') cargarPantallaPrincipal();
}

// 4. CARGAR TABLA PRINCIPAL (Asistencias y Obras)
async function cargarPantallaPrincipal() {
    const res = await fetch('/api/jefe/asistencia-obras');
    const data = await res.json();
    
    let html = '<table class="tabla-sql"><tr><th>Empleado</th><th>Fecha</th><th>Entrada</th><th>Obra Actual</th><th>Ubicación</th></tr>';
    
    if (data.data.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #666;">No hay registros de obras activas ni asistencias (NULO).</td></tr>';
    } else {
        data.data.forEach(row => {
            html += `<tr>
                <td><strong>${row.empleado}</strong></td>
                <td>${row.fecha ? row.fecha.split('T')[0] : 'N/A'}</td>
                <td>${row.hora_entrada || '--:--'}</td>
                <td>${row.obra_actual || '<span style="color:red">Sin Asignar / Nula</span>'}</td>
                <td>${row.ubicacion || 'No registrada'}</td>
            </tr>`;
        });
    }
    html += '</table>';
    document.getElementById('tabla-principal').innerHTML = html;
}

// 5. FORMULARIO DE ALTA DE PERSONAL
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nombre: document.getElementById('reg-nombre').value,
        telefono: document.getElementById('reg-telefono').value,
        contacto: document.getElementById('reg-contacto').value,
        sabe_manejar: document.getElementById('reg-manejar').checked,
        password: document.getElementById('reg-password').value
    };
    const res = await fetch('/api/registrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    
    mostrarMensaje(data.message, data.success ? 'success' : 'error');
    if(data.success) {
        document.getElementById('registerForm').reset();
    }
});

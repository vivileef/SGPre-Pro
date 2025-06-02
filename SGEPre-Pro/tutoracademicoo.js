// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    const token = new URLSearchParams(window.location.search).get('token');

    // Verificar sesión válida
    if (!token || !sessionData || token !== sessionData.auth.token || Date.now() > sessionData.auth.expires || sessionData.userData.tipoUsuario !== 'tutorAcademico') {
        sessionStorage.removeItem('uleamSession');
        location.href = 'index1.html?error=unauthorized';
        return;
    }

    // Mostrar información del usuario
    document.getElementById('nombre-tutor').textContent = 
        `${sessionData.userData.nombres} ${sessionData.userData.apellidos}`;
    document.getElementById('email-tutor').textContent = sessionData.userData.email;

    const headerElement = document.querySelector('.card h2');
    if (headerElement && !headerElement.querySelector('.user-welcome')) {
        headerElement.innerHTML += `
            <span class="user-welcome"> | Bienvenido/a ${sessionData.userData.nombres}</span>
        `;
    }


    // Configurar botones
    document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
    document.getElementById('cargar-asignaciones-btn').addEventListener('click', cargarDatosTutorAcademico);

    // Temporizador de expiración de sesión
    const sessionTimer = setInterval(() => {
        if (Date.now() > sessionData.auth.expires) {
            clearInterval(sessionTimer);
            cerrarSesion();
        }
    }, 60000);

    // Cargar datos iniciales
    cargarDatosTutorAcademico();
});

function cerrarSesion() {
    sessionStorage.removeItem('uleamSession');
    location.href = 'index1.html?logout=success';
}

function cargarDatosTutorAcademico() {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    const tutorId = sessionData.userData.id;
    const asignaciones = JSON.parse(localStorage.getItem('asignacionesEstudiantes')) || [];
    const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios')) || [];
    
    const misAsignaciones = asignaciones.filter(a => a.tutorAcademicoId === tutorId);

    // Actualizar estadísticas
    document.querySelectorAll('.stat-number').forEach((el, i) => {
        el.textContent = [
            misAsignaciones.length,
            misAsignaciones.length > 0 ? 1 : 0,
            Math.floor(Math.random() * 5)
        ][i] || Math.floor(Math.random() * 10);
    });

    // Renderizar asignaciones
    const contenedor = document.getElementById('mis-asignaciones');
    if (!misAsignaciones.length) {
        contenedor.innerHTML = `
            <div class="mensaje-info">
                <p>📋 Aún no tienes estudiantes asignados. Contacta al coordinador académico.</p>
            </div>
        `;
        return;
    }

    const coordinador = usuarios.find(u => u.tipoUsuario === 'coordinador');
    contenedor.innerHTML = `
        <div class="asignaciones-container">
            <h4>Mis Estudiantes Asignados (${misAsignaciones.length})</h4>
            ${misAsignaciones.map((asig, idx) => {
                const estudiante = usuarios.find(u => u.id === asig.estudianteId);
                const tutorEmp = usuarios.find(u => u.id === asig.tutorEmpresarialId);

                return estudiante && tutorEmp ? `
                        <div class="personas-grid">
                            <div class="persona-info estudiante-info">
                                <h6>👨‍🎓 Estudiante</h6>
                                <p><strong>Nombre:</strong> ${estudiante.nombres} ${estudiante.apellidos}</p>
                                <p><strong>Email:</strong> ${estudiante.email}</p>
                                ${estudiante.telefono ? `<p><strong>Teléfono:</strong> ${estudiante.telefono}</p>` : ''}
                                ${estudiante.carrera ? `<p><strong>Carrera:</strong> ${estudiante.carrera}</p>` : ''}
                            </div>

                            <div class="persona-info tutor-empresarial-info">
                                <h6>🏢 Tutor Empresarial</h6>
                                <p><strong>Nombre:</strong> ${tutorEmp.nombres} ${tutorEmp.apellidos}</p>
                                <p><strong>Email:</strong> ${tutorEmp.email}</p>
                                ${tutorEmp.telefono ? `<p><strong>Teléfono:</strong> ${tutorEmp.telefono}</p>` : ''}
                                ${tutorEmp.empresa ? `<p><strong>Empresa:</strong> ${tutorEmp.empresa}</p>` : ''}
                            </div>

                            ${coordinador ? `
                            <div class="persona-info coordinador-info">
                                <h6>👨‍💼 Coordinador Académico</h6>
                                <p><strong>Nombre:</strong> ${coordinador.nombres} ${coordinador.apellidos}</p>
                                <p><strong>Email:</strong> ${coordinador.email}</p>
                                ${coordinador.telefono ? `<p><strong>Teléfono:</strong> ${coordinador.telefono}</p>` : ''}
                            </div>` : ''}
                        </div>
                    </div>
                ` : '';
            }).join('')}
        </div>
    `;
}


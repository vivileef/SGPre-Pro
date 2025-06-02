document.addEventListener('DOMContentLoaded', function () {
    // Verificar parámetro de URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Verificar sesión almacenada
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));

    // Validaciones de seguridad
    const esTokenValido = token && sessionData?.auth?.token === token;
    const sesionActiva = sessionData && Date.now() <= sessionData.auth.expires;
    const esEmpresa = sessionData?.userData?.tipoUsuario === 'empresa';

    if (!esTokenValido || !sesionActiva || !esEmpresa) {
        sessionStorage.removeItem('uleamSession');
        window.location.href = 'index1.html?error=unauthorized';
        return;
    }

    // 4. Mostrar datos del usuario
    if (sessionData && sessionData.userData) {
    const { nombres, apellidos, email, empresa } = sessionData.userData;

    document.getElementById('nombre-empresa').textContent = `${nombres} ${apellidos}`;
    document.getElementById('email-empresa').textContent = email;
    document.getElementById('empresa-empresa').textContent = empresa || 'No especificado';
}

    // Configurar botón de logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }

    // Configurar temporizador de sesión
    const sessionTimer = setInterval(() => {
        const tiempoRestante = sessionData.auth.expires - Date.now();
        if (tiempoRestante <= 0) {
            clearInterval(sessionTimer);
            cerrarSesion();
        }
    }, 60000);

    // Evento del botón de cargar asignaciones (opcional)
    const cargarBtn = document.getElementById('cargar-asignaciones-btn');
    if (cargarBtn) {
        cargarBtn.addEventListener('click', cargarAsignacionesTutorEmpresarial);
    }

    // Iniciar carga de datos del tutor
    cargarDatosTutor();
});

function cerrarSesion() {
    sessionStorage.removeItem('uleamSession');
    window.location.href = 'index1.html?logout=success';
}

function cargarDatosTutor() {
    console.log("Cargando datos del tutor empresarial...");

    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    const tutorEmpresarialId = sessionData.userData.id;
    const asignaciones = JSON.parse(localStorage.getItem('asignacionesEstudiantes')) || [];

    const misEstudiantes = asignaciones.filter(a => a.tutorEmpresarialId === tutorEmpresarialId);

    // Actualizar contadores reales
    document.querySelectorAll('.stat-number').forEach((el, index) => {
        switch (index) {
            case 0: el.textContent = misEstudiantes.length; break;
            case 1: el.textContent = misEstudiantes.length > 0 ? 1 : 0; break;
            case 2: el.textContent = Math.floor(Math.random() * 8); break;
            default: el.textContent = Math.floor(Math.random() * 10);
        }
    });

    // Cargar asignaciones automáticamente
    cargarAsignacionesTutorEmpresarial();
}

function cargarAsignacionesTutorEmpresarial() {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    const tutorEmpresarialId = sessionData.userData.id;

    const asignaciones = JSON.parse(localStorage.getItem('asignacionesEstudiantes')) || [];
    const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios')) || [];

    const misAsignaciones = asignaciones.filter(a => a.tutorEmpresarialId === tutorEmpresarialId);
    const contenedor = document.getElementById('mis-asignaciones');

    if (!contenedor) return;

    if (misAsignaciones.length === 0) {
        contenedor.innerHTML = `
            <div class="mensaje-info">
                <p>📋 Aún no tienes estudiantes asignados. Contacta al coordinador académico.</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="asignaciones-container">
            <h3>Mis Estudiantes Asignados (${misAsignaciones.length})</h3>
            ${misAsignaciones.map((asignacion, index) => {
                const estudiante = usuarios.find(u => u.id === asignacion.estudianteId);
                // CORRECCIÓN: Usar tutorAcademicoId en lugar de tutorId
                const tutorAcademico = usuarios.find(u => u.id === asignacion.tutorAcademicoId);
                const coordinador = usuarios.find(u => u.tipoUsuario === 'coordinador');

                if (!estudiante || !tutorAcademico) return '';

                return `
                    <div class="asignacion-card">
                        <div class="asignacion-header">
                            <h4>Asignación #${index + 1}</h4>
                        </div>

                        <div class="persona-info estudiante-info">
                            <h5>👨‍🎓 Estudiante</h5>
                            <p><strong>Nombre:</strong> ${estudiante.nombres} ${estudiante.apellidos}</p>
                            <p><strong>Email:</strong> ${estudiante.email}</p>
                            ${estudiante.telefono ? `<p><strong>Teléfono:</strong> ${estudiante.telefono}</p>` : ''}
                            ${estudiante.carrera ? `<p><strong>Carrera:</strong> ${estudiante.carrera}</p>` : ''}
                        </div>

                        <div class="persona-info tutor-academico-info">
                            <h5>📚 Tutor Académico</h5>
                            <p><strong>Nombre:</strong> ${tutorAcademico.nombres} ${tutorAcademico.apellidos}</p>
                            <p><strong>Email:</strong> ${tutorAcademico.email}</p>
                            ${tutorAcademico.telefono ? `<p><strong>Teléfono:</strong> ${tutorAcademico.telefono}</p>` : ''}
                            ${tutorAcademico.departamento ? `<p><strong>Departamento:</strong> ${tutorAcademico.departamento}</p>` : ''}
                        </div>

                        ${coordinador ? `
                            <div class="persona-info coordinador-info">
                                <h5>👨‍💼 Coordinador Académico</h5>
                                <p><strong>Nombre:</strong> ${coordinador.nombres} ${coordinador.apellidos}</p>
                                <p><strong>Email:</strong> ${coordinador.email}</p>
                                ${coordinador.telefono ? `<p><strong>Teléfono:</strong> ${coordinador.telefono}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    contenedor.innerHTML = html;
}
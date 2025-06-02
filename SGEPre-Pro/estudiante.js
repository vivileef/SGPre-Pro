document.addEventListener('DOMContentLoaded', function() {
    // Verificar parámetro de URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Verificar sesión almacenada
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));

    // Validaciones de seguridad
    if (!token || !sessionData || 
        token !== sessionData.auth.token || 
        Date.now() > sessionData.auth.expires ||
        sessionData.userData.tipoUsuario !== 'estudiante') {

        sessionStorage.removeItem('uleamSession');
        window.location.href = 'index1.html?error=unauthorized';
        return;
    }

    // Inicializar dashboard
    inicializarDashboard();
    configurarBotonCerrarSesion();
    cargarInformacionTutores();
    cargarTareasYActualizarEstadisticas();
    cargarActividadesRecientes();
    configurarBotonesAccion();
    
    // Temporizador de sesión
    const sessionTimer = setInterval(() => {
        const remainingTime = Math.ceil((sessionData.auth.expires - Date.now()) / 60000);
        if (remainingTime <= 0) {
            clearInterval(sessionTimer);
            cerrarSesion();
        } else {
            console.log(`Sesión activa: ${remainingTime} minutos restantes`);
        }
    }, 60000);

    setInterval(actualizarInformacion, 30000);
});

function inicializarDashboard() {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    if (!sessionData) return;

    // Mostrar información del usuario
    document.getElementById('nombre-estudiante').textContent = 
        `${sessionData.userData.nombres} ${sessionData.userData.apellidos}`;
    document.getElementById('email-estudiante').textContent = sessionData.userData.email;

    // Añadir mensaje de bienvenida al encabezado
    const headerElement = document.querySelector('.card h2');
    if (headerElement && !headerElement.querySelector('.user-welcome')) {
        headerElement.innerHTML += `
            <span class="user-welcome"> | Bienvenido/a ${sessionData.userData.nombres}</span>
        `;
    }

    mostrarEstadisticasIniciales();
}

function mostrarEstadisticasIniciales() {
    document.getElementById('practicas-activas').textContent = '1';
    
    // Verificar si existe el elemento tareas-completadas
    const tareasCompletadasElement = document.getElementById('tareas-completadas');
    if (tareasCompletadasElement) {
        tareasCompletadasElement.textContent = '0';
    }
    
    // Inicializar progreso
    actualizarProgreso(0, 240);
}

function cargarInformacionTutores() {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    if (!sessionData || !sessionData.userData) return;

    const asignaciones = JSON.parse(localStorage.getItem('asignacionesEstudiantes')) || [];
    const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios')) || [];

    const estudianteId = sessionData.userData.id.toString();
    const asignacion = asignaciones.find(a => a.estudianteId.toString() === estudianteId);

    const tutorAcademicoDiv = document.getElementById('tutor-academico-info');
    const tutorEmpresarialDiv = document.getElementById('tutor-empresarial-info');

    if (asignacion) {
        const tutorAcademico = usuarios.find(u => u.id.toString() === asignacion.tutorAcademicoId?.toString());
        if (tutorAcademico && tutorAcademicoDiv) {
            const facultad = tutorAcademico.facultad?.trim() || 'No especificada';
            tutorAcademicoDiv.innerHTML = `
                <div class="tutor-info-content">
                    <p><strong>Nombre:</strong> ${tutorAcademico.nombres} ${tutorAcademico.apellidos}</p>
                    <p><strong>Facultad:</strong> ${facultad}</p>
                    <p><strong>Email:</strong> <a href="mailto:${tutorAcademico.email}">${tutorAcademico.email}</a></p>
                </div>
            `;
            tutorAcademicoDiv.classList.remove('no-asignado');
        }

        // Cargar tutor empresarial
        const tutorEmpresarial = usuarios.find(u => u.id.toString() === asignacion.tutorEmpresarialId?.toString());
        if (tutorEmpresarial && tutorEmpresarialDiv) {
            const empresa = tutorEmpresarial.empresa?.trim() || 'No especificada';
            tutorEmpresarialDiv.innerHTML = `
                <div class="tutor-info-content">
                    <p><strong>Nombre:</strong> ${tutorEmpresarial.nombres} ${tutorEmpresarial.apellidos}</p>
                    <p><strong>Empresa:</strong> ${empresa}</p>
                    <p><strong>Email:</strong> <a href="mailto:${tutorEmpresarial.email}">${tutorEmpresarial.email}</a></p>
                </div>
            `;
            tutorEmpresarialDiv.classList.remove('no-asignado');
            
            const empresaAsignadaElement = document.getElementById('empresa-asignada');
            if (empresaAsignadaElement) {
                empresaAsignadaElement.textContent = `Empresa: ${empresa}`;
            }
        }
    } else {
        if (tutorAcademicoDiv) {
            tutorAcademicoDiv.innerHTML = '<p class="no-asignado">No tienes tutor académico asignado aún</p>';
        }
        if (tutorEmpresarialDiv) {
            tutorEmpresarialDiv.innerHTML = '<p class="no-asignado">No tienes tutor empresarial asignado aún</p>';
        }
        
        const empresaAsignadaElement = document.getElementById('empresa-asignada');
        if (empresaAsignadaElement) {
            empresaAsignadaElement.textContent = 'Empresa: No asignada';
        }
    }
}

function cargarTareasYActualizarEstadisticas() {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    const tareas = JSON.parse(localStorage.getItem('tareasAsignadas')) || [];
    const estudianteId = sessionData.userData.id;

    const tareasEstudiante = tareas.filter(t => t.estudianteId === estudianteId);

    const listaTareasEmpresarial = document.getElementById('tareas-tutor-empresarial');
    if (listaTareasEmpresarial) {
        const tareasEmpresariales = tareasEstudiante.filter(t => t.tipo === 'empresarial' || !t.tipo);
        
        if (tareasEmpresariales.length > 0) {
            listaTareasEmpresarial.innerHTML = '';
            tareasEmpresariales.forEach(tarea => {
                const div = document.createElement('div');
                div.classList.add('tarea-item');
                const estadoClass = tarea.completada ? 'completada' : 'pendiente';
                div.innerHTML = `
                    <div class="tarea-titulo">${tarea.titulo}</div>
                    <div class="tarea-detalle">${tarea.descripcion || 'Sin descripción'}</div>
                    <div class="tarea-estado ${estadoClass}">${tarea.completada ? 'Completada' : 'Pendiente'}</div>
                `;
                listaTareasEmpresarial.appendChild(div);
            });
        } else {
            listaTareasEmpresarial.innerHTML = '<p class="no-tareas">No tienes tareas pendientes por el momento.</p>';
        }
    }

    const tareasCompletadas = tareasEstudiante.filter(t => t.completada).length;
    const horasTotales = tareasEstudiante.filter(t => t.completada).reduce((acc, t) => acc + (t.horasAsignadas || 0), 0);

    const tareasCompletadasElement = document.getElementById('tareas-completadas');
    if (tareasCompletadasElement) {
        tareasCompletadasElement.textContent = tareasCompletadas.toString();
    }

    actualizarProgreso(horasTotales, 240); // 240 horas totales requeridas
}

function cargarActividadesRecientes() {
    const actividadesLista = document.getElementById('actividades-lista');
    if (!actividadesLista) return;

    const actividades = [
        {
            fecha: obtenerFechaFormateada(new Date()),
            descripcion: "Inicio de sesión en el sistema"
        },
        {
            fecha: obtenerFechaFormateada(new Date(Date.now() - 86400000)), // Ayer
            descripcion: "Asignación de tutor empresarial"
        },
        {
            fecha: obtenerFechaFormateada(new Date(Date.now() - 172800000)), // Hace 2 días
            descripcion: "Registro en el sistema de prácticas pre-profesionales"
        }
    ];

    actividadesLista.innerHTML = '';
    actividades.forEach(actividad => {
        const div = document.createElement('div');
        div.classList.add('actividad-item');
        div.innerHTML = `
            <div class="actividad-fecha">${actividad.fecha}</div>
            <div class="actividad-desc">${actividad.descripcion}</div>
        `;
        actividadesLista.appendChild(div);
    });
}

function actualizarProgreso(horasCompletadas, horasTotales) {
    const porcentaje = horasTotales > 0 ? Math.round((horasCompletadas / horasTotales) * 100) : 0;
    
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${porcentaje}%`;
    }
    
    const horasCompletadasElement = document.getElementById('horas-completadas');
    if (horasCompletadasElement) {
        horasCompletadasElement.textContent = `Horas: ${horasCompletadas}/${horasTotales}`;
    }
    
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
        const degrees = (porcentaje / 100) * 360;
        progressCircle.style.background = `conic-gradient(#0284c7 ${degrees}deg, #e2e8f0 ${degrees}deg)`;
    }
}

function configurarBotonCerrarSesion() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
            if (confirmar) {
                cerrarSesion();
            }
        });
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('uleamSession');
    
    alert("Sesión cerrada correctamente. Hasta pronto!");
    
    window.location.href = 'index1.html';
}

function actualizarInformacion() {
    cargarInformacionTutores();
    cargarTareasYActualizarEstadisticas();
    cargarActividadesRecientes();
}

function obtenerFechaFormateada(fecha) {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
}

function validarSesion() {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
    if (!sessionData || Date.now() > sessionData.auth.expires) {
        alert("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
        cerrarSesion();
        return false;
    }
    return true;
}

window.addEventListener('error', function(e) {
    console.error('Error en el sistema:', e.error);
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));
        if (!sessionData) {
            window.location.href = 'index1.html';
        }
    }
});
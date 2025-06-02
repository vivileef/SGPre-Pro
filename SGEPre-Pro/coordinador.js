document.addEventListener('DOMContentLoaded', function () {
    const sessionData = JSON.parse(sessionStorage.getItem('uleamSession'));

    if (!sessionData || !sessionData.userData || sessionData.userData.tipoUsuario !== 'coordinador') {
        alert('Sesión no válida o no autorizada. Inicie sesión nuevamente.');
        sessionStorage.removeItem('uleamSession');
        window.location.href = 'index1.html?error=unauthorized';
        return;
    }

    const userData = sessionData.userData;

    const nombreEl = document.getElementById('nombre-coordinador');
    const apellidoEl = document.getElementById('apellido-coordinador');
    const correoEl = document.getElementById('correo-coordinador');
    const facultadEl = document.getElementById('facultad-coordinador');

    if (nombreEl) nombreEl.textContent = userData.nombres || 'Sin nombre';
    if (apellidoEl) apellidoEl.textContent = userData.apellidos || 'Sin apellido';
    if (correoEl) correoEl.textContent = userData.email || userData.correo || 'Sin correo';
    if (facultadEl) facultadEl.textContent = userData.facultad || userData['Facultad/Departamento'] || 'Sin facultad';

    
// Agregar saludo al encabezado
const headerElement = document.querySelector('.card h2');
if (headerElement && userData.nombres) {
    headerElement.innerHTML = `Panel de Coordinador Académico | Bienvenido/a ${userData.nombres}`;
}

    function obtenerAsignaciones() {
        try {
            const asignaciones = JSON.parse(localStorage.getItem('asignacionesEstudiantes')) || [];
            console.log('Asignaciones obtenidas:', asignaciones);
            return asignaciones;
        } catch (error) {
            console.error('Error al obtener asignaciones:', error);
            return [];
        }
    }

    function obtenerUsuarios() {
        try {
            const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios')) || [];
            console.log('Usuarios obtenidos:', usuarios.length);
            return usuarios;
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    }

    function limpiarAsignacionesHuerfanas() {
        const usuarios = obtenerUsuarios();
        let asignaciones = obtenerAsignaciones();
        const asignacionesValidas = [];

        if (asignaciones.length === 0) {
            console.log('No hay asignaciones para limpiar');
            return false;
        }

        asignaciones.forEach((asig, index) => {
            const estudiante = usuarios.find(u => u.id === asig.estudianteId);
            const tutorAcademico = usuarios.find(u => u.id === asig.tutorAcademicoId);
            const tutorEmpresarial = usuarios.find(u => u.id === asig.tutorEmpresarialId);

            if (estudiante && tutorAcademico && tutorEmpresarial) {
                asignacionesValidas.push(asig);
            } else {
                console.warn('Asignación huérfana eliminada en índice:', index, {
                    estudianteId: asig.estudianteId,
                    tutorAcademicoId: asig.tutorAcademicoId, 
                    tutorEmpresarialId: asig.tutorEmpresarialId,
                    estudianteExiste: !!estudiante,
                    tutorAcademicoExiste: !!tutorAcademico,
                    tutorEmpresarialExiste: !!tutorEmpresarial
                });
            }
        });

        if (asignacionesValidas.length !== asignaciones.length) {
            localStorage.setItem('asignacionesEstudiantes', JSON.stringify(asignacionesValidas));
            console.log(`Se eliminaron ${asignaciones.length - asignacionesValidas.length} asignaciones huérfanas`);
            return true; 
        }
        return false; 
    }

    // Actualizar estadísticas
    function actualizarEstadisticas() {
        const usuarios = obtenerUsuarios();
        const asignaciones = obtenerAsignaciones();

        const estudiantes = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'estudiante');
        const tutoresAcademicos = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'tutoracademico');
        const tutoresEmpresariales = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'empresa');

        // Actualizar contadores
        const totalEstudiantesEl = document.getElementById('total-estudiantes');
        const practicasActivasEl = document.getElementById('practicas-activas');
        const tutoresAcademicosEl = document.getElementById('tutores-academicos');
        const tutoresEmpresarialesEl = document.getElementById('tutores-empresariales');

        if (totalEstudiantesEl) totalEstudiantesEl.textContent = estudiantes.length;
        if (practicasActivasEl) practicasActivasEl.textContent = asignaciones.length;
        if (tutoresAcademicosEl) tutoresAcademicosEl.textContent = tutoresAcademicos.length;
        if (tutoresEmpresarialesEl) tutoresEmpresarialesEl.textContent = tutoresEmpresariales.length;

        console.log('Estadísticas actualizadas:', {
            estudiantes: estudiantes.length,
            asignaciones: asignaciones.length,
            tutoresAcademicos: tutoresAcademicos.length,
            tutoresEmpresariales: tutoresEmpresariales.length
        });
    }

    function cargarUsuarios() {
        const usuarios = obtenerUsuarios();
    
        if (!usuarios || usuarios.length === 0) {
            console.warn('No hay usuarios registrados en el sistema.');
            return;
        }

        const seEliminaron = limpiarAsignacionesHuerfanas();
        if (seEliminaron) {
            console.log('Se limpiaron asignaciones con usuarios inexistentes');
        }

        const estudiantes = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'estudiante');
        const tutoresAcademicos = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'tutoracademico');
        const tutoresEmpresariales = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'empresa');

        console.log('Usuarios filtrados:', {
            estudiantes: estudiantes.length,
            tutoresAcademicos: tutoresAcademicos.length,
            tutoresEmpresariales: tutoresEmpresariales.length
        });

        const estudianteSelect = document.getElementById('estudiante-select');
        const tutorSelect = document.getElementById('tutor-select');
        const tutorEmpresarialSelect = document.getElementById('tutor-empresarial-select');

        if (estudianteSelect) {
            estudianteSelect.innerHTML = '<option value="">Seleccione un estudiante</option>';
            estudiantes.forEach(est => {
                const option = document.createElement('option');
                option.value = est.id;
                option.textContent = `${est.nombres || 'Sin nombre'} ${est.apellidos || 'Sin apellido'}`;
                estudianteSelect.appendChild(option);
            });
        }

        if (tutorSelect) {
            tutorSelect.innerHTML = '<option value="">Seleccione un tutor académico</option>';
            tutoresAcademicos.forEach(tutor => {
                const option = document.createElement('option');
                option.value = tutor.id;
                option.textContent = `${tutor.nombres || 'Sin nombre'} ${tutor.apellidos || 'Sin apellido'}`;
                tutorSelect.appendChild(option);
            });
        }

        if (tutorEmpresarialSelect) {
            tutorEmpresarialSelect.innerHTML = '<option value="">Seleccione un tutor empresarial</option>';
            tutoresEmpresariales.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.nombres || 'Sin nombre'} ${emp.apellidos || 'Sin apellido'}`;
                tutorEmpresarialSelect.appendChild(option);
            });
        }

        actualizarEstadisticas();
        renderAsignaciones();
    }

    function validarUsuario(userId, tipoEsperado) {
        const usuarios = obtenerUsuarios();
        const usuario = usuarios.find(u => u.id === userId);
        
        if (!usuario) {
            return { valido: false, mensaje: `Usuario con ID ${userId} no encontrado` };
        }
        
        if (tipoEsperado && usuario.tipoUsuario?.toLowerCase() !== tipoEsperado.toLowerCase()) {
            return { 
                valido: false, 
                mensaje: `Usuario ${usuario.nombres} ${usuario.apellidos} no es del tipo ${tipoEsperado}` 
            };
        }
        
        return { valido: true, usuario: usuario };
    }

    function asignarTutores() {
        const estudianteSelect = document.getElementById('estudiante-select');
        const tutorSelect = document.getElementById('tutor-select');
        const tutorEmpresarialSelect = document.getElementById('tutor-empresarial-select');

        if (!estudianteSelect || !tutorSelect || !tutorEmpresarialSelect) {
            alert('Error: No se pudieron encontrar los elementos del formulario.');
            return;
        }

        const estudianteId = estudianteSelect.value;
        const tutorAcademicoId = tutorSelect.value;
        const tutorEmpresarialId = tutorEmpresarialSelect.value;

        if (!estudianteId || !tutorAcademicoId || !tutorEmpresarialId) {
            alert('Debe seleccionar un estudiante y ambos tutores.');
            return;
        }

        const validacionEstudiante = validarUsuario(estudianteId, 'estudiante');
        const validacionTutorAcademico = validarUsuario(tutorAcademicoId, 'tutoracademico');
        const validacionTutorEmpresarial = validarUsuario(tutorEmpresarialId, 'empresa');

        if (!validacionEstudiante.valido) {
            alert('Error: ' + validacionEstudiante.mensaje);
            return;
        }
        if (!validacionTutorAcademico.valido) {
            alert('Error: ' + validacionTutorAcademico.mensaje);
            return;
        }
        if (!validacionTutorEmpresarial.valido) {
            alert('Error: ' + validacionTutorEmpresarial.mensaje);
            return;
        }

        let asignaciones = obtenerAsignaciones();

        const existente = asignaciones.find(a => a.estudianteId === estudianteId);
        if (existente) {
            if (confirm('Este estudiante ya tiene tutores asignados. ¿Desea reemplazarlos?')) {
                existente.tutorAcademicoId = tutorAcademicoId;
                existente.tutorEmpresarialId = tutorEmpresarialId;
                existente.fechaModificacion = new Date().toISOString();
            } else {
                return;
            }
        } else {
            asignaciones.push({ 
                estudianteId, 
                tutorAcademicoId, 
                tutorEmpresarialId,
                fechaAsignacion: new Date().toISOString()
            });
        }

        try {
            localStorage.setItem('asignacionesEstudiantes', JSON.stringify(asignaciones));
            alert('Asignación guardada correctamente.');
            renderAsignaciones();
            actualizarEstadisticas();

            // Limpiar selecciones
            estudianteSelect.value = '';
            tutorSelect.value = '';
            tutorEmpresarialSelect.value = '';
        } catch (error) {
            console.error('Error al guardar asignación:', error);
            alert('Error al guardar la asignación.');
        }
    }

    function renderAsignaciones() {
        console.log('Iniciando renderización de asignaciones...');
        
        const usuarios = obtenerUsuarios();
        const asignaciones = obtenerAsignaciones();
        const lista = document.getElementById('asignaciones-list');
        
        if (!lista) {
            console.error('Elemento de lista de asignaciones no encontrado');
            return;
        }

        lista.innerHTML = '';

        console.log('Datos para renderizar:', {
            totalUsuarios: usuarios.length,
            totalAsignaciones: asignaciones.length
        });

        if (!asignaciones || asignaciones.length === 0) {
            lista.innerHTML = '<li class="no-asignaciones">No hay asignaciones registradas.</li>';
            console.log('No hay asignaciones para mostrar');
            return;
        }

        let asignacionesValidas = 0;
        let asignacionesInvalidas = 0;

        asignaciones.forEach((asig, index) => {
            console.log(`Procesando asignación ${index + 1}:`, asig);
            
            const est = usuarios.find(u => u.id === asig.estudianteId);
            const tutor = usuarios.find(u => u.id === asig.tutorAcademicoId);
            const emp = usuarios.find(u => u.id === asig.tutorEmpresarialId);

            const li = document.createElement('li');
            li.className = 'asignacion-item';
            
            if (est && tutor && emp) {
                // Asignación válida
                asignacionesValidas++;
                li.innerHTML = `
                    <div class="asignacion-content">
                        <div class="asignacion-info">
                            <p><strong>Estudiante:</strong> ${est.nombres || 'Sin nombre'} ${est.apellidos || 'Sin apellido'}</p>
                            <p><strong>Tutor Académico:</strong> ${tutor.nombres || 'Sin nombre'} ${tutor.apellidos || 'Sin apellido'}</p>
                            <p><strong>Tutor Empresarial:</strong> ${emp.nombres || 'Sin nombre'} ${emp.apellidos || 'Sin apellido'}</p>
                            <p class="fecha-asignacion"><small>Asignado: ${asig.fechaAsignacion ? new Date(asig.fechaAsignacion).toLocaleDateString('es-ES') : 'Fecha no disponible'}</small></p>
                        </div>
                        <div class="asignacion-acciones">
                            <button onclick="eliminarAsignacion(${index})" class="btn-delete" type="button">Eliminar</button>
                        </div>
                    </div>
                `;
                console.log(`Asignación ${index + 1} es válida`);
            } else {
                // Asignación con problemas
                asignacionesInvalidas++;
                li.innerHTML = `
                    <div class="asignacion-content error">
                        <div class="asignacion-info">
                            <p><strong>⚠️ Asignación con problemas:</strong></p>
                            <p><small>Estudiante: ${est ? `${est.nombres} ${est.apellidos}` : 'No encontrado'}</small></p>
                            <p><small>Tutor Académico: ${tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'No encontrado'}</small></p>
                            <p><small>Tutor Empresarial: ${emp ? `${emp.nombres} ${emp.apellidos}` : 'No encontrado'}</small></p>
                        </div>
                        <div class="asignacion-acciones">
                            <button onclick="eliminarAsignacion(${index})" class="btn-delete" type="button">Eliminar</button>
                        </div>
                    </div>
                `;
                console.warn(`Asignación ${index + 1} tiene problemas:`, {
                    estudianteEncontrado: !!est,
                    tutorAcademicoEncontrado: !!tutor,
                    tutorEmpresarialEncontrado: !!emp
                });
            }
            lista.appendChild(li);
        });

        console.log(`Renderización completada: ${asignacionesValidas} válidas, ${asignacionesInvalidas} inválidas`);
    }

    window.eliminarAsignacion = function(index) {
        console.log('Eliminando asignación en índice:', index);
        
        if (confirm('¿Desea eliminar esta asignación?')) {
            try {
                let asignaciones = obtenerAsignaciones();
                
                if (index >= 0 && index < asignaciones.length) {
                    const asignacionEliminada = asignaciones.splice(index, 1)[0];
                    localStorage.setItem('asignacionesEstudiantes', JSON.stringify(asignaciones));
                    
                    console.log('Asignación eliminada:', asignacionEliminada);
                    
                    renderAsignaciones();
                    actualizarEstadisticas();
                    alert('Asignación eliminada correctamente.');
                } else {
                    alert('Error: Índice de asignación inválido.');
                    console.error('Índice inválido:', index, 'Total asignaciones:', asignaciones.length);
                }
            } catch (error) {
                console.error('Error al eliminar asignación:', error);
                alert('Error al eliminar la asignación.');
            }
        }
    };

    function limpiarAsignacionesProblematicas() {
        const eliminadas = limpiarAsignacionesHuerfanas();
        if (eliminadas) {
            alert('Se eliminaron asignaciones con usuarios inexistentes.');
            renderAsignaciones();
            actualizarEstadisticas();
        } else {
            alert('No se encontraron asignaciones problemáticas.');
        }
    }

    function guardarTodo() {
        try {
            limpiarAsignacionesHuerfanas();
            const asignaciones = obtenerAsignaciones();
            localStorage.setItem('asignacionesEstudiantes', JSON.stringify(asignaciones));
            alert('Todos los datos han sido guardados correctamente.');
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar los datos: ' + error.message);
        }
    }

    function crearAsignacionesPrueba() {
        const usuarios = obtenerUsuarios();
        const estudiantes = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'estudiante');
        const tutoresAcademicos = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'tutoracademico');
        const tutoresEmpresariales = usuarios.filter(u => u.tipoUsuario?.toLowerCase() === 'empresa');

        if (estudiantes.length === 0 || tutoresAcademicos.length === 0 || tutoresEmpresariales.length === 0) {
            alert('No hay suficientes usuarios para crear asignaciones de prueba.');
            return;
        }

        const asignacionesPrueba = [];
        const cantidadPrueba = Math.min(3, estudiantes.length, tutoresAcademicos.length, tutoresEmpresariales.length);

        for (let i = 0; i < cantidadPrueba; i++) {
            asignacionesPrueba.push({
                estudianteId: estudiantes[i].id,
                tutorAcademicoId: tutoresAcademicos[i % tutoresAcademicos.length].id,
                tutorEmpresarialId: tutoresEmpresariales[i % tutoresEmpresariales.length].id,
                fechaAsignacion: new Date().toISOString()
            });
        }

        localStorage.setItem('asignacionesEstudiantes', JSON.stringify(asignacionesPrueba));
        console.log('Asignaciones de prueba creadas:', asignacionesPrueba);
        
        renderAsignaciones();
        actualizarEstadisticas();
        alert(`Se crearon ${cantidadPrueba} asignaciones de prueba.`);
    }
    const cargarBtn = document.getElementById('cargar-btn');
    if (cargarBtn) {
        cargarBtn.addEventListener('click', function() {
            cargarUsuarios();
            alert('Listados cargados correctamente.');
        });
    }

    const asignarBtn = document.getElementById('asignar-btn');
    if (asignarBtn) {
        asignarBtn.addEventListener('click', asignarTutores);
    }

    const guardarBtn = document.getElementById('guardar-btn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarTodo);
    }


    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                sessionStorage.removeItem('uleamSession');
                window.location.href = 'index1.html?logout=success';
            }
        });
    }

    console.log('Inicializando coordinador...');
    cargarUsuarios();
    
    setTimeout(() => {
        renderAsignaciones();
        actualizarEstadisticas();
        console.log('Inicialización completada');
    }, 100);
});
const Validador = (() => {
    function mostrarError(elemento, mensaje) {
        let errorSpan = elemento.parentNode.querySelector('.error-message');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-message';
            elemento.parentNode.appendChild(errorSpan);
        }
        
        errorSpan.textContent = mensaje;
        errorSpan.style.color = '#e74c3c';
        errorSpan.style.fontSize = '12px';
        errorSpan.style.display = 'block';
        errorSpan.style.marginTop = '5px';
        
        elemento.style.borderColor = '#e74c3c';
        elemento.style.backgroundColor = '#ffeaea';
    }

    function limpiarErrores(form) {
        const errorMessages = form.querySelectorAll('.error-message');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        errorMessages.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        inputs.forEach(input => {
            input.style.borderColor = '#ddd';
            input.style.backgroundColor = 'white';
        });
    }

    // Función para validar email único
    function validarEmailUnico(email, excluirId = null) {
        const todosLosUsuarios = JSON.parse(localStorage.getItem('todosLosUsuarios') || '[]');
        return !todosLosUsuarios.some(usuario => 
            usuario.email === email && usuario.id !== excluirId
        );
    }

    // Función para validar identificación única
    function validarIdentificacionUnica(identificacion, excluirId = null) {
        const todosLosUsuarios = JSON.parse(localStorage.getItem('todosLosUsuarios') || '[]');
        return !todosLosUsuarios.some(usuario => 
            usuario.identificacion === identificacion && usuario.id !== excluirId
        );
    }

    // Función principal de validación y guardado
    function guardarRegistro(event, tipo) {
        event.preventDefault();
        const form = event.target;
        limpiarErrores(form);

        const elementos = form.querySelectorAll('input[required], select[required]');
        let valido = true;

        for (let element of elementos) {
            const value = element.value.trim();
            const name = element.name;
            const type = element.type;

            if (!value) {
                mostrarError(element, 'Este campo es obligatorio.');
                valido = false;
                continue;
            }

            if ((type === 'text' || type === 'password') && element.value !== value) {
                mostrarError(element, 'No debe haber espacios al inicio o al final.');
                valido = false;
                continue;
            }

            switch (name) {
                case 'nombres':
                case 'apellidos':
                    if (!/^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]+$/.test(value)) {
                        mostrarError(element, 'Solo se permiten letras y espacios.');
                        valido = false;
                    } else if (value.length < 2) {
                        mostrarError(element, 'Mínimo 2 caracteres.');
                        valido = false;
                    } else if (value.length > 50) {
                        mostrarError(element, 'Máximo 50 caracteres.');
                        valido = false;
                    }
                    break;

                case 'Facultad/Departamento':
                case 'genero':
                    if (!value) {
                        mostrarError(element, 'Debe seleccionar una opción.');
                        valido = false;
                    }
                    break;

                case 'identificacion':
                    if (!/^[0-9]{7,10}-[0-9kK]{1}$/.test(value)) {
                        mostrarError(element, 'Formato inválido. Ej: 1234567890-1');
                        valido = false;
                    } else if (!validarIdentificacionUnica(value)) {
                        mostrarError(element, 'Esta identificación ya está registrada.');
                        valido = false;
                    }
                    break;

                case 'fechaNacimiento':
                    const fecha = new Date(value);
                    const hoy = new Date();
                    const edad = hoy.getFullYear() - fecha.getFullYear();
                    const mes = hoy.getMonth() - fecha.getMonth();
                    const dia = hoy.getDate() - fecha.getDate();

                    if (fecha >= hoy) {
                        mostrarError(element, 'La fecha debe ser anterior al día de hoy.');
                        valido = false;
                    } else if (edad < 16 || (edad === 16 && mes < 0) || (edad === 16 && mes === 0 && dia < 0)) {
                        mostrarError(element, 'Debe tener al menos 16 años.');
                        valido = false;
                    } else if (edad > 80) {
                        mostrarError(element, 'Por favor, verifique la fecha de nacimiento.');
                        valido = false;
                    }
                    break;

                case 'telefono':
                    const soloNumeros = value.replace(/\D/g, '');
                    if (!/^\d{10}$/.test(soloNumeros)) {
                        mostrarError(element, 'Debe contener exactamente 10 dígitos numéricos.');
                        valido = false;
                    }
                    break;

                case 'email':
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!emailRegex.test(value)) {
                        mostrarError(element, 'Formato de correo electrónico inválido.');
                        valido = false;
                    } else if (!validarEmailUnico(value)) {
                        mostrarError(element, 'Este correo ya está registrado.');
                        valido = false;
                    }
                    break;

                case 'contrasena':
                    if (value.length < 8) {
                        mostrarError(element, 'Debe tener al menos 8 caracteres.');
                        valido = false;
                    } else if (!/[A-Z]/.test(value)) {
                        mostrarError(element, 'Debe contener al menos una mayúscula.');
                        valido = false;
                    } else if (!/[a-z]/.test(value)) {
                        mostrarError(element, 'Debe contener al menos una minúscula.');
                        valido = false;
                    } else if (!/[0-9]/.test(value)) {
                        mostrarError(element, 'Debe contener al menos un número.');
                        valido = false;
                    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                        mostrarError(element, 'Debe contener al menos un carácter especial.');
                        valido = false;
                    }
                    break;
            }
        }

        if (!valido) {
            alert('Por favor, corrija los errores en el formulario.');
            return;
        }

        const formData = {};
        elementos.forEach(e => {
            if (e.name) {
                formData[e.name] = e.value.trim();
            }
        });

        const usuario = {
            ...formData,
            tipoUsuario: tipo,
            fechaRegistro: new Date().toISOString(),
            estado: 'activo',
            id: `${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        try {
            let todosLosUsuarios = JSON.parse(localStorage.getItem('todosLosUsuarios') || '[]');
            todosLosUsuarios.push(usuario);
            localStorage.setItem('todosLosUsuarios', JSON.stringify(todosLosUsuarios));

            localStorage.setItem(`${tipo}-${formData.email}`, JSON.stringify(usuario));

            alert(`¡Registro exitoso! Bienvenido/a ${formData.nombres} ${formData.apellidos}`);
            form.reset();
            limpiarErrores(form);
            
            if (typeof goBack === 'function') {
                goBack();
            }
        } catch (error) {
            alert('Error al guardar los datos. Intente nuevamente.');
            console.error('Error al guardar:', error);
        }
    }

    function validarLogin(email, password, tipo) {
        try {
            const todosLosUsuarios = JSON.parse(localStorage.getItem('todosLosUsuarios') || '[]');
            const usuario = todosLosUsuarios.find(u => 
                u.email === email && u.tipoUsuario === tipo
            );

            if (!usuario) {
                return { success: false, message: 'Usuario no encontrado para este tipo de cuenta.' };
            }

            if (usuario.contrasena === password) {
                return { success: true, usuario: usuario };
            } else {
                return { success: false, message: 'Contraseña incorrecta.' };
            }
        } catch (error) {
            console.error('Error al validar login:', error);
            return { success: false, message: 'Error al validar credenciales.' };
        }
    }

    function mostrarUsuariosRegistrados() {
        return JSON.parse(localStorage.getItem('todosLosUsuarios') || '[]');
    }

    // Función para obtener estadísticas
    function obtenerEstadisticas() {
        const usuarios = mostrarUsuariosRegistrados();
        const estadisticas = {
            total: usuarios.length,
            estudiantes: usuarios.filter(u => u.tipoUsuario === 'estudiante').length,
            tutoresAcademicos: usuarios.filter(u => u.tipoUsuario === 'tutorAcademico').length,
            coordinadores: usuarios.filter(u => u.tipoUsuario === 'coordinador').length,
            empresas: usuarios.filter(u => u.tipoUsuario === 'empresa').length
        };
        return estadisticas;
    }

    function limpiarTodosLosDatos() {
        if (confirm('¿Está seguro de que desea eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            localStorage.clear();
            alert('Todos los datos han sido eliminados.');
            return true;
        }
        return false;
    }

    return {
        guardarRegistro,
        validarLogin,
        mostrarUsuariosRegistrados,
        obtenerEstadisticas,
        limpiarErrores,
        limpiarTodosLosDatos,
        validarEmailUnico,
        validarIdentificacionUnica
    };
})();

window.Validador = Validador;
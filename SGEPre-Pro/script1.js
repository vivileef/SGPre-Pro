let currentView = 'main-login', previousView = null;

const elements = [
    'main-login', 'universidad-options', 'estudiante', 'tutorAcademico', 'coordinador',
    'empresa', 'registro-estudiante', 'registro-tutorAcademico', 'registro-coordinador', 'registro-empresa'
];

// Mostrar y ocultar vistas
const hideAll = () => elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.classList.add('hidden');
});

const showElement = id => {
    hideAll();
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('hidden');
        previousView = currentView;
        currentView = id;
    }
};

// Login principal y por rol
const showLogin = tipo => showElement(tipo === 'universidad' ? 'universidad-options' : 'empresa');
const showSubLogin = showElement;
const register = tipo => showElement(`registro-${tipo}`);

// Navegación hacia atrás
const goBack = () => {
    const backMap = {
        'universidad-options': 'main-login',
        'estudiante': 'universidad-options',
        'tutorAcademico': 'universidad-options',
        'coordinador': 'universidad-options',
        'empresa': 'main-login',
        'registro-estudiante': 'estudiante',
        'registro-tutorAcademico': 'tutorAcademico',
        'registro-coordinador': 'coordinador',
        'registro-empresa': 'empresa'
    };
    showElement(backMap[currentView] || 'main-login');
};

// Validación y manejo de login mejorado
const validarLogin = (email, password, tipo) => {
    try {
        const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios')) || [];
        const usuario = usuarios.find(u => u.email === email && u.tipoUsuario === tipo);
        
        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado para este tipo de cuenta.' };
        }
        
        if (usuario.contrasena !== password) {
            return { success: false, message: 'Contraseña incorrecta.' };
        }
        
        return { success: true, usuario };
    } catch (error) {
        console.error('Error en validación de login:', error);
        return { success: false, message: 'Error al procesar credenciales.' };
    }
};

const handleLogin = (e, tipo) => {
    e.preventDefault();
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
        alert('Error: Formulario incompleto.');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Por favor, complete todos los campos.');
        return;
    }
    
    const res = validarLogin(email, password, tipo);
    if (!res.success) {
        alert(res.message);
        return;
    }

    // Crear datos de sesión
    const sessionData = {
        userData: { ...res.usuario, tipoUsuario: tipo },
        auth: {
            token: btoa(`${email}:${Date.now()}`).replace(/=/g, ''),
            expires: Date.now() + 3600000 // 1 hora
        }
    };
    
    try {
        sessionStorage.setItem('uleamSession', JSON.stringify(sessionData));
    } catch (error) {
        console.error('Error al guardar sesión:', error);
        alert('Error al iniciar sesión.');
        return;
    }

    // URLs de redirección según tipo de usuario
    const urls = {
        estudiante: 'estudiante.html',
        tutorAcademico: 'tutoracademicoo.html',
        coordinador: 'coordinador.html',
        empresa: 'tutorempresariall.html',
        admin: 'admint.html'
    };
    
    const redirectUrl = urls[tipo];
    if (redirectUrl) {
        window.location.href = `${redirectUrl}?token=${sessionData.auth.token}`;
    } else {
        alert('Error: Tipo de usuario no válido.');
    }
};

// Registro de usuarios mejorado
const guardarUsuario = (usuario, tipo) => {
    try {
        // Validar datos básicos
        if (!usuario.email || !usuario.contrasena || !usuario.nombres || !usuario.apellidos) {
            alert('Por favor, complete todos los campos obligatorios.');
            return false;
        }

        // Verificar si ya existe el usuario
        const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios')) || [];
        const existe = usuarios.some(u => u.email === usuario.email);
        
        if (existe) {
            alert('Ya existe un usuario registrado con ese correo electrónico.');
            return false;
        }

        // Crear nuevo usuario
        const nuevoUsuario = {
            ...usuario,
            id: `${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tipoUsuario: tipo,
            fechaRegistro: new Date().toISOString(),
            estado: 'activo'
        };

        // Guardar en localStorage
        usuarios.push(nuevoUsuario);
        localStorage.setItem('todosLosUsuarios', JSON.stringify(usuarios));
        
        // Mantener compatibilidad con el sistema anterior
        localStorage.setItem(`${tipo}-${usuario.email}`, JSON.stringify(nuevoUsuario));

        alert(`Usuario registrado exitosamente. Bienvenido/a ${usuario.nombres} ${usuario.apellidos}`);
        return true;
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert('Error al registrar usuario. Intente nuevamente.');
        return false;
    }
};

// Funciones de utilidad para datos
const limpiarDatos = () => {
    if (confirm('¿Está seguro de eliminar todos los usuarios registrados? Esta acción no se puede deshacer.')) {
        localStorage.clear();
        alert('Todos los datos han sido eliminados.');
        return true;
    }
    return false;
};

const exportarDatos = () => {
    try {
        const datos = localStorage.getItem('todosLosUsuarios');
        if (!datos || datos === '[]') {
            alert('No hay datos para exportar.');
            return;
        }
        
        const blob = new Blob([datos], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `usuarios_uleam_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Datos exportados correctamente.');
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('Error al exportar datos.');
    }
};

const importarDatos = (fileInput) => {
    const file = fileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            if (Array.isArray(datos)) {
                localStorage.setItem('todosLosUsuarios', JSON.stringify(datos));
                alert('Datos importados correctamente.');
            } else {
                alert('Formato de archivo inválido.');
            }
        } catch (error) {
            console.error('Error al importar datos:', error);
            alert('Error al procesar el archivo.');
        }
    };
    reader.readAsText(file);
};

// Función para validar formulario de registro
const validarFormularioRegistro = (form) => {
    const campos = form.querySelectorAll('input[required], select[required]');
    let valido = true;
    
    campos.forEach(campo => {
        if (!campo.value.trim()) {
            campo.style.borderColor = '#e74c3c';
            valido = false;
        } else {
            campo.style.borderColor = '#ddd';
        }
    });
    
    return valido;
};

// Eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Configurar formularios de registro
    ['estudiante', 'tutorAcademico', 'coordinador', 'empresa'].forEach(tipo => {
        const form = document.getElementById(`registro-${tipo}`);
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                
                if (!validarFormularioRegistro(form)) {
                    alert('Por favor, complete todos los campos obligatorios.');
                    return;
                }
                
                const formData = new FormData(form);
                const datos = Object.fromEntries(formData.entries());
                
                // Validaciones adicionales
                if (!datos.email || !datos.contrasena || !datos.nombres || !datos.apellidos) {
                    alert('Por favor, complete todos los campos obligatorios.');
                    return;
                }
                
                if (guardarUsuario(datos, tipo)) {
                    form.reset();
                    goBack(); // Regresar a la vista anterior
                }
            });
        }
    });

    // Configurar formularios de login
    ['estudiante', 'tutorAcademico', 'coordinador', 'empresa'].forEach(tipo => {
        const form = document.getElementById(tipo);
        if (form) {
            form.addEventListener('submit', e => handleLogin(e, tipo));
        }
    });

    // Mostrar vista inicial
    showElement('main-login');
    
    // Verificar si hay parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'success') {
        alert('Sesión cerrada correctamente.');
    }
    if (urlParams.get('error') === 'unauthorized') {
        alert('Acceso no autorizado. Por favor, inicie sesión.');
    }
});

// Función para mostrar estadísticas (útil para debugging)
const mostrarEstadisticas = () => {
    const usuarios = JSON.parse(localStorage.getItem('todosLosUsuarios') || '[]');
    const stats = {
        total: usuarios.length,
        estudiantes: usuarios.filter(u => u.tipoUsuario === 'estudiante').length,
        tutoresAcademicos: usuarios.filter(u => u.tipoUsuario === 'tutorAcademico').length,
        coordinadores: usuarios.filter(u => u.tipoUsuario === 'coordinador').length,
        empresas: usuarios.filter(u => u.tipoUsuario === 'empresa').length
    };
    console.table(stats);
    return stats;
};

// Exponer funciones globalmente para uso en HTML
window.showLogin = showLogin;
window.showSubLogin = showSubLogin;
window.register = register;
window.goBack = goBack;
window.limpiarDatos = limpiarDatos;
window.exportarDatos = exportarDatos;
window.importarDatos = importarDatos;
window.mostrarEstadisticas = mostrarEstadisticas;

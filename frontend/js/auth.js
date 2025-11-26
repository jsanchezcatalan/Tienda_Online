// ============================================
// AUTH.JS - SISTEMA DE AUTENTICACIÓN
// Gestión de login con token y localStorage
// ============================================

// ============================================
// CONFIGURACIÓN DEL SERVIDOR
// ============================================
const API_URL = 'http://localhost:3000/api';

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const btnLoginText = document.getElementById('btnLoginText');
const btnLoginSpinner = document.getElementById('btnLoginSpinner');
const alertContainer = document.getElementById('alertContainer');

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Muestra una alerta en el contenedor de alertas
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta (success, danger, warning, info)
 */
function mostrarAlerta(message, type = 'danger') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

/**
 * Cambia el estado del botón de login (loading/normal)
 * @param {boolean} loading - Si está en estado de carga
 */
function cambiarEstadoBoton(loading) {
  if (loading) {
    btnLoginText.classList.add('d-none');
    btnLoginSpinner.classList.remove('d-none');
    btnLogin.disabled = true;
  } else {
    btnLoginText.classList.remove('d-none');
    btnLoginSpinner.classList.add('d-none');
    btnLogin.disabled = false;
  }
}

/**
 * Guarda los datos en localStorage
 * @param {string} token - Token de autenticación
 * @param {object} usuario - Datos del usuario
 * @param {object} tienda - Datos de la tienda (categorías y productos)
 */
function guardarEnLocalStorage(token, usuario, tienda) {
  try {
    // Guardar token de autenticación
    localStorage.setItem('token', token);
    
    // Guardar información del usuario
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    // Guardar datos de la tienda (categorías y productos)
    localStorage.setItem('categorias', JSON.stringify(tienda.categorias));
    localStorage.setItem('productos', JSON.stringify(tienda.productos));
    
    // Inicializar carrito vacío si no existe
    if (!localStorage.getItem('carrito')) {
      localStorage.setItem('carrito', JSON.stringify([]));
    }
    
    // Inicializar productos vistos vacío si no existe
    if (!localStorage.getItem('productosVistos')) {
      localStorage.setItem('productosVistos', JSON.stringify([]));
    }
    
    console.log('✅ Datos guardados en localStorage correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al guardar en localStorage:', error);
    return false;
  }
}

/**
 * Realiza el login en el servidor
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<object>} - Respuesta del servidor
 */
async function realizarLogin(username, password) {
  try {
    // Realizar petición POST al endpoint de login
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    // Parsear respuesta JSON
    const data = await response.json();

    // Si el servidor devuelve error
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error en el login');
    }

    return data;
  } catch (error) {
    console.error('❌ Error en realizarLogin:', error);
    throw error;
  }
}

/**
 * Redirige al dashboard después del login exitoso
 */
function redirigirAlDashboard() {
  console.log('🚀 Redirigiendo al dashboard...');
  // Redirigir al dashboard
  window.location.href = 'dashboard.html';
}

// ============================================
// MANEJADORES DE EVENTOS
// ============================================

/**
 * Maneja el envío del formulario de login
 */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevenir recarga de página
  
  // Obtener valores del formulario
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Validaciones básicas
  if (!username || !password) {
    mostrarAlerta('Por favor, ingresa usuario y contraseña', 'warning');
    return;
  }

  // Cambiar estado del botón a loading
  cambiarEstadoBoton(true);

  try {
    console.log('🔄 Intentando login con usuario:', username);
    
    // Realizar login
    const respuesta = await realizarLogin(username, password);
    
    console.log('✅ Login exitoso:', respuesta);

    // Validar que la respuesta contiene los datos necesarios
    if (!respuesta.token || !respuesta.usuario || !respuesta.tienda) {
      throw new Error('Respuesta del servidor incompleta');
    }

    // Guardar datos en localStorage
    const guardadoExitoso = guardarEnLocalStorage(
      respuesta.token,
      respuesta.usuario,
      respuesta.tienda
    );

    if (!guardadoExitoso) {
      throw new Error('Error al guardar datos en localStorage');
    }

    // Mostrar mensaje de éxito
    mostrarAlerta(
      `¡Bienvenido ${respuesta.usuario.nombre}! Redirigiendo...`,
      'success'
    );

    // Redirigir al dashboard después de 1 segundo
    setTimeout(() => {
      redirigirAlDashboard();
    }, 1000);

  } catch (error) {
    console.error('❌ Error durante el login:', error);
    
    // Mostrar mensaje de error al usuario
    mostrarAlerta(
      error.message || 'Error al iniciar sesión. Verifica tus credenciales.',
      'danger'
    );
    
    // Restaurar estado del botón
    cambiarEstadoBoton(false);
  }
});

// ============================================
// VERIFICACIÓN DE SESIÓN ACTIVA
// Si el usuario ya está autenticado, redirigir al dashboard
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    console.log('⚠️ Usuario ya tiene sesión activa, verificando token...');
    
    // Verificar si el token es válido
    fetch(`${API_URL}/validar-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('✅ Token válido, redirigiendo al dashboard...');
        redirigirAlDashboard();
      } else {
        console.log('❌ Token inválido, limpiando localStorage...');
        localStorage.clear();
      }
    })
    .catch(error => {
      console.error('❌ Error al validar token:', error);
      localStorage.clear();
    });
  }
});

// ============================================
// LOGS DE DESARROLLO
// ============================================
console.log('🔐 auth.js cargado correctamente');
console.log('🌐 API URL:', API_URL);
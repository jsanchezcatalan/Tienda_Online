// ============================================
// STORE.JS - UTILIDADES DE LOCALSTORAGE
// Funciones para gestionar datos en localStorage
// ============================================

const API_URL = 'http://localhost:3000/api';

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - True si hay token válido
 */
export function estaAutenticado() {
  const token = localStorage.getItem('token');
  return token !== null && token !== '';
}

/**
 * Obtiene el token de autenticación
 * @returns {string|null} - Token o null si no existe
 */
export function obtenerToken() {
  return localStorage.getItem('token');
}

/**
 * Obtiene los datos del usuario autenticado
 * @returns {object|null} - Objeto con datos del usuario o null
 */
export function obtenerUsuario() {
  try {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
}

/**
 * Cierra la sesión del usuario y limpia el localStorage
 */
export async function cerrarSesion() {
  const token = obtenerToken();
  
  // Notificar al servidor del logout
  if (token) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    }
  }
  
  // Limpiar todos los datos del localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('productos');
  localStorage.removeItem('categorias');
  localStorage.removeItem('carrito');
  localStorage.removeItem('productosVistos');
  
  console.log('✅ Sesión cerrada y localStorage limpiado');
  
  // Redirigir al login
  window.location.href = 'login.html';
}

/**
 * Verifica si el usuario está autenticado y redirige si no lo está
 */
export function verificarAutenticacion() {
  if (!estaAutenticado()) {
    console.warn('⚠️ Usuario no autenticado, redirigiendo al login...');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

/**
 * Obtiene todos los productos del localStorage
 * @returns {Array} - Array de productos
 */
export function obtenerProductos() {
  try {
    const productos = localStorage.getItem('productos');
    console.log('Productos obtenidos del localStorage:', productos);
    return productos ? JSON.parse(productos) : [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
}

/**
 * Obtiene un producto por su ID
 * @param {number} id - ID del producto
 * @returns {object|null} - Producto encontrado o null
 */
export function obtenerProductoPorId(id) {
  const productos = obtenerProductos();
  return productos.find(p => p.id === parseInt(id)) || null;
}

/**
 * Obtiene productos destacados
 * @returns {Array} - Array de productos destacados
 */
export function obtenerProductosDestacados() {
  const productos = obtenerProductos();
  return productos.filter(p => p.destacado === true);
}

/**
 * Obtiene productos por categoría
 * @param {number} idCategoria - ID de la categoría
 * @returns {Array} - Array de productos de esa categoría
 */
export function obtenerProductosPorCategoria(idCategoria) {
  const productos = obtenerProductos();
  return productos.filter(p => p.id_categoria === parseInt(idCategoria));
}

// ============================================
// FUNCIONES DE CATEGORÍAS
// ============================================

/**
 * Obtiene todas las categorías del localStorage
 * @returns {Array} - Array de categorías
 */
export function obtenerCategorias() {
  try {
    const categorias = localStorage.getItem('categorias');
    return categorias ? JSON.parse(categorias) : [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
}

/**
 * Obtiene una categoría por su ID
 * @param {number} id - ID de la categoría
 * @returns {object|null} - Categoría encontrada o null
 */
export function obtenerCategoriaPorId(id) {
  const categorias = obtenerCategorias();
  return categorias.find(c => c.id === parseInt(id)) || null;
}

// ============================================
// FUNCIONES DE CARRITO
// ============================================

/**
 * Obtiene el carrito del localStorage
 * @returns {Array} - Array de productos en el carrito
 */
export function obtenerCarrito() {
  try {
    const carrito = localStorage.getItem('carrito');
    return carrito ? JSON.parse(carrito) : [];
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    return [];
  }
}

/**
 * Guarda el carrito en localStorage
 * @param {Array} carrito - Array de productos del carrito
 */
export function guardarCarrito(carrito) {
  try {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    console.log('✅ Carrito guardado:', carrito);
  } catch (error) {
    console.error('Error al guardar carrito:', error);
  }
}

/**
 * Añade un producto al carrito
 * @param {number} idProducto - ID del producto
 * @param {number} cantidad - Cantidad a añadir (default: 1)
 * @returns {boolean} - True si se añadió correctamente
 */
export function agregarAlCarrito(idProducto, cantidad = 1) {
  const producto = obtenerProductoPorId(idProducto);
  
  if (!producto) {
    console.error('Producto no encontrado');
    return false;
  }
  
  let carrito = obtenerCarrito();
  
  // Verificar si el producto ya está en el carrito
  const indiceExistente = carrito.findIndex(item => item.id === idProducto);
  
  if (indiceExistente !== -1) {
    // Si ya existe, aumentar cantidad
    carrito[indiceExistente].cantidad += cantidad;
  } else {
    // Si no existe, añadir nuevo item
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: cantidad
    });
  }
  
  guardarCarrito(carrito);
  console.log(`✅ Producto "${producto.nombre}" añadido al carrito`);
  return true;
}

/**
 * Elimina un producto del carrito
 * @param {number} idProducto - ID del producto a eliminar
 */
export function eliminarDelCarrito(idProducto) {
  let carrito = obtenerCarrito();
  carrito = carrito.filter(item => item.id !== idProducto);
  guardarCarrito(carrito);
  console.log(`✅ Producto eliminado del carrito`);
}

/**
 * Actualiza la cantidad de un producto en el carrito
 * @param {number} idProducto - ID del producto
 * @param {number} nuevaCantidad - Nueva cantidad
 */
export function actualizarCantidadCarrito(idProducto, nuevaCantidad) {
  let carrito = obtenerCarrito();
  const indice = carrito.findIndex(item => item.id === idProducto);
  
  if (indice !== -1) {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(idProducto);
    } else {
      carrito[indice].cantidad = nuevaCantidad;
      guardarCarrito(carrito);
    }
  }
}

/**
 * Vacía completamente el carrito
 */
export function vaciarCarrito() {
  guardarCarrito([]);
  console.log('✅ Carrito vaciado');
}

/**
 * Calcula el total del carrito
 * @returns {number} - Total en euros
 */
export function calcularTotalCarrito() {
  const carrito = obtenerCarrito();
  return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

/**
 * Obtiene la cantidad total de productos en el carrito
 * @returns {number} - Cantidad total
 */
export function obtenerCantidadTotalCarrito() {
  const carrito = obtenerCarrito();
  return carrito.reduce((total, item) => total + item.cantidad, 0);
}

// ============================================
// FUNCIONES DE PRODUCTOS VISTOS RECIENTEMENTE
// ============================================

/**
 * Obtiene los productos vistos recientemente
 * @returns {Array} - Array de IDs de productos vistos
 */
export function obtenerProductosVistos() {
  try {
    const vistos = localStorage.getItem('productosVistos');
    return vistos ? JSON.parse(vistos) : [];
  } catch (error) {
    console.error('Error al obtener productos vistos:', error);
    return [];
  }
}

/**
 * Añade un producto a la lista de vistos recientemente
 * @param {number} idProducto - ID del producto visto
 * @param {number} limite - Máximo de productos a mantener (default: 10)
 */
export function registrarProductoVisto(idProducto, limite = 10) {
  let vistos = obtenerProductosVistos();
  
  // Eliminar el producto si ya está en la lista (para moverlo al inicio)
  vistos = vistos.filter(id => id !== idProducto);
  
  // Añadir al inicio del array
  vistos.unshift(idProducto);
  
  // Limitar a los últimos N productos
  if (vistos.length > limite) {
    vistos = vistos.slice(0, limite);
  }
  
  localStorage.setItem('productosVistos', JSON.stringify(vistos));
  console.log(`✅ Producto ${idProducto} registrado como visto`);
}

/**
 * Obtiene los objetos completos de productos vistos
 * @param {number} cantidad - Cantidad de productos a obtener
 * @returns {Array} - Array de objetos de productos
 */
export function obtenerProductosVistosCompletos(cantidad = 5) {
  const idsVistos = obtenerProductosVistos().slice(0, cantidad);
  const productos = obtenerProductos();
  
  return idsVistos
    .map(id => productos.find(p => p.id === id))
    .filter(p => p !== undefined);
}

// ============================================
// FUNCIÓN DE VALIDACIÓN DE CARRITO EN SERVIDOR
// ============================================

/**
 * Valida el carrito en el servidor antes de procesar compra
 * @returns {Promise<object>} - Respuesta del servidor
 */
export async function validarCarritoEnServidor() {
  const token = obtenerToken();
  const carrito = obtenerCarrito();
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_URL}/carrito/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ carrito })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al validar carrito');
    }
    
    return data;
  } catch (error) {
    console.error('Error al validar carrito:', error);
    throw error;
  }
}

/**
 * Procesa la compra en el servidor
 * @returns {Promise<object>} - Respuesta del servidor con número de pedido
 */
export async function procesarCompra() {
  const token = obtenerToken();
  const carrito = obtenerCarrito();
  const total = calcularTotalCarrito();
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  if (carrito.length === 0) {
    throw new Error('El carrito está vacío');
  }
  
  try {
    const response = await fetch(`${API_URL}/carrito/comprar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ carrito, total })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al procesar compra');
    }
    
    // Si la compra fue exitosa, vaciar el carrito
    vaciarCarrito();
    
    return data;
  } catch (error) {
    console.error('Error al procesar compra:', error);
    throw error;
  }
}

// ============================================
// LOGS DE DESARROLLO
// ============================================
console.log('📦 store.js cargado correctamente')
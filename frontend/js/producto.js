// ============================================
// PRODUCTO.JS - FICHA DETALLADA DE PRODUCTO
// Muestra información completa del producto
// ============================================

import {
  verificarAutenticacion,
  obtenerProductoPorId,
  obtenerCategoriaPorId,
  agregarAlCarrito,
  obtenerCantidadTotalCarrito,
  registrarProductoVisto,
  obtenerProductosVistosCompletos,
  cerrarSesion
} from './store.js';

// ============================================
// VERIFICAR AUTENTICACIÓN AL CARGAR
// ============================================
verificarAutenticacion();

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const contadorCarrito = document.getElementById('contadorCarrito');
const btnCerrarSesion = document.getElementById('btnLogout');
const imagenProducto = document.getElementById('productoImagen');
const nombreProducto = document.getElementById('productoNombre');
const precioProducto = document.getElementById('productoPrecio');
const descripcionProducto = document.getElementById('productoDescripcion');
const stockProducto = document.getElementById('productoStock');
const inputCantidad = document.getElementById('cantidadInput');
const btnAgregarCarrito = document.getElementById('btnAgregarCarrito');
const breadcrumbProducto = document.getElementById('breadcrumbProducto');


// Variable global para almacenar el producto actual
let productoActual = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const idProducto = params.get('id');
  
  if (!idProducto) {
    mostrarError('ID de producto no especificado');
    return;
  }
  
  cargarProducto(parseInt(idProducto));
  cargarProductosVistos();
  actualizarContadorCarrito();
  configurarEventos();
});

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Carga y muestra la información del producto
 * @param {number} idProducto - ID del producto
 */
function cargarProducto(idProducto) {
  const producto = obtenerProductoPorId(idProducto);
  
  if (!producto) {
    mostrarError('Producto no encontrado');
    return;
  }
  
  // Guardar producto actual
  productoActual = producto;
  
  // Registrar como producto visto
  registrarProductoVisto(idProducto);
  
  // Obtener categoría del producto
  const categoria = obtenerCategoriaPorId(producto.id_categoria);
  
  // Actualizar breadcrumb
  if (breadcrumbProducto) {
    breadcrumbProducto.textContent = producto.nombre;
  }
  
  // Actualizar imagen
  if (imagenProducto) {
    imagenProducto.src = producto.imagen;
    imagenProducto.alt = producto.nombre;
  }
  
  // Actualizar título
  if (nombreProducto) {
    nombreProducto.textContent = producto.nombre;
  }
  
  // Actualizar precio
  if (precioProducto) {
    precioProducto.innerHTML = `
      <span class="display-5 text-primary fw-bold">€${producto.precio.toFixed(2)}</span>
    `;
  }
  
  // Actualizar descripción
  if (descripcionProducto) {
    descripcionProducto.textContent = producto.descripcion || 'Sin descripción disponible';
  }
  
  // Actualizar stock
  if (stockProducto) {
    if (producto.stock > 0) {
      stockProducto.innerHTML = `
        <span class="badge bg-success">
          <i class="bi bi-check-circle"></i> ${producto.stock} unidades disponibles
        </span>
      `;
    } else {
      stockProducto.innerHTML = `
        <span class="badge bg-danger">
          <i class="bi bi-x-circle"></i> Agotado
        </span>
      `;
    }
  }
  
  // Actualizar categoría
  if (categoriaProducto && categoria) {
    categoriaProducto.innerHTML = `
      <a href="categorias.html?id=${categoria.id}" class="text-decoration-none">
        <i class="bi bi-${categoria.icono || 'box'}"></i> ${categoria.nombre}
      </a>
    `;
  }
  
  // Configurar input de cantidad
  if (inputCantidad) {
    inputCantidad.max = producto.stock;
    inputCantidad.value = 1;
    
    if (producto.stock <= 0) {
      inputCantidad.disabled = true;
    }
  }
  
  // Configurar botón de añadir al carrito
  if (btnAgregarCarrito) {
    if (producto.stock <= 0) {
      btnAgregarCarrito.disabled = true;
      btnAgregarCarrito.innerHTML = '<i class="bi bi-x-circle"></i> Producto Agotado';
    } else {
      btnAgregarCarrito.disabled = false;
      btnAgregarCarrito.innerHTML = '<i class="bi bi-cart-plus"></i> Añadir al Carrito';
    }
  }
  
  // Badge de destacado
  if (producto.destacado) {
    const badge = document.createElement('span');
    badge.className = 'badge bg-warning text-dark position-absolute top-0 end-0 m-3';
    badge.innerHTML = '<i class="bi bi-star-fill"></i> Destacado';
    imagenProducto?.parentElement?.appendChild(badge);
  }
  
  console.log(`✅ Producto "${producto.nombre}" cargado correctamente`);
}

/**
 * Carga productos vistos recientemente (excluyendo el actual)
 */
function cargarProductosVistos() {
  if (!contenedorProductosVistos) return;
  
  const productosVistos = obtenerProductosVistosCompletos(6);
  
  // Filtrar el producto actual
  const productosFiltrados = productosVistos.filter(p => p.id !== productoActual?.id);
  
  contenedorProductosVistos.innerHTML = '';
  
  if (productosFiltrados.length === 0) {
    contenedorProductosVistos.innerHTML = `
      <div class="col-12">
        <p class="text-muted text-center">No hay productos vistos recientemente</p>
      </div>
    `;
    return;
  }
  
  productosFiltrados.forEach(producto => {
    const col = document.createElement('div');
    col.className = 'col';
    
    col.innerHTML = `
      <div class="card h-100 shadow-sm" style="cursor: pointer;" onclick="window.location.href='producto.html?id=${producto.id}'">
        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}" style="height: 150px; object-fit: cover;">
        <div class="card-body">
          <h6 class="card-title">${producto.nombre}</h6>
          <p class="text-primary fw-bold mb-0">€${producto.precio.toFixed(2)}</p>
        </div>
      </div>
    `;
    
    contenedorProductosVistos.appendChild(col);
  });
  
  console.log(`✅ ${productosFiltrados.length} productos vistos cargados`);
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
  document.body.innerHTML = `
    <div class="container mt-5">
      <div class="alert alert-danger">
        <h4 class="alert-heading"><i class="bi bi-exclamation-octagon"></i> Error</h4>
        <p>${mensaje}</p>
        <hr>
        <a href="dashboard.html" class="btn btn-primary">Volver al Inicio</a>
      </div>
    </div>
  `;
}

/**
 * Actualiza el contador del carrito
 */
function actualizarContadorCarrito() {
  const cantidad = obtenerCantidadTotalCarrito();
  
  if (contadorCarrito) {
    contadorCarrito.textContent = cantidad;
  }
}

/**
 * Maneja el evento de añadir al carrito
 */
function manejarAgregarAlCarrito() {
  if (!productoActual) return;
  
  const cantidad = parseInt(inputCantidad?.value || 1);
  
  // Validar cantidad
  if (cantidad <= 0) {
    mostrarNotificacion('La cantidad debe ser mayor a 0', 'warning');
    return;
  }
  
  if (cantidad > productoActual.stock) {
    mostrarNotificacion(`Solo hay ${productoActual.stock} unidades disponibles`, 'warning');
    return;
  }
  
  // Añadir al carrito
  const exito = agregarAlCarrito(productoActual.id, cantidad);
  
  if (exito) {
    mostrarNotificacion(
      `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de "${productoActual.nombre}" añadidas al carrito`,
      'success'
    );
    actualizarContadorCarrito();
    
    // Resetear cantidad a 1
    if (inputCantidad) {
      inputCantidad.value = 1;
    }
  } else {
    mostrarNotificacion('Error al añadir al carrito', 'danger');
  }
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  notificacion.style.zIndex = '9999';
  notificacion.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.remove();
  }, 3000);
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================

/**
 * Configura todos los event listeners
 */
function configurarEventos() {
  // Botón añadir al carrito
  if (btnAgregarCarrito) {
    btnAgregarCarrito.addEventListener('click', manejarAgregarAlCarrito);
  }
  
  // Validar input de cantidad
  if (inputCantidad) {
    inputCantidad.addEventListener('input', (e) => {
      let valor = parseInt(e.target.value);
      
      if (isNaN(valor) || valor < 1) {
        valor = 1;
      }
      
      if (productoActual && valor > productoActual.stock) {
        valor = productoActual.stock;
      }
      
      e.target.value = valor;
    });
  }
  
  // Botón cerrar sesión
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        cerrarSesion();
      }
    });
  }
}

// ============================================
// LOGS DE DESARROLLO
// ============================================
console.log('📦 producto.js cargado correctamente');
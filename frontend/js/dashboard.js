// ============================================
// DASHBOARD.JS - PANEL PRINCIPAL
// Muestra productos destacados y categorías
// ============================================

import {
  verificarAutenticacion,
  obtenerUsuario,
  obtenerProductosDestacados,
  obtenerCategorias,
  agregarAlCarrito,
  obtenerCantidadTotalCarrito,
  cerrarSesion
} from './store.js';

// ============================================
// VERIFICAR AUTENTICACIÓN AL CARGAR
// ============================================
verificarAutenticacion();

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const nombreUsuario = document.getElementById('nombreUsuario');
const contadorCarrito = document.getElementById('contadorCarrito');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const contenedorProductosDestacados = document.getElementById('productosDestacadosContainer');
const contenedorCategorias = document.getElementById('categoriasContainer');

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  cargarDatosUsuario();
  cargarProductosDestacados();
  cargarCategorias();
  actualizarContadorCarrito();
  configurarEventos();
});

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Carga los datos del usuario en el navbar
 */
function cargarDatosUsuario() {
  const usuario = obtenerUsuario();
  
  if (usuario && nombreUsuario) {
    nombreUsuario.textContent = usuario.nombre || usuario.username;
  }
}

/**
 * Carga y muestra los productos destacados
 */
function cargarProductosDestacados() {
  const productosDestacados = obtenerProductosDestacados();
  
  if (!contenedorProductosDestacados) {
    console.error('Contenedor de productos destacados no encontrado');
    return;
  }
  
  // Limpiar contenedor
  contenedorProductosDestacados.innerHTML = '';
  
  if (productosDestacados.length === 0) {
    contenedorProductosDestacados.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No hay productos destacados disponibles
        </div>
      </div>
    `;
    return;
  }
  
  // Crear cards de productos
  productosDestacados.forEach(producto => {
    const card = crearCardProducto(producto);
    contenedorProductosDestacados.appendChild(card);
  });
  
  console.log(`✅ ${productosDestacados.length} productos destacados cargados`);
}

/**
 * Carga y muestra las categorías
 */
function cargarCategorias() {
  const categorias = obtenerCategorias();
  
  if (!contenedorCategorias) {
    console.error('Contenedor de categorías no encontrado');
    return;
  }
  
  // Limpiar contenedor
  contenedorCategorias.innerHTML = '';
  
  if (categorias.length === 0) {
    contenedorCategorias.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No hay categorías disponibles
        </div>
      </div>
    `;
    return;
  }
  
  // Crear cards de categorías
  categorias.forEach(categoria => {
    const card = crearCardCategoria(categoria);
    contenedorCategorias.appendChild(card);
  });
  
  console.log(`✅ ${categorias.length} categorías cargadas`);
}

/**
 * Crea una card de producto
 * @param {object} producto - Objeto producto
 * @returns {HTMLElement} - Elemento div con la card
 */
function crearCardProducto(producto) {
  const col = document.createElement('div');
  col.className = 'col';
  
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      ${producto.destacado ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Destacado</span>' : ''}
      <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}" style="height: 200px; object-fit: cover;">
      <div class="card-body">
        <h5 class="card-title">${producto.nombre}</h5>
        <p class="card-text text-muted">${producto.descripcion || 'Sin descripción'}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="h5 text-primary mb-0">€${producto.precio.toFixed(2)}</span>
          <small class="text-muted">Stock: ${producto.stock}</small>
        </div>
      </div>
      <div class="card-footer bg-white border-0">
        <div class="d-grid gap-2">
          <button class="btn btn-outline-primary btn-ver-producto" data-id="${producto.id}">
            <i class="bi bi-eye"></i> Ver Producto
          </button>
          <button class="btn btn-primary btn-agregar-carrito" data-id="${producto.id}" ${producto.stock <= 0 ? 'disabled' : ''}>
            <i class="bi bi-cart-plus"></i> Añadir al Carrito
          </button>
        </div>
      </div>
    </div>
  `;
  
  return col;
}

/**
 * Crea una card de categoría
 * @param {object} categoria - Objeto categoría
 * @returns {HTMLElement} - Elemento div con la card
 */
function crearCardCategoria(categoria) {
  const col = document.createElement('div');
  col.className = 'col';
  
  col.innerHTML = `
    <div class="card h-100 shadow-sm categoria-card" style="cursor: pointer;" data-id="${categoria.id}">
      <div class="card-body text-center">
        <i class="bi bi-${categoria.icono || 'box'} display-4 text-primary mb-3"></i>
        <h5 class="card-title">${categoria.nombre}</h5>
        <p class="card-text text-muted">${categoria.descripcion || ''}</p>
      </div>
    </div>
  `;
  
  return col;
}

/**
 * Actualiza el contador del carrito en el navbar
 */
function actualizarContadorCarrito() {
  const cantidad = obtenerCantidadTotalCarrito();
  
  if (contadorCarrito) {
    contadorCarrito.textContent = cantidad;
    
    // Añadir animación cuando cambia
    contadorCarrito.classList.add('badge-animation');
    setTimeout(() => {
      contadorCarrito.classList.remove('badge-animation');
    }, 300);
  }
}

/**
 * Maneja el click en el botón "Añadir al Carrito"
 * @param {number} idProducto - ID del producto
 */
function manejarAgregarCarrito(idProducto) {
  const exito = agregarAlCarrito(idProducto, 1);
  
  if (exito) {
    // Mostrar notificación
    mostrarNotificacion('Producto añadido al carrito', 'success');
    
    // Actualizar contador
    actualizarContadorCarrito();
  } else {
    mostrarNotificacion('Error al añadir producto', 'danger');
  }
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta (success, danger, warning, info)
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
  
  // Auto-eliminar después de 3 segundos
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
  // Botón cerrar sesión
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        cerrarSesion();
      }
    });
  }
  
  // Event delegation para botones de productos
  if (contenedorProductosDestacados) {
    contenedorProductosDestacados.addEventListener('click', (e) => {
      // Botón ver producto
      if (e.target.closest('.btn-ver-producto')) {
        const btn = e.target.closest('.btn-ver-producto');
        const idProducto = btn.dataset.id;
        window.location.href = `producto.html?id=${idProducto}`;
      }
      
      // Botón añadir al carrito
      if (e.target.closest('.btn-agregar-carrito')) {
        const btn = e.target.closest('.btn-agregar-carrito');
        const idProducto = parseInt(btn.dataset.id);
        manejarAgregarCarrito(idProducto);
      }
    });
  }
  
  // Event delegation para categorías
  if (contenedorCategorias) {
    contenedorCategorias.addEventListener('click', (e) => {
      const card = e.target.closest('.categoria-card');
      if (card) {
        const idCategoria = card.dataset.id;
        window.location.href = `categorias.html?id=${idCategoria}`;
      }
    });
  }
}

// ============================================
// LOGS DE DESARROLLO
// ============================================
console.log('🏠 dashboard.js cargado correctamente');
// ============================================
// CATEGORIAS.JS - Gestión de Categorías y Productos
// ============================================

import {
  verificarAutenticacion,
  obtenerCategorias,
  obtenerCategoriaPorId,
  obtenerProductosPorCategoria,
  agregarAlCarrito,
  obtenerCantidadTotalCarrito,
  cerrarSesion
} from './store.js';

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================
verificarAutenticacion();

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const contadorCarrito = document.getElementById('cartBadge');
const btnCerrarSesion = document.getElementById('btnLogout');
const categoriasGrid = document.getElementById('categoriasGrid');
const productosSeccion = document.getElementById('productosSeccion');
const productosGrid = document.getElementById('productosGrid');
const categoriaTitulo = document.getElementById('categoriaTitulo');
const btnVolverCategorias = document.getElementById('btnVolverCategorias');

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  cargarCategorias();

  // Revisar si hay idCategoria en URL
  const params = new URLSearchParams(window.location.search);
  const idCategoria = params.get('id');
  if (idCategoria) {
    mostrarProductosCategoria(parseInt(idCategoria));
  }

  actualizarContadorCarrito();
  configurarEventos();
});

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Carga todas las categorías y las muestra en el grid
 */
function cargarCategorias() {
  const categorias = obtenerCategorias();
  categoriasGrid.innerHTML = ''; // limpiar spinner

  if (categorias.length === 0) {
    categoriasGrid.innerHTML = `<div class="col-12 text-center">
      <p class="text-muted">No hay categorías disponibles</p>
    </div>`;
    return;
  }

  categorias.forEach(categoria => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm text-center">
        <div class="card-body">
          <i class="bi bi-${categoria.icono || 'box'} display-4 text-primary mb-3"></i>
          <h5 class="card-title">${categoria.nombre}</h5>
          <p class="text-muted">${categoria.descripcion || ''}</p>
          <button class="btn btn-primary w-100 btn-ver-productos" data-id="${categoria.id}">
            Ver Productos
          </button>
        </div>
      </div>
    `;
    categoriasGrid.appendChild(col);
  });
}

/**
 * Muestra los productos de una categoría
 * @param {number} idCategoria
 */
function mostrarProductosCategoria(idCategoria) {
  const categoria = obtenerCategoriaPorId(idCategoria);
  if (!categoria) {
    categoriasGrid.innerHTML = `<div class="col-12 text-center">
      <p class="text-danger">Categoría no encontrada</p>
    </div>`;
    return;
  }

  // Actualizar título y mostrar sección de productos
  categoriaTitulo.innerHTML = `<i class="bi bi-${categoria.icono || 'box'}"></i> ${categoria.nombre}`;
  productosSeccion.style.display = 'block';
  categoriasGrid.style.display = 'none';
  productosGrid.innerHTML = '';

  const productos = obtenerProductosPorCategoria(idCategoria);
  if (productos.length === 0) {
    productosGrid.innerHTML = `<div class="col-12">
      <div class="alert alert-warning text-center">No hay productos en esta categoría</div>
    </div>`;
    return;
  }

  productos.forEach(producto => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm position-relative">
        ${producto.destacado ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Destacado</span>' : ''}
        ${producto.stock <= 0 ? '<span class="badge bg-danger position-absolute top-0 start-0 m-2">Agotado</span>' : ''}
        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}" style="height:200px; object-fit:cover; cursor:pointer;">
        <div class="card-body">
          <h5 class="card-title">${producto.nombre}</h5>
          <p class="text-muted small">${producto.descripcion ? producto.descripcion.substring(0, 80) + '...' : 'Sin descripción'}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="h5 text-primary mb-0">€${producto.precio.toFixed(2)}</span>
            <small class="text-muted">Stock: ${producto.stock}</small>
          </div>
        </div>
        <div class="card-footer bg-white border-0 d-grid gap-2">
          <button class="btn btn-outline-primary btn-ver-producto" data-id="${producto.id}">
            <i class="bi bi-eye"></i> Ver Detalles
          </button>
          <button class="btn btn-primary btn-agregar-carrito" data-id="${producto.id}" ${producto.stock <= 0 ? 'disabled' : ''}>
            <i class="bi bi-cart-plus"></i> ${producto.stock <= 0 ? 'Agotado' : 'Añadir al Carrito'}
          </button>
        </div>
      </div>
    `;
    productosGrid.appendChild(col);
  });
}

/**
 * Muestra todas las categorías (volver)
 */
function mostrarCategorias() {
  productosSeccion.style.display = 'none';
  categoriasGrid.style.display = 'flex';
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function actualizarContadorCarrito() {
  const cantidad = obtenerCantidadTotalCarrito();
  if (contadorCarrito) contadorCarrito.textContent = cantidad;
}

function manejarAgregarCarrito(idProducto) {
  const exito = agregarAlCarrito(idProducto, 1);
  if (exito) {
    mostrarNotificacion('Producto añadido al carrito', 'success');
    actualizarContadorCarrito();
  } else {
    mostrarNotificacion('Error al añadir producto', 'danger');
  }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  notificacion.style.zIndex = '9999';
  notificacion.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(notificacion);
  setTimeout(() => notificacion.remove(), 3000);
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================

function configurarEventos() {
  // Botones "Ver Productos" de categorías
  categoriasGrid.addEventListener('click', e => {
    if (e.target.closest('.btn-ver-productos')) {
      const idCategoria = parseInt(e.target.closest('.btn-ver-productos').dataset.id);
      mostrarProductosCategoria(idCategoria);
    }
  });

  // Botones "Ver Detalles" y "Añadir al Carrito"
  productosGrid.addEventListener('click', e => {
    // Ver producto
    if (e.target.closest('.btn-ver-producto')) {
      const idProducto = e.target.closest('.btn-ver-producto').dataset.id;
      window.location.href = `producto.html?id=${idProducto}`;
    }
    // Agregar al carrito
    if (e.target.closest('.btn-agregar-carrito')) {
      const idProducto = parseInt(e.target.closest('.btn-agregar-carrito').dataset.id);
      manejarAgregarCarrito(idProducto);
    }
  });

  // Botón "Volver a categorías"
  btnVolverCategorias.addEventListener('click', mostrarCategorias);

  // Botón cerrar sesión
  btnCerrarSesion.addEventListener('click', e => {
    e.preventDefault();
    if (confirm('¿Deseas cerrar sesión?')) cerrarSesion();
  });
}

console.log('📂 categorias.js ajustado cargado correctamente');

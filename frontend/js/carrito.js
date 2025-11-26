import {
  verificarAutenticacion,
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
  calcularTotalCarrito,
  obtenerCantidadTotalCarrito,
  validarCarritoEnServidor,
  procesarCompra,
  obtenerProductosVistosCompletos,
  cerrarSesion
} from './store.js';

verificarAutenticacion();

const contadorCarrito = document.getElementById('cartBadge');
const contenedorCarrito = document.getElementById('carritoProductos');
const contenedorVacio = document.getElementById('carritoVacio');
const btnVaciarCarrito = document.getElementById('btnVaciarCarrito');
const btnProcesarCompra = document.getElementById('btnProcesarCompra');
const resumenTotal = document.getElementById('totalFinal');
const resumenCantidad = document.getElementById('totalProductos');
const contenedorProductosVistos = document.getElementById('productosVistosGrid');
const btnCerrarSesion = document.getElementById('btnLogout');

document.addEventListener('DOMContentLoaded', () => {
  cargarCarrito();
  cargarProductosVistos();
  actualizarContadorCarrito();
  configurarEventos();
});

// ---------------------------
// Funciones principales
// ---------------------------

function cargarCarrito() {
  const carrito = obtenerCarrito() || [];

  if (!contenedorCarrito) return;

  contenedorCarrito.innerHTML = '';

  if (carrito.length === 0) {
    contenedorVacio?.classList.remove('d-none');
    resumenTotal.textContent = '€0.00';
    resumenCantidad.textContent = '0';
    btnVaciarCarrito.disabled = true;
    btnProcesarCompra.disabled = true;
    return;
  }

  contenedorVacio?.classList.add('d-none');

  carrito.forEach(item => {
    contenedorCarrito.appendChild(crearFilaProducto(item));
  });

  actualizarResumen();
}

function crearFilaProducto(item) {
  const tr = document.createElement('tr');
  const subtotal = (item.precio * item.cantidad).toFixed(2);

  tr.innerHTML = `
    <td>
      <div class="d-flex align-items-center">
        <img src="${item.imagen}" alt="${item.nombre}" class="rounded me-3" style="width:80px;height:80px;object-fit:cover;">
        <div>
          <h6 class="mb-0">${item.nombre}</h6>
          <small class="text-muted">€${item.precio.toFixed(2)} c/u</small>
        </div>
      </div>
    </td>
    <td class="align-middle">
      <div class="input-group input-group-sm" style="width:130px;">
        <button class="btn btn-outline-secondary btn-restar" data-id="${item.id}" type="button"><i class="bi bi-dash"></i></button>
        <input type="number" class="form-control text-center input-cantidad" data-id="${item.id}" value="${item.cantidad}" min="1">
        <button class="btn btn-outline-secondary btn-sumar" data-id="${item.id}" type="button"><i class="bi bi-plus"></i></button>
      </div>
    </td>
    <td class="align-middle fw-bold">€${subtotal}</td>
    <td class="align-middle text-end">
      <button class="btn btn-danger btn-sm btn-eliminar" data-id="${item.id}"><i class="bi bi-trash"></i></button>
    </td>
  `;
  return tr;
}

function actualizarResumen() {
  const total = calcularTotalCarrito() || 0;
  const cantidad = obtenerCantidadTotalCarrito() || 0;

  resumenTotal.textContent = `€${total.toFixed(2)}`;
  resumenCantidad.textContent = cantidad;

  btnVaciarCarrito.disabled = cantidad === 0;
  btnProcesarCompra.disabled = cantidad === 0;
}

function actualizarContadorCarrito() {
  const cantidad = obtenerCantidadTotalCarrito() || 0;
  if (contadorCarrito) contadorCarrito.textContent = cantidad;
}

function manejarCambioCantidad(idProducto, nuevaCantidad) {
  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(idProducto);
  } else {
    actualizarCantidadCarrito(idProducto, nuevaCantidad);
  }
  cargarCarrito();
  actualizarContadorCarrito();
}

function manejarEliminarProducto(idProducto) {
  eliminarDelCarrito(idProducto);
  cargarCarrito();
  actualizarContadorCarrito();
}

function manejarVaciarCarrito() {
  vaciarCarrito();
  cargarCarrito();
  actualizarContadorCarrito();
}

async function manejarProcesarCompra() {
  if (!obtenerCarrito().length) return;

  btnProcesarCompra.disabled = true;
  btnProcesarCompra.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';

  try {
    const validacion = await validarCarritoEnServidor();
    if (!validacion.success) throw new Error(validacion.error || 'Error validando carrito');

    const resultado = await procesarCompra();
    if (!resultado.success) throw new Error(resultado.error || 'Error procesando compra');

    mostrarModalCompraExitosa(resultado);
    cargarCarrito();
    actualizarContadorCarrito();
  } catch (error) {
    alert(`Error: ${error.message}`);
    btnProcesarCompra.disabled = false;
    btnProcesarCompra.innerHTML = '<i class="bi bi-credit-card"></i> Procesar Compra';
  }
}

function cargarProductosVistos() {
  if (!contenedorProductosVistos) return;
  const vistos = obtenerProductosVistosCompletos(4) || [];

  contenedorProductosVistos.innerHTML = '';
  if (!vistos.length) return;

  vistos.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}" style="height:150px;object-fit:cover;cursor:pointer;" onclick="window.location.href='producto.html?id=${p.id}'">
        <div class="card-body">
          <h6 class="card-title">${p.nombre}</h6>
          <p class="text-primary fw-bold mb-0">€${p.precio.toFixed(2)}</p>
        </div>
      </div>
    `;
    contenedorProductosVistos.appendChild(col);
  });
}

// ---------------------------
// Configuración de eventos
// ---------------------------
function configurarEventos() {
  btnVaciarCarrito?.addEventListener('click', manejarVaciarCarrito);
  btnProcesarCompra?.addEventListener('click', manejarProcesarCompra);
  btnCerrarSesion?.addEventListener('click', e => {
    e.preventDefault();
    cerrarSesion();
  });

  contenedorCarrito?.addEventListener('click', e => {
    if (e.target.closest('.btn-eliminar')) {
      manejarEliminarProducto(parseInt(e.target.closest('.btn-eliminar').dataset.id));
    }
    if (e.target.closest('.btn-restar')) {
      const id = parseInt(e.target.closest('.btn-restar').dataset.id);
      const input = contenedorCarrito.querySelector(`.input-cantidad[data-id="${id}"]`);
      manejarCambioCantidad(id, parseInt(input.value)-1);
    }
    if (e.target.closest('.btn-sumar')) {
      const id = parseInt(e.target.closest('.btn-sumar').dataset.id);
      const input = contenedorCarrito.querySelector(`.input-cantidad[data-id="${id}"]`);
      manejarCambioCantidad(id, parseInt(input.value)+1);
    }
  });

  contenedorCarrito?.addEventListener('change', e => {
    if (e.target.classList.contains('input-cantidad')) {
      const id = parseInt(e.target.dataset.id);
      const val = parseInt(e.target.value);
      if (!isNaN(val)) manejarCambioCantidad(id, val);
    }
  });
}

function mostrarModalCompraExitosa(resultado) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.innerHTML = `
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-success text-white">
        <h5 class="modal-title"><i class="bi bi-check-circle-fill"></i> ¡Compra Exitosa!</h5>
      </div>
      <div class="modal-body text-center">
        <i class="bi bi-bag-check display-1 text-success mb-3"></i>
        <h4>¡Gracias por tu compra!</h4>
        <p class="text-muted">Tu pedido ha sido procesado correctamente</p>
        <hr>
        <p><strong>Número de pedido:</strong> ${resultado.numeroPedido}</p>
        <p><strong>Total:</strong> €${resultado.total.toFixed(2)}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" onclick="window.location.href='dashboard.html'">Volver al Inicio</button>
      </div>
    </div>
  </div>
  `;
  document.body.appendChild(modal);
  new bootstrap.Modal(modal).show();
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

console.log('🛒 carrito.js cargado y listo');

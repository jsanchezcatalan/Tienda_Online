// ============================================
// SERVIDOR NODE.JS - API REST TIENDA ONLINE
// Seguridad: Token de autenticación en todas las rutas
// ============================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json()); // Parsear JSON en el body

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// Token secreto del servidor (clave privada)
// ============================================
const SECRET_TOKEN = 'TIENDA_ONLINE_SECRET_KEY_2024_DWEC';

// Almacén de tokens activos (en producción usar Redis o DB)
const tokensActivos = new Map();

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Generar token único para cada usuario
function generarToken(userId) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(32).toString('hex');
  const token = crypto
    .createHash('sha256')
    .update(`${userId}-${timestamp}-${randomString}-${SECRET_TOKEN}`)
    .digest('hex');
  
  // Guardar token con tiempo de expiración (24 horas)
  tokensActivos.set(token, {
    userId,
    createdAt: timestamp,
    expiresAt: timestamp + (24 * 60 * 60 * 1000) // 24 horas
  });
  
  return token;
}

// Validar token de autenticación
function validarToken(token) {
  if (!token) {
    return { valido: false, error: 'Token no proporcionado' };
  }

  const tokenData = tokensActivos.get(token);
  
  if (!tokenData) {
    return { valido: false, error: 'Token inválido' };
  }

  // Verificar si el token ha expirado
  if (Date.now() > tokenData.expiresAt) {
    tokensActivos.delete(token);
    return { valido: false, error: 'Token expirado' };
  }

  return { valido: true, userId: tokenData.userId };
}

// Middleware para proteger rutas
function middlewareAutenticacion(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  const resultado = validarToken(token);
  
  if (!resultado.valido) {
    return res.status(401).json({
      success: false,
      error: resultado.error
    });
  }

  // Adjuntar userId al request para usarlo en las rutas
  req.userId = resultado.userId;
  next();
}

// Leer archivo JSON
function leerJSON(nombreArchivo) {
  try {
    const rutaArchivo = path.join(__dirname, 'data', nombreArchivo);
    const datos = fs.readFileSync(rutaArchivo, 'utf8');
    return JSON.parse(datos);
  } catch (error) {
    console.error(`Error al leer ${nombreArchivo}:`, error);
    return null;
  }
}

// ============================================
// ENDPOINT 1: LOGIN
// POST /api/login
// Autentica al usuario y devuelve token + datos de la tienda
// ============================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validar que se enviaron credenciales
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Usuario y contraseña son requeridos'
    });
  }

  // Leer usuarios del archivo JSON
  const datosUsuarios = leerJSON('usuarios.json');
  
  if (!datosUsuarios) {
    return res.status(500).json({
      success: false,
      error: 'Error al cargar datos de usuarios'
    });
  }

  // Buscar usuario
  const usuario = datosUsuarios.usuarios.find(
    u => u.username === username && u.password === password
  );

  if (!usuario) {
    return res.status(401).json({
      success: false,
      error: 'Credenciales incorrectas'
    });
  }

  // Leer datos de la tienda
  const datosTienda = leerJSON('tienda.json');
  
  if (!datosTienda) {
    return res.status(500).json({
      success: false,
      error: 'Error al cargar datos de la tienda'
    });
  }

  // Generar token para el usuario
  const token = generarToken(usuario.id);

  // Log de seguridad
  console.log(`[LOGIN] Usuario ${username} autenticado - Token generado`);

  // Devolver token y datos de la tienda
  res.json({
    success: true,
    token: token,
    usuario: {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      email: usuario.email
    },
    tienda: {
      categorias: datosTienda.categorias,
      productos: datosTienda.productos
    }
  });
});

// ============================================
// ENDPOINT 2: VALIDAR TOKEN
// POST /api/validar-token
// Verifica si un token es válido (para refrescar sesión)
// ============================================
app.post('/api/validar-token', middlewareAutenticacion, (req, res) => {
  // Si llegamos aquí, el token es válido (pasó el middleware)
  res.json({
    success: true,
    message: 'Token válido',
    userId: req.userId
  });
});

// ============================================
// ENDPOINT 3: CARRITO - VALIDAR PRECIOS
// POST /api/carrito/validar
// Valida que los precios del carrito no hayan sido manipulados
// Requiere autenticación
// ============================================
app.post('/api/carrito/validar', middlewareAutenticacion, (req, res) => {
  const { carrito } = req.body;

  if (!carrito || !Array.isArray(carrito)) {
    return res.status(400).json({
      success: false,
      error: 'Carrito inválido'
    });
  }

  // Leer precios reales desde el servidor
  const datosTienda = leerJSON('tienda.json');
  
  if (!datosTienda) {
    return res.status(500).json({
      success: false,
      error: 'Error al cargar datos de la tienda'
    });
  }

  // Validar cada producto del carrito
  const errores = [];
  let totalCalculado = 0;

  carrito.forEach(item => {
    const productoReal = datosTienda.productos.find(p => p.id === item.id);
    
    if (!productoReal) {
      errores.push({
        productoId: item.id,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Verificar precio
    if (productoReal.precio !== item.precio) {
      errores.push({
        productoId: item.id,
        nombre: productoReal.nombre,
        error: 'Precio manipulado',
        precioEnviado: item.precio,
        precioReal: productoReal.precio
      });
    }

    // Verificar stock
    if (item.cantidad > productoReal.stock) {
      errores.push({
        productoId: item.id,
        nombre: productoReal.nombre,
        error: 'Stock insuficiente',
        cantidadSolicitada: item.cantidad,
        stockDisponible: productoReal.stock
      });
    }

    // Calcular total correcto
    totalCalculado += productoReal.precio * item.cantidad;
  });

  // Si hay errores, devolver detalle
  if (errores.length > 0) {
    console.log(`[SEGURIDAD] Intento de manipulación de carrito - Usuario ${req.userId}`);
    return res.status(400).json({
      success: false,
      error: 'El carrito contiene errores',
      errores: errores
    });
  }

  // Todo correcto
  console.log(`[CARRITO] Validación exitosa - Usuario ${req.userId} - Total: €${totalCalculado.toFixed(2)}`);
  
  res.json({
    success: true,
    message: 'Carrito validado correctamente',
    total: totalCalculado,
    cantidadProductos: carrito.reduce((sum, item) => sum + item.cantidad, 0)
  });
});

// ============================================
// ENDPOINT 4: PROCESAR COMPRA
// POST /api/carrito/comprar
// Procesa la compra final (después de validación)
// Requiere autenticación
// ============================================
app.post('/api/carrito/comprar', middlewareAutenticacion, (req, res) => {
  const { carrito, total } = req.body;

  if (!carrito || !Array.isArray(carrito) || typeof total !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Datos de compra inválidos'
    });
  }

  // Validar precios nuevamente antes de procesar
  const datosTienda = leerJSON('tienda.json');
  
  if (!datosTienda) {
    return res.status(500).json({
      success: false,
      error: 'Error al procesar la compra'
    });
  }

  let totalCalculado = 0;
  const errores = [];

  carrito.forEach(item => {
    const productoReal = datosTienda.productos.find(p => p.id === item.id);
    
    if (!productoReal) {
      errores.push(`Producto ${item.id} no encontrado`);
      return;
    }

    if (productoReal.precio !== item.precio) {
      errores.push(`Precio manipulado en producto ${productoReal.nombre}`);
    }

    totalCalculado += productoReal.precio * item.cantidad;
  });

  // Verificar que el total enviado coincide con el calculado
  if (Math.abs(totalCalculado - total) > 0.01) {
    errores.push('Total manipulado');
  }

  if (errores.length > 0) {
    console.log(`[SEGURIDAD] Intento de compra fraudulenta - Usuario ${req.userId}`);
    return res.status(400).json({
      success: false,
      error: 'Error en la validación de la compra',
      detalles: errores
    });
  }

  // Generar número de pedido
  const numeroPedido = `PED-${Date.now()}-${req.userId}`;

  console.log(`[COMPRA] Pedido ${numeroPedido} procesado - Usuario ${req.userId} - Total: €${totalCalculado.toFixed(2)}`);

  // En producción: aquí se actualizaría el stock, se guardaría en BD, etc.
  
  res.json({
    success: true,
    message: 'Compra procesada correctamente',
    numeroPedido: numeroPedido,
    total: totalCalculado,
    fecha: new Date().toISOString()
  });
});

// ============================================
// ENDPOINT 5: PRODUCTOS VISTOS RECIENTEMENTE
// POST /api/productos-vistos
// Recibe y guarda productos vistos (opcional, más para tracking)
// Requiere autenticación
// ============================================
app.post('/api/productos-vistos', middlewareAutenticacion, (req, res) => {
  const { productosVistos } = req.body;

  if (!Array.isArray(productosVistos)) {
    return res.status(400).json({
      success: false,
      error: 'Formato de productos inválido'
    });
  }

  // En producción: guardar en BD para análisis
  console.log(`[TRACKING] Usuario ${req.userId} - Productos vistos:`, productosVistos.map(p => p.id));

  res.json({
    success: true,
    message: 'Productos vistos registrados'
  });
});

// ============================================
// ENDPOINT 6: LOGOUT
// POST /api/logout
// Invalida el token del usuario
// Requiere autenticación
// ============================================
app.post('/api/logout', middlewareAutenticacion, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  // Eliminar token del almacén
  tokensActivos.delete(token);
  
  console.log(`[LOGOUT] Usuario ${req.userId} cerró sesión`);

  res.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

// ============================================
// ENDPOINT 7: OBTENER CATEGORÍAS
// GET /api/categorias
// Devuelve solo las categorías (protegido)
// Requiere autenticación
// ============================================
app.get('/api/categorias', middlewareAutenticacion, (req, res) => {
  const datosTienda = leerJSON('tienda.json');
  
  if (!datosTienda) {
    return res.status(500).json({
      success: false,
      error: 'Error al cargar categorías'
    });
  }

  res.json({
    success: true,
    categorias: datosTienda.categorias
  });
});

// ============================================
// ENDPOINT 8: OBTENER PRODUCTOS
// GET /api/productos
// Devuelve todos los productos o filtrados por categoría
// Requiere autenticación
// ============================================
app.get('/api/productos', middlewareAutenticacion, (req, res) => {
  const { categoria } = req.query;
  
  const datosTienda = leerJSON('tienda.json');
  
  if (!datosTienda) {
    return res.status(500).json({
      success: false,
      error: 'Error al cargar productos'
    });
  }

  let productos = datosTienda.productos;

  // Filtrar por categoría si se especifica
  if (categoria) {
    productos = productos.filter(p => p.id_categoria === parseInt(categoria));
  }

  res.json({
    success: true,
    productos: productos
  });
});

// ============================================
// ENDPOINT 9: OBTENER PRODUCTO POR ID
// GET /api/productos/:id
// Devuelve un producto específico
// Requiere autenticación
// ============================================
app.get('/api/productos/:id', middlewareAutenticacion, (req, res) => {
  const productId = parseInt(req.params.id);
  
  const datosTienda = leerJSON('tienda.json');
  
  if (!datosTienda) {
    return res.status(500).json({
      success: false,
      error: 'Error al cargar producto'
    });
  }

  const producto = datosTienda.productos.find(p => p.id === productId);

  if (!producto) {
    return res.status(404).json({
      success: false,
      error: 'Producto no encontrado'
    });
  }

  res.json({
    success: true,
    producto: producto
  });
});

// ============================================
// LIMPIAR TOKENS EXPIRADOS (cada hora)
// ============================================
setInterval(() => {
  const ahora = Date.now();
  let tokensEliminados = 0;

  for (const [token, data] of tokensActivos.entries()) {
    if (ahora > data.expiresAt) {
      tokensActivos.delete(token);
      tokensEliminados++;
    }
  }

  if (tokensEliminados > 0) {
    console.log(`[LIMPIEZA] ${tokensEliminados} tokens expirados eliminados`);
  }
}, 60 * 60 * 1000); // Cada hora

//

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});
🛒 Tienda Online - API REST con Cliente HTML
Aplicación web completa de comercio desarrollada con Node.js en el backend y HTML/SCSS/JavaScript vanilla en el frontend, utilizando LocalStorage para la gestión del estado del cliente.
📋 Descripción del Proyecto
Este proyecto implementa una tienda online funcional con sistema de autenticación, gestión de productos, categorías y carrito de compras. La arquitectura está diseñada para minimizar las consultas al servidor almacenando los datos de la tienda en el navegador del cliente tras la autenticación.
Características Principales

🔐 Sistema de Autenticación: Login con tokens de seguridad
🛍️ Gestión de Productos: Catálogo completo con categorías y productos destacados
🛒 Carrito de Compras: Sistema de carrito persistente en LocalStorage
📊 Dashboard Interactivo: Panel de control con productos destacados
🔍 Productos Vistos: Historial de navegación del usuario
✅ Validación de Precios: El servidor valida los precios del carrito para evitar manipulaciones
📱 Diseño Responsivo.

🛠️ Tecnologías Utilizadas
Backend

Node.js: Entorno de ejecución del servidor
Express.js: Framework para la API REST
JSON: Almacenamiento de datos (usuarios.json, tienda.json)

Frontend

HTML5: Estructura de las páginas
SCSS: Estilos y diseño responsivo

Variables CSS (variables.scss)
Mixins para componentes reutilizables


JavaScript (ES6+): Lógica del cliente

Fetch API para comunicación con el servidor
LocalStorage para persistencia de datos
Módulos JS para organización del código
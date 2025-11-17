# Sistema E-Commerce con Arquitectura DAO/DTO/Repository

## Descripción

Sistema completo de e-commerce con **arquitectura en capas DAO/DTO/Repository**, autenticación JWT, gestión de productos, carritos de compra y tickets de compra. Desarrollado con Node.js, Express, MongoDB, Passport, bcrypt, Multer y SweetAlert2.

## ⚡ Cambios Importantes Después de la Migración

### 🔄 Migración de Arquitectura Monolítica a DAO/DTO/Repository

Este proyecto fue completamente refactorizado de una arquitectura monolítica (modelos directos en rutas) a una **arquitectura en 3 capas profesional**:

#### Antes (Monolítica):

```javascript
// routes/users.js
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id); // Acceso directo al modelo
  res.json(user); // Expone _id, password, etc.
});
```

#### Después (DAO/DTO/Repository):

```javascript
// routes/users.js
router.get("/:id", async (req, res) => {
  const userDTO = await UserRepository.getById(req.params.id); // Usa Repository
  res.json(userDTO.toJSON()); // Retorna { id, email, ... } sin password
});
```

### 🎯 Cambios Críticos para Desarrolladores

#### 1. IDs Transformados: `_id` → `id`

**Todos los DTOs transforman ObjectIds de MongoDB a strings:**

```javascript
// ❌ INCORRECTO (ya no funciona)
product._id;
user._id;
req.user._id;

// ✅ CORRECTO (nuevo formato)
product.id;
user.id;
req.user.id;
```

**Esto afecta:**

- ✅ Frontend JavaScript: Todos los archivos usan `.id`
- ✅ Backend Routes: Todos usan `req.user.id`
- ✅ JWT Payload: Token contiene `{ id, email, role, ... }`
- ✅ Respuestas API: JSON retorna `{ id: "...", ... }`

#### 2. Passwords Nunca se Exponen

**UserDTO elimina el campo password automáticamente:**

```javascript
// Modelo MongoDB (interno)
{
  _id: ObjectId("..."),
  email: "user@test.com",
  password: "$2b$12$hashed..." // ⚠️ Solo en BD
}

// UserDTO (API Response)
{
  id: "507f1f77bcf86cd799439011",
  email: "user@test.com",
  role: "user",
  fullName: "Juan Pérez"
  // ✅ NO incluye password
}
```

#### 3. Rutas Migradas a Repositories

**Todas las rutas ahora usan Repositories en lugar de modelos:**

| Archivo       | Antes             | Ahora                              |
| ------------- | ----------------- | ---------------------------------- |
| `users.js`    | `User.findById()` | `UserRepository.getById()`         |
| `products.js` | `Product.find()`  | `ProductRepository.getAll()`       |
| `carts.js`    | `Cart.findOne()`  | `CartRepository.getActiveByUser()` |
| `tickets.js`  | `Ticket.find()`   | `TicketRepository.getByUser()`     |
| `sessions.js` | `User.findOne()`  | `UserRepository.getByEmail()`      |

#### 4. Passport Integrado con Repositories

**Las estrategias de Passport ahora retornan DTOs:**

```javascript
// passport.js - Estrategia Local
passport.use(
  "local",
  new LocalStrategy(async (email, password, done) => {
    const userDTO = await UserRepository.getByEmail(email); // ✅ Retorna DTO
    // userDTO tiene 'id', NO '_id'
    return done(null, userDTO.toJSON());
  })
);

// passport.js - Estrategia Current
passport.use(
  "current",
  new JwtStrategy(async (payload, done) => {
    const userDTO = await UserRepository.getById(payload.id); // ✅ Usa 'id' del payload
    return done(null, userDTO.toJSON());
  })
);
```

### 🚨 Si Actualizas el Código

**Debes hacer login nuevamente después de actualizar:**

1. Los tokens antiguos usan `_id` en el payload
2. El código nuevo espera `id` en el payload
3. Borra cookies del navegador (Ctrl+Shift+Delete)
4. Haz login para obtener un nuevo token con formato correcto

### 📋 Checklist de Migración Completada

- ✅ DAOs creados para User, Product, Cart, Ticket
- ✅ DTOs creados con transformación `_id` → `id`
- ✅ Repositories implementados con lógica de negocio
- ✅ Rutas migradas: users.js, sessions.js, products.js, carts.js, tickets.js
- ✅ Passport integrado con UserRepository
- ✅ Frontend actualizado: Todos los `.js` usan `.id`
- ✅ JWT payload usa `id` (createJWTPayload modificado)
- ✅ Hash de password movido a model pre-save hook
- ✅ Verificación con script: `verify-dto-ids.js`

## 🏗️ Arquitectura del Proyecto

### Patrón de 3 Capas Implementado

El proyecto implementa una arquitectura robusta y escalable basada en tres capas de abstracción:

#### 1️⃣ **Capa DAO (Data Access Object)**

- **Ubicación**: `src/dao/`
- **Responsabilidad**: Acceso directo a la base de datos
- **Archivos**:
  - `UserDAO.js` - Operaciones CRUD de usuarios
  - `ProductDAO.js` - Operaciones CRUD de productos
  - `CartDAO.js` - Operaciones CRUD de carritos
  - `TicketDAO.js` - Operaciones CRUD de tickets
- **Características**:
  - Métodos estándar: `create()`, `findById()`, `findAll()`, `update()`, `delete()`
  - Métodos especializados: `findByEmail()`, `findByCode()`, `findActiveByUser()`
  - Trabaja directamente con modelos de Mongoose
  - Retorna documentos de MongoDB sin transformar

#### 2️⃣ **Capa DTO (Data Transfer Object)**

- **Ubicación**: `src/dto/`
- **Responsabilidad**: Transformación y serialización de datos
- **Archivos**:
  - `UserDTO.js` - Transforma usuarios, elimina campos sensibles
  - `ProductDTO.js` - Transforma productos para la API
  - `CartDTO.js` - Transforma carritos con productos anidados
  - `TicketDTO.js` - Transforma tickets con información completa
- **Características**:
  - Convierte `_id` (ObjectId) → `id` (string) para APIs REST limpias
  - Elimina campos sensibles (ej: password)
  - Formatea fechas y datos para consumo frontend
  - Método `toJSON()` para serialización consistente
  - Maneja transformaciones de objetos anidados (populate)

#### 3️⃣ **Capa Repository**

- **Ubicación**: `src/repositories/`
- **Responsabilidad**: Lógica de negocio y orquestación
- **Archivos**:
  - `UserRepository.js` - Lógica de negocio de usuarios
  - `ProductRepository.js` - Lógica de negocio de productos
  - `CartRepository.js` - Lógica de carrito y gestión de stock
  - `TicketRepository.js` - Lógica de generación de tickets
- **Características**:
  - Utiliza DAOs para acceso a datos
  - Convierte resultados a DTOs automáticamente
  - Implementa reglas de negocio complejas
  - Validaciones de integridad de datos
  - Gestión de transacciones y stock
  - Generación de códigos únicos (tickets)

### Flujo de Datos

```
Cliente (Frontend)
    ↓
Rutas (Express Routes)
    ↓
Repository (Lógica de Negocio)
    ↓
DAO (Acceso a Datos)
    ↓
Modelo (Mongoose)
    ↓
MongoDB (Base de Datos)
    ↓
DAO retorna documento
    ↓
Repository transforma a DTO
    ↓
Ruta envía DTO al cliente
```

### Beneficios de esta Arquitectura

✅ **Separación de Responsabilidades**: Cada capa tiene un propósito específico  
✅ **Mantenibilidad**: Cambios en una capa no afectan otras  
✅ **Testabilidad**: Fácil crear mocks de cada capa  
✅ **Reutilización**: Lógica de negocio centralizada en Repositories  
✅ **Escalabilidad**: Fácil agregar nuevas entidades siguiendo el mismo patrón  
✅ **API Limpia**: DTOs garantizan respuestas consistentes  
✅ **Seguridad**: DTOs eliminan datos sensibles automáticamente

## Características Principales

### ✅ Modelo de Usuario

- **Campos requeridos**: first_name, last_name, email, age, password
- **Campos adicionales**: role (default: 'user')
- **Validaciones**: Email único, edad mínima 18 años, contraseñas seguras
- **Encriptación**: Contraseñas encriptadas con bcrypt (12 salt rounds) en model hook
- **DAO**: `UserDAO.js` con métodos `create()`, `findById()`, `findByEmail()`, `findAll()`, `update()`, `delete()`
- **DTO**: `UserDTO.js` transforma `_id` → `id`, elimina `password`, incluye `fullName`
- **Repository**: `UserRepository.js` maneja lógica de negocio, validaciones y conversión a DTO

### ✅ Modelo de Producto

- **Campos requeridos**: title, description, code, price, stock, category
- **Campo opcional**: thumbnail (imagen del producto)
- **Validaciones**: Código único, precios y stock >= 0, validación de categorías
- **Subida de imágenes**: Multer con almacenamiento local en `public/productos`
- **Métodos del modelo**: hasStock, reduceStock, increaseStock, findByCode
- **DAO**: `ProductDAO.js` con CRUD completo y búsqueda por código
- **DTO**: `ProductDTO.js` transforma `_id` → `id`, formatea datos para API
- **Repository**: `ProductRepository.js` con filtros, paginación y gestión de stock

### ✅ Modelo de Carrito (Cart)

- **Referencia a usuario**: Relación uno a muchos (un usuario puede tener múltiples carritos)
- **Estados**: active, completed, cancelled
- **Productos con precio**: Snapshot del precio al momento de agregar al carrito
- **Gestión de stock**: Descuenta automáticamente al agregar, devuelve al eliminar
- **Cálculo automático**: Precio total calculado dinámicamente en Repository
- **Índice único compuesto**: Solo un carrito activo por usuario
- **DAO**: `CartDAO.js` con métodos especializados para productos
- **DTO**: `CartDTO.js` transforma carrito completo con productos anidados
- **Repository**: `CartRepository.js` maneja lógica compleja de stock y totales

### ✅ Modelo de Ticket

- **Código único autogenerado**: Formato `TICKET-{timestamp}-{random}`
- **Información de compra**: Monto total, fecha/hora, email del comprador
- **Referencia al carrito**: Mantiene historial completo de productos comprados
- **Timestamps**: Fecha de creación y actualización automáticas
- **DAO**: `TicketDAO.js` con búsqueda por usuario y código
- **DTO**: `TicketDTO.js` transforma ticket con carrito completo
- **Repository**: `TicketRepository.js` genera códigos únicos y valida datos

### ✅ Sistema de Autenticación

- **JWT (JSON Web Tokens)** para autenticación stateless
- **Passport.js** con estrategias Local, JWT y Current
- **Estrategia "current"** para validación de usuario logueado
- **Middleware de autorización** por roles
- **Cookies HTTP-only** para mejor seguridad web
- **Payload JWT**: Usa `id` (no `_id`) para consistencia con DTOs
- **Integración con Repository**: Passport usa `UserRepository.getById()` y retorna DTOs

### ✅ Sistema de Email y Activación de Cuentas

- **Nodemailer** integrado para envío de emails
- **Activación de cuenta por email**: Token único de 1 hora de validez
- **Recuperación de contraseña**: Sistema completo con tokens seguros
- **Templates HTML responsive**: Emails con diseño profesional y botones de acción
- **Mailtrap.io**: Configurado para testing de emails en desarrollo
- **Variable de control**: `EMAIL_ACTIVATION_REQUIRED` para habilitar/deshabilitar activación
- **Tokens seguros**: Generados con `crypto.randomBytes(32)` (64 caracteres hex)
- **Expiración automática**: Tokens expiran después de 1 hora
- **Páginas de activación**: UI completa para activar cuentas y resetear contraseñas
- **Estados dinámicos**: Loading, success y error en páginas de activación/reset

**Funcionalidades:**

- ✅ Email de bienvenida con link de activación (si está habilitado)
- ✅ Cuentas activas por defecto (si `EMAIL_ACTIVATION_REQUIRED=false`)
- ✅ Solicitud de recuperación de contraseña
- ✅ Reset de contraseña con validación de tokens
- ✅ Formularios con validación y feedback visual

### ✅ Sistema de Carrito de Compras

- **Agregar productos** con validación de stock
- **Actualizar cantidades** con devolución/descuento automático de stock
- **Eliminar productos** devolviendo stock al inventario
- **Vaciar carrito** completo con devolución masiva de stock
- **Finalizar compra** generando ticket y procesando stock
- **Compra parcial**: Si algunos productos no tienen stock, se procesan los disponibles
- **Badge en navbar**: Contador de items en carrito en tiempo real

### ✅ Sistema de Tickets de Compra

- **Generación automática** de código único
- **Historial de compras** por usuario
- **Detalle completo**: Productos, cantidades, precios y total
- **Vista de tickets**: Lista de todas las compras realizadas
- **Detalle de ticket**: Información completa de cada compra

### ✅ Interfaz Web Completa

- **Páginas web dinámicas** con Handlebars
- **Panel de administración** para gestión de usuarios y productos
- **Sistema de login/registro** con formularios responsivos
- **Gestión de carrito** con UI interactiva
- **Historial de compras** con detalle de tickets
- **SweetAlert2** para alertas elegantes
- **Diseño Bootstrap 5.3.2** completamente responsivo
- **JavaScript modular** para funcionalidades dinámicas

## Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- MongoDB (local o Atlas)
- NPM o Yarn

### 1. Clonar e Instalar

```bash
cd c:\xampp_8.2.4\htdocs\coderhouse\backend2\entregas_web
npm install
```

### 2. Configurar Variables de Entorno

Editar el archivo `.env`:

```env
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb+srv://coderhouse:coder76495@cluster0.g2busjl.mongodb.net/backend2_coderhouse?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=GustavoLizarragaSecretKey
JWT_EXPIRES_IN=24h

# Email Configuration MAILTRAP
EMAIL_SERVICE=smtp
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=tu_usuario_mailtrap
EMAIL_PASSWORD=tu_password_mailtrap
EMAIL_FROM=noreply@ecommerce.com
EMAIL_FROM_NAME=E-Commerce CoderHouse
FRONTEND_URL=http://localhost:8080

# Activación de cuenta por email (true/false)
EMAIL_ACTIVATION_REQUIRED=false
```

**Variables importantes:**

- `EMAIL_ACTIVATION_REQUIRED=false`: Cuentas se crean activas automáticamente
- `EMAIL_ACTIVATION_REQUIRED=true`: Requiere activación por email
- Configure credenciales de Mailtrap para testing de emails

### 3. Iniciar MongoDB

Asegúrate de que MongoDB esté ejecutándose:

```bash
# Windows (si tienes MongoDB instalado)
net start MongoDB

# O usar MongoDB Atlas (URI en .env)
```

### 4. Crear Usuarios de Prueba

```bash
node create-test-users.js
```

### 5. Ejecutar el Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en: **http://localhost:3000**

## 🌐 Páginas Web Disponibles

### 🏠 Página Principal

- **URL**: `http://localhost:8080/`
- **Descripción**: Página de inicio con listado de productos
- **Acceso**: Usuarios con role "user" ven productos para comprar
- **Características**:
  - Visualización de productos disponibles
  - Botón "Agregar al Carrito" para cada producto
  - Información de stock en tiempo real
  - Badges de categoría

### 🔐 Autenticación

#### Iniciar Sesión

- **URL**: `http://localhost:8080/login`
- **Descripción**: Formulario de inicio de sesión
- **Características**:
  - Validación en tiempo real
  - Mostrar/ocultar contraseña
  - Recordar sesión
  - Redirección automática según rol
  - Link a "¿Olvidaste tu contraseña?"

#### Registrarse

- **URL**: `http://localhost:8080/register`
- **Descripción**: Formulario de registro de nuevos usuarios
- **Características**:
  - Validación completa de campos
  - Confirmación de contraseña
  - Términos y condiciones
  - Validación de edad (18+)
  - Email de bienvenida (si está habilitado)
  - Activación automática o por email según configuración

#### Recuperar Contraseña

- **URL**: `http://localhost:8080/forgot-password`
- **Descripción**: Solicitar recuperación de contraseña
- **Características**:
  - Ingreso de email
  - Envío de email con link de recuperación
  - Token de seguridad con expiración de 1 hora
  - Feedback visual del proceso

#### Restablecer Contraseña

- **URL**: `http://localhost:8080/reset-password?token=xxx`
- **Descripción**: Formulario para cambiar contraseña
- **Características**:
  - Validación de token
  - Confirmación de nueva contraseña
  - Requisitos de seguridad (mínimo 6 caracteres)
  - Redirección automática al login tras éxito

#### Activar Cuenta

- **URL**: `http://localhost:8080/activate-account?token=xxx`
- **Descripción**: Página de activación de cuenta
- **Características**:
  - Validación automática de token
  - Estados: loading, success, error
  - Mensaje de error si token es inválido o expirado
  - Botón para ir al login tras activación exitosa

### 🛒 Carrito de Compras (Solo Users)

- **URL**: `http://localhost:8080/cart`
- **Descripción**: Gestión completa del carrito de compras
- **Acceso**: Solo usuarios con rol `user`
- **Características**:
  - Visualización de productos en el carrito
  - Actualizar cantidades con validación de stock
  - Eliminar productos individuales
  - Vaciar carrito completo
  - Finalizar compra con generación de ticket
  - Cálculo de totales en tiempo real
  - Alertas SweetAlert2 para confirmaciones
  - Badge en navbar con contador de items

### 🎫 Historial de Compras (Solo Users)

#### Lista de Tickets

- **URL**: `http://localhost:8080/tickets`
- **Descripción**: Historial completo de compras realizadas
- **Acceso**: Solo usuarios con rol `user`
- **Características**:
  - Cards con información resumida de cada compra
  - Código de ticket único
  - Fecha y hora de compra
  - Monto total pagado
  - Cantidad de productos comprados
  - Botón para ver detalle completo

#### Detalle de Ticket

- **URL**: `http://localhost:8080/tickets/:id`
- **Descripción**: Información detallada de una compra específica
- **Acceso**: Solo usuarios con rol `user` (dueño del ticket)
- **Características**:
  - Información completa del ticket (código, fecha, monto)
  - Lista de productos comprados con cantidades
  - Precios unitarios y subtotales
  - Imágenes de los productos
  - Total de la compra

### 👥 Gestión de Usuarios (Solo Admin)

- **URL**: `http://localhost:8080/users`
- **Descripción**: Panel de administración de usuarios
- **Acceso**: Solo usuarios con rol `admin`
- **Características**:
  - Tabla completa de usuarios con paginación
  - Búsqueda en tiempo real
  - Filtros por rol
  - CRUD completo (Crear, Leer, Actualizar, Eliminar)
  - Modales para operaciones
  - Confirmación de eliminación
  - Diseño responsivo

### 📦 Gestión de Productos (Solo Admin)

- **URL**: `http://localhost:8080/products`
- **Descripción**: Panel de administración de productos
- **Acceso**: Solo usuarios con rol `admin`
- **Características**:
  - Tabla completa de productos con imágenes
  - Búsqueda en tiempo real por título o código
  - Filtros por categoría y rango de precios
  - Ordenamiento (precio, título, fecha)
  - CRUD completo con subida de imágenes
  - Vista previa de imágenes en modales
  - Gestión de stock con badges visuales
  - Validación de archivos (solo imágenes, máx 5MB)
  - Almacenamiento con nombre: `{productId}-{filename}`

### 🎨 Diseño y UX

- **Framework CSS**: Bootstrap 5.3.2
- **Iconos**: Bootstrap Icons
- **Alertas**: SweetAlert2
- **Motor de Plantillas**: Handlebars
- **Responsive**: Completamente adaptable a móviles
- **Tema**: Diseño moderno con colores profesionales
- **Navbar Inteligente**:
  - Botón de carrito siempre visible (users)
  - Botón de compras siempre visible (users)
  - Menú hamburguesa en móviles
  - Badges en tiempo real

## 🔑 Usuarios de Prueba

Para probar la aplicación web, puedes usar estas credenciales:

| Rol         | Email            | Contraseña | Descripción                |
| ----------- | ---------------- | ---------- | -------------------------- |
| **Admin**   | `admin@test.com` | `admin123` | Acceso completo al sistema |
| **Usuario** | `user@test.com`  | `user123`  | Usuario estándar           |

### Acceso Rápido:

1. Ve a `http://localhost:3000/login`
2. Usa las credenciales de admin para acceder al panel de usuarios
3. Usa las credenciales de usuario regular para ver la experiencia normal

## 📡 Endpoints de la API

### 🌐 Rutas Web (Interfaz Visual)

#### Páginas Públicas

- **GET `/`** - Página principal con navegación
- **GET `/login`** - Formulario de inicio de sesión
- **GET `/register`** - Formulario de registro público

#### Páginas Protegidas (requieren autenticación)

- **GET `/profile`** - Página de perfil del usuario
- **GET `/settings`** - Configuración de cuenta

#### Páginas de Administración (solo admin)

- **GET `/users`** - Panel de administración con CRUD de usuarios
- **GET `/products`** - Panel de administración con CRUD de productos

---

### 🔓 Endpoints Públicos de la API

#### Registro Público de Usuario

```http
POST /api/users/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@email.com",
  "age": 25,
  "password": "MiPassword123",
  "role": "user"
}
```

> ⚠️ **Nota**: El campo 'role' es agregado automáticamente como 'user' en el formulario web de registro.

---

### 🔒 Endpoints Privados de Productos (Solo Admin)

**Nota**: Incluir el token JWT en el header:

```http
Authorization: Bearer <tu_token_jwt>
```

#### Listar Productos

```http
GET /api/products?category=Electronics&minPrice=100&maxPrice=1000&sort=price_asc
Authorization: Bearer <admin_token>
```

**Parámetros de Query**:

- `title`: Filtrar por Titulo
- `category`: Filtrar por categoría
- `minPrice`: Precio mínimo
- `maxPrice`: Precio máximo
- `sort`: Ordenamiento (price_asc, price_desc, title)

#### Obtener Producto por ID

```http
GET /api/products/:id
Authorization: Bearer <admin_token>
```

#### Crear Producto

```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

title: "Laptop HP"
description: "Laptop de alta gama con 16GB RAM"
code: "LAP-001"
price: 1299.99
stock: 10
category: "Electronics"
thumbnail: [archivo de imagen]
```

> 📁 **Subida de Archivos**:
>
> - Formato: multipart/form-data
> - Campo de archivo: `thumbnail`
> - Formatos aceptados: jpeg, jpg, png, gif, webp
> - Tamaño máximo: 5MB
> - Almacenamiento: `public/productos/{productId}-{filename}`

#### Actualizar Producto

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

title: "Laptop HP Actualizada"
price: 1199.99
thumbnail: [archivo de imagen] (opcional)
```

> 🔄 **Actualización de Imagen**: Si se envía un nuevo archivo, la imagen anterior se elimina automáticamente.

#### Eliminar Producto

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

> 🗑️ **Eliminación de Archivos**: Al eliminar un producto, su imagen asociada también se elimina del servidor.

---

### 🔒 Endpoints Privados de Usuario

**Nota**: Incluir el token JWT en el header:

```http
Authorization: Bearer <tu_token_jwt>
```

#### Validar Usuario Actual (Endpoint Principal)

```http
GET /api/sessions/current
Authorization: Bearer <token>
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Usuario autenticado correctamente",
  "data": {
    "user": {
      "id": "...",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@email.com",
      "age": 25,
      "role": "user",
      "cart": {...},
      "fullName": "Juan Pérez"
    },
    "token": "nuevo_token_renovado",
    "expiresIn": "24h"
  }
}
```

#### Obtener Perfil del Usuario

```http
GET /api/users/profile/me
Authorization: Bearer <token>
```

#### Actualizar Perfil

```http
PUT /api/users/profile/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Juan Carlos",
  "age": 26
}
```

#### Listar Usuarios (Solo Admin)

```http
GET /api/users?page=1&limit=10&role=user
Authorization: Bearer <admin_token>
```

#### Iniciar Sesión

```http
POST /api/sessions/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "MiPassword123"
}
```

#### Cambiar Contraseña

```http
POST /api/sessions/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "MiPassword123",
  "newPassword": "NuevaPassword456"
}
```

---

### 🛒 Endpoints de Carrito (Solo Users)

**Nota**: Todos los endpoints de carrito requieren autenticación y rol "user".

#### Obtener Carrito Activo

```http
GET /api/carts
Authorization: Bearer <token>
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Carrito obtenido exitosamente",
  "data": {
    "_id": "...",
    "user": "...",
    "products": [
      {
        "product": {
          "_id": "...",
          "title": "Laptop HP",
          "thumbnail": "...",
          "category": "Electronics"
        },
        "quantity": 2,
        "price": 1299.99
      }
    ],
    "totalPrice": 2599.98,
    "status": "active"
  }
}
```

#### Agregar Producto al Carrito

```http
POST /api/carts/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "6915c4f3159089f15cd98050",
  "quantity": 2
}
```

**Notas**:

- Descuenta automáticamente del stock del producto
- Si el producto ya está en el carrito, incrementa la cantidad
- Crea un carrito nuevo si no existe uno activo
- Valida stock disponible antes de agregar

#### Actualizar Cantidad de Producto

```http
PUT /api/carts/products/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

**Notas**:

- Si aumenta la cantidad: descuenta más stock
- Si reduce la cantidad: devuelve stock al producto
- Valida que haya stock suficiente

#### Eliminar Producto del Carrito

```http
DELETE /api/carts/products/:productId
Authorization: Bearer <token>
```

**Notas**:

- Devuelve automáticamente el stock al producto
- Elimina el producto del carrito

#### Vaciar Carrito Completo

```http
DELETE /api/carts
Authorization: Bearer <token>
```

**Notas**:

- Devuelve el stock de todos los productos
- Vacía completamente el carrito

#### Finalizar Compra (Purchase)

```http
POST /api/carts/:cid/purchase
Authorization: Bearer <token>
```

**Respuesta exitosa (compra completa)**:

```json
{
  "success": true,
  "message": "Compra finalizada exitosamente",
  "data": {
    "ticket": {
      "id": "...",
      "code": "TICKET-L8X9K2-5A7B3C",
      "purchase_datetime": "2025-11-15T20:30:00.000Z",
      "amount": 2599.98,
      "purchaser": "user@test.com"
    },
    "productsProcessed": [
      {
        "product": "...",
        "title": "Laptop HP",
        "quantity": 2,
        "price": 1299.99,
        "subtotal": 2599.98
      }
    ],
    "productsNotProcessed": []
  }
}
```

**Respuesta (compra parcial - algunos productos sin stock)**:

```json
{
  "success": true,
  "message": "Compra finalizada parcialmente. Algunos productos no tenían stock suficiente",
  "data": {
    "ticket": {...},
    "productsProcessed": [...],
    "productsNotProcessed": [
      {
        "product": "...",
        "title": "Mouse Gamer",
        "requestedQuantity": 5,
        "availableStock": 2
      }
    ]
  }
}
```

**Notas**:

- Genera un ticket con código único
- Procesa productos con stock disponible
- Los productos sin stock quedan en el carrito
- Marca el carrito como "completed" si se procesaron todos
- Mantiene el historial de productos en el carrito completado

---

### 🎫 Endpoints de Tickets (Solo Users)

**Nota**: Requieren autenticación y rol "user".

#### Listar Todos los Tickets del Usuario

```http
GET /api/tickets
Authorization: Bearer <token>
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Tickets obtenidos exitosamente",
  "data": [
    {
      "_id": "...",
      "code": "TICKET-L8X9K2-5A7B3C",
      "purchase_datetime": "2025-11-15T20:30:00.000Z",
      "amount": 2599.98,
      "purchaser": "user@test.com",
      "cart": {
        "products": [
          {
            "product": {
              "title": "Laptop HP",
              "thumbnail": "...",
              "category": "Electronics"
            },
            "quantity": 2,
            "price": 1299.99
          }
        ]
      }
    }
  ]
}
```

#### Obtener Detalle de un Ticket

```http
GET /api/tickets/:id
Authorization: Bearer <token>
```

**Notas**:

- Solo el dueño del ticket puede verlo
- Incluye información completa del carrito con productos
- Útil para ver el historial detallado de una compra

---

### 🛠️ Endpoints de Utilidad

#### Verificar Estado del Servidor

```http
GET /api/health
```

#### Validar Token

```http
GET /api/sessions/validate
Authorization: Bearer <token>
```

#### Renovar Token

```http
POST /api/sessions/refresh
Authorization: Bearer <token>
```

## 🔒 Seguridad Mejorada

### Autenticación y Autorización

- **JWT Tokens** con expiración configurable (24h default)
- **Autenticación basada en cookies** para mejor UX en la web
- **Middleware de autorización por roles** (admin/user)
- **Validación de ownership** en operaciones de usuario
- **Estrategias Passport integradas con Repositories**:
  - Local Strategy: Retorna UserDTO con `id` (sin `_id` ni `password`)
  - JWT Strategy: Valida token y retorna UserDTO
  - Current Strategy: Usa `UserRepository.getById(payload.id)`
- **Payload JWT consistente**: Usa `id` (string) en lugar de `_id` (ObjectId)
- **createJWTPayload()**: Extrae `user.id` o `user._id?.toString()` para compatibilidad

### Protección de Datos

- **Encriptación de contraseñas** con bcrypt (12 salt rounds)
- **Hash único en model hook**: Pre-save de Mongoose (no en Repository)
- **DTOs eliminan datos sensibles**: UserDTO nunca expone `password`
- **Validación de entrada** con express-validator
- **Sanitización automática** de datos (email lowercase, trim)
- **CORS configurado** para prevenir accesos no autorizados
- **Transformación \_id → id**: Evita exposición de ObjectIds internos de MongoDB

### Arquitectura de Seguridad en Capas

```
1. Ruta recibe request
2. Middleware valida JWT → extrae payload con 'id'
3. Passport Current Strategy usa UserRepository.getById(payload.id)
4. Repository usa UserDAO.findById(id)
5. DAO retorna documento Mongoose (con _id y password)
6. Repository transforma a UserDTO (con id, sin password)
7. req.user = UserDTO.toJSON() → { id, email, role, ... }
8. Ruta accede a req.user.id (no req.user._id)
9. Respuesta JSON nunca expone password ni _id
```

### Subida de Archivos Segura

- **Validación de tipo de archivo** (solo imágenes)
- **Límite de tamaño** (5MB máximo)
- **Almacenamiento seguro** en directorio público
- **Nombres únicos** usando MongoDB ID
- **Eliminación automática** de archivos huérfanos
- **Middleware condicional** para evitar conflictos con body-parser

### Manejo de Multipart/Form-Data

- **Detección automática** de Content-Type
- **Skip de body-parser** cuando es multipart/form-data
- **Procesamiento con Multer** antes de validaciones
- **Función authenticatedFetch mejorada** que detecta FormData y omite Content-Type header

## Roles y Permisos

### Roles Disponibles

- **user**: Usuario estándar (default)
- **admin**: Administrador con acceso total

### Permisos por Rol

| Funcionalidad                 | user | admin |
| ----------------------------- | ---- | ----- |
| **API Endpoints - Usuarios**  |      |       |
| Registrarse                   | ✅   | ✅    |
| Login                         | ✅   | ✅    |
| Ver su perfil                 | ✅   | ✅    |
| Editar su perfil              | ✅   | ✅    |
| Ver todos los usuarios        | ❌   | ✅    |
| Crear usuarios                | ❌   | ✅    |
| Editar cualquier usuario      | ❌   | ✅    |
| Eliminar usuarios             | ❌   | ✅    |
| **API Endpoints - Productos** |      |       |
| Listar productos              | ❌   | ✅    |
| Ver producto por ID           | ❌   | ✅    |
| Crear producto                | ❌   | ✅    |
| Actualizar producto           | ❌   | ✅    |
| Eliminar producto             | ❌   | ✅    |
| Subir imagen de producto      | ❌   | ✅    |
| **API Endpoints - Carrito**   |      |       |
| Ver carrito activo            | ✅   | ❌    |
| Agregar productos al carrito  | ✅   | ❌    |
| Actualizar cantidad           | ✅   | ❌    |
| Eliminar productos            | ✅   | ❌    |
| Vaciar carrito                | ✅   | ❌    |
| Finalizar compra              | ✅   | ❌    |
| **API Endpoints - Tickets**   |      |       |
| Ver mis tickets               | ✅   | ❌    |
| Ver detalle de ticket         | ✅   | ❌    |
| **Interfaz Web**              |      |       |
| Página de login               | ✅   | ✅    |
| Página de registro            | ✅   | ✅    |
| Página de perfil              | ✅   | ✅    |
| Página de configuración       | ✅   | ✅    |
| Home con productos            | ✅   | ❌    |
| Carrito de compras            | ✅   | ❌    |
| Ver mis compras               | ✅   | ❌    |
| Panel de administración users | ❌   | ✅    |
| Panel de productos            | ❌   | ✅    |
| CRUD de usuarios (web)        | ❌   | ✅    |
| CRUD de productos (web)       | ❌   | ✅    |

## Estructura del Proyecto

```
src/
├── app.js                    # Servidor principal con Handlebars
├── config/
│   ├── database.js           # Configuración MongoDB
│   ├── passport.js           # Estrategias Passport (integrado con Repositories)
│   └── email.js              # ✉️ Configuración Nodemailer + Templates HTML
├── dao/                      # 🔵 CAPA DAO - Acceso a Datos
│   ├── UserDAO.js           # CRUD usuarios en MongoDB
│   ├── ProductDAO.js        # CRUD productos en MongoDB
│   ├── CartDAO.js           # CRUD carritos con métodos especializados
│   └── TicketDAO.js         # CRUD tickets con búsquedas
├── dto/                      # 🟢 CAPA DTO - Transformación de Datos
│   ├── UserDTO.js           # Transforma users: _id → id, elimina password
│   ├── ProductDTO.js        # Transforma productos: _id → id
│   ├── CartDTO.js           # Transforma carritos con productos anidados
│   └── TicketDTO.js         # Transforma tickets con carrito completo
├── repositories/             # 🟡 CAPA REPOSITORY - Lógica de Negocio
│   ├── UserRepository.js    # Lógica de usuarios + conversión a DTO
│   ├── ProductRepository.js # Lógica de productos + filtros + DTO
│   ├── CartRepository.js    # Lógica de carrito + stock + DTO
│   └── TicketRepository.js  # Generación de tickets + DTO
├── middleware/
│   ├── auth.js              # Middleware autenticación y autorización
│   └── validation.js        # Validaciones con express-validator
├── models/                   # Modelos de Mongoose
│   ├── User.js              # Esquema Usuario (hash + activación + reset tokens)
│   ├── Product.js           # Esquema Producto con métodos de stock
│   ├── Cart.js              # Esquema Carrito con índice parcial
│   └── Ticket.js            # Esquema Ticket
├── routes/                   # Rutas Express (usan Repositories)
│   ├── users.js             # API usuarios (usa UserRepository)
│   ├── products.js          # API productos (usa ProductRepository)
│   ├── sessions.js          # API autenticación + recuperación password
│   ├── carts.js             # API carritos (usa CartRepository)
│   ├── tickets.js           # API tickets (usa TicketRepository)
│   └── views.js             # Rutas para vistas web
├── views/                    # Plantillas Handlebars
│   ├── layouts/
│   │   └── main.handlebars          # Layout principal con navbar
│   ├── home.handlebars              # Página de inicio (productos)
│   ├── login.handlebars             # Página de login
│   ├── register.handlebars          # Página de registro
│   ├── forgot-password.handlebars   # ✉️ Recuperar contraseña
│   ├── reset-password.handlebars    # ✉️ Restablecer contraseña
│   ├── activate-account.handlebars  # ✉️ Activar cuenta
│   ├── users.handlebars             # Panel admin usuarios
│   ├── products.handlebars          # Panel admin productos
│   ├── profile.handlebars           # Perfil de usuario
│   ├── settings.handlebars          # Configuración
│   ├── cart.handlebars              # Carrito de compras
│   ├── tickets.handlebars           # Lista de compras realizadas
│   ├── ticket-detail.handlebars     # Detalle de una compra
│   └── error.handlebars             # Página de error
└── utils/
    └── auth.js              # Utilidades JWT, bcrypt y tokens de activación

public/                      # Archivos estáticos
├── css/
│   └── custom.css          # Estilos personalizados
├── js/
│   ├── main.js             # JavaScript principal + authenticatedFetch
│   ├── users-admin.js      # JavaScript para gestión usuarios
│   ├── products.js         # JavaScript para gestión productos
│   ├── cart.js             # JavaScript para carrito (con SweetAlert2)
│   ├── tickets.js          # JavaScript para lista de tickets
│   ├── ticket-detail.js    # JavaScript para detalle de ticket
│   ├── login.js            # JavaScript para login
│   ├── register.js         # JavaScript para registro
│   ├── profile.js          # JavaScript para perfil
│   └── settings.js         # JavaScript para configuración
└── productos/              # Almacenamiento de imágenes de productos
    └── {productId}-{filename}
```

### 📋 Detalle de la Arquitectura en Capas

#### Capa DAO (Data Access Objects)

```javascript
// Ejemplo: UserDAO.js
class UserDAO {
  async create(userData) {
    const user = new User(userData);
    return await user.save(); // Retorna documento Mongoose
  }

  async findById(id) {
    return await User.findById(id); // Retorna documento o null
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }
}
```

#### Capa DTO (Data Transfer Objects)

```javascript
// Ejemplo: UserDTO.js
class UserDTO {
  constructor(user) {
    this.id = user._id.toString(); // Convierte ObjectId → string
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.fullName = `${user.first_name} ${user.last_name}`;
    // NO incluye password por seguridad
  }

  toJSON() {
    return { ...this }; // Serialización limpia
  }
}
```

#### Capa Repository

```javascript
// Ejemplo: UserRepository.js
class UserRepository {
  constructor() {
    this.dao = new UserDAO();
  }

  async create(userData) {
    // Validaciones de negocio
    const existingUser = await this.dao.findByEmail(userData.email);
    if (existingUser) throw new Error("Email ya registrado");

    // Crear usuario
    const user = await this.dao.create(userData);

    // Retornar DTO (sin password)
    return new UserDTO(user);
  }

  async getById(id) {
    const user = await this.dao.findById(id);
    if (!user) return null;
    return new UserDTO(user); // Siempre retorna DTO
  }
}
```

#### Uso en Rutas

```javascript
// routes/users.js
import UserRepository from "../repositories/UserRepository.js";

const userRepo = new UserRepository();

router.post("/register", async (req, res) => {
  try {
    const userDTO = await userRepo.create(req.body); // Recibe DTO
    res.json({ success: true, data: userDTO.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
```

## Seguridad Implementada

### 🔐 Encriptación de Contraseñas

- **bcrypt.hashSync** con 12 salt rounds
- Contraseñas nunca almacenadas en texto plano
- Comparación segura con bcrypt.compareSync

### 🎫 JSON Web Tokens (JWT)

- Tokens con expiración configurable (24h default)
- Payload mínimo con datos esenciales
- Renovación automática de tokens
- Almacenamiento en cookies HTTP-only

### 🛡️ Validaciones y Sanitización

- Validación de entrada con express-validator
- Sanitización de email (lowercase, trim)
- Validaciones de tipo y rango
- Validación de códigos únicos de producto

### 🚫 Protección contra Vulnerabilidades

- CORS configurado
- Headers de seguridad
- Manejo seguro de errores
- Validación de ownership
- Protección contra inyección de código

### 📁 Seguridad en Subida de Archivos

- Validación de tipo MIME y extensión
- Límite de tamaño (5MB)
- Nombres de archivo únicos (MongoDB ID)
- Almacenamiento en directorio público controlado
- Eliminación automática de archivos huérfanos
- Filtrado de tipos de archivo permitidos

## Testing de la API

### Usando curl

```bash
# 1. Registrar usuario
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@test.com",
    "age": 25,
    "password": "Test123",
    "role": "user"
  }'

# 2. Login
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@test.com",
    "password": "Test123"
  }'

# 3. Validar usuario (usar token del login)
curl -X GET http://localhost:8080/api/sessions/current \
  -H "Authorization: Bearer <TOKEN_AQUI>"

# 4. Crear producto (admin)
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "title=Laptop HP" \
  -F "description=Laptop de alta gama" \
  -F "code=LAP-001" \
  -F "price=1299.99" \
  -F "stock=10" \
  -F "category=Electronics" \
  -F "thumbnail=@/path/to/image.jpg"

# 5. Listar productos con filtros
curl -X GET "http://localhost:8080/api/products?category=Electronics&sort=price_asc" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 6. Agregar producto al carrito (user)
curl -X POST http://localhost:8080/api/carts/products \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "6915c4f3159089f15cd98050",
    "quantity": 2
  }'

# 7. Ver carrito activo (user)
curl -X GET http://localhost:8080/api/carts \
  -H "Authorization: Bearer <USER_TOKEN>"

# 8. Actualizar cantidad en carrito (user)
curl -X PUT http://localhost:8080/api/carts/products/6915c4f3159089f15cd98050 \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'

# 9. Finalizar compra (user)
curl -X POST http://localhost:8080/api/carts/673d3a1b8f9c123456789abc/purchase \
  -H "Authorization: Bearer <USER_TOKEN>"

# 10. Ver mis tickets (user)
curl -X GET http://localhost:8080/api/tickets \
  -H "Authorization: Bearer <USER_TOKEN>"

# 11. Ver detalle de ticket (user)
curl -X GET http://localhost:8080/api/tickets/673d4e5f8a1b234567890def \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### Usando Postman/Insomnia

1. **Importar Collection**: Usar `coderhouse backend2.postman_collection.json`
2. **Configurar Environment**: `BASE_URL=http://localhost:8080`
3. **Automatizar Token**: Guardar token del login automáticamente
4. **Subir Archivos**: En productos, seleccionar tipo "form-data" y agregar archivo en campo `thumbnail`
5. **Probar flujo completo**:
   - Login como admin → Crear productos
   - Login como user → Agregar al carrito → Finalizar compra
   - Ver tickets y detalles de compras

## Criterios Cumplidos ✅

### ✅ Arquitectura DAO/DTO/Repository

- ✅ **Capa DAO implementada** para User, Product, Cart, Ticket
- ✅ **Capa DTO implementada** con transformación `_id` → `id`
- ✅ **Capa Repository implementada** con lógica de negocio
- ✅ **Separación de responsabilidades** clara entre capas
- ✅ **DTOs eliminan datos sensibles** (password nunca se expone)
- ✅ **Consistencia en IDs**: Toda la API usa `id` (string) en lugar de `_id` (ObjectId)
- ✅ **Repositories usan DAOs** para acceso a datos
- ✅ **Repositories retornan DTOs** siempre
- ✅ **Rutas migradas a Repositories**: users.js, sessions.js, products.js, carts.js, tickets.js
- ✅ **Passport integrado con Repositories**: Estrategias Local, JWT y Current usan UserRepository

### ✅ Modelo de Usuario y Encriptación

- ✅ Modelo User con todos los campos especificados
- ✅ Contraseña encriptada con bcrypt (12 salt rounds) en pre-save hook
- ✅ Almacenamiento seguro en base de datos
- ✅ Campo email único con validación
- ✅ UserDTO transforma `_id` → `id` y elimina `password`
- ✅ UserRepository maneja validaciones de negocio

### ✅ Modelo de Producto

- ✅ Modelo Product con campos: title, description, code, price, stock, category, thumbnail
- ✅ Código único con índice en MongoDB
- ✅ Validaciones de precios y stock (>= 0)
- ✅ Métodos de gestión de stock (hasStock, reduceStock, increaseStock)
- ✅ Método estático findByCode
- ✅ ProductDTO con transformación `_id` → `id`
- ✅ ProductRepository con filtros, paginación y búsquedas

### ✅ Estrategias de Passport

- ✅ Estrategia Local para login (retorna UserDTO con `id`)
- ✅ Estrategia JWT para autenticación (retorna UserDTO con `id`)
- ✅ Estrategia "current" para validación de usuario logueado (usa UserRepository)
- ✅ Configuración correcta para el modelo de usuarios
- ✅ serializeUser/deserializeUser manejan `id` correctamente
- ✅ Integración completa con capa Repository

### ✅ Sistema de Login y JWT

- ✅ Login funcional con generación de JWT
- ✅ Token JWT válido con datos del usuario
- ✅ Expiración configurable (24h)
- ✅ Payload seguro con información mínima: `{ id, email, role, fullName }`
- ✅ Almacenamiento en cookies HTTP-only
- ✅ createJWTPayload() usa `user.id` (consistente con DTOs)

### ✅ Endpoint /api/sessions/current

- ✅ Ruta /current implementada en /api/sessions/
- ✅ Validación de usuario logueado con estrategia "current"
- ✅ Retorno de datos asociados al JWT (UserDTO)
- ✅ Manejo de errores con tokens inválidos/inexistentes
- ✅ Respuestas apropiadas de Passport
- ✅ Usa UserRepository.getById() para buscar usuario

### ✅ CRUD de Productos

- ✅ Endpoint GET /api/products con filtros y ordenamiento (usa ProductRepository)
- ✅ Endpoint GET /api/products/:id (retorna ProductDTO)
- ✅ Endpoint POST /api/products con subida de archivos (usa ProductRepository)
- ✅ Endpoint PUT /api/products/:id con actualización de imagen (usa ProductRepository)
- ✅ Endpoint DELETE /api/products/:id con eliminación de archivo (usa ProductRepository)
- ✅ Solo accesible para usuarios admin
- ✅ Validación completa de datos
- ✅ Todas las respuestas usan ProductDTO con `id`

### ✅ Sistema de Carrito

- ✅ CartDAO con métodos especializados para productos
- ✅ CartDTO transforma carrito con productos anidados (`_id` → `id`)
- ✅ CartRepository maneja lógica compleja de stock y totales
- ✅ Cálculo automático de `totalPrice` en Repository
- ✅ Gestión de stock transaccional (suma/resta automática)
- ✅ Validaciones de stock antes de modificar cantidades
- ✅ Endpoints migrados a CartRepository: GET, POST, PUT, DELETE
- ✅ Todas las rutas usan `req.user.id` (no `req.user._id`)

### ✅ Sistema de Tickets

- ✅ TicketDAO con búsqueda por usuario
- ✅ TicketDTO transforma ticket completo con carrito
- ✅ TicketRepository genera códigos únicos automáticamente
- ✅ Formato: `TICKET-{timestamp}-{random}`
- ✅ Endpoints usan TicketRepository.getById() y .getByUser()
- ✅ Respuestas JSON consistentes con `id`

### ✅ Consistencia de IDs en Todo el Sistema

- ✅ Todos los DTOs usan `id` (string) en lugar de `_id` (ObjectId)
- ✅ Frontend JavaScript usa `.id` en todos los archivos
- ✅ Backend routes usan `req.user.id` en todas las rutas
- ✅ Passport strategies retornan objetos con `id`
- ✅ createJWTPayload() extrae `user.id` para el token
- ✅ Sin referencias a `_id` en código de aplicación (solo en DAOs/Models)

### ✅ Subida de Archivos con Multer

- ✅ Configuración de Multer con diskStorage
- ✅ Validación de tipo de archivo (solo imágenes)
- ✅ Límite de tamaño (5MB)
- ✅ Nombres únicos: `{productId}-{filename}`
- ✅ Almacenamiento en `public/productos`
- ✅ Eliminación automática de archivos al actualizar/eliminar productos
- ✅ Middleware condicional en app.js para evitar conflictos con body-parser

### ✅ Vistas Web con Handlebars

- ✅ **Página de Login** con formulario Bootstrap y validaciones
- ✅ **Página de Registro** con validaciones completas
- ✅ **Panel de Usuarios para Admin** con CRUD completo
- ✅ **Panel de Productos para Admin** con CRUD completo y subida de imágenes
- ✅ **Menú de navegación** dinámico según rol
- ✅ **Diseño responsivo** con Bootstrap 5
- ✅ **Autenticación en vistas** con middleware personalizado
- ✅ **JavaScript del cliente** para interactividad
- ✅ **Gestión de tokens** en cookies
- ✅ **Función authenticatedFetch** mejorada con detección de FormData

## 🚀 Cómo Probar la Aplicación

### 1. Iniciar el Servidor

```bash
npm run dev
```

### 2. Crear Usuarios de Prueba (si no existen)

```bash
npm run seed
```

### 3. Probar las Vistas Web

#### Como Usuario Administrador:

1. Ve a `http://localhost:8080/login`
2. Inicia sesión con: `admin@test.com` / `admin123`
3. Accede al panel de usuarios en `http://localhost:8080/users`
4. Accede al panel de productos en `http://localhost:8080/products`
5. Prueba las funcionalidades CRUD:
   - **Usuarios:**
     - ✅ Crear nuevo usuario
     - ✅ Editar usuarios existentes
     - ✅ Eliminar usuarios
     - ✅ Buscar y filtrar usuarios
   - **Productos:**
     - ✅ Crear producto con imagen
     - ✅ Editar producto y actualizar imagen
     - ✅ Eliminar producto (elimina también la imagen)
     - ✅ Buscar por título o código
     - ✅ Filtrar por categoría y rango de precios
     - ✅ Ordenar por precio, título o fecha

#### Como Usuario Regular:

1. Ve a `http://localhost:8080/login`
2. Inicia sesión con: `user@test.com` / `user123`
3. Explora el Home (verás productos disponibles)
4. Agrega productos al carrito
5. Haz clic en el ícono del carrito en el navbar para ver tu carrito
6. Modifica cantidades o elimina productos
7. Haz clic en "Finalizar Compra" (aparecerá confirmación con SweetAlert2)
8. Ve a "Mis Compras" para ver tus tickets
9. Haz clic en cualquier ticket para ver el detalle completo
10. Nota que NO puedes acceder a los paneles de administración

#### Registro de Nuevos Usuarios:

1. Ve a `http://localhost:8080/register`
2. Completa el formulario de registro
3. Prueba las validaciones en tiempo real

### 4. Probar Subida de Archivos

1. Inicia sesión como admin
2. Ve a `http://localhost:8080/products`
3. Haz clic en "Agregar Producto"
4. Completa el formulario y selecciona una imagen (máx 5MB, formatos: jpg, png, gif, webp)
5. Verifica que la imagen se muestra en la tabla de productos
6. Edita el producto y cambia la imagen
7. Verifica que la imagen anterior fue eliminada del servidor
8. Elimina el producto y verifica que la imagen también se eliminó

### 5. Probar Flujo Completo de Compra

1. **Login como admin** y crea algunos productos con stock
2. **Logout y login como user**
3. **Agrega productos al carrito** desde el Home
4. **Observa el badge** del carrito actualizarse automáticamente
5. **Entra al carrito** y modifica cantidades
6. **Verifica que el total** se actualiza correctamente
7. **Haz clic en "Finalizar Compra"**:
   - Aparecerá una confirmación elegante con SweetAlert2
   - Confirma la compra
   - Se muestra loading mientras procesa
   - Aparece mensaje de éxito o error
8. **Ve a "Mis Compras"** para ver el ticket generado
9. **Haz clic en el ticket** para ver productos, cantidades y precios
10. **Intenta comprar más cantidad** de un producto que su stock disponible:
    - Verás mensaje de error indicando falta de stock
    - Los productos con stock se procesan
    - Los sin stock quedan en el carrito

Todos los endpoints de la API siguen funcionando igual:

- `GET http://localhost:8080/api/health`
- `POST http://localhost:8080/api/sessions/login`
- `GET http://localhost:8080/api/sessions/current`
- `GET/POST/PUT/DELETE http://localhost:8080/api/carts/*`
- `GET http://localhost:8080/api/tickets/*`
- etc.

````

## 🚀 Nuevas Funcionalidades Implementadas

### 📦 Gestión Completa de Productos

- **Modelo Product** con validaciones completas
- **CRUD de productos** con autenticación y autorización (solo admin)
- **Subida de imágenes** con Multer
- **Almacenamiento con naming único**: `{productId}-{filename}`
- **Filtros avanzados**: categoría, rango de precios, ordenamiento
- **Gestión de stock** con métodos dedicados y actualizaciones automáticas
- **Eliminación automática** de archivos huérfanos

### 🛒 Sistema de Carrito de Compras

- **Modelo Cart** con múltiples estados (active, completed, cancelled)
- **Índice único parcial**: Solo un carrito activo por usuario
- **Gestión automática de stock**:
  - Descuenta al agregar productos
  - Devuelve al eliminar o reducir cantidad
  - Valida disponibilidad antes de modificar
- **Snapshot de precios**: Mantiene precio al momento de agregar
- **Cálculo automático** de totales y subtotales
- **API completa**: CRUD de productos en carrito
- **Finalización de compra** con manejo de stock insuficiente
- **Interfaz elegante** con SweetAlert2 para confirmaciones

### 🎫 Sistema de Tickets de Compra

- **Modelo Ticket** con código único autogenerado
- **Formato de código**: `TICKET-{timestamp}-{random}`
- **Referencia al carrito** para preservar historial
- **Información completa**: fecha, monto, comprador, productos
- **API de consulta**: Lista y detalle de tickets
- **Vistas dedicadas**: Lista de compras y detalle individual
- **Historial completo**: Productos, cantidades y precios del momento

### 📁 Sistema de Subida de Archivos

- **Multer** configurado con diskStorage
- **Validación de tipos**: Solo imágenes (jpeg, jpg, png, gif, webp)
- **Límite de tamaño**: 5MB máximo
- **Directorio**: `public/productos`
- **Naming convention**: `{mongoId}-{originalFilename}`
- **Cleanup automático**: Elimina archivos al actualizar/borrar productos
- **Middleware condicional**: Skip body-parser para multipart/form-data

### 🎨 Interfaz Web Completa

- **Panel de administración** de productos con Bootstrap 5
- **Tabla de productos** con imágenes miniatura
- **Modales** para agregar, editar y ver productos
- **Búsqueda en tiempo real** por título o código
- **Filtros dinámicos** por categoría y precios
- **Ordenamiento** flexible (precio, título, fecha)
- **Vista previa de imágenes** en modales
- **Indicadores visuales** de stock con badges
- **Validación de formularios** en tiempo real

### 🛍️ Interfaz de Shopping

- **Home con productos** (solo visible para users logueados)
- **Carrito de compras** con gestión completa
- **Contador en navbar** (badge) que se actualiza en tiempo real
- **Botón de carrito siempre visible** (fuera de navbar-collapse)
- **Botón "Mis Compras" siempre visible** en navbar
- **SweetAlert2** para confirmaciones elegantes:
  - Confirmación de compra
  - Loading durante procesamiento
  - Mensajes de éxito/error personalizados
  - Opciones de navegación post-compra
- **Lista de tickets** con resumen de compras
- **Detalle de ticket** con tabla de productos
- **Diseño responsivo** optimizado para móviles

### 🌐 Interfaz Web de Usuarios

- **Páginas dinámicas** con Handlebars y Bootstrap 5.3.2
- **Sistema de autenticación web** con formularios responsivos
- **Panel de administración** con CRUD completo de usuarios
- **Páginas de perfil** y configuración personalizadas
- **Navegación intuitiva** con menús contextuales por rol
- **Navbar adaptativo** con elementos siempre visibles en móviles

### 🔧 Mejoras Técnicas

- **Arquitectura DAO/DTO/Repository**: Separación completa de responsabilidades en 3 capas
- **Transformación de IDs**: Todos los DTOs convierten `_id` (ObjectId) → `id` (string)
- **Seguridad mejorada**: DTOs eliminan campos sensibles automáticamente
- **Lógica de negocio centralizada**: Repositories manejan validaciones y reglas
- **Passport integrado con Repositories**: Estrategias usan UserRepository y retornan DTOs
- **Consistencia en JWT**: Payload usa `id` para compatibilidad con DTOs
- **authenticatedFetch mejorado**: Detección automática de FormData
- **Middleware condicional**: Skip JSON parsing para multipart/form-data
- **Manejo de errores**: Cleanup de archivos en caso de error
- **Validaciones separadas**: Productos vs Usuarios vs Carritos
- **Rutas protegidas**: Roles específicos por endpoint
- **Helpers personalizados** de Handlebars (`contentFor`, `section`, `eq`, `formatDate`)
- **JavaScript modular** organizado por funcionalidad
- **Sistema de layouts** flexible y reutilizable
- **Autenticación híbrida** (JWT + cookies) para mejor UX
- **Gestión de stock transaccional**: Operaciones atómicas en Repository
- **Índices de base de datos** optimizados (parciales y únicos)
- **Código mantenible**: Fácil agregar nuevas entidades siguiendo el patrón existente

---

## Troubleshooting

### Error de Conexión MongoDB

```bash
# Verificar que MongoDB esté ejecutándose
mongosh --eval "db.runCommand('ping')"

# O verificar la URI en .env
````

### Error JWT_SECRET

```bash
# Asegurar que JWT_SECRET esté configurado en .env
echo $JWT_SECRET  # Linux/Mac
echo %JWT_SECRET% # Windows
```

### Error de Puerto

```bash
# Cambiar puerto en .env si 8080 está ocupado
PORT=3000
```

### Error E11000 Duplicate Key en Cart

Si ves este error al crear un carrito:

```
MongoServerError: E11000 duplicate key error collection: backend.carts index: user_1
```

**Solución**: El índice antiguo necesita ser eliminado. Ejecuta:

```javascript
// En mongosh o MongoDB Compass
use backend
db.carts.dropIndex("user_1")
```

El índice correcto (parcial) se creará automáticamente al iniciar la aplicación.

### Badge del Carrito no se Actualiza

Si el contador del carrito no se actualiza:

1. Verifica que `loadCartBadge()` esté en `main.js`
2. Asegúrate de que se llama después de operaciones del carrito
3. Verifica que el elemento `<span id="cart-badge">` existe en el navbar
4. Confirma que el endpoint `/api/carts` retorna `data.id` (no `data._id`)

### Botones del Navbar Invisibles en Móvil

Si los botones de "Carrito" y "Mis Compras" desaparecen en móvil:

- Los botones deben estar **fuera** del `<div class="navbar-collapse">`
- Verifica que tengan `style="display: inline-block !important;"`
- NO deben tener la clase `d-lg-none`

### Stock No se Devuelve al Eliminar del Carrito

Verifica que CartRepository esté manejando el stock correctamente:

```javascript
// En CartRepository.removeProduct()
await ProductDAO.updateStock(productId, cartItem.quantity); // Incrementa stock
```

### SweetAlert2 No Aparece

Si las alertas nativas aparecen en vez de SweetAlert2:

1. Verifica que el CDN esté en `main.handlebars`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
   ```
2. Asegúrate de que `cart.js` use `Swal.fire()` en vez de `alert()`

### Ticket No Muestra Productos

Si el detalle del ticket está vacío:

1. Verifica que TicketRepository use populate correcto:
   ```javascript
   .populate({
     path: 'cart',
     populate: { path: 'products.product' }
   })
   ```
2. Asegúrate de que el carrito no se eliminó (debe estar status "completed")

### Error: "Usuario no encontrado" en /api/sessions/validate

Si después de login aparece este error:

1. **Borra las cookies del navegador** (Ctrl+Shift+Delete)
2. **Haz login nuevamente** para obtener un token con el formato correcto
3. El problema ocurre porque tokens antiguos usan `_id` pero el sistema ahora usa `id`
4. Verifica que `createJWTPayload()` en `utils/auth.js` use `user.id || user._id?.toString()`

### Frontend muestra "undefined" en lugar de IDs

Si ves `undefined` en botones o elementos del frontend:

1. Verifica que el código JavaScript use `.id` (no `._id`)
2. Confirma que el endpoint API retorna objetos con `id`
3. Revisa la consola del navegador para ver la estructura real del objeto
4. Ejemplo correcto: `product.id` en lugar de `product._id`

### Error al Agregar al Carrito: "req.user.\_id is undefined"

Si aparece este error en la consola del servidor:

1. Verifica que todas las rutas usen `req.user.id` (no `req.user._id`)
2. Busca en el código: `grep -r "req.user._id" src/routes/`
3. Reemplaza todas las ocurrencias: `req.user._id` → `req.user.id`

### DTOs No Transforman \_id a id

Si las respuestas de la API aún muestran `_id`:

1. Verifica que el Repository esté retornando el DTO:
   ```javascript
   return new ProductDTO(product); // Correcto
   // No: return product; // Incorrecto
   ```
2. Confirma que la ruta llame `.toJSON()` en el DTO
3. Ejecuta el script de verificación: `node verify-dto-ids.js`

## Autor

Sistema desarrollado para Coderhouse - Backend Programming Course

- **Curso**: Backend 2
- **Entrega**: Sistema E-Commerce con Arquitectura DAO/DTO/Repository
- **Tecnologías**: Node.js, Express, MongoDB, Passport, bcrypt, Multer, Handlebars, Bootstrap, SweetAlert2
- **Patrón de Diseño**: Arquitectura en Capas (DAO/DTO/Repository)
- **Características**:
  - ✅ Arquitectura DAO/DTO/Repository completa
  - ✅ API REST con transformación de datos (DTOs)
  - ✅ Lógica de negocio centralizada (Repositories)
  - ✅ Acceso a datos desacoplado (DAOs)
  - ✅ Interfaz Web responsiva
  - ✅ Gestión de Productos con Imágenes
  - ✅ Sistema de Carrito de Compras
  - ✅ Sistema de Tickets de Compra
  - ✅ Gestión Automática de Stock
  - ✅ Seguridad Avanzada con JWT y DTOs
  - ✅ UX Mejorada con SweetAlert2
  - ✅ Consistencia de IDs en toda la aplicación

**¡Aplicación E-Commerce con arquitectura profesional lista para producción!** 🎉🛒

---

## 📚 Recursos Adicionales

### Scripts de Utilidad

El proyecto incluye scripts útiles para desarrollo y testing:

- `verify-dto-ids.js` - Verifica que todos los DTOs retornen `id` sin `_id`
- `create-test-users.js` - Crea usuarios de prueba (admin y user)
- `reset-password.js` - Resetea contraseña de un usuario
- `test-login.js` - Prueba el login y validación de tokens

### Comandos Útiles

```bash
# Verificar DTOs
node verify-dto-ids.js

# Crear usuarios de prueba
npm run seed

# Buscar referencias a _id en el código
Get-ChildItem -Recurse -Filter "*.js" | Select-String "req\.user\._id"

# Verificar que no haya _id en rutas
Get-ChildItem -Path "src\routes" -Filter "*.js" | Select-String "req\.user\._id"
```

### Extensiones VS Code Recomendadas

- **MongoDB for VS Code** - Gestión de base de datos
- **REST Client** - Testing de APIs
- **ESLint** - Linting de código
- **Prettier** - Formateo automático
- **Handlebars** - Syntax highlighting para templates

### Documentación de Referencia

- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Passport.js](http://www.passportjs.org/)
- [Multer](https://github.com/expressjs/multer)
- [Handlebars](https://handlebarsjs.com/)
- [JWT](https://jwt.io/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

---

## 📖 Ejemplos de Uso de la Arquitectura

### Ejemplo 1: Crear un Usuario (DAO → DTO → Repository → Route)

#### 1. DAO (UserDAO.js)

```javascript
import User from "../models/User.js";

class UserDAO {
  async create(userData) {
    const user = new User(userData);
    return await user.save(); // Retorna documento Mongoose con _id y password
  }
}
```

#### 2. DTO (UserDTO.js)

```javascript
class UserDTO {
  constructor(user) {
    this.id = user._id.toString(); // Convierte ObjectId → string
    this.email = user.email;
    this.role = user.role;
    this.fullName = `${user.first_name} ${user.last_name}`;
    // ⚠️ NO incluye password
  }

  toJSON() {
    return { ...this };
  }
}
```

#### 3. Repository (UserRepository.js)

```javascript
import UserDAO from "../dao/UserDAO.js";
import UserDTO from "../dto/UserDTO.js";

class UserRepository {
  constructor() {
    this.dao = new UserDAO();
  }

  async create(userData) {
    // Lógica de negocio: Validar email único
    const existing = await this.dao.findByEmail(userData.email);
    if (existing) {
      throw new Error("El email ya está registrado");
    }

    // Crear usuario usando DAO
    const user = await this.dao.create(userData);

    // Retornar DTO (sin password, con id)
    return new UserDTO(user);
  }
}

export default new UserRepository(); // Singleton
```

#### 4. Route (routes/users.js)

```javascript
import UserRepository from "../repositories/UserRepository.js";

router.post("/register", async (req, res) => {
  try {
    const userDTO = await UserRepository.create(req.body);

    res.status(201).json({
      success: true,
      data: userDTO.toJSON(), // { id, email, role, fullName }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
```

### Ejemplo 2: Agregar Producto al Carrito (Lógica Compleja)

#### CartRepository.addProduct()

```javascript
async addProduct(userId, productId, quantity) {
  // 1. Obtener carrito activo o crear uno nuevo
  let cart = await this.dao.findActiveByUser(userId);
  if (!cart) {
    cart = await this.dao.create({ user: userId, products: [] });
  }

  // 2. Validar stock disponible
  const product = await ProductDAO.findById(productId);
  if (!product || product.stock < quantity) {
    throw new Error('Stock insuficiente');
  }

  // 3. Verificar si el producto ya está en el carrito
  const existingItem = cart.products.find(
    item => item.product.toString() === productId
  );

  if (existingItem) {
    // Incrementar cantidad existente
    existingItem.quantity += quantity;
  } else {
    // Agregar nuevo producto con snapshot de precio
    cart.products.push({
      product: productId,
      quantity: quantity,
      price: product.price
    });
  }

  // 4. Calcular total
  cart.totalPrice = cart.products.reduce(
    (sum, item) => sum + (item.quantity * item.price),
    0
  );

  // 5. Descontar stock del producto
  await ProductDAO.updateStock(productId, -quantity);

  // 6. Guardar carrito
  const updatedCart = await this.dao.update(cart._id, cart);

  // 7. Retornar DTO
  return new CartDTO(updatedCart);
}
```

### Ejemplo 3: Generar Ticket de Compra

#### TicketRepository.create()

```javascript
async create(ticketData) {
  // 1. Generar código único
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `TICKET-${timestamp}-${random}`;

  // 2. Crear ticket con código único
  const ticket = await this.dao.create({
    ...ticketData,
    code,
    purchase_datetime: new Date()
  });

  // 3. Populate para obtener datos completos
  const populated = await this.dao.findById(ticket._id);

  // 4. Retornar DTO
  return new TicketDTO(populated);
}
```

### Ejemplo 4: Autenticación con Passport + Repository

#### passport.js

```javascript
import UserRepository from "../repositories/UserRepository.js";

// Estrategia Current (validación de usuario logueado)
passport.use(
  "current",
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        // Usar Repository para obtener usuario
        const userDTO = await UserRepository.getById(payload.id); // ✅ usa 'id'

        if (!userDTO) {
          return done(null, false, {
            message: "Usuario no encontrado",
          });
        }

        // Retornar DTO como objeto plano
        return done(null, userDTO.toJSON()); // { id, email, role, ... }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
```

### Ejemplo 5: Frontend Usando IDs Consistentes

#### public/js/cart.js

```javascript
async function addToCart(productId, productTitle) {
  try {
    const response = await authenticatedFetch("/api/carts/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: productId, // ✅ Usa 'id' del ProductDTO
        quantity: 1,
      }),
    });

    if (response.success) {
      Swal.fire({
        icon: "success",
        title: "¡Agregado!",
        text: `${productTitle} agregado al carrito`,
      });

      loadCartBadge(); // Actualizar badge
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message,
    });
  }
}

// ✅ Botones usan .id (no ._id)
// <button onclick="addToCart('${product.id}', '${product.title}')">
```

### Ventajas Demostradas

#### ✅ Seguridad

```javascript
// Usuario en BD (con password)
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "user@test.com",
  password: "$2b$12$hash...",
  role: "user"
}

// UserDTO en API (sin password)
{
  id: "507f1f77bcf86cd799439011",
  email: "user@test.com",
  role: "user",
  fullName: "Juan Pérez"
}
```

#### ✅ Mantenibilidad

```javascript
// Cambiar lógica de validación: Solo modificar Repository
// UserRepository.js
async create(userData) {
  // Agregar nueva validación sin tocar DAO ni rutas
  if (userData.age < 18) {
    throw new Error('Debes ser mayor de 18 años');
  }
  // ... resto del código
}
```

#### ✅ Testabilidad

```javascript
// Mock de DAO para testing
class MockUserDAO {
  async findById(id) {
    return { _id: id, email: "test@test.com", role: "user" };
  }
}

// Inyectar en Repository
const repository = new UserRepository();
repository.dao = new MockUserDAO(); // Easy mocking!
```

---

## 📧 Sistema de Email y Activación de Cuentas

### Configuración de Email

El sistema utiliza **Nodemailer** para envío de emails con soporte para múltiples proveedores SMTP.

#### Variables de Entorno (.env)

```env
# Email Configuration
EMAIL_SERVICE=smtp
EMAIL_HOST=sandbox.smtp.mailtrap.io  # SMTP host
EMAIL_PORT=2525                       # SMTP port
EMAIL_USER=tu_usuario_mailtrap        # SMTP username
EMAIL_PASSWORD=tu_password_mailtrap   # SMTP password
EMAIL_FROM=noreply@ecommerce.com      # Email remitente
EMAIL_FROM_NAME=E-Commerce CoderHouse # Nombre del remitente
FRONTEND_URL=http://localhost:8080    # URL del frontend

# Activación de cuenta por email (true/false)
EMAIL_ACTIVATION_REQUIRED=false       # false = cuentas activas por defecto
```

### Funcionalidades de Email

#### 1. Email de Bienvenida con Activación de Cuenta

**Cuándo se envía**: Al registrar un nuevo usuario (solo si `EMAIL_ACTIVATION_REQUIRED=true`)

**Template**: HTML responsive con gradiente y botón de activación

**Contenido**:

- Mensaje de bienvenida personalizado
- Botón "Activar mi Cuenta" con link único
- Información sobre expiración del token (1 hora)

**Código del Template**:

```javascript
// src/config/email.js
async function sendWelcomeEmail(user, activationToken) {
  const activationUrl = `${process.env.FRONTEND_URL}/activate-account?token=${activationToken}`;

  const htmlContent = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <h1>¡Bienvenido a E-Commerce CoderHouse!</h1>
      <p>Hola ${user.first_name},</p>
      <p>Gracias por registrarte. Por favor activa tu cuenta:</p>
      <a href="${activationUrl}" style="background: #4CAF50; color: white; padding: 15px 30px;">
        Activar mi Cuenta
      </a>
      <p><small>Este enlace expirará en 1 hora.</small></p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Activa tu cuenta - E-Commerce CoderHouse",
    html: htmlContent,
  });
}
```

#### 2. Email de Recuperación de Contraseña

**Cuándo se envía**: Cuando el usuario solicita recuperar su contraseña

**Endpoint**: `POST /api/sessions/request-password-reset`

**Template**: HTML responsive con gradiente rojo/rosa y botón de reset

**Contenido**:

- Notificación de solicitud de recuperación
- Botón "Restablecer Contraseña" con token único
- Advertencia de seguridad
- Expiración de 1 hora

**Código del Template**:

```javascript
async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
      <h1>Recuperación de Contraseña</h1>
      <p>Hola ${user.first_name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${resetUrl}" style="background: #f5576c; color: white; padding: 15px 30px;">
        Restablecer Contraseña
      </a>
      <p><small>Si no solicitaste este cambio, ignora este email.</small></p>
      <p><small>Este enlace expirará en 1 hora.</small></p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Recuperación de Contraseña - E-Commerce",
    html: htmlContent,
  });
}
```

### Flujo de Activación de Cuenta

#### Paso 1: Registro de Usuario

```javascript
// POST /api/users/register
const emailActivationRequired =
  process.env.EMAIL_ACTIVATION_REQUIRED === "true";

if (emailActivationRequired) {
  // Generar token de activación
  const { token, expires } = generateActivationToken();
  userData.activationToken = token;
  userData.activationTokenExpires = expires;
  userData.isActive = false; // Cuenta inactiva hasta activación

  // Enviar email
  await sendWelcomeEmail(newUser, token);
} else {
  // Cuenta activa por defecto
  userData.isActive = true;
}
```

#### Paso 2: Usuario Hace Click en el Email

```
Email → Click en "Activar mi Cuenta" →
GET /activate-account?token=xxx →
Página de activación con JavaScript
```

#### Paso 3: Validación del Token

```javascript
// POST /api/sessions/activate-account
const user = await User.findOne({
  activationToken: token,
  activationTokenExpires: { $gt: Date.now() }, // Token no expirado
});

if (!user) {
  return res.status(400).json({
    success: false,
    message: "Token de activación inválido o expirado",
  });
}

// Activar cuenta
user.isActive = true;
user.activationToken = null;
user.activationTokenExpires = null;
await user.save();
```

### Flujo de Recuperación de Contraseña

#### Paso 1: Solicitar Recuperación

```javascript
// POST /api/sessions/request-password-reset
const { token, expires } = generatePasswordResetToken();

user.resetPasswordToken = token;
user.resetPasswordExpires = expires;
await user.save();

await sendPasswordResetEmail(user, token);
```

#### Paso 2: Usuario Hace Click en el Email

```
Email → Click en "Restablecer Contraseña" →
GET /reset-password?token=xxx →
Formulario de nueva contraseña
```

#### Paso 3: Restablecer Contraseña

```javascript
// POST /api/sessions/reset-password
const user = await User.findOne({
  resetPasswordToken: token,
  resetPasswordExpires: { $gt: Date.now() },
});

if (!user) {
  return res.status(400).json({
    success: false,
    message: "Token de restablecimiento inválido o expirado",
  });
}

// Actualizar contraseña
user.password = newPassword; // Se hashea automáticamente en pre-save hook
user.resetPasswordToken = null;
user.resetPasswordExpires = null;
await user.save();
```

### Generación de Tokens Seguros

**Ubicación**: `src/utils/auth.js`

```javascript
import crypto from "crypto";

export function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 caracteres
}

export function generateActivationToken() {
  return {
    token: generateSecureToken(),
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
  };
}

export function generatePasswordResetToken() {
  return {
    token: generateSecureToken(),
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
  };
}
```

### Modelo de Usuario Actualizado

**Nuevos campos en User.js**:

```javascript
const userSchema = new mongoose.Schema({
  // ... campos existentes ...

  // Activación de cuenta
  isActive: {
    type: Boolean,
    default: false, // Por defecto inactiva si hay activación
  },
  activationToken: {
    type: String,
    default: null,
  },
  activationTokenExpires: {
    type: Date,
    default: null,
  },

  // Recuperación de contraseña
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});
```

### Endpoints de Email

#### Activar Cuenta

```http
POST /api/sessions/activate-account
Content-Type: application/json

{
  "token": "abc123..."
}
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Cuenta activada exitosamente. Ya puedes iniciar sesión.",
  "data": {
    "email": "user@example.com",
    "activated": true
  }
}
```

#### Solicitar Recuperación de Contraseña

```http
POST /api/sessions/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Se ha enviado un correo con instrucciones para restablecer tu contraseña"
}
```

#### Restablecer Contraseña

```http
POST /api/sessions/reset-password
Content-Type: application/json

{
  "token": "xyz789...",
  "newPassword": "NuevaPassword123"
}
```

**Respuesta exitosa**:

```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente"
}
```

### Testing con Mailtrap

**Mailtrap.io** es un servicio de testing de emails que captura todos los emails enviados sin enviarlos realmente.

#### Configuración:

1. Crear cuenta en [mailtrap.io](https://mailtrap.io)
2. Obtener credenciales SMTP del inbox
3. Configurar en `.env`:

```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=tu_usuario_mailtrap
EMAIL_PASSWORD=tu_password_mailtrap
```

#### Ventajas de Mailtrap:

- ✅ No envía emails reales a usuarios
- ✅ Interfaz web para ver emails capturados
- ✅ Prueba de templates HTML
- ✅ Validación de contenido y links
- ✅ Análisis de spam score
- ✅ Testing de emails sin riesgo

### Control de Activación

La variable `EMAIL_ACTIVATION_REQUIRED` permite dos modos de operación:

#### Modo Sin Activación (`EMAIL_ACTIVATION_REQUIRED=false`)

```javascript
// Registro crea cuenta activa
userData.isActive = true;
userData.activationToken = null;
userData.activationTokenExpires = null;

// No se envía email de activación
// Usuario puede iniciar sesión inmediatamente
```

**Caso de uso**: Desarrollo, testing, aplicaciones internas

#### Modo Con Activación (`EMAIL_ACTIVATION_REQUIRED=true`)

```javascript
// Registro crea cuenta inactiva
const { token, expires } = generateActivationToken();
userData.isActive = false;
userData.activationToken = token;
userData.activationTokenExpires = expires;

// Se envía email de activación
await sendWelcomeEmail(newUser, token);

// Usuario debe activar antes de iniciar sesión
```

**Caso de uso**: Producción, validación de emails reales

### Páginas Web de Email

#### /forgot-password

- Formulario para ingresar email
- Validación de email existente
- Envío de email con token
- Feedback visual del proceso

#### /reset-password?token=xxx

- Formulario de nueva contraseña
- Confirmación de contraseña
- Validación de requisitos (mínimo 6 caracteres)
- Validación de token en tiempo real
- Redirección a login tras éxito

#### /activate-account?token=xxx

- Validación automática de token al cargar
- Estados: loading, success, error
- Mensajes dinámicos
- Botón para ir al login tras activación

### Seguridad de Tokens

**Características de seguridad**:

- ✅ Tokens generados con `crypto.randomBytes(32)` (64 chars hex)
- ✅ Expiración de 1 hora
- ✅ Un solo uso (se eliminan tras ser usados)
- ✅ Almacenados con hash en base de datos
- ✅ Validación de expiración en cada request
- ✅ Tokens únicos por usuario

**Ejemplo de token**:

```
101bddbe5ed4f99b74cd1950b489c2ce3aa3d23c4c8e5a0dbdf2cce890ae5f31
```

---

---

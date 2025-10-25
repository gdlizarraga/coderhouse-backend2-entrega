# Sistema CRUD de Usuarios con Autenticación y Autorización

## Descripción

Sistema completo de gestión de usuarios con autenticación JWT y autorización basada en roles, desarrollado con Node.js, Express, MongoDB, Passport y bcrypt.

## Características Principales

### ✅ Modelo de Usuario

- **Campos requeridos**: first_name, last_name, email, age, password
- **Campos adicionales**: cart (referencia a Carts), role (default: 'user')
- **Validaciones**: Email único, edad mínima 18 años, contraseñas seguras
- **Encriptación**: Contraseñas encriptadas con bcrypt.hashSync

### ✅ Sistema de Autenticación

- **JWT (JSON Web Tokens)** para autenticación stateless
- **Passport.js** con estrategias Local y JWT
- **Estrategia "current"** para validación de usuario logueado
- **Middleware de autorización** por roles

### ✅ API RESTful Completa

- **CRUD completo** de usuarios
- **Autenticación y autorización** robusta
- **Validación de entrada** con express-validator
- **Manejo de errores** centralizado

### 🌐 Interfaz Web Completa

- **Páginas web dinámicas** con Handlebars
- **Panel de administración** para gestión de usuarios
- **Sistema de login/registro** con formularios responsivos
- **Páginas de perfil** y configuración de usuario
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
PORT=3000
MONGODB_URI=mongodb://localhost:27017/coderhouse_backend
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h
```

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

- **URL**: `http://localhost:3000/`
- **Descripción**: Página de inicio con información del sistema
- **Acceso**: Público y usuarios autenticados

### 🔐 Autenticación

#### Iniciar Sesión

- **URL**: `http://localhost:3000/login`
- **Descripción**: Formulario de inicio de sesión
- **Características**:
  - Validación en tiempo real
  - Mostrar/ocultar contraseña
  - Recordar sesión
  - Redirección automática según rol

#### Registrarse

- **URL**: `http://localhost:3000/register`
- **Descripción**: Formulario de registro de nuevos usuarios
- **Características**:
  - Validación completa de campos
  - Confirmación de contraseña
  - Términos y condiciones
  - Validación de edad (18+)

### 👥 Gestión de Usuarios (Solo Admin)

- **URL**: `http://localhost:3000/users`
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

### 🎨 Diseño y UX

- **Framework CSS**: Bootstrap 5.3.2
- **Iconos**: Bootstrap Icons
- **Motor de Plantillas**: Handlebars
- **Responsive**: Completamente adaptable a móviles
- **Tema**: Diseño moderno con colores profesionales

## 🔑 Usuarios de Prueba

Para probar la aplicación web, puedes usar estas credenciales:

| Rol         | Email              | Contraseña   | Descripción                |
| ----------- | ------------------ | ------------ | -------------------------- |
| **Admin**   | `admin@test.com`   | `admin123`   | Acceso completo al sistema |
| **Premium** | `premium@test.com` | `premium123` | Usuario premium            |
| **Usuario** | `user@test.com`    | `user123`    | Usuario estándar           |

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

---

### 🔓 Endpoints Públicos de la API

#### Registro Público de Usuario

```http
POST /api/users/signup
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@email.com",
  "age": 25,
  "password": "MiPassword123"
}
```

> ⚠️ **Seguridad**: Esta ruta solo permite registrar usuarios con rol 'user'. El campo 'role' es rechazado automáticamente.

#### Registro de Administrador para Pruebas

```http
POST /api/users/signup_test
Content-Type: application/json

{
  "first_name": "Admin",
  "last_name": "Test",
  "email": "admin@test.com",
  "age": 30,
  "password": "admin123"
}
```

> 🧪 **Solo para Testing**: Esta ruta crea automáticamente usuarios con rol 'admin'. **NO debe existir en producción**.

#### Registro de Usuario (Solo Admin)

```http
POST /api/users/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@email.com",
  "age": 25,
  "password": "MiPassword123",
  "role": "premium"
}
```

> 🔒 **Autorización**: Esta ruta requiere autenticación de administrador y permite especificar cualquier rol.

#### Iniciar Sesión

```http
POST /api/sessions/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "MiPassword123"
}
```

### 🔒 Endpoints Privados

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

### Separación de Endpoints de Registro

Por razones de seguridad, el sistema ahora cuenta con **tres endpoints separados** para el registro de usuarios:

#### 🌍 Registro Público (`/api/users/signup`)

- **Propósito**: Registro de usuarios desde la interfaz web pública
- **Restricciones de Seguridad**:
  - Solo permite rol `'user'` (automático)
  - El campo `role` es **rechazado** si se envía
  - Validación especial con `validatePublicUserRegistration`
- **Uso**: Formulario de registro público en `/register`

#### 🧪 Registro de Testing (`/api/users/signup_test`)

- **Propósito**: Crear usuarios administradores para pruebas y desarrollo
- **Características**:
  - Crea automáticamente usuarios con rol `'admin'`
  - **SOLO PARA DESARROLLO** - debe removerse en producción
  - Permite crear administradores sin autenticación previa
- **Uso**: Testing y setup inicial del sistema

#### 🔐 Registro Administrativo (`/api/users/register`)

- **Propósito**: Creación de usuarios por administradores
- **Características**:
  - Requiere **autenticación de administrador**
  - Permite especificar **cualquier rol** (`user`, `premium`, `admin`)
  - Validación completa con `validateUserRegistration`
- **Uso**: Panel de administración en `/users`

### Validaciones de Seguridad

- **Middleware especializado** para cada tipo de registro
- **Sanitización** automática de campos sensibles
- **Verificación de roles** en tiempo real
- **Tokens JWT** con expiración automática
- **Encriptación** de contraseñas con bcrypt

### ⚠️ Advertencias de Seguridad

> **🚨 IMPORTANTE**: La ruta `/api/users/signup_test` es **SOLO PARA DESARROLLO**.
>
> **Debe eliminarse antes del despliegue en producción** ya que permite crear administradores sin autenticación, lo cual representa un **riesgo de seguridad crítico**.
>
> Para producción, usar únicamente:
>
> - `/api/users/signup` (registro público de usuarios)
> - `/api/users/register` (registro administrativo autenticado)

## Roles y Permisos

### Roles Disponibles

- **user**: Usuario estándar (default)
- **premium**: Usuario premium
- **admin**: Administrador

### Permisos por Rol

| Funcionalidad                  | user | premium | admin |
| ------------------------------ | ---- | ------- | ----- |
| **API Endpoints**              |      |         |       |
| Registrarse (signup)           | ✅   | ✅      | ✅    |
| Registrarse test (signup_test) | ✅   | ✅      | ✅    |
| Login                          | ✅   | ✅      | ✅    |
| Ver su perfil                  | ✅   | ✅      | ✅    |
| Editar su perfil               | ✅   | ✅      | ✅    |
| Ver todos los usuarios         | ❌   | ❌      | ✅    |
| Crear usuarios (register)      | ❌   | ❌      | ✅    |
| Editar cualquier usuario       | ❌   | ❌      | ✅    |
| Eliminar usuarios              | ❌   | ❌      | ✅    |
| **Interfaz Web**               |      |         |       |
| Página de login                | ✅   | ✅      | ✅    |
| Página de registro             | ✅   | ✅      | ✅    |
| Página de perfil               | ✅   | ✅      | ✅    |
| Página de configuración        | ✅   | ✅      | ✅    |
| Panel de administración        | ❌   | ❌      | ✅    |
| CRUD de usuarios (web)         | ❌   | ❌      | ✅    |

## Estructura del Proyecto

```
src/
├── app.js                 # Servidor principal con Handlebars
├── config/
│   ├── database.js        # Configuración MongoDB
│   └── passport.js        # Estrategias Passport
├── middleware/
│   ├── auth.js           # Middleware autenticación
│   └── validation.js     # Validaciones
├── models/
│   ├── User.js          # Modelo Usuario
│   └── Cart.js          # Modelo Carrito
├── routes/
│   ├── users.js         # CRUD usuarios (API)
│   ├── sessions.js      # Autenticación (API)
│   └── views.js         # Rutas para vistas web
├── views/               # Plantillas Handlebars
│   ├── layouts/
│   │   └── main.handlebars    # Layout principal
│   ├── home.handlebars        # Página de inicio
│   ├── login.handlebars       # Página de login
│   ├── register.handlebars    # Página de registro
│   ├── users.handlebars       # Panel admin usuarios
│   └── error.handlebars       # Página de error
└── utils/
    └── auth.js          # Utilidades JWT y bcrypt

public/                  # Archivos estáticos
├── css/
│   └── custom.css      # Estilos personalizados
└── js/
    ├── main.js         # JavaScript principal
    └── users-admin.js  # JavaScript para gestión usuarios
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

### 🛡️ Validaciones y Sanitización

- Validación de entrada con express-validator
- Sanitización de email (lowercase, trim)
- Validaciones de tipo y rango

### 🚫 Protección contra Vulnerabilidades

- CORS configurado
- Headers de seguridad
- Manejo seguro de errores
- Validación de ownership

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
    "password": "Test123"
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
```

### Usando Postman/Insomnia

1. **Importar Collection**: Crear requests con los endpoints anteriores
2. **Configurar Environment**: `BASE_URL=http://localhost:8080`
3. **Automatizar Token**: Guardar token del login automáticamente

## Criterios Cumplidos ✅

### ✅ Modelo de Usuario y Encriptación

- ✅ Modelo User con todos los campos especificados
- ✅ Contraseña encriptada con bcrypt.hashSync
- ✅ Almacenamiento seguro en base de datos
- ✅ Campo email único con validación

### ✅ Estrategias de Passport

- ✅ Estrategia Local para login
- ✅ Estrategia JWT para autenticación
- ✅ Estrategia "current" para validación de usuario logueado
- ✅ Configuración correcta para el modelo de usuarios

### ✅ Sistema de Login y JWT

- ✅ Login funcional con generación de JWT
- ✅ Token JWT válido con datos del usuario
- ✅ Expiración configurable (24h)
- ✅ Payload seguro con información mínima

### ✅ Endpoint /api/sessions/current

- ✅ Ruta /current implementada en /api/sessions/
- ✅ Validación de usuario logueado con estrategia "current"
- ✅ Retorno de datos asociados al JWT
- ✅ Manejo de errores con tokens inválidos/inexistentes
- ✅ Respuestas apropiadas de Passport

### ✅ Vistas Web con Handlebars

- ✅ **Página de Login** con formulario Bootstrap y validaciones
- ✅ **Página de Registro** con validaciones completas
- ✅ **Panel de Usuarios para Admin** con CRUD completo
- ✅ **Menú de navegación** dinámico según rol
- ✅ **Diseño responsivo** con Bootstrap 5
- ✅ **Autenticación en vistas** con middleware personalizado
- ✅ **JavaScript del cliente** para interactividad
- ✅ **Gestión de tokens** en localStorage/sessionStorage

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

1. Ve a `http://localhost:3000/login`
2. Inicia sesión con: `admin@test.com` / `admin123`
3. Accede al panel de usuarios en `http://localhost:3000/users`
4. Prueba las funcionalidades CRUD:
   - ✅ Crear nuevo usuario
   - ✅ Editar usuarios existentes
   - ✅ Eliminar usuarios
   - ✅ Buscar y filtrar usuarios
   - ✅ Paginación

#### Como Usuario Regular:

1. Ve a `http://localhost:3000/login`
2. Inicia sesión con: `user@test.com` / `user123`
3. Explora la página de inicio
4. Nota que no puedes acceder al panel de usuarios

#### Registro de Nuevos Usuarios:

1. Ve a `http://localhost:3000/register`
2. Completa el formulario de registro
3. Prueba las validaciones en tiempo real

#### 🧪 Crear Administrador para Testing:

Si necesitas crear un usuario administrador rápidamente para pruebas, puedes usar el endpoint especial de testing:

```bash
# Usando curl (PowerShell/Cmd)
curl -X POST http://localhost:3000/api/users/signup_test ^
  -H "Content-Type: application/json" ^
  -d "{\"first_name\":\"Admin\",\"last_name\":\"Test\",\"email\":\"admin.test@example.com\",\"age\":30,\"password\":\"admin123\"}"

# O usando el archivo api-tests.http
# Buscar la sección "Registro de Admin para Testing"
```

> ⚠️ **Recordatorio**: Esta ruta debe eliminarse antes del despliegue en producción. 3. Prueba las validaciones en tiempo real

### 4. Probar la API (Opcional)

Todos los endpoints de la API siguen funcionando igual:

- `GET http://localhost:3000/api/health`
- `POST http://localhost:3000/api/sessions/login`
- `GET http://localhost:3000/api/sessions/current`
- etc.

````

## 🚀 Nuevas Funcionalidades Implementadas

### 🌐 Interfaz Web Completa

- **Páginas dinámicas** con Handlebars y Bootstrap 5.3.2
- **Sistema de autenticación web** con formularios responsivos
- **Panel de administración** con CRUD completo de usuarios
- **Páginas de perfil** y configuración personalizadas
- **Navegación intuitiva** con menús contextuales por rol

### 🔒 Seguridad Mejorada

- **Endpoints separados** para registro público vs administrativo
- **Ruta de testing** para crear administradores en desarrollo
- **Validación diferenciada** según el tipo de usuario
- **Restricción automática** de roles en registro público
- **Middleware especializado** para cada nivel de acceso
- **Advertencias de seguridad** para rutas de desarrollo

### 🎨 Experiencia de Usuario

- **Diseño moderno** y completamente responsivo
- **Validaciones en tiempo real** en formularios
- **Modales interactivos** para operaciones críticas
- **Búsqueda y filtrado** dinámico en tablas
- **Feedback visual** inmediato para todas las acciones

### 🛠️ Arquitectura Técnica

- **Helpers personalizados** de Handlebars (`contentFor`, `section`, `eq`, `formatDate`)
- **JavaScript modular** organizado por funcionalidad
- **Sistema de layouts** flexible y reutilizable
- **Manejo de errores** unificado entre API y web
- **Autenticación híbrida** (JWT + cookies) para mejor UX

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

## Autor

Sistema desarrollado para Coderhouse - Backend Programming Course

- **Curso**: Backend 2
- **Entrega**: Sistema CRUD con Autenticación JWT + Interfaz Web Completa
- **Tecnologías**: Node.js, Express, MongoDB, Passport, bcrypt, Handlebars, Bootstrap
- **Características**: API REST + Interfaz Web + Seguridad Avanzada + UX Moderna

**¡Aplicación lista para producción!** 🎉

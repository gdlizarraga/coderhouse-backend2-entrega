import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import passport from "./config/passport.js";

// Importar rutas
import usersRoutes from "./routes/users.js";
import sessionsRoutes from "./routes/sessions.js";
import viewsRoutes from "./routes/views.js";
import productsRoutes from "./routes/products.js";
import cartsRoutes from "./routes/carts.js";
import ticketsRoutes from "./routes/tickets.js";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Conectar a la base de datos
connectDB();

// Configurar Handlebars
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      json: function (context) {
        return JSON.stringify(context);
      },
      eq: function (a, b) {
        return a === b;
      },
      formatDate: function (date) {
        if (!date) return "N/A";
        const options = {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        };
        return new Date(date).toLocaleDateString("es-ES", options);
      },
      contentFor: function (name, options) {
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
      section: function (name, options) {
        if (!this._sections) this._sections = {};
        var section = this._sections[name];
        if (section) {
          return section;
        }
        return options.fn ? options.fn(this) : "";
      },
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "..", "public")));

// Middlewares básicos
app.use(
  cors({
    origin: process.env.FRONTEND_URL || `http://localhost:${PORT}`,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Middleware condicional para parsear JSON (skip si es multipart/form-data)
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, next);
});

app.use((req, res, next) => {
  if (req.is("multipart/form-data")) {
    return next();
  }
  express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
});

app.use(cookieParser());

// Inicializar Passport
app.use(passport.initialize());

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`
  );
  next();
});

// Rutas de la API
app.use("/api/users", usersRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/carts", cartsRoutes);
app.use("/api/tickets", ticketsRoutes);

// Ruta de salud del servidor
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
    data: {
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Ruta de documentación básica
app.get("/docs", (req, res) => {
  res.json({
    success: true,
    message: "API de Sistema E-Commerce con Arquitectura DAO/DTO/Repository",
    data: {
      version: "3.0.0",
      architecture: {
        pattern: "DAO/DTO/Repository (3-Layer Architecture)",
        layers: {
          dao: {
            description: "Data Access Objects - Direct database access",
            location: "src/dao/",
            files: [
              "UserDAO.js",
              "ProductDAO.js",
              "CartDAO.js",
              "TicketDAO.js",
            ],
            responsibility: "CRUD operations with MongoDB via Mongoose",
          },
          dto: {
            description: "Data Transfer Objects - Data transformation",
            location: "src/dto/",
            files: [
              "UserDTO.js",
              "ProductDTO.js",
              "CartDTO.js",
              "TicketDTO.js",
            ],
            responsibility:
              "Transform _id → id, remove sensitive data (password), format for API",
          },
          repository: {
            description: "Business Logic Layer - Orchestration",
            location: "src/repositories/",
            files: [
              "UserRepository.js",
              "ProductRepository.js",
              "CartRepository.js",
              "TicketRepository.js",
            ],
            responsibility:
              "Business rules, validations, use DAOs, return DTOs",
          },
        },
        benefits: [
          "Separation of concerns",
          "Clean API responses (id instead of _id)",
          "Automatic password removal from responses",
          "Centralized business logic",
          "Easy testing with mocks",
          "Scalable and maintainable",
        ],
      },
      important_changes: {
        id_format:
          "All API responses use 'id' (string) instead of '_id' (ObjectId)",
        security:
          "UserDTO automatically removes password field from all responses",
        jwt_payload:
          "Token payload uses { id, email, role, fullName } with 'id' field",
        passport:
          "All Passport strategies integrated with UserRepository and return DTOs",
        frontend: "All JavaScript files use .id property (not ._id)",
        backend: "All routes use req.user.id (not req.user._id)",
      },
      endpoints: {
        health: "/api/health",
        users: {
          register:
            "POST /api/users/register (Public registration - returns UserDTO)",
          getAll: "GET /api/users (Admin only - returns UserDTO[])",
          getById: "GET /api/users/:id (Returns UserDTO)",
          update: "PUT /api/users/:id (Returns UserDTO)",
          delete: "DELETE /api/users/:id",
          profile: "GET /api/users/profile/me (Returns UserDTO)",
          updateProfile: "PUT /api/users/profile/me (Returns UserDTO)",
        },
        products: {
          getAll: "GET /api/products (Returns ProductDTO[])",
          getById: "GET /api/products/:id (Admin only - returns ProductDTO)",
          create: "POST /api/products (Admin only - returns ProductDTO)",
          update: "PUT /api/products/:id (Admin only - returns ProductDTO)",
          delete: "DELETE /api/products/:id (Admin only)",
        },
        carts: {
          getActive: "GET /api/carts (User only - returns CartDTO)",
          addProduct: "POST /api/carts/products (User only - returns CartDTO)",
          updateQuantity:
            "PUT /api/carts/products/:productId (User only - returns CartDTO)",
          removeProduct:
            "DELETE /api/carts/products/:productId (User only - returns CartDTO)",
          clearCart: "DELETE /api/carts (User only)",
          purchase:
            "POST /api/carts/:cid/purchase (User only - returns TicketDTO)",
        },
        tickets: {
          getAll: "GET /api/tickets (User only - returns TicketDTO[])",
          getById: "GET /api/tickets/:id (User only - returns TicketDTO)",
        },
        sessions: {
          login: "POST /api/sessions/login (Returns UserDTO + token)",
          current: "GET /api/sessions/current (Returns UserDTO)",
          logout: "POST /api/sessions/logout",
          refresh: "POST /api/sessions/refresh",
          validate: "GET /api/sessions/validate (Returns UserDTO)",
          changePassword: "POST /api/sessions/change-password",
          activateAccount:
            "POST /api/sessions/activate-account (Activate user account with token)",
          requestPasswordReset:
            "POST /api/sessions/request-password-reset (Request password reset email)",
          resetPassword:
            "POST /api/sessions/reset-password (Reset password with token)",
        },
        web: {
          home: "GET / (User only - displays products)",
          login: "GET /login",
          register: "GET /register",
          forgotPassword: "GET /forgot-password (Request password reset)",
          resetPassword: "GET /reset-password?token=xxx (Reset password form)",
          activateAccount: "GET /activate-account?token=xxx (Activate account)",
          profile: "GET /profile (Auth required)",
          settings: "GET /settings (Auth required)",
          cart: "GET /cart (User only)",
          tickets: "GET /tickets (User only)",
          ticketDetail: "GET /tickets/:id (User only)",
          users: "GET /users (Admin only)",
          products: "GET /products (Admin only)",
        },
      },
      features: {
        dao_dto_repository:
          "Complete 3-layer architecture with separation of concerns",
        data_transformation:
          "All responses use 'id' (string) instead of MongoDB's '_id' (ObjectId)",
        security_enhanced:
          "DTOs automatically remove sensitive data (passwords) from all API responses",
        email_system:
          "Nodemailer integration with account activation and password recovery",
        account_activation:
          "Optional email activation with secure tokens (configurable via EMAIL_ACTIVATION_REQUIRED)",
        password_recovery:
          "Complete password reset flow with email notifications and secure tokens",
        shopping_cart:
          "Multiple carts per user with status workflow (active, completed, cancelled)",
        stock_management:
          "Automatic stock increment/decrement on cart operations via CartRepository",
        purchase_tickets:
          "Unique ticket generation with purchase history via TicketRepository",
        sweet_alerts: "SweetAlert2 integration for elegant confirmations",
        responsive_ui: "Bootstrap 5 with mobile-optimized navbar",
        passport_integration:
          "Passport strategies use UserRepository and return DTOs consistently",
      },
      security: {
        public_registration:
          "/api/users/register - Public registration with 'user' role",
        password_hashing:
          "bcrypt with 12 salt rounds in Mongoose pre-save hook",
        dto_protection: "UserDTO never exposes password field in API responses",
        jwt_format: "Payload uses 'id' field for consistency with DTOs",
        token_validation:
          "All protected routes validate JWT and populate req.user with UserDTO",
        activation_tokens:
          "Secure tokens generated with crypto.randomBytes(32) - 64 char hex",
        token_expiration: "Activation and reset tokens expire after 1 hour",
        email_security:
          "Tokens are single-use and deleted after successful activation/reset",
      },
      documentation: {
        authentication: "Bearer Token JWT requerido para rutas privadas",
        authorization: "Header: Authorization: Bearer <token>",
        roles: ["user", "admin"],
        response_format:
          "All responses include { success, message, data } with DTOs in data field",
        id_usage: "Use 'id' field in all API requests/responses (not '_id')",
      },
      migration_notes: {
        breaking_changes:
          "ID format changed from '_id' to 'id' - update all frontend code",
        re_login_required:
          "Users must login again after update to get new token format",
        frontend_update: "All JavaScript files now use .id instead of ._id",
        backend_update:
          "All routes now use req.user.id instead of req.user._id",
      },
    },
  });
});

// Rutas de vistas web
app.use("/", viewsRoutes);

// Middleware para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint no encontrado",
    code: "ENDPOINT_NOT_FOUND",
    requestedUrl: req.originalUrl,
    method: req.method,
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error("Error no manejado:", error);

  // Error de validación de Mongoose
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  // Error de cast de MongoDB (ID inválido)
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "ID de recurso inválido",
      code: "INVALID_RESOURCE_ID",
    });
  }

  // Error de duplicado de MongoDB
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Recurso duplicado",
      code: "DUPLICATE_RESOURCE",
    });
  }

  // Error JWT
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token JWT inválido",
      code: "INVALID_TOKEN",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token JWT expirado",
      code: "TOKEN_EXPIRED",
    });
  }

  // Error genérico
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Error interno del servidor",
    code: "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor iniciado exitosamente`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📝 Documentación: http://localhost:${PORT}/docs`);
  console.log(`\n📋 Endpoints principales:`);
  console.log(`   📝 Registro Público:`);
  console.log(`   • POST /api/users/register - Registrar usuario (rol: user)`);
  console.log(`   🔑 Autenticación:`);
  console.log(`   • POST /api/sessions/login - Iniciar sesión`);
  console.log(`   • GET  /api/sessions/current - Validar usuario actual`);
  console.log(`   👤 Perfil:`);
  console.log(`   • GET  /api/users/profile/me - Obtener perfil`);
  console.log(`   🌐 Interfaz Web:`);
  console.log(`   • GET  /login, /register, /profile, /settings, /users`);
  console.log(`\n⚡ Sistema de autenticación JWT activo\n`);
});

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;

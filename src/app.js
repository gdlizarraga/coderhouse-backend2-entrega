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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
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
    message: "API de Sistema CRUD de Usuarios con Autenticación",
    data: {
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        users: {
          signup: "POST /api/users/signup (Public registration)",
          signup_test: "POST /api/users/signup_test (Testing - Admin creation)",
          register: "POST /api/users/register (Admin only)",
          getAll: "GET /api/users (Admin only)",
          getById: "GET /api/users/:id",
          update: "PUT /api/users/:id",
          delete: "DELETE /api/users/:id",
          profile: "GET /api/users/profile/me",
          updateProfile: "PUT /api/users/profile/me",
        },
        sessions: {
          login: "POST /api/sessions/login",
          current: "GET /api/sessions/current",
          logout: "POST /api/sessions/logout",
          refresh: "POST /api/sessions/refresh",
          validate: "GET /api/sessions/validate",
          changePassword: "POST /api/sessions/change-password",
        },
        web: {
          home: "GET /",
          login: "GET /login",
          register: "GET /register",
          profile: "GET /profile (Auth required)",
          settings: "GET /settings (Auth required)",
          users: "GET /users (Admin only)",
        },
      },
      security: {
        public_registration: "/api/users/signup - Only 'user' role allowed",
        admin_registration:
          "/api/users/register - Any role, admin auth required",
        testing_endpoint: "/api/users/signup_test - Creates admin (DEV ONLY)",
      },
      documentation: {
        authentication: "Bearer Token JWT requerido para rutas privadas",
        authorization: "Header: Authorization: Bearer <token>",
        roles: ["user", "admin", "premium"],
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
  console.log(`   • POST /api/users/signup - Registrar usuario (rol: user)`);
  console.log(`   🧪 Testing (⚠️ Solo desarrollo):`);
  console.log(`   • POST /api/users/signup_test - Crear admin para testing`);
  console.log(`   🔐 Administración:`);
  console.log(`   • POST /api/users/register - Registrar usuario (admin only)`);
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

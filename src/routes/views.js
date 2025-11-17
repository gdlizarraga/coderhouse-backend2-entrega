import express from "express";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";

const router = express.Router();

// Middleware para obtener información del usuario desde el token (opcional)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret_change_in_production"
      );
      const user = await UserRepository.getById(decoded.id);
      // El DTO ya es un objeto plano
      req.user = user ? user.toJSON() : null;
    }
  } catch (error) {
    // Token inválido o expirado, continuar sin usuario
    req.user = null;
  }
  next();
};

// Middleware para requerir autenticación
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    console.log("requireAuth - URL:", req.originalUrl);
    console.log("requireAuth - Token encontrado:", !!token);
    console.log("requireAuth - authHeader:", authHeader);

    if (!token) {
      console.log("requireAuth - No hay token, redirigiendo a /login");
      return res.redirect("/login");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_change_in_production"
    );
    const user = await UserRepository.getById(decoded.id);

    if (!user) {
      console.log("requireAuth - Usuario no encontrado, redirigiendo a /login");
      return res.redirect("/login");
    }

    console.log(
      "requireAuth - Usuario autenticado:",
      user.email,
      "Rol:",
      user.role
    );
    // El DTO ya es un objeto plano para Handlebars
    req.user = user.toJSON();
    next();
  } catch (error) {
    console.log("requireAuth - Error:", error.message);
    return res.redirect("/login");
  }
};

// Middleware para requerir rol admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "Acceso Denegado",
      error: {
        status: 403,
        message: "No tienes permisos para acceder a esta página",
      },
      user: req.user,
    });
  }
  next();
};

// Middleware para obtener token desde cookies o localStorage (para las vistas web)
const getTokenFromClient = (req, res, next) => {
  // Deshabilitar caché para las vistas dinámicas
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  // Intentar obtener token desde cookies
  let token = req.cookies?.authToken;

  console.log("getTokenFromClient - URL:", req.originalUrl);
  console.log("getTokenFromClient - Cookie authToken:", !!token);

  // Si no hay token en cookies, buscar en el header Authorization
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.split(" ")[1];
    console.log("getTokenFromClient - Token desde header:", !!token);
  }

  if (token) {
    req.headers.authorization = `Bearer ${token}`;
    console.log("getTokenFromClient - Token establecido en headers");
  } else {
    console.log("getTokenFromClient - No se encontró token");
  }

  next();
};

// Página de inicio
router.get("/", getTokenFromClient, optionalAuth, (req, res) => {
  console.log("=== HOME PAGE DEBUG ===");
  console.log("User object:", req.user);
  console.log("User role:", req.user?.role);
  console.log("User full:", JSON.stringify(req.user, null, 2));
  console.log("======================");

  res.render("home", {
    title: "Inicio",
    user: req.user,
    isDevelopment: process.env.NODE_ENV === "development",
  });
});

// Página de login
router.get("/login", getTokenFromClient, optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  res.render("login", {
    title: "Iniciar Sesión",
    isDevelopment: process.env.NODE_ENV === "development",
  });
});

// Página de registro
router.get("/register", getTokenFromClient, optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  res.render("register", {
    title: "Crear Cuenta",
  });
});

// Página de activación de cuenta
router.get("/activate-account", (req, res) => {
  res.render("activate-account", {
    title: "Activar Cuenta",
  });
});

// Página de solicitar recuperación de contraseña
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    title: "Recuperar Contraseña",
  });
});

// Página de restablecer contraseña
router.get("/reset-password", (req, res) => {
  res.render("reset-password", {
    title: "Restablecer Contraseña",
  });
});

// Página de gestión de usuarios (solo admin)
router.get(
  "/users",
  getTokenFromClient,
  requireAuth,
  requireAdmin,
  (req, res) => {
    res.render("users", {
      title: "Gestión de Usuarios",
      user: req.user,
      scripts: ["/js/users-admin.js"],
    });
  }
);

// Página de gestión de productos (solo admin)
router.get(
  "/products",
  getTokenFromClient,
  requireAuth,
  requireAdmin,
  (req, res) => {
    res.render("products", {
      title: "Gestión de Productos",
      user: req.user,
      scripts: ["/js/products.js"],
    });
  }
);

// Página de perfil de usuario
router.get("/profile", getTokenFromClient, requireAuth, (req, res) => {
  res.render("profile", {
    title: "Mi Perfil",
    user: req.user,
  });
});

// Página de configuración
router.get("/settings", getTokenFromClient, requireAuth, (req, res) => {
  // Convertir el objeto user de Mongoose a objeto plano para Handlebars
  const userObject = req.user.toObject ? req.user.toObject() : req.user;

  res.render("settings", {
    title: "Configuración",
    user: userObject,
  });
});

// Página del carrito
router.get("/cart", getTokenFromClient, requireAuth, (req, res) => {
  // Convertir el objeto user de Mongoose a objeto plano para Handlebars
  const userObject = req.user.toObject ? req.user.toObject() : req.user;

  res.render("cart", {
    title: "Mi Carrito",
    user: userObject,
  });
});

// Página de tickets (historial de compras)
router.get("/tickets", getTokenFromClient, requireAuth, (req, res) => {
  const userObject = req.user.toObject ? req.user.toObject() : req.user;

  res.render("tickets", {
    title: "Mis Compras",
    user: userObject,
  });
});

// Página de detalle de ticket
router.get("/tickets/:id", getTokenFromClient, requireAuth, (req, res) => {
  const userObject = req.user.toObject ? req.user.toObject() : req.user;

  res.render("ticket-detail", {
    title: "Detalle de Compra",
    user: userObject,
    ticketId: req.params.id,
  });
});

// Logout (GET para facilitar desde el navbar)
router.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.redirect("/login");
});

// API endpoint para logout (POST)
router.post("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({
    success: true,
    message: "Sesión cerrada correctamente",
  });
});

// Página de error 404
router.get("/404", (req, res) => {
  res.status(404).render("error", {
    title: "Página no encontrada",
    error: {
      status: 404,
      message: "La página que buscas no existe",
    },
  });
});

// Página de error genérica
router.get("/error", (req, res) => {
  res.render("error", {
    title: "Error",
    error: {
      status: 500,
      message: "Ha ocurrido un error interno del servidor",
    },
  });
});

// Ruta para obtener información del usuario actual (API para las vistas)
router.get("/api/me", getTokenFromClient, requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// Manejador para rutas no encontradas (debe ir al final)
router.use("*", (req, res) => {
  res.status(404).render("error", {
    title: "Página no encontrada",
    error: {
      status: 404,
      message: "La página que buscas no existe",
    },
  });
});

export default router;

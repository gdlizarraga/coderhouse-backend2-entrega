import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
      const user = await User.findById(decoded.id) // Cambiado de decoded.userId a decoded.id
        .select("-password")
        .populate("cart");
      // Convertir el objeto Mongoose a un objeto plano para Handlebars
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

    if (!token) {
      return res.redirect("/login");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_change_in_production"
    );
    const user = await User.findById(decoded.id) // Cambiado de decoded.userId a decoded.id
      .select("-password")
      .populate("cart");

    if (!user) {
      return res.redirect("/login");
    }

    // Convertir el objeto Mongoose a un objeto plano para Handlebars
    req.user = user.toJSON();
    next();
  } catch (error) {
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
  // Intentar obtener token desde cookies
  let token = req.cookies?.authToken;

  // Si no hay token en cookies, buscar en el header Authorization
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.split(" ")[1];
  }

  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }

  next();
};

// Página de inicio
router.get("/", getTokenFromClient, optionalAuth, (req, res) => {
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

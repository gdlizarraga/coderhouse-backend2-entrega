import passport from "passport";
import { verifyToken, extractTokenFromHeader } from "../utils/auth.js";

/**
 * Middleware para autenticar con JWT usando Passport
 */
export const authenticateJWT = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: err.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Token inválido o expirado",
        code: "UNAUTHORIZED",
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware para validar usuario actual usando estrategia "current"
 */
export const validateCurrentUser = (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al validar usuario",
        error: err.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Token inválido o usuario no encontrado",
        code: info?.code || "INVALID_TOKEN",
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware para autorizar por roles
 * @param {string[]} roles - Array de roles permitidos
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado - Usuario no autenticado",
        code: "USER_NOT_AUTHENTICATED",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado - Se requiere rol: ${roles.join(" o ")}`,
        code: "INSUFFICIENT_PRIVILEGES",
        userRole: req.user.role,
        requiredRoles: roles,
      });
    }

    next();
  };
};

/**
 * Middleware para autenticar con Local Strategy (login)
 */
export const authenticateLocal = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor durante autenticación",
        error: err.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Credenciales inválidas",
        code: "INVALID_CREDENTIALS",
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware opcional para autenticación JWT (no falla si no hay token)
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return next(); // Continuar sin usuario autenticado
  }

  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (!err && user) {
      req.user = user;
    }
    next(); // Continuar independientemente del resultado
  })(req, res, next);
};

/**
 * Middleware para verificar que el usuario puede acceder a sus propios recursos
 */
export const ensureOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.params.id;
  const currentUserId = req.user._id.toString();

  // Los admins pueden acceder a cualquier recurso
  if (req.user.role === "admin") {
    return next();
  }

  // Los usuarios solo pueden acceder a sus propios recursos
  if (resourceUserId && resourceUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para acceder a este recurso",
      code: "RESOURCE_ACCESS_DENIED",
    });
  }

  next();
};

import express from "express";
import User from "../models/User.js";
import { generateToken, createJWTPayload } from "../utils/auth.js";
import { authenticateLocal, validateCurrentUser } from "../middleware/auth.js";
import { validateUserLogin } from "../middleware/validation.js";

const router = express.Router();

/**
 * @route   POST /api/sessions/login
 * @desc    Iniciar sesión de usuario
 * @access  Public
 */
router.post(
  "/login",
  validateUserLogin,
  authenticateLocal,
  async (req, res) => {
    try {
      const user = req.user; // Usuario autenticado por Passport Local Strategy

      // Generar token JWT
      const tokenPayload = createJWTPayload(user);
      const token = generateToken(tokenPayload);

      // Populate cart para la respuesta
      await user.populate("cart");

      res.json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          user: user.toJSON(),
          token,
          expiresIn: "24h",
        },
      });
    } catch (error) {
      console.error("Error durante el login:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor durante el login",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/sessions/current
 * @desc    Validar usuario logueado y obtener datos del JWT
 * @access  Private
 */
router.get("/current", validateCurrentUser, async (req, res) => {
  try {
    const user = req.user; // Usuario validado por estrategia "current"

    // Generar un nuevo token (renovar)
    const tokenPayload = createJWTPayload(user);
    const newToken = generateToken(tokenPayload);

    res.json({
      success: true,
      message: "Usuario autenticado correctamente",
      data: {
        user: user.toJSON(),
        token: newToken,
        expiresIn: "24h",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error al validar usuario actual:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al validar usuario",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/sessions/logout
 * @desc    Cerrar sesión (invalidar token del lado cliente)
 * @access  Private
 */
router.post("/logout", validateCurrentUser, async (req, res) => {
  try {
    // En un sistema JWT stateless, el logout se maneja del lado cliente
    // eliminando el token. Aquí podríamos actualizar lastLogin

    const user = req.user;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Sesión cerrada exitosamente",
      data: {
        message: "Token invalidado. Elimine el token del lado cliente.",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error durante el logout:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor durante el logout",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/sessions/refresh
 * @desc    Renovar token JWT
 * @access  Private
 */
router.post("/refresh", validateCurrentUser, async (req, res) => {
  try {
    const user = req.user;

    // Generar nuevo token
    const tokenPayload = createJWTPayload(user);
    const newToken = generateToken(tokenPayload);

    res.json({
      success: true,
      message: "Token renovado exitosamente",
      data: {
        token: newToken,
        expiresIn: "24h",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
      },
    });
  } catch (error) {
    console.error("Error al renovar token:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al renovar token",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/sessions/validate
 * @desc    Validar token JWT (endpoint simple para verificación)
 * @access  Private
 */
router.get("/validate", validateCurrentUser, (req, res) => {
  res.json({
    success: true,
    message: "Token válido",
    data: {
      valid: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        fullName: req.user.fullName,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @route   POST /api/sessions/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.post("/change-password", validateCurrentUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Se requiere la contraseña actual y la nueva contraseña",
        code: "MISSING_PASSWORDS",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 6 caracteres",
        code: "INVALID_NEW_PASSWORD",
      });
    }

    const user = await User.findById(req.user._id);

    // Verificar contraseña actual
    if (!user.comparePassword(currentPassword)) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    // Actualizar contraseña (se encriptará automáticamente)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Contraseña cambiada exitosamente",
      data: {
        message: "Se recomienda iniciar sesión nuevamente",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al cambiar contraseña",
      error: error.message,
    });
  }
});

export default router;

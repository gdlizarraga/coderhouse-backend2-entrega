import express from "express";
import userRepository from "../repositories/UserRepository.js";
import {
  generateToken,
  createJWTPayload,
  generatePasswordResetToken,
} from "../utils/auth.js";
import { sendPasswordResetEmail } from "../config/email.js";
import { authenticateLocal, validateCurrentUser } from "../middleware/auth.js";
import { validateUserLogin } from "../middleware/validation.js";
import { UserCurrentDTO, UserLoginDTO } from "../utils/dto.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

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

      // Usar DTO para enviar solo información no sensible
      const userDTO = new UserLoginDTO(user);

      res.json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          user: userDTO,
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

    // Usar DTO para enviar solo información no sensible
    const userDTO = new UserCurrentDTO(user);

    res.json({
      success: true,
      message: "Usuario autenticado correctamente",
      data: {
        user: userDTO,
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
    // eliminando el token. Aquí podríamos actualizar lastLogin usando Repository

    await userRepository.update(req.user.id, {
      lastLogin: new Date(),
    });

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
        id: req.user.id,
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

    const user = await UserRepository.getById(req.user.id);

    // Verificar contraseña actual
    const result = await UserRepository.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

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

/**
 * @route   POST /api/sessions/activate-account
 * @desc    Activar cuenta de usuario mediante token
 * @access  Public
 */
router.post("/activate-account", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token de activación requerido",
      });
    }

    // Buscar usuario con el token y verificar que no haya expirado
    const user = await User.findOne({
      activationToken: token,
      activationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token de activación inválido o expirado",
        code: "INVALID_OR_EXPIRED_TOKEN",
      });
    }

    // Activar la cuenta
    user.isActive = true;
    user.activationToken = null;
    user.activationTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Cuenta activada exitosamente. Ya puedes iniciar sesión.",
      data: {
        email: user.email,
        activated: true,
      },
    });
  } catch (error) {
    console.error("Error al activar cuenta:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al activar cuenta",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/sessions/request-password-reset
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 */
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido",
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Por seguridad, siempre responder con éxito
    // (no revelar si el email existe o no)
    if (!user) {
      return res.json({
        success: true,
        message:
          "Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña",
      });
    }

    // Generar token de recuperación
    const { token: resetToken, expires: resetExpires } =
      generatePasswordResetToken();

    // Guardar token en el usuario
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Enviar email de recuperación (no bloqueante)
    sendPasswordResetEmail(user, resetToken).catch((error) => {
      console.error("Error enviando email de recuperación:", error);
    });

    res.json({
      success: true,
      message:
        "Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña",
      data: {
        tokenSent: true,
      },
    });
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/sessions/reset-password
 * @desc    Restablecer contraseña mediante token
 * @access  Public
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token y nueva contraseña son requeridos",
      });
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    // Buscar usuario con el token y verificar que no haya expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token de recuperación inválido o expirado",
        code: "INVALID_OR_EXPIRED_TOKEN",
      });
    }

    // Actualizar contraseña (el pre-save hook la encriptará)
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message:
        "Contraseña restablecida exitosamente. Ya puedes iniciar sesión.",
      data: {
        email: user.email,
        passwordReset: true,
      },
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al restablecer contraseña",
      error: error.message,
    });
  }
});

export default router;

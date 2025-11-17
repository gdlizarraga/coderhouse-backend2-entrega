import express from "express";
import UserRepository from "../repositories/UserRepository.js";
import CartDAO from "../dao/CartDAO.js";
import {
  generateToken,
  createJWTPayload,
  generateActivationToken,
} from "../utils/auth.js";
import { sendWelcomeEmail } from "../config/email.js";
import {
  authenticateJWT,
  authorizeRoles,
  ensureOwnership,
} from "../middleware/auth.js";
import {
  validateUserRegistration,
  validatePublicUserRegistration,
  validateUserUpdate,
} from "../middleware/validation.js";

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Crear un nuevo usuario (solo admin) - con rol personalizable
 * @access  Private/Admin
 */
router.post("/register", validateUserRegistration, async (req, res) => {
  try {
    const { first_name, last_name, email, age, password, role } = req.body;

    // Verificar si el usuario ya existe
    const emailExists = await UserRepository.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con este email",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    // Verificar si se requiere activación por email
    const emailActivationRequired =
      process.env.EMAIL_ACTIVATION_REQUIRED === "true";

    let activationToken = null;
    let activationExpires = null;
    let isActive = !emailActivationRequired; // Si no se requiere activación, la cuenta está activa

    // Solo generar token si la activación está habilitada
    if (emailActivationRequired) {
      const tokenData = generateActivationToken();
      activationToken = tokenData.token;
      activationExpires = tokenData.expires;
    }

    // Crear el nuevo usuario usando el Repository
    const userData = {
      first_name,
      last_name,
      email,
      age,
      password,
      role,
      isActive,
      activationToken,
      activationTokenExpires: activationExpires,
    };
    const newUser = await UserRepository.create(userData);

    // Enviar email de bienvenida solo si la activación está habilitada
    if (emailActivationRequired) {
      sendWelcomeEmail(newUser.toJSON(), activationToken).catch((error) => {
        console.error("Error enviando email de bienvenida:", error);
      });
    }

    // Generar token JWT
    const tokenPayload = newUser.toJWTPayload();
    const token = generateToken(tokenPayload);

    const message = emailActivationRequired
      ? "Usuario registrado exitosamente. Por favor revisa tu email para activar tu cuenta."
      : "Usuario registrado exitosamente.";

    res.status(201).json({
      success: true,
      message,
      data: {
        user: newUser.toJSON(),
        token,
        expiresIn: "24h",
        activationRequired: emailActivationRequired,
      },
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);

    // Error de duplicado en MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con este email",
        code: "DUPLICATE_EMAIL",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al registrar usuario",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (solo admin)
 * @access  Private/Admin
 */
router.get("/", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    // Construir filtros
    const filters = {};
    if (role && ["user", "admin"].includes(role)) {
      filters.role = role;
    }

    if (search) {
      filters.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 },
    };

    const users = await UserRepository.getAll(filters, options);
    const total = await UserRepository.count(filters);

    res.json({
      success: true,
      message: "Usuarios obtenidos exitosamente",
      data: {
        users: users.map((u) => u.toJSON()),
        totalUsers: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener usuarios",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 * @access  Private
 */
router.get("/:id", authenticateJWT, ensureOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserRepository.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      message: "Usuario obtenido exitosamente",
      data: user.toJSON(),
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener usuario",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario
 * @access  Private
 */
router.put(
  "/:id",
  authenticateJWT,
  ensureOwnership,
  validateUserUpdate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Los usuarios normales no pueden cambiar su rol
      if (req.user.role !== "admin" && updates.role) {
        delete updates.role;
      }

      // Si se actualiza el email, verificar que no exista
      if (updates.email) {
        const existingUser = await UserRepository.getByEmail(updates.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({
            success: false,
            message: "Ya existe un usuario con este email",
            code: "EMAIL_ALREADY_EXISTS",
          });
        }
      }

      const updatedUser = await UserRepository.update(id, updates);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          code: "USER_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con este email",
          code: "DUPLICATE_EMAIL",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar usuario",
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar un usuario
 * @access  Private/Admin o propio usuario
 */
router.delete("/:id", authenticateJWT, ensureOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserRepository.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    // Eliminar el carrito asociado si existe
    await CartDAO.deleteById({ user: id });

    // Eliminar el usuario
    await UserRepository.delete(id);

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
      data: {
        deletedUser: {
          id: user.id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al eliminar usuario",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/profile/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get("/profile/me", authenticateJWT, async (req, res) => {
  try {
    const user = await UserRepository.getById(req.user.id);

    res.json({
      success: true,
      message: "Perfil obtenido exitosamente",
      data: user.toJSON(),
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener perfil",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/profile/me
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put(
  "/profile/me",
  authenticateJWT,
  validateUserUpdate,
  async (req, res) => {
    try {
      const updates = req.body;

      // Los usuarios no pueden cambiar su propio rol
      delete updates.role;

      // Si se actualiza el email, verificar que no exista
      if (updates.email) {
        const existingUser = await UserRepository.getByEmail(updates.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({
            success: false,
            message: "Ya existe un usuario con este email",
            code: "EMAIL_ALREADY_EXISTS",
          });
        }
      }

      const updatedUser = await UserRepository.update(req.user.id, updates);

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con este email",
          code: "DUPLICATE_EMAIL",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar perfil",
        error: error.message,
      });
    }
  }
);

export default router;

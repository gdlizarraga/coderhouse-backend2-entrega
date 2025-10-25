import express from "express";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { generateToken, createJWTPayload } from "../utils/auth.js";
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
 * @route   POST /api/users/signup
 * @desc    Registro público de usuarios - solo rol "user"
 * @access  Public
 */
router.post("/signup", validatePublicUserRegistration, async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con este email",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    // Crear un carrito vacío para el nuevo usuario
    const newCart = new Cart();
    const savedCart = await newCart.save();

    // Crear el nuevo usuario siempre con rol "user"
    const newUser = new User({
      first_name,
      last_name,
      email,
      age,
      password, // Se encriptará automáticamente por el middleware del modelo
      cart: savedCart._id,
      role: "user", // Siempre "user" para registro público
    });

    const savedUser = await newUser.save();

    // Remover la contraseña del response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Error en registro de usuario:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

/**
 * @route   POST /api/users/signup_test
 * @desc    Registro público de usuarios para poder registrar un rol - solo para pruebas, esto no existiria en produccion
 * @access  Public
 */
router.post(
  "/signup_test",
  validatePublicUserRegistration,
  async (req, res) => {
    try {
      const { first_name, last_name, email, age, password } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con este email",
          code: "EMAIL_ALREADY_EXISTS",
        });
      }

      // Crear un carrito vacío para el nuevo usuario
      const newCart = new Cart();
      const savedCart = await newCart.save();

      // Crear el nuevo usuario siempre con rol "user"
      const newUser = new User({
        first_name,
        last_name,
        email,
        age,
        password, // Se encriptará automáticamente por el middleware del modelo
        cart: savedCart._id,
        role: "admin", // Siempre "admin" para testeo
      });

      const savedUser = await newUser.save();

      // Remover la contraseña del response
      const userResponse = savedUser.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: "Usuario Administrador registrado exitosamente",
        data: {
          user: userResponse,
        },
      });
    } catch (error) {
      console.error("Error en registro de usuario Administrador:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Error de validación",
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

/**
 * @route   POST /api/users/register
 * @desc    Crear un nuevo usuario (solo admin) - con rol personalizable
 * @access  Private/Admin
 */
router.post(
  "/register",
  authenticateJWT,
  authorizeRoles("admin"),
  validateUserRegistration,
  async (req, res) => {
    try {
      const { first_name, last_name, email, age, password, role } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con este email",
          code: "EMAIL_ALREADY_EXISTS",
        });
      }

      // Crear un carrito vacío para el nuevo usuario
      const newCart = new Cart();
      const savedCart = await newCart.save();

      // Crear el nuevo usuario con el rol especificado
      const newUser = new User({
        first_name,
        last_name,
        email,
        age,
        password, // Se encriptará automáticamente por el middleware del modelo
        cart: savedCart._id,
        role: role || "user", // Permitir cualquier rol desde admin
      });

      const savedUser = await newUser.save();

      // Generar token JWT
      const tokenPayload = createJWTPayload(savedUser);
      const token = generateToken(tokenPayload);

      // Populate cart para la respuesta
      await savedUser.populate("cart");

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          user: savedUser.toJSON(),
          token,
          expiresIn: "24h",
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
  }
);

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
    if (role && ["user", "admin", "premium"].includes(role)) {
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
      page: parseInt(page),
      limit: parseInt(limit),
      populate: "cart",
      select: "-password",
      sort: { createdAt: -1 },
    };

    const users = (await User.paginate)
      ? await User.paginate(filters, options)
      : await User.find(filters)
          .populate("cart")
          .select("-password")
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      message: "Usuarios obtenidos exitosamente",
      data: users,
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

    const user = await User.findById(id).populate("cart").select("-password");

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
      data: user,
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
        const existingUser = await User.findOne({
          email: updates.email,
          _id: { $ne: id },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Ya existe un usuario con este email",
            code: "EMAIL_ALREADY_EXISTS",
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      })
        .populate("cart")
        .select("-password");

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
        data: updatedUser,
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

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    // Eliminar el carrito asociado si existe
    if (user.cart) {
      await Cart.findByIdAndDelete(user.cart);
    }

    // Eliminar el usuario
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
      data: {
        deletedUser: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
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
    const user = await User.findById(req.user._id)
      .populate("cart")
      .select("-password");

    res.json({
      success: true,
      message: "Perfil obtenido exitosamente",
      data: user,
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
        const existingUser = await User.findOne({
          email: updates.email,
          _id: { $ne: req.user._id },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Ya existe un usuario con este email",
            code: "EMAIL_ALREADY_EXISTS",
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      })
        .populate("cart")
        .select("-password");

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: updatedUser,
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

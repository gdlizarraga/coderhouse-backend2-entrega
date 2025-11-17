import { body, validationResult } from "express-validator";

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

/**
 * Validaciones para registro de usuario
 */
export const validateUserRegistration = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras y espacios"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("age")
    .isInt({ min: 18, max: 120 })
    .withMessage("La edad debe ser un número entre 18 y 120"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una minúscula, una mayúscula y un número"
    ),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("El rol debe ser: user o admin"),

  handleValidationErrors,
];

/**
 * Validaciones para registro público de usuario (sin rol)
 */
export const validatePublicUserRegistration = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras y espacios"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("age")
    .isInt({ min: 18, max: 120 })
    .withMessage("La edad debe ser un número entre 18 y 120"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una minúscula, una mayúscula y un número"
    ),

  // Explícitamente rechazar el campo role si se envía
  body("role")
    .not()
    .exists()
    .withMessage("No se permite especificar el rol en el registro público"),

  handleValidationErrors,
];

/**
 * Validaciones para login de usuario
 */
export const validateUserLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("La contraseña es obligatoria"),

  handleValidationErrors,
];

/**
 * Validaciones para actualización de usuario
 */
export const validateUserUpdate = [
  body("first_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("last_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras y espacios"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("age")
    .optional()
    .isInt({ min: 18, max: 120 })
    .withMessage("La edad debe ser un número entre 18 y 120"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una minúscula, una mayúscula y un número"
    ),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("El rol debe ser: user o admin"),

  handleValidationErrors,
];

/**
 * Validaciones para creación de producto
 */
export const validateProductCreation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("El título es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("El título debe tener entre 3 y 100 caracteres"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ min: 10, max: 500 })
    .withMessage("La descripción debe tener entre 10 y 500 caracteres"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("El código es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El código debe tener entre 2 y 50 caracteres")
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage(
      "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos"
    ),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0"),

  body("stock")
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un número entero mayor o igual a 0"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("La categoría es obligatoria")
    .isLength({ min: 2, max: 50 })
    .withMessage("La categoría debe tener entre 2 y 50 caracteres"),

  handleValidationErrors,
];

/**
 * Validaciones para actualización de producto
 */
export const validateProductUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El título debe tener entre 3 y 100 caracteres"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("La descripción debe tener entre 10 y 500 caracteres"),

  body("code")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El código debe tener entre 2 y 50 caracteres")
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage(
      "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos"
    ),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un número entero mayor o igual a 0"),

  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("La categoría debe tener entre 2 y 50 caracteres"),

  handleValidationErrors,
];

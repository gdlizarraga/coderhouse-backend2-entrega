import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * Encripta una contraseña usando bcrypt.hashSync
 * @param {string} password - La contraseña en texto plano
 * @param {number} saltRounds - Número de rounds para el salt (default: 12)
 * @returns {string} - La contraseña encriptada
 */
export const hashPassword = (password, saltRounds = 12) => {
  try {
    return bcrypt.hashSync(password, saltRounds);
  } catch (error) {
    throw new Error("Error al encriptar la contraseña");
  }
};

/**
 * Compara una contraseña en texto plano con una encriptada
 * @param {string} candidatePassword - La contraseña en texto plano
 * @param {string} hashedPassword - La contraseña encriptada
 * @returns {boolean} - true si coinciden, false si no
 */
export const comparePassword = (candidatePassword, hashedPassword) => {
  try {
    return bcrypt.compareSync(candidatePassword, hashedPassword);
  } catch (error) {
    throw new Error("Error al comparar contraseñas");
  }
};

/**
 * Genera un token JWT para un usuario
 * @param {Object} payload - Los datos del usuario para incluir en el token
 * @param {string} expiresIn - Tiempo de expiración (default: 24h)
 * @returns {string} - El token JWT generado
 */
export const generateToken = (payload, expiresIn = "24h") => {
  try {
    const secret =
      process.env.JWT_SECRET || "default_secret_change_in_production";
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    throw new Error("Error al generar el token JWT");
  }
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - El token JWT a verificar
 * @returns {Object} - Los datos decodificados del token
 */
export const verifyToken = (token) => {
  try {
    const secret =
      process.env.JWT_SECRET || "default_secret_change_in_production";
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expirado");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Token inválido");
    } else {
      throw new Error("Error al verificar el token");
    }
  }
};

/**
 * Extrae el token del header Authorization
 * @param {string} authHeader - El header Authorization
 * @returns {string|null} - El token extraído o null si no existe
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remover "Bearer "
};

/**
 * Genera un payload básico para el JWT con datos del usuario
 * @param {Object} user - El objeto usuario
 * @returns {Object} - El payload para el JWT
 */
export const createJWTPayload = (user) => {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    fullName: user.fullName || `${user.first_name} ${user.last_name}`,
  };
};

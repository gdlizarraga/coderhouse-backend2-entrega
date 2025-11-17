import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import UserRepository from "../repositories/UserRepository.js";
import { comparePassword } from "../utils/auth.js";
import dotenv from "dotenv";

dotenv.config();

// Extractor personalizado para JWT desde cookies o header
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["authToken"];
  }
  // Si no está en cookie, buscar en header Authorization
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }
  return token;
};

// Configurar estrategia Local para login
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Buscar usuario por email con password
        const user = await UserRepository.getByEmailWithPassword(email);

        if (!user) {
          return done(null, false, {
            message: "Email o contraseña incorrectos",
          });
        }

        // Verificar contraseña
        const isValidPassword = user.comparePassword(password);

        if (!isValidPassword) {
          return done(null, false, {
            message: "Email o contraseña incorrectos",
          });
        }

        // Actualizar último login (acceso directo al modelo necesario aquí)
        user.lastLogin = new Date();
        await user.save();

        // Retornar el usuario como objeto plano con 'id' en lugar de '_id'
        const userObj = user.toObject();
        userObj.id = userObj._id.toString();
        delete userObj._id;
        delete userObj.password;

        return done(null, userObj);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Configurar estrategia JWT para autenticación
passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey:
        process.env.JWT_SECRET || "default_secret_change_in_production",
    },
    async (payload, done) => {
      try {
        // Buscar usuario por ID del payload con password para el modelo
        const user = await UserRepository.getByEmailWithPassword(payload.email);

        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }

        // Retornar el usuario como objeto plano con 'id' en lugar de '_id'
        const userObj = user.toObject();
        userObj.id = userObj._id.toString();
        delete userObj._id;
        delete userObj.password;

        return done(null, userObj);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Estrategia "current" para validar usuario logueado
passport.use(
  "current",
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey:
        process.env.JWT_SECRET || "default_secret_change_in_production",
    },
    async (payload, done) => {
      try {
        // Buscar usuario por ID del payload
        const userDTO = await UserRepository.getById(payload.id);

        if (!userDTO) {
          return done(null, false, {
            message: "Token inválido - Usuario no encontrado",
            code: "USER_NOT_FOUND",
          });
        }

        // Retornar el DTO como objeto plano con 'id'
        return done(null, userDTO.toJSON());
      } catch (error) {
        return done(error, false, {
          message: "Error al validar token",
          code: "TOKEN_VALIDATION_ERROR",
        });
      }
    }
  )
);

// Serialización del usuario para las sesiones (si se usan)
passport.serializeUser((user, done) => {
  done(null, user.id || user._id?.toString());
});

// Deserialización del usuario para las sesiones (si se usan)
passport.deserializeUser(async (id, done) => {
  try {
    const userDTO = await UserRepository.getById(id);
    done(null, userDTO ? userDTO.toJSON() : null);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

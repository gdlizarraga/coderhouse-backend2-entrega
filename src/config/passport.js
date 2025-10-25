import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { comparePassword } from "../utils/auth.js";
import dotenv from "dotenv";

dotenv.config();

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
        // Buscar usuario por email
        const user = await User.findByEmail(email).populate("cart");

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

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        return done(null, user);
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        process.env.JWT_SECRET || "default_secret_change_in_production",
    },
    async (payload, done) => {
      try {
        // Buscar usuario por ID del payload
        const user = await User.findById(payload.id).populate("cart");

        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }

        return done(null, user);
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        process.env.JWT_SECRET || "default_secret_change_in_production",
    },
    async (payload, done) => {
      try {
        // Buscar usuario por ID del payload con información completa
        const user = await User.findById(payload.id)
          .populate("cart")
          .select("-password"); // Excluir contraseña

        if (!user) {
          return done(null, false, {
            message: "Token inválido - Usuario no encontrado",
            code: "USER_NOT_FOUND",
          });
        }

        // Verificar que el usuario esté activo (se puede agregar campo isActive si es necesario)
        return done(null, user);
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
  done(null, user._id);
});

// Deserialización del usuario para las sesiones (si se usan)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("cart");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

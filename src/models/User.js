import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true,
    maxlength: [50, "El nombre no puede exceder 50 caracteres"],
  },
  last_name: {
    type: String,
    required: [true, "El apellido es obligatorio"],
    trim: true,
    maxlength: [50, "El apellido no puede exceder 50 caracteres"],
  },
  email: {
    type: String,
    required: [true, "El email es obligatorio"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Por favor ingrese un email válido",
    ],
  },
  age: {
    type: Number,
    required: [true, "La edad es obligatoria"],
    min: [18, "La edad mínima es 18 años"],
    max: [120, "La edad máxima es 120 años"],
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "admin", "premium"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
});

// Índice único para el email
userSchema.index({ email: 1 }, { unique: true });

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre("save", function (next) {
  // Solo encriptar la contraseña si ha sido modificada o es nueva
  if (!this.isModified("password")) return next();

  try {
    // Encriptar la contraseña usando bcrypt.hashSync con salt rounds = 12
    this.password = bcrypt.hashSync(this.password, 12);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar updatedAt antes de guardar
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    this.updatedAt = Date.now();
  }
  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

// Método para obtener información pública del usuario (sin contraseña)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Método estático para buscar usuario por email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual para nombre completo
userSchema.virtual("fullName").get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Asegurar que los virtuals se incluyan en JSON
userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;

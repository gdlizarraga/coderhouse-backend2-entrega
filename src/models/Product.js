import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "El título es obligatorio"],
    trim: true,
    maxlength: [100, "El título no puede exceder 100 caracteres"],
  },
  description: {
    type: String,
    required: [true, "La descripción es obligatoria"],
    trim: true,
    maxlength: [500, "La descripción no puede exceder 500 caracteres"],
  },
  code: {
    type: String,
    required: [true, "El código es obligatorio"],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, "El código no puede exceder 50 caracteres"],
  },
  price: {
    type: Number,
    required: [true, "El precio es obligatorio"],
    min: [0, "El precio debe ser mayor o igual a 0"],
  },
  stock: {
    type: Number,
    required: [true, "El stock es obligatorio"],
    min: [0, "El stock debe ser mayor o igual a 0"],
    default: 0,
  },
  category: {
    type: String,
    required: [true, "La categoría es obligatoria"],
    trim: true,
    maxlength: [50, "La categoría no puede exceder 50 caracteres"],
  },
  thumbnail: {
    type: String,
    trim: true,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice único para el código
productSchema.index({ code: 1 }, { unique: true });

// Middleware para actualizar updatedAt antes de guardar
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware para actualizar updatedAt antes de actualizar
productSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Método estático para buscar por código
productSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Método para verificar si hay stock disponible
productSchema.methods.hasStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Método para reducir stock
productSchema.methods.reduceStock = function (quantity = 1) {
  if (!this.hasStock(quantity)) {
    throw new Error("Stock insuficiente");
  }
  this.stock -= quantity;
  return this.save();
};

// Método para aumentar stock
productSchema.methods.increaseStock = function (quantity = 1) {
  this.stock += quantity;
  return this.save();
};

const Product = mongoose.model("Product", productSchema);

export default Product;

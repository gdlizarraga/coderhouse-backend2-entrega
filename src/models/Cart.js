import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
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

// Índice compuesto: un usuario solo puede tener un carrito activo
cartSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

// Middleware para actualizar updatedAt antes de guardar
cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Método para calcular el precio total
cartSchema.methods.calculateTotalPrice = function () {
  this.totalPrice = this.products.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);
  return this.totalPrice;
};

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;

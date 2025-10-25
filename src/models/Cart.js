import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
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
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
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

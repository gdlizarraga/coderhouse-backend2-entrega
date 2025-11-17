import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purchase_datetime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaser: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Método estático para generar código único
ticketSchema.statics.generateUniqueCode = async function () {
  let code;
  let exists = true;

  while (exists) {
    // Generar código: TICKET-TIMESTAMP-RANDOM
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `TICKET-${timestamp}-${random}`;

    // Verificar si ya existe
    const ticket = await this.findOne({ code });
    exists = !!ticket;
  }

  return code;
};

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;

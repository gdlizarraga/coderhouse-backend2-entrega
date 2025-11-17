/**
 * TicketDTO - Data Transfer Object para Ticket
 * Transforma datos entre la capa de persistencia y la capa de presentación
 */
export class TicketDTO {
  constructor(ticket) {
    this.id = ticket._id?.toString();
    this.code = ticket.code;
    this.purchase_datetime = ticket.purchase_datetime;
    this.amount = ticket.amount;
    this.purchaser = ticket.purchaser;
    this.cart = ticket.cart?._id
      ? {
          id: ticket.cart._id.toString(),
          products: ticket.cart.products?.map((item) => ({
            product: item.product?._id
              ? {
                  id: item.product._id.toString(),
                  title: item.product.title,
                  price: item.product.price,
                  thumbnail: item.product.thumbnail,
                  category: item.product.category,
                }
              : item.product,
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice: ticket.cart.totalPrice,
        }
      : ticket.cart;
    this.createdAt = ticket.createdAt;
  }

  /**
   * Convierte el DTO a un objeto plano para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      purchase_datetime: this.purchase_datetime,
      amount: this.amount,
      purchaser: this.purchaser,
      cart: this.cart,
      createdAt: this.createdAt,
    };
  }

  /**
   * Crea un TicketDTO desde datos de entrada (para crear)
   */
  static fromInput(data) {
    return {
      code: data.code,
      purchase_datetime: data.purchase_datetime || new Date(),
      amount: parseFloat(data.amount),
      purchaser: data.purchaser,
      cart: data.cart || data.cartId,
    };
  }

  /**
   * Versión simplificada para listados
   */
  toSummary() {
    return {
      id: this.id,
      code: this.code,
      purchase_datetime: this.purchase_datetime,
      amount: this.amount,
      purchaser: this.purchaser,
    };
  }
}

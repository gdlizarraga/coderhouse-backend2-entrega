/**
 * CartDTO - Data Transfer Object para Carrito
 * Transforma datos entre la capa de persistencia y la capa de presentación
 */
export class CartDTO {
  constructor(cart) {
    this.id = cart._id?.toString();
    this.user = cart.user?._id?.toString() || cart.user;
    this.products = cart.products?.map((item) => ({
      product: item.product?._id
        ? {
            id: item.product._id.toString(),
            title: item.product.title,
            price: item.product.price,
            thumbnail: item.product.thumbnail,
            category: item.product.category,
            stock: item.product.stock,
          }
        : item.product,
      quantity: item.quantity,
      price: item.price,
    }));
    this.totalPrice = cart.totalPrice;
    this.status = cart.status;
    this.createdAt = cart.createdAt;
    this.updatedAt = cart.updatedAt;
  }

  /**
   * Convierte el DTO a un objeto plano para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      user: this.user,
      products: this.products,
      totalPrice: this.totalPrice,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Crea un CartDTO desde datos de entrada (para crear)
   */
  static fromInput(data) {
    return {
      user: data.user || data.userId,
      products: data.products || [],
      status: data.status || "active",
    };
  }

  /**
   * Versión simplificada para badge/contador
   */
  toSummary() {
    return {
      id: this.id,
      itemCount:
        this.products?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      totalPrice: this.totalPrice,
      status: this.status,
    };
  }
}

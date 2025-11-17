/**
 * ProductDTO - Data Transfer Object para Producto
 * Transforma datos entre la capa de persistencia y la capa de presentación
 */
export class ProductDTO {
  constructor(product) {
    this.id = product._id?.toString();
    this.title = product.title;
    this.description = product.description;
    this.code = product.code;
    this.price = product.price;
    this.stock = product.stock;
    this.category = product.category;
    this.thumbnail = product.thumbnail;
    this.status = product.status;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }

  /**
   * Convierte el DTO a un objeto plano para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      code: this.code,
      price: this.price,
      stock: this.stock,
      category: this.category,
      thumbnail: this.thumbnail,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Crea un ProductDTO desde datos de entrada (para crear/actualizar)
   */
  static fromInput(data) {
    return {
      title: data.title,
      description: data.description,
      code: data.code,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      category: data.category,
      thumbnail: data.thumbnail,
      status: data.status !== undefined ? data.status : true,
    };
  }

  /**
   * Versión mínima del producto para listados
   */
  toSummary() {
    return {
      id: this.id,
      title: this.title,
      price: this.price,
      stock: this.stock,
      thumbnail: this.thumbnail,
    };
  }
}

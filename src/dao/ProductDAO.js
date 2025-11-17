import Product from "../models/Product.js";

/**
 * ProductDAO - Data Access Object para Producto
 * Maneja todas las operaciones de persistencia con la base de datos
 */
export class ProductDAO {
  /**
   * Obtener todos los productos con filtros opcionales
   */
  async findAll(filters = {}, options = {}) {
    const { limit, skip, sort } = options;
    let query = Product.find(filters);

    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    return await query.exec();
  }

  /**
   * Obtener un producto por ID
   */
  async findById(id) {
    return await Product.findById(id);
  }

  /**
   * Obtener un producto por código
   */
  async findByCode(code) {
    return await Product.findOne({ code });
  }

  /**
   * Crear un nuevo producto
   */
  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  /**
   * Actualizar un producto por ID
   */
  async updateById(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Eliminar un producto por ID
   */
  async deleteById(id) {
    return await Product.findByIdAndDelete(id);
  }

  /**
   * Contar productos con filtros opcionales
   */
  async count(filters = {}) {
    return await Product.countDocuments(filters);
  }

  /**
   * Verificar si existe un producto con un código
   */
  async existsByCode(code) {
    const count = await Product.countDocuments({ code });
    return count > 0;
  }

  /**
   * Buscar productos por categoría
   */
  async findByCategory(category) {
    return await Product.find({ category });
  }

  /**
   * Incrementar stock de un producto
   */
  async incrementStock(id, quantity) {
    return await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true }
    );
  }

  /**
   * Decrementar stock de un producto
   */
  async decrementStock(id, quantity) {
    return await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: -quantity } },
      { new: true }
    );
  }

  /**
   * Buscar productos con stock disponible
   */
  async findWithStock() {
    return await Product.find({ stock: { $gt: 0 } });
  }
}

export default new ProductDAO();

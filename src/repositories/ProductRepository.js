import ProductDAO from "../dao/ProductDAO.js";
import { ProductDTO } from "../dto/ProductDTO.js";

/**
 * ProductRepository - Capa de lógica de negocio para Productos
 * Usa el ProductDAO para acceder a datos y ProductDTO para transformarlos
 */
export class ProductRepository {
  constructor() {
    this.dao = ProductDAO;
  }

  /**
   * Obtener todos los productos con filtros y opciones
   */
  async getAll(filters = {}, options = {}) {
    const products = await this.dao.findAll(filters, options);
    return products.map((product) => new ProductDTO(product));
  }

  /**
   * Obtener un producto por ID
   */
  async getById(id) {
    const product = await this.dao.findById(id);
    return product ? new ProductDTO(product) : null;
  }

  /**
   * Obtener un producto por código
   */
  async getByCode(code) {
    const product = await this.dao.findByCode(code);
    return product ? new ProductDTO(product) : null;
  }

  /**
   * Crear un nuevo producto
   */
  async create(productData) {
    // Preparar datos usando el DTO
    const productInput = ProductDTO.fromInput(productData);

    const product = await this.dao.create(productInput);
    return new ProductDTO(product);
  }

  /**
   * Actualizar un producto
   */
  async update(id, updateData) {
    // Preparar datos para actualización
    const dataToUpdate = { ...updateData };
    dataToUpdate.updatedAt = new Date();

    const product = await this.dao.updateById(id, dataToUpdate);
    return product ? new ProductDTO(product) : null;
  }

  /**
   * Eliminar un producto
   */
  async delete(id) {
    const product = await this.dao.deleteById(id);
    return product ? new ProductDTO(product) : null;
  }

  /**
   * Verificar si existe un código
   */
  async codeExists(code) {
    return await this.dao.existsByCode(code);
  }

  /**
   * Obtener productos por categoría
   */
  async getByCategory(category) {
    const products = await this.dao.findByCategory(category);
    return products.map((product) => new ProductDTO(product));
  }

  /**
   * Incrementar stock
   */
  async incrementStock(id, quantity) {
    const product = await this.dao.incrementStock(id, quantity);
    return product ? new ProductDTO(product) : null;
  }

  /**
   * Decrementar stock
   */
  async decrementStock(id, quantity) {
    const product = await this.dao.decrementStock(id, quantity);
    return product ? new ProductDTO(product) : null;
  }

  /**
   * Verificar disponibilidad de stock
   */
  async hasStock(id, quantity) {
    const product = await this.dao.findById(id);
    return product && product.stock >= quantity;
  }

  /**
   * Obtener productos con stock disponible
   */
  async getWithStock() {
    const products = await this.dao.findWithStock();
    return products.map((product) => new ProductDTO(product));
  }

  /**
   * Contar productos
   */
  async count(filters = {}) {
    return await this.dao.count(filters);
  }

  /**
   * Aplicar filtros avanzados
   */
  async getFiltered(queryParams) {
    const filters = {};
    const options = {};

    // Filtros
    if (queryParams.category) {
      filters.category = queryParams.category;
    }

    if (queryParams.minPrice || queryParams.maxPrice) {
      filters.price = {};
      if (queryParams.minPrice)
        filters.price.$gte = parseFloat(queryParams.minPrice);
      if (queryParams.maxPrice)
        filters.price.$lte = parseFloat(queryParams.maxPrice);
    }

    if (queryParams.status !== undefined) {
      filters.status = queryParams.status === "true";
    }

    // Ordenamiento
    if (queryParams.sort) {
      const sortMap = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        title_asc: { title: 1 },
        title_desc: { title: -1 },
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
      };
      options.sort = sortMap[queryParams.sort] || { createdAt: -1 };
    }

    // Paginación
    if (queryParams.limit) {
      options.limit = parseInt(queryParams.limit);
    }
    if (queryParams.page) {
      const page = parseInt(queryParams.page);
      const limit = options.limit || 10;
      options.skip = (page - 1) * limit;
    }

    const products = await this.getAll(filters, options);
    const total = await this.count(filters);

    return {
      products,
      total,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: options.limit || total,
    };
  }
}

export default new ProductRepository();

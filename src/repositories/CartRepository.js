import CartDAO from "../dao/CartDAO.js";
import { CartDTO } from "../dto/CartDTO.js";
import ProductRepository from "./ProductRepository.js";

/**
 * CartRepository - Capa de lógica de negocio para Carritos
 * Usa el CartDAO para acceder a datos y CartDTO para transformarlos
 */
export class CartRepository {
  constructor() {
    this.dao = CartDAO;
    this.productRepo = ProductRepository;
  }

  /**
   * Obtener todos los carritos
   */
  async getAll(filters = {}, options = {}) {
    const carts = await this.dao.findAll(filters, options);
    return carts.map((cart) => new CartDTO(cart));
  }

  /**
   * Obtener un carrito por ID
   */
  async getById(id) {
    const cart = await this.dao.findById(id, ["products.product"]);
    return cart ? new CartDTO(cart) : null;
  }

  /**
   * Obtener carrito activo de un usuario
   */
  async getActiveByUser(userId) {
    const cart = await this.dao.findActiveByUser(userId);
    return cart ? new CartDTO(cart) : null;
  }

  /**
   * Crear un nuevo carrito
   */
  async create(cartData) {
    const cartInput = CartDTO.fromInput(cartData);
    const cart = await this.dao.create(cartInput);
    return new CartDTO(cart);
  }

  /**
   * Actualizar un carrito
   */
  async update(id, updateData) {
    const cart = await this.dao.updateById(id, updateData);
    return cart ? new CartDTO(cart) : null;
  }

  /**
   * Eliminar un carrito
   */
  async delete(id) {
    const cart = await this.dao.deleteById(id);
    return cart ? new CartDTO(cart) : null;
  }

  /**
   * Agregar producto al carrito con validación de stock
   */
  async addProduct(userId, productId, quantity) {
    // Obtener precio actual del producto
    const product = await this.productRepo.getById(productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    // Validar stock disponible
    const hasStock = await this.productRepo.hasStock(productId, quantity);
    if (!hasStock) {
      throw new Error("Stock insuficiente");
    }

    // Obtener o crear carrito activo
    let cart = await this.dao.findActiveByUser(userId);
    if (!cart) {
      cart = await this.dao.create({
        user: userId,
        products: [],
        status: "active",
      });
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.products?.find(
      (item) => item.product?.toString() === productId
    );

    let quantityNeeded = quantity;
    if (existingItem) {
      // Si ya existe, verificar stock para la cantidad adicional
      const totalNeeded = existingItem.quantity + quantity;
      if (!(await this.productRepo.hasStock(productId, totalNeeded))) {
        throw new Error("Stock insuficiente para la cantidad total solicitada");
      }
      quantityNeeded = quantity; // Solo descontar la nueva cantidad
    }

    // Descontar stock
    await this.productRepo.decrementStock(productId, quantityNeeded);

    // Agregar producto al carrito
    const cartId = cart._id.toString();
    const updatedCart = await this.dao.addProduct(
      cartId,
      productId,
      quantity,
      product.price
    );

    // Obtener el carrito completo con productos populados
    const populatedCart = await this.dao.findById(cartId, ["products.product"]);
    return new CartDTO(populatedCart);
  }

  /**
   * Actualizar cantidad de producto en carrito
   */
  async updateProductQuantity(cartId, productId, newQuantity) {
    const cart = await this.dao.findById(cartId);
    if (!cart) throw new Error("Carrito no encontrado");

    const item = cart.products.find((p) => p.product.toString() === productId);
    if (!item) throw new Error("Producto no encontrado en el carrito");

    const difference = newQuantity - item.quantity;

    if (difference > 0) {
      // Aumentar cantidad: verificar stock y descontar
      const hasStock = await this.productRepo.hasStock(productId, difference);
      if (!hasStock) throw new Error("Stock insuficiente");
      await this.productRepo.decrementStock(productId, difference);
    } else if (difference < 0) {
      // Reducir cantidad: devolver stock
      await this.productRepo.incrementStock(productId, Math.abs(difference));
    }

    const updatedCart = await this.dao.updateProductQuantity(
      cartId,
      productId,
      newQuantity
    );
    return new CartDTO(
      await this.dao.findById(updatedCart._id, ["products.product"])
    );
  }

  /**
   * Eliminar producto del carrito
   */
  async removeProduct(cartId, productId) {
    const cart = await this.dao.findById(cartId);
    if (!cart) throw new Error("Carrito no encontrado");

    const item = cart.products.find((p) => p.product.toString() === productId);
    if (item) {
      // Devolver stock
      await this.productRepo.incrementStock(productId, item.quantity);
    }

    const updatedCart = await this.dao.removeProduct(cartId, productId);
    return new CartDTO(updatedCart);
  }

  /**
   * Vaciar carrito
   */
  async clearCart(cartId) {
    const cart = await this.dao.findById(cartId);
    if (!cart) throw new Error("Carrito no encontrado");

    // Devolver stock de todos los productos
    for (const item of cart.products) {
      await this.productRepo.incrementStock(
        item.product.toString(),
        item.quantity
      );
    }

    const updatedCart = await this.dao.clearCart(cartId);
    return new CartDTO(updatedCart);
  }

  /**
   * Obtener carritos de un usuario por estado
   */
  async getByUserAndStatus(userId, status) {
    const carts = await this.dao.findByUserAndStatus(userId, status);
    return carts.map((cart) => new CartDTO(cart));
  }

  /**
   * Finalizar compra (purchase)
   */
  async purchase(cartId) {
    const cart = await this.dao.findById(cartId, ["products.product"]);
    if (!cart) throw new Error("Carrito no encontrado");

    const productsProcessed = [];
    const productsNotProcessed = [];

    for (const item of cart.products) {
      const product = item.product;

      if (product.stock >= item.quantity) {
        // Producto tiene stock suficiente
        productsProcessed.push({
          product: product._id,
          title: product.title,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        });
      } else {
        // Producto sin stock suficiente
        productsNotProcessed.push({
          product: product._id,
          title: product.title,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
        });

        // Devolver stock del carrito
        await this.productRepo.incrementStock(
          product._id.toString(),
          item.quantity
        );
      }
    }

    // Calcular monto total de productos procesados
    const totalAmount = productsProcessed.reduce(
      (sum, p) => sum + p.subtotal,
      0
    );

    // Actualizar carrito: eliminar productos no procesados
    if (productsNotProcessed.length > 0) {
      cart.products = cart.products.filter((item) =>
        productsProcessed.some(
          (p) => p.product.toString() === item.product._id.toString()
        )
      );
      await cart.save();
    }

    // Cambiar estado del carrito
    const status = productsNotProcessed.length === 0 ? "completed" : "active";
    await this.dao.updateStatus(cartId, status);

    return {
      productsProcessed,
      productsNotProcessed,
      totalAmount,
      cartId,
    };
  }

  /**
   * Contar carritos
   */
  async count(filters = {}) {
    return await this.dao.count(filters);
  }
}

export default new CartRepository();

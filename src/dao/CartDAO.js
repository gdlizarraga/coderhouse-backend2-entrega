import Cart from "../models/Cart.js";

/**
 * CartDAO - Data Access Object para Carrito
 * Maneja todas las operaciones de persistencia con la base de datos
 */
export class CartDAO {
  /**
   * Obtener todos los carritos con filtros opcionales
   */
  async findAll(filters = {}, options = {}) {
    const { limit, skip, sort, populate } = options;
    let query = Cart.find(filters);

    if (populate) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    return await query.exec();
  }

  /**
   * Obtener un carrito por ID
   */
  async findById(id, populate = null) {
    let query = Cart.findById(id);

    if (populate) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    return await query.exec();
  }

  /**
   * Obtener carrito activo de un usuario
   */
  async findActiveByUser(userId) {
    return await Cart.findOne({ user: userId, status: "active" }).populate(
      "products.product"
    );
  }

  /**
   * Crear un nuevo carrito
   */
  async create(cartData) {
    const cart = new Cart(cartData);
    return await cart.save();
  }

  /**
   * Actualizar un carrito por ID
   */
  async updateById(id, updateData) {
    return await Cart.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("products.product");
  }

  /**
   * Eliminar un carrito por ID
   */
  async deleteById(id) {
    return await Cart.findByIdAndDelete(id);
  }

  /**
   * Agregar producto al carrito
   */
  async addProduct(cartId, productId, quantity, price) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    const existingItem = cart.products.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.products.push({ product: productId, quantity, price });
    }

    // Calcular totalPrice manualmente ya que los productos no están populados
    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    return await cart.save();
  }

  /**
   * Actualizar cantidad de producto en carrito
   */
  async updateProductQuantity(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    const item = cart.products.find(
      (item) => item.product.toString() === productId
    );

    if (item) {
      item.quantity = quantity;

      // Calcular totalPrice manualmente
      cart.totalPrice = cart.products.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      return await cart.save();
    }

    return null;
  }

  /**
   * Eliminar producto del carrito
   */
  async removeProduct(cartId, productId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    cart.products = cart.products.filter(
      (item) => item.product.toString() !== productId
    );

    // Calcular totalPrice manualmente
    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    await cart.save();
    return await Cart.findById(cartId).populate("products.product");
  }

  /**
   * Vaciar carrito
   */
  async clearCart(cartId) {
    return await Cart.findByIdAndUpdate(
      cartId,
      { products: [], totalPrice: 0 },
      { new: true }
    );
  }

  /**
   * Obtener carritos de un usuario por estado
   */
  async findByUserAndStatus(userId, status) {
    return await Cart.find({ user: userId, status }).populate(
      "products.product"
    );
  }

  /**
   * Cambiar estado del carrito
   */
  async updateStatus(cartId, status) {
    return await Cart.findByIdAndUpdate(
      cartId,
      { status },
      { new: true }
    ).populate("products.product");
  }

  /**
   * Contar carritos con filtros opcionales
   */
  async count(filters = {}) {
    return await Cart.countDocuments(filters);
  }
}

export default new CartDAO();

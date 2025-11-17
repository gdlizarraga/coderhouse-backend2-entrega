import express from "express";
import CartRepository from "../repositories/CartRepository.js";
import TicketRepository from "../repositories/TicketRepository.js";
import ProductRepository from "../repositories/ProductRepository.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Todos los endpoints requieren autenticación y role "user"
router.use(authenticateJWT, authorizeRoles("user"));

/**
 * @route   GET /api/carts
 * @desc    Obtener el carrito activo del usuario autenticado
 * @access  Private/User
 */
router.get("/", async (req, res) => {
  try {
    console.log("🛒 GET /api/carts - Usuario autenticado:", {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    const cartDTO = await CartRepository.getActiveByUser(req.user.id);

    console.log(
      "🛒 Carrito encontrado:",
      cartDTO ? `Sí (${cartDTO.products?.length || 0} productos)` : "No"
    );

    if (!cartDTO) {
      return res.status(404).json({
        success: false,
        message: "No tienes un carrito activo",
        code: "CART_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      message: "Carrito obtenido exitosamente",
      data: cartDTO.toJSON(),
    });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener carrito",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/carts/products
 * @desc    Agregar un producto al carrito (crea carrito si no existe)
 * @access  Private/User
 */
router.post("/products", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validar que se envió el productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "El productId es obligatorio",
        code: "PRODUCT_ID_REQUIRED",
      });
    }

    // Validar que la cantidad sea válida
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "La cantidad debe ser mayor a 0",
        code: "INVALID_QUANTITY",
      });
    }

    // Verificar que el producto existe
    const product = await ProductRepository.getById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
        code: "PRODUCT_NOT_FOUND",
      });
    }

    // Verificar que hay stock suficiente
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Solo hay ${product.stock} unidades disponibles`,
        code: "INSUFFICIENT_STOCK",
      });
    }

    // Agregar producto al carrito usando el Repository
    const cartDTO = await CartRepository.addProduct(
      req.user.id,
      productId,
      quantity
    );

    res.status(200).json({
      success: true,
      message: "Producto agregado al carrito exitosamente",
      data: cartDTO.toJSON(),
    });
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al agregar producto al carrito",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/carts/products/:productId
 * @desc    Actualizar la cantidad de un producto en el carrito
 * @access  Private/User
 */
router.put("/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validar cantidad
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "La cantidad debe ser mayor a 0",
        code: "INVALID_QUANTITY",
      });
    }

    // Buscar carrito activo
    const cart = await CartRepository.getActiveByUser(req.user.id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "No tienes un carrito activo",
        code: "CART_NOT_FOUND",
      });
    }

    // Actualizar cantidad usando el Repository
    const updatedCart = await CartRepository.updateProductQuantity(
      cart.id,
      productId,
      quantity
    );

    res.json({
      success: true,
      message: "Cantidad actualizada exitosamente",
      data: updatedCart.toJSON(),
    });
  } catch (error) {
    console.error("Error al actualizar cantidad:", error);

    if (error.message === "Stock insuficiente") {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "INSUFFICIENT_STOCK",
      });
    }

    if (error.message === "Producto no encontrado en el carrito") {
      return res.status(404).json({
        success: false,
        message: error.message,
        code: "PRODUCT_NOT_IN_CART",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al actualizar cantidad",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/carts/products/:productId
 * @desc    Eliminar un producto del carrito
 * @access  Private/User
 */
router.delete("/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Buscar carrito activo
    const cart = await CartRepository.getActiveByUser(req.user.id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "No tienes un carrito activo",
        code: "CART_NOT_FOUND",
      });
    }

    // Eliminar producto usando el Repository
    const updatedCart = await CartRepository.removeProduct(cart.id, productId);

    res.json({
      success: true,
      message: "Producto eliminado del carrito exitosamente",
      data: updatedCart.toJSON(),
    });
  } catch (error) {
    console.error("Error al eliminar producto del carrito:", error);

    if (error.message === "Producto no encontrado en el carrito") {
      return res.status(404).json({
        success: false,
        message: error.message,
        code: "PRODUCT_NOT_IN_CART",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al eliminar producto del carrito",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/carts
 * @desc    Vaciar el carrito (eliminar todos los productos)
 * @access  Private/User
 */
router.delete("/", async (req, res) => {
  try {
    const cart = await CartRepository.getActiveByUser(req.user.id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "No tienes un carrito activo",
        code: "CART_NOT_FOUND",
      });
    }

    // Vaciar carrito usando el Repository
    const clearedCart = await CartRepository.clearCart(cart.id);

    res.json({
      success: true,
      message: "Carrito vaciado exitosamente",
      data: clearedCart.toJSON(),
    });
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al vaciar carrito",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/carts/:cid/purchase
 * @desc    Finalizar compra del carrito - Crear ticket
 * @access  Private/User
 */
router.post("/:cid/purchase", async (req, res) => {
  try {
    const { cid } = req.params;

    // Buscar el carrito usando el Repository
    const cart = await CartRepository.getById(cid);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Carrito no encontrado",
        code: "CART_NOT_FOUND",
      });
    }

    // Verificar que el carrito pertenece al usuario
    if (cart.user !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para finalizar esta compra",
        code: "FORBIDDEN",
      });
    }

    // Verificar que el carrito está activo
    if (cart.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "El carrito no está activo",
        code: "CART_NOT_ACTIVE",
      });
    }

    // Verificar que hay productos en el carrito
    if (!cart.products || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío",
        code: "EMPTY_CART",
      });
    }

    // Procesar la compra usando el Repository
    const purchaseResult = await CartRepository.purchase(cid);

    const { productsProcessed, productsNotProcessed, totalAmount } =
      purchaseResult;

    // Si no se pudo procesar ningún producto
    if (productsProcessed.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay stock suficiente para ningún producto del carrito",
        code: "INSUFFICIENT_STOCK",
        data: {
          productsNotProcessed,
        },
      });
    }

    // Crear el ticket usando el Repository
    const ticketData = {
      amount: totalAmount,
      purchaser: req.user.email,
      cart: cid,
    };

    const ticket = await TicketRepository.create(ticketData);

    console.log(`🎫 Ticket creado: ${ticket.code} - Monto: $${totalAmount}`);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message:
        productsNotProcessed.length > 0
          ? "Compra finalizada parcialmente. Algunos productos no tenían stock suficiente"
          : "Compra finalizada exitosamente",
      data: {
        ticket: ticket.toJSON(),
        productsProcessed,
        productsNotProcessed,
      },
    });
  } catch (error) {
    console.error("Error al finalizar compra:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al finalizar la compra",
      error: error.message,
    });
  }
});

export default router;

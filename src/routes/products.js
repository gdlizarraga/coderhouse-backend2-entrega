import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import ProductRepository from "../repositories/ProductRepository.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import {
  validateProductCreation,
  validateProductUpdate,
} from "../middleware/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/productos"));
  },
  filename: function (req, file, cb) {
    // El nombre se establecerá después de crear el producto
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
  },
});

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { title, category, minPrice, maxPrice, sort } = req.query;

    // Construir el filtro
    const filter = {};
    if (title) filter.title = { $regex: title, $options: "i" };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Usar el repository para obtener productos filtrados
    const result = await ProductRepository.getFiltered(req.query);

    res.json({
      success: true,
      message: "Productos obtenidos exitosamente",
      data: {
        products: result.products.map((p) => p.toJSON()),
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto por ID
 * @access  Private/Admin
 */
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const product = await ProductRepository.getById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
          code: "PRODUCT_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        message: "Producto obtenido exitosamente",
        data: {
          product: product.toJSON(),
        },
      });
    } catch (error) {
      console.error("Error al obtener producto:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "ID de producto inválido",
          code: "INVALID_PRODUCT_ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al obtener producto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

/**
 * @route   POST /api/products
 * @desc    Crear un nuevo producto
 * @access  Private/Admin
 */
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin"),
  upload.single("thumbnail"),
  validateProductCreation,
  async (req, res) => {
    try {
      const { title, description, code, price, stock, category } = req.body;

      // Verificar si el código ya existe
      const codeExists = await ProductRepository.codeExists(code.toUpperCase());
      if (codeExists) {
        // Si hay archivo subido, eliminarlo
        if (req.file) {
          const fs = await import("fs/promises");
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(409).json({
          success: false,
          message: "Ya existe un producto con este código",
          code: "CODE_ALREADY_EXISTS",
        });
      }

      // Crear el nuevo producto sin thumbnail primero
      const productData = {
        title,
        description,
        code: code.toUpperCase(),
        price,
        stock,
        category,
        thumbnail: "",
      };

      const newProduct = await ProductRepository.create(productData);

      // Si hay archivo, renombrarlo con el ID del producto
      let productToReturn = newProduct;
      if (req.file) {
        const fs = await import("fs/promises");
        const oldPath = req.file.path;
        const newFilename = `${newProduct.id}-${req.file.originalname}`;
        const newPath = path.join(
          __dirname,
          "../../public/productos",
          newFilename
        );

        await fs.rename(oldPath, newPath);

        // Actualizar el producto con la ruta del thumbnail
        const thumbnailPath = `/productos/${newFilename}`;
        productToReturn = await ProductRepository.update(newProduct.id, {
          thumbnail: thumbnailPath,
        });
      }

      res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: {
          product: productToReturn.toJSON(),
        },
      });
    } catch (error) {
      console.error("Error al crear producto:", error);

      // Si hay archivo subido, eliminarlo en caso de error
      if (req.file) {
        const fs = await import("fs/promises");
        await fs.unlink(req.file.path).catch(() => {});
      }

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Error de validación",
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al crear producto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar un producto
 * @access  Private/Admin
 */
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  upload.single("thumbnail"),
  validateProductUpdate,
  async (req, res) => {
    try {
      const { title, description, code, price, stock, category } = req.body;

      // Verificar que el producto existe
      const product = await ProductRepository.getById(req.params.id);
      if (!product) {
        // Si hay archivo subido, eliminarlo
        if (req.file) {
          const fs = await import("fs/promises");
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
          code: "PRODUCT_NOT_FOUND",
        });
      }

      // Si se está actualizando el código, verificar que no exista
      if (code && code.toUpperCase() !== product.code) {
        const existingProduct = await ProductRepository.getByCode(
          code.toUpperCase()
        );
        if (existingProduct) {
          // Si hay archivo subido, eliminarlo
          if (req.file) {
            const fs = await import("fs/promises");
            await fs.unlink(req.file.path).catch(() => {});
          }
          return res.status(409).json({
            success: false,
            message: "Ya existe un producto con este código",
            code: "CODE_ALREADY_EXISTS",
          });
        }
      }

      // Actualizar los campos
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (code !== undefined) updates.code = code.toUpperCase();
      if (price !== undefined) updates.price = price;
      if (stock !== undefined) updates.stock = stock;
      if (category !== undefined) updates.category = category;

      // Si hay un nuevo archivo
      if (req.file) {
        const fs = await import("fs/promises");

        // Eliminar el archivo anterior si existe
        if (product.thumbnail) {
          const oldFilePath = path.join(
            __dirname,
            "../../public",
            product.thumbnail
          );
          await fs.unlink(oldFilePath).catch(() => {});
        }

        // Renombrar el nuevo archivo con el ID del producto
        const oldPath = req.file.path;
        const newFilename = `${product.id}-${req.file.originalname}`;
        const newPath = path.join(
          __dirname,
          "../../public/productos",
          newFilename
        );

        await fs.rename(oldPath, newPath);

        updates.thumbnail = `/productos/${newFilename}`;
      }

      const updatedProduct = await ProductRepository.update(
        req.params.id,
        updates
      );

      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: {
          product: updatedProduct.toJSON(),
        },
      });
    } catch (error) {
      console.error("Error al actualizar producto:", error);

      // Si hay archivo subido, eliminarlo en caso de error
      if (req.file) {
        const fs = await import("fs/promises");
        await fs.unlink(req.file.path).catch(() => {});
      }

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Error de validación",
          errors,
        });
      }

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "ID de producto inválido",
          code: "INVALID_PRODUCT_ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar producto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar un producto
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const product = await ProductRepository.delete(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
          code: "PRODUCT_NOT_FOUND",
        });
      }

      // Eliminar el archivo de imagen si existe
      if (product.thumbnail) {
        const fs = await import("fs/promises");
        const filePath = path.join(
          __dirname,
          "../../public",
          product.thumbnail
        );
        await fs.unlink(filePath).catch((err) => {
          console.log("No se pudo eliminar la imagen:", err.message);
        });
      }

      res.json({
        success: true,
        message: "Producto eliminado exitosamente",
        data: {
          product,
        },
      });
    } catch (error) {
      console.error("Error al eliminar producto:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "ID de producto inválido",
          code: "INVALID_PRODUCT_ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al eliminar producto",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

export default router;

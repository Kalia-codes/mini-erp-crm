import { Response } from "express";
import {
  AuthRequest,
} from "../middleware/auth.middleware";

import {
  createProduct,
  createStockMovement,
  getProductById,
  getProducts,
  getStockMovements,
  updateProduct,
} from "../services/product.service";

/**
 * GET /api/products
 */
export const listProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : undefined;

    const products = await getProducts(search, category);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

/**
 * GET /api/products/:id
 */
export const getProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await getProductById(productId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

/**
 * POST /api/products
 */
export const addProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      warehouse_location,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      unit_price === undefined ||
      current_stock === undefined ||
      minimum_stock === undefined ||
      !warehouse_location
    ) {
      res.status(400).json({
        success: false,
        message: "All product fields are required",
      });
      return;
    }

    const unitPrice = Number(unit_price);
    const currentStock = Number(current_stock);
    const minimumStock = Number(minimum_stock);

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Unit price must be a valid non-negative number",
      });
      return;
    }

    if (
      !Number.isInteger(currentStock) ||
      currentStock < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Current stock must be a non-negative integer",
      });
      return;
    }

    if (
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Minimum stock must be a non-negative integer",
      });
      return;
    }

    const product = await createProduct({
      name: String(name).trim(),
      sku: String(sku).trim(),
      category: String(category).trim(),
      unit_price: unitPrice,
      current_stock: currentStock,
      minimum_stock: minimumStock,
      warehouse_location: String(warehouse_location).trim(),
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create product";

    if (message === "SKU already exists") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * PUT /api/products/:id
 */
export const editProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      warehouse_location,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      unit_price === undefined ||
      current_stock === undefined ||
      minimum_stock === undefined ||
      !warehouse_location
    ) {
      res.status(400).json({
        success: false,
        message: "All product fields are required",
      });
      return;
    }

    const unitPrice = Number(unit_price);
    const currentStock = Number(current_stock);
    const minimumStock = Number(minimum_stock);

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Unit price must be a valid non-negative number",
      });
      return;
    }

    if (
      !Number.isInteger(currentStock) ||
      currentStock < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Current stock must be a non-negative integer",
      });
      return;
    }

    if (
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Minimum stock must be a non-negative integer",
      });
      return;
    }

    const product = await updateProduct(productId, {
      name: String(name).trim(),
      sku: String(sku).trim(),
      category: String(category).trim(),
      unit_price: unitPrice,
      current_stock: currentStock,
      minimum_stock: minimumStock,
      warehouse_location: String(warehouse_location).trim(),
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update product";

    if (message === "Product not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (message === "SKU already exists") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/products/:id/stock
 */
export const addStockMovement = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    const {
      quantity,
      movement_type,
      reason,
    } = req.body;

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    if (
      quantity === undefined ||
      !movement_type ||
      !reason
    ) {
      res.status(400).json({
        success: false,
        message: "Quantity, movement type and reason are required",
      });
      return;
    }

    const movementQuantity = Number(quantity);

    if (
      !Number.isInteger(movementQuantity) ||
      movementQuantity <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    if (
      movement_type !== "IN" &&
      movement_type !== "OUT"
    ) {
      res.status(400).json({
        success: false,
        message: "Movement type must be IN or OUT",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User authentication required",
      });
      return;
    }

    const result = await createStockMovement(
      productId,
      movementQuantity,
      movement_type,
      String(reason).trim(),
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: "Stock movement recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Stock movement error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to record stock movement";

    if (
      message === "Product not found"
    ) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message.startsWith("Insufficient stock")
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/products/stock-movements
 */
export const listStockMovements = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let productId: number | undefined;

    if (req.query.productId !== undefined) {
      productId = Number(req.query.productId);

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
        return;
      }
    }

    const movements = await getStockMovements(productId);

    res.status(200).json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error("Get stock movements error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stock movements",
    });
  }
};
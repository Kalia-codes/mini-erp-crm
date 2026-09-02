import { Request, Response } from "express";
import {
  createStockMovement,
  getStockMovements,
} from "../services/stockMovement.service";

export const addStockMovement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      product_id,
      quantity,
      movement_type,
      reason,
    } = req.body;

    if (
      product_id === undefined ||
      quantity === undefined ||
      !movement_type ||
      !reason
    ) {
      res.status(400).json({
        success: false,
        message:
          "Product ID, quantity, movement type and reason are required",
      });
      return;
    }

    const productId = Number(product_id);
    const movementQuantity = Number(quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

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

    if (movement_type !== "IN" && movement_type !== "OUT") {
      res.status(400).json({
        success: false,
        message: "Movement type must be IN or OUT",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const movementId = await createStockMovement({
      product_id: productId,
      quantity: movementQuantity,
      movement_type,
      reason,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Stock movement created successfully",
      data: {
        id: movementId,
      },
    });
  } catch (error) {
    console.error("Stock movement error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create stock movement";

    if (
      message === "Product not found"
    ) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (message.startsWith("Insufficient stock")) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create stock movement",
    });
  }
};

export const listStockMovements = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let productId: number | undefined;

    if (typeof req.query.product_id === "string") {
      productId = Number(req.query.product_id);

      if (!Number.isInteger(productId) || productId <= 0) {
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
      message: "Stock movements fetched successfully",
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
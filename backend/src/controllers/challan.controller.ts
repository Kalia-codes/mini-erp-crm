import { Request, Response } from "express";
import {
  createChallan,
  getChallans,
  getChallanById,
  confirmChallan,
  cancelChallan,
} from "../services/challan.service";

export const addChallan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { customer_id, items } = req.body;

    if (customer_id === undefined || !Array.isArray(items)) {
      res.status(400).json({
        success: false,
        message: "Customer ID and items are required",
      });
      return;
    }

    const customerId = Number(customer_id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    if (items.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
      return;
    }

    const challan = await createChallan({
      customer_id: customerId,
      items,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Sales challan created successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Create challan error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create challan";

    if (
      message === "Customer not found" ||
      message.startsWith("Product") &&
        message.endsWith("not found")
    ) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const listChallans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const challans = await getChallans();

    res.status(200).json({
      success: true,
      message: "Challans fetched successfully",
      data: challans,
    });
  } catch (error) {
    console.error("Get challans error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch challans",
    });
  }
};

export const getChallan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid challan ID",
      });
      return;
    }

    const challan = await getChallanById(id);

    if (!challan) {
      res.status(404).json({
        success: false,
        message: "Challan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Challan fetched successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Get challan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch challan",
    });
  }
};

export const confirmSalesChallan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid challan ID",
      });
      return;
    }

    await confirmChallan(id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Challan confirmed successfully",
    });
  } catch (error) {
    console.error("Confirm challan error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to confirm challan";

    if (message === "Challan not found") {
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

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const cancelSalesChallan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid challan ID",
      });
      return;
    }

    await cancelChallan(id);

    res.status(200).json({
      success: true,
      message: "Challan cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel challan error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to cancel challan";

    if (message === "Challan not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message,
    });
  }
};
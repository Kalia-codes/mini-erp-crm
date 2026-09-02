import { Request, Response } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
} from "../services/customer.service";

export const addCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    } = req.body;

    if (!name || !mobile || !business_name || !customer_type) {
      res.status(400).json({
        success: false,
        message:
          "Name, mobile, business name and customer type are required",
      });
      return;
    }

    const validCustomerTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR",
    ];

    if (!validCustomerTypes.includes(customer_type)) {
      res.status(400).json({
        success: false,
        message:
          "Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR",
      });
      return;
    }

    const customerId = await createCustomer({
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        id: customerId,
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

export const listCustomers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const customers = await getCustomers(search);

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

export const getCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    const customer = await getCustomerById(id);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

export const editCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    const {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    } = req.body;

    if (!name || !mobile || !business_name || !customer_type) {
      res.status(400).json({
        success: false,
        message:
          "Name, mobile, business name and customer type are required",
      });
      return;
    }

    const validCustomerTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR",
    ];

    if (!validCustomerTypes.includes(customer_type)) {
      res.status(400).json({
        success: false,
        message:
          "Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR",
      });
      return;
    }

    const updated = await updateCustomer(id, {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};
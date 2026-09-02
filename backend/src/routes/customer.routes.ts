import { Router } from "express";
import {
  addCustomer,
  listCustomers,
  getCustomer,
  editCustomer,
} from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// Add customer
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  addCustomer
);

// List/search customers
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES", "ACCOUNTS"),
  listCustomers
);

// Get customer details
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "SALES", "ACCOUNTS"),
  getCustomer
);

// Edit customer
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  editCustomer
);

export default router;
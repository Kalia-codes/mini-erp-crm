import { Router } from "express";

import {
  addProduct,
  addStockMovement,
  editProduct,
  getProduct,
  listProducts,
  listStockMovements,
} from "../controllers/product.controller";

import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

// Stock movement list must come before /:id
router.get("/stock-movements/list", listStockMovements);

// Product APIs
router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", addProduct);
router.put("/:id", editProduct);

// Product stock movement
router.post("/:id/stock", addStockMovement);

export default router;
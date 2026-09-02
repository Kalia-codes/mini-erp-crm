import { Router } from "express";
import {
  addStockMovement,
  listStockMovements,
} from "../controllers/stockMovement.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  addStockMovement
);

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  listStockMovements
);

export default router;
import { Router } from "express";
import {
  addChallan,
  listChallans,
  getChallan,
  confirmSalesChallan,
  cancelSalesChallan,
} from "../controllers/challan.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  addChallan
);

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES", "ACCOUNTS"),
  listChallans
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "SALES", "ACCOUNTS"),
  getChallan
);

router.put(
  "/:id/confirm",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  confirmSalesChallan
);

router.put(
  "/:id/cancel",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  cancelSalesChallan
);

export default router;
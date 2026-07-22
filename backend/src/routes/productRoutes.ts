import { Router } from "express";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  addStockMovement,
} from "../controllers/productController";
import { asyncHandler } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProduct));
router.post("/", requireRole("ADMIN", "WAREHOUSE"), asyncHandler(createProduct));
router.put("/:id", requireRole("ADMIN", "WAREHOUSE"), asyncHandler(updateProduct));
router.post(
  "/:id/stock-movements",
  requireRole("ADMIN", "WAREHOUSE"),
  asyncHandler(addStockMovement)
);

export default router;

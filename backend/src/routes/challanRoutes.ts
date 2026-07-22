import { Router } from "express";
import {
  createChallan,
  listChallans,
  getChallan,
  updateChallanStatus,
} from "../controllers/challanController";
import { asyncHandler } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listChallans));
router.get("/:id", asyncHandler(getChallan));
router.post("/", requireRole("ADMIN", "SALES"), asyncHandler(createChallan));
router.patch(
  "/:id/status",
  requireRole("ADMIN", "SALES", "WAREHOUSE"),
  asyncHandler(updateChallanStatus)
);

export default router;

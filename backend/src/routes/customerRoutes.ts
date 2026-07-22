import { Router } from "express";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addFollowUp,
} from "../controllers/customerController";
import { asyncHandler } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// All customer routes require login. Admin + Sales can create/edit;
// Warehouse/Accounts can view (they need customer info for challans/invoices).
router.use(requireAuth);

router.get("/", asyncHandler(listCustomers));
router.get("/:id", asyncHandler(getCustomer));
router.post("/", requireRole("ADMIN", "SALES"), asyncHandler(createCustomer));
router.put("/:id", requireRole("ADMIN", "SALES"), asyncHandler(updateCustomer));
router.post("/:id/follow-ups", requireRole("ADMIN", "SALES"), asyncHandler(addFollowUp));

export default router;

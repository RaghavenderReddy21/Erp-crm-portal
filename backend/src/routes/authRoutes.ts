import { Router } from "express";
import { login, me } from "../controllers/authController";
import { asyncHandler } from "../utils/errors";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;

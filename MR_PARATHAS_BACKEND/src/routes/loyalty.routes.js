import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  getMyLoyaltySummary,
  getAdminLoyaltyOverview,
  adjustUserPoints,
} from "../controllers/loyalty.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/me", getMyLoyaltySummary);
router.get("/admin/overview", authorizeRoles("admin"), getAdminLoyaltyOverview);
router.patch(
  "/admin/users/:identifier/points",
  authorizeRoles("admin"),
  adjustUserPoints,
);

export default router;


// src/routes/auth.routes.js
import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  changeCurrentPassword,
  forgotPassword,
  resetForgotPassword,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userLoginValidator,
  userRegisterValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", userRegisterValidator(), validate, registerUser);
router.post("/login", userLoginValidator(), validate, login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.post(
  "/forgot-password",
  userForgotPasswordValidator(),
  validate,
  forgotPassword,
);
router.post(
  "/reset-password",
  userResetForgotPasswordValidator(),
  validate,
  resetForgotPassword,
);

// protect this route so req.user is populated
router.get("/me", verifyJWT, getCurrentUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);

export default router;

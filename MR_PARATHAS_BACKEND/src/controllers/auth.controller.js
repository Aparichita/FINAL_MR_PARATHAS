import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { sendMail } from "../utils/send-mail.js";

/* -------------------------------------------------------------------------- */
/* 🔐 JWT Config                                                              */
/* -------------------------------------------------------------------------- */
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret";
const REFRESH_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

if (
  process.env.NODE_ENV !== "production" &&
  (JWT_SECRET === "dev_jwt_secret" || REFRESH_SECRET === "dev_refresh_secret")
) {
  console.warn(
    "⚠️ Using default development JWT secrets. Set JWT_SECRET and REFRESH_TOKEN_SECRET in .env for production."
  );
}

/* -------------------------------------------------------------------------- */
/* 🪙 Token Helpers                                                           */
/* -------------------------------------------------------------------------- */
const generateAccessToken = (user) =>
  jwt.sign(
    { id: String(user._id), _id: String(user._id), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ id: String(user._id), _id: String(user._id) }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

export const generateAccessAndRefreshTokens = async (user) => {
  const u = user._id ? user : await User.findById(user);
  if (!u) throw new ApiError(404, "User not found for token generation");

  const accessToken = generateAccessToken(u);
  const refreshToken = generateRefreshToken(u);

  // store refresh token
  u.refreshTokens = u.refreshTokens || [];
  u.refreshTokens.push({ token: refreshToken, createdAt: new Date() });

  // keep only recent refresh tokens
  const MAX_REFRESH_TOKENS = Number(process.env.MAX_REFRESH_TOKENS) || 10;
  if (u.refreshTokens.length > MAX_REFRESH_TOKENS)
    u.refreshTokens = u.refreshTokens.slice(-MAX_REFRESH_TOKENS);

  await u.save();
  return { accessToken, refreshToken };
};

/* -------------------------------------------------------------------------- */
/* 🧍 Register User                                                           */
/* -------------------------------------------------------------------------- */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "None",
};

export const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !password || !username)
    throw new ApiError(400, "All fields are required");

  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password))
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and include one number and one symbol"
    );

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser)
    throw new ApiError(409, "User with email or username already exists");

  const user = await User.create({
    email,
    username,
    password,
    role: "customer",
    isEmailVerified: false,
  });

  const { hashedToken, tokenExpiry } = user.generateTemporaryToken();
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens -emailVerificationToken -emailVerificationExpiry"
  );

  // Send welcome email
  try {
    await sendMail(
      email,
      "Welcome to Mr. Parathas",
      "Thank you for registering with Mr. Parathas!",
      `<h1>Welcome, ${username}!</h1><p>Thank you for joining Mr. Parathas.</p>`
    );
    console.log("Welcome email sent to:", email);
  } catch (error) {
    console.error("Failed to send welcome email:", error.message);
  }

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { user: createdUser, accessToken, refreshToken },
        "User registered successfully"
      )
    );
});

/* -------------------------------------------------------------------------- */
/* 🔑 Login                                                                   */
/* -------------------------------------------------------------------------- */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshTokens -emailVerificationToken -emailVerificationExpiry"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Login successful"
      )
    );
});

/* -------------------------------------------------------------------------- */
/* 🚪 Logout                                                                  */
/* -------------------------------------------------------------------------- */
export const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(200).json(new ApiResponse(200, {}, "Logged out"));

  let payload = null;
  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch {}

  if (payload) {
    const user = await User.findById(payload.id);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (r) => r.token !== refreshToken
      );
      await user.save();
    }
  }

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

/* -------------------------------------------------------------------------- */
/* 👤 Get Current User                                                        */
/* -------------------------------------------------------------------------- */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Fetched current user successfully"));
});

/* -------------------------------------------------------------------------- */
/* 🔁 Refresh Access Token                                                    */
/* -------------------------------------------------------------------------- */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized access");

  try {
    const decoded = jwt.verify(incomingRefreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded?._id);

    if (!user) throw new ApiError(401, "User not found");

    const found = user.refreshTokens.find(
      (r) => r.token === incomingRefreshToken
    );
    if (!found) throw new ApiError(401, "Invalid refresh token");

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token refreshed successfully"
        )
      );
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
});

/* -------------------------------------------------------------------------- */
/* 🔑 Change Password                                                         */
/* -------------------------------------------------------------------------- */
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) throw new ApiError(400, "Incorrect old password");

  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(newPassword))
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and include one number and one symbol"
    );

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/* -------------------------------------------------------------------------- */
/* 🧾 Forgot Password                                                         */
/* -------------------------------------------------------------------------- */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) {
    // Avoid leaking which emails exist
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If an account exists with that email, a reset link has been sent",
        ),
      );
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const frontendBase = (process.env.FRONTEND_URL || "http://localhost:5173")
    .replace(/\/$/, "");
  const resetLink = `${frontendBase}/reset-password?token=${unHashedToken}&email=${encodeURIComponent(
    email,
  )}`;

  try {
    await sendMail(
      email,
      "Reset your Mr. Parathas password",
      `We received a request to reset your password. Use the secure link below:\n\n${resetLink}\n\nThe link expires in 20 minutes.`,
      `<p>We received a request to reset your password.</p>
       <p><a href="${resetLink}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#d77b36;color:#fff;text-decoration:none;">Reset password</a></p>
       <p>This link expires in 20 minutes. If you did not make this request, you can safely ignore this email.</p>`,
    );
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If an account exists with that email, a reset link has been sent",
      ),
    );
});

/* -------------------------------------------------------------------------- */
/* 🔁 Reset Forgot Password                                                   */
/* -------------------------------------------------------------------------- */
export const resetForgotPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword)
    throw new ApiError(400, "Email, token and new password are required");

  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(newPassword))
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and include one number and one symbol",
    );

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email,
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

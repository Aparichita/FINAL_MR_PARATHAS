import mongoose from "mongoose";
import Order from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { logAudit } from "../utils/audit.js";

/* -------------------------------------------------------------------------- */
/* 👤 Get loyalty summary for current user                                     */
/* -------------------------------------------------------------------------- */
export const getMyLoyaltySummary = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const user = await User.findById(userId).select("points username email");

  if (!user) throw new ApiError(404, "User not found");

  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .select("totalAmount meta orderStatus createdAt");

  const lifetimeEarned = orders.reduce(
    (sum, order) => sum + Number(order.meta?.pointsEarned || 0),
    0,
  );
  const lifetimeRedeemed = orders.reduce(
    (sum, order) => sum + Number(order.meta?.redeemedPoints || 0),
    0,
  );

  const recentOrders = orders.slice(0, 5).map((order) => ({
    id: order._id,
    createdAt: order.createdAt,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    pointsEarned: Number(order.meta?.pointsEarned || 0),
    redeemedPoints: Number(order.meta?.redeemedPoints || 0),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        points: user.points || 0,
        lifetimeEarned,
        lifetimeRedeemed,
        recentOrders,
      },
      "Loyalty summary fetched successfully",
    ),
  );
});

/* -------------------------------------------------------------------------- */
/* 🧮 Admin: Loyalty overview                                                  */
/* -------------------------------------------------------------------------- */
export const getAdminLoyaltyOverview = asyncHandler(async (req, res) => {
  const [topUsers, totals, redemptionStats, recentRedemptions] =
    await Promise.all([
      User.find({ points: { $gt: 0 } })
        .sort({ points: -1 })
        .limit(5)
        .select("username email points"),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$points" },
            usersWithPoints: {
              $sum: { $cond: [{ $gt: ["$points", 0] }, 1, 0] },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRedeemed: { $sum: { $ifNull: ["$meta.redeemedPoints", 0] } },
            totalEarned: { $sum: { $ifNull: ["$meta.pointsEarned", 0] } },
          },
        },
      ]),
      Order.find({ "meta.redeemedPoints": { $gt: 0 } })
        .populate("user", "username email")
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("meta totalAmount updatedAt"),
    ]);

  const totalsEntry = totals?.[0] || {
    totalPoints: 0,
    usersWithPoints: 0,
  };
  const redemptionEntry = redemptionStats?.[0] || {
    totalRedeemed: 0,
    totalEarned: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totals: {
          totalPointsInWallets: totalsEntry.totalPoints || 0,
          usersWithPoints: totalsEntry.usersWithPoints || 0,
          totalPointsEarned: redemptionEntry.totalEarned || 0,
          totalPointsRedeemed: redemptionEntry.totalRedeemed || 0,
        },
        topUsers: topUsers.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          points: user.points || 0,
        })),
        recentRedemptions: recentRedemptions.map((order) => ({
          id: order._id,
          user: order.user
            ? {
                id: order.user._id,
                username: order.user.username,
                email: order.user.email,
              }
            : null,
          redeemedPoints: Number(order.meta?.redeemedPoints || 0),
          discountApplied: Number(order.meta?.discountApplied || 0),
          totalAmount: order.totalAmount,
          updatedAt: order.updatedAt,
        })),
      },
      "Admin loyalty overview fetched successfully",
    ),
  );
});

/* -------------------------------------------------------------------------- */
/* 🛠️ Admin: Adjust user points                                               */
/* -------------------------------------------------------------------------- */
export const adjustUserPoints = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const rawDelta = req.body.delta;
  const rawPoints = req.body.points;

  const delta = typeof rawDelta !== "undefined" ? Number(rawDelta) : undefined;
  const points = typeof rawPoints !== "undefined" ? Number(rawPoints) : undefined;

  if (
    (typeof delta === "undefined" || Number.isNaN(delta)) &&
    (typeof points === "undefined" || Number.isNaN(points))
  ) {
    throw new ApiError(
      400,
      "Provide either `delta` (number to add/subtract) or absolute `points` value",
    );
  }

  let user = null;
  if (identifier && mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier);
  }
  if (!user && identifier) {
    user = await User.findOne({ email: identifier.toLowerCase() });
  }
  if (!user && req.body.email) {
    user = await User.findOne({ email: req.body.email.toLowerCase() });
  }
  if (!user) throw new ApiError(404, "User not found");

  if (typeof points === "number" && !Number.isNaN(points)) {
    user.points = Math.max(0, points);
  } else if (typeof delta === "number" && !Number.isNaN(delta)) {
    user.points = Math.max(0, (user.points || 0) + delta);
  }

  await user.save();

  const loggedDelta =
    typeof delta === "number" && !Number.isNaN(delta) ? delta : null;

  await logAudit({
    user: req.user?._id,
    action: "loyalty_points_adjusted",
    resource: "user",
    resourceId: user._id,
    meta: { delta: loggedDelta, points: user.points },
    ip: req.ip,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { id: user._id, points: user.points }, "User points updated"));
});


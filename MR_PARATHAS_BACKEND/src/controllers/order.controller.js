import Order from "../models/order.model.js";
import { Menu } from "../models/menu.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import logger from "../utils/logger.js";
import { logAudit } from "../utils/audit.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/email.js";

const POINTS_PER_AMOUNT =
  Number(process.env.POINTS_PER_AMOUNT) || 1; // 1 point per ₹1 by default
const POINT_VALUE = Number(process.env.POINT_VALUE) || 1; // ₹1 discount per point

/* ---------------------------------------------------
   🧾 Place a New Order (Customer)
--------------------------------------------------- */
export const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const userId = req.user?._id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "items (array) are required");
  }

  const userDoc = await User.findById(userId).select("email username points");
  if (!userDoc) throw new ApiError(404, "User not found");

  const menuIds = [...new Set(items.map((it) => String(it.menuItem)))];
  const menuDocs = await Menu.find({ _id: { $in: menuIds } });
  const foundIds = new Set(menuDocs.map((m) => String(m._id)));
  const missing = menuIds.filter((id) => !foundIds.has(id));
  if (missing.length)
    throw new ApiError(404, `Menu item(s) not found: ${missing.join(", ")}`);

  const priceMap = {};
  const menuMap = new Map();
  for (const m of menuDocs) {
    priceMap[String(m._id)] = Number(m.price || 0);
    menuMap.set(String(m._id), m);
  }

  let totalAmount = 0;
  const lineItems = items.map((it) => {
    const qty = Number(it.quantity || 0);
    if (!Number.isInteger(qty) || qty < 1)
      throw new ApiError(400, `Invalid quantity for menuItem ${it.menuItem}`);
    const price = priceMap[String(it.menuItem)];
    if (typeof price === "undefined")
      throw new ApiError(400, `Menu item not found: ${it.menuItem}`);
    const subtotal = price * qty;
    totalAmount += subtotal;
    return {
      menuItem: it.menuItem,
      quantity: qty,
      name: menuMap.get(String(it.menuItem))?.name || "Menu item",
      price,
      subtotal,
    };
  });

  const orderItems = lineItems.map((item) => ({
    menuItem: item.menuItem,
    quantity: item.quantity,
  }));

  const pointsEarned = Math.max(0, Math.floor(totalAmount / POINTS_PER_AMOUNT));

  const newOrder = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount,
    orderStatus: "Pending",
    meta: { pointsEarned, pointsCredited: false },
  });
  await newOrder.populate("items.menuItem", "name price");

  const currentPoints = userDoc.points || 0;

  const listFormatter = (value) => `₹${Number(value).toFixed(0)}`;
  const itemsListText = lineItems
    .map(
      (item) =>
        `- ${item.quantity} × ${item.name} @ ${listFormatter(item.price)} = ${listFormatter(item.subtotal)}`,
    )
    .join("\n");
  const itemsListHtml = lineItems
    .map(
      (item) =>
        `<li>${item.quantity} × ${item.name} @ ${listFormatter(item.price)} = <strong>${listFormatter(item.subtotal)}</strong></li>`,
    )
    .join("");

  const subject = `Order Confirmation #${newOrder._id}`;
  const emailPayload = {
    subject,
    text: `Thank you for your order!\n\nItems:\n${itemsListText}\n\nTotal: ${listFormatter(
      totalAmount,
    )}\nPoints on completion: ${pointsEarned}\n\nWe will notify you when the status changes.`,
    html: `
      <h2>Order confirmed</h2>
      <p>Thanks for dining with us. Here are your order details:</p>
      <ul>${itemsListHtml}</ul>
      <p><strong>Total:</strong> ${listFormatter(totalAmount)}</p>
      <p><strong>Points after completion:</strong> ${pointsEarned}</p>
      <p>We will notify you once your order status changes.</p>
    `,
  };

  try {
    const customerEmail = userDoc.email || req.user?.email;
    if (customerEmail) {
      await sendEmail({ to: customerEmail, ...emailPayload });
    }
  } catch (err) {
    logger.error("Failed to send order confirmation email to customer:", err);
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New order placed #${newOrder._id}`,
        text: `Customer: ${userDoc.username || userDoc.email}\nTotal: ${listFormatter(totalAmount)}\nPoints awarded: ${pointsEarned}\n\nItems:\n${itemsListText}`,
        html: `
          <p><strong>Customer:</strong> ${userDoc.username || userDoc.email}</p>
          <p><strong>Total:</strong> ${listFormatter(totalAmount)}</p>
          <p><strong>Points awarded:</strong> ${pointsEarned}</p>
          <ul>${itemsListHtml}</ul>
        `,
      });
    }
  } catch (err) {
    logger.error("Failed to send order confirmation email to admin:", err);
  }

  await logAudit({
    user: userId,
    action: "order_created",
    resource: "order",
    resourceId: newOrder._id,
    meta: { totalAmount, pointsEarned },
    ip: req.ip,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { order: newOrder, loyalty: { pointsEarned, currentPoints } },
      "Order placed successfully",
    ),
  );
});

/* ---------------------------------------------------
   📦 Get All Orders (Admin only) - supports filters
   Query params: status, from (YYYY-MM-DD), to (YYYY-MM-DD), user
--------------------------------------------------- */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, from, to, user } = req.query;
  const filter = {};

  if (status) {
    const statuses = String(status).split(",").map((s) => s.trim());
    filter.orderStatus = { $in: statuses };
  }

  if (user) filter.user = user;

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const f = new Date(from);
      if (!isNaN(f)) filter.createdAt.$gte = f;
    }
    if (to) {
      const t = new Date(to);
      if (!isNaN(t)) {
        t.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = t;
      }
    }
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  const orders = await Order.find(filter)
    .populate("user", "username email")
    .populate("items.menuItem", "name price")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/* ---------------------------------------------------
   👤 Get Orders for Logged-in User (Customer)
--------------------------------------------------- */
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const orders = await Order.find({ user: userId })
    .populate("items.menuItem", "name price")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/* ---------------------------------------------------
   ❌ Cancel My Order (Customer)
--------------------------------------------------- */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate("user", "email username");
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user._id.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only cancel your own orders");

  await order.populate("items.menuItem", "name price");

  const userDoc = await User.findById(order.user._id).select(
    "email username points",
  );
  const pointsEarned = Number(order.meta?.pointsEarned || 0);
  const redeemedPoints = Number(order.meta?.redeemedPoints || 0);
  const pointsCredited = Boolean(order.meta?.pointsCredited);

  if (userDoc) {
    if (pointsCredited && pointsEarned > 0) {
      userDoc.points = Math.max(0, (userDoc.points || 0) - pointsEarned);
    }
    if (redeemedPoints > 0) {
      userDoc.points = (userDoc.points || 0) + redeemedPoints;
    }
    await userDoc.save();
  }

  order.orderStatus = "Cancelled";
  await order.save();

  const listFormatter = (value) => `₹${Number(value).toFixed(0)}`;
  const itemsListText = order.items
    .map(
      (item) =>
        `- ${item.quantity} × ${item.menuItem?.name || "Menu item"} @ ${listFormatter(item.menuItem?.price || 0)}`,
    )
    .join("\n");
  const itemsListHtml = order.items
    .map(
      (item) =>
        `<li>${item.quantity} × ${item.menuItem?.name || "Menu item"} @ ${listFormatter(item.menuItem?.price || 0)}</li>`,
    )
    .join("");

  try {
    const customerEmail = userDoc?.email || req.user?.email;
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Order Cancelled #${order._id}`,
        text: `Your order has been cancelled.\n\nItems:\n${itemsListText}\n\nAny redeemed points (${redeemedPoints}) were refunded to your balance.`,
        html: `
          <h3>Your order has been cancelled</h3>
          <ul>${itemsListHtml}</ul>
          <p><strong>Redeemed points refunded:</strong> ${redeemedPoints}</p>
          <p><strong>Points removed:</strong> ${pointsEarned}</p>
        `,
      });
    }
  } catch (err) {
    logger.error("Failed to send customer cancellation email:", err);
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Order cancelled #${order._id}`,
        text: `Customer: ${userDoc?.username || userDoc?.email}\nPoints removed: ${pointsEarned}\nRedeemed refunded: ${redeemedPoints}\n\nItems:\n${itemsListText}`,
        html: `
          <p><strong>Customer:</strong> ${userDoc?.username || userDoc?.email}</p>
          <p><strong>Points removed:</strong> ${pointsEarned}</p>
          <p><strong>Redeemed refunded:</strong> ${redeemedPoints}</p>
          <ul>${itemsListHtml}</ul>
        `,
      });
    }
  } catch (err) {
    logger.error("Failed to send admin cancellation email:", err);
  }

  await logAudit({
    user: req.user?._id,
    action: "order_cancelled",
    resource: "order",
    resourceId: order._id,
    meta: { pointsRemoved: pointsEarned, redeemedRefunded: redeemedPoints },
    ip: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { order, loyalty: { currentPoints: userDoc?.points || req.user?.points || 0 } },
      "Order cancelled successfully",
    ),
  );
});

/* ---------------------------------------------------
   🔍 Get Single Order by ID (Admin or Customer)
--------------------------------------------------- */
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate("user", "username email")
    .populate("items.menuItem", "name price");

  if (!order) throw new ApiError(404, "Order not found");

  if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  return res.status(200).json({
    success: true,
    data: order,
  });
});

/* ---------------------------------------------------
   🚚 Update Order Status (Admin)
--------------------------------------------------- */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!orderStatus) throw new ApiError(400, "orderStatus is required");

  const allowed = ["Pending", "Preparing", "Delivered", "Cancelled"];
  if (!allowed.includes(orderStatus)) throw new ApiError(400, "Invalid orderStatus");

  const order = await Order.findById(id).populate("user", "email username");
  if (!order) throw new ApiError(404, "Order not found");

  const shouldCreditPoints =
    orderStatus === "Delivered" &&
    !order.meta?.pointsCredited &&
    Number(order.meta?.pointsEarned || 0) > 0;

  order.orderStatus = orderStatus;

  if (shouldCreditPoints) {
    try {
      const userDoc = await User.findById(order.user._id);
      if (userDoc) {
        userDoc.points = (userDoc.points || 0) + Number(order.meta.pointsEarned);
        await userDoc.save();
        order.meta = Object.assign({}, order.meta || {}, {
          pointsCredited: true,
          pointsCreditedAt: new Date(),
        });
      }
    } catch (err) {
      logger.error("Failed to credit loyalty points on delivery:", err);
    }
  }

  await order.save();

  await logAudit({
    user: req.user?._id,
    action: "order_status_updated",
    resource: "order",
    resourceId: order._id,
    meta: { status: orderStatus },
    ip: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});

/* ---------------------------------------------------
   ❌ Delete Order (Admin)
--------------------------------------------------- */
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedOrder = await Order.findByIdAndDelete(id);
  if (!deletedOrder) throw new ApiError(404, "Order not found");

  await logAudit({
    user: req.user?._id,
    action: "order_deleted",
    resource: "order",
    resourceId: deletedOrder._id,
    meta: {},
    ip: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

/* ---------------------------------------------------
   🎟️ Redeem Points (Customer)
   - apply points as discount to order
--------------------------------------------------- */
export const redeemPoints = asyncHandler(async (req, res) => {
  const { id } = req.params; // order id
  const requestedPoints = Number(
    req.body.points ?? req.body.pointsToRedeem ?? 0,
  );
  const userId = req.user?._id;

  if (!Number.isInteger(requestedPoints) || requestedPoints <= 0)
    throw new ApiError(400, "points must be a positive integer");

  const order = await Order.findById(id).populate("user", "email username");
  if (!order) throw new ApiError(404, "Order not found");
  if (order.user._id.toString() !== userId.toString())
    throw new ApiError(403, "Not authorized to redeem points on this order");
  if (order.orderStatus === "Cancelled")
    throw new ApiError(400, "Cannot redeem points on a cancelled order");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if ((user.points || 0) < requestedPoints)
    throw new ApiError(400, "Insufficient points");

  const alreadyRedeemed = Number(order.meta?.redeemedPoints || 0);
  if (alreadyRedeemed > 0)
    throw new ApiError(400, "Points already redeemed for this order");

  const discount = requestedPoints * POINT_VALUE;
  const newTotal = Math.max(0, order.totalAmount - discount);

  order.totalAmount = newTotal;
  order.meta = Object.assign({}, order.meta || {}, {
    redeemedPoints: requestedPoints,
    discountApplied: discount,
  });
  await order.save();

  user.points = (user.points || 0) - requestedPoints;
  await user.save();

  await logAudit({
    user: userId,
    action: "redeem_points",
    resource: "order",
    resourceId: order._id,
    meta: { pointsRedeemed: requestedPoints, discount },
    ip: req.ip,
  });

  await order.populate("items.menuItem", "name price");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        order,
        loyalty: { currentPoints: user.points, redeemedPoints: requestedPoints },
      },
      "Points redeemed and applied to order",
    ),
  );
});

import { Table } from "../models/table.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendEmail } from "../utils/email.js";
import { logAudit } from "../utils/audit.js";

/* ---------------------------------------------------
   📋 Get All Available Tables
   Query: bookingDate (ISO string) - filters tables available at that time
--------------------------------------------------- */
export const getAvailableTables = asyncHandler(async (req, res) => {
  const { bookingDate } = req.query;
  
  // Get all tables that are marked as available
  let tables = await Table.find({ isAvailable: true }).sort({ tableNumber: 1 });
  
  // If bookingDate is provided, filter out tables that are already booked
  if (bookingDate) {
    const requestedTime = new Date(bookingDate);
    if (isNaN(requestedTime.getTime())) {
      throw new ApiError(400, "Invalid bookingDate format");
    }
    
    // Calculate time window: 1 hour before and 1 hour after requested time
    const oneHourBefore = new Date(requestedTime.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(requestedTime.getTime() + 60 * 60 * 1000);
    
    // Find all confirmed bookings in this time window
    const conflictingBookings = await Booking.find({
      bookingStatus: "Confirmed",
      bookingDate: {
        $gte: oneHourBefore,
        $lte: oneHourAfter,
      },
    }).select("table");
    
    // Get array of table IDs that are already booked
    const bookedTableIds = conflictingBookings.map((b) => b.table.toString());
    
    // Filter out booked tables
    tables = tables.filter((table) => !bookedTableIds.includes(table._id.toString()));
  }
  
  // Limit to 6 tables
  tables = tables.slice(0, 6);
  
  return res.status(200).json(new ApiResponse(200, tables, "Available tables fetched"));
});

/* ---------------------------------------------------
   📋 Get All Tables (Admin)
--------------------------------------------------- */
export const getAllTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ tableNumber: 1 });
  return res.status(200).json(new ApiResponse(200, tables, "All tables fetched"));
});

/* ---------------------------------------------------
   ➕ Create Table (Admin)
   Body: { tableNumber: 5, capacity: 4 }
--------------------------------------------------- */
export const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity } = req.body;
  if (!tableNumber || !capacity) throw new ApiError(400, "tableNumber and capacity required");

  const existing = await Table.findOne({ tableNumber });
  if (existing) throw new ApiError(409, "Table already exists");

  const table = await Table.create({ tableNumber, capacity, isAvailable: true });

  await logAudit({
    user: req.user?._id,
    action: "table_created",
    resource: "table",
    resourceId: table._id,
    meta: { tableNumber, capacity },
    ip: req.ip,
  });

  return res.status(201).json(new ApiResponse(201, table, "Table created"));
});

/* ---------------------------------------------------
   ✏️ Update Table (Admin)
   Body: { capacity: 6, isAvailable: false }
--------------------------------------------------- */
export const updateTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { capacity, isAvailable } = req.body;

  const table = await Table.findByIdAndUpdate(id, { capacity, isAvailable }, { new: true });
  if (!table) throw new ApiError(404, "Table not found");

  await logAudit({
    user: req.user?._id,
    action: "table_updated",
    resource: "table",
    resourceId: table._id,
    meta: { capacity, isAvailable },
    ip: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, table, "Table updated"));
});

/* ---------------------------------------------------
   ❌ Delete Table (Admin)
--------------------------------------------------- */
export const deleteTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const table = await Table.findByIdAndDelete(id);
  if (!table) throw new ApiError(404, "Table not found");

  await logAudit({
    user: req.user?._id,
    action: "table_deleted",
    resource: "table",
    resourceId: table._id,
    meta: { tableNumber: table.tableNumber },
    ip: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Table deleted"));
});

/* ---------------------------------------------------
   🎫 Book a Table (Customer)
   Body: { tableId, bookingDate: "2025-11-20T19:00:00Z", numberOfGuests: 4, specialRequests: "..." }
--------------------------------------------------- */
export const bookTable = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { tableId, bookingDate, numberOfGuests, specialRequests } = req.body;

  if (!tableId || !bookingDate || !numberOfGuests) {
    throw new ApiError(400, "tableId, bookingDate, numberOfGuests required");
  }

  // validate table exists and is available
  const table = await Table.findById(tableId);
  if (!table) throw new ApiError(404, "Table not found");
  if (!table.isAvailable) throw new ApiError(400, "Table is not available");

  // validate guest count
  const guests = Number(numberOfGuests);
  if (!Number.isInteger(guests) || guests < 1) throw new ApiError(400, "numberOfGuests must be >= 1");
  if (guests > table.capacity) throw new ApiError(400, `Table capacity is ${table.capacity}, but ${guests} guests requested`);

  // check for conflicts (same table, overlapping time within 1 hour window)
  const bookingTime = new Date(bookingDate);
  const oneHourBefore = new Date(bookingTime.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(bookingTime.getTime() + 60 * 60 * 1000);
  
  // Check if table is booked within 1 hour before or after the requested time
  const conflict = await Booking.findOne({
    table: tableId,
    bookingStatus: "Confirmed",
    bookingDate: {
      $gte: oneHourBefore,
      $lte: oneHourAfter,
    },
  });
  if (conflict) {
    throw new ApiError(400, "Table already booked for this time slot (within 1 hour window)");
  }

  // create booking
  const booking = await Booking.create({
    user: userId,
    table: tableId,
    bookingDate: bookingTime,
    numberOfGuests: guests,
    specialRequests: specialRequests || "",
    confirmationEmail: req.user.email,
  });

  // send confirmation email
  try {
    const customerEmail = req.user?.email;
    const tableNum = table.tableNumber;
    const bookingDateStr = bookingTime.toLocaleString();
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Table Booking Confirmation - Table #${tableNum}`,
        text: `Your table booking is confirmed.\n\nDetails:\nTable: #${tableNum}\nDate/Time: ${bookingDateStr}\nGuests: ${guests}\nSpecial Requests: ${specialRequests || "None"}\n\nBooking ID: ${booking._id}`,
        html: `
          <h2>Table Booking Confirmed ✓</h2>
          <p><strong>Table:</strong> #${tableNum}</p>
          <p><strong>Date & Time:</strong> ${bookingDateStr}</p>
          <p><strong>Number of Guests:</strong> ${guests}</p>
          <p><strong>Special Requests:</strong> ${specialRequests || "None"}</p>
          <p><strong>Booking ID:</strong> ${booking._id}</p>
          <p>Thank you for booking with us!</p>
        `,
      });
    }
  } catch (err) {
    console.error("Failed to send booking confirmation email:", err);
  }

  // notify admin
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Table Booking - Table #${table.tableNumber}`,
        text: `New booking received.\n\nTable: #${table.tableNumber}\nGuest: ${req.user?.username}\nDate/Time: ${bookingTime.toLocaleString()}\nGuests: ${numberOfGuests}`,
        html: `
          <p><strong>New Table Booking</strong></p>
          <p><strong>Table:</strong> #${table.tableNumber}</p>
          <p><strong>Guest Name:</strong> ${req.user?.username}</p>
          <p><strong>Date & Time:</strong> ${bookingTime.toLocaleString()}</p>
          <p><strong>Number of Guests:</strong> ${numberOfGuests}</p>
        `,
      });
    }
  } catch (err) {
    console.error("Failed to send admin notification:", err);
  }

  await logAudit({
    user: userId,
    action: "table_booked",
    resource: "booking",
    resourceId: booking._id,
    meta: { tableId, numberOfGuests, bookingDate },
    ip: req.ip,
  });

  await booking.populate("table", "tableNumber capacity");

  return res.status(201).json(new ApiResponse(201, booking, "Table booked successfully, confirmation email sent"));
});

/* ---------------------------------------------------
   📅 Get User's Bookings (Customer)
--------------------------------------------------- */
export const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const bookings = await Booking.find({ user: userId })
    .populate("table", "tableNumber capacity")
    .sort({ bookingDate: -1 });

  return res.status(200).json(new ApiResponse(200, bookings, "User bookings fetched"));
});

/* ---------------------------------------------------
   📅 Get All Bookings (Admin)
   Query: status, from, to
--------------------------------------------------- */
export const getAllBookings = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};

  if (status) filter.bookingStatus = status;
  if (from || to) {
    filter.bookingDate = {};
    if (from) {
      const f = new Date(from);
      if (!isNaN(f)) filter.bookingDate.$gte = f;
    }
    if (to) {
      const t = new Date(to);
      if (!isNaN(t)) {
        t.setHours(23, 59, 59, 999);
        filter.bookingDate.$lte = t;
      }
    }
  }

  const bookings = await Booking.find(filter)
    .populate("user", "username email")
    .populate("table", "tableNumber capacity")
    .sort({ bookingDate: -1 });

  return res.status(200).json(new ApiResponse(200, bookings, "All bookings fetched"));
});

/* ---------------------------------------------------
   ❌ Cancel Booking (Customer or Admin)
--------------------------------------------------- */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate("user", "email username").populate("table", "tableNumber");

  if (!booking) throw new ApiError(404, "Booking not found");

  // verify ownership or admin
  if (req.user.role !== "admin" && booking.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to cancel this booking");
  }

  booking.bookingStatus = "Cancelled";
  await booking.save();

  // notify customer
  try {
    const customerEmail = booking.user?.email;
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Booking Cancellation - Table #${booking.table.tableNumber}`,
        text: `Your table booking has been cancelled.\n\nBooking ID: ${booking._id}`,
        html: `<p>Your table booking for <strong>Table #${booking.table.tableNumber}</strong> has been cancelled.</p>`,
      });
    }
  } catch (err) {
    console.error("Failed to send cancellation email:", err);
  }

  await logAudit({
    user: req.user?._id,
    action: "booking_cancelled",
    resource: "booking",
    resourceId: booking._id,
    meta: { tableNumber: booking.table.tableNumber },
    ip: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, booking, "Booking cancelled successfully"));
});

/* ---------------------------------------------------
   🔍 Get Single Booking (Customer or Admin)
--------------------------------------------------- */
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id)
    .populate("user", "username email")
    .populate("table", "tableNumber capacity");

  if (!booking) throw new ApiError(404, "Booking not found");

  if (req.user.role !== "admin" && booking.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to view this booking");
  }

  return res.status(200).json(new ApiResponse(200, booking, "Booking fetched"));
});

/* ---------------------------------------------------
   ✏️ Update Booking Operational Status (Admin only)
   Body: { operationalStatus: "not reached yet" | "having food" | "done" }
--------------------------------------------------- */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { operationalStatus } = req.body;

  if (!operationalStatus || !["not reached yet", "having food", "done"].includes(operationalStatus)) {
    throw new ApiError(400, "operationalStatus must be one of: 'not reached yet', 'having food', 'done'");
  }

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  booking.operationalStatus = operationalStatus;
  await booking.save();

  await logAudit({
    user: req.user?._id,
    action: "booking_status_updated",
    resource: "booking",
    resourceId: booking._id,
    meta: { operationalStatus },
    ip: req.ip,
  });

  await booking.populate("user", "username email");
  await booking.populate("table", "tableNumber capacity");

  return res.status(200).json(new ApiResponse(200, booking, "Booking status updated successfully"));
});
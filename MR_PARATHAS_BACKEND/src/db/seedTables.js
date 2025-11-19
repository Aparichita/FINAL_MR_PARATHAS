import mongoose from "mongoose";
import dotenv from "dotenv";
import { Table } from "../models/table.model.js";

dotenv.config();

const seedTables = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "MR_PARATHAS",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Remove all existing tables
    await Table.deleteMany({});
    console.log("🧹 Cleared all tables");

    // Create 3 tables with capacity 4 and 3 tables with capacity 6
    const tablesToCreate = [
      { tableNumber: 1, capacity: 4, isAvailable: true },
      { tableNumber: 2, capacity: 4, isAvailable: true },
      { tableNumber: 3, capacity: 4, isAvailable: true },
      { tableNumber: 4, capacity: 6, isAvailable: true },
      { tableNumber: 5, capacity: 6, isAvailable: true },
      { tableNumber: 6, capacity: 6, isAvailable: true },
    ];

    await Table.insertMany(tablesToCreate);
    console.log("✅ Seeded 6 tables successfully:");
    tablesToCreate.forEach(t => console.log(`Table ${t.tableNumber} - Capacity: ${t.capacity}`));
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tables:", error.message);
    process.exit(1);
  }
};

seedTables();

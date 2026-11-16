import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDb from "../src/db/db.js";
import userModel from "../src/models/user.model.js";

dotenv.config();

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (
    !ADMIN_NAME?.trim() ||
    !ADMIN_EMAIL?.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL.trim()) ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 8
  ) {
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (at least 8 characters) before seeding."
    );
  }

  await connectDb();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await userModel.findOne({ email }).select("role");
  if (existing) {
    throw new Error(
      existing.role === "admin"
        ? "An admin account already exists for this email."
        : "This email belongs to a non-admin account."
    );
  }

  await userModel.create({
    name: ADMIN_NAME.trim(),
    email,
    username: email,
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: "admin",
  });
  console.log(`Admin account created for ${email}.`);
}

seedAdmin()
  .catch((error) => {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

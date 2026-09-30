import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

const BCRYPT_ROUNDS = 12;

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required.");
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  return { email, password };
}

async function seedAdmin() {
  const { email, password } = getAdminCredentials();
  await connectDB();

  if (await User.exists({ email })) {
    console.log("Admin user already exists; no changes made.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await User.create({
      name: "Administrator",
      email,
      passwordHash,
      role: "admin",
    });
    console.log("Admin user created successfully.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      console.log("Admin user already exists; no changes made.");
      return;
    }
    throw error;
  }
}

seedAdmin()
  .catch(() => {
    console.error("Unable to seed the admin user. Check the required environment variables and database connection.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

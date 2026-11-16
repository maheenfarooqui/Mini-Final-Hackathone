import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.JWTSECRECT_KEY;
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    specialization: user.specialization,
    experience: user.experience,
    isActive: user.isActive,
  };
}

function createToken(user) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return jwt.sign({ id: user._id.toString() }, secret, { expiresIn: "7d" });
}

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, a valid email, and a password of at least 8 characters are required.",
      });
    }
    if (!getJwtSecret()) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({ success: false, message: "Authentication is not configured." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await userModel.exists({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      username: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "patient",
    });
    const token = createToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Patient account created successfully.",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Unable to register account." });
  }
}

export async function loginUser(req, res) {
  try {
    const identifier = req.body.email || req.body.username;
    const { password } = req.body;
    if (typeof identifier !== "string" || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await userModel
      .findOne({ email: identifier.trim().toLowerCase() })
      .select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "This account has been deactivated." });
    }

    const token = createToken(user);
    setAuthCookie(res, token);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Unable to log in." });
  }
}

export function logoutUser(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully." });
}

export async function currentUser(req, res) {
  try {
    const user = await userModel.findById(req.user.id).select("-password -username");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Current user lookup error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch current user." });
  }
}

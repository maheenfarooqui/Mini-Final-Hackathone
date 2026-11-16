import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import userModel from "../models/user.model.js";

dotenv.config();

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.JWTSECRECT_KEY;
}

export async function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const token = bearerToken || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error("JWT_SECRET is not configured.");
    return res.status(500).json({ success: false, message: "Authentication is not configured." });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const user = await userModel.findById(decoded.id).select("name email role isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account is unavailable." });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({ success: false, message: "Unable to authenticate request." });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }
    return next();
  };
}

export const adminOnly = allowRoles("admin");

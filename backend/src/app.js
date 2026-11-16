import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import connectDb from "./db/db.js";
import authRoute from "./routes/auth.route.js";
import doctorRoute from "./routes/doctor.route.js";
import appointmentRoute from "./routes/appointment.route.js";
import adminRoute from "./routes/admin.route.js";

const app = express();

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "https://al-nahal.vercel.app",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDb();
    }
    return next();
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

app.use("/api/auth", authRoute);
app.use("/api/doctors", doctorRoute);
app.use("/api/appointments", appointmentRoute);
app.use("/api/admin", adminRoute);

app.use((req, res) => {
  return res.status(404).json({ success: false, message: "API endpoint not found." });
});

export default app;

import express from "express";
import {
  createDoctor,
  deleteUser,
  getAllAppointments,
  getStats,
  getUsers,
  setUserStatus,
} from "../controllers/admin.controller.js";
import { adminOnly, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken, adminOnly);
router.get("/users", getUsers);
router.post("/doctors", createDoctor);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/status", setUserStatus);
router.get("/appointments", getAllAppointments);
router.get("/stats", getStats);

export default router;

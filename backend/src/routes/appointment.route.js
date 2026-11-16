import express from "express";
import {
  cancelAppointment,
  createAppointment,
  getDoctorAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import { allowRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, allowRoles("patient"), createAppointment);
router.get("/my", verifyToken, allowRoles("patient"), getMyAppointments);
router.get("/doctor", verifyToken, allowRoles("doctor"), getDoctorAppointments);
router.patch("/:id/status", verifyToken, allowRoles("doctor"), updateAppointmentStatus);
router.patch("/:id/cancel", verifyToken, allowRoles("patient"), cancelAppointment);

export default router;

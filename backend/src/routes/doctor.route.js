import express from "express";
import { getDoctor, listDoctors } from "../controllers/doctor.controller.js";
import { allowRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken, allowRoles("admin", "doctor", "patient"));
router.get("/", listDoctors);
router.get("/:id", getDoctor);

export default router;

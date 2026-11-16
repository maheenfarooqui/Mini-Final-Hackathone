import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", verifyToken, currentUser);

export default router;

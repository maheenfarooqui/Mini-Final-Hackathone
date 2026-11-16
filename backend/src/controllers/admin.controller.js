import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/user.model.js";
import appointmentModel from "../models/appointment.model.js";

export async function getUsers(req, res) {
  try {
    const filter = {};
    if (["admin", "doctor", "patient"].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    const users = await userModel
      .find(filter)
      .select("-password -username")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Admin user list error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch users." });
  }
}

export async function createDoctor(req, res) {
  try {
    const { name, email, password, specialization, experience } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof specialization !== "string" ||
      !specialization.trim() ||
      experience === undefined ||
      !Number.isFinite(Number(experience)) ||
      Number(experience) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email, password (at least 8 characters), specialization, and non-negative experience are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await userModel.exists({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    const doctor = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      username: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "doctor",
      specialization: specialization.trim(),
      experience: Number(experience),
    });
    return res.status(201).json({
      success: true,
      message: "Doctor account created.",
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        specialization: doctor.specialization,
        experience: doctor.experience,
        isActive: doctor.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    console.error("Doctor creation error:", error);
    return res.status(500).json({ success: false, message: "Unable to create doctor account." });
  }
}

export async function deleteUser(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    const user = await userModel.findById(req.params.id).select("role");
    if (!user || !["doctor", "patient"].includes(user.role)) {
      return res.status(404).json({ success: false, message: "Doctor or patient not found." });
    }
    await appointmentModel.deleteMany({
      $or: [{ doctor: user._id }, { patient: user._id }],
    });
    await userModel.deleteOne({ _id: user._id });
    return res.status(200).json({ success: true, message: "User and related appointments deleted." });
  } catch (error) {
    console.error("User deletion error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete user." });
  }
}

export async function setUserStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean." });
    }
    const user = await userModel.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ["doctor", "patient"] } },
      { $set: { isActive: req.body.isActive } },
      { new: true, runValidators: true }
    ).select("-password -username");
    if (!user) {
      return res.status(404).json({ success: false, message: "Doctor or patient not found." });
    }
    return res.status(200).json({ success: true, message: "User status updated.", user });
  } catch (error) {
    console.error("User activation update error:", error);
    return res.status(500).json({ success: false, message: "Unable to update user status." });
  }
}

export async function getAllAppointments(req, res) {
  try {
    const appointments = await appointmentModel
      .find()
      .populate("patient", "name email")
      .populate("doctor", "name email specialization")
      .sort({ appointmentDate: -1, appointmentTime: 1 });
    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error("Admin appointment list error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch appointments." });
  }
}

export async function getStats(req, res) {
  try {
    const [patients, doctors, appointments] = await Promise.all([
      userModel.countDocuments({ role: "patient" }),
      userModel.countDocuments({ role: "doctor" }),
      appointmentModel.countDocuments(),
    ]);
    return res.status(200).json({
      success: true,
      stats: { patients, doctors, appointments },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch clinic statistics." });
  }
}

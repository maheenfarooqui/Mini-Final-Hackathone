import mongoose from "mongoose";
import userModel from "../models/user.model.js";

export async function listDoctors(req, res) {
  try {
    const filter = { role: "doctor", isActive: true };
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const specialization =
      typeof req.query.specialization === "string"
        ? req.query.specialization.trim()
        : "";

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { specialization: { $regex: escaped, $options: "i" } },
      ];
    }
    if (specialization) {
      filter.specialization = { $regex: specialization.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    const doctors = await userModel
      .find(filter)
      .select("name specialization experience")
      .sort({ name: 1 });
    return res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error("Doctor list error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch doctors." });
  }
}

export async function getDoctor(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID." });
    }

    const doctor = await userModel
      .findOne({ _id: req.params.id, role: "doctor", isActive: true })
      .select("name specialization experience");
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    console.error("Doctor lookup error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch doctor." });
  }
}

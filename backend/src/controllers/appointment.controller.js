import mongoose from "mongoose";
import appointmentModel from "../models/appointment.model.js";
import userModel from "../models/user.model.js";

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export async function createAppointment(req, res) {
  try {
    const { doctor: doctorId, appointmentDate, appointmentTime, reason } = req.body;
    const date = validDate(appointmentDate);

    if (
      !mongoose.isValidObjectId(doctorId) ||
      !date ||
      typeof appointmentTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime) ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid doctor, date, time (HH:mm), and reason are required.",
      });
    }

    const doctor = await userModel.findOne({
      _id: doctorId,
      role: "doctor",
      isActive: true,
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Active doctor not found." });
    }

    const appointment = await appointmentModel.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate: date,
      appointmentTime,
      reason: reason.trim(),
    });
    await appointment.populate("doctor", "name specialization experience");

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This doctor already has an appointment at that date and time.",
      });
    }
    console.error("Appointment booking error:", error);
    return res.status(500).json({ success: false, message: "Unable to book appointment." });
  }
}

export async function getMyAppointments(req, res) {
  try {
    const appointments = await appointmentModel
      .find({ patient: req.user.id })
      .populate("doctor", "name specialization experience")
      .sort({ appointmentDate: -1, appointmentTime: 1 });
    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error("Patient appointments error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch appointments." });
  }
}

export async function getDoctorAppointments(req, res) {
  try {
    const appointments = await appointmentModel
      .find({ doctor: req.user.id })
      .populate("patient", "name email")
      .sort({ appointmentDate: 1, appointmentTime: 1 });
    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error("Doctor appointments error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch appointment requests." });
  }
}

export async function updateAppointmentStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid appointment ID." });
    }
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected." });
    }

    const appointment = await appointmentModel.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id, status: "pending" },
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate("patient", "name email")
      .populate("doctor", "name specialization");
    if (!appointment) {
      const exists = await appointmentModel.exists({ _id: req.params.id });
      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "This appointment is not assigned to you or is no longer pending."
          : "Appointment not found.",
      });
    }
    return res.status(200).json({ success: true, message: "Appointment status updated.", appointment });
  } catch (error) {
    console.error("Appointment status update error:", error);
    return res.status(500).json({ success: false, message: "Unable to update appointment status." });
  }
}

export async function cancelAppointment(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid appointment ID." });
    }
    const appointment = await appointmentModel.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id, status: "pending" },
      { $set: { status: "cancelled" } },
      { new: true, runValidators: true }
    );
    if (!appointment) {
      const existing = await appointmentModel.findById(req.params.id).select("patient status");
      if (!existing) {
        return res.status(404).json({ success: false, message: "Appointment not found." });
      }
      if (existing.patient.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "You can only cancel your own appointments." });
      }
      return res.status(400).json({ success: false, message: "Only pending appointments can be cancelled." });
    }
    return res.status(200).json({ success: true, message: "Appointment cancelled.", appointment });
  } catch (error) {
    console.error("Appointment cancellation error:", error);
    return res.status(500).json({ success: false, message: "Unable to cancel appointment." });
  }
}

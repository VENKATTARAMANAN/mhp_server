import express from "express";
import { isAuthenticated } from "../Authentication/Auth.js";
import { Doctor } from "../Models/DoctorModel.js";
import { Appointment } from "../Models/appointmentModel.js";
import { User } from "../Models/User.js";

const router = express.Router();

router.post(
  "/get-doctor-info-by-user-id",
  isAuthenticated,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      res.status(200).json({
        success: true,
        message: "Doctor info fetched successfully",
        data: doctor,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Error getting doctor info", success: false, error });
    }
  }
);

router.post("/get-doctor-info-by-id", isAuthenticated, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.body.doctorId });
    res.status(200).json({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting doctor info", success: false, error });
  }
});

router.post("/update-doctor-profile", isAuthenticated, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting doctor info", success: false, error });
  }
});

router.get(
  "/get-appointments-by-doctor-id",
  isAuthenticated,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      const appointment = await Appointment.find({ doctorId: doctor._id });
      res.status(200).json({
        message: "Appointments fetched successfully",
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error fetching appointments",
        success: false,
        error,
      });
    }
  }
);

router.post("/change-appointment-status", isAuthenticated, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status,
    });

    const user = await User.findOne({ _id: appointment.userId });
    const unseenNotification = user.unseenNotification;
    unseenNotification.push({
      type: "appointment-status-changed",
      message: `Your appointment status has been ${status}`,
      onClickPath: "/appointment",
    });

    await user.save();

    res.status(200).json({
      message: "Appointment status updated successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error changing appointment status",
      success: false,
      error,
    });
  }
});

export const doctorRouter = router;

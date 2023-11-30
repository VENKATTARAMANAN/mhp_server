import express from "express";
import { isAuthenticated } from "../Authentication/Auth.js";
import { User } from "../Models/User.js";
import { Doctor } from "../Models/DoctorModel.js";

const router = express.Router();

router.get("/get-all-doctors", isAuthenticated, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    res.status(200).json({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.get("/get-all-users", isAuthenticated, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.post(
  "/change-doctor-account-status",
  isAuthenticated,
  async (req, res) => {
    try {
      const { doctorId, status } = req.body;
      const doctor = await Doctor.findByIdAndUpdate(doctorId, {
        status,
      });

      const user = await User.findOne({ _id: doctor.userId });
      const unseenNotification = user.unseenNotification;
      unseenNotification.push({
        type: "new-doctor-request-changed",
        message: `Your doctor account has been ${status}`,
        onClickPath: "/notification",
      });
      user.isDoctor = status === "approved" ? true : false;
      await user.save();

      res.status(200).json({
        message: "Doctor status updated successfully",
        success: true,
        data: doctor,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  }
);

export const adminRouter = router;

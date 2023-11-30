import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../Authentication/Auth.js";
import { User } from "../Models/User.js";
import { Doctor } from "../Models/DoctorModel.js";
import { Appointment } from "../Models/appointmentModel.js";
import moment from "moment";

dotenv.config();
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    //  Find user is already registered
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).json({ message: "Email already exits" });

    // Generate HasedPassword
    const salt = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(req.body.password, salt);

    // New password Updation
    user = await new User({
      name: req.body.name,
      email: req.body.email,
      password: hasedPassword,
    }).save();
    // Generate Token

    res.status(201).json({ message: "Successfully Signed Up" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Local server Error", error: error });
  }
});

/**  LogIn  */
router.post("/login", async (req, res) => {
  try {
    // Finding Existing User
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    // PAssword Validate
    const validatePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validatePassword) {
      return res.status(400).json({ message: "Invalid Creadentials" });
    } else {
      // Generating Token
      const token = jwt.sign({ id: user._id }, process.env.SECKRET_KEY, {
        expiresIn: "1d",
      });
      res.status(200).json({ message: "Logged in Successfully", token: token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error: error });
  }
});

router.post("/get-user-info-by-id", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(401)
        .json({ message: "User Does Not Exits", sucecss: false });
    } else {
      res.status(200).json({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error: error });
  }
});

/* Apply Doctor */
router.post("/apply-doctor-account", isAuthenticated, async (req, res) => {
  try {
    //
    const newdoctor = new Doctor({ ...req.body, status: "pending" });
    await newdoctor.save();
    // console.log("What New: ", newdoctor);
    //
    const adminUser = await User.findOne({ isAdmin: true });
    //
    if (adminUser) {
      const unseenNotification = adminUser.unseenNotification;
      unseenNotification.push({
        type: "New Doctor request",
        message: `${newdoctor.firstName} ${newdoctor.lastName} has applied for a Doctor accont`,
        data: {
          doctorId: newdoctor._id,
          name: newdoctor.firstName + " " + newdoctor.lastName,
        },
        onClickPath: "/admin/doctorslist",
      });
      //
      await User.findByIdAndUpdate(adminUser._id, { unseenNotification });
      res.status(200).json({
        success: true,
        message: "Doctor account applied successfully",
        Newdoctor: newdoctor,
      });
    } else {
      res.status(401).json({
        message: "Doctor account not applied successfully",
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error, success: false });
  }
});

// Marking All notification
router.post(
  "/mark-all-notification-as-seen",
  isAuthenticated,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotification = user.unseenNotification;
      const seenNotification = user.seenNotification;
      seenNotification.push(...unseenNotification);
      user.unseenNotification = [];
      user.seenNotification = seenNotification;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).json({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
        success: false,
      });
    }
  }
);

// Delete Notification
router.post("/delete-all-notification", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotification = [];
    user.unseenNotification = [];
    const updateUser = await user.save();
    updateUser.password = undefined;
    res.status(200).json({
      success: true,
      message: "All notification Deleted successfully",
      data: updateUser,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error, success: false });
  }
});

/* Get All Approved Doctors List  */
router.get("/get-all-approved-doctors", isAuthenticated, async (req, res) => {
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

/* Checking Availability to Book Appointment */
router.post("/check-booking-avilability", isAuthenticated, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();

    const doctorId = req.body.doctorId;
    const appointments = await Appointment.find({
      doctorId,
      date,
    });
    if (appointments.length > 0) {
      return res.status(200).json({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).json({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

/* Booking Appointment */
router.post("/book-appointment", isAuthenticated, async (req, res) => {
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    //pushing notification to doctor based on his userid
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    user.unseenNotification.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.name}`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).json({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error in booking appointment",
      success: false,
      error,
    });
  }
});

router.get(
  "/get-appointments-by-user-id",
  isAuthenticated,
  async (req, res) => {
    try {
      const appointments = await Appointment.find({ userId: req.body.userId });
      res.status(200).send({
        message: "Appointments fetched successfully",
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error fetching appointments",
        success: false,
        error,
      });
    }
  }
);
/* Once Verified Generate OTP */
// router.post("/otp-generating", async (req, res) => {
//   //  Finding User
//   let user = await User.findOne({ email: req.body.email });
//   // console.log(user);
//   if (!user) {
//     return res.status(404).json({ message: "User not Found" });
//   }
//   // Otp Generating
//   const OTP = Math.random().toString(36).slice(-8);
//   console.log(OTP);
//   // Genarating Token
//   const token = generateToken(user);
//   // New Otp Update
//   const otpUpdate = await new Otp({
//     email: req.body.email,
//     OTP: OTP,
//     token: token,
//   }).save();
//   // Mailing Otp
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.USER, // dotenv
//       pass: process.env.pass_KEY,
//     },
//   });
//   //  Mailing Details
//   const message = {
//     from: "panneerdeveloper77@gmail.com",
//     to: user.email,
//     subject: "Password reset request",
//     text: `You are requested to rest your password. \n\n Your reset password OTP - ${OTP}`,
//   };
//   // Mail Status
//   transporter.sendMail(message, (err, info) => {
//     if (err) {
//       res.status(404).json({ message: "Something went wrong", error: err });
//     }

//     res
//       .status(200)
//       .json({ token: token, data: "Password Email sent" + info.response });
//   });
// });

// Otp Verification
// router.post("/otp-verify", async (req, res) => {
//   // Checking USer via OTP
//   let user = await Otp.findOne({ OTP: req.body.OTP });
//   // Checking USer
//   if (!user) {
//     return res.status(404).json({ message: "Invalid OTP or Token" });
//   }
//   // Comparing OTP (sended via mail vs Entered )
//   if (user.OTP === req.body.OTP) {
//     return res.status(200).json({ data: "OTP verifed success " });
//   }
// });

// Password Rest
// router.post("/password-reset", isAuthenticated, async (req, res) => {
//   try {
//     // Getting Token from header
//     let token = req.headers.authorization;
//     console.log(token);

//     // Decoding with "jwtDecode"
//     var decode = jwtDecode(token);
//     console.log(decode);
//     let user = await User.findOne({ _id: decode.id });
//     // Finding User
//     if (!user) {
//       return res.status(404).json({ message: "User Not Found" });
//     }
//     // Encripting Pasword and Updating
//     const hasedPassword = await bcrypt.hash(req.body.password, 10);
//     user.password = hasedPassword;
//     await user.save();
//     res
//       .status(200)
//       .json({ message: `${user.email}, Your hase been updated successfully ` });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error });
//   }
// });

export const useRouter = router;

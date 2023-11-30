import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnection from "./db.js";
import { useRouter } from "./Router/userRouter.js";
import { adminRouter } from "./Router/adminRouter.js";
import { doctorRouter } from "./Router/doctorsRoute.js";

// Configuring
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;

// Middlewers
app.use(express.json());
app.use(cors());
dbConnection();

// API setup
app.get("/", (req, res) => {
  res.send("Hey I working good");
});
// Configured API
app.use("/api/user", useRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);

// App listening
app.listen(PORT, () => console.log(`Node server working at ${PORT}`));

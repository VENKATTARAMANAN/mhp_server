import jwt, { decode } from "jsonwebtoken";
// import { User } from "../Models/User.js";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token, process.env.SECKRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Auth Failed", success: false });
      } else {
        req.body.userId = decoded.id;
        next();
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Auth Failed ", success: false });
  }
};

export { isAuthenticated };

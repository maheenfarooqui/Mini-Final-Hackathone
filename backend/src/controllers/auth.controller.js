import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt"

dotenv.config();
async function registerUser(req, res) {
  try {
    const { username, email, password, role } = req.body;
    const userAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (userAlreadyExists) {
      return res.status(409).json({
        message: "User Already Exists",
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      role,
    });
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWTSECRECT_KEY,
    );
    res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
    res.status(201).json({ message: "User created sucessfully", user, token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { username, email, password, role } = req.body;
    const user = await userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) {
      return res.status(409).json({
        message: "User Not Found",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWTSECRECT_KEY,
    );
    res.cookie("token", token);
    res.status(201).json({ message: "User logIn sucessfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

async function logoutUser(req,res){
 try {
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


async function currentUser(req, res) {
  try {
    // Authentication middleware must set req.user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    const user = await userModel
      .findById(userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}



async function googleAuthCallback(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect("http://localhost:5173/login");
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWTSECRECT_KEY
    );

    res.cookie("token", token);

    return res.redirect("http://localhost:5173/");
  } catch (error) {
    console.log("Google Auth Error:", error);

    return res.redirect("http://localhost:5173/login");
  }
}



export { registerUser, loginUser ,logoutUser,currentUser ,googleAuthCallback};

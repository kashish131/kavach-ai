import genToken from "../config/token.js";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const signUp = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.trim().toLowerCase();

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "email already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = await genToken(newUser._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false
    });

    return res.status(200).json(newUser);

  } catch (error) {
    return res.status(500).json({ message: `internal server error: ${error}` });
  }
};

export const Login = async (req, res) => {
  try {
    console.log("Full req.body:", req.body);
    let { email, password } = req.body;

    email = email.trim().toLowerCase();
    console.log("Email after trim:", email);

   const foundUser = await User.findOne({ email });
    console.log("User found:", foundUser);
    if (!foundUser) {
      return res.status(400).json({ message: "email does not exist" });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "incorrect password" });
    }

    const token = await genToken(foundUser._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false
    });

    return res.status(200).json(foundUser);

  } catch (error) {
    return res.status(500).json({ message: `internal server error: ${error}` });
  }
};

export const Logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: `logout error: ${error}` });
  }
};
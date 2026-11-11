import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

const JWT_SECRET = process.env.JWT_SECRET || "workout_app_jwt_secret";

// 1. Đăng ký tài khoản mới
export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserId = `user_${new mongoose.Types.ObjectId().toString()}`;

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: fullName || "Thành viên mới",
      userId: newUserId,
    });

    await Profile.create({
      userId: newUserId,
      goal: "Tăng cơ",
      level: "Beginner",
      trainingDaysPerWeek: 4,
    });

    const token = jwt.sign(
      { id: user._id, userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Tài khoản hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Tài khoản hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { id: user._id, userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

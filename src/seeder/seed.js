// src/seeder/seed.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Exercise from "../models/Exercise.js";
import Profile from "../models/Profile.js";
import WorkoutPlan from "../models/WorkoutPlan.js";
import WorkoutSession from "../models/WorkoutSession.js";
import WorkoutLog from "../models/WorkoutLog.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tìm đường dẫn tới seed-data.json ở thư mục gốc của dự án
const rootSeedPath = path.resolve(__dirname, "../../../seed-data.json");

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI chưa được cấu hình trong .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Đã kết nối MongoDB thành công!");

    if (!fs.existsSync(rootSeedPath)) {
      throw new Error(`Không tìm thấy file seed-data.json tại: ${rootSeedPath}`);
    }

    const rawData = fs.readFileSync(rootSeedPath, "utf-8");
    const data = JSON.parse(rawData);

    console.log("Đang làm sạch dữ liệu cũ trong 5 collections...");
    await Promise.all([
      Profile.deleteMany({}),
      Exercise.deleteMany({}),
      WorkoutPlan.deleteMany({}),
      WorkoutSession.deleteMany({}),
      WorkoutLog.deleteMany({}),
    ]);

    console.log("Đang nạp dữ liệu Profile...");
    if (data.profiles?.length) {
      await Profile.insertMany(data.profiles);
    }

    console.log("Đang nạp dữ liệu Bài tập (Exercise)...");
    if (data.exercises?.length) {
      await Exercise.insertMany(data.exercises);
    }

    console.log("Đang nạp dữ liệu Lịch trình (WorkoutPlan)...");
    if (data.plans?.length) {
      await WorkoutPlan.insertMany(data.plans);
    }

    console.log("Đang nạp dữ liệu Buổi tập (WorkoutSession)...");
    if (data.sessions?.length) {
      await WorkoutSession.insertMany(data.sessions);
    }

    console.log("Đang nạp dữ liệu Nhật ký tập (WorkoutLog)...");
    if (data.logs?.length) {
      await WorkoutLog.insertMany(data.logs);
    }

    console.log("Seed toàn bộ 5 collections thành công!");
    process.exit(0);
  } catch (error) {
    console.error(`Lỗi seed data: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();

import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Profile from "./src/models/Profile.js";
import Exercise from "./src/models/Exercise.js";
import WorkoutPlan from "./src/models/WorkoutPlan.js";
import WorkoutSession from "./src/models/WorkoutSession.js";
import WorkoutLog from "./src/models/WorkoutLog.js";

async function runSeed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Lỗi: Không tìm thấy biến môi trường MONGO_URI trong .env");
    process.exit(1);
  }

  try {
    console.log("Đang kết nối tới MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Kết nối MongoDB Atlas thành công.");

    const rawData = fs.readFileSync(
      path.join(__dirname, "seed-data.json"),
      "utf-8",
    );
    const data = JSON.parse(rawData);

    console.log("Đang làm sạch dữ liệu cũ...");
    await Promise.all([
      Profile.deleteMany({}),
      Exercise.deleteMany({}),
      WorkoutPlan.deleteMany({}),
      WorkoutSession.deleteMany({}),
      WorkoutLog.deleteMany({}),
    ]);

    console.log("Đang nạp dữ liệu chuẩn hóa từ Frontend...");
    if (data.profiles?.length) await Profile.insertMany(data.profiles);
    if (data.exercises?.length) await Exercise.insertMany(data.exercises);
    if (data.plans?.length) await WorkoutPlan.insertMany(data.plans);
    if (data.sessions?.length) await WorkoutSession.insertMany(data.sessions);
    if (data.logs?.length) await WorkoutLog.insertMany(data.logs);

    console.log("--------------------------------------------------");
    console.log(`Đã nạp thành công:`);
    console.log(`- Profiles:  ${data.profiles?.length || 0}`);
    console.log(`- Exercises: ${data.exercises?.length || 0}`);
    console.log(`- Plans:     ${data.plans?.length || 0}`);
    console.log(`- Sessions:  ${data.sessions?.length || 0}`);
    console.log(`- Logs:      ${data.logs?.length || 0}`);
    console.log("--------------------------------------------------");
    console.log("Cơ sở dữ liệu đã đồng bộ 100% với Frontend!");

    process.exit(0);
  } catch (error) {
    console.error("Lỗi trong quá trình nạp dữ liệu:", error);
    process.exit(1);
  }
}

runSeed();

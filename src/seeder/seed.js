// src/seeder/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Exercise from "../models/Exercise.js";

dotenv.config();

const exercises = [
  {
    name: "Barbell Bench Press",
    muscleGroup: "Ngực",
    equipmentRequired: "Barbell",
  },
  { name: "Squat", muscleGroup: "Chân", equipmentRequired: "Barbell" },
  { name: "Deadlift", muscleGroup: "Lưng", equipmentRequired: "Barbell" },
  { name: "Pull-up", muscleGroup: "Lưng", equipmentRequired: "Bodyweight" },
  { name: "Push-up", muscleGroup: "Ngực", equipmentRequired: "Bodyweight" },
  {
    name: "Muscle-up",
    muscleGroup: "Toàn thân",
    equipmentRequired: "Bodyweight",
  },
  {
    name: "Dumbbell Curl",
    muscleGroup: "Tay trước",
    equipmentRequired: "Dumbbell",
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Đang xóa dữ liệu cũ...");
    await Exercise.deleteMany();

    console.log("Đang đổ dữ liệu Bài tập mới...");
    await Exercise.insertMany(exercises);

    console.log("Seed dữ liệu thành công!");
    process.exit();
  } catch (error) {
    console.error(`Lỗi seed data: ${error.message}`);
    process.exit(1);
  }
};

seedData();

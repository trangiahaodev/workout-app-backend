import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    goal: {
      type: String,
      required: true,
      enum: ["Tăng cơ", "Giảm mỡ", "Sức mạnh", "Giữ dáng, giữ cân"],
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    trainingDaysPerWeek: { type: Number, default: 3 },
  },
  { timestamps: true },
);

export default mongoose.model("Profile", profileSchema);

import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    muscleGroup: { type: String, required: true, trim: true },
    equipmentRequired: { type: String, default: "None" },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    instructions: { type: [String], default: [] },
    recommendedSetsReps: {
      type: String,
      default: "3 - 4 sets • 8 - 12 reps • Nghỉ 60s",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Exercise", exerciseSchema);

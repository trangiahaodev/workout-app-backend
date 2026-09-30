import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    muscleGroup: { type: String, required: true },
    description: { type: String },
    equipmentRequired: { type: String, default: "None" },
  },
  { timestamps: true },
);

export default mongoose.model("Exercise", exerciseSchema);

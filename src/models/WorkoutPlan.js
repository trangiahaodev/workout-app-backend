import mongoose from "mongoose";

const workoutPlanSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    name: { type: String, required: true },
    generatedByAI: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("WorkoutPlan", workoutPlanSchema);

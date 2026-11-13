import mongoose from "mongoose";

const workoutSessionSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutPlan",
      required: true,
    },
    name: { type: String, required: true },
    exercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("WorkoutSession", workoutSessionSchema);

import mongoose from "mongoose";

const setSchema = new mongoose.Schema({
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
});

const workoutLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutSession",
      required: true,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    sets: [setSchema],
    notes: { type: String },
    progressPhotoUrl: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("WorkoutLog", workoutLogSchema);

import WorkoutSession from "../models/WorkoutSession.js";

export const getSessionsByPlan = async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      planId: req.params.planId,
    }).sort({ scheduledDate: 1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const session = await WorkoutSession.create(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const completeSession = async (req, res) => {
  try {
    const session = await WorkoutSession.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        completedDate: req.body?.completedDate || new Date(),
      },
      { new: true },
    );
    if (!session) {
      return res.status(404).json({ message: "Không tìm thấy buổi tập" });
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

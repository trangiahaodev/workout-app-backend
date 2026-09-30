import WorkoutPlan from "../models/WorkoutPlan.js";

export const getPlansByProfile = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ profileId: req.params.profileId });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const newPlan = await WorkoutPlan.create(req.body);
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePlanStatus = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    res.status(200).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

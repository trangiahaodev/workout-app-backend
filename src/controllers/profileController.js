import Profile from "../models/Profile.js";

export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Chưa có profile" });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertProfile = async (req, res) => {
  try {
    // Nếu có thì update, chưa có thì tạo mới (upsert)
    const profile = await Profile.findOneAndUpdate(
      { userId: req.body.userId },
      req.body,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

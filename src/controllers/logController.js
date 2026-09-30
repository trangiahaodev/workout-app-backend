import WorkoutLog from "../models/WorkoutLog.js";

export const getLogsBySession = async (req, res) => {
  try {
    // Populate để lấy luôn tên bài tập từ bảng Exercise thay vì chỉ trả về ID
    const logs = await WorkoutLog.find({
      sessionId: req.params.sessionId,
    }).populate("exerciseId", "name muscleGroup");
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveLog = async (req, res) => {
  try {
    // Nếu client gửi log mới thì tạo, nếu update log cũ thì tìm và sửa
    const { sessionId, exerciseId, sets, notes, progressPhotoUrl } = req.body;

    let log = await WorkoutLog.findOne({ sessionId, exerciseId });

    if (log) {
      log.sets = sets;
      if (notes) log.notes = notes;
      if (progressPhotoUrl) log.progressPhotoUrl = progressPhotoUrl;
      await log.save();
    } else {
      log = await WorkoutLog.create(req.body);
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

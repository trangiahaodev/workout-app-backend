import Profile from "../models/Profile.js";
import WorkoutPlan from "../models/WorkoutPlan.js";
import WorkoutSession from "../models/WorkoutSession.js";
import WorkoutLog from "../models/WorkoutLog.js";
import ChatMessage from "../models/ChatMessage.js";
import {
  generateProgressInsights,
  chatWithCoach,
} from "../services/aiService.js";

/**
 * POST /api/v1/ai/insights
 * Tính toán chênh lệch số liệu quá khứ -> gửi AI rút trích Insight hành động
 */
export const getProgressInsights = async (req, res) => {
  try {
    const { profileId, userId } = req.body;

    const profile = profileId
      ? await Profile.findById(profileId)
      : await Profile.findOne({ userId });

    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hồ sơ người dùng" });
    }

    const plans = await WorkoutPlan.find({ profileId: profile._id });
    const planIds = plans.map((p) => p._id);

    const allSessions = await WorkoutSession.find({
      planId: { $in: planIds },
    }).sort({ completedDate: -1, scheduledDate: -1 });

    const completedSessions = allSessions.filter(
      (s) => s.status === "completed",
    );
    const completedIds = completedSessions.map((s) => s._id);

    const logs = await WorkoutLog.find({
      sessionId: { $in: completedIds },
    }).populate("exerciseId", "name muscleGroup");

    // Map sessionId -> completedDate để so sánh 7 ngày gần nhất vs 7 ngày trước đó
    const sessionDateMap = new Map(
      completedSessions.map((s) => [
        String(s._id),
        new Date(s.completedDate || s.updatedAt || s.scheduledDate),
      ]),
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let totalVolumeKg = 0;
    let currentWeekVolumeKg = 0;
    let previousWeekVolumeKg = 0;
    let totalCompletedSets = 0;
    const muscleSetCounts = {};

    for (const log of logs) {
      const sDate = sessionDateMap.get(String(log.sessionId));
      const muscle = log.exerciseId?.muscleGroup || "Khác";

      for (const set of log.sets || []) {
        if (!set.isCompleted) continue;
        const vol = (Number(set.weight) || 0) * (Number(set.reps) || 0);
        totalVolumeKg += vol;
        totalCompletedSets += 1;
        muscleSetCounts[muscle] = (muscleSetCounts[muscle] || 0) + 1;

        if (sDate && sDate >= sevenDaysAgo) {
          currentWeekVolumeKg += vol;
        } else if (sDate && sDate >= fourteenDaysAgo && sDate < sevenDaysAgo) {
          previousWeekVolumeKg += vol;
        }
      }
    }

    const volumeChangePercent =
      previousWeekVolumeKg > 0
        ? Math.round(
            ((currentWeekVolumeKg - previousWeekVolumeKg) /
              previousWeekVolumeKg) *
              100,
          )
        : currentWeekVolumeKg > 0
          ? 100
          : 0;

    const completionRatePercent =
      allSessions.length > 0
        ? Math.round((completedSessions.length / allSessions.length) * 100)
        : 0;

    const muscleDistribution = {};
    if (totalCompletedSets > 0) {
      for (const [group, count] of Object.entries(muscleSetCounts)) {
        muscleDistribution[group] = Math.round(
          (count / totalCompletedSets) * 100,
        );
      }
    }

    const recentSessions = completedSessions.slice(0, 5).map((s) => ({
      name: s.name,
      date: (s.completedDate || s.scheduledDate).toISOString().split("T")[0],
    }));

    const metrics = {
      goal: profile.goal,
      level: profile.level,
      totalCompletedSessions: completedSessions.length,
      totalScheduledSessions: allSessions.length,
      completionRatePercent,
      totalVolumeKg: Math.round(totalVolumeKg),
      currentWeekVolumeKg: Math.round(currentWeekVolumeKg),
      previousWeekVolumeKg: Math.round(previousWeekVolumeKg),
      volumeChangePercent,
      avgSessionsPerWeek: profile.trainingDaysPerWeek,
      muscleDistribution,
      recentSessions,
    };

    const insight = await generateProgressInsights(metrics);
    res.status(200).json({ metrics, insight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/ai/chat/:userId
 */
export const getChatHistory = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.params.userId })
      .sort({ createdAt: 1 })
      .limit(40);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/ai/chat
 */
export const sendChatMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message?.trim()) {
      return res
        .status(400)
        .json({ message: "Thiếu userId hoặc nội dung câu hỏi" });
    }

    const userMessage = await ChatMessage.create({
      userId,
      role: "user",
      content: message.trim(),
    });

    // Gom ngữ cảnh thực tế của user từ DB
    const profile = await Profile.findOne({ userId });
    let userContext = "Chưa thiết lập hồ sơ.";

    if (profile) {
      const activePlan = await WorkoutPlan.findOne({
        profileId: profile._id,
        status: "active",
      });

      const plans = await WorkoutPlan.find({ profileId: profile._id });
      const recentCompleted = await WorkoutSession.find({
        planId: { $in: plans.map((p) => p._id) },
        status: "completed",
      })
        .sort({ completedDate: -1 })
        .limit(5);

      userContext = `- Mục tiêu: ${profile.goal} | Trình độ: ${profile.level} | Tần suất: ${profile.trainingDaysPerWeek} buổi/tuần
- Ghi chú riêng: ${profile.customNote || "Không có"}
- Lộ trình đang tập: ${activePlan ? `${activePlan.name} (${activePlan.durationWeeks} tuần)` : "Chưa có"}
- 5 buổi tập hoàn thành gần nhất: ${
        recentCompleted.length > 0
          ? recentCompleted.map((s) => s.name).join(", ")
          : "Chưa hoàn thành buổi nào"
      }`;
    }

    const recentHistory = await ChatMessage.find({
      userId,
      _id: { $ne: userMessage._id },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const replyText = await chatWithCoach({
      message: message.trim(),
      chatHistory: recentHistory.reverse(),
      userContext,
    });

    const assistantMessage = await ChatMessage.create({
      userId,
      role: "assistant",
      content: replyText,
    });

    res.status(201).json({ userMessage, assistantMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/ai/chat/:userId
 */
export const clearChatHistory = async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.params.userId });
    res.status(200).json({ message: "Đã xóa lịch sử trò chuyện" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

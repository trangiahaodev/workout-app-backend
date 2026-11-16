import WorkoutPlan from "../models/WorkoutPlan.js";
import WorkoutSession from "../models/WorkoutSession.js";
import Exercise from "../models/Exercise.js";
import Profile from "../models/Profile.js";
import { generatePersonalizedPlan } from "../services/aiService.js";

const GOAL_COVERS = {
  "Tăng cơ":
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
  "Giảm mỡ":
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=800&q=80",
  "Sức mạnh":
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80",
  "Giữ dáng, giữ cân":
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
};

const MUSCLE_DEFAULT_IMAGES = {
  Ngực: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
  Lưng: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=800&q=80",
  Chân: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=800&q=80",
  Vai: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=800&q=80",
  "Tay trước":
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80",
  "Tay sau":
    "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=800&q=80",
  Bụng: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
  "Toàn thân":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
};

export const getPlansByProfile = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({
      profileId: req.params.profileId,
    }).sort({ createdAt: -1 });
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
    const targetPlan = await WorkoutPlan.findById(req.params.id);
    if (!targetPlan) {
      return res.status(404).json({ message: "Không tìm thấy lộ trình" });
    }

    if (req.body.status === "active") {
      await WorkoutPlan.updateMany(
        {
          profileId: targetPlan.profileId,
          status: "active",
          _id: { $ne: targetPlan._id },
        },
        { $set: { status: "abandoned" } },
      );
    }

    targetPlan.status = req.body.status;
    await targetPlan.save();
    res.status(200).json(targetPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

function buildFallbackTemplates(daysPerWeek, exercises) {
  const pick = (groups, limit = 4) => {
    const matched = exercises.filter((ex) => groups.includes(ex.muscleGroup));
    const pool = matched.length > 0 ? matched : exercises;
    return pool.slice(0, limit).map((ex) => ex._id);
  };

  if (daysPerWeek <= 3) {
    return [
      {
        title: "Full Body A - Nền tảng",
        exerciseIds: pick(["Ngực", "Lưng", "Chân", "Bụng"]),
      },
      {
        title: "Full Body B - Thân trên",
        exerciseIds: pick(["Vai", "Lưng", "Toàn thân", "Tay trước"]),
      },
      {
        title: "Full Body C - Sức bền",
        exerciseIds: pick(["Ngực", "Chân", "Tay sau", "Bụng"]),
      },
    ];
  }
  return [
    {
      title: "Upper A - Ngực & Lưng",
      exerciseIds: pick(["Ngực", "Lưng", "Vai", "Tay sau"]),
    },
    {
      title: "Lower A - Chân & Core",
      exerciseIds: pick(["Chân", "Bụng", "Toàn thân"]),
    },
    {
      title: "Upper B - Vai & Tay",
      exerciseIds: pick(["Vai", "Tay trước", "Tay sau", "Ngực"]),
    },
    {
      title: "Lower B - Toàn thân",
      exerciseIds: pick(["Toàn thân", "Chân", "Bụng"]),
    },
  ];
}

export const generateRoadmap = async (req, res) => {
  try {
    const {
      profileId,
      goal = "Tăng cơ",
      level = "Beginner",
      trainingDaysPerWeek = 3,
      customNote = "",
    } = req.body;

    if (!profileId) {
      return res
        .status(400)
        .json({ message: "Thiếu profileId để tạo lộ trình" });
    }

    const days = Math.min(7, Math.max(1, Number(trainingDaysPerWeek) || 3));
    const profile = await Profile.findById(profileId);
    const effectiveNote = customNote || profile?.customNote || "";

    const existingExercises = await Exercise.find({});
    if (existingExercises.length === 0) {
      return res.status(400).json({
        message: "Kho bài tập đang trống, hãy chạy seed dữ liệu trước",
      });
    }

    // Map tra cứu nhanh bài tập theo tên (không phân biệt hoa thường)
    const exerciseMap = new Map(
      existingExercises.map((ex) => [ex.name.trim().toLowerCase(), ex]),
    );

    let planName = `Lộ trình ${goal} cá nhân hóa (${days} buổi/tuần)`;
    let durationWeeks = 4;
    let aiNote = "";
    let generatedByAI = false;
    let resolvedWeeklySplit = [];

    try {
      const aiResult = await generatePersonalizedPlan({
        goal,
        level,
        trainingDaysPerWeek: days,
        customNote: effectiveNote,
        existingExercises,
      });

      planName = aiResult.planName || planName;
      durationWeeks = Math.min(
        8,
        Math.max(4, Number(aiResult.durationWeeks) || 4),
      );
      aiNote = aiResult.aiNote || "";
      generatedByAI = true;

      for (const dayPlan of aiResult.weeklySplit || []) {
        const exerciseIds = [];

        for (const item of dayPlan.exercises || []) {
          const normalizedKey = item.name.trim().toLowerCase();
          let exDoc = exerciseMap.get(normalizedKey);

          // Nếu AI đề xuất bài tập mới ngoài 24 bài seed -> tự động thêm vào DB
          if (!exDoc) {
            const defaultImg =
              MUSCLE_DEFAULT_IMAGES[item.muscleGroup] ||
              MUSCLE_DEFAULT_IMAGES["Toàn thân"];

            exDoc = await Exercise.create({
              name: item.name.trim(),
              muscleGroup: item.muscleGroup || "Toàn thân",
              equipmentRequired: item.equipmentRequired || "None",
              description: item.description || "",
              images: [defaultImg],
              instructions:
                Array.isArray(item.instructions) && item.instructions.length > 0
                  ? item.instructions
                  : ["Giữ thẳng lưng, hít thở đều và kiểm soát chuyển động."],
              recommendedSetsReps:
                item.recommendedSetsReps ||
                "3 - 4 sets • 8 - 12 reps • Nghỉ 60s",
            });
            exerciseMap.set(normalizedKey, exDoc);
          }

          exerciseIds.push(exDoc._id);
        }

        if (exerciseIds.length > 0) {
          resolvedWeeklySplit.push({
            title: dayPlan.title,
            exerciseIds,
          });
        }
      }
    } catch (aiError) {
      console.warn("AI Generate fallback triggered:", aiError.message);
      generatedByAI = false;
      aiNote = `Giáo án chuẩn ${durationWeeks} tuần tối ưu cho mục tiêu ${goal} với tần suất ${days} buổi/tuần.`;
      resolvedWeeklySplit = buildFallbackTemplates(days, existingExercises);
    }

    if (resolvedWeeklySplit.length === 0) {
      resolvedWeeklySplit = buildFallbackTemplates(days, existingExercises);
    }

    // Chuyển các lộ trình active cũ sang abandoned
    await WorkoutPlan.updateMany(
      { profileId, status: "active" },
      { $set: { status: "abandoned" } },
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationWeeks * 7);

    const plan = await WorkoutPlan.create({
      profileId,
      name: planName,
      goal,
      coverImage: GOAL_COVERS[goal] || GOAL_COVERS["Tăng cơ"],
      generatedByAI,
      durationWeeks,
      aiNote,
      status: "active",
      startDate,
      endDate,
    });

    const sessionsPayload = [];
    for (let week = 0; week < durationWeeks; week++) {
      for (let d = 0; d < days; d++) {
        const dayOffset = week * 7 + Math.floor((d * 7) / days);
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(startDate.getDate() + dayOffset);

        const tpl =
          resolvedWeeklySplit[(week * days + d) % resolvedWeeklySplit.length];
        sessionsPayload.push({
          planId: plan._id,
          name: `Tuần ${week + 1} · ${tpl.title}`,
          exercises: tpl.exerciseIds,
          scheduledDate,
          status: "pending",
        });
      }
    }

    const sessions = await WorkoutSession.insertMany(sessionsPayload);
    res.status(201).json({ plan, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

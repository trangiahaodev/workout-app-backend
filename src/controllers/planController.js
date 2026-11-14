import WorkoutPlan from "../models/WorkoutPlan.js";
import WorkoutSession from "../models/WorkoutSession.js";
import Exercise from "../models/Exercise.js";

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

function pickByGroups(exercises, groups, limit = 4) {
  const matched = exercises.filter((ex) => groups.includes(ex.muscleGroup));
  const pool = matched.length > 0 ? matched : exercises;
  return pool.slice(0, limit).map((ex) => ex._id);
}

function buildSplitTemplates(daysPerWeek, exercises) {
  if (daysPerWeek <= 3) {
    return [
      {
        title: "Full Body A - Nền tảng",
        exercises: pickByGroups(exercises, ["Ngực", "Lưng", "Chân", "Bụng"], 4),
      },
      {
        title: "Full Body B - Thân trên & Đùi sau",
        exercises: pickByGroups(
          exercises,
          ["Vai", "Lưng", "Toàn thân", "Tay trước"],
          4,
        ),
      },
      {
        title: "Full Body C - Sức bền & Core",
        exercises: pickByGroups(
          exercises,
          ["Ngực", "Chân", "Tay sau", "Bụng"],
          4,
        ),
      },
    ];
  }

  if (daysPerWeek === 4) {
    return [
      {
        title: "Upper A - Ngực & Lưng",
        exercises: pickByGroups(
          exercises,
          ["Ngực", "Lưng", "Vai", "Tay sau"],
          4,
        ),
      },
      {
        title: "Lower A - Đùi trước & Bụng",
        exercises: pickByGroups(exercises, ["Chân", "Bụng"], 4),
      },
      {
        title: "Upper B - Vai & Tay",
        exercises: pickByGroups(
          exercises,
          ["Vai", "Tay trước", "Tay sau", "Ngực"],
          4,
        ),
      },
      {
        title: "Lower B - Chuỗi cơ sau & Mông",
        exercises: pickByGroups(exercises, ["Toàn thân", "Chân", "Bụng"], 4),
      },
    ];
  }

  return [
    {
      title: "Push - Ngực, Vai & Tay sau",
      exercises: pickByGroups(exercises, ["Ngực", "Vai", "Tay sau"], 4),
    },
    {
      title: "Pull - Lưng & Tay trước",
      exercises: pickByGroups(exercises, ["Lưng", "Tay trước"], 4),
    },
    {
      title: "Legs & Core - Chân & Bụng",
      exercises: pickByGroups(exercises, ["Chân", "Toàn thân", "Bụng"], 4),
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
    } = req.body;
    if (!profileId) {
      return res
        .status(400)
        .json({ message: "Thiếu profileId để tạo lộ trình" });
    }

    const days = Math.min(7, Math.max(1, Number(trainingDaysPerWeek) || 3));
    const exercises = await Exercise.find({});
    if (exercises.length === 0) {
      return res.status(400).json({
        message: "Kho bài tập đang trống, hãy chạy seed dữ liệu trước",
      });
    }

    // Chuyển các lộ trình đang active trước đó sang abandoned để giữ lịch sử
    await WorkoutPlan.updateMany(
      { profileId, status: "active" },
      { $set: { status: "abandoned" } },
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 28);

    const plan = await WorkoutPlan.create({
      profileId,
      name: `Lộ trình ${goal} (${days} buổi/tuần)`,
      goal,
      coverImage: GOAL_COVERS[goal] || GOAL_COVERS["Tăng cơ"],
      generatedByAI: false,
      status: "active",
      startDate,
      endDate,
    });

    const templates = buildSplitTemplates(days, exercises);
    const sessionsPayload = [];

    for (let week = 0; week < 4; week++) {
      for (let d = 0; d < days; d++) {
        const dayOffset = week * 7 + Math.floor((d * 7) / days);
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(startDate.getDate() + dayOffset);

        const tpl = templates[(week * days + d) % templates.length];
        sessionsPayload.push({
          planId: plan._id,
          name: `Tuần ${week + 1} · ${tpl.title}`,
          exercises: tpl.exercises,
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

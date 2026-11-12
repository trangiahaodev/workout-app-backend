import fs from "fs";

const DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const ALIAS_MAP = {
  "Barbell Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
  "Incline Dumbbell Press": "Incline_Dumbbell_Press",
  "Pec Deck Fly": "Butterfly",
  "Cable Crossover": "Cable_Crossover",
  "Lat Pulldown": "Wide-Grip_Lat_Pulldown",
  "Seated Cable Row": "Seated_Cable_Rows",
  "Conventional Deadlift": "Barbell_Deadlift",
  "Dumbbell One-Arm Row": "One-Arm_Dumbbell_Row",
  "Barbell Back Squat": "Barbell_Full_Squat",
  "Leg Press": "Leg_Press",
  "Leg Extension": "Leg_Extensions",
  "Seated Leg Curl": "Seated_Leg_Curl",
  "Standing Calf Raise": "Standing_Calf_Raises",
  "Dumbbell Shoulder Press": "Dumbbell_Shoulder_Press",
  "Dumbbell Lateral Raise": "Side_Lateral_Raise",
  "Face Pull": "Face_Pull",
  "Dumbbell Bicep Curl": "Dumbbell_Bicep_Curl",
  "Hammer Curl": "Hammer_Curls",
  "Tricep Rope Pushdown": "Triceps_Pushdown_-_Rope_Attachment",
  "Skull Crusher": "Lying_Triceps_Press",
  "Cable Crunch": "Cable_Crunch",
  "Hanging Knee Raise": "Hanging_Leg_Raise",
  "Abdominal Crunch Machine": "Ab_Crunch_Machine",
  "Barbell Romanian Deadlift": "Romanian_Deadlift",
  "Kettlebell Swing": "One-Arm_Kettlebell_Swings",
};

async function enrichSeedData() {
  console.log("Đang tải kho dữ liệu bài tập từ GitHub CDN...");
  const res = await fetch(DB_URL);
  const catalog = await res.json();

  const raw = fs.readFileSync("./seed-data.json", "utf-8");
  const data = JSON.parse(raw);

  for (const ex of data.exercises) {
    // Dọn dẹp link gifUrl cũ bị lỗi nếu có
    delete ex.gifUrl;

    const targetId = ALIAS_MAP[ex.name];
    const match =
      catalog.find((item) => item.id === targetId) ||
      catalog.find((item) =>
        item.name.toLowerCase().includes(ex.name.toLowerCase()),
      );

    if (match && match.images?.length > 0) {
      ex.images = match.images.map((img) => `${IMAGE_BASE_URL}${img}`);
      if (match.instructions?.length) {
        ex.instructions = match.instructions;
      }
      console.log(`✅ ${ex.name} -> ${ex.images.length} khung hình động tác`);
    } else {
      console.log(`⚠️ Không khớp: ${ex.name}`);
    }
  }

  fs.writeFileSync("./seed-data.json", JSON.stringify(data, null, 2), "utf-8");
  console.log("🎉 Hoàn tất cập nhật seed-data.json!");
}

enrichSeedData();

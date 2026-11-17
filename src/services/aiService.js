const DEFAULT_MODEL = "gemini-3.5-flash-lite";

async function callGemini({
  systemInstruction,
  contents,
  responseSchema = null,
  temperature = 0.6,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const generationConfig = {
    temperature,
    maxOutputTokens: 2048,
  };

  if (responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = responseSchema;
  }

  const body = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini API");
    }

    return responseSchema ? JSON.parse(rawText) : rawText.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 1. Sinh lộ trình cá nhân hóa hoàn toàn dựa trên mục tiêu + ghi chú tự do
 */
export async function generatePersonalizedPlan({
  goal,
  level,
  trainingDaysPerWeek,
  customNote,
  existingExercises,
}) {
  const catalogSummary = existingExercises
    .map(
      (ex) =>
        `- ${ex.name} (Nhóm cơ: ${ex.muscleGroup}, Dụng cụ: ${ex.equipmentRequired || "None"})`,
    )
    .join("\n");

  const systemInstruction = `Bạn là chuyên gia huấn luyện thể hình cá nhân (Personal Trainer).
Nhiệm vụ: Thiết kế giáo án tập luyện khoa học, cá nhân hóa hoàn toàn theo mục tiêu, trình độ, số buổi/tuần và ghi chú riêng của học viên.
Quy tắc:
1. Số tuần (durationWeeks) linh hoạt từ 4 đến 8 tuần tùy mục tiêu (ví dụ: Giảm mỡ/Tăng cơ thường 6-8 tuần, Sức mạnh/Giữ dáng 4-6 tuần).
2. Số buổi trong weeklySplit BẮT BUỘC bằng đúng trainingDaysPerWeek. Mỗi buổi có 4-5 bài tập.
3. Ưu tiên sử dụng bài tập từ danh sách có sẵn nếu phù hợp, NHƯNG được phép tự đề xuất thêm bài tập mới chuyên biệt nếu ghi chú của học viên yêu cầu (ví dụ: chấn thương khớp gối/vai, ưu tiên nhóm cơ cụ thể).
4. Toàn bộ nội dung tiếng Việt tự nhiên, ngắn gọn, thực tế, sử dụng văn phong đơn giản, triệt tiêu AI smell`;

  const userPrompt = `Thông tin học viên:
- Mục tiêu chính: ${goal}
- Trình độ: ${level}
- Tần suất tập: ${trainingDaysPerWeek} buổi/tuần
- Ghi chú / Mong muốn cá nhân: ${customNote ? `"${customNote}"` : "Không có ghi chú đặc biệt"}

Danh sách bài tập tham chiếu hiện có trong hệ thống:
${catalogSummary}

Hãy trả về JSON thiết kế lộ trình tập luyện tối ưu nhất.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      planName: { type: "STRING" },
      durationWeeks: { type: "INTEGER" },
      aiNote: { type: "STRING" },
      weeklySplit: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            exercises: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  muscleGroup: { type: "STRING" },
                  equipmentRequired: { type: "STRING" },
                  description: { type: "STRING" },
                  instructions: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                  recommendedSetsReps: { type: "STRING" },
                },
                required: [
                  "name",
                  "muscleGroup",
                  "equipmentRequired",
                  "description",
                  "instructions",
                  "recommendedSetsReps",
                ],
              },
            },
          },
          required: ["title", "exercises"],
        },
      },
    },
    required: ["planName", "durationWeeks", "aiNote", "weeklySplit"],
  };

  return await callGemini({
    systemInstruction,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    responseSchema,
    temperature: 0.7,
  });
}

/**
 * 2. Phân tích dữ liệu thống kê thành thông tin có giá trị ra quyết định (Actionable Insight)
 */
export async function generateProgressInsights(metrics) {
  const systemInstruction = `Bạn là chuyên gia phân tích hiệu suất tập luyện thể hình.
Nhiệm vụ: Đọc các chỉ số thống kê và so sánh quá khứ của người tập, từ đó rút ra 3 nhận định SẮC BÉN, CÓ Ý NGHĨA RA QUYẾT ĐỊNH (không lặp lại số liệu thô một cách máy móc).
Trả về JSON tiếng Việt ngắn gọn, súc tích, dễ đọc trên điện thoại.`;

  const userPrompt = `Dữ liệu tập luyện tổng hợp của người dùng:
- Mục tiêu hiện tại: ${metrics.goal} (${metrics.level})
- Tổng số buổi đã hoàn thành: ${metrics.totalCompletedSessions} / ${metrics.totalScheduledSessions} buổi (Tỷ lệ hoàn thành: ${metrics.completionRatePercent}%)
- Tổng khối lượng tạ tích lũy (Volume): ${metrics.totalVolumeKg} kg
- Volume 7 ngày gần nhất: ${metrics.currentWeekVolumeKg} kg | 7 ngày trước đó: ${metrics.previousWeekVolumeKg} kg (Chênh lệch: ${metrics.volumeChangePercent}%)
- Tần suất trung bình: ${metrics.avgSessionsPerWeek} buổi/tuần
- Phân bổ nhóm cơ (% số hiệp hoàn thành): ${JSON.stringify(metrics.muscleDistribution)}
- Các buổi tập gần nhất: ${JSON.stringify(metrics.recentSessions)}

Hãy phân tích ý nghĩa đằng sau các con số này và đưa ra khuyến nghị cụ thể cho buổi tập tiếp theo.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      headline: { type: "STRING" },
      trendAnalysis: { type: "STRING" },
      imbalanceWarning: { type: "STRING" },
      nextAction: { type: "STRING" },
    },
    required: ["headline", "trendAnalysis", "imbalanceWarning", "nextAction"],
  };

  try {
    return await callGemini({
      systemInstruction,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      responseSchema,
      temperature: 0.5,
    });
  } catch (error) {
    // Fallback thông minh dựa trên số liệu thật nếu mất mạng hoặc chưa cấu hình API key
    const deltaText =
      metrics.volumeChangePercent >= 0
        ? `tăng ${metrics.volumeChangePercent}%`
        : `giảm ${Math.abs(metrics.volumeChangePercent)}%`;

    const entries = Object.entries(metrics.muscleDistribution || {});
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const topMuscle = sorted[0]?.[0] || "Toàn thân";
    const lowMuscle = sorted[sorted.length - 1]?.[0] || "Chân";

    return {
      headline: `Khối lượng tập tuần này ${deltaText} so với tuần trước`,
      trendAnalysis: `Bạn đã duy trì tỷ lệ hoàn thành ${metrics.completionRatePercent}% với tần suất trung bình ${metrics.avgSessionsPerWeek} buổi/tuần. Tổng mức tạ tích lũy đạt ${metrics.totalVolumeKg.toLocaleString()} kg.`,
      imbalanceWarning:
        entries.length >= 2
          ? `Nhóm cơ ${topMuscle} đang chiếm tỷ trọng cao nhất (${sorted[0][1]}%), trong khi nhóm ${lowMuscle} chỉ chiếm ${sorted[sorted.length - 1][1]}%.`
          : "Dữ liệu nhóm cơ còn ít, hãy hoàn thành thêm các buổi tập đa dạng nhóm cơ để đánh giá cân bằng.",
      nextAction: `Ở buổi tập kế tiếp, ưu tiên khởi đầu với nhóm ${lowMuscle} và thử tăng thêm 1-2 reps hoặc 2.5kg ở bài tập chính.`,
    };
  }
}

/**
 * 3. Chatbot AI Coach giới hạn phạm vi chuyên môn & gắn với dữ liệu cá nhân
 */
export async function chatWithCoach({ message, chatHistory, userContext }) {
  const systemInstruction = `Bạn là "AI Coach" - trợ lý huấn luyện viên thể hình tích hợp trong ứng dụng Nhật ký luyện tập cá nhân.
PHẠM VI TRẢ LỜI (BẮT BUỘC TUÂN THỦ):
- Chỉ trả lời các câu hỏi liên quan đến: tập gym, kỹ thuật động tác, giáo án/lịch tập, phục hồi chấn thương nhẹ, dinh dưỡng thể thao và phân tích dữ liệu tập luyện của chính người dùng bên dưới.
- Nếu người dùng hỏi các chủ đề hoàn toàn không liên quan (lập trình, chính trị, giải toán, viết văn, tin tức...), hãy từ chối lịch sự trong 1 câu và hướng họ quay lại chủ đề tập luyện.
- Trả lời bằng tiếng Việt ngắn gọn (tối đa 120-150 từ), dùng gạch đầu dòng rõ ràng, dễ đọc trên màn hình điện thoại.

DỮ LIỆU CÁ NHÂN CỦA NGƯỜI DÙNG HIỆN TẠI:
${userContext}`;

  const contents = [];

  for (const turn of chatHistory) {
    contents.push({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  try {
    return await callGemini({
      systemInstruction,
      contents,
      temperature: 0.6,
    });
  } catch (error) {
    return "Hiện tại kết nối tới máy chủ AI Coach đang gián đoạn. Dựa trên hồ sơ của bạn, hãy ưu tiên giữ đúng kỹ thuật, nghỉ 60-90 giây giữa các hiệp chính và đảm bảo hoàn thành đủ số buổi mục tiêu trong tuần nhé!";
  }
}

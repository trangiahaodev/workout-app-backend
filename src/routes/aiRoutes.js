import express from "express";
import {
  getProgressInsights,
  getChatHistory,
  sendChatMessage,
  clearChatHistory,
} from "../controllers/aiController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Assistant
 *   description: API Phân tích tiến độ thông minh (AI Insight) và Trợ lý huấn luyện viên (AI Coach)
 */

/**
 * @swagger
 * /api/v1/ai/insights:
 *   post:
 *     summary: Phân tích dữ liệu tập luyện và rút trích nhận định (AI Insight)
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileId:
 *                 type: string
 *                 description: ID của Profile (ưu tiên truyền nếu có)
 *               userId:
 *                 type: string
 *                 description: ID của User (dùng để tra cứu Profile nếu không truyền profileId)
 *     responses:
 *       200:
 *         description: Trả về bộ chỉ số thống kê so sánh và phân tích đề xuất từ AI
 *       404:
 *         description: Không tìm thấy hồ sơ người dùng
 *       500:
 *         description: Lỗi xử lý hệ thống
 */
router.post("/insights", getProgressInsights);

/**
 * @swagger
 * /api/v1/ai/chat/{userId}:
 *   get:
 *     summary: Lấy lịch sử hội thoại với AI Coach theo userId
 *     tags: [AI Assistant]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của user (từ hệ thống Auth)
 *     responses:
 *       200:
 *         description: Thành công, trả về danh sách tin nhắn
 *       500:
 *         description: Lỗi máy chủ
 */
router.get("/chat/:userId", getChatHistory);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Gửi câu hỏi cho AI Coach (tự động đính kèm ngữ cảnh hồ sơ & lịch sử tập luyện)
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID của user
 *               message:
 *                 type: string
 *                 description: Nội dung câu hỏi liên quan đến tập luyện
 *     responses:
 *       201:
 *         description: Thành công, trả về tin nhắn của người dùng và phản hồi từ AI Coach
 *       400:
 *         description: Thiếu userId hoặc nội dung câu hỏi
 *       500:
 *         description: Lỗi máy chủ
 */
router.post("/chat", sendChatMessage);

/**
 * @swagger
 * /api/v1/ai/chat/{userId}:
 *   delete:
 *     summary: Xóa toàn bộ lịch sử trò chuyện với AI Coach của người dùng
 *     tags: [AI Assistant]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Đã xóa lịch sử trò chuyện
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete("/chat/:userId", clearChatHistory);

export default router;

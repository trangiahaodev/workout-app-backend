import express from "express";
import {
  getLogsBySession,
  saveLog,
  getLogsByExercise,
} from "../controllers/logController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workout Logs
 *   description: API Quản lý nhật ký tập luyện (Reps, Sets, Weight)
 */

/**
 * @swagger
 * /api/v1/logs/session/{sessionId}:
 *   get:
 *     summary: Lấy nhật ký tập luyện của một buổi tập
 *     tags: [Workout Logs]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của Workout Session
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/session/:sessionId", getLogsBySession);

/**
 * @swagger
 * /api/v1/logs:
 *   post:
 *     summary: Ghi nhận hoặc cập nhật nhật ký buổi tập
 *     tags: [Workout Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               exerciseId:
 *                 type: string
 *               sets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     reps:
 *                       type: number
 *                     weight:
 *                       type: number
 *                     isCompleted:
 *                       type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ghi nhận thành công
 */
router.post("/", saveLog);

/**
 * @swagger
 * /api/v1/logs/exercise/{exerciseId}:
 *   get:
 *     summary: Lấy lịch sử tập luyện của một bài tập cụ thể
 *     tags: [Workout Logs]
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của Exercise (24-hex ObjectId)
 *     responses:
 *       200:
 *         description: Danh sách các bản ghi nhật ký của bài tập được sắp xếp mới nhất trước
 *       500:
 *         description: Lỗi server
 */
router.get("/exercise/:exerciseId", getLogsByExercise);

export default router;

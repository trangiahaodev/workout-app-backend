import express from "express";
import {
  getSessionsByPlan,
  createSession,
} from "../controllers/sessionController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workout Sessions
 *   description: API Quản lý buổi tập trong kế hoạch
 */

/**
 * @swagger
 * /api/v1/sessions/plan/{planId}:
 *   get:
 *     summary: Lấy danh sách buổi tập theo Plan ID
 *     tags: [Workout Sessions]
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của Workout Plan
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/plan/:planId", getSessionsByPlan);

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Tạo buổi tập mới
 *     tags: [Workout Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               name:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/", createSession);

export default router;

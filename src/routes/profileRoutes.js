import express from "express";
import { getProfile, upsertProfile } from "../controllers/profileController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: API Quản lý hồ sơ người dùng
 */

/**
 * @swagger
 * /api/v1/profiles/{userId}:
 *   get:
 *     summary: Lấy thông tin profile bằng userId
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của user (từ hệ thống Auth)
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Chưa có profile
 */
router.get("/:userId", getProfile);

/**
 * @swagger
 * /api/v1/profiles:
 *   post:
 *     summary: Tạo mới hoặc cập nhật profile (Upsert)
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               goal:
 *                 type: string
 *                 enum: [Tăng cơ, Giảm mỡ, Sức mạnh, Bảo trì]
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *               trainingDaysPerWeek:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật hoặc tạo thành công
 */
router.post("/", upsertProfile);
router.put("/", upsertProfile);

export default router;

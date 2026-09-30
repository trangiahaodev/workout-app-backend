import express from "express";
import {
  getExercises,
  getExerciseById,
  createExercise,
} from "../controllers/exerciseController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Exercises
 *   description: API Quản lý từ điển bài tập
 */

/**
 * @swagger
 * /api/v1/exercises:
 *   get:
 *     summary: Lấy danh sách tất cả bài tập
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Trả về danh sách bài tập thành công
 */
router.get("/", getExercises);

/**
 * @swagger
 * /api/v1/exercises:
 *   post:
 *     summary: Tạo một bài tập mới
 *     tags: [Exercises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               muscleGroup:
 *                 type: string
 *               equipmentRequired:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo bài tập thành công
 */
router.post("/", createExercise);

/**
 * @swagger
 * /api/v1/exercises/{id}:
 *   get:
 *     summary: Lấy chi tiết một bài tập theo ID
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của bài tập
 *     responses:
 *       200:
 *         description: Trả về chi tiết bài tập
 *       404:
 *         description: Không tìm thấy bài tập
 */
router.get("/:id", getExerciseById);

export default router;

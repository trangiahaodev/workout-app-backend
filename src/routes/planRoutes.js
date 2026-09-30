import express from "express";
import {
  getPlansByProfile,
  createPlan,
  updatePlanStatus,
} from "../controllers/planController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workout Plans
 *   description: API Quản lý kế hoạch tập luyện
 */

/**
 * @swagger
 * /api/v1/plans/profile/{profileId}:
 *   get:
 *     summary: Lấy danh sách kế hoạch tập theo Profile ID
 *     tags: [Workout Plans]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của Profile
 *     responses:
 *       200:
 *         description: Trả về danh sách kế hoạch
 */
router.get("/profile/:profileId", getPlansByProfile);

/**
 * @swagger
 * /api/v1/plans:
 *   post:
 *     summary: Tạo kế hoạch tập luyện mới
 *     tags: [Workout Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileId:
 *                 type: string
 *               name:
 *                 type: string
 *               generatedByAI:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/", createPlan);

/**
 * @swagger
 * /api/v1/plans/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái kế hoạch
 *     tags: [Workout Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của Plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, completed, abandoned]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id/status", updatePlanStatus);

export default router;

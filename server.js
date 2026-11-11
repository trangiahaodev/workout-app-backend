import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import connectDB from "./src/config/db.js";
import exerciseRoutes from "./src/routes/exerciseRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import planRoutes from "./src/routes/planRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
import logRoutes from "./src/routes/logRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Personal Workout Log API",
      version: "1.0.0",
      description: "API Contract cho Bài tập nhóm Lập trình Mobile (Nhóm 14)",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
      {
        url: `${process.env.RENDER_URI}`,
        description: "Production Server",
      },
    ],
  },
  apis: ["./server.js", "./src/routes/*.js"],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy ở: http://localhost:${PORT}`);
  console.log(`Xem API Docs tại: http://localhost:${PORT}/api-docs`);
});

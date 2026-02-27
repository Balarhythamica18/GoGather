import express from "express";
import { unifiedChat } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, unifiedChat);


export default router;
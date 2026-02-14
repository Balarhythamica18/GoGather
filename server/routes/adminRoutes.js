import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin 👑" });
  }
);

export default router;

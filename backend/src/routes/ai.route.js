import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  rewriteMessage,
  suggestReplies,
  summarizeConversation,
  translateMessage,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/rewrite", rewriteMessage);
router.post("/suggest-replies", suggestReplies);
router.post("/summarize", summarizeConversation);
router.post("/translate", translateMessage);

export default router;

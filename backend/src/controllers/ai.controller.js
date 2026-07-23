import {
  generateAssistantMessage,
  generateConversationSummary,
  generateSmartReplies,
  generateTranslation,
} from "../services/ai.service.js";

function handleAiError(error, res) {
  console.error("AI controller error:", error.message);

  if (
    error.message === "Message text is required" ||
    error.message === "Conversation is empty" ||
    error.message === "Unsupported assistant option" ||
    error.message === "Unsupported translation language"
  ) {
    return res.status(400).json({ message: error.message });
  }

  if (error.message === "Gemini API key is not configured") {
    return res.status(500).json({ message: "AI service is not configured" });
  }

  if (
    error.message.includes("API key not valid") ||
    error.message.includes("API_KEY_INVALID") ||
    error.message.includes("permission denied") ||
    error.message.includes("PERMISSION_DENIED")
  ) {
    return res.status(502).json({ message: "Gemini API key is invalid or not authorized" });
  }

  if (error.name === "AbortError") {
    return res.status(504).json({ message: "AI request timed out" });
  }

  return res.status(502).json({ message: "AI request failed" });
}

export async function rewriteMessage(req, res) {
  try {
    const rewrittenText = await generateAssistantMessage({
      text: req.body?.text,
      tone: req.body?.tone,
    });

    res.status(200).json({ text: rewrittenText });
  } catch (error) {
    handleAiError(error, res);
  }
}

export async function suggestReplies(req, res) {
  try {
    const suggestions = await generateSmartReplies(req.body?.messages);
    res.status(200).json({ suggestions });
  } catch (error) {
    handleAiError(error, res);
  }
}

export async function summarizeConversation(req, res) {
  try {
    const summary = await generateConversationSummary(req.body?.messages);
    res.status(200).json({ summary });
  } catch (error) {
    handleAiError(error, res);
  }
}

export async function translateMessage(req, res) {
  try {
    const translatedText = await generateTranslation({
      text: req.body?.text,
      language: req.body?.language,
    });

    res.status(200).json({ text: translatedText });
  } catch (error) {
    handleAiError(error, res);
  }
}

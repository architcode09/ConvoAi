function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
}

const AI_TIMEOUT_MS = 20000;
const SUPPORTED_TONES = new Set([
  "improve",
  "professional",
  "friendly",
  "formal",
  "casual",
  "grammar",
  "shorter",
  "longer",
]);

const TRANSLATION_LANGUAGES = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  return apiKey;
}

function normalizeText(text) {
  return typeof text === "string" ? text.trim() : "";
}

function sanitizeConversation(messages = []) {
  return messages
    .map((message) => ({
      role: message?.role === "me" ? "me" : "them",
      text: normalizeText(message?.text),
    }))
    .filter((message) => message.text);
}

async function callGemini({ systemInstruction, prompt, temperature = 0.7, maxOutputTokens = 256 }) {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "text/plain",
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
        signal: controller.signal,
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || "Gemini request failed";
      throw new Error(message);
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export function assertSupportedTone(tone) {
  if (!SUPPORTED_TONES.has(tone)) {
    throw new Error("Unsupported assistant option");
  }
}

export function assertSupportedLanguage(language) {
  if (!TRANSLATION_LANGUAGES[language]) {
    throw new Error("Unsupported translation language");
  }
}

export async function generateAssistantMessage({ text, tone }) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    throw new Error("Message text is required");
  }

  assertSupportedTone(tone);

  const instructions = {
    improve: "Improve the writing while preserving the original intent and approximate length.",
    professional: "Rewrite it to sound polished and professional.",
    friendly: "Rewrite it to sound warm and friendly.",
    formal: "Rewrite it to sound formal and respectful.",
    casual: "Rewrite it to sound natural and casual.",
    grammar: "Fix spelling, grammar, and punctuation while keeping the meaning unchanged.",
    shorter: "Rewrite it to be shorter and more concise while preserving the intent.",
    longer: "Rewrite it to be longer with a little more detail while preserving the intent.",
  };

  return callGemini({
    systemInstruction:
      "You help users rewrite chat messages. Return only the rewritten message text with no quotation marks, labels, or explanation.",
    prompt: `Task: ${instructions[tone]}\n\nOriginal message:\n${normalizedText}`,
    temperature: 0.5,
    maxOutputTokens: 256,
  });
}

export async function generateSmartReplies(messages) {
  const conversation = sanitizeConversation(messages);
  if (!conversation.length) {
    return [];
  }

  const response = await callGemini({
    systemInstruction:
      "You generate concise suggested chat replies. Return exactly 3 options, each on its own line, with no numbering, no bullets, and no extra commentary. Each reply must be under 12 words.",
    prompt: `Conversation:\n${conversation
      .map((message) => `${message.role === "me" ? "Me" : "Them"}: ${message.text}`)
      .join("\n")}\n\nGenerate 3 short reply suggestions for my next response.`,
    temperature: 0.8,
    maxOutputTokens: 128,
  });

  return response
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function generateConversationSummary(messages) {
  const conversation = sanitizeConversation(messages);
  if (!conversation.length) {
    throw new Error("Conversation is empty");
  }

  const response = await callGemini({
    systemInstruction:
      "Summarize the chat into concise bullet points. Return plain text with one bullet per line starting with '- '. Focus on the important discussion points, decisions, and follow-ups.",
    prompt: `Conversation:\n${conversation
      .map((message) => `${message.role === "me" ? "Me" : "Them"}: ${message.text}`)
      .join("\n")}`,
    temperature: 0.4,
    maxOutputTokens: 256,
  });

  return response
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("- ") ? line : `- ${line.replace(/^[-*\d.\s]+/, "")}`));
}

export async function generateTranslation({ text, language }) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    throw new Error("Message text is required");
  }

  assertSupportedLanguage(language);

  return callGemini({
    systemInstruction:
      "You translate chat messages accurately. Return only the translated text with no labels, notes, or quotation marks.",
    prompt: `Translate the following message to ${TRANSLATION_LANGUAGES[language]}.\n\nMessage:\n${normalizedText}`,
    temperature: 0.2,
    maxOutputTokens: 256,
  });
}

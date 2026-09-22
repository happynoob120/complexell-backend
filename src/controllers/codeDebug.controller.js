const supportedLanguages = new Set(["javascript", "python", "cpp", "java"]);

const diagnoseCode = async (req, res) => {
  const { code, language = "javascript", apiKey } = req.body || {};

  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      message: "Add your Gemini API key to use the debugger.",
    });
  }

  if (!supportedLanguages.has(language)) {
    return res.status(400).json({ success: false, message: "Unsupported programming language." });
  }

  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ success: false, message: "Code is required." });
  }

  if (code.length > 30000) {
    return res.status(413).json({ success: false, message: "Code must be 30,000 characters or fewer." });
  }

  const models = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash-lite",
  ].filter((model, index, availableModels) => availableModels.indexOf(model) === index);
  const prompt = `You are a careful ${language} debugging assistant. Analyze the code below. Do not execute it and do not invent APIs. Return only valid JSON with this exact shape:
{
  "summary": "short explanation of the main problem or say that no issue was found",
  "issues": [{ "title": "issue name", "detail": "plain-English explanation" }],
  "fixedCode": "complete corrected code, or the original code if no correction is needed",
  "confidence": "high | medium | low"
}
Prioritize syntax errors, runtime errors, incorrect conditions, missing declarations, and obvious logic mistakes. Keep the user's style where possible. The fixedCode must be complete and directly runnable for the selected language.

Language: ${language}

Code:\n${code}`;

  try {
    let response;
    let payload;

    for (const model of models) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      payload = await response.json();
      if (response.ok) break;

      const shouldTryFallback = response.status === 429 || response.status === 503;
      const upstreamMessage = payload.error?.message || "Unknown Gemini error.";
      console.error(`Gemini model ${model} failed:`, response.status, upstreamMessage);

      if (!shouldTryFallback || model === models[models.length - 1]) {
        return res.status(502).json({
          success: false,
          message: `Gemini request failed (${response.status}): ${upstreamMessage}`,
        });
      }
    }

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ success: false, message: "Gemini returned an empty diagnosis." });
    }

    let diagnosis;
    try {
      diagnosis = JSON.parse(text);
    } catch {
      return res.status(502).json({ success: false, message: "Gemini returned an invalid diagnosis format." });
    }

    return res.status(200).json({
      success: true,
      diagnosis: {
        summary: String(diagnosis.summary || "No summary returned."),
        issues: Array.isArray(diagnosis.issues) ? diagnosis.issues : [],
        fixedCode: typeof diagnosis.fixedCode === "string" ? diagnosis.fixedCode : code,
        confidence: String(diagnosis.confidence || "medium"),
      },
    });
  } catch (error) {
    console.error("Gemini diagnosis request failed:", error);
    return res.status(502).json({
      success: false,
      message: "Could not connect to Gemini. Check your internet connection and restart the backend.",
    });
  }
};

module.exports = { diagnoseCode };

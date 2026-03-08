import type { MaskedTransaction } from "./masker";

/**
 * AI Service — communicates with Google Gemini API using ONLY masked/aggregated data.
 *
 * Privacy guarantees:
 * 1. Categorization: sends masked descriptions only (PII stripped)
 * 2. Coaching: sends aggregated category totals only (no transactions)
 * 3. API key is stored in memory only — never persisted
 */

interface AICategorizeResult {
  categories: Record<number, string>; // index -> category name
}

interface AICoachingResult {
  suggestions: string[];
  summary: string;
}

const CATEGORY_LIST = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Subscriptions",
  "Housing",
  "Health",
  "Entertainment",
  "Education",
  "Transfer",
  "Income",
  "Insurance",
  "Personal Care",
  "Pets",
  "Other",
];

/**
 * Batch-categorize transactions using AI.
 * Sends ONLY masked descriptions + amounts — no PII.
 */
export async function aiCategorize(
  apiKey: string,
  transactions: MaskedTransaction[]
): Promise<AICategorizeResult> {
  // Build a compact list for the prompt — just index, masked desc, amount
  const lines = transactions.map(
    (t, i) => `${i}|${t.maskedDescription}|${t.amount}`
  );

  // Process in batches of 50 to stay within token limits
  const BATCH_SIZE = 50;
  const allCategories: Record<number, string> = {};

  for (let start = 0; start < lines.length; start += BATCH_SIZE) {
    const batch = lines.slice(start, start + BATCH_SIZE);
    const batchStart = start;

    const prompt = `You are a financial transaction categorizer. Categorize each transaction into exactly one of these categories:
${CATEGORY_LIST.join(", ")}

Transactions (format: index|description|amount):
${batch.join("\n")}

Respond with ONLY a JSON object mapping index numbers to category names. Example:
{"0":"Food & Dining","1":"Transport","2":"Shopping"}

Rules:
- Positive amounts are likely income unless clearly a refund
- Negative amounts are expenses
- If description contains [MASKED] placeholders, use surrounding context and amount to infer
- If unsure, use "Other"`;

    const response = await callGemini(apiKey, prompt, 0.1);
    const parsed = safeParseJSON(response);

    for (const [idx, cat] of Object.entries(parsed)) {
      const globalIdx = batchStart + parseInt(idx);
      if (CATEGORY_LIST.includes(cat as string)) {
        allCategories[globalIdx] = cat as string;
      }
    }
  }

  return { categories: allCategories };
}

/**
 * Get AI coaching suggestions from AGGREGATED summary stats only.
 * No individual transactions or descriptions are sent.
 */
export async function aiCoach(
  apiKey: string,
  safeSummary: string
): Promise<AICoachingResult> {
  const prompt = `You are a friendly personal finance coach. Based on this spending summary (all personal details have been removed), give practical suggestions to help reduce expenses.

${safeSummary}

Respond with a JSON object:
{
  "summary": "A 2-3 sentence overall assessment of spending health",
  "suggestions": [
    "Specific actionable tip 1",
    "Specific actionable tip 2",
    ...up to 6 tips
  ]
}

Rules:
- Be specific: reference actual category amounts and percentages
- Be encouraging, not judgmental
- Focus on the top 3 spending categories
- Mention recurring charges if they seem high
- Note positive trends too (if income > expenses, etc.)
- Keep each suggestion under 2 sentences
- This is light coaching — NOT financial advice`;

  const response = await callGemini(apiKey, prompt, 0.7);
  const parsed = safeParseJSON(response);

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as string[]) : [],
  };
}

/** Call Google Gemini API */
async function callGemini(
  apiKey: string,
  prompt: string,
  temperature: number
): Promise<string> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    if (resp.status === 400 || resp.status === 403) {
      throw new Error("Invalid API key. Please check your Gemini API key.");
    }
    throw new Error(`Gemini API error (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  // Gemini may return multiple parts (e.g. thinking + text) — find the text part
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const textPart = parts.find((p: { text?: string }) => p.text !== undefined);
  return textPart?.text ?? "";
}

/** Extract JSON from a response that might have markdown fences or extra text */
function extractJSON(text: string): string {
  // Strip all markdown code fences
  const cleaned = text.replace(/```(?:json|JSON)?\s*/g, "").replace(/```/g, "");

  // Find the first { ... } block
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();

  return cleaned.trim();
}

/** Safely parse JSON with repair for common Gemini issues */
function safeParseJSON(text: string): Record<string, unknown> {
  const raw = extractJSON(text);
  try {
    return JSON.parse(raw);
  } catch {
    // Try to repair: fix unescaped newlines inside strings
    const repaired = raw.replace(/(["'])([^"']*?)\n([^"']*?)\1/g, (_, q, a, b) => `${q}${a} ${b}${q}`);
    try {
      return JSON.parse(repaired);
    } catch {
      // Last resort: try to extract simple key-value pairs for categorize response
      const pairs: Record<string, string> = {};
      const re = /"(\d+)"\s*:\s*"([^"]+)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw)) !== null) {
        pairs[m[1]] = m[2];
      }
      if (Object.keys(pairs).length > 0) return pairs;
      throw new Error("Could not parse AI response. Please try again.");
    }
  }
}

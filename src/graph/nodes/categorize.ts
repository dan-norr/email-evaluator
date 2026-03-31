import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { EmailEvaluatorState, EmailCategory } from "../state";
import { CATEGORIZE_SYSTEM, buildCategorizeUserPrompt } from "../../prompts/categorize";

const VALID_CATEGORIES: EmailCategory[] = ["spam", "news", "offer", "routine", "request"];

export async function categorize(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL ?? "gpt-4.1-nano",
    temperature: 0,
    maxTokens: 256,
  });

  const { from, subject, body } = state.email_raw;
  const userPrompt = buildCategorizeUserPrompt(subject, from, body);

  const response = await llm.invoke([
    new SystemMessage(CATEGORIZE_SYSTEM),
    new HumanMessage(userPrompt),
  ]);

  const content = typeof response.content === "string" ? response.content : "";

  let parsed: { category: EmailCategory; confidence: number; reasoning: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[categorize] Invalid JSON response:", content);
    return {
      category: "routine",
      category_confidence: 0.5,
      category_reasoning: "Parse error — defaulting to routine",
    };
  }

  if (!VALID_CATEGORIES.includes(parsed.category)) {
    parsed.category = "routine";
  }

  return {
    category: parsed.category,
    category_confidence: parsed.confidence ?? 0.5,
    category_reasoning: parsed.reasoning ?? "",
  };
}

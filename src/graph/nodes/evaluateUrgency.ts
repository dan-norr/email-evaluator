import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { EmailEvaluatorState, UrgencyLevel, UrgencyTag } from "../state";
import { URGENCY_SYSTEM, buildUrgencyUserPrompt } from "../../prompts/urgency";

const VALID_LEVELS: UrgencyLevel[] = ["low", "medium", "high", "critical"];

export async function evaluateUrgency(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL ?? "gpt-4.1-nano",
    temperature: 0,
    maxTokens: 256,
  });

  const { from, subject, body } = state.email_raw;
  const userPrompt = buildUrgencyUserPrompt(
    subject,
    from,
    body,
    state.category ?? "routine",
    state.sender_is_vip
  );

  const response = await llm.invoke([
    new SystemMessage(URGENCY_SYSTEM),
    new HumanMessage(userPrompt),
  ]);

  const content = typeof response.content === "string" ? response.content : "";

  let parsed: {
    urgency_level: UrgencyLevel;
    urgency_score: number;
    urgency_reason: string;
    urgency_tags: UrgencyTag[];
  };

  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[evaluateUrgency] Invalid JSON response:", content);
    return {
      urgency_level: "low",
      urgency_score: 1,
      urgency_reason: "Parse error — defaulting to low",
      urgency_tags: [],
    };
  }

  if (!VALID_LEVELS.includes(parsed.urgency_level)) {
    parsed.urgency_level = "low";
  }

  // Bump urgency if sender is VIP and score is below 7
  if (state.sender_is_vip && parsed.urgency_score < 7) {
    parsed.urgency_score = Math.min(10, parsed.urgency_score + 2);
    if (parsed.urgency_score >= 7) parsed.urgency_level = "high";
  }

  return {
    urgency_level: parsed.urgency_level,
    urgency_score: parsed.urgency_score ?? 0,
    urgency_reason: parsed.urgency_reason ?? "",
    urgency_tags: parsed.urgency_tags ?? [],
  };
}

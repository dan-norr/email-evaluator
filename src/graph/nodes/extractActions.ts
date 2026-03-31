import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { EmailEvaluatorState, ActionItem } from "../state";
import { ACTIONS_SYSTEM, buildActionsUserPrompt } from "../../prompts/actions";

export async function extractActions(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL ?? "gpt-4.1-nano",
    temperature: 0,
    maxTokens: 512,
  });

  const { from, subject, body } = state.email_raw;
  const userPrompt = buildActionsUserPrompt(subject, from, body);

  const response = await llm.invoke([
    new SystemMessage(ACTIONS_SYSTEM),
    new HumanMessage(userPrompt),
  ]);

  const content = typeof response.content === "string" ? response.content : "";

  let parsed: { action_items: ActionItem[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[extractActions] Invalid JSON response:", content);
    return { action_items: [] };
  }

  return { action_items: parsed.action_items ?? [] };
}

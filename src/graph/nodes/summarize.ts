import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { EmailEvaluatorState } from "../state";
import { SUMMARY_SYSTEM, buildSummaryUserPrompt } from "../../prompts/summary";

export async function summarize(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL ?? "gpt-4.1-nano",
    temperature: 0.2,
    maxTokens: 512,
  });

  const { from, subject, body } = state.email_raw;
  const userPrompt = buildSummaryUserPrompt(subject, from, body);

  const response = await llm.invoke([
    new SystemMessage(SUMMARY_SYSTEM),
    new HumanMessage(userPrompt),
  ]);

  const content = typeof response.content === "string" ? response.content : "";
  return { summary: content.trim() };
}

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { EmailEvaluatorState } from "../state";
import { REPLY_SYSTEM, buildReplyUserPrompt } from "../../prompts/reply";

export async function draftReply(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL ?? "gpt-4.1-nano",
    temperature: 0.3,
    maxTokens: 1024,
  });

  const { from, subject, body } = state.email_raw;
  const userPrompt = buildReplyUserPrompt(subject, from, body, state.action_items);

  const response = await llm.invoke([
    new SystemMessage(REPLY_SYSTEM),
    new HumanMessage(userPrompt),
  ]);

  const content = typeof response.content === "string" ? response.content : "";
  return { draft_reply: content.trim() };
}

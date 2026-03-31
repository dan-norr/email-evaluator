import { describe, it, expect, vi, beforeEach } from "vitest";
import { SAMPLES } from "../../fixtures/email_samples";
import type { EmailEvaluatorState } from "../state";

// ─── Mock the LLM to avoid real API calls in unit tests ───────────────────────
vi.mock("@langchain/anthropic", () => ({
  ChatAnthropic: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        category: "spam",
        confidence: 0.99,
        reasoning: "Mocked response",
      }),
    }),
  })),
}));

describe("categorize node — contract tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns required OUTPUT fields (category, confidence, reasoning)", async () => {
    const { categorize } = await import("./categorize.js");

    const state: Partial<EmailEvaluatorState> = {
      email_raw: SAMPLES.spam,
      sender_is_vip: false,
    };

    const result = await categorize(state as EmailEvaluatorState);

    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("category_confidence");
    expect(result).toHaveProperty("category_reasoning");
    expect(typeof result.category).toBe("string");
    expect(typeof result.category_confidence).toBe("number");
  });

  it("defaults to 'routine' on invalid LLM response", async () => {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    (ChatAnthropic as any).mockImplementation(() => ({
      invoke: vi.fn().mockResolvedValue({ content: "INVALID JSON {{{" }),
    }));

    const { categorize } = await import("./categorize.js");
    const state: Partial<EmailEvaluatorState> = { email_raw: SAMPLES.spam };
    const result = await categorize(state as EmailEvaluatorState);

    expect(result.category).toBe("routine");
    expect(result.category_confidence).toBe(0.5);
  });
});

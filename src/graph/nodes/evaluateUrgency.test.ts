import { describe, it, expect, vi, beforeEach } from "vitest";
import { SAMPLES } from "../../fixtures/email_samples";
import type { EmailEvaluatorState } from "../state";

vi.mock("@langchain/anthropic", () => ({
  ChatAnthropic: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        urgency_level: "high",
        urgency_score: 8,
        urgency_reason: "Prazo imediato e ameaça de perder contrato.",
        urgency_tags: ["deadline", "client", "threat"],
      }),
    }),
  })),
}));

describe("evaluateUrgency node — contract tests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns required OUTPUT fields", async () => {
    const { evaluateUrgency } = await import("./evaluateUrgency.js");

    const state: Partial<EmailEvaluatorState> = {
      email_raw: SAMPLES.request_urgent,
      category: "request",
      sender_is_vip: false,
    };

    const result = await evaluateUrgency(state as EmailEvaluatorState);

    expect(result).toHaveProperty("urgency_level");
    expect(result).toHaveProperty("urgency_score");
    expect(result).toHaveProperty("urgency_reason");
    expect(result).toHaveProperty("urgency_tags");
    expect(Array.isArray(result.urgency_tags)).toBe(true);
  });

  it("bumps score by +2 if sender is VIP and score < 7", async () => {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    (ChatAnthropic as any).mockImplementation(() => ({
      invoke: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          urgency_level: "medium",
          urgency_score: 5,
          urgency_reason: "Email de rotina.",
          urgency_tags: [],
        }),
      }),
    }));

    const { evaluateUrgency } = await import("./evaluateUrgency.js");

    const state: Partial<EmailEvaluatorState> = {
      email_raw: SAMPLES.routine,
      category: "routine",
      sender_is_vip: true,
    };

    const result = await evaluateUrgency(state as EmailEvaluatorState);
    expect(result.urgency_score).toBe(7);
    expect(result.urgency_level).toBe("high");
  });

  it("defaults to low on invalid JSON", async () => {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    (ChatAnthropic as any).mockImplementation(() => ({
      invoke: vi.fn().mockResolvedValue({ content: "not json" }),
    }));

    const { evaluateUrgency } = await import("./evaluateUrgency.js");
    const state: Partial<EmailEvaluatorState> = {
      email_raw: SAMPLES.spam,
      sender_is_vip: false,
    };

    const result = await evaluateUrgency(state as EmailEvaluatorState);
    expect(result.urgency_level).toBe("low");
    expect(result.urgency_score).toBe(1);
  });
});

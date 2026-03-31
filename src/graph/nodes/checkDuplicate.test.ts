import { describe, it, expect, vi } from "vitest";
import { SAMPLES } from "../../fixtures/email_samples";
import type { EmailEvaluatorState } from "../state";

vi.mock("../../tools/supabase.js", () => ({
  isMessageProcessed: vi.fn(),
}));

describe("checkDuplicate node — contract tests", () => {
  it("returns is_duplicate: true when message already processed", async () => {
    const { isMessageProcessed } = await import("../../tools/supabase.js");
    (isMessageProcessed as any).mockResolvedValue(true);

    const { checkDuplicate } = await import("./checkDuplicate.js");
    const state: Partial<EmailEvaluatorState> = { email_raw: SAMPLES.spam };
    const result = await checkDuplicate(state as EmailEvaluatorState);

    expect(result.is_duplicate).toBe(true);
  });

  it("returns is_duplicate: false when message is new", async () => {
    const { isMessageProcessed } = await import("../../tools/supabase.js");
    (isMessageProcessed as any).mockResolvedValue(false);

    const { checkDuplicate } = await import("./checkDuplicate.js");
    const state: Partial<EmailEvaluatorState> = { email_raw: SAMPLES.news };
    const result = await checkDuplicate(state as EmailEvaluatorState);

    expect(result.is_duplicate).toBe(false);
  });

  it("returns is_duplicate: false on DB error (fail-safe)", async () => {
    const { isMessageProcessed } = await import("../../tools/supabase.js");
    (isMessageProcessed as any).mockRejectedValue(new Error("DB connection failed"));

    const { checkDuplicate } = await import("./checkDuplicate.js");
    const state: Partial<EmailEvaluatorState> = { email_raw: SAMPLES.routine };
    const result = await checkDuplicate(state as EmailEvaluatorState);

    expect(result.is_duplicate).toBe(false);
  });
});

import { EmailEvaluatorState } from "../state";
import { isMessageProcessed } from "../../tools/supabase";

export async function checkDuplicate(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const { message_id } = state.email_raw;

  try {
    const duplicate = await isMessageProcessed(message_id);
    return { is_duplicate: duplicate };
  } catch (err) {
    // On DB error, treat as not duplicate — safer to reprocess than skip
    console.warn("[checkDuplicate] DB check failed, assuming not duplicate:", err);
    return { is_duplicate: false };
  }
}

import { EmailEvaluatorState, EmailCategory } from "../state";
import { storeEmail as dbStoreEmail } from "../../tools/supabase";

export async function storeEmail(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const category = state.category as EmailCategory;

  const table = await dbStoreEmail(
    state.email_raw,
    category,
    state.urgency_level ?? "low",
    state.urgency_score,
    state.urgency_tags,
    state.action_items,
    state.summary,
    state.draft_reply
  );

  return { stored_table: table };
}

import { EmailEvaluatorState } from "../state";
import { isVipSender } from "../../tools/supabase";

export async function checkSenderReputation(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  try {
    const vip = await isVipSender(state.email_raw.from);
    return { sender_is_vip: vip };
  } catch (err) {
    console.warn("[checkSenderReputation] Failed to check VIP status:", err);
    return { sender_is_vip: false };
  }
}

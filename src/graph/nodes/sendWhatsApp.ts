import { EmailEvaluatorState } from "../state";
import { sendWhatsAppMessage, buildNotificationMessage } from "../../tools/whatsapp";
import { logNotification } from "../../tools/supabase";
import { EmailCategory } from "../state";

export async function sendWhatsApp(
  state: EmailEvaluatorState
): Promise<Partial<EmailEvaluatorState>> {
  const text = buildNotificationMessage({
    subject: state.email_raw.subject,
    from: state.email_raw.from,
    urgency_level: state.urgency_level ?? "high",
    urgency_score: state.urgency_score,
    urgency_tags: state.urgency_tags,
    urgency_reason: state.urgency_reason,
    summary: state.summary ?? "(sem resumo)",
    draft_reply: state.draft_reply,
    action_items: state.action_items,
  });

  await sendWhatsAppMessage(text);

  await logNotification(
    state.email_raw.message_id,
    state.category as EmailCategory,
    state.urgency_level ?? "high",
    state.urgency_score
  );

  return { notification_sent: true };
}

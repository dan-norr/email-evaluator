import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { EmailCategory, RawEmail, ActionItem, UrgencyLevel, UrgencyTag } from "../graph/state";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
    _client = createClient(url, key);
  }
  return _client;
}

export const TABLE_MAP: Record<EmailCategory, string> = {
  spam: "emails_spam",
  news: "emails_news",
  offer: "emails_offers",
  routine: "emails_routine",
  request: "emails_requests",
};

export async function isMessageProcessed(messageId: string): Promise<boolean> {
  if (process.env.DRY_RUN === "true") return false;
  const sb = getSupabase();
  // Check across all tables via a single auxiliary log table
  const { data } = await sb
    .from("email_notifications")
    .select("id")
    .eq("message_id", messageId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function isVipSender(emailAddress: string): Promise<boolean> {
  if (process.env.DRY_RUN === "true") return false;
  const sb = getSupabase();
  const cleanEmail = emailAddress.match(/<(.+)>/)?.[1] ?? emailAddress;
  const { data } = await sb
    .from("email_senders")
    .select("is_vip")
    .eq("email", cleanEmail)
    .limit(1)
    .single();
  return data?.is_vip === true;
}

export async function storeEmail(
  email: RawEmail,
  category: EmailCategory,
  urgency_level: UrgencyLevel,
  urgency_score: number,
  urgency_tags: UrgencyTag[],
  action_items: ActionItem[],
  summary: string | undefined,
  draft_reply: string | undefined
): Promise<string> {
  const table = TABLE_MAP[category];
  if (process.env.DRY_RUN === "true") {
    console.log(`  [DRY_RUN] storeEmail → tabela: ${table}`);
    return table;
  }
  const sb = getSupabase();

  const payload: Record<string, unknown> = {
    message_id: email.message_id,
    thread_id: email.thread_id,
    from_address: email.from,
    to_address: email.to,
    subject: email.subject,
    body: email.body,
    email_date: email.date,
    has_attachments: email.has_attachments,
    urgency_level,
    urgency_score,
    urgency_tags,
    processed_at: new Date().toISOString(),
  };

  if (category === "request") {
    payload["action_items"] = action_items;
    payload["summary"] = summary;
    payload["draft_reply"] = draft_reply;
  }

  const { error } = await sb.from(table).insert(payload);
  if (error) throw new Error(`Supabase insert error (${table}): ${error.message}`);

  return table;
}

export async function logNotification(
  messageId: string,
  category: EmailCategory,
  urgencyLevel: UrgencyLevel,
  urgencyScore: number
): Promise<void> {
  if (process.env.DRY_RUN === "true") return;
  const sb = getSupabase();
  const { error } = await sb.from("email_notifications").insert({
    message_id: messageId,
    category,
    urgency_level: urgencyLevel,
    urgency_score: urgencyScore,
    whatsapp_sent_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Notification log error: ${error.message}`);
}

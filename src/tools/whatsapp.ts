import axios from "axios";

interface SendMessagePayload {
  number: string;
  text: string;
}

export async function sendWhatsAppMessage(text: string): Promise<void> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE ?? "default";
  const number = process.env.WHATSAPP_NOTIFY_NUMBER;

  if (process.env.DRY_RUN === "true") {
    console.log("\n  [DRY_RUN] sendWhatsApp → mensagem que seria enviada:\n");
    console.log("  " + "─".repeat(56));
    text.split("\n").forEach((l) => console.log(`  ${l}`));
    console.log("  " + "─".repeat(56));
    return;
  }

  if (!baseUrl || !apiKey || !number) {
    throw new Error(
      "Missing WhatsApp config: EVOLUTION_API_URL, EVOLUTION_API_KEY, WHATSAPP_NOTIFY_NUMBER"
    );
  }

  const payload: SendMessagePayload = { number, text };

  await axios.post(
    `${baseUrl}/message/sendText/${instance}`,
    payload,
    {
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    }
  );
}

export function buildNotificationMessage(params: {
  subject: string;
  from: string;
  urgency_level: string;
  urgency_score: number;
  urgency_tags: string[];
  urgency_reason: string;
  summary: string;
  draft_reply?: string;
  action_items?: Array<{ task: string; deadline?: string }>;
}): string {
  const tag = params.urgency_level === "critical" ? "🚨 CRÍTICO" : "⚠️ URGENTE";
  const lines: string[] = [
    `${tag} — Score ${params.urgency_score}/10`,
    `📧 *${params.subject}*`,
    `De: ${params.from}`,
    `Tags: ${params.urgency_tags.join(", ")}`,
    ``,
    `📝 *Resumo:*`,
    params.summary,
  ];

  if (params.action_items && params.action_items.length > 0) {
    lines.push(``, `✅ *Itens de ação:`);
    for (const item of params.action_items) {
      const deadline = item.deadline ? ` (até ${item.deadline})` : "";
      lines.push(`• ${item.task}${deadline}`);
    }
  }

  if (params.draft_reply) {
    lines.push(``, `💬 *Rascunho de resposta:*`, params.draft_reply);
  }

  lines.push(``, `_Motivo da urgência: ${params.urgency_reason}_`);

  return lines.join("\n");
}

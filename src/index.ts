import "dotenv/config";
import cron from "node-cron";
import { buildEmailEvaluatorGraph } from "./graph/graph";
import { GmailProvider } from "./providers/gmail";
import { getImapProviders } from "./providers/imap";
import { EmailProvider } from "./providers/types";

function getProviders(): EmailProvider[] {
  if (process.env.EMAIL_PROVIDER === "gmail") return [new GmailProvider()];
  return getImapProviders();
}

async function processAccount(provider: EmailProvider, account: string): Promise<void> {
  const graph = buildEmailEvaluatorGraph();

  let emails;
  try {
    emails = await provider.fetchUnread();
  } catch (err) {
    console.error(`[${account}] Falha ao buscar emails:`, err);
    return;
  }

  console.log(`[${account}] ${emails.length} email(s) não lido(s).`);

  for (const email of emails) {
    console.log(`[${account}] Processando: "${email.subject}"`);
    try {
      const result = await graph.invoke({
        email_raw: email,
        provider: "imap",
      });

      console.log(
        `[${account}] ✓ categoria: ${result.category} | ` +
        `urgência: ${result.urgency_level} (${result.urgency_score}/10) | ` +
        `tabela: ${result.stored_table} | ` +
        `notificado: ${result.notification_sent}`
      );

      if (!result.is_duplicate) {
        await provider.markProcessed(email.message_id);
      }
    } catch (err) {
      console.error(`[${account}] Erro em "${email.subject}":`, err);
    }
  }
}

async function runCycle(): Promise<void> {
  console.log(`\n[${new Date().toISOString()}] Iniciando ciclo...`);
  const providers = getProviders();

  await Promise.all(
    providers.map((p) => {
      const account = (p as any).account ?? "gmail";
      return processAccount(p, account);
    })
  );

  console.log(`[ciclo] Concluído.`);
}

const cronExpression = process.env.POLL_CRON ?? "*/5 * * * *";
cron.schedule(cronExpression, runCycle);
console.log(`Email Evaluator iniciado. Cron: "${cronExpression}"`);

runCycle();

import "dotenv/config";
import { buildEmailEvaluatorGraph } from "./graph/graph";
import { SAMPLES } from "./fixtures/email_samples";
import { RawEmail, EmailEvaluatorState } from "./graph/state";

process.env.DRY_RUN = "true";

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

const URGENCY_COLOR: Record<string, string> = {
  low: C.gray,
  medium: C.yellow,
  high: C.magenta,
  critical: C.red,
};

function header(title: string) {
  console.log(`\n${C.bold}${C.cyan}${"═".repeat(62)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${title}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${"═".repeat(62)}${C.reset}`);
}

function printResult(result: EmailEvaluatorState) {
  const uc = URGENCY_COLOR[result.urgency_level ?? "low"] ?? C.reset;

  console.log(`\n${C.bold}Resultado:${C.reset}`);
  console.log(
    `  Categoria:  ${C.green}${result.category}${C.reset}` +
    ` (confiança: ${((result.category_confidence ?? 0) * 100).toFixed(0)}%)`
  );
  console.log(`  Raciocínio: ${C.gray}${result.category_reasoning}${C.reset}`);
  const urgLabel = result.urgency_level
    ? `${result.urgency_level} — score ${result.urgency_score}/10`
    : "n/a (não avaliado)";
  console.log(`  Urgência:   ${uc}${urgLabel}${C.reset}`);
  console.log(`  Tags:       ${result.urgency_tags?.join(", ") || "—"}`);
  console.log(`  Motivo:     ${C.gray}${result.urgency_reason}${C.reset}`);
  console.log(`  Tabela DB:  ${result.stored_table || "—"}`);
  console.log(`  Notificado: ${result.notification_sent ? `${C.green}sim${C.reset}` : "não"}`);

  if (result.action_items?.length > 0) {
    console.log(`\n  ${C.bold}Itens de ação:${C.reset}`);
    for (const item of result.action_items) {
      const dl = item.deadline ? ` (prazo: ${item.deadline})` : "";
      console.log(`    • ${item.task}${dl}`);
    }
  }

  if (result.summary) {
    console.log(`\n  ${C.bold}Resumo:${C.reset}`);
    console.log(`  ${C.gray}${result.summary}${C.reset}`);
  }

  if (result.draft_reply) {
    console.log(`\n  ${C.bold}Rascunho de resposta:${C.reset}`);
    console.log(`  ${C.gray}${result.draft_reply}${C.reset}`);
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function simulate(label: string, email: RawEmail): Promise<void> {
  header(`SIMULAÇÃO: ${label}`);
  console.log(`${C.gray}De:      ${email.from}`);
  console.log(`Assunto: ${email.subject}${C.reset}\n`);

  const graph = buildEmailEvaluatorGraph();
  const result = await graph.invoke({ email_raw: email, provider: "imap" });
  printResult(result as EmailEvaluatorState);
}

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : Object.keys(SAMPLES);

  console.log(`\n${C.bold}Email Evaluator — Simulação${C.reset}`);
  console.log(`Modelo: ${process.env.LLM_MODEL ?? "gpt-4.1-nano"} | DRY_RUN=true`);
  console.log(`Simulando: ${targets.join(", ")}`);

  for (const key of targets) {
    const email = SAMPLES[key as keyof typeof SAMPLES];
    if (!email) {
      console.warn(`\n[!] Fixture "${key}" não encontrada. Disponíveis: ${Object.keys(SAMPLES).join(", ")}`);
      continue;
    }
    try {
      await simulate(key, email);
    } catch (err) {
      console.error(`\n[ERRO] Falha ao simular "${key}":`, err);
    }
  }

  console.log(`\n${C.bold}${C.green}Simulação concluída.${C.reset}\n`);
}

main();

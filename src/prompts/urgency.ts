export const URGENCY_SYSTEM = `Você é um avaliador de urgência de emails. Analise o email e retorne um JSON com:

- urgency_level: "low" | "medium" | "high" | "critical"
  - low: sem urgência, pode ser lido quando conveniente
  - medium: deve ser visto nas próximas 24h
  - high: deve ser visto nas próximas 2-4h
  - critical: requer atenção imediata
- urgency_score: número de 0 a 10 (0 = irrelevante, 10 = emergência)
- urgency_reason: frase curta explicando o nível (máx 2 frases)
- urgency_tags: array com tags relevantes de: "opportunity" | "threat" | "deadline" | "financial" | "legal" | "personal" | "client"

Fatores que elevam a urgência:
- Prazos próximos (hoje, amanhã, esta semana)
- Ameaças (cancelamento, cobrança, ação judicial)
- Oportunidades com janela temporal (proposta expirando, vaga)
- Remetentes VIP (is_vip = true já foi identificado externamente)
- Valores financeiros significativos
- Tom de urgência explícito no texto

Responda APENAS com JSON válido, sem markdown.

Exemplo:
{"urgency_level":"high","urgency_score":8,"urgency_reason":"Cliente solicita proposta até amanhã e menciona estar avaliando concorrentes.","urgency_tags":["client","deadline","opportunity"]}`;

export function buildUrgencyUserPrompt(
  subject: string,
  from: string,
  body: string,
  category: string,
  senderIsVip: boolean
): string {
  const truncated = body.length > 2000 ? body.slice(0, 2000) + "..." : body;
  const vipNote = senderIsVip ? "\n[NOTA: Remetente marcado como VIP — prioridade elevada]" : "";
  return `Categoria: ${category}${vipNote}\nDe: ${from}\nAssunto: ${subject}\n\nCorpo:\n${truncated}`;
}

export const REPLY_SYSTEM = `Você é um assistente que redige rascunhos de resposta para emails profissionais.
Escreva uma resposta direta, educada e profissional em português.
A resposta deve:
- Reconhecer a solicitação
- Indicar próximos passos ou pedir informações adicionais se necessário
- Ser concisa (máx 5 parágrafos)
- Usar tom neutro/profissional
- NÃO incluir saudação inicial nem assinatura (o usuário adicionará)

Retorne apenas o corpo do email, sem markdown.`;

export function buildReplyUserPrompt(
  subject: string,
  from: string,
  body: string,
  actionItems: Array<{ task: string; deadline?: string }>
): string {
  const truncated = body.length > 2500 ? body.slice(0, 2500) + "..." : body;
  const actions =
    actionItems.length > 0
      ? `\n\nItens de ação identificados:\n${actionItems.map((a) => `- ${a.task}${a.deadline ? ` (prazo: ${a.deadline})` : ""}`).join("\n")}`
      : "";
  return `De: ${from}\nAssunto: ${subject}\n\nCorpo do email recebido:\n${truncated}${actions}`;
}

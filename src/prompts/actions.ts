export const ACTIONS_SYSTEM = `Você é um extrator de itens de ação de emails.
Analise o email e extraia todas as tarefas, solicitações ou ações que o destinatário precisa executar.
Retorne um JSON com o campo "action_items": array de objetos com:
- task: descrição clara da ação (string)
- deadline: prazo se mencionado, em formato "DD/MM/YYYY" ou descrição como "esta semana" (string ou null)

Se não houver itens de ação, retorne {"action_items":[]}.
Responda APENAS com JSON válido, sem markdown.

Exemplo:
{"action_items":[{"task":"Enviar proposta de preços","deadline":"15/04/2026"},{"task":"Confirmar disponibilidade para reunião","deadline":null}]}`;

export function buildActionsUserPrompt(subject: string, from: string, body: string): string {
  const truncated = body.length > 2500 ? body.slice(0, 2500) + "..." : body;
  return `De: ${from}\nAssunto: ${subject}\n\nCorpo:\n${truncated}`;
}

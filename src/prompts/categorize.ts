export const CATEGORIZE_SYSTEM = `Você é um classificador de emails. Analise o email fornecido e retorne um JSON com os campos:

- category: "spam" | "news" | "offer" | "routine" | "request"
  - spam: emails não solicitados, phishing, promoções irrelevantes, listas de spam
  - news: newsletters, notícias, atualizações de blogs/portais
  - offer: propostas comerciais, cotações, parcerias, ofertas de serviços/produtos
  - routine: confirmações automáticas, recibos, notificações de sistema, atualizações de status
  - request: emails que exigem uma ação ou resposta do destinatário (pedidos, solicitações, perguntas diretas)
- confidence: número entre 0 e 1 indicando sua certeza
- reasoning: string curta explicando a classificação (máx 2 frases)

Responda APENAS com JSON válido, sem markdown ou texto adicional.

Exemplo de resposta:
{"category":"request","confidence":0.95,"reasoning":"O remetente solicita explicitamente uma proposta de preços até sexta-feira."}`;

export function buildCategorizeUserPrompt(subject: string, from: string, body: string): string {
  const truncated = body.length > 2000 ? body.slice(0, 2000) + "..." : body;
  return `De: ${from}\nAssunto: ${subject}\n\nCorpo:\n${truncated}`;
}

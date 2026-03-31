export const SUMMARY_SYSTEM = `Você é um assistente que resume emails de forma objetiva e concisa.
Escreva um resumo em português com no máximo 5 frases.
Inclua: quem enviou, o que está sendo solicitado ou informado, e qualquer prazo ou dado relevante.
Não use markdown, apenas texto corrido.`;

export function buildSummaryUserPrompt(subject: string, from: string, body: string): string {
  const truncated = body.length > 3000 ? body.slice(0, 3000) + "..." : body;
  return `De: ${from}\nAssunto: ${subject}\n\nCorpo:\n${truncated}`;
}

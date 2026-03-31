import { RawEmail } from "../graph/state";

export const SAMPLES: Record<string, RawEmail> = {
  spam: {
    message_id: "test-spam-001",
    from: "promo@noreply-discount.xyz",
    to: "user@example.com",
    subject: "GANHE R$5000 AGORA!! Clique aqui!",
    body: "Parabéns! Você foi selecionado para ganhar um prêmio especial. Clique no link abaixo para resgatar.",
    date: "2026-03-30T10:00:00Z",
    has_attachments: false,
  },

  news: {
    message_id: "test-news-001",
    from: "newsletter@techcrunch.com",
    to: "user@example.com",
    subject: "OpenAI lança novo modelo GPT-5",
    body: "Esta semana a OpenAI anunciou o lançamento do GPT-5 com capacidades multimodais aprimoradas...",
    date: "2026-03-30T08:00:00Z",
    has_attachments: false,
  },

  offer: {
    message_id: "test-offer-001",
    from: "vendas@agencia-digital.com.br",
    to: "user@example.com",
    subject: "Proposta comercial — Gestão de tráfego pago",
    body: "Olá! Preparamos uma proposta exclusiva para gestão do seu tráfego pago com pacotes a partir de R$1.500/mês.",
    date: "2026-03-30T09:30:00Z",
    has_attachments: true,
  },

  routine: {
    message_id: "test-routine-001",
    from: "noreply@github.com",
    to: "user@example.com",
    subject: "[GitHub] Your pull request was merged",
    body: "Pull request #42 'feat: add new endpoint' was successfully merged into main.",
    date: "2026-03-30T11:00:00Z",
    has_attachments: false,
  },

  request_urgent: {
    message_id: "test-request-urgent-001",
    from: "joao.silva@clienteimportante.com.br",
    to: "user@example.com",
    subject: "Urgente: Preciso da proposta até hoje às 17h",
    body: `Olá,

Conforme conversamos, estou aguardando a sua proposta de desenvolvimento do sistema de gestão.
Tenho uma reunião com os sócios hoje às 18h e precisaria da proposta até 17h no máximo.

Se não receber até lá, infelizmente terei que contratar outra empresa.

Att,
João Silva
CEO — Cliente Importante Ltda`,
    date: "2026-03-30T12:00:00Z",
    has_attachments: false,
  },
};

import imapSimple from "imap-simple";
import { simpleParser } from "mailparser";
import { RawEmail } from "../graph/state";
import { EmailProvider } from "./types";

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
}

export class ImapProvider implements EmailProvider {
  private config: imapSimple.ImapSimpleOptions;
  readonly account: string;

  constructor(cfg: ImapConfig) {
    this.account = cfg.user;
    this.config = {
      imap: {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.pass,
        tls: cfg.tls,
        authTimeout: 10000,
      },
    };
  }

  async fetchUnread(): Promise<RawEmail[]> {
    const connection = await imapSimple.connect(this.config);
    await connection.openBox("INBOX");

    const messages = await connection.search(["UNSEEN"], {
      bodies: [""],
      markSeen: false,
    });

    const emails: RawEmail[] = [];

    for (const msg of messages) {
      const all = msg.parts.find((p) => p.which === "");
      if (!all) continue;

      const parsed = await simpleParser(all.body as string);
      const from = parsed.from?.text ?? "";
      const to = Array.isArray(parsed.to) ? parsed.to[0]?.text ?? "" : parsed.to?.text ?? "";

      emails.push({
        message_id: parsed.messageId ?? `imap-${Date.now()}-${Math.random()}`,
        thread_id: undefined,
        from,
        to,
        subject: parsed.subject ?? "(sem assunto)",
        body: parsed.text ?? (typeof parsed.html === "string" ? parsed.html : "") ?? "",
        date: parsed.date?.toISOString() ?? new Date().toISOString(),
        has_attachments: (parsed.attachments?.length ?? 0) > 0,
      });
    }

    connection.end();
    return emails;
  }

  async markProcessed(messageId: string): Promise<void> {
    const connection = await imapSimple.connect(this.config);
    await connection.openBox("INBOX");
    await connection.search([["HEADER", "Message-ID", messageId]], {
      bodies: [],
      markSeen: true,
    });
    connection.end();
  }
}

export function getImapProviders(): ImapProvider[] {
  const raw = process.env.IMAP_ACCOUNTS;

  if (raw) {
    const accounts: ImapConfig[] = JSON.parse(raw);
    return accounts.map((a) => new ImapProvider(a));
  }

  // Fallback: conta única via variáveis individuais
  return [
    new ImapProvider({
      host: process.env.IMAP_HOST ?? "imap.hostinger.com",
      port: Number(process.env.IMAP_PORT ?? 993),
      user: process.env.IMAP_USER ?? "",
      pass: process.env.IMAP_PASS ?? "",
      tls: process.env.IMAP_TLS !== "false",
    }),
  ];
}

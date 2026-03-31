import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { RawEmail } from "../graph/state";
import { EmailProvider } from "./types";

function buildOAuthClient(): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return client;
}

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: any): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return "";
}

export class GmailProvider implements EmailProvider {
  private gmail;

  constructor() {
    const auth = buildOAuthClient();
    this.gmail = google.gmail({ version: "v1", auth });
  }

  async fetchUnread(): Promise<RawEmail[]> {
    const listRes = await this.gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 50,
    });

    const messages = listRes.data.messages ?? [];
    const emails: RawEmail[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;

      const full = await this.gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = full.data.payload?.headers ?? [];
      const get = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

      emails.push({
        message_id: msg.id,
        thread_id: full.data.threadId ?? undefined,
        from: get("From"),
        to: get("To"),
        subject: get("Subject"),
        body: extractBody(full.data.payload),
        date: get("Date"),
        has_attachments: (full.data.payload?.parts ?? []).some(
          (p) => p.filename && p.filename.length > 0
        ),
      });
    }

    return emails;
  }

  async markProcessed(messageId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { removeLabelIds: ["UNREAD"] },
    });
  }
}

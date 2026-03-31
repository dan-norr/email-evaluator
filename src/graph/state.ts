import { Annotation } from "@langchain/langgraph";

export type EmailCategory = "spam" | "news" | "offer" | "routine" | "request";
export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type EmailProvider = "gmail" | "imap";
export type UrgencyTag =
  | "opportunity"
  | "threat"
  | "deadline"
  | "financial"
  | "legal"
  | "personal"
  | "client";

export interface RawEmail {
  message_id: string;
  thread_id?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  has_attachments: boolean;
}

export interface ActionItem {
  task: string;
  deadline?: string;
}

export const EmailEvaluatorAnnotation = Annotation.Root({
  // ─── Input ────────────────────────────────────────────────────────────────
  email_raw: Annotation<RawEmail>({
    reducer: (_, next) => next,
    default: () => ({
      message_id: "",
      from: "",
      to: "",
      subject: "",
      body: "",
      date: "",
      has_attachments: false,
    }),
  }),
  provider: Annotation<EmailProvider>({
    reducer: (_, next) => next,
    default: () => "gmail",
  }),

  // ─── Preprocessing ────────────────────────────────────────────────────────
  is_duplicate: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
  sender_is_vip: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  // ─── Tier 3: Categorização ────────────────────────────────────────────────
  category: Annotation<EmailCategory | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  category_confidence: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  category_reasoning: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // ─── Tier 3: Urgência ─────────────────────────────────────────────────────
  urgency_level: Annotation<UrgencyLevel | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  urgency_score: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  urgency_reason: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  urgency_tags: Annotation<UrgencyTag[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  // ─── Tier 3: Enriquecimento ───────────────────────────────────────────────
  action_items: Annotation<ActionItem[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  summary: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  draft_reply: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  // ─── Tier 1: Outputs ──────────────────────────────────────────────────────
  stored_table: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  notification_sent: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  // ─── Control ──────────────────────────────────────────────────────────────
  error: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
});

export type EmailEvaluatorState = typeof EmailEvaluatorAnnotation.State;

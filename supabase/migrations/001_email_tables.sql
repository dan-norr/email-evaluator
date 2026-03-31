-- ============================================================
-- Email Evaluator — Initial Schema
-- ============================================================
-- Tabelas criadas por este migration (NÃO altera schemas existentes):
--   emails_spam, emails_news, emails_offers, emails_routine,
--   emails_requests, email_senders, email_notifications
-- ============================================================

-- ─── Extensões ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tipos ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE email_category AS ENUM ('spam', 'news', 'offer', 'routine', 'request');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Base: colunas comuns compartilhadas por todas as tabelas de email ─────────
-- (não é uma tabela — apenas referência para consistência dos DDLs abaixo)

-- ─── emails_spam ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails_spam (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  thread_id       TEXT,
  from_address    TEXT NOT NULL,
  to_address      TEXT,
  subject         TEXT NOT NULL,
  body            TEXT,
  email_date      TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  urgency_level   urgency_level NOT NULL DEFAULT 'low',
  urgency_score   SMALLINT NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 10),
  urgency_tags    TEXT[] DEFAULT '{}',
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spam_processed_at ON emails_spam (processed_at DESC);

-- ─── emails_news ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails_news (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  thread_id       TEXT,
  from_address    TEXT NOT NULL,
  to_address      TEXT,
  subject         TEXT NOT NULL,
  body            TEXT,
  email_date      TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  urgency_level   urgency_level NOT NULL DEFAULT 'low',
  urgency_score   SMALLINT NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 10),
  urgency_tags    TEXT[] DEFAULT '{}',
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_processed_at ON emails_news (processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_urgency      ON emails_news (urgency_level, urgency_score DESC);

-- ─── emails_offers ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails_offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  thread_id       TEXT,
  from_address    TEXT NOT NULL,
  to_address      TEXT,
  subject         TEXT NOT NULL,
  body            TEXT,
  email_date      TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  urgency_level   urgency_level NOT NULL DEFAULT 'low',
  urgency_score   SMALLINT NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 10),
  urgency_tags    TEXT[] DEFAULT '{}',
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_processed_at ON emails_offers (processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_urgency      ON emails_offers (urgency_level, urgency_score DESC);

-- ─── emails_routine ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails_routine (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  thread_id       TEXT,
  from_address    TEXT NOT NULL,
  to_address      TEXT,
  subject         TEXT NOT NULL,
  body            TEXT,
  email_date      TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  urgency_level   urgency_level NOT NULL DEFAULT 'low',
  urgency_score   SMALLINT NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 10),
  urgency_tags    TEXT[] DEFAULT '{}',
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_processed_at ON emails_routine (processed_at DESC);

-- ─── emails_requests ──────────────────────────────────────────────────────────
-- Emails que exigem ação do destinatário — tabela mais rica com action_items,
-- resumo e rascunho de resposta
CREATE TABLE IF NOT EXISTS emails_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  thread_id       TEXT,
  from_address    TEXT NOT NULL,
  to_address      TEXT,
  subject         TEXT NOT NULL,
  body            TEXT,
  email_date      TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  urgency_level   urgency_level NOT NULL DEFAULT 'medium',
  urgency_score   SMALLINT NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 10),
  urgency_tags    TEXT[] DEFAULT '{}',
  action_items    JSONB DEFAULT '[]',   -- [{task, deadline}]
  summary         TEXT,
  draft_reply     TEXT,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_processed_at ON emails_requests (processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_urgency      ON emails_requests (urgency_level, urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_requests_action_items ON emails_requests USING GIN (action_items);

-- ─── email_senders ────────────────────────────────────────────────────────────
-- Registro de remetentes conhecidos. is_vip = true eleva urgência automaticamente.
CREATE TABLE IF NOT EXISTS email_senders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  is_vip     BOOLEAN NOT NULL DEFAULT FALSE,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_senders_email  ON email_senders (email);
CREATE INDEX IF NOT EXISTS idx_senders_is_vip ON email_senders (is_vip) WHERE is_vip = TRUE;

-- ─── email_notifications ──────────────────────────────────────────────────────
-- Log de todas as notificações WhatsApp enviadas + registro de deduplicação
-- (isMessageProcessed() usa esta tabela para verificar se email já foi processado)
CREATE TABLE IF NOT EXISTS email_notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       TEXT NOT NULL UNIQUE,
  category         email_category NOT NULL,
  urgency_level    urgency_level NOT NULL,
  urgency_score    SMALLINT NOT NULL DEFAULT 0,
  whatsapp_sent_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_message_id ON email_notifications (message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON email_notifications (created_at DESC);

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
-- Desativado por padrão — habilitar quando houver autenticação de usuários.
-- ALTER TABLE emails_spam       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emails_news       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emails_offers     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emails_routine    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emails_requests   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_senders     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

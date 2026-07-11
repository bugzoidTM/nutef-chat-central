-- CRM Kanban: etapas do funil, tags e notas por contato
-- Aplicado no Supabase self-hosted (schema watende) em 2026-07-11.

-- Etapas do funil (colunas do Kanban)
CREATE TABLE IF NOT EXISTS watende.crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO watende.crm_stages (name, color, position)
SELECT * FROM (VALUES
  ('Novo Contato', '#3b82f6', 1),
  ('Em Atendimento', '#f59e0b', 2),
  ('Proposta', '#8b5cf6', 3),
  ('Ganho', '#22c55e', 4),
  ('Perdido', '#ef4444', 5)
) AS seed(name, color, position)
WHERE NOT EXISTS (SELECT 1 FROM watende.crm_stages);

-- Tags de contatos
CREATE TABLE IF NOT EXISTS watende.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6b7280',
  created_by uuid REFERENCES watende.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watende.conversation_tags (
  conversation_id uuid NOT NULL REFERENCES watende.conversations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES watende.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, tag_id)
);

-- Notas por contato/conversa
CREATE TABLE IF NOT EXISTS watende.contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES watende.conversations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES watende.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_conversation ON watende.contact_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag ON watende.conversation_tags(tag_id);

-- Etapa do funil na conversa (null = primeira etapa)
ALTER TABLE watende.conversations
  ADD COLUMN IF NOT EXISTS crm_stage_id uuid REFERENCES watende.crm_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_crm_stage ON watende.conversations(crm_stage_id);

-- RLS: leitura/escrita para qualquer usuário autenticado do sistema
ALTER TABLE watende.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE watende.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE watende.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE watende.contact_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read stages" ON watende.crm_stages;
CREATE POLICY "Authenticated can read stages" ON watende.crm_stages
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage stages" ON watende.crm_stages;
CREATE POLICY "Admins can manage stages" ON watende.crm_stages
  FOR ALL TO authenticated USING (watende.is_current_user_admin()) WITH CHECK (watende.is_current_user_admin());

DROP POLICY IF EXISTS "Authenticated can manage tags" ON watende.tags;
CREATE POLICY "Authenticated can manage tags" ON watende.tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage conversation tags" ON watende.conversation_tags;
CREATE POLICY "Authenticated can manage conversation tags" ON watende.conversation_tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage notes" ON watende.contact_notes;
CREATE POLICY "Authenticated can manage notes" ON watende.contact_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime para tags e notas (conversations já está na publicação)
ALTER PUBLICATION supabase_realtime ADD TABLE watende.conversation_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE watende.contact_notes;

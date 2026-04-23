CREATE TABLE brushing_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed     BOOLEAN     DEFAULT FALSE,
  duration_sec  INTEGER     DEFAULT 0,
  effects_count INTEGER     DEFAULT 0
);

-- RLS: 誰でも挿入・参照可能（リンク公開のため）
ALTER TABLE brushing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert" ON brushing_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public select" ON brushing_sessions FOR SELECT USING (true);

-- Edutech Cards 테이블 생성
CREATE TABLE IF NOT EXISTS edutech_cards (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  webpage_name TEXT NOT NULL,
  user_summary TEXT,
  useful_subjects TEXT[],
  educational_meaning TEXT,
  ai_summary TEXT,
  ai_keywords TEXT[],
  ai_category TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE edutech_cards ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow public read access" ON edutech_cards
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Allow public insert access" ON edutech_cards
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능
CREATE POLICY "Allow public update access" ON edutech_cards
  FOR UPDATE USING (true);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_edutech_cards_url ON edutech_cards(url);
CREATE INDEX IF NOT EXISTS idx_edutech_cards_webpage_name ON edutech_cards(webpage_name);
CREATE INDEX IF NOT EXISTS idx_edutech_cards_created_at ON edutech_cards(created_at);
CREATE INDEX IF NOT EXISTS idx_edutech_cards_ai_category ON edutech_cards(ai_category);

-- 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_edutech_cards_useful_subjects ON edutech_cards USING GIN(useful_subjects);
CREATE INDEX IF NOT EXISTS idx_edutech_cards_ai_keywords ON edutech_cards USING GIN(ai_keywords);

-- 전체 텍스트 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_edutech_cards_search ON edutech_cards USING GIN(
  to_tsvector('korean', 
    COALESCE(webpage_name, '') || ' ' || 
    COALESCE(user_summary, '') || ' ' || 
    COALESCE(ai_summary, '') || ' ' ||
    COALESCE(educational_meaning, '')
  )
);
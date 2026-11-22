-- Daily trivia: one HR-approved multiple-choice question per day, answered once.
CREATE TABLE IF NOT EXISTS trivia_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  source VARCHAR(160),
  status VARCHAR(20) NOT NULL DEFAULT 'approved',
  scheduled_date DATE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One live question per calendar day.
CREATE UNIQUE INDEX IF NOT EXISTS trivia_questions_one_per_day
  ON trivia_questions (scheduled_date)
  WHERE scheduled_date IS NOT NULL AND status = 'approved';

CREATE TABLE IF NOT EXISTS trivia_answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
  answer_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answer_date DATE NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS trivia_answers_user_date ON trivia_answers (user_id, answer_date);

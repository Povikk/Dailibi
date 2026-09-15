-- DAILIBI - statistiques agrégées entre joueurs.
--
-- Aucune donnée personnelle en clair : les tables ne contiennent que des
-- compteurs. `player_hash` est un pseudonyme par affaire, dérivé côté Worker
-- (SHA-256 du secret de l'appareil + l'identifiant de l'affaire), donc il
-- n'est pas corrélable d'une affaire à l'autre.

CREATE TABLE IF NOT EXISTS case_totals (
  case_id TEXT NOT NULL PRIMARY KEY,
  accusations INTEGER NOT NULL DEFAULT 0,
  perfect INTEGER NOT NULL DEFAULT 0,
  score_sum INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS case_answers (
  case_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (case_id, question_id, option_id)
);

-- Un enregistrement par joueur et par affaire : garantit qu'une accusation
-- n'est comptée qu'une fois, même si l'API est rappelée.
CREATE TABLE IF NOT EXISTS case_players (
  case_id TEXT NOT NULL,
  player_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (case_id, player_hash)
);

CREATE INDEX IF NOT EXISTS case_answers_question_idx
  ON case_answers (case_id, question_id);

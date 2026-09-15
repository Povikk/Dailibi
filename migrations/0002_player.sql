-- DAILIBI - profil de joueur sans inscription.
--
-- Le joueur n'a ni compte ni email : le navigateur garde un secret aleatoire
-- qui sert a la fois d'identifiant et de code de secours. Le serveur n'en
-- stocke qu'un hachage SHA-256, jamais la valeur. Le document `snapshot`
-- contient des compteurs de progression (parties jouees, meilleure serie,
-- nombre d'affaires entierement explorees...), aucun identifiant de piece.

CREATE TABLE IF NOT EXISTS players (
  player_hash TEXT NOT NULL PRIMARY KEY,
  snapshot TEXT NOT NULL,
  equipped_title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_badges (
  player_hash TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  PRIMARY KEY (player_hash, badge_id)
);

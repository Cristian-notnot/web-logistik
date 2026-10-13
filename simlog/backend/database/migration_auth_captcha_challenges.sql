CREATE TABLE IF NOT EXISTS auth_captcha_challenges (
  challenge_id CHAR(48) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  answer_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  client_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (challenge_id),
  KEY idx_auth_captcha_expires_at (expires_at)
) ENGINE=InnoDB;

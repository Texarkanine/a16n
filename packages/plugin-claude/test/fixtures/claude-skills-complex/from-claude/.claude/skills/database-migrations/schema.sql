-- Database schema for migrations
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_migrations_version ON migrations(version);

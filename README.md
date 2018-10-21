# AdvancedDatabasesProject1

CREATE EXTENSION pg_trgm;
CREATE EXTENSION tablefunc;

CREATE TABLE logs (
	log_time timestamp,
	query text
);

CREATE INDEX summary_trigrams ON movie USING GIN(summary gin_trgm_ops);
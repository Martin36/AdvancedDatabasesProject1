# AdvancedDatabasesProject1

CREATE EXTENSION pg_trgm;
CREATE EXTENSION tablefunc;

CREATE TABLE logs (
	log_time timestamp,
	query text
);

CREATE INDEX summary_trigrams ON movie USING GIN(summary gin_trgm_ops);

SELECT ts_headline(title, to_tsquery('english', '(trip & about & heaven)')) title, ts_headline(description, to_tsquery('english', '(trip & about & heaven)')) description_highlight, description, movieid, summary, ts_rank(to_tsvector('english', description), to_tsquery('english', '(trip & about & heaven)')) rank FROM movie WHERE to_tsvector('english', description) @@ to_tsquery('english','(trip & about & heaven)') ORDER BY rank DESC ;
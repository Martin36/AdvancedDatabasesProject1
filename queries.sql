CREATE EXTENSION pg_trgm;
CREATE EXTENSION tablefunc;

CREATE TABLE logs (
	log_time timestamp,
	query text
);




SELECT * 
FROM crosstab('
	SELECT EXTRACT(YEAR FROM log_time)::int AS year
			 , EXTRACT(MONTH FROM log_time)::int AS month
			 , COUNT (*)::int AS nrOfLogs
	FROM logs
	GROUP BY year, month
	ORDER BY year, month')
AS pivotTable (year INT, October INT)
ORDER BY year;
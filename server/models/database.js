const pg = require('pg');

const { Pool, Client } = require('pg');

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'movies',
	password: 'Orange16',
	port: 5432,
});

pool.query('SELECT * FROM movie FETCH first 10 ROWS only', (err, res) => {
	console.log(err, res);
	pool.end();
});

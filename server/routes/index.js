const express = require('express');
const router = express.Router();
const path = require('path');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/movies';

const { Pool, Client } = require('pg');

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'movies',
	password: 'admin',
	port: 5432,
});

//pool.query('SELECT * FROM movie FETCH first 10 ROWS only', (err, res) => {
//	console.log(err, res);
//	pool.end();
//});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/api/movie', (req, res, next) => {
	const results = [];
	// Grab data from http request
	const data = {
		title: req.body.title,
		categories: req.body.categories,
		summary: req.body.summary,
		description: req.body.description
	};
	results.push(data);
	// Get a Postgres client from the connection pool
	pool.connect((err, client, release) => {
		console.log(release);
		// Handle connection errors
		if (err) {
			console.log(err);
			release();
			return res.status(500).json({ success: false, data: err });
		}
		//Get total nr of elem in table for id
		//client.query('SELECT COUNT FROM movie');

		// SQL Query > Insert Data
		client.query('INSERT INTO movie(title, categories, summary, description) VALUES($1, $2, $3, $4) RETURNING *',
			[data.title, data.categories, data.summary, data.description], (err, data) => {
				if (err) {
					console.log(err);
					release();
					return res.status(500).json({ success: false, data: err });
				}
				console.log(data);
				release();
				return res.json(data.rows);
			});

		// SQL Query > Select Data
		//const query = client.query('SELECT * FROM movie ORDER BY movieid DESC', (err, res) => {
		//	console.log(res);
		//	return res.
		//});
		// Stream results back one row at a time
		//query.on('row', (row) => {
		//	results.push(row);
		//});
		// After all data is returned, close connection and return results
		//query.on('end', () => {
		//	release();
		//	return res.json(results);
		//});
	});
});

router.get('/api/movies', (req, res, next) => {
	const results = [];
	const search = req.query.s;
	const amount = req.query.n;
	//Is true if the search should include all the words, otherwise it should include any of the words
	const inclusive = (req.query.i === 'true');
	// Get a Postgres client from the connection pool
	pool.connect((err, client, done) => {
		// Handle connection errors
		if (err) {
			done();
			console.log(err);
			return res.status(500).json({ success: false, data: err });
		}
		// SQL Query > Select Data
		let queryString = 'SELECT * FROM movie ';
		if (search !== undefined || search !== null) {
			//Split the string into separate words 
			let words = search.split(" ");
			let joinedSearch;
			if (inclusive) {
				joinedSearch = words.join(" & ");
			}
			else {
				joinedSearch = words.join(" | ");
			}
			console.log(joinedSearch);
			queryString += "WHERE to_tsvector(description) @@ to_tsquery('" + joinedSearch + "') ";
		}
		//Set the limit for nr of returns
		if ((amount !== undefined || amount !== null) && !isNaN(amount)) {
			queryString += "LIMIT " + amount + ";";
		}
		else {
			queryString += "LIMIT 10;"; 
		}

		console.log(queryString);

		client.query(queryString, (err, data) => {
			if (err) {
				done();
				console.log(err);
				return res.status(500).json({ success: false, data: err });
			}

			//console.log(res);
			data.rows.forEach(row => {
				results.push(row);
			});

			return res.json(results);
		});
		// Stream results back one row at a time
		//query.on('row', (row) => {
		//	results.push(row);
		//});
		//// After all data is returned, close connection and return results
		//query.on('end', () => {
		//	done();
		//	return res.json(results);
		//});
	});
});


module.exports = router;

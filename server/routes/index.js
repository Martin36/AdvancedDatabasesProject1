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

router.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

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
	const results = {};
	const dataRows = [];
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
		if (search !== undefined && search !== null) {
			//Split the string into separate words 
			let searchWords = search.split('"');
			//Remove empty strings
			searchWords = searchWords.filter(function (word) {
				//Remove all the empty strings and the ones with only white spaces
				return /\S/.test(word);
			});
			//Join each word in the phrases
			let searchPhrases = searchWords.map(function (phrase) {
				let words = phrase.split(" ");
				words = words.filter((word) => { return word !== ''; });
				let nrOfWords = words.length;
				if (nrOfWords === 1) return words[0];
				let result = "(";
				words.forEach((word, i) => {
					result += word;
					if (i === nrOfWords - 1)
						result += ")";
					else
						result += " & ";
				});
				return result;
			});

			let joinedSearch;
			if (inclusive) {
				joinedSearch = searchPhrases.join(" & ");
			}
			else {
				joinedSearch = searchPhrases.join(" | ");
			}
			queryString =
				`SELECT ts_headline(title, to_tsquery('${joinedSearch}')) title,
								ts_headline(description, to_tsquery('${joinedSearch}')) description_highlight,
								description,
								movieid,
								summary,
								ts_rank(to_tsvector(description), to_tsquery('${joinedSearch}')) rank
				 FROM movie
				 WHERE to_tsvector(description) @@ to_tsquery('${joinedSearch}') 
				 ORDER BY rank DESC
				`;
			/* Add these if search in all the fields are required
			 *OR to_tsvector(title) @@ to_tsquery('${joinedSearch}')
				OR to_tsvector(summary) @@ to_tsquery('${joinedSearch}')
			*/
		}
		//Set the limit for nr of returns
		if ((amount !== undefined || amount !== null) && !isNaN(amount)) {
			queryString += "LIMIT " + amount + ";";
		}
		else {
			queryString += ";"; 
		}

		results.queryString = queryString;

		client.query(queryString, (err, data) => {
			if (err) {
				done();
				console.log(err);
				return res.status(500).json({ success: false, data: err });
			}

			data.rows.forEach(row => {
				dataRows.push(row);
			});

			results.data = dataRows;

			done();
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

router.get('/api/findsimilar', (req, res, next) => {
	const search = req.query.s;

	pool.connect((err, client, done) => {
		// Handle connection errors
		if (err) {
			done();
			console.log(err);
			return res.status(500).json({ success: false, data: err });
		}
		if (search !== undefined && search !== "") {
			let queryString = `
				SELECT summary, similarity(summary, '${search}')  
				FROM movie
				WHERE summary % '${search}'
				LIMIT 5;`;

			client.query(queryString, (err, data) => {
				if (err) {
					done();
					console.log(err);
					return res.status(500).json({ success: false, data: err });
				}
				done();
				return res.json(data.rows);
			});
		}
	});
});

module.exports = router;

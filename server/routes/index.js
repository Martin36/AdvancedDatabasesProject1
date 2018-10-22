const express = require('express');
const router = express.Router();

const { Pool } = require('pg');

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
	});
});

router.get('/api/movies', (req, res, next) => {
	const results = {};
	const dataRows = [];
	const search = req.query.s;
	const amount = req.query.n;

	let joinedSearch;
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

			if (inclusive) {
				joinedSearch = searchPhrases.join(" & ");
			}
			else {
				joinedSearch = searchPhrases.join(" | ");
			}
			//Query string without english language
			//queryString =
			//	`SELECT ts_headline(title, to_tsquery('${joinedSearch}')) title,
			//					ts_headline(description, to_tsquery('${joinedSearch}')) description_highlight,
			//					description,
			//					movieid,
			//					summary,
			//					ts_rank(to_tsvector(description), to_tsquery('${joinedSearch}')) rank
			//	 FROM movie
			//	 WHERE to_tsvector(description) @@ to_tsquery('${joinedSearch}') 
			//	 ORDER BY rank DESC
			//	`;

			//Query string with english language
			queryString =
				`SELECT ts_headline(title, to_tsquery('english', '${joinedSearch}')) title,
								ts_headline(description, to_tsquery('english', '${joinedSearch}')) description_highlight,
								description,
								movieid,
								summary,
								ts_rank(to_tsvector(description), to_tsquery('english', '${joinedSearch}')) rank
				 FROM movie
				 WHERE to_tsvector(description) @@ to_tsquery('english', '${joinedSearch}') 
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

			//Log the query
			let modifiedQueryString = queryString.split("'").join('"');
			//Remove unnessesary spaces and line breaks
			modifiedQueryString = modifiedQueryString.replace(/\s+/g, ' ').trim();
			let logQuery = `INSERT INTO logs VALUES(current_timestamp, '${joinedSearch}');`;
			//Replace all ' with "
			client.query(logQuery, (err, d) => {
				if (err) {
					done();
					console.log(err);
					return res.status(500).json({ success: false, data: err });
				}
				console.log("Query logged!");
				done();
				return res.json(results);
			});
		});
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

router.get('/api/logs', (req, res, next) => {
	const from = req.query.from;
	const to = req.query.to;
	const fromDay = from.split("-").pop();
	const toDay = to.split("-").pop();
	const nrOfDays = getNrOfDays(from, to);

	console.log(from);
	pool.connect((err, client, done) => {
		if (err) {
			done();
			console.log(err);
			return res.status(500).json({ success: false, data: err });
		}
		let createTableQuery = `
			CREATE TEMP TABLE day
			(dayOrd INT);
		`;
		//Create the table dynamically
		for (let i = 0; i <= nrOfDays; i++) {
			let currentDay = parseInt(fromDay) + i;
			createTableQuery += `INSERT INTO day VALUES(${currentDay}); `;
		}
		console.log(createTableQuery);

		//For static dates
		//let createTableQuery = `
		//	CREATE TEMP TABLE day
		//	(dayOrd INT);
		//	INSERT INTO day VALUES(20);
		//	INSERT INTO day VALUES(21);
		//	INSERT INTO day VALUES(22);
		//`;

		
		client.query(createTableQuery, (err, data) => {
			if (err) {
				done();
				console.log(err);
				return res.status(500).json({ success: false, data: err });
			}
			let queryString = `
				SELECT * 
				FROM crosstab('
					SELECT query::TEXT AS queryStr
								, EXTRACT(DAY FROM log_time)::int AS day
								, COUNT (*)::int AS nrOfLogs
					FROM logs
					GROUP BY queryStr, day
					ORDER BY queryStr, day',
					'SELECT dayOrd FROM day ORDER BY dayOrd')
				AS pivotTable (queryStr TEXT, d20102018 INT, d21102018 INT, d22102018 INT)
				ORDER BY queryStr;
			`;

			client.query(queryString, (err, data) => {
				if (err) {
					done();
					console.log(err);
					return res.status(500).json({ success: false, data: err });
				}
				done();
				return res.json(data.rows);
			});

		});

		let queryStringTest = `
			SELECT * 
			FROM crosstab('
				SELECT query::character(200) AS queryStr
						 , EXTRACT(DAY FROM log_time)::int AS day
						 , COUNT (*)::int AS nrOfLogs
				FROM logs
				GROUP BY queryStr, day
				ORDER BY queryStr, day',
				'SELECT DISTINCT EXTRACT(DAY FROM log_time)::int AS day
				 FROM logs
				 ORDER BY day')
			AS pivotTable (queryStr CHARACTER(200), d20102018 INT, d21102018 INT, d22102018 INT)
			ORDER BY queryStr;
		`;

	});
});

function getNrOfDays(from, to) {
	var date1 = new Date(from);
	var date2 = new Date(to);
	var timeDiff = Math.abs(date2.getTime() - date1.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
	return diffDays;
}

module.exports = router;

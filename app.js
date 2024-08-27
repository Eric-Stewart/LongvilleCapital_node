const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM recipients');
    res.render('index', { recipients: result.rows });
});

app.post('/add_recipient', async (req, res) => {
    const { first_name, last_name, email, phone_number, carrier } = req.body;
    await pool.query(
        'INSERT INTO recipients (first_name, last_name, email, phone_number, carrier) VALUES ($1, $2, $3, $4, $5)',
        [first_name, last_name, email, phone_number, carrier]
    );
    res.redirect('/');
});

app.post('/delete_recipient', async (req, res) => {
    const { id } = req.body;
    await pool.query('DELETE FROM recipients WHERE id = $1', [id]);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
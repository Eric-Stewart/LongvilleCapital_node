const express = require('express');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

// Set up session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
}));

// Middleware to check if the user is authenticated
function checkAuth(req, res, next) {
    if (req.session.user && req.session.user === 'LongvilleCapital') {
        next();
    } else {
        res.redirect('/login');
    }
}

// Render the login page
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'LongvilleCapital' && password === 'LongvilleCapital12345678') {
        req.session.user = username;
        res.redirect('/');  // Redirect to the home page after login
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Protect your main route with authentication
app.get('/', checkAuth, async (req, res) => {
    const result = await pool.query('SELECT * FROM lc_recipients');
    res.render('index', { recipients: result.rows });
});

// Route to handle adding a new recipient
app.post('/add_recipient', async (req, res) => {
    const { first_name, last_name, email, phone_number, carrier, preferences } = req.body;

    await pool.query(
        'INSERT INTO lc_recipients (first_name, last_name, email, phone_number, carrier, preferences) VALUES ($1, $2, $3, $4, $5, $6)',
        [first_name, last_name, email, phone_number, carrier, preferences]
    );

    res.redirect('/');
});

// Route to handle deleting a recipient
app.post('/delete_recipient', async (req, res) => {
    const { id } = req.body;

    await pool.query('DELETE FROM lc_recipients WHERE id = $1', [id]);

    res.redirect('/');
});

app.get('/company_catalog', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM LC_COMPANY_CATALOG');
        const companies = result.rows; // Retrieve all rows from the table
        res.render('company_catalog', { companies });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).send('Server error');
    }
});

app.post('/add_company', async (req, res) => {
    const { company_name, category, is_active, additional_info } = req.body;
    try {
        await pool.query(
            'INSERT INTO LC_COMPANY_CATALOG (company_name, category, is_active, additional_info) VALUES ($1, $2, $3, $4)',
            [company_name, category, is_active === 'on', additional_info]
        );
        res.redirect('/company_catalog');
    } catch (error) {
        console.error('Error adding company:', error);
        res.status(500).send('Server error');
    }
});

app.post('/delete_company', async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('DELETE FROM LC_COMPANY_CATALOG WHERE pk = $1', [id]);
        res.redirect('/company_catalog');
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).send('Server error');
    }
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

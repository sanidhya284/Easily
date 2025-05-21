// app.js

const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer'); // Will be configured later for resume uploads
const { body, validationResult } = require('express-validator'); // For input validation
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware Setup ---

// Session middleware for authentication
app.use(session({
    secret: 'your_super_secret_key_change_this_in_production_!!!', // !!! IMPORTANT: Replace with a strong, random string
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: { maxAge: 60 * 60 * 1000 } // Session expires after 1 hour (in milliseconds)
}));

// Body parser middleware for handling form data (URL-encoded)
app.use(express.urlencoded({ extended: true }));
// Body parser middleware for handling JSON payloads (if any, though not strictly required for this project)
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
// Specify the directory where EJS view files are located
app.set('views', path.join(__dirname, 'views'));

// Middleware to make session variables (user, errors, success messages) available in all EJS templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Access logged-in user info in templates
    res.locals.errors = req.session.errors || null; // Display validation or custom error messages
    res.locals.success = req.session.success || null; // Display success messages

    res.locals.req = req;
    // Clear session messages after they've been passed to res.locals to prevent showing them again on refresh
    req.session.errors = null;
    req.session.success = null;
    next();
});

// --- Import Routes ---
const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');
// const applicantRoutes = require('./routes/applicant.routes'); // Might integrate into job routes

// --- Use Routes ---
// Base routes (login, register, logout)
app.use('/', authRoutes);
// Job-related routes (create, view, update, delete, apply)
app.use('/jobs', jobRoutes);
// app.use('/applicants', applicantRoutes); // If dedicated applicant routes are needed

// --- Custom Middleware for Tracking Last Visit (using cookies) ---
app.use((req, res, next) => {
    if (req.session.user) { // Only track for logged-in users
        res.cookie('lastVisit', new Date().toLocaleString(), {
            maxAge: 900000, // 15 minutes
            httpOnly: true // Prevent client-side script access
        });
    }
    next();
});


// --- 404 Not Found handler ---
// This middleware will be called if no other routes above it have handled the request
app.use((req, res, next) => {
    res.status(404).render('layouts/main', { title: 'Page Not Found', body: '../404' });
});

// --- Global Error Handler ---
// This middleware catches any errors thrown by route handlers or other middlewares
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack to the console for debugging
    res.status(500).send('Something broke!'); // Send a generic error response to the client
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
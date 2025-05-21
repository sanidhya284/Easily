// controllers/auth.controller.js

const User = require('../models/user.model'); // Import the User model
const { validationResult } = require('express-validator'); // Used to collect validation errors

// GET: Render the login page
exports.getLoginPage = (req, res) => {
    // Renders the main layout, injecting the login form.
    // Errors and success messages are already available via res.locals from app.js middleware.
    res.render('layouts/main', { title: 'Login to Easily Job Portal', body: '../auth/login' });
};

// GET: Render the registration page for recruiters
exports.getRegisterPage = (req, res) => {
    res.render('layouts/main', { title: 'Register as Recruiter', body: '../auth/register' });
};

// POST: Handle recruiter registration submission
exports.registerRecruiter = (req, res) => {
    // Check for validation errors from express-validator middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors, store them in session and redirect back to register page
        req.session.errors = errors.array();
        return res.redirect('/register');
    }

    const { name, email, password } = req.body;

    // Check if a user with the provided email already exists
    if (User.findByEmail(email)) {
        req.session.errors = [{ msg: 'User with this email already exists.' }];
        return res.redirect('/register');
    }

    // Save the new user (recruiter) to our in-memory "database"
    // In a real application, you would hash the password here using a library like bcrypt.
    const newUser = User.save({ name, email, password });

    req.session.success = 'Registration successful! Please login.';
    res.redirect('/'); // Redirect to the login page after successful registration
};

// POST: Handle recruiter login submission
exports.loginRecruiter = (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        return res.redirect('/'); // Redirect back to login page if errors
    }

    const { email, password } = req.body;

    // Find the user by email
    const user = User.findByEmail(email);

    // If user not found or password doesn't match (plain text compare for now)
    // In a real app, you'd compare hashed passwords: bcrypt.compareSync(password, user.password)
    if (!user || user.password !== password) {
        req.session.errors = [{ msg: 'Invalid email or password.' }];
        return res.redirect('/');
    }

    // Set user information in the session to mark them as logged in
    req.session.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'recruiter' // Explicitly define the role for authentication/authorization
    };

    req.session.success = `Welcome back, ${user.name}!`;
    res.redirect('/jobs'); // Redirect to the jobs listing page (dashboard for recruiters)
};

// GET: Handle user logout
exports.logout = (req, res) => {
    // Destroy the session to log the user out
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            // Optionally, handle the error gracefully, maybe redirect to a generic error page
            return res.redirect('/jobs'); // Fallback if session destruction fails
        }
        res.redirect('/'); // Redirect to the login/home page after logout
    });
};

// Middleware: Check if the user is authenticated and is a recruiter
exports.isAuthenticatedRecruiter = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'recruiter') {
        // If authenticated as a recruiter, proceed to the next middleware/route handler
        return next();
    }
    // If not authenticated or not a recruiter, store error and redirect to login
    req.session.errors = [{ msg: 'Please login as a recruiter to access this page.' }];
    res.redirect('/');
};

// Middleware: Redirect logged-in users from login/register pages
exports.redirectIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
        // If a user is already logged in, redirect them to the jobs page
        return res.redirect('/jobs');
    }
    // If not logged in, proceed to the next middleware/route handler (e.g., render login/register page)
    next();
};
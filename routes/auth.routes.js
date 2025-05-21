// routes/auth.routes.js

const express = require('express');
const { body } = require('express-validator'); // For validating request bodies
const authController = require('../controllers/auth.controller'); // Import auth controller functions

const router = express.Router(); // Create an Express router instance

// GET / - Renders the login page.
// Uses redirectIfLoggedIn middleware to prevent logged-in users from seeing login/register forms.
router.get('/', authController.redirectIfLoggedIn, authController.getLoginPage);

// GET /register - Renders the registration page.
// Uses redirectIfLoggedIn middleware.
router.get('/register', authController.redirectIfLoggedIn, authController.getRegisterPage);

// POST /register - Handles recruiter registration.
// Includes express-validator middleware to validate input fields.
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Invalid email format.').normalizeEmail(), // Validates email and normalizes it
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], authController.registerRecruiter);

// POST /login - Handles recruiter login.
// Includes express-validator middleware for input validation.
router.post('/login', [
    body('email').isEmail().withMessage('Invalid email format.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.') // Password cannot be empty
], authController.loginRecruiter);

// GET /logout - Handles user logout.
router.get('/logout', authController.logout);

module.exports = router; // Export the router to be used in app.js
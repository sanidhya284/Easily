// routes/job.routes.js

const express = require('express');
const { body } = require('express-validator');
const jobController = require('../controllers/job.controller'); // Import job controller functions
const authController = require('../controllers/auth.controller'); // Import authentication middleware

const router = express.Router(); // Create an Express router instance

// --- Public Routes (Accessible to anyone) ---

// GET /jobs - Display all job listings
router.get('/', jobController.getAllJobs);

// *******************************************************************
// *** CRUCIAL CHANGE: MOVE '/new' ROUTE BEFORE '/:id' ROUTE ***
// *******************************************************************

// GET /jobs/new - Render the form to post a new job
router.get('/new', authController.isAuthenticatedRecruiter, jobController.getNewJobForm);

// GET /jobs/:id - Display details of a specific job
router.get('/:id', jobController.getJobDetails);

// *******************************************************************
// *** END OF CRUCIAL CHANGE ***
// *******************************************************************


// POST /jobs/apply/:id - Handle job application submission (includes resume upload)
router.post('/apply/:id', [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Invalid email format.').normalizeEmail(),
    body('contact').trim().isLength({ min: 10, max: 15 }).withMessage('Contact must be 10-15 digits.')
], jobController.applyToJob);


// --- Protected Routes (Recruiter Only - requires authentication) ---

// POST /jobs - Handle new job posting submission
router.post('/', authController.isAuthenticatedRecruiter, [
    body('jobCategory').trim().notEmpty().withMessage('Job Category is required.'),
    body('jobDesignation').trim().notEmpty().withMessage('Job Designation is required.'),
    body('jobLocation').trim().notEmpty().withMessage('Job Location is required.'),
    body('companyName').trim().notEmpty().withMessage('Company Name is required.'),
    body('salary').isFloat({ gt: 0 }).withMessage('Salary must be a positive number.'),
    body('applyBy').isISO8601().toDate().withMessage('Apply By date must be a valid date.'),
    body('skillsRequired').trim().notEmpty().withMessage('Skills Required are required.'), // Will be comma-separated string
    body('numberOfOpening').isInt({ gt: 0 }).withMessage('Number of Openings must be a positive integer.')
], jobController.createNewJob);

// GET /jobs/:id/update - Render the form to update a job (pre-filled)
router.get('/:id/update', authController.isAuthenticatedRecruiter, jobController.getUpdateJobForm);

// POST /jobs/:id/update - Handle job update submission (using POST as per project spec)
router.post('/:id/update', authController.isAuthenticatedRecruiter, [
    // Validation rules (similar to create job)
    body('jobCategory').trim().notEmpty().withMessage('Job Category is required.'),
    body('jobDesignation').trim().notEmpty().withMessage('Job Designation is required.'),
    body('jobLocation').trim().notEmpty().withMessage('Job Location is required.'),
    body('companyName').trim().notEmpty().withMessage('Company Name is required.'),
    body('salary').isFloat({ gt: 0 }).withMessage('Salary must be a positive number.'),
    body('applyBy').isISO8601().toDate().withMessage('Apply By date must be a valid date.'),
    body('skillsRequired').trim().notEmpty().withMessage('Skills Required are required.'),
    body('numberOfOpening').isInt({ gt: 0 }).withMessage('Number of Openings must be a positive integer.')
], jobController.updateJob);


// POST /jobs/:id/delete - Handle job deletion (using POST for simplicity with forms)
router.post('/:id/delete', authController.isAuthenticatedRecruiter, jobController.deleteJob);


// GET /jobs/:id/applicants - Display all applicants for a specific job
router.get('/:id/applicants', authController.isAuthenticatedRecruiter, jobController.getApplicantsForJob);


module.exports = router; // Export the router
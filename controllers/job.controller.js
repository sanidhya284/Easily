// controllers/job.controller.js

const Job = require('../models/job.model'); // Import the Job model
const { validationResult } = require('express-validator'); // For input validation
const authController = require('./auth.controller'); // Import auth middleware
const multer = require('multer'); // For file uploads
const nodemailer = require('nodemailer'); // For sending emails
const path = require('path'); // For path manipulation

// --- Multer Configuration for Resume Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the directory where resumes will be stored
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: function (req, file, cb) {
        // Create a unique file name for the resume
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
    fileFilter: function (req, file, cb) {
        // Allow only PDF, DOC, DOCX file types
        const filetypes = /pdf|doc|docx/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only PDF, DOC, and DOCX files are allowed!');
        }
    }
}).single('resume'); // 'resume' is the name of the input field in the form

// --- Nodemailer Transporter Configuration ---
// Replace with your actual email service credentials (e.g., Gmail, SendGrid, etc.)
// For Gmail, you might need to enable "Less secure app access" or use App Passwords.
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'sendgrid', etc.
    auth: {
        user: 'your_email@gmail.com', // !!! IMPORTANT: Replace with your email address
        pass: 'your_email_password'   // !!! IMPORTANT: Replace with your email password or app password
    }
});

// --- Job Listing and Details ---

// GET: Display all job listings
exports.getAllJobs = (req, res) => {
    let jobs = Job.findAll(); // Get all jobs

    // Implement search functionality (optional, but good for scoring)
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
    if (searchQuery) {
        jobs = jobs.filter(job =>
            job.jobDesignation.toLowerCase().includes(searchQuery) ||
            job.companyName.toLowerCase().includes(searchQuery) ||
            job.jobLocation.toLowerCase().includes(searchQuery) ||
            job.skillsRequired.some(skill => skill.toLowerCase().includes(searchQuery))
        );
    }

    // You could implement pagination here if needed
    res.render('layouts/main', {
        title: 'All Job Listings',
        body: '../jobs/jobListings',
        jobs: jobs,
        searchQuery: searchQuery // Pass search query back to the template
    });
};

// GET: Display details of a specific job
exports.getJobDetails = (req, res) => {
    const jobId = req.params.id;
    const job = Job.findById(jobId);

    if (!job) {
        // If job not found, store error and redirect to job listings
        req.session.errors = [{ msg: 'Job not found.' }];
        return res.redirect('/jobs');
    }

    res.render('layouts/main', {
        title: job.jobDesignation + ' Details',
        body: '../jobs/jobDetails',
        job: job
    });
};

// --- Job Creation (Recruiter Only) ---

// GET: Render the new job posting form
exports.getNewJobForm = (req, res) => {
    res.render('layouts/main', {
        title: 'Post New Job',
        body: '../jobs/newJob',
        // Pass empty job object for rendering form with no initial values
        job: null
    });
};

// POST: Handle new job posting submission
exports.createNewJob = (req, res) => {
    // Collect validation errors
    console.log("SERVER LOG: createNewJob function reached."); // NEW: Add this very first log
    console.log("SERVER LOG: req.method:", req.method); // NEW: Check HTTP method
    console.log("SERVER LOG: req.url:", req.url); // NEW: Check URL being hit
    console.log("SERVER LOG: req.body:", req.body); // NEW: Check request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        // Render the form again with old inputs and errors
        return res.render('layouts/main', {
            title: 'Post New Job',
            body: '../jobs/newJob',
            job: req.body // Pass back the entered data
        });
    }

    const {
        jobCategory, jobDesignation, jobLocation,
        companyName, salary, applyBy, skillsRequired, numberOfOpening
    } = req.body;

    // Ensure skillsRequired is an array (from comma-separated string)
    const skillsArray = skillsRequired ? skillsRequired.split(',').map(s => s.trim()) : [];

    // The recruiterId is from the logged-in session
    const recruiterId = req.session.user._id;

    const newJob = Job.save({
        jobCategory, jobDesignation, jobLocation,
        companyName, salary, applyBy, skillsRequired: skillsArray, numberOfOpening,
        recruiterId
    });

    req.session.success = 'Job posted successfully!';
    res.redirect('/jobs/' + newJob._id); // Redirect to the newly created job's details page
};

// --- Job Update (Recruiter Only) ---

// GET: Render the update job form with pre-filled data
exports.getUpdateJobForm = (req, res) => {
    const jobId = req.params.id;
    const job = Job.findById(jobId);

    if (!job) {
        req.session.errors = [{ msg: 'Job not found for update.' }];
        return res.redirect('/jobs');
    }

    // Authorization check: Only the recruiter who posted can update
    if (job.recruiterId !== req.session.user._id) {
        req.session.errors = [{ msg: 'You are not authorized to update this job.' }];
        return res.redirect('/jobs');
    }

    res.render('layouts/main', {
        title: 'Update Job: ' + job.jobDesignation,
        body: '../jobs/updateJob',
        job: job
    });
};

// POST: Handle job update submission
exports.updateJob = (req, res) => {
    const jobId = req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        // If errors, re-render the update form with current job data and errors
        const job = Job.findById(jobId); // Fetch job again to pass current data
        return res.render('layouts/main', {
            title: 'Update Job: ' + (job ? job.jobDesignation : ''),
            body: '../jobs/updateJob',
            job: { ...job, ...req.body, _id: jobId } // Merge current data with submitted data and ID
        });
    }

    const {
        jobCategory, jobDesignation, jobLocation,
        companyName, salary, applyBy, skillsRequired, numberOfOpening
    } = req.body;

    const skillsArray = skillsRequired ? skillsRequired.split(',').map(s => s.trim()) : [];

    const job = Job.findById(jobId);

    if (!job) {
        req.session.errors = [{ msg: 'Job not found for update.' }];
        return res.redirect('/jobs');
    }

    // Authorization check before updating
    if (job.recruiterId !== req.session.user._id) {
        req.session.errors = [{ msg: 'You are not authorized to update this job.' }];
        return res.redirect('/jobs');
    }

    const updatedJob = Job.update(jobId, {
        jobCategory, jobDesignation, jobLocation,
        companyName, salary, applyBy, skillsRequired: skillsArray, numberOfOpening
    });

    if (updatedJob) {
        req.session.success = 'Job updated successfully!';
        res.redirect('/jobs/' + updatedJob._id); // Redirect to updated job details
    } else {
        req.session.errors = [{ msg: 'Failed to update job.' }];
        res.redirect('/jobs');
    }
};

// POST: Handle job deletion
exports.deleteJob = (req, res) => {
    const jobId = req.params.id;
    const job = Job.findById(jobId);

    if (!job) {
        req.session.errors = [{ msg: 'Job not found for deletion.' }];
        return res.redirect('/jobs');
    }

    // Authorization check before deleting
    if (job.recruiterId !== req.session.user._id) {
        req.session.errors = [{ msg: 'You are not authorized to delete this job.' }];
        return res.redirect('/jobs');
    }

    const deleted = Job.delete(jobId);

    if (deleted) {
        req.session.success = 'Job deleted successfully!';
    } else {
        req.session.errors = [{ msg: 'Failed to delete job.' }];
    }
    res.redirect('/jobs'); // Redirect to all jobs page after deletion
};

// --- Job Application (Job Seeker) ---

// POST: Handle job application submission with resume upload
exports.applyToJob = (req, res) => {
    const jobId = req.params.id;

    // Use Multer middleware to handle file upload
    upload(req, res, async (err) => { // 'async' is used because Nodemailer is async
        if (err instanceof multer.MulterError) {
            req.session.errors = [{ msg: err.message }];
            return res.redirect('/jobs/' + jobId);
        } else if (err) {
            req.session.errors = [{ msg: err }]; // Custom file filter errors
            return res.redirect('/jobs/' + jobId);
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.session.errors = errors.array();
            return res.redirect('/jobs/' + jobId);
        }

        const { name, email, contact } = req.body;
        const resumePath = req.file ? '/uploads/' + req.file.filename : null; // Path to saved resume

        if (!resumePath) {
            req.session.errors = [{ msg: 'Resume upload failed or no file selected.' }];
            return res.redirect('/jobs/' + jobId);
        }

        const applicantData = { name, email, contact, resumePath };
        const newApplicant = Job.addApplicant(jobId, applicantData);

        if (newApplicant) {
            req.session.success = 'Application submitted successfully!';

            // --- Send Confirmation Email (Nodemailer) ---
            const mailOptions = {
                from: 'your_email@gmail.com', // Your email address
                to: email, // Applicant's email address
                subject: 'Job Application Confirmation - Easily Job Portal',
                html: `
                    <p>Dear ${name},</p>
                    <p>Thank you for applying to the job role at Easily Job Portal.</p>
                    <p>Your application for the position of <strong>${Job.findById(jobId).jobDesignation}</strong> at <strong>${Job.findById(jobId).companyName}</strong> has been received.</p>
                    <p>We will review your application and get back to you soon.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Easily Job Portal Team</p>
                `
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log('Confirmation email sent to:', email);
            } catch (mailError) {
                console.error('Error sending confirmation email:', mailError);
                // Optionally store an error for the user that email sending failed
            }

            res.redirect('/jobs/' + jobId); // Redirect to job details page
        } else {
            req.session.errors = [{ msg: 'Failed to submit application. Job might not exist.' }];
            res.redirect('/jobs');
        }
    });
};

// --- View Applicants for a Job (Recruiter Only) ---

// GET: Display all applicants for a specific job
exports.getApplicantsForJob = (req, res) => {
    const jobId = req.params.id;
    const job = Job.findById(jobId);

    if (!job) {
        req.session.errors = [{ msg: 'Job not found.' }];
        return res.redirect('/jobs');
    }

    // Authorization check: Only the recruiter who posted can view applicants
    if (job.recruiterId !== req.session.user._id) {
        req.session.errors = [{ msg: 'You are not authorized to view applicants for this job.' }];
        return res.redirect('/jobs');
    }

    res.render('layouts/main', {
        title: 'Applicants for ' + job.jobDesignation,
        body: '../applicants/applicantList',
        job: job, // Pass the job object which contains the applicants array
        applicants: job.applicants // Explicitly pass applicants for clarity
    });
};

// Placeholder for delete applicant (if needed, though not explicitly in API structure)
// exports.deleteApplicant = (req, res) => {
//     const jobId = req.params.jobId;
//     const applicantId = req.params.applicantId;
//     const job = Job.findById(jobId);

//     if (!job) {
//         req.session.errors = [{ msg: 'Job not found.' }];
//         return res.redirect('/jobs');
//     }

//     if (job.recruiterId !== req.session.user._id) {
//         req.session.errors = [{ msg: 'You are not authorized to modify this job\'s applicants.' }];
//         return res.redirect('/jobs');
//     }

//     const deleted = Job.deleteApplicant(jobId, applicantId);

//     if (deleted) {
//         req.session.success = 'Applicant removed successfully.';
//     } else {
//         req.session.errors = [{ msg: 'Failed to remove applicant.' }];
//     }
//     res.redirect('/jobs/' + jobId + '/applicants');
// };
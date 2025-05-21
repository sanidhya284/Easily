// models/job.model.js

let jobs = []; // Array to store job objects
let nextJobId = 1; // Simple ID counter

// Function to generate a unique ID for new jobs
function generateUniqueId() {
    const currentId = nextJobId;
    nextJobId++;
    console.log("DEBUG: Generating new Job ID:", currentId); // Log ID generation
    return currentId;
}

class Job {
    // Constructor to create a new Job instance
    constructor(jobCategory, jobDesignation, jobLocation, companyName, salary, applyBy, skillsRequired, numberOfOpening, recruiterId) {
        this._id = generateUniqueId(); // Assign a unique ID
        this.jobCategory = jobCategory;
        this.jobDesignation = jobDesignation;
        this.jobLocation = jobLocation;
        this.companyName = companyName;
        this.salary = salary;
        this.applyBy = applyBy; // Application deadline
        this.skillsRequired = skillsRequired; // Array of skills
        this.numberOfOpening = numberOfOpening;
        this.jobPosted = new Date(); // Date and time when the job was posted
        this.applicants = []; // Array to store applicant objects for THIS specific job
        this.recruiterId = recruiterId; // ID of the recruiter who posted this job
        console.log("DEBUG: New Job instance created in constructor:", this); // Log new job object
    }

    // Static method to get all job listings
    static findAll() {
        console.log("DEBUG: Job.findAll() called. Current jobs array length:", jobs.length); // Log current array size
        return jobs;
    }

    // Static method to find a job by its ID
    static findById(id) {
        const parsedId = parseInt(id, 10); // Ensure ID is treated as a number (base 10)
        console.log(`DEBUG: Job.findById() called for ID: ${id} (parsed as ${parsedId})`); // Log find attempt
        const foundJob = jobs.find(job => job._id === parsedId);
        if (foundJob) {
            console.log("DEBUG: Job found by ID:", foundJob); // Log if found
        } else {
            console.log("DEBUG: Job NOT found for ID:", parsedId); // Log if not found
        }
        return foundJob;
    }

    // Static method to save a new job to the in-memory array
    static save(jobData) {
        console.log("DEBUG: Job.save() called with data:", jobData); // Log data being saved
        const newJob = new Job(
            jobData.jobCategory,
            jobData.jobDesignation,
            jobData.jobLocation,
            jobData.companyName,
            jobData.salary,
            jobData.applyBy,
            jobData.skillsRequired,
            jobData.numberOfOpening,
            jobData.recruiterId
        );
        jobs.push(newJob); // Add the new job to our array
        console.log("DEBUG: Job saved. Current jobs array (after save):", jobs); // Log the entire array after save
        return newJob; // Return the newly created job object
    }

    // Static method to update an existing job by ID
    static update(id, updatedData) {
        const parsedId = parseInt(id, 10);
        console.log(`DEBUG: Job.update() called for ID: ${id} (parsed as ${parsedId}) with data:`, updatedData);
        const jobIndex = jobs.findIndex(job => job._id === parsedId);
        if (jobIndex !== -1) {
            // Preserve applicants array if not explicitly updated
            const existingApplicants = jobs[jobIndex].applicants;
            jobs[jobIndex] = { ...jobs[jobIndex], ...updatedData, applicants: existingApplicants };
            console.log("DEBUG: Job updated. Current jobs array (after update):", jobs);
            return jobs[jobIndex]; // Return the updated job object
        }
        console.log("DEBUG: Could not update job. Job not found for ID:", parsedId);
        return null; // Return null if job not found
    }

    // Static method to delete a job by ID
    static delete(id) {
        const parsedId = parseInt(id, 10);
        console.log(`DEBUG: Job.delete() called for ID: ${id} (parsed as ${parsedId})`);
        const initialLength = jobs.length;
        jobs = jobs.filter(job => job._id !== parsedId); // Filter out the job to be deleted
        console.log("DEBUG: Job deletion attempt. New jobs array length:", jobs.length);
        return jobs.length < initialLength; // Returns true if a job was actually removed
    }

    // --- Applicant related methods (integrated into Job model as per schema) ---

    // Static method to add an applicant to a specific job
    static addApplicant(jobId, applicantData) {
        const job = Job.findById(jobId); // Use existing findById to get the job
        if (job) {
            const newApplicant = {
                _id: job.applicants.length > 0 ? Math.max(...job.applicants.map(a => a._id)) + 1 : 1, // Simple ID for applicant within job
                name: applicantData.name,
                email: applicantData.email,
                contact: applicantData.contact,
                resumePath: applicantData.resumePath, // Path to uploaded resume
                appliedDate: new Date() // Date of application
            };
            job.applicants.push(newApplicant); // Add the applicant to the job's applicants array
            console.log(`DEBUG: Applicant added to job ID ${jobId}. Job's applicants:`, job.applicants);
            return newApplicant;
        }
        console.log("DEBUG: Could not add applicant. Job not found for ID:", jobId);
        return null; // Return null if job not found
    }

    // Static method to find a specific applicant within a job
    static findApplicantById(jobId, applicantId) {
        const job = Job.findById(jobId);
        if (job) {
            const parsedApplicantId = parseInt(applicantId, 10);
            console.log(`DEBUG: Finding applicant ID ${applicantId} (parsed as ${parsedApplicantId}) for job ID ${jobId}`);
            return job.applicants.find(app => app._id === parsedApplicantId);
        }
        return null;
    }

    // Static method to update an applicant within a specific job
    static updateApplicant(jobId, applicantId, updatedApplicantData) {
        const job = Job.findById(jobId);
        if (job) {
            const parsedApplicantId = parseInt(applicantId, 10);
            const applicantIndex = job.applicants.findIndex(app => app._id === parsedApplicantId);
            if (applicantIndex !== -1) {
                job.applicants[applicantIndex] = { ...job.applicants[applicantIndex], ...updatedApplicantData };
                console.log(`DEBUG: Applicant ID ${applicantId} updated for job ID ${jobId}.`);
                return job.applicants[applicantIndex];
            }
        }
        return null;
    }

    // Static method to delete an applicant from a specific job
    static deleteApplicant(jobId, applicantId) {
        const job = Job.findById(jobId);
        if (job) {
            const parsedApplicantId = parseInt(applicantId, 10);
            const initialLength = job.applicants.length;
            job.applicants = job.applicants.filter(app => app._id !== parsedApplicantId);
            console.log(`DEBUG: Applicant ID ${applicantId} deletion attempt for job ID ${jobId}. New applicants length:`, job.applicants.length);
            return job.applicants.length < initialLength; // True if applicant was removed
        }
        return false;
    }
}

module.exports = Job; // Export the Job class for use in controllers
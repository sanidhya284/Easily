// models/user.model.js

// This array will act as our in-memory "database" for users (recruiters)
let users = [];
let nextUserId = 1; // Simple counter for unique IDs

// Function to generate a unique ID for new users
function generateUniqueId() {
    return nextUserId++;
}

class User {
    // Constructor to create a new User instance
    constructor(name, email, password) {
        this._id = generateUniqueId(); // Assign a unique ID
        this.name = name;
        this.email = email;
        this.password = password; // WARNING: In a real application, passwords MUST be hashed (e.g., using bcrypt)
    }

    // Static method to get all users
    static findAll() {
        return users;
    }

    // Static method to find a user by their ID
    static findById(id) {
        return users.find(user => user._id === id);
    }

    // Static method to find a user by their email address
    static findByEmail(email) {
        return users.find(user => user.email === email);
    }

    // Static method to save a new user to the in-memory array
    static save(userData) {
        const newUser = new User(userData.name, userData.email, userData.password);
        users.push(newUser); // Add the new user to our array
        return newUser; // Return the newly created user object
    }

    // Static method to update an existing user by ID
    static update(id, updatedData) {
        const userIndex = users.findIndex(user => user._id === id);
        if (userIndex !== -1) {
            // Merge existing user data with updated data
            users[userIndex] = { ...users[userIndex], ...updatedData };
            return users[userIndex]; // Return the updated user object
        }
        return null; // Return null if user not found
    }

    // Static method to delete a user by ID
    static delete(id) {
        const initialLength = users.length;
        users = users.filter(user => user._id !== id); // Filter out the user to be deleted
        return users.length < initialLength; // Returns true if a user was actually removed
    }
}

module.exports = User; // Export the User class for use in controllers
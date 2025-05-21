// public/js/script.js

// This file is currently empty, but you can add client-side JavaScript here
// for features like dynamic form validation, interactive elements, etc.

// Example: Confirmation dialog for delete actions
document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-btn'); // Assuming you add this class to delete buttons

    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const confirmed = confirm('Are you sure you want to delete this item? This action cannot be undone.');
            if (!confirmed) {
                event.preventDefault(); // Stop the form submission or link navigation if not confirmed
            }
        });
    });

    // Example for skills input (dynamic adding/removing of tags)
    const skillsInput = document.getElementById('skillsInput');
    const skillsContainer = document.getElementById('skillsContainer');
    const hiddenSkillsInput = document.getElementById('hiddenSkillsInput');

    if (skillsInput && skillsContainer && hiddenSkillsInput) {
        let skills = []; // Array to store current skills

        // Initialize with existing skills if any (e.g., on update form)
        if (hiddenSkillsInput.value) {
            skills = hiddenSkillsInput.value.split(',').filter(s => s.trim() !== '');
            renderSkills();
        }

        skillsInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault(); // Prevent form submission or comma from being typed
                addSkill(skillsInput.value.trim());
                skillsInput.value = ''; // Clear input field
            }
        });

        function addSkill(skillText) {
            if (skillText && !skills.includes(skillText)) {
                skills.push(skillText);
                renderSkills();
            }
        }

        function removeSkill(skillText) {
            skills = skills.filter(skill => skill !== skillText);
            renderSkills();
        }

        function renderSkills() {
            skillsContainer.innerHTML = ''; // Clear existing tags
            skills.forEach(skill => {
                const span = document.createElement('span');
                span.classList.add('skill-tag');
                span.innerHTML = `${skill} <button type="button" data-skill="${skill}">&times;</button>`;
                skillsContainer.appendChild(span);
            });
            hiddenSkillsInput.value = skills.join(','); // Update hidden input for form submission
        }

        // Event delegation for removing skills
        skillsContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const skillToRemove = event.target.dataset.skill;
                removeSkill(skillToRemove);
            }
        });
    }
});
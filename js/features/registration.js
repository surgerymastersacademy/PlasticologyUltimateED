// js/features/registration.js (FINAL VERSION v3.1)

import { sendPostRequest } from '../api.js';
import { showToast } from '../ui.js';

export function initRegistration() {
    const form = document.getElementById('registration-form');
    const cancelBtn = document.getElementById('register-cancel-btn');
    
    if (form) {
        form.addEventListener('submit', handleRegistration);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('registration-modal').classList.add('hidden');
            document.getElementById('modal-backdrop').classList.add('hidden');
        });
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('register-submit-btn');
    const originalText = submitBtn.textContent;
    const errorMsg = document.getElementById('registration-error');
    
    // Get Values
    const data = {
        eventType: 'registerUser',
        Name: document.getElementById('register-name').value.trim(),
        Username: document.getElementById('register-username').value.trim(),
        Email: document.getElementById('register-email').value.trim(),
        MobileNumber: document.getElementById('register-mobile').value.trim(),
        Password: document.getElementById('register-password').value,
        Country: document.getElementById('register-country').value,
        StudyType: document.getElementById('register-study-type').value,
        ExamDate: document.getElementById('register-exam-date').value
    };

    // Basic Validation
    const confirmPass = document.getElementById('register-confirm-password').value;
    if (data.Password !== confirmPass) {
        showError('Passwords do not match.');
        return;
    }
    if (data.Password.length < 4) {
        showError('Password is too short.');
        return;
    }

    // Loading State
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    errorMsg.classList.add('hidden');

    try {
        const response = await sendPostRequest(data);

        if (response.success) {
            showToast('Registration successful! Please log in.', 'success');
            document.getElementById('registration-modal').classList.add('hidden');
            document.getElementById('modal-backdrop').classList.add('hidden');
            document.getElementById('registration-form').reset();
        } else {
            showError(response.message || 'Registration failed.');
        }
    } catch (error) {
        console.error(error);
        showError('Network error occurred.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }
}

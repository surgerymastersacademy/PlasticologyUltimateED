// js/features/registration.js (NEW FILE)

import * as dom from '../dom.js';
import { registerUser } from '../api.js';

/**
 * Shows the registration modal and resets the form.
 */
export function showRegistrationModal() {
    dom.registrationForm.reset(); // Clear any previous input
    dom.registrationError.classList.add('hidden');
    dom.registrationSuccess.classList.add('hidden');
    dom.modalBackdrop.classList.remove('hidden');
    dom.registrationModal.classList.remove('hidden');
}

/**
 * Hides the registration modal.
 */
export function hideRegistrationModal() {
    dom.modalBackdrop.classList.add('hidden');
    dom.registrationModal.classList.add('hidden');
}

/**
 * Handles the submission of the registration form.
 * @param {Event} event - The form submission event.
 */
export async function handleRegistrationSubmit(event) {
    event.preventDefault();
    const errorEl = dom.registrationError;
    const successEl = dom.registrationSuccess;
    const submitBtn = dom.registerSubmitBtn;

    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    // --- 1. Get form data ---
    const formData = {
        Name: dom.registerName.value.trim(),
        Username: dom.registerUsername.value.trim(),
        Email: dom.registerEmail.value.trim(),
        Password: dom.registerPassword.value,
        ConfirmPassword: dom.registerConfirmPassword.value,
        MobileNumber: dom.registerMobile.value.trim(),
        Country: dom.registerCountry.value.trim(),
        StudyType: dom.registerStudyType.value.trim(),
        ExamDate: dom.registerExamDate.value,
    };

    // --- 2. Client-side validation ---
    if (!formData.Name || !formData.Username || !formData.Email || !formData.Password || !formData.MobileNumber || !formData.Country) {
        errorEl.textContent = 'Please fill in all required fields.';
        errorEl.classList.remove('hidden');
        return;
    }
    if (formData.Password !== formData.ConfirmPassword) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.classList.remove('hidden');
        return;
    }
    if (formData.Password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters long.';
        errorEl.classList.remove('hidden');
        return;
    }

    // --- 3. Send data to the backend ---
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Account...';

    // We don't need to send ConfirmPassword to the backend
    delete formData.ConfirmPassword;

    const result = await registerUser(formData);

    // --- 4. Handle the response ---
    if (result.success) {
        successEl.textContent = result.message + ' You will be redirected to the login page shortly.';
        successEl.classList.remove('hidden');
        dom.registrationForm.reset();
        setTimeout(() => {
            hideRegistrationModal();
        }, 3000); // Hide modal after 3 seconds
    } else {
        errorEl.textContent = result.message || 'An unknown error occurred.';
        errorEl.classList.remove('hidden');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Register';
}

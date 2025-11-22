// js/features/registration.js (FINAL - CORS FIXED)

import * as dom from '../dom.js';
import { registerUser } from '../api.js';

export function showRegistrationModal() {
    dom.registrationForm.reset();
    dom.registrationError.classList.add('hidden');
    dom.registrationSuccess.classList.add('hidden');
    dom.modalBackdrop.classList.remove('hidden');
    dom.registrationModal.classList.remove('hidden');
}

export function hideRegistrationModal() {
    dom.modalBackdrop.classList.add('hidden');
    dom.registrationModal.classList.add('hidden');
}

export async function handleRegistrationSubmit(event) {
    event.preventDefault();
    const errorEl = dom.registrationError;
    const successEl = dom.registrationSuccess;
    const submitBtn = dom.registerSubmitBtn;

    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

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

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Account...';

    delete formData.ConfirmPassword;

    // استدعاء آمن عبر api.js
    const result = await registerUser(formData);

    if (result.success) {
        successEl.textContent = result.message + ' You will be redirected to the login page shortly.';
        successEl.classList.remove('hidden');
        dom.registrationForm.reset();
        setTimeout(() => {
            hideRegistrationModal();
        }, 3000);
    } else {
        errorEl.textContent = result.message || 'An unknown error occurred.';
        errorEl.classList.remove('hidden');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Register';
}

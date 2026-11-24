document.addEventListener('DOMContentLoaded', () => {
    // --- Password Visibility Toggles ---
    const toggleButtons = document.querySelectorAll('.password-toggle');
    toggleButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target') || 'password';
            const targetInput = document.getElementById(targetId);
            if (!targetInput) return;

            const isPassword = targetInput.getAttribute('type') === 'password';
            targetInput.setAttribute('type', isPassword ? 'text' : 'password');

            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            }
        });
    });

    // --- Unified Form Handler ---
    const authForm = document.getElementById('auth-form');
    const errorBox = document.getElementById('error-box');
    const submitBtn = document.getElementById('submitBtn');

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showError('');

            const formType = authForm.getAttribute('data-type'); // 'login' or 'signup'
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const nameInput = document.getElementById('name');

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const name = nameInput ? nameInput.value.trim() : '';

            // Client-side validations
            if (formType === 'signup') {
                if (!name) {
                    showError('Please enter your full name or representative identity.');
                    return;
                }
                if (password.length < 6) {
                    showError('Password must be at least 6 characters in length.');
                    return;
                }
            }

            if (!email || !password) {
                showError('Please complete all required fields.');
                return;
            }

            setLoading(true, formType);

            try {
                const endpoint = formType === 'signup' ? '/api/auth/register' : '/api/auth/login';
                const payload = formType === 'signup'
                    ? { name, email, password }
                    : { email, password };

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || (formType === 'signup' ? 'Registration failed.' : 'Login failed.'));
                }

                // Auth success: redirect to index
                window.location.href = '/profile';
            } catch (err) {
                showError(err.message);
                setLoading(false, formType);
            }
        });
    }

    function showError(msg) {
        if (!errorBox) return;
        if (!msg) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        } else {
            errorBox.style.display = 'flex';
            errorBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${msg}</span>`;
        }
    }

    function setLoading(isLoading, type) {
        if (!submitBtn) return;
        const defaultText = type === 'signup' ? 'Create Account' : 'Sign In';
        const activeText = type === 'signup' ? 'Creating Account...' : 'Signing In...';

        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>${activeText}</span>`;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>${defaultText}</span> <i class="fa-solid fa-arrow-right"></i>`;
        }
    }
});
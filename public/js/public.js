document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    const tabs = document.querySelectorAll('.profile-nav .nav-item');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const activePanel = document.getElementById(`tab-${target}`);
            if (activePanel) activePanel.classList.add('active');

            if (target === 'orders') {
                renderProfileCart();
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/auth/logout', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    window.location.href = data.redirectUrl || '/login';
                }
            } catch (e) {
                window.location.href = '/login';
            }
        });
    }

    // Profile Cart Preview
    function renderProfileCart() {
        const container = document.getElementById('profileCartContainer');
        const cart = JSON.parse(localStorage.getItem('roinax_cart')) || [];

        if (cart.length === 0) {
            container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-basket-shopping"></i></div>
                        <h3>Your Basket is Empty</h3>
                        <p>Browse our corporate enterprise packages and add solutions to your workspace.</p>
                        <a href="/buy-now" class="btn btn-green">Explore Packages</a>
                    </div>`;
            return;
        }

        let html = '<div class="profile-cart-list">';
        let total = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            html += `
                    <div class="profile-cart-item">
                        <div>
                            <h4>${item.name}</h4>
                            <p>Quantity: ${item.qty} × ₹${item.price.toLocaleString('en-IN')}</p>
                        </div>
                        <span class="profile-cart-price">₹${itemTotal.toLocaleString('en-IN')}</span>
                    </div>`;
        });

        const tax = Math.round(total * 0.18);
        const grandTotal = total + tax;

        html += `
                <div class="profile-cart-total">
                    <div><strong>Total (Incl. 18% GST):</strong></div>
                    <div class="total-val">₹${grandTotal.toLocaleString('en-IN')}</div>
                </div>
                <div style="margin-top: 18px;">
                    <a href="/buy-now" class="btn btn-green">Review & Finalize Order</a>
                </div>
            </div>`;

        container.innerHTML = html;
    }

    // Account Name Update
    const accountForm = document.getElementById('accountForm');
    const accountAlert = document.getElementById('account-alert');

    if (accountForm) {
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            accountAlert.style.display = 'none';

            const name = document.getElementById('profileName').value;

            try {
                const res = await fetch('/api/auth/update-profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                const data = await res.json();

                accountAlert.textContent = data.message;
                accountAlert.className = `auth-alert ${data.success ? 'success' : 'error'}`;
                accountAlert.style.display = 'block';

                if (data.success) {
                    setTimeout(() => window.location.reload(), 900);
                }
            } catch (err) {
                accountAlert.textContent = 'Network error updating profile.';
                accountAlert.className = 'auth-alert error';
                accountAlert.style.display = 'block';
            }
        });
    }
});
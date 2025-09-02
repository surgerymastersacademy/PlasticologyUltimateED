// js/admin.js (NEW FILE)

// Note: We are using the same API_URL as the main application
const API_URL = 'https://script.google.com/macros/s/AKfycbxS4JqdtlcCud_OO3zlWVeCQAUwg2Al1xG3QqITq24vEI5UolL5YL_W1kfnC5soOaiFcQ/exec';

// --- DOM ELEMENTS ---
const dom = {
    loginScreen: document.getElementById('admin-login-screen'),
    loginForm: document.getElementById('admin-login-form'),
    passwordInput: document.getElementById('admin-password'),
    loginError: document.getElementById('admin-login-error'),
    adminConsole: document.getElementById('admin-console'),
    loader: document.getElementById('loader'),
    navLinks: {
        dashboard: document.getElementById('nav-dashboard'),
        users: document.getElementById('nav-users'),
        messages: document.getElementById('nav-messages'),
        announcements: document.getElementById('nav-announcements'),
    },
    sections: {
        dashboard: document.getElementById('dashboard-section'),
        users: document.getElementById('users-section'),
        messages: document.getElementById('messages-section'),
        announcements: document.getElementById('announcements-section'),
    },
    usersTableBody: document.getElementById('users-table-body'),
    userSearchInput: document.getElementById('user-search'),
    messagesList: document.getElementById('messages-list'),
    editUserModal: document.getElementById('edit-user-modal'),
    editUserForm: document.getElementById('edit-user-form'),
    editUserName: document.getElementById('edit-user-name'),
};

// --- APP STATE ---
const adminState = {
    isAuthenticated: false,
    adminPassword: '',
    currentView: 'dashboard',
    allUsers: [],
    allMessages: [],
    // Add other data stores as needed
};

// --- API FUNCTIONS ---

async function verifyAdminPassword(password) {
    const payload = {
        eventType: 'adminLogin',
        password: password
    };
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.json();
}

async function fetchAdminData() {
    dom.loader.classList.remove('hidden');
    // In a real app, you'd use a session token. For simplicity, we pass the password.
    const response = await fetch(`${API_URL}?request=adminData&password=${adminState.adminPassword}`);
    const data = await response.json();
    dom.loader.classList.add('hidden');
    return data;
}

// --- RENDERING FUNCTIONS ---

function renderUsersTable(usersToRender) {
    dom.usersTableBody.innerHTML = '';
    if (!usersToRender || usersToRender.length === 0) {
        dom.usersTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">No users found.</td></tr>`;
        return;
    }

    const tableHeaders = `
        <tr>
            <th class="p-3">Name</th>
            <th class="p-3">Username</th>
            <th class="p-3">Role</th>
            <th class="p-3">Subscription End</th>
            <th class="p-3">Access</th>
            <th class="p-3">Actions</th>
        </tr>`;
    dom.usersTableBody.parentElement.querySelector('thead').innerHTML = tableHeaders;

    usersToRender.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600';
        
        const expiryDate = user.SubscriptionEndDate ? new Date(user.SubscriptionEndDate).toLocaleDateString('en-GB') : 'N/A';
        const isExpired = user.SubscriptionEndDate && new Date() > new Date(user.SubscriptionEndDate);
        
        row.innerHTML = `
            <td class="p-3">${user.Name || 'N/A'}</td>
            <td class="p-3 font-mono">${user.Username}</td>
            <td class="p-3">${user.Role}</td>
            <td class="p-3 ${isExpired ? 'text-red-500' : ''}">${expiryDate}</td>
            <td class="p-3">${user.AccessGranted ? '<span class="text-green-500">Enabled</span>' : '<span class="text-red-500">Disabled</span>'}</td>
            <td class="p-3">
                <button class="edit-user-btn text-blue-500 hover:underline" data-userid="${user.UniqueID}">Edit</button>
            </td>
        `;
        dom.usersTableBody.appendChild(row);
    });

    // Add event listeners for the new edit buttons
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', handleEditUserClick);
    });
}

// Placeholder for other render functions
function renderDashboard() {
    const totalUsers = adminState.allUsers.length;
    const trialUsers = adminState.allUsers.filter(u => u.Role === 'Trial').length;
    const activeSubscriptions = adminState.allUsers.filter(u => u.Role === 'Full Course' && new Date(u.SubscriptionEndDate) > new Date()).length;

    dom.sections.dashboard.innerHTML = `
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Dashboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h3 class="text-slate-500 dark:text-slate-400">Total Users</h3>
                <p class="text-3xl font-bold text-slate-800 dark:text-white">${totalUsers}</p>
            </div>
            <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h3 class="text-slate-500 dark:text-slate-400">Trial Accounts</h3>
                <p class="text-3xl font-bold text-slate-800 dark:text-white">${trialUsers}</p>
            </div>
            <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h3 class="text-slate-500 dark:text-slate-400">Active Subscriptions</h3>
                <p class="text-3xl font-bold text-slate-800 dark:text-white">${activeSubscriptions}</p>
            </div>
        </div>
    `;
}


// --- EVENT HANDLERS & LOGIC ---

function showSection(sectionId) {
    adminState.currentView = sectionId;
    // Hide all sections
    for (const key in dom.sections) {
        dom.sections[key].classList.add('hidden');
    }
    // Show the active section
    dom.sections[sectionId].classList.remove('hidden');

    // Update sidebar active state
    for (const key in dom.navLinks) {
        dom.navLinks[key].classList.remove('active');
    }
    dom.navLinks[sectionId].classList.add('active');
}

function handleEditUserClick(event) {
    const userId = event.target.dataset.userid;
    const user = adminState.allUsers.find(u => u.UniqueID === userId);
    if (!user) return;

    dom.editUserName.textContent = user.Name || user.Username;
    dom.editUserForm.innerHTML = `
        <input type="hidden" name="UniqueID" value="${user.UniqueID}">
        <div>
            <label class="block mb-1 dark:text-slate-300">Role</label>
            <select name="Role" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white">
                <option value="Trial" ${user.Role === 'Trial' ? 'selected' : ''}>Trial</option>
                <option value="Full Course" ${user.Role === 'Full Course' ? 'selected' : ''}>Full Course</option>
                </select>
        </div>
        <div>
            <label class="block mb-1 dark:text-slate-300">Subscription End Date</label>
            <input type="date" name="SubscriptionEndDate" value="${user.SubscriptionEndDate ? new Date(user.SubscriptionEndDate).toISOString().split('T')[0] : ''}" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white">
        </div>
        <div>
            <label class="block mb-1 dark:text-slate-300">Access Granted</label>
            <select name="AccessGranted" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white">
                <option value="TRUE" ${user.AccessGranted ? 'selected' : ''}>Enabled</option>
                <option value="FALSE" ${!user.AccessGranted ? 'selected' : ''}>Disabled</option>
            </select>
        </div>
        <div class="flex justify-end gap-4 pt-4">
            <button type="button" id="edit-user-cancel" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
        </div>
    `;
    dom.editUserModal.classList.remove('hidden');
    
    document.getElementById('edit-user-cancel').addEventListener('click', () => {
        dom.editUserModal.classList.add('hidden');
    });
}

async function initializeConsole() {
    const data = await fetchAdminData();
    if (data.error) {
        alert("Failed to fetch admin data: " + data.error);
        return;
    }
    adminState.allUsers = data.users || [];
    adminState.allMessages = data.messages || [];

    // Initial render
    renderDashboard();
    renderUsersTable(adminState.allUsers);
    // renderMessages(); // We will build this next
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    dom.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = dom.passwordInput.value;
        const result = await verifyAdminPassword(password);

        if (result.success) {
            adminState.isAuthenticated = true;
            adminState.adminPassword = password;
            dom.loginScreen.classList.add('hidden');
            dom.adminConsole.classList.remove('hidden');
            initializeConsole();
        } else {
            dom.loginError.textContent = result.message || 'Incorrect password.';
            dom.loginError.classList.remove('hidden');
        }
    });

    // Sidebar navigation
    for (const key in dom.navLinks) {
        dom.navLinks[key].addEventListener('click', (e) => {
            e.preventDefault();
            showSection(key);
        });
    }

    // User search
    dom.userSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = adminState.allUsers.filter(user => 
            (user.Name && user.Name.toLowerCase().includes(searchTerm)) ||
            (user.Username && user.Username.toLowerCase().includes(searchTerm)) ||
            (user['E-Mail'] && user['E-Mail'].toLowerCase().includes(searchTerm))
        );
        renderUsersTable(filteredUsers);
    });

    // Add submit handler for the user edit form
    dom.editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const payload = {
            eventType: 'admin_updateUser',
            password: adminState.adminPassword, // Send password for authentication
            userData: data
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            dom.editUserModal.classList.add('hidden');
            alert('User updated successfully!');
            initializeConsole(); // Refresh all data
        } else {
            alert('Error updating user: ' + result.message);
        }
    });
});

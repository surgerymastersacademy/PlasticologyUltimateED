// js/admin.js (FINAL VERSION - With Announcements & Add User)

// NOTE: This should be the same URL from your state.js file
const API_URL = 'https://script.google.com/macros/s/AKfycbzx8gRgbYZw8Rrg348q2dlsRd7yQ9IXUNUPBDUf-Q5Wb9LntLuKY-ozmnbZOOuQsDU_3w/exec';

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
    addUserBtn: document.getElementById('add-user-btn'),
    messagesList: document.getElementById('messages-list'),
    editUserModal: document.getElementById('edit-user-modal'),
    editUserForm: document.getElementById('edit-user-form'),
    editUserName: document.getElementById('edit-user-name'),
    announcements: {
        form: document.getElementById('add-announcement-form'),
        textInput: document.getElementById('announcement-text'),
        activeCheckbox: document.getElementById('announcement-active'),
        list: document.getElementById('announcements-list'),
    },
    addUserModal: document.getElementById('add-user-modal'),
    addUserForm: document.getElementById('add-user-form'),
    addUserCancelBtn: document.getElementById('add-user-cancel-btn'),
};

// --- APP STATE ---
const adminState = {
    isAuthenticated: false,
    adminPassword: '',
    currentView: 'dashboard',
    allUsers: [],
    allMessages: [],
    allLogs: [],
    allAnnouncements: [],
};

// --- API FUNCTIONS ---

async function apiRequest(payload) {
    try {
        const authenticatedPayload = { ...payload, password: adminState.adminPassword };
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(authenticatedPayload),
            redirect: 'follow'
        });
        if (!response.ok) throw new Error('Network error');
        return response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        return { success: false, message: error.message };
    }
}

async function fetchAdminData() {
    dom.loader.classList.remove('hidden');
    Object.values(dom.sections).forEach(s => s.classList.add('hidden'));
    try {
        const response = await fetch(`${API_URL}?request=adminData&password=${adminState.adminPassword}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if(data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        console.error('Fetch Admin Data Error:', error);
        return { error: error.message };
    } finally {
        dom.loader.classList.add('hidden');
    }
}

// --- RENDERING FUNCTIONS ---
function renderAll() {
    renderDashboard();
    renderUsersTable(adminState.allUsers);
    renderMessages();
    renderAnnouncements();
    showSection(adminState.currentView);
}

function renderUsersTable(usersToRender) {
    dom.usersTableBody.innerHTML = '';
    if (!usersToRender || usersToRender.length === 0) {
        dom.usersTableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center">No users found.</td></tr>`;
        return;
    }

    const tableHeaders = `
        <tr>
            <th class="p-3">Name</th>
            <th class="p-3">Username</th>
            <th class="p-3">Role</th>
            <th class="p-3">Subscription End</th>
            <th class="p-3">Access</th>
            <th class="p-3">Total Score</th>
            <th class="p-3">Actions</th>
        </tr>`;
    dom.usersTableBody.parentElement.querySelector('thead').innerHTML = tableHeaders;

    usersToRender.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600';
        
        const expiryDate = user.SubscriptionEndDate ? new Date(user.SubscriptionEndDate).toLocaleDateString('en-GB') : 'N/A';
        const isExpired = user.SubscriptionEndDate && new Date() > new Date(user.SubscriptionEndDate);
        
        const userLogs = adminState.allLogs.filter(log => log.UserID === user.UniqueID);
        const totalScore = userLogs.reduce((acc, log) => acc + (parseInt(log.Score, 10) || 0), 0);

        row.innerHTML = `
            <td class="p-3 font-semibold text-slate-800 dark:text-white">${user.Name || 'N/A'}</td>
            <td class="p-3 font-mono">${user.Username}</td>
            <td class="p-3 font-semibold ${user.Role === 'Trial' ? 'text-orange-500' : ''}">${user.Role}</td>
            <td class="p-3 ${isExpired ? 'text-red-500 font-bold' : ''}">${expiryDate}</td>
            <td class="p-3">${String(user.AccessGranted) === 'true' ? '<span class="text-green-500 font-semibold">Enabled</span>' : '<span class="text-red-500 font-semibold">Disabled</span>'}</td>
            <td class="p-3 font-bold text-blue-600">${totalScore}</td>
            <td class="p-3">
                <button class="edit-user-btn text-blue-500 hover:underline" data-userid="${user.UniqueID}">Edit</button>
                <button class="view-progress-btn text-green-500 hover:underline ml-2" data-userid="${user.UniqueID}">Progress</button>
            </td>
        `;
        dom.usersTableBody.appendChild(row);
    });
}

function renderDashboard() {
    const totalUsers = adminState.allUsers.length;
    const trialUsers = adminState.allUsers.filter(u => u.Role === 'Trial').length;
    const activeSubscriptions = adminState.allUsers.filter(u => u.Role !== 'Trial' && String(u.AccessGranted) === 'true').length;

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

function renderMessages() {
    dom.messagesList.innerHTML = '';
    if (!adminState.allMessages || adminState.allMessages.length === 0) {
        dom.messagesList.innerHTML = `<p class="text-center text-slate-500">No messages found.</p>`
        return;
    }

    const groupedMessages = adminState.allMessages.reduce((acc, msg) => {
        if (!msg.UserID) return acc;
        if (!acc[msg.UserID]) {
            acc[msg.UserID] = { name: msg.UserName, messages: [] };
        }
        acc[msg.UserID].messages.push(msg);
        return acc;
    }, {});

    for (const userId in groupedMessages) {
        const conversation = groupedMessages[userId];
        const container = document.createElement('div');
        container.className = "bg-white dark:bg-slate-800 rounded-lg shadow p-4";
        
        let messagesHtml = conversation.messages.map(msg => {
            const date = new Date(msg.Timestamp).toLocaleString('en-GB');
            let html = '';
            if (msg.UserMessage) {
                html += `<div class="mb-2"><p class="font-semibold">${conversation.name || 'User'} <span class="text-xs text-slate-400">(${date})</span>:</p><p class="pl-2">${msg.UserMessage}</p></div>`;
            }
            if (msg.AdminReply) {
                html += `<div class="mb-2 bg-blue-50 dark:bg-slate-700 p-2 rounded"><p class="font-semibold">Your Reply:</p><p class="pl-2">${msg.AdminReply}</p></div>`;
            }
            return html;
        }).join('');

        container.innerHTML = `
            <h3 class="text-lg font-bold border-b pb-2 mb-2 dark:text-white dark:border-slate-600">${conversation.name} (${userId})</h3>
            <div class="max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-700/50 rounded">${messagesHtml}</div>
            <form class="reply-form mt-4 flex gap-2">
                <input type="hidden" name="UserID" value="${userId}">
                <input type="text" name="AdminReply" class="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="Type your reply..." required>
                <button type="submit" class="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Send</button>
            </form>
        `;
        dom.messagesList.appendChild(container);
    }
}

function renderAnnouncements() {
    dom.announcements.list.innerHTML = '';
    if (!adminState.allAnnouncements || adminState.allAnnouncements.length === 0) {
        dom.announcements.list.innerHTML = `<p class="text-slate-500">No announcements yet.</p>`;
        return;
    }
    
    const sortedAnnouncements = [...adminState.allAnnouncements].sort((a,b) => new Date(b.TimeStamp) - new Date(a.TimeStamp));

    sortedAnnouncements.forEach(ann => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 border-b dark:border-slate-700';
        const isActive = String(ann.IsActive).toLowerCase() === 'true';
        
        item.innerHTML = `
            <div>
                <p class="dark:text-white">${ann.UpdateMessage}</p>
                <p class="text-xs text-slate-400">${new Date(ann.TimeStamp).toLocaleString()}</p>
            </div>
            <div class="flex items-center gap-4">
                <button class="toggle-status-btn px-3 py-1 text-sm rounded ${isActive ? 'bg-green-500 text-white' : 'bg-slate-300'}" data-id="${ann.UniqueID}" data-status="${!isActive}">
                    ${isActive ? 'Active' : 'Inactive'}
                </button>
                <button class="delete-ann-btn text-red-500 hover:text-red-700" data-id="${ann.UniqueID}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        dom.announcements.list.appendChild(item);
    });
}

// --- EVENT HANDLERS & LOGIC ---

function showSection(sectionId) {
    adminState.currentView = sectionId;
    Object.values(dom.sections).forEach(section => section.classList.add('hidden'));
    dom.sections[sectionId].classList.remove('hidden');
    Object.values(dom.navLinks).forEach(link => link.classList.remove('active'));
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
                <option value="TRUE" ${String(user.AccessGranted) === 'true' ? 'selected' : ''}>Enabled</option>
                <option value="FALSE" ${String(user.AccessGranted) !== 'true' ? 'selected' : ''}>Disabled</option>
            </select>
        </div>
        <div class="flex justify-end gap-4 pt-4">
            <button type="button" id="edit-user-cancel" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
        </div>
    `;
    dom.editUserModal.classList.remove('hidden');
}

function handleViewProgressClick(event) {
    const userId = event.target.dataset.userid;
    const user = adminState.allUsers.find(u => u.UniqueID === userId);
    const userLogs = adminState.allLogs.filter(log => log.UserID === userId);
    if (!user) return;

    const totalScore = userLogs.reduce((acc, log) => acc + (parseInt(log.Score, 10) || 0), 0);
    const quizCount = userLogs.length;
    const avgScore = quizCount > 0 ? (totalScore / quizCount).toFixed(1) : 0;
    
    alert(`Progress for ${user.Name}:\n- Quizzes Taken: ${quizCount}\n- Total Score: ${totalScore}\n- Average Score: ${avgScore}`);
}

async function initializeConsole() {
    const data = await fetchAdminData();
    if (data.error) {
        alert("Failed to fetch admin data: " + data.error);
        return;
    }
    adminState.allUsers = data.users || [];
    adminState.allMessages = data.messages || [];
    adminState.allLogs = data.logs || [];
    adminState.allAnnouncements = data.announcements || [];

    renderAll();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Handle Admin Login
    dom.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = dom.passwordInput.value;
        const result = await apiRequest({ eventType: 'adminLogin', password: password });

        if (result.success) {
            adminState.isAuthenticated = true;
            adminState.adminPassword = password;
            dom.loginScreen.classList.add('hidden');
            dom.adminConsole.classList.remove('hidden');
            await initializeConsole();
        } else {
            dom.loginError.textContent = result.message || 'Incorrect password.';
            dom.loginError.classList.remove('hidden');
        }
    });

    // Sidebar navigation
    Object.keys(dom.navLinks).forEach(key => {
        dom.navLinks[key].addEventListener('click', (e) => {
            e.preventDefault();
            showSection(key);
        });
    });

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

    // Handle user edit form submission
    dom.editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const result = await apiRequest({ eventType: 'admin_updateUser', userData: data });

        if (result.success) {
            dom.editUserModal.classList.add('hidden');
            alert('User updated successfully!');
            await initializeConsole();
        } else {
            alert('Error updating user: ' + result.message);
        }
    });
    
    // Handle message reply form submission (using event delegation)
    dom.messagesList.addEventListener('submit', async (e) => {
        if (!e.target.classList.contains('reply-form')) return;
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const result = await apiRequest({ eventType: 'admin_replyToMessage', replyData: data });

        if (result.success) {
            alert('Reply sent!');
            await initializeConsole();
        } else {
            alert('Error sending reply: ' + result.message);
        }
    });

    // Handle Add Announcement form
    dom.announcements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const annData = {
            message: dom.announcements.textInput.value.trim(),
            isActive: dom.announcements.activeCheckbox.checked
        };
        if (!annData.message) return;

        const result = await apiRequest({ eventType: 'admin_addAnnouncement', announcementData: annData });
        if (result.success) {
            dom.announcements.form.reset();
            await initializeConsole();
        } else {
            alert('Error adding announcement: ' + result.message);
        }
    });

    // Handle Announcement list actions (delete, toggle status)
    dom.announcements.list.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('delete-ann-btn')) {
            if (!confirm('Are you sure you want to delete this announcement?')) return;
            const result = await apiRequest({ eventType: 'admin_deleteAnnouncement', announcementId: id });
            if (result.success) await initializeConsole();
            else alert('Error: ' + result.message);
        }

        if (target.classList.contains('toggle-status-btn')) {
            const status = target.dataset.status === 'true';
            const result = await apiRequest({ eventType: 'admin_toggleAnnouncementStatus', announcementId: id, status: status });
            if (result.success) await initializeConsole();
            else alert('Error: ' + result.message);
        }
    });

    // Handle clicks inside the modal to cancel it
    dom.editUserModal.addEventListener('click', (e) => {
        if (e.target.id === 'edit-user-modal' || e.target.id === 'edit-user-cancel') {
            dom.editUserModal.classList.add('hidden');
        }
    });
    
    // Handle "Add User" modal events
    dom.addUserBtn.addEventListener('click', () => {
        dom.addUserModal.classList.remove('hidden');
    });
    dom.addUserCancelBtn.addEventListener('click', () => {
        dom.addUserModal.classList.add('hidden');
    });
    dom.addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        if (!data.Username || !data.Password || !data.Name) {
            alert("Name, Username, and Password are required.");
            return;
        }

        const result = await apiRequest({ eventType: 'admin_addUser', userData: data });
        if (result.success) {
            dom.addUserModal.classList.add('hidden');
            dom.addUserForm.reset();
            alert('User added successfully!');
            await initializeConsole();
        } else {
            alert('Error adding user: ' + result.message);
        }
    });
});

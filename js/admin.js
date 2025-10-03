// js/admin.js (FINAL & COMPLETE VERSION - With Subscription Extension Logic)

const API_URL = 'https://script.google.com/macros/s/AKfycbxS4JqdtlcCud_OO3zlWVeCQAUwg2Al1xG3QqITq24vEI5UolL5YL_W1kfnC5soOaiFcQ/exec';

// --- DOM ELEMENTS ---
const dom = {
    loginScreen: document.getElementById('admin-login-screen'),
    loginForm: document.getElementById('admin-login-form'),
    usernameInput: document.getElementById('admin-username'),
    passwordInput: document.getElementById('admin-password'),
    loginError: document.getElementById('admin-login-error'),
    adminRoleDisplay: document.getElementById('admin-role-display'),
    adminConsole: document.getElementById('admin-console'),
    loader: document.getElementById('loader'),
    navLinks: {
        dashboard: document.getElementById('nav-dashboard'),
        users: document.getElementById('nav-users'),
        messages: document.getElementById('nav-messages'),
        announcements: document.getElementById('nav-announcements'),
        financials: document.getElementById('nav-financials'),
    },
    sections: {
        dashboard: document.getElementById('dashboard-section'),
        users: document.getElementById('users-section'),
        messages: document.getElementById('messages-section'),
        announcements: document.getElementById('announcements-section'),
        financials: document.getElementById('financials-section'),
        userDetail: document.getElementById('user-detail-section'),
    },
    usersTableBody: document.getElementById('users-table-body'),
    usersTableHeader: document.querySelector('#users-section table thead'),
    userSearchInput: document.getElementById('user-search'),
    userFilterButtons: document.getElementById('user-filter-buttons'),
    addUserBtn: document.getElementById('add-user-btn'),
    messagesList: document.getElementById('messages-list'),
    editUserModal: document.getElementById('edit-user-modal'),
    editUserFormContainer: document.getElementById('edit-user-form-container'),
    editUserName: document.getElementById('edit-user-name'),
    announcements: {
        form: document.getElementById('add-announcement-form'),
        textInput: document.getElementById('announcement-text'),
        activeCheckbox: document.getElementById('announcement-active'),
        list: document.getElementById('announcements-list'),
    },
    addUserModal: {
        modal: document.getElementById('add-user-modal'),
        form: document.getElementById('add-user-form'),
        cancelBtn: document.getElementById('add-user-cancel-btn'),
        roleSelect: document.getElementById('add-user-role'),
    },
    financials: {
        tableHeader: document.getElementById('financials-table-header'),
        tableBody: document.getElementById('financials-table-body'),
        addPaymentBtn: document.getElementById('add-payment-btn'),
    },
    addPaymentModal: {
        modal: document.getElementById('add-payment-modal'),
        form: document.getElementById('add-payment-form'),
        userSelect: document.getElementById('payment-user-select'),
        cancelBtn: document.getElementById('add-payment-cancel-btn'),
    },
    bulkActions: {
        bar: document.getElementById('bulk-action-bar'),
        count: document.getElementById('selected-user-count'),
        select: document.getElementById('bulk-action-select'),
        applyBtn: document.getElementById('bulk-action-apply-btn'),
    },
    messaging: {
        broadcastForm: document.getElementById('broadcast-message-form'),
        broadcastInput: document.getElementById('broadcast-message-text'),
    },
    userDetailView: {
        container: document.getElementById('user-detail-section'),
    }
};

// --- APP STATE ---
const adminState = {
    isAuthenticated: false,
    adminCredentials: { username: '', password: '' },
    currentView: 'dashboard',
    allUsers: [],
    allMessages: [],
    allLogs: [],
    allAnnouncements: [],
    allFinances: [],
    allRoles: [],
    allQuestions: [],
    allIncorrectQuestions: [],
    analytics: {},
    selectedUserIds: new Set(),
    sortState: { key: 'Name', direction: 'asc' },
    currentFilter: 'all',
    chartInstance: null
};

// --- API FUNCTIONS ---
async function apiRequest(payload) {
    try {
        const authenticatedPayload = { ...adminState.adminCredentials, ...payload };
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
    Object.values(dom.sections).forEach(s => s && s.classList.add('hidden'));
    try {
        const { username, password } = adminState.adminCredentials;
        const response = await fetch(`${API_URL}?request=adminData&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        console.error('Fetch Admin Data Error:', error);
        return { error: error.message };
    } finally {
        dom.loader.classList.add('hidden');
    }
}

// --- RENDERING & DATA-PROCESSING ---

function renderAll() {
    populateRoleDropdowns();
    renderDashboard();
    renderMessages();
    renderAnnouncements();
    renderFinancialsTable();
    filterAndRenderUsers();
    showSection(adminState.currentView);
}

function processDataForAnalytics() {
    const paymentTotals = adminState.allFinances.reduce((acc, item) => {
        const userId = item.UniqueID;
        const payment = parseFloat(item.Payment) || 0;
        acc[userId] = (acc[userId] || 0) + payment;
        return acc;
    }, {});
    adminState.allUsers.forEach(user => {
        const userLogs = adminState.allLogs.filter(log => log.UserID === user.UniqueID);
        user.totalScore = userLogs.reduce((acc, log) => acc + (parseInt(log.Score, 10) || 0), 0);
        user.totalPaid = paymentTotals[user.UniqueID] || 0;
    });
    const totalRevenue = adminState.allFinances.reduce((acc, item) => acc + (parseFloat(item.Payment) || 0), 0);
    const revenueLast30Days = adminState.allFinances.filter(item => {
        if (!item.PaymentTimeStamp) return false;
        const paymentDate = new Date(item.PaymentTimeStamp);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return paymentDate >= thirtyDaysAgo;
    }).reduce((acc, item) => acc + (parseFloat(item.Payment) || 0), 0);
    const questionMap = new Map((adminState.allQuestions || []).map(q => [q.UniqueID, q]));
    const incorrectCounts = (adminState.allIncorrectQuestions || []).reduce((acc, item) => {
        const question = questionMap.get(item.QuestionID);
        if (question) {
            const chapter = question.Chapter || 'Uncategorized';
            acc[chapter] = (acc[chapter] || 0) + 1;
        }
        return acc;
    }, {});
    const weakestTopics = Object.entries(incorrectCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
    const userActivity = adminState.allLogs.reduce((acc, log) => {
        if (log.EventType === 'FinishQuiz') {
            const userId = log.UserID;
            acc[userId] = (acc[userId] || 0) + 1;
        }
        return acc;
    }, {});
    const topUsers = Object.entries(userActivity).sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([userId, count]) => {
            const user = adminState.allUsers.find(u => u.UniqueID === userId);
            return { name: user ? user.Name : 'Unknown', count };
        });
    adminState.analytics = { totalRevenue, revenueLast30Days, weakestTopics, topUsers };
}

function filterAndRenderUsers() {
    const searchTerm = dom.userSearchInput.value.toLowerCase();
    let filteredUsers = adminState.allUsers;

    if (adminState.currentFilter === 'active') {
        filteredUsers = filteredUsers.filter(user => {
            if (!user.SubscriptionEndDate) return String(user.AccessGranted) === 'true';
            const endDate = new Date(user.SubscriptionEndDate);
            return String(user.AccessGranted) === 'true' && endDate >= new Date();
        });
    } else if (adminState.currentFilter === 'expired') {
        filteredUsers = filteredUsers.filter(user => {
            if (!user.SubscriptionEndDate) return false;
            const endDate = new Date(user.SubscriptionEndDate);
            return !(endDate >= new Date());
        });
    }

    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user =>
            (user.Name && user.Name.toLowerCase().includes(searchTerm)) ||
            (user.Username && user.Username.toLowerCase().includes(searchTerm)) ||
            (user['E-Mail'] && user['E-Mail'].toLowerCase().includes(searchTerm))
        );
    }

    sortUsers(filteredUsers);
    renderUsersTable(filteredUsers);
}

function sortUsers(usersArray) {
    const { key, direction } = adminState.sortState;
    usersArray.sort((a, b) => {
        let valA = a[key] || '';
        let valB = b[key] || '';
        if (key === 'SubscriptionEndDate') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        }
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        } else {
            valA = valA || 0;
            valB = valB || 0;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function renderUsersTable(usersToRender) {
    const headers = [
        { key: 'select', label: `<input type="checkbox" id="select-all-users" title="Select All">`, sortable: false },
        { key: 'Name', label: 'Name', sortable: true }, { key: 'Username', label: 'Username', sortable: true },
        { key: 'StudyType', label: 'Study Type', sortable: true }, { key: 'Role', label: 'Role', sortable: true },
        { key: 'SubscriptionEndDate', label: 'Subscription End', sortable: true }, { key: 'AccessGranted', label: 'Access', sortable: true },
        { key: 'totalScore', label: 'Total Score', sortable: true }, { key: 'totalPaid', label: 'Total Paid', sortable: true },
        { key: 'Actions', label: 'Actions', sortable: false }
    ];
    dom.usersTableHeader.innerHTML = `<tr>${headers.map(h => `<th class="p-3 ${h.sortable ? 'sortable-header' : ''}" data-key="${h.key}">${h.label}${h.sortable ? '<i class="fas fa-sort sort-icon"></i>' : ''}</th>`).join('')}</tr>`;
    dom.usersTableBody.innerHTML = '';
    if (!usersToRender || usersToRender.length === 0) {
        dom.usersTableBody.innerHTML = `<tr><td colspan="${headers.length}" class="p-4 text-center">No users found.</td></tr>`;
        return;
    }
    usersToRender.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600';
        const expiryDate = user.SubscriptionEndDate ? new Date(user.SubscriptionEndDate).toLocaleDateString('en-GB') : 'N/A';
        const isExpired = user.SubscriptionEndDate && new Date() > new Date(user.SubscriptionEndDate);
        row.innerHTML = `
            <td class="p-3 text-center"><input type="checkbox" class="user-checkbox" data-userid="${user.UniqueID}"></td>
            <td class="p-3 font-semibold text-slate-800 dark:text-white">${user.Name || 'N/A'}</td>
            <td class="p-3 font-mono">${user.Username}</td> <td class="p-3">${user.StudyType || 'N/A'}</td>
            <td class="p-3 font-semibold ${user.Role === 'Trial' ? 'text-orange-500' : ''}">${user.Role}</td>
            <td class="p-3 ${isExpired ? 'text-red-500 font-bold' : ''}">${expiryDate}</td>
            <td class="p-3">${String(user.AccessGranted) === 'true' ? '<span class="text-green-500 font-semibold">Enabled</span>' : '<span class="text-red-500 font-semibold">Disabled</span>'}</td>
            <td class="p-3 font-bold text-blue-600">${user.totalScore}</td>
            <td class="p-3 font-bold text-green-600">${user.totalPaid.toFixed(2)}</td>
            <td class="p-3 text-lg flex gap-3">
                <button class="message-user-btn text-purple-500 hover:text-purple-400" data-userid="${user.UniqueID}" title="Send Message"><i class="fas fa-paper-plane"></i></button>
                <button class="edit-user-btn text-blue-500 hover:text-blue-400" data-userid="${user.UniqueID}" title="Edit User"><i class="fas fa-edit"></i></button>
            </td>`;
        dom.usersTableBody.appendChild(row);
    });
}

function populateRoleDropdowns() {
    const roles = adminState.allRoles.map(r => r.Role).filter(Boolean);
    const optionsHtml = roles.map(role => `<option value="${role}">${role}</option>`).join('');
    dom.addUserModal.roleSelect.innerHTML = optionsHtml;
    const bulkOptGroup = dom.bulkActions.select.querySelector('optgroup[label="Change Role"]');
    if (bulkOptGroup) bulkOptGroup.innerHTML = roles.map(role => `<option value="changeRole_${role}">Change Role to: ${role}</option>`).join('');
}

function renderDashboard() {
    const { totalRevenue, revenueLast30Days, weakestTopics, topUsers } = adminState.analytics;
    const dashboardContent = dom.sections.dashboard;
    dashboardContent.innerHTML = '';
    const totalUsers = adminState.allUsers.length;
    const trialUsers = adminState.allUsers.filter(u => u.Role === 'Trial').length;
    const activeSubscriptions = adminState.allUsers.filter(u => u.Role !== 'Trial' && String(u.AccessGranted) === 'true').length;
    const unreadMessages = adminState.allMessages.filter(m => !m.AdminReply && m.UserMessage).length;
    dashboardContent.innerHTML = `
    <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Dashboard Overview</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex items-center gap-4"><i class="fas fa-users fa-2x text-blue-500"></i><div><h3 class="text-slate-500 dark:text-slate-400">Total Users</h3><p class="text-2xl font-bold text-slate-800 dark:text-white">${totalUsers}</p></div></div>
        <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex items-center gap-4"><i class="fas fa-user-clock fa-2x text-orange-500"></i><div><h3 class="text-slate-500 dark:text-slate-400">Trial Accounts</h3><p class="text-2xl font-bold text-slate-800 dark:text-white">${trialUsers}</p></div></div>
        <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex items-center gap-4"><i class="fas fa-check-circle fa-2x text-green-500"></i><div><h3 class="text-slate-500 dark:text-slate-400">Active Subs</h3><p class="text-2xl font-bold text-slate-800 dark:text-white">${activeSubscriptions}</p></div></div>
        <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex items-center gap-4"><i class="fas fa-inbox fa-2x text-red-500"></i><div><h3 class="text-slate-500 dark:text-slate-400">Unread Messages</h3><p class="text-2xl font-bold text-slate-800 dark:text-white">${unreadMessages}</p></div></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-4"><h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2">New User Registrations (Last 7 Days)</h3><canvas id="user-chart"></canvas></div>
        <div class="space-y-4">
            <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow"><h3 class="text-lg font-bold text-slate-800 dark:text-white">Financials</h3><p class="text-slate-500 dark:text-slate-400 mt-2">Revenue (Last 30 Days)</p><p class="text-2xl font-bold text-green-600">${revenueLast30Days.toFixed(2)}</p><p class="text-slate-500 dark:text-slate-400 mt-1">Total Revenue</p><p class="text-xl font-bold text-green-700">${totalRevenue.toFixed(2)}</p></div>
            <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow"><h3 class="text-lg font-bold text-slate-800 dark:text-white">Top 5 Active Users</h3><ul class="text-sm mt-2 space-y-1">${topUsers.map(u => `<li class="flex justify-between"><span>${u.name}</span> <span class="font-bold">${u.count} quizzes</span></li>`).join('') || 'No activity.'}</ul></div>
            <div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow"><h3 class="text-lg font-bold text-slate-800 dark:text-white">Weakest Topics</h3><ul class="text-sm mt-2 space-y-1">${weakestTopics.map(([ch, count]) => `<li class="flex justify-between"><span>${ch}</span> <span class="font-bold text-red-500">${count} errors</span></li>`).join('') || 'No data.'}</ul></div>
        </div>
    </div>`;
    renderUserRegistrationChart();
}

function renderUserRegistrationChart() {
    const chartCanvas = document.getElementById('user-chart');
    if (!chartCanvas) return;
    if (adminState.chartInstance) { adminState.chartInstance.destroy(); }
    const labels = [];
    const data = [];
    const userCountsByDay = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        userCountsByDay[key] = 0;
    }
    adminState.allUsers.forEach(user => {
        if (user.AdditionTimeStamp) {
            const regDate = new Date(user.AdditionTimeStamp).toISOString().split('T')[0];
            if (userCountsByDay[regDate] !== undefined) { userCountsByDay[regDate]++; }
        }
    });
    for (const key in userCountsByDay) { data.push(userCountsByDay[key]); }
    adminState.chartInstance = new Chart(chartCanvas, {
        type: 'line', data: { labels: labels, datasets: [{ label: 'New Users', data: data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function renderMessages() {
    dom.messagesList.innerHTML = '';
    if (!adminState.allMessages || adminState.allMessages.length === 0) {
        dom.messagesList.innerHTML = `<p class="text-center text-slate-500">No messages found.</p>`;
        return;
    }
    const groupedMessages = adminState.allMessages.reduce((acc, msg) => {
        if (!msg.UserID) return acc;
        if (!acc[msg.UserID]) { acc[msg.UserID] = { name: msg.UserName, messages: [] }; }
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
            if (msg.UserMessage) { html += `<div class="mb-2"><p class="font-semibold">${conversation.name || 'User'} <span class="text-xs text-slate-400">(${date})</span>:</p><p class="pl-2">${msg.UserMessage}</p></div>`; }
            if (msg.AdminReply) { html += `<div class="mb-2 bg-blue-50 dark:bg-slate-700 p-2 rounded"><p class="font-semibold">Admin Reply:</p><p class="pl-2">${msg.AdminReply}</p></div>`; }
            return html;
        }).join('');
        container.innerHTML = `<h3 class="text-lg font-bold border-b pb-2 mb-2 dark:text-white dark:border-slate-600">${conversation.name} (${userId})</h3><div class="max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-700/50 rounded">${messagesHtml}</div><form class="reply-form mt-4 flex gap-2"><input type="hidden" name="UserID" value="${userId}"><input type="text" name="AdminReply" class="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="Type your reply..." required><button type="submit" class="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Send</button></form>`;
        dom.messagesList.appendChild(container);
    }
}

function renderAnnouncements() {
    dom.announcements.list.innerHTML = '';
    if (!adminState.allAnnouncements || adminState.allAnnouncements.length === 0) {
        dom.announcements.list.innerHTML = `<p class="text-slate-500">No announcements yet.</p>`;
        return;
    }
    const sortedAnnouncements = [...adminState.allAnnouncements].sort((a, b) => new Date(b.TimeStamp) - new Date(a.TimeStamp));
    sortedAnnouncements.forEach(ann => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 border-b dark:border-slate-700';
        const isActive = String(ann.IsActive).toLowerCase() === 'true';
        item.innerHTML = `<div><p class="dark:text-white">${ann.UpdateMessage}</p><p class="text-xs text-slate-400">${new Date(ann.TimeStamp).toLocaleString()}</p></div><div class="flex items-center gap-4"><button class="toggle-status-btn px-3 py-1 text-sm rounded ${isActive ? 'bg-green-500 text-white' : 'bg-slate-300'}" data-id="${ann.UniqueID}" data-status="${!isActive}">${isActive ? 'Active' : 'Inactive'}</button><button class="delete-ann-btn text-red-500 hover:text-red-700" data-id="${ann.UniqueID}"><i class="fas fa-trash"></i></button></div>`;
        dom.announcements.list.appendChild(item);
    });
}

function renderFinancialsTable() {
    dom.financials.tableBody.innerHTML = '';
    const headers = ["Username", "Payment Timestamp", "Amount", "Method", "Notes", "Exam Results"];
    dom.financials.tableHeader.innerHTML = `<tr>${headers.map(h => `<th class="p-3">${h}</th>`).join('')}</tr>`;
    if (!adminState.allFinances || adminState.allFinances.length === 0) {
        dom.financials.tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="p-4 text-center">No financial records found.</td></tr>`;
        return;
    }
    const sortedFinances = [...adminState.allFinances].sort((a, b) => new Date(b.PaymentTimeStamp) - new Date(a.PaymentTimeStamp));
    sortedFinances.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600';
        row.innerHTML = `
            <td class="p-3 font-semibold text-slate-800 dark:text-white">${record.Username}</td>
            <td class="p-3">${record.PaymentTimeStamp ? new Date(record.PaymentTimeStamp).toLocaleString('en-GB') : 'N/A'}</td>
            <td class="p-3 font-bold text-green-600">${parseFloat(record.Payment || 0).toFixed(2)}</td>
            <td class="p-3">${record.PaymentMethod || 'N/A'}</td>
            <td class="p-3">${record.PaymentNotes || ''}</td>
            <td class="p-3">${record['Exam Results'] || ''}</td>`;
        dom.financials.tableBody.appendChild(row);
    });
}

function showSection(sectionId) {
    adminState.currentView = sectionId;
    Object.values(dom.sections).forEach(s => s && s.classList.add('hidden'));
    dom.sections[sectionId].classList.remove('hidden');
    Object.values(dom.navLinks).forEach(link => link.classList.remove('active'));
    dom.navLinks[sectionId].classList.add('active');
}

function updateBulkActionBar() {
    const count = adminState.selectedUserIds.size;
    dom.bulkActions.count.textContent = count;
    dom.bulkActions.bar.classList.toggle('hidden', count === 0);
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
    adminState.allFinances = data.finances || [];
    adminState.allRoles = data.roles || [];
    adminState.allQuestions = data.questions || [];
    adminState.allIncorrectQuestions = data.incorrectQuestions || [];
    processDataForAnalytics();
    renderAll();
}

// --- INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    
    dom.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        dom.loginError.classList.add('hidden');
        const username = dom.usernameInput.value;
        const password = dom.passwordInput.value;
        const result = await apiRequest({ eventType: 'adminLogin', username, password });
        if (result.success) {
            adminState.isAuthenticated = true;
            adminState.adminCredentials = { username, password };
            dom.loginScreen.classList.add('hidden');
            dom.adminConsole.classList.remove('hidden');
            await initializeConsole();
        } else {
            dom.loginError.textContent = result.message || 'Incorrect credentials or not an admin.';
            dom.loginError.classList.remove('hidden');
        }
    });

    Object.keys(dom.navLinks).forEach(key => {
        dom.navLinks[key].addEventListener('click', (e) => {
            e.preventDefault();
            showSection(key);
        });
    });

    dom.userSearchInput.addEventListener('input', filterAndRenderUsers);
    if(dom.userFilterButtons) {
        dom.userFilterButtons.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                dom.userFilterButtons.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                adminState.currentFilter = e.target.dataset.filter;
                filterAndRenderUsers();
            }
        });
    }

    dom.usersTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        if (button.classList.contains('edit-user-btn')) {
            const user = adminState.allUsers.find(u => u.UniqueID === button.dataset.userid);
            if (!user) return;
            const roleOptions = adminState.allRoles.map(r => `<option value="${r.Role}" ${user.Role === r.Role ? 'selected' : ''}>${r.Role}</option>`).join('');
            dom.editUserName.textContent = user.Name || user.Username;
            
            // Build Edit Form Dynamically
            const formHtml = `
            <form id="edit-user-form" class="space-y-4">
                <input type="hidden" name="UniqueID" value="${user.UniqueID}">
                <div><label class="block mb-1 dark:text-slate-300">Role</label><select name="Role" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white">${roleOptions}</select></div>
                <div><label class="block mb-1 dark:text-slate-300">Access Granted</label><select name="AccessGranted" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white"><option value="TRUE" ${String(user.AccessGranted) === 'true' ? 'selected' : ''}>Enabled</option><option value="FALSE" ${String(user.AccessGranted) !== 'true' ? 'selected' : ''}>Disabled</option></select></div>
                <div><label class="block mb-1 dark:text-slate-300">Admin Notes</label><textarea name="AdminNotes" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" placeholder="Admin Notes...">${user.AdminNotes || ''}</textarea></div>
                <div class="flex justify-end gap-4 pt-4"><button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button></div>
            </form>
            <div class="mt-6 pt-4 border-t dark:border-slate-600">
                <h4 class="text-lg font-semibold mb-3 dark:text-white">Extend Subscription</h4>
                <form id="extend-subscription-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block mb-1 text-sm dark:text-slate-300">Duration</label>
                            <div class="flex items-center gap-2">
                                <input type="number" name="extendValue" class="w-1/3 p-2 border rounded dark:bg-slate-700 dark:text-white" value="1">
                                <select name="extendUnit" class="w-2/3 p-2 border rounded dark:bg-slate-700 dark:text-white">
                                    <option value="months">Months</option><option value="days">Days</option><option value="weeks">Weeks</option>
                                </select>
                            </div>
                        </div>
                        <div>
                             <label class="block mb-1 text-sm dark:text-slate-300">Payment Amount (0 for free)</label>
                             <input type="number" name="Payment" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" placeholder="0.00" step="0.01">
                        </div>
                    </div>
                     <div>
                        <label class="block mb-1 text-sm dark:text-slate-300">Payment Method</label>
                        <select name="PaymentMethod" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white">
                            <option value="">-- Select Method --</option><option value="Vodafone Cash">Vodafone Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Other">Other</option>
                        </select>
                    </div>
                     <div>
                        <label class="block mb-1 text-sm dark:text-slate-300">Payment Notes</label>
                        <textarea name="PaymentNotes" class="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" placeholder="e.g., Renewal..."></textarea>
                     </div>
                    <div class="flex justify-end gap-4 pt-4">
                         <button type="button" id="edit-user-cancel" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 rounded">Close</button>
                         <button type="submit" class="px-6 py-2 bg-green-600 text-white font-bold rounded">Extend</button>
                    </div>
                </form>
            </div>
            `;
            dom.editUserFormContainer.innerHTML = formHtml;
            dom.editUserModal.classList.remove('hidden');
        }
        if (button.classList.contains('message-user-btn')) {
             const userId = button.dataset.userid;
            const user = adminState.allUsers.find(u => u.UniqueID === userId);
            const message = prompt(`Enter message for ${user.Name}:`);
            if (message && message.trim()) {
                apiRequest({eventType: 'admin_sendMessage', messageData: { userId, message: message.trim() }})
                .then(result => {
                    if (result.success) { alert(result.message); initializeConsole(); }
                    else alert('Error: ' + result.message);
                });
            }
        }
    });
    
    dom.usersTableHeader.addEventListener('click', (e) => {
        const target = e.target.closest('.sortable-header');
        if (!target) return;
        const key = target.dataset.key;
        if (adminState.sortState.key === key) {
            adminState.sortState.direction = adminState.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            adminState.sortState.key = key;
            adminState.sortState.direction = 'asc';
        }
        filterAndRenderUsers();
    });

    dom.usersTableHeader.addEventListener('change', (e) => {
        if(e.target.id === 'select-all-users') {
            const isChecked = e.target.checked;
            dom.usersTableBody.querySelectorAll('.user-checkbox').forEach(box => {
                box.checked = isChecked;
                const userId = box.dataset.userid;
                if(isChecked) adminState.selectedUserIds.add(userId);
                else adminState.selectedUserIds.delete(userId);
            });
            updateBulkActionBar();
        }
    });
    
    dom.usersTableBody.addEventListener('change', (e) => {
        if (e.target.matches('.user-checkbox')) {
             const userId = e.target.dataset.userid;
            if (e.target.checked) adminState.selectedUserIds.add(userId);
            else adminState.selectedUserIds.delete(userId);
            updateBulkActionBar();
        }
    });

    dom.bulkActions.applyBtn.addEventListener('click', async () => {
        const selectedAction = dom.bulkActions.select.value;
        const userIds = Array.from(adminState.selectedUserIds);
        if (!selectedAction || userIds.length === 0) {
            return alert("Please select an action and at least one user.");
        }
        const [action, value] = selectedAction.split('_');
        if (confirm(`Are you sure you want to apply this action to ${userIds.length} user(s)?`)) {
            const result = await apiRequest({ eventType: 'admin_bulkUpdate', updateData: { userIds, action, value } });
            if (result.success) {
                alert(result.message);
                adminState.selectedUserIds.clear();
                updateBulkActionBar();
                await initializeConsole();
            } else {
                alert('Error: ' + (result.error || result.message));
            }
        }
    });
    
    dom.messaging.broadcastForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = dom.messaging.broadcastInput.value.trim();
        if (!message) return;
        if(confirm(`Are you sure you want to send this message to ALL non-admin users?`)) {
            const result = await apiRequest({ eventType: 'admin_sendMessage', messageData: { userId: 'BROADCAST_ALL', message } });
            if(result.success) {
                alert(result.message);
                dom.messaging.broadcastInput.value = '';
                await initializeConsole();
            } else {
                alert('Error: ' + (result.error || result.message));
            }
        }
    });

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
    
    dom.editUserModal.addEventListener('click', async (e) => {
        if (e.target.id === 'edit-user-cancel') {
            dom.editUserModal.classList.add('hidden');
        }
        if (e.target.closest('form')?.id === 'edit-user-form') {
            e.preventDefault();
            const formData = new FormData(e.target.closest('form'));
            const data = Object.fromEntries(formData.entries());
            const result = await apiRequest({ eventType: 'admin_updateUser', userData: data });
            if (result.success) {
                alert('User details updated!');
                await initializeConsole();
            } else {
                alert('Error updating user: ' + result.message);
            }
        }
        if (e.target.closest('form')?.id === 'extend-subscription-form') {
            e.preventDefault();
            const form = e.target.closest('form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const user = adminState.allUsers.find(u => u.UniqueID === document.querySelector('#edit-user-form input[name="UniqueID"]').value);
            data.UniqueID = user.UniqueID;
            
            if (!data.extendValue || data.extendValue <= 0) {
                return alert('Please enter a valid duration value.');
            }

            const result = await apiRequest({ eventType: 'admin_extendSubscription', extensionData: data });
            if (result.success) {
                alert(result.message);
                dom.editUserModal.classList.add('hidden');
                await initializeConsole();
            } else {
                alert('Error extending subscription: ' + (result.error || result.message));
            }
        }
    });
    
    dom.announcements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const annData = { message: dom.announcements.textInput.value.trim(), isActive: dom.announcements.activeCheckbox.checked };
        if (!annData.message) return;
        const result = await apiRequest({ eventType: 'admin_addAnnouncement', announcementData: annData });
        if (result.success) {
            dom.announcements.form.reset();
            await initializeConsole();
        } else {
            alert('Error adding announcement: ' + result.message);
        }
    });

    dom.announcements.list.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('delete-ann-btn')) {
            if (!confirm('Are you sure you want to delete this announcement?')) return;
            const result = await apiRequest({ eventType: 'admin_deleteAnnouncement', announcementId: id });
            if (result.success) await initializeConsole(); else alert('Error: ' + result.message);
        }
        if (target.classList.contains('toggle-status-btn')) {
            const status = target.dataset.status === 'true';
            const result = await apiRequest({ eventType: 'admin_toggleAnnouncementStatus', announcementId: id, status: status });
            if (result.success) await initializeConsole(); else alert('Error: ' + result.message);
        }
    });

    dom.addUserModal.cancelBtn.addEventListener('click', () => { dom.addUserModal.modal.classList.add('hidden'); });
    dom.addUserBtn.addEventListener('click', () => { dom.addUserModal.modal.classList.remove('hidden'); });
    
    dom.addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        if (!data.Username || !data.Password || !data.Name) { return alert("Name, Username, and Password are required.");}
    
        const value = parseInt(data.extendValue, 10);
        const unit = data.extendUnit;
        const endDate = new Date();
        if (unit === 'days') endDate.setDate(endDate.getDate() + value);
        if (unit === 'weeks') endDate.setDate(endDate.getDate() + (value * 7));
        if (unit === 'months') endDate.setMonth(endDate.getMonth() + value);
        
        data.SubscriptionEndDate = endDate.toISOString().split('T')[0];
        delete data.extendValue;
        delete data.extendUnit;

        const result = await apiRequest({ eventType: 'admin_addUser', userData: data });
        if (result.success) {
            dom.addUserModal.modal.classList.add('hidden');
            dom.addUserForm.reset();
            alert('User added successfully!');
            await initializeConsole();
        } else {
            alert('Error adding user: ' + result.message);
        }
    });

    dom.financials.addPaymentBtn.addEventListener('click', () => {
        const userOptions = adminState.allUsers
            .sort((a,b) => (a.Name || '').toLowerCase().localeCompare((b.Name || '').toLowerCase()))
            .map(u => `<option value="${u.UniqueID}">${u.Name} (${u.Username})</option>`).join('');
        dom.addPaymentModal.userSelect.innerHTML = `<option value="">-- Select a User --</option>${userOptions}`;
        dom.addPaymentModal.modal.classList.remove('hidden');
    });

    dom.addPaymentModal.cancelBtn.addEventListener('click', () => {
        dom.addPaymentModal.modal.classList.add('hidden');
    });

    dom.addPaymentModal.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if(!data.UniqueID || !data.Payment || !data.PaymentMethod) {
            return alert('Please select a user and fill in all payment details.');
        }

        const result = await apiRequest({ eventType: 'admin_addPayment', paymentData: data });
        if (result.success) {
            dom.addPaymentModal.modal.classList.add('hidden');
            dom.addPaymentModal.form.reset();
            alert(result.message);
            await initializeConsole();
        } else {
            alert('Error adding payment: ' + (result.error || result.message));
        }
    });
});

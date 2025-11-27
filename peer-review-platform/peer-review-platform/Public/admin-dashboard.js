// ===== ADMIN DASHBOARD FUNCTIONALITY =====
const username = localStorage.getItem('username');
const role = localStorage.getItem('role');

// Check if user is admin
if (!username || role !== 'admin') {
  alert('Access denied. Admin privileges required.');
  window.location.href = '/login.html';
}

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const contentArea = document.getElementById('contentArea');

// Navigation elements
const dashboardLink = document.getElementById('dashboardLink');
const reportedWorksLink = document.getElementById('reportedWorksLink');
const allUsersLink = document.getElementById('allUsersLink');
const allWorksLink = document.getElementById('allWorksLink');

// Quick action buttons
const viewReportsBtn = document.getElementById('viewReportsBtn');
const manageUsersBtn = document.getElementById('manageUsersBtn');
const viewAllWorksBtn = document.getElementById('viewAllWorksBtn');

// Modal elements
const actionModal = document.getElementById('actionModal');

let currentReportedWorkId = null;
let currentActionType = '';
let currentActionData = null;

// ===== INITIALIZATION =====
document.getElementById('sidebarUsername').textContent = username;
document.getElementById('username').textContent = username;

// Set dashboard as active by default
setActiveNav(dashboardLink);
loadDashboardStats();

// ===== NAVIGATION =====
function setActiveNav(activeLink) {
  // Remove active class from all links
  [dashboardLink, reportedWorksLink, allUsersLink, allWorksLink].forEach(link => {
    link.classList.remove('bg-blue-700', 'nav-active');
    link.classList.add('hover:bg-blue-700');
  });
  
  // Add active class to clicked link
  activeLink.classList.add('bg-blue-700', 'nav-active');
  activeLink.classList.remove('hover:bg-blue-700');
}

dashboardLink.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(dashboardLink);
  showDashboard();
});

reportedWorksLink.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(reportedWorksLink);
  showReportedWorks();
});

allUsersLink.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(allUsersLink);
  showAllUsers();
});

allWorksLink.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(allWorksLink);
  showAllWorks();
});

// Quick actions
viewReportsBtn.addEventListener('click', showReportedWorks);
manageUsersBtn.addEventListener('click', showAllUsers);
viewAllWorksBtn.addEventListener('click', showAllWorks);

// ===== LOGOUT FUNCTIONALITY =====
function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

logoutBtn.addEventListener('click', logout);
sidebarLogoutBtn.addEventListener('click', logout);

// ===== SIDEBAR (MOBILE) FUNCTIONALITY =====
mobileMenuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (
    window.innerWidth < 768 &&
    !sidebar.contains(e.target) &&
    !mobileMenuBtn.contains(e.target) &&
    sidebar.classList.contains('open')
  ) {
    sidebar.classList.remove('open');
  }
});

// Adjust layout on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    sidebar.classList.remove('open');
  }
});

// ===== DASHBOARD FUNCTIONS =====
async function loadDashboardStats() {
  try {
    // Load users count
    const usersRes = await fetch('/admin/users');
    if (usersRes.ok) {
      const users = await usersRes.json();
      document.getElementById('totalUsers').textContent = users.length;
    }

    // Load works count and stats
    const worksRes = await fetch('/all-works');
    if (worksRes.ok) {
      const works = await worksRes.json();
      document.getElementById('totalWorks').textContent = works.length;

      const totalRating = works.reduce((sum, work) => {
        return sum + (parseFloat(work.averageRating) || 0);
      }, 0);
      const avgRating = works.length > 0 ? (totalRating / works.length).toFixed(1) : '0.0';
      document.getElementById('avgRating').textContent = avgRating;
    }

    // Load reports count
    const reportsRes = await fetch('/admin/reports');
    if (reportsRes.ok) {
      const reports = await reportsRes.json();
      const reportsCount = reports.length;
      document.getElementById('totalReports').textContent = reportsCount;
      
      // Update sidebar badge
      const reportsBadge = document.getElementById('reportsCount');
      if (reportsCount > 0) {
        reportsBadge.textContent = reportsCount;
        reportsBadge.classList.remove('hidden');
      } else {
        reportsBadge.classList.add('hidden');
      }
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function showDashboard() {
  contentArea.innerHTML = `
    <div class="bg-white rounded-xl shadow p-6">
      <h3 class="text-xl font-bold mb-4">Platform Overview</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button id="viewReportsBtn" class="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition text-left">
          <h4 class="font-semibold text-red-800 mb-2">Review Reports</h4>
          <p class="text-red-600 text-sm">Manage reported works and take action</p>
        </button>
        <button id="manageUsersBtn" class="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-left">
          <h4 class="font-semibold text-blue-800 mb-2">Manage Users</h4>
          <p class="text-blue-600 text-sm">View and manage all platform users</p>
        </button>
        <button id="viewAllWorksBtn" class="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-left">
          <h4 class="font-semibold text-green-800 mb-2">All Works</h4>
          <p class="text-green-600 text-sm">Browse all submitted works</p>
        </button>
      </div>
    </div>
  `;

  document.getElementById('viewReportsBtn').addEventListener('click', showReportedWorks);
  document.getElementById('manageUsersBtn').addEventListener('click', showAllUsers);
  document.getElementById('viewAllWorksBtn').addEventListener('click', showAllWorks);
}

async function showReportedWorks() {
  try {
    const res = await fetch('/admin/reports');
    const reports = await res.json();

    let reportsHTML = `
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">Reported Works</h3>
          <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
            ${reports.length} Reports
          </span>
        </div>
    `;

    if (reports.length === 0) {
      reportsHTML += `
        <div class="text-center py-8 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p>No reported works at this time.</p>
        </div>
      `;
    } else {
      reportsHTML += `<div class="space-y-4">`;

      reports.forEach((report) => {
        reportsHTML += `
          <div class="border border-red-200 rounded-lg p-4 bg-red-50">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-semibold text-lg">${report.work.title}</h4>
                <p class="text-gray-600 text-sm">By: ${report.work.username}</p>
              </div>
              <span class="report-badge bg-red-500 text-white rounded-full px-2 py-1">
                ${report.reason}
              </span>
            </div>

            <p class="text-gray-700 mb-3">${report.work.description}</p>

            <div class="bg-white rounded p-3 mb-3">
              <p class="text-sm font-semibold text-gray-800">Report Details:</p>
              <p class="text-sm text-gray-600">Reason: ${report.reason}</p>
              <p class="text-sm text-gray-600">Details: ${
                report.details || 'No additional details provided'
              }</p>
              <p class="text-xs text-gray-500 mt-1">Reported by: ${
                report.reporter
              } • ${new Date(report.createdAt).toLocaleDateString()}</p>
            </div>

            <div class="flex gap-2">
              <button onclick="takeAction('dismiss', '${
                report._id
              }')" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm">
                Dismiss Report
              </button>
              <button onclick="takeAction('delete_work', '${
                report._id
              }', '${
                report.work._id
              }')" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm">
                Delete Work
              </button>
              <button onclick="takeAction('warn_user', '${
                report._id
              }', '${
                report.work.username
              }')" class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm">
                Warn User
              </button>
            </div>
          </div>
        `;
      });

      reportsHTML += `</div>`;
    }

    reportsHTML += `</div>`;
    contentArea.innerHTML = reportsHTML;
  } catch (err) {
    console.error('Error loading reported works:', err);
    contentArea.innerHTML = `
      <div class="bg-white rounded-xl shadow p-6">
        <div class="text-center text-red-500 py-8">
          <p>Error loading reported works. Please try again.</p>
        </div>
      </div>
    `;
  }
}

async function showAllUsers() {
  try {
    const res = await fetch('/admin/users');
    const users = await res.json();

    let usersHTML = `
      <div class="bg-white rounded-xl shadow p-6">
        <h3 class="text-xl font-bold mb-6">All Users (${users.length})</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-2 text-left">Username</th>
                <th class="px-4 py-2 text-left">Email</th>
                <th class="px-4 py-2 text-left">Role</th>
                <th class="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    users.forEach((user) => {
      usersHTML += `
        <tr class="border-b">
          <td class="px-4 py-3">${user.username}</td>
          <td class="px-4 py-3">${user.email}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-xs ${
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }">
              ${user.role}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button onclick="takeAction('view_user', null, '${
                user.username
              }')" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                View
              </button>
              ${
                user.role !== 'admin'
                  ? `
                <button onclick="takeAction('delete_user', null, '${user.username}')" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm">
                  Delete
                </button>
              `
                  : ''
              }
            </div>
          </td>
        </tr>
      `;
    });

    usersHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    contentArea.innerHTML = usersHTML;
  } catch (err) {
    console.error('Error loading users:', err);
    contentArea.innerHTML = `
      <div class="bg-white rounded-xl shadow p-6">
        <div class="text-center text-red-500 py-8">
          <p>Error loading users. Please try again.</p>
        </div>
      </div>
    `;
  }
}

async function showAllWorks() {
  try {
    const res = await fetch('/all-works?username=admin');
    const works = await res.json();

    let worksHTML = `
      <div class="bg-white rounded-xl shadow p-6">
        <h3 class="text-xl font-bold mb-6">All Works (${works.length})</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    if (works.length === 0) {
      worksHTML += `
        <div class="col-span-3 text-center py-8 text-gray-500">
          <p>No works submitted yet.</p>
        </div>
      `;
    } else {
      works.forEach((work) => {
        worksHTML += `
          <div class="border rounded-lg p-4 bg-white hover:shadow-md transition flex flex-col work-card">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="font-semibold text-sm md:text-base">${work.title}</h4>
                <p class="text-xs text-gray-500">By: ${work.username}</p>
              </div>
              <span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded">
                ${work.category}
              </span>
            </div>

            <p class="text-gray-600 text-xs md:text-sm mb-2 overflow-hidden max-h-32 work-description">
              ${work.description || ''}
            </p>
            <button type="button"
              class="self-start text-[11px] text-blue-600 hover:underline mb-2 toggle-desc-btn">
              Show more
            </button>

            <div class="flex justify-between items-center text-[11px] text-gray-500 mb-2">
              <span>${new Date(work.createdAt).toLocaleDateString()}</span>
            </div>

            <div class="flex justify-between items-center mb-2 text-xs">
              <div class="flex items-center">
                <span class="text-yellow-500">★</span>
                <span class="ml-1">${work.averageRating || '0'}</span>
              </div>
              <span class="text-gray-500">${work.reviewCount || 0} reviews</span>
            </div>

            <div class="flex gap-2 mt-auto">
              <button onclick="takeAction('view_work', null, '${
                work._id
              }')" class="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs">
                View
              </button>
              <button onclick="takeAction('delete_work_admin', null, '${
                work._id
              }')" class="flex-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-xs">
                Delete
              </button>
            </div>
          </div>
        `;
      });
    }

    worksHTML += `</div></div>`;
    contentArea.innerHTML = worksHTML;

    attachDescriptionToggleHandlers();
  } catch (err) {
    console.error('Error loading works:', err);
    contentArea.innerHTML = `
      <div class="bg-white rounded-xl shadow p-6">
        <div class="text-center text-red-500 py-8">
          <p>Error loading works. Please try again.</p>
        </div>
      </div>
    `;
  }
}

// Attach Show more / Show less on each work card
function attachDescriptionToggleHandlers() {
  const cards = document.querySelectorAll('.work-card');

  cards.forEach((card) => {
    const btn = card.querySelector('.toggle-desc-btn');
    const desc = card.querySelector('.work-description');
    if (!btn || !desc) return;

    btn.addEventListener('click', () => {
      const collapsed = desc.classList.contains('max-h-32');

      if (collapsed) {
        // expand
        desc.classList.remove('max-h-32', 'overflow-hidden');
        btn.textContent = 'Show less';
      } else {
        // collapse
        desc.classList.add('max-h-32', 'overflow-hidden');
        btn.textContent = 'Show more';
      }
    });
  });
}

// ===== ACTION HANDLING =====
function takeAction(actionType, reportId, data) {
  currentActionType = actionType;
  currentActionData = data;

  let actionContent = '';
  let confirmText = 'Confirm';
  let confirmColor = 'bg-red-600';

  switch (actionType) {
    case 'dismiss':
      actionContent =
        '<p>Are you sure you want to dismiss this report? This action cannot be undone.</p>';
      confirmText = 'Dismiss Report';
      confirmColor = 'bg-gray-600';
      break;
    case 'delete_work':
    case 'delete_work_admin':
      actionContent =
        '<p>Are you sure you want to delete this work? This will permanently remove the work and all associated feedback.</p>';
      confirmText = 'Delete Work';
      break;
    case 'warn_user':
      actionContent = '<p>Send a warning to this user about their content?</p>';
      confirmText = 'Send Warning';
      confirmColor = 'bg-yellow-600';
      break;
    case 'delete_user':
      actionContent =
        '<p>Are you sure you want to delete this user? This will permanently remove their account and all their works.</p>';
      confirmText = 'Delete User';
      break;
    case 'view_user':
      alert(`User: ${data}\nView user details would be shown here.`);
      return;
    case 'view_work':
      alert(`Work ID: ${data}\nView work details would be shown here.`);
      return;
  }

  document.getElementById('actionContent').innerHTML = actionContent;
  const confirmBtn = document.getElementById('confirmAction');
  confirmBtn.textContent = confirmText;
  confirmBtn.className = `px-4 py-2 rounded ${confirmColor} text-white hover:${confirmColor.replace(
    '600',
    '700'
  )} transition`;

  if (reportId) {
    currentReportedWorkId = reportId;
  }

  actionModal.classList.remove('hidden');
  actionModal.classList.add('flex');
}

// Modal event listeners
document.getElementById('cancelAction').addEventListener('click', () => {
  actionModal.classList.add('hidden');
  actionModal.classList.remove('flex');
});

document.getElementById('confirmAction').addEventListener('click', async () => {
  try {
    let endpoint = '';
    let method = 'POST';
    let body = {};

    switch (currentActionType) {
      case 'dismiss':
        endpoint = `/admin/reports/${currentReportedWorkId}/dismiss`;
        break;
      case 'delete_work':
      case 'delete_work_admin':
        endpoint = `/admin/works/${currentActionData}`;
        method = 'DELETE';
        break;
      case 'warn_user':
        endpoint = `/admin/users/${currentActionData}/warn`;
        body = {
          message: 'Your content has been reported. Please review our community guidelines.',
        };
        break;
      case 'delete_user':
        endpoint = `/admin/users/${currentActionData}`;
        method = 'DELETE';
        break;
    }

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    if (res.ok) {
      alert('Action completed successfully!');
      actionModal.classList.add('hidden');
      actionModal.classList.remove('flex');

      // Refresh dashboard stats to update report count
      await loadDashboardStats();

      // Navigate to appropriate section
      if (currentActionType.includes('delete_work') || currentActionType === 'dismiss') {
        showReportedWorks();
      } else if (currentActionType === 'delete_user') {
        showAllUsers();
      } else if (currentActionType === 'delete_work_admin') {
        showAllWorks();
      }
    } else {
      alert('Failed to complete action. Please try again.');
    }
  } catch (err) {
    console.error('Error performing action:', err);
    alert('Error performing action. Please try again.');
  }
});
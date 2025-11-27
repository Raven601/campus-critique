const username = localStorage.getItem('username');
if (!username) {
  alert('Please login first');
  window.location.href = '/login.html';
}

const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const myWorksLink = document.getElementById('myWorksLink');

const usernameDisplay = document.getElementById('usernameDisplay');
const submissionsSummary = document.getElementById('submissionsSummary');
const availableReviews = document.getElementById('availableReviews');

const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarUserRole = document.getElementById('sidebarUserRole');

if (username) {
  sidebarUsername.textContent = username;
  usernameDisplay.textContent = username;
}

if (myWorksLink) {
  myWorksLink.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = `/my-works.html?username=${encodeURIComponent(username)}`;
  });
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    setTimeout(() => window.location.href = '/login.html', 300);
  }
}

if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', logout);

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

document.addEventListener('click', e => {
  if (window.innerWidth < 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target) && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    sidebar.classList.remove('open');
  }
});

async function loadDashboardData() {
  try {
    if (!username) {
      showErrorStates();
      return;
    }

    const submissionsRes = await fetch(`/my-works?username=${encodeURIComponent(username)}`);
    const reviewsRes = await fetch(`/all-works`);

    let submissionsData = await submissionsRes.json();
    submissionsData = Array.isArray(submissionsData) ? submissionsData : submissionsData.submissions || [];

    let allWorksData = await reviewsRes.json();
    allWorksData = Array.isArray(allWorksData) ? allWorksData : allWorksData.works || [];

    displaySubmissionsSummary(submissionsData, allWorksData);
    displayAvailableReviews(allWorksData);
    renderCategoryChart(submissionsData);

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showErrorStates();
  }
}

function displaySubmissionsSummary(submissions, allWorks) {
  submissionsSummary.innerHTML = '';

  if (!submissions.length) {
    submissionsSummary.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <p>No submissions yet</p>
        <a href="/submit-work.html" class="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">Submit your first work</a>
      </div>
    `;
    return;
  }

  const totalSubmissions = submissions.length;
  const latestSubmission = submissions[0];

  const totalReviews = allWorks.reduce((total, work) => {
    if (work.username === username) {
      if (Array.isArray(work.feedbacks)) total += work.feedbacks.length;
      if (Array.isArray(work.reviews)) total += work.reviews.length;
    }
    return total;
  }, 0);

  submissionsSummary.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-3xl font-bold text-blue-600">${totalSubmissions}</div>
      <div class="text-sm text-gray-600">Total Submissions</div>
    </div>

    <div class="text-center mb-4">
      <div class="text-2xl font-bold text-green-600">${totalReviews}</div>
      <div class="text-sm text-gray-600">Total Reviews Received</div>
    </div>

    <div class="border-t pt-4 mb-4">
      <p class="font-semibold text-sm mb-1">Latest Submission:</p>
      <p class="text-sm text-gray-700 truncate">${latestSubmission.title || 'Untitled'}</p>
      <p class="text-xs text-gray-500 mt-1">Submitted ${new Date(latestSubmission.createdAt).toLocaleDateString()}</p>
    </div>
  `;
}

function displayAvailableReviews(allWorks) {
  availableReviews.innerHTML = '';

  const availableList = allWorks.filter(work => work.username !== username && !work.completed);

  if (!availableList.length) {
    availableReviews.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <p>No works available for review</p>
        <p class="text-sm mt-1">Check back later for new submissions</p>
      </div>
    `;
    return;
  }

  const reviewCount = availableList.length;
  const sampleWork = availableList[0];

  availableReviews.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-3xl font-bold text-green-600">${reviewCount}</div>
      <div class="text-sm text-gray-600">Works Waiting for Your Feedback</div>
    </div>

    <div class="border-t pt-4">
      <p class="font-semibold text-sm mb-1">Sample Work:</p>
      <p class="text-sm text-gray-700 truncate">${sampleWork.title || 'Untitled'}</p>
      <p class="text-xs text-gray-500 mt-1">By: ${sampleWork.username || 'Unknown'}</p>
      <a href="/all-works.html" class="block mt-3 w-full bg-green-600 text-white text-center py-2 rounded-lg hover:bg-green-700 transition text-sm">
        Start Reviewing
      </a>
    </div>
  `;
}

function showErrorStates() {
  submissionsSummary.innerHTML = '<p class="text-red-500 text-center py-4">Error loading data.</p>';
  availableReviews.innerHTML = '<p class="text-red-500 text-center py-4">Error loading data.</p>';
}

let categoryChartInstance = null;

function renderCategoryChart(submissions) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx || !submissions.length) return;

  const categoryCounts = {};
  submissions.forEach(sub => {
    const cat = sub.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(categoryCounts),
      datasets: [{
        label: 'Submissions per Category',
        data: Object.values(categoryCounts),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

loadDashboardData();

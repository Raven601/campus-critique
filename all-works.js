const username = localStorage.getItem('username');
if (!username) {
  alert('Please login first');
  window.location.href = '/login.html';
}

const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const myWorksLink = document.getElementById('myWorksLink');

const worksContainer = document.getElementById('worksContainer');
const feedbackModal = document.getElementById('feedbackModal');
const modalRating = document.getElementById('modalRating');
const modalComment = document.getElementById('modalComment');
const modalCancel = document.getElementById('modalCancel');
const modalSubmit = document.getElementById('modalSubmit');
const successModal = document.getElementById('successModal');
const closeSuccess = document.getElementById('closeSuccess');
const selectedRating = document.getElementById('selectedRating');

let currentWorkId = null;
let allWorks = [];
let currentCategory = 'all';
let currentSort = 'rating-desc';

const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarUserRole = document.getElementById('sidebarUserRole');

if (username) {
  sidebarUsername.textContent = username;
}

if (myWorksLink) {
  myWorksLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `/my-works.html?username=${encodeURIComponent(username)}`;
  });
}

function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

if (sidebarLogoutBtn) {
  sidebarLogoutBtn.addEventListener('click', logout);
}

if (toggleSidebar) {
  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    if (window.innerWidth >= 768) {
      mainContent.style.marginLeft = sidebar.classList.contains('collapsed') ? '70px' : '0';
    }
  });
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

document.addEventListener('click', (e) => {
  if (window.innerWidth < 768 &&
      !sidebar.contains(e.target) &&
      !mobileMenuBtn.contains(e.target) &&
      sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    sidebar.classList.remove('open');
    mainContent.style.marginLeft = sidebar.classList.contains('collapsed') ? '70px' : '0';
  } else {
    mainContent.style.marginLeft = '0';
  }
});

if (window.innerWidth >= 768) {
  sidebar.classList.remove('collapsed');
}

function setupFilters() {
  document.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-filter-btn').forEach(b => {
        b.classList.remove('filter-active', 'bg-blue-500', 'text-white');
        b.classList.add('bg-gray-200');
      });
      btn.classList.remove('bg-gray-200');
      btn.classList.add('filter-active');
      currentCategory = btn.dataset.category;
      displayWorks();
    });
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('filter-active', 'bg-blue-500', 'text-white');
        b.classList.add('bg-gray-200');
      });
      btn.classList.remove('bg-gray-200');
      btn.classList.add('filter-active');
      currentSort = btn.dataset.sort;
      displayWorks();
    });
  });

  document.querySelector('[data-category="all"]').classList.add('filter-active');
  document.querySelector('[data-sort="rating-desc"]').classList.add('filter-active');
}

function setupStarRating() {
  const starButtons = document.querySelectorAll('.star-rating-btn');
  let currentRating = 0;

  starButtons.forEach((star, index) => {
    star.addEventListener('click', () => {
      currentRating = index + 1;
      updateStars(currentRating);
      modalRating.value = currentRating;
      selectedRating.textContent = `${currentRating}/5`;
    });

    star.addEventListener('mouseover', () => {
      updateStars(index + 1);
    });

    star.addEventListener('mouseout', () => {
      updateStars(currentRating);
    });
  });

  function updateStars(rating) {
    starButtons.forEach((star, i) => {
      star.textContent = i < rating ? '★' : '☆';
    });
  }
}

function displayWorks() {
  let filteredWorks = allWorks.filter(work => {
    if (work.username === username || work.completed) return false;
    if (currentCategory !== 'all' && work.category !== currentCategory) return false;
    return true;
  });

  filteredWorks.sort((a, b) => {
    if (currentSort === 'rating-desc') return calculateAverageRating(b) - calculateAverageRating(a);
    if (currentSort === 'reviews-desc') return (b.feedbacks?.length || 0) - (a.feedbacks?.length || 0);
    if (currentSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (currentSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  renderWorks(filteredWorks);
}

function calculateAverageRating(work) {
  if (!work.feedbacks || work.feedbacks.length === 0) return 0;
  const sum = work.feedbacks.reduce((t, f) => t + f.rating, 0);
  return sum / work.feedbacks.length;
}

function getCategoryDisplayName(category) {
  const map = {
    'language-arts': '📚 Language Arts',
    'mathematics': '➕ Mathematics',
    'science': '🔬 Science',
    'social-studies': '🌍 Social Studies',
    'arts-humanities': '🎨 Arts & Humanities',
    'physical-education': '🏃 Physical Education',
    'foreign-languages': '🌐 Foreign Languages',
    'technology': '💻 Technology',
    'vocational-arts': '🔧 Vocational Arts'
  };
  return map[category] || 'General';
}

function getCategoryColor(category) {
  const map = {
    'language-arts': 'bg-blue-100 text-blue-800',
    'mathematics': 'bg-green-100 text-green-800',
    'science': 'bg-purple-100 text-purple-800',
    'social-studies': 'bg-yellow-100 text-yellow-800',
    'arts-humanities': 'bg-pink-100 text-pink-800',
    'physical-education': 'bg-red-100 text-red-800',
    'foreign-languages': 'bg-indigo-100 text-indigo-800',
    'technology': 'bg-gray-100 text-gray-800',
    'vocational-arts': 'bg-orange-100 text-orange-800'
  };
  return map[category] || 'bg-gray-100 text-gray-800';
}

function renderWorks(works) {
  worksContainer.innerHTML = '';

  if (works.length === 0) {
    worksContainer.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No works found</h3>
        <p class="text-gray-500">Try changing your filters or check back later for new submissions.</p>
      </div>
    `;
    return;
  }

  works.forEach(work => {
    const avgRating = calculateAverageRating(work);
    const reviewCount = work.feedbacks?.length || 0;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow work-card';
    card.innerHTML = `
      <div class="cursor-pointer" onclick="viewWorkDetail('${work._id}')">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg text-blue-800 flex-1">${work.title}</h3>
          <span class="category-badge ${getCategoryColor(work.category)}">${getCategoryDisplayName(work.category)}</span>
        </div>

        <p class="text-gray-600 mb-4 line-clamp-3">${work.description}</p>

        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div class="star-rating text-yellow-400 mr-2">
              ${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}
            </div>
            <span class="text-sm text-gray-600">${avgRating.toFixed(1)}</span>
          </div>
          <span class="text-sm text-gray-500">${reviewCount} reviews</span>
        </div>

        <div class="flex justify-between items-center text-sm text-gray-500">
          <span>By: ${work.username}</span>
          <span>${new Date(work.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button class="rateBtn bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex-1">Rate & Comment</button>
        <button class="reportBtn bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition text-sm">⚠️ Report</button>
      </div>
    `;

    const rateBtn = card.querySelector('.rateBtn');
    rateBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      currentWorkId = work._id;
      modalRating.value = '';
      modalComment.value = '';
      selectedRating.textContent = '0/5';
      document.querySelectorAll('.star-rating-btn').forEach(star => {
        star.textContent = '☆';
      });
      feedbackModal.classList.remove('hidden');
      feedbackModal.classList.add('flex');
    });

    const reportBtn = card.querySelector('.reportBtn');
    reportBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      const reason = prompt(`Why are you reporting "${work.title}"?`);
      if (!reason) return;
      fetch('/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId: work._id,
          reporter: username,
          reason: 'user_reported',
          details: reason
        })
      });
      alert("Report submitted.");
    });

    worksContainer.appendChild(card);
  });
}

// NEW FUNCTION: Redirect to work detail page
function viewWorkDetail(workId) {
  // Store the current work ID in localStorage for backup
  localStorage.setItem('currentWorkId', workId);
  window.location.href = `/work-detail.html?id=${workId}`;
}

async function fetchWorks() {
  try {
    const res = await fetch(`/all-works?username=${encodeURIComponent(username)}`);
    const works = await res.json();
    allWorks = works;
    
    // Store works in localStorage for the detail page
    localStorage.setItem('allWorks', JSON.stringify(works));
    
    displayWorks();
  } catch {
    worksContainer.innerHTML = `<div class="text-center py-8 col-span-3"><p class="text-red-500">Failed to load works.</p></div>`;
  }
}

if (closeSuccess) {
  closeSuccess.addEventListener('click', () => {
    successModal.classList.add('hidden');
    successModal.classList.remove('flex');
  });
}

if (modalCancel) {
  modalCancel.addEventListener('click', () => {
    feedbackModal.classList.add('hidden');
    feedbackModal.classList.remove('flex');
  });
}

if (modalSubmit) {
  modalSubmit.addEventListener('click', async () => {
    const rating = modalRating.value;
    const comment = modalComment.value.trim();

    if (!rating || rating < 1 || rating > 5) {
      alert('Please pick a rating between 1 and 5.');
      return;
    }

    const res = await fetch('/submit-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workId: currentWorkId,
        rating: Number(rating),
        comment,
        reviewer: username
      })
    });

    if (res.ok) {
      feedbackModal.classList.add('hidden');
      successModal.classList.remove('hidden');
      successModal.classList.add('flex');
      
      // Send notification to work owner
      const work = allWorks.find(w => w._id === currentWorkId);
      if (work && work.username !== username) {
        notificationSystem.notifyNewRating(username, rating, work.title, currentWorkId);
      }
      
      fetchWorks();
    } else {
      alert('Failed to submit feedback.');
    }
  });
}

setupFilters();
setupStarRating();
fetchWorks();
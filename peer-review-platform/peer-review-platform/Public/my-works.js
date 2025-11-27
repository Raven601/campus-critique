const username = localStorage.getItem('username');
if (!username) window.location.href = '/login.html';

const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const myWorksContainer = document.getElementById('myWorksContainer');
const sidebarUsername = document.getElementById('sidebarUsername');

// View elements
const workListView = document.getElementById('workListView');
const workDetailView = document.getElementById('workDetailView');

// Work detail elements
const workDetailTitle = document.getElementById('workDetailTitle');
const workDetailCategory = document.getElementById('workDetailCategory');
const workDetailDate = document.getElementById('workDetailDate');
const workDetailStatus = document.getElementById('workDetailStatus');
const workDetailDescription = document.getElementById('workDetailDescription');
const workDetailRating = document.getElementById('workDetailRating');
const workDetailReviewCount = document.getElementById('workDetailReviewCount');
const workDetailFileActions = document.getElementById('workDetailFileActions');
const workDetailDownloadBtn = document.getElementById('workDetailDownloadBtn');
const workDetailFileInfo = document.getElementById('workDetailFileInfo');
const workDetailFileViewer = document.getElementById('workDetailFileViewer');
const workDetailNoFile = document.getElementById('workDetailNoFile');
const workDetailPdfViewer = document.getElementById('workDetailPdfViewer');
const workDetailImageViewer = document.getElementById('workDetailImageViewer');
const workDetailTextViewer = document.getElementById('workDetailTextViewer');
const workDetailUnsupportedFile = document.getElementById('workDetailUnsupportedFile');
const workDetailOverallRating = document.getElementById('workDetailOverallRating');
const workDetailAverageRating = document.getElementById('workDetailAverageRating');
const workDetailTotalReviews = document.getElementById('workDetailTotalReviews');
const workDetailRatingDistribution = document.getElementById('workDetailRatingDistribution');
const workDetailCommentsList = document.getElementById('workDetailCommentsList');
const markDoneBtn = document.getElementById('markDoneBtn');
const deleteWorkBtn = document.getElementById('deleteWorkBtn');

// Filter elements
const titleSearch = document.getElementById('titleSearch');
const dateSearch = document.getElementById('dateSearch');

if (username) sidebarUsername.textContent = username;
if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = '/login.html'; });
if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

const categoryBtns = document.querySelectorAll('.category-filter-btn');
let activeCategory = 'all';
let allWorks = [];
let currentWorkDetail = null;

// Initialize category buttons
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeCategory = btn.dataset.category;
    categoryBtns.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
    btn.classList.add('bg-blue-600', 'text-white');
    filterAndRenderWorks();
  });
});

titleSearch.addEventListener('input', filterAndRenderWorks);
dateSearch.addEventListener('input', filterAndRenderWorks);

async function fetchMyWorks() {
  try {
    const res = await fetch(`/my-works?username=${encodeURIComponent(username)}`);
    const works = await res.json();
    allWorks = works;
    filterAndRenderWorks();
  } catch {
    myWorksContainer.innerHTML = `<div class="text-center py-8 col-span-3"><p class="text-red-500 mb-2">Failed to load your works.</p><p class="text-gray-600 text-sm">Please check your connection and try again.</p></div>`;
  }
}

function filterAndRenderWorks() {
  let filtered = allWorks;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(w => (w.category || 'General').toLowerCase().replace(/\s+/g, '-') === activeCategory);
  }
  const titleText = titleSearch.value.trim().toLowerCase();
  if (titleText) filtered = filtered.filter(w => (w.title || '').toLowerCase().includes(titleText));
  const dateText = dateSearch.value;
  if (dateText) filtered = filtered.filter(w => new Date(w.createdAt).toISOString().split('T')[0] === dateText);
  renderWorks(filtered);
}

function renderWorks(works) {
  myWorksContainer.innerHTML = '';
  if (works.length === 0) {
    myWorksContainer.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No works found</h3>
        <p class="text-gray-500">Try changing your filters or submit your first work!</p>
        <a href="/submit-work.html" class="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Submit Work</a>
      </div>
    `;
    return;
  }

  works.forEach(work => {
    const avgRating = calculateAverageRating(work);
    const reviewCount = work.feedbacks?.length || 0;
    const categoryName = getCategoryDisplayName(work.category);

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition work-card';
    card.innerHTML = `
      <div onclick="showWorkDetail('${work._id || work.id}')">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg text-blue-800 flex-1">${work.title || 'Untitled'}</h3>
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${categoryName}</span>
        </div>
        <p class="text-gray-600 mb-2 line-clamp-3">${work.description || 'No description provided.'}</p>
        <p class="text-sm text-gray-500 mb-4">Submitted: ${new Date(work.createdAt).toLocaleString()}</p>
        
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center">
            <div class="rating-stars text-yellow-400 mr-2">
              ${getStarRatingHTML(avgRating)}
            </div>
            <span class="text-sm text-gray-600">${avgRating.toFixed(1)}</span>
          </div>
          <span class="text-sm text-gray-500">${reviewCount} reviews</span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm font-semibold ${work.completed ? 'text-green-600' : 'text-orange-600'}">
            ${work.completed ? '✅ Completed' : '⏳ Pending Review'}
          </span>
          ${work.filePath || work.fileUrl ? '<span class="text-blue-500 text-sm">📎 File</span>' : ''}
        </div>
      </div>
    `;
    myWorksContainer.appendChild(card);
  });
}

function showWorkDetail(workId) {
  const work = allWorks.find(w => (w._id || w.id) === workId);
  if (!work) return;

  currentWorkDetail = work;
  
  // Update work detail view
  workDetailTitle.textContent = work.title || 'Untitled Work';
  workDetailCategory.textContent = `Category: ${getCategoryDisplayName(work.category)}`;
  workDetailDate.textContent = `Date: ${new Date(work.createdAt).toLocaleDateString()}`;
  workDetailStatus.textContent = work.completed ? 'Completed' : 'Pending Review';
  workDetailStatus.className = `px-2 py-1 rounded-full text-xs font-semibold ${work.completed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`;
  workDetailDescription.textContent = work.description || 'No description provided.';

  // Update ratings
  const avgRating = calculateAverageRating(work);
  workDetailRating.innerHTML = getStarRatingHTML(avgRating);
  const reviews = work.feedbacks?.length || 0;
  workDetailReviewCount.textContent = `(${reviews} review${reviews !== 1 ? 's' : ''})`;

  // Update file viewer
  if (work.filePath || work.fileUrl) {
    workDetailFileActions.classList.remove('hidden');
    const fileName = (work.filePath || work.fileUrl).split('/').pop();
    workDetailFileInfo.textContent = `File: ${fileName}`;
    
    workDetailDownloadBtn.onclick = () => {
      const link = document.createElement('a');
      link.href = work.filePath || work.fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    loadFileViewer(work.filePath || work.fileUrl);
  } else {
    workDetailFileActions.classList.add('hidden');
    showNoFileMessage();
  }

  // Update comments and reviews
  updateCommentsAndReviews(work);

  // Update action buttons
  markDoneBtn.disabled = work.completed;
  markDoneBtn.textContent = work.completed ? '✅ Completed' : 'Mark as Completed';
  markDoneBtn.className = `px-4 py-2 rounded transition ${work.completed ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`;

  markDoneBtn.onclick = async () => {
    if (work.completed) return;
    markDoneBtn.disabled = true;
    markDoneBtn.textContent = 'Updating...';
    
    try {
      const res = await fetch(`/mark-done/${work._id || work.id}`, { method: 'POST' });
      if (res.ok) {
        work.completed = true;
        showWorkDetail(workId); // Refresh the view
        filterAndRenderWorks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error marking work as done:', error);
    } finally {
      markDoneBtn.disabled = work.completed;
      markDoneBtn.textContent = work.completed ? '✅ Completed' : 'Mark as Completed';
    }
  };

  deleteWorkBtn.onclick = async () => {
    if (!confirm('Are you sure you want to delete this work? This action cannot be undone.')) return;
    
    deleteWorkBtn.disabled = true;
    deleteWorkBtn.textContent = 'Deleting...';
    
    try {
      const res = await fetch(`/delete-work/${work._id || work.id}`, { method: 'DELETE' });
      if (res.ok) {
        allWorks = allWorks.filter(w => (w._id || w.id) !== workId);
        showWorkList(); // Go back to list view
        filterAndRenderWorks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting work:', error);
    } finally {
      deleteWorkBtn.disabled = false;
      deleteWorkBtn.textContent = 'Delete Work';
    }
  };

  // Switch to detail view
  workListView.classList.add('hidden');
  workDetailView.classList.remove('hidden');
}

function showWorkList() {
  workDetailView.classList.add('hidden');
  workListView.classList.remove('hidden');
}

function loadFileViewer(filePath) {
  hideAllFileViewers();
  
  let cleanPath = filePath;
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = '/' + cleanPath;
  }
  
  const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
  
  if (fileExtension === 'pdf') {
    workDetailPdfViewer.src = cleanPath;
    workDetailPdfViewer.classList.remove('hidden');
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
    workDetailImageViewer.src = cleanPath;
    workDetailImageViewer.classList.remove('hidden');
  } else if (fileExtension === 'txt') {
    fetch(cleanPath)
      .then(response => response.text())
      .then(text => {
        workDetailTextViewer.textContent = text;
        workDetailTextViewer.classList.remove('hidden');
      })
      .catch(() => showUnsupportedFile());
  } else {
    showUnsupportedFile();
  }
}

function hideAllFileViewers() {
  workDetailNoFile.classList.add('hidden');
  workDetailPdfViewer.classList.add('hidden');
  workDetailImageViewer.classList.add('hidden');
  workDetailTextViewer.classList.add('hidden');
  workDetailUnsupportedFile.classList.add('hidden');
}

function showNoFileMessage() {
  hideAllFileViewers();
  workDetailNoFile.classList.remove('hidden');
}

function showUnsupportedFile() {
  hideAllFileViewers();
  workDetailUnsupportedFile.classList.remove('hidden');
}

function updateCommentsAndReviews(work) {
  const feedbacks = work.feedbacks || [];
  const avgRating = calculateAverageRating(work);
  
  // Update overall rating
  workDetailOverallRating.innerHTML = getStarRatingHTML(avgRating);
  workDetailAverageRating.textContent = avgRating.toFixed(1);
  workDetailTotalReviews.textContent = `based on ${feedbacks.length} review${feedbacks.length !== 1 ? 's' : ''}`;
  
  // Calculate rating distribution
  const distribution = calculateRatingDistribution(feedbacks);
  workDetailRatingDistribution.innerHTML = generateRatingDistributionHTML(distribution, feedbacks.length);
  
  // Update comments list
  if (feedbacks.length === 0) {
    workDetailCommentsList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>No reviews yet. Be the first to share your feedback!</p>
      </div>
    `;
    return;
  }
  
  const sortedFeedbacks = [...feedbacks].sort((a, b) => 
    new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
  );
  
  workDetailCommentsList.innerHTML = sortedFeedbacks.map(feedback => `
    <div class="comment-card bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span class="text-blue-600 font-semibold text-sm">
              ${(feedback.reviewer || feedback.username || 'User').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h5 class="font-semibold text-gray-800">${feedback.reviewer || feedback.username || 'Anonymous'}</h5>
            <div class="flex items-center">
              <div class="rating-stars mr-2">
                ${getStarRatingHTML(feedback.rating)}
              </div>
              <span class="text-sm text-gray-500">${feedback.rating}/5</span>
            </div>
          </div>
        </div>
        <span class="text-sm text-gray-500">
          ${new Date(feedback.createdAt || feedback.date || Date.now()).toLocaleDateString()}
        </span>
      </div>
      <p class="text-gray-700 mt-2">${feedback.comment || 'No comment provided.'}</p>
    </div>
  `).join('');
}

function calculateAverageRating(work) {
  const feedbacks = work.feedbacks || [];
  if (feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((total, feedback) => total + (feedback.rating || 0), 0);
  return sum / feedbacks.length;
}

function calculateRatingDistribution(feedbacks) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach(feedback => {
    const rating = Math.round(feedback.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });
  return distribution;
}

function generateRatingDistributionHTML(distribution, total) {
  if (total === 0) return 'No ratings yet';
  
  let html = '';
  for (let i = 5; i >= 1; i--) {
    const percentage = total > 0 ? (distribution[i] / total) * 100 : 0;
    html += `
      <div class="flex items-center text-sm mb-1">
        <span class="w-4">${i}★</span>
        <div class="w-24 bg-gray-200 rounded-full h-2 mx-2">
          <div class="bg-yellow-400 h-2 rounded-full" style="width: ${percentage}%"></div>
        </div>
        <span class="w-8 text-right">${distribution[i]}</span>
      </div>
    `;
  }
  return html;
}

function getStarRatingHTML(rating) {
  const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const halfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let stars = '★'.repeat(fullStars);
  if (halfStar) stars += '½';
  stars += '☆'.repeat(emptyStars);
  
  return stars;
}

function getCategoryDisplayName(category) {
  if (!category) return 'General';
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
  return map[category] || category;
}

// Make functions available globally
window.showWorkDetail = showWorkDetail;
window.showWorkList = showWorkList;

fetchMyWorks();
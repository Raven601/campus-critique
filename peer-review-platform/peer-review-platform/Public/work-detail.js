const username = localStorage.getItem('username');
if (!username) {
  alert('Please login first');
  window.location.href = '/login.html';
}

// DOM Elements
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarUsername = document.getElementById('sidebarUsername');

// Work detail elements
const workTitle = document.getElementById('workTitle');
const workAuthor = document.getElementById('workAuthor');
const workCategory = document.getElementById('workCategory');
const workDate = document.getElementById('workDate');
const workDescription = document.getElementById('workDescription');
const workRating = document.getElementById('workRating');
const reviewCount = document.getElementById('reviewCount');
const fileActions = document.getElementById('fileActions');
const downloadBtn = document.getElementById('downloadBtn');
const fileInfo = document.getElementById('fileInfo');
const fileViewerContainer = document.getElementById('fileViewerContainer');
const noFileMessage = document.getElementById('noFileMessage');
const pdfViewer = document.getElementById('pdfViewer');
const imageViewer = document.getElementById('imageViewer');
const textViewer = document.getElementById('textViewer');
const unsupportedFile = document.getElementById('unsupportedFile');

// Comments section elements
const overallRating = document.getElementById('overallRating');
const averageRating = document.getElementById('averageRating');
const totalReviews = document.getElementById('totalReviews');
const ratingDistribution = document.getElementById('ratingDistribution');
const commentsList = document.getElementById('commentsList');

// Initialize
if (username) {
  sidebarUsername.textContent = username;
}

if (sidebarLogoutBtn) {
  sidebarLogoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
  });
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// Get work ID from URL
const urlParams = new URLSearchParams(window.location.search);
const workId = urlParams.get('id');

if (!workId) {
  alert('No work specified');
  window.location.href = '/all-works.html';
}

// Fetch work details from existing endpoint
async function loadWorkDetail() {
  try {
    // Try to get all works and find the specific one
    const response = await fetch('/all-works');
    if (!response.ok) {
      throw new Error('Failed to load works');
    }
    
    const allWorks = await response.json();
    const work = allWorks.find(w => w._id === workId || w.id === workId);
    
    if (!work) {
      throw new Error('Work not found');
    }
    
    displayWorkDetails(work);
    displayCommentsAndReviews(work);
    
    // Load file if exists
    if (work.filePath || work.fileUrl) {
      await loadFileViewer(work.filePath || work.fileUrl, work.fileType);
    } else {
      showNoFileMessage();
    }
    
  } catch (error) {
    console.error('Error loading work details:', error);
    showErrorState();
  }
}

function displayWorkDetails(work) {
  workTitle.textContent = work.title || 'Untitled Work';
  workAuthor.textContent = `By: ${work.username || 'Unknown'}`;
  workCategory.textContent = `Category: ${getCategoryDisplayName(work.category)}`;
  workDate.textContent = `Date: ${new Date(work.createdAt || work.date || Date.now()).toLocaleDateString()}`;
  workDescription.textContent = work.description || 'No description provided.';
  
  // Calculate and display rating
  const avgRating = calculateAverageRating(work);
  workRating.innerHTML = getStarRatingHTML(avgRating);
  const reviews = work.feedbacks?.length || work.reviews?.length || 0;
  reviewCount.textContent = `(${reviews} review${reviews !== 1 ? 's' : ''})`;
}

function displayCommentsAndReviews(work) {
  const feedbacks = work.feedbacks || work.reviews || [];
  const avgRating = calculateAverageRating(work);
  
  // Update overall rating section
  overallRating.innerHTML = getStarRatingHTML(avgRating);
  averageRating.textContent = avgRating.toFixed(1);
  totalReviews.textContent = `based on ${feedbacks.length} review${feedbacks.length !== 1 ? 's' : ''}`;
  
  // Calculate rating distribution
  const distribution = calculateRatingDistribution(feedbacks);
  ratingDistribution.innerHTML = generateRatingDistributionHTML(distribution, feedbacks.length);
  
  // Display comments
  displayCommentsList(feedbacks);
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
  if (total === 0) {
    return 'No ratings yet';
  }
  
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

function displayCommentsList(feedbacks) {
  if (feedbacks.length === 0) {
    commentsList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>No reviews yet. Be the first to share your feedback!</p>
      </div>
    `;
    return;
  }
  
  // Sort feedbacks by date (newest first)
  const sortedFeedbacks = [...feedbacks].sort((a, b) => 
    new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
  );
  
  commentsList.innerHTML = sortedFeedbacks.map(feedback => `
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
  const feedbacks = work.feedbacks || work.reviews || [];
  if (feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((total, feedback) => total + (feedback.rating || 0), 0);
  return sum / feedbacks.length;
}

function getStarRatingHTML(rating) {
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
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

async function loadFileViewer(filePath, fileType) {
  hideAllViewers();
  fileActions.classList.remove('hidden');
  
  // Clean file path
  let cleanPath = filePath;
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = '/' + cleanPath;
  }
  
  const fileName = cleanPath.split('/').pop() || 'file';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  
  fileInfo.textContent = `File: ${fileName}`;
  
  // Set up download button
  downloadBtn.onclick = () => {
    const link = document.createElement('a');
    link.href = cleanPath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Determine file type and show appropriate viewer
  if (fileType === 'pdf' || fileExtension === 'pdf') {
    showPdfViewer(cleanPath);
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension)) {
    showImageViewer(cleanPath);
  } else if (fileExtension === 'txt') {
    await showTextViewer(cleanPath);
  } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
    showUnsupportedFile();
  } else {
    // Try to detect file type from content or show as text
    await tryAutoDetectFile(cleanPath, fileExtension);
  }
}

function showPdfViewer(filePath) {
  pdfViewer.src = filePath;
  pdfViewer.classList.remove('hidden');
}

function showImageViewer(filePath) {
  imageViewer.src = filePath;
  imageViewer.onerror = () => {
    showUnsupportedFile();
  };
  imageViewer.classList.remove('hidden');
}

async function showTextViewer(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Failed to load file');
    const text = await response.text();
    textViewer.textContent = text;
    textViewer.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading text file:', error);
    showUnsupportedFile();
  }
}

async function tryAutoDetectFile(filePath, extension) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Failed to load file');
    
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('pdf')) {
      showPdfViewer(filePath);
    } else if (contentType?.startsWith('image/')) {
      showImageViewer(filePath);
    } else if (contentType?.includes('text/')) {
      const text = await response.text();
      textViewer.textContent = text;
      textViewer.classList.remove('hidden');
    } else {
      showUnsupportedFile();
    }
  } catch (error) {
    console.error('Error auto-detecting file type:', error);
    showUnsupportedFile();
  }
}

function showUnsupportedFile() {
  unsupportedFile.classList.remove('hidden');
}

function showNoFileMessage() {
  hideAllViewers();
  fileActions.classList.add('hidden');
  noFileMessage.classList.remove('hidden');
}

function showErrorState() {
  workTitle.textContent = 'Error Loading Work';
  workAuthor.textContent = 'By: Unknown';
  workCategory.textContent = 'Category: Unknown';
  workDate.textContent = 'Date: Unknown';
  workDescription.textContent = 'Failed to load work details. The work may have been deleted or there might be a connection issue.';
  workRating.innerHTML = '☆☆☆☆☆';
  reviewCount.textContent = '(0 reviews)';
  showNoFileMessage();
}

function hideAllViewers() {
  noFileMessage.classList.add('hidden');
  pdfViewer.classList.add('hidden');
  imageViewer.classList.add('hidden');
  textViewer.classList.add('hidden');
  unsupportedFile.classList.add('hidden');
}

// Load work details when page loads
document.addEventListener('DOMContentLoaded', loadWorkDetail);
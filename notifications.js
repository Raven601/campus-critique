class NotificationSystem {
  constructor() {
    this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    this.initializeElements();
    this.setupEventListeners();
    this.loadNotifications();
  }

  initializeElements() {
    this.bell = document.getElementById('notificationBell');
    this.count = document.getElementById('notificationCount');
    this.dropdown = document.getElementById('notificationDropdown');
    this.list = document.getElementById('notificationList');
    this.markAllReadBtn = document.getElementById('markAllRead');
  }

  setupEventListeners() {
    this.bell.addEventListener('click', () => this.toggleDropdown());
    this.markAllReadBtn?.addEventListener('click', () => this.markAllAsRead());
    
    document.addEventListener('click', (e) => {
      if (!this.bell.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.dropdown.classList.add('hidden');
      }
    });
  }

  toggleDropdown() {
    this.dropdown.classList.toggle('hidden');
    if (!this.dropdown.classList.contains('hidden')) {
      this.renderNotifications();
    }
  }

  addNotification(notification) {
    const newNotification = {
      id: this.generateId(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      workId: notification.workId,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.updateUI();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/images/logo.png'
      });
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  renderNotifications() {
    if (this.notifications.length === 0) {
      this.list.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    this.list.innerHTML = this.notifications.map(notification => `
      <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}" 
           onclick="notificationSystem.handleNotificationClick('${notification.id}', '${notification.workId}')">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center mb-1">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full ${this.getNotificationColor(notification.type)} text-white text-xs font-bold mr-2">
                ${this.getNotificationIcon(notification.type)}
              </span>
              <h4 class="font-semibold text-sm text-gray-800">${notification.title}</h4>
            </div>
            <p class="text-xs text-gray-600 ml-8">${notification.message}</p>
            <p class="text-xs text-gray-400 ml-8 mt-1">${this.formatTime(notification.timestamp)}</p>
          </div>
          ${!notification.read ? `
            <span class="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  handleNotificationClick(notificationId, workId) {
    this.markAsRead(notificationId);
    
    if (workId) {
      window.location.href = `/work-detail.html?id=${workId}`;
    }
    
    this.dropdown.classList.add('hidden');
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.updateUI();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveNotifications();
    this.updateUI();
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  updateUI() {
    const unreadCount = this.getUnreadCount();
    this.updateBadge(unreadCount);
    this.renderNotifications();
  }

  updateBadge(count) {
    if (this.count) {
      if (count > 0) {
        this.count.textContent = count > 99 ? '99+' : count;
        this.count.classList.remove('hidden');
      } else {
        this.count.classList.add('hidden');
      }
    }
  }

  loadNotifications() {
    this.updateUI();
  }

  saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  getNotificationColor(type) {
    const colors = {
      comment: 'bg-green-500',
      rating: 'bg-yellow-500',
      reply: 'bg-blue-500',
      system: 'bg-purple-500'
    };
    return colors[type] || 'bg-gray-500';
  }

  getNotificationIcon(type) {
    const icons = {
      comment: '💬',
      rating: '⭐',
      reply: '↩️',
      system: 'ℹ️'
    };
    return icons[type] || '🔔';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return time.toLocaleDateString();
  }

  notifyNewComment(commenter, workTitle, workId) {
    this.addNotification({
      type: 'comment',
      title: 'New Comment',
      message: `${commenter} commented on "${workTitle}"`,
      workId: workId
    });
  }

  notifyNewRating(rater, rating, workTitle, workId) {
    this.addNotification({
      type: 'rating',
      title: 'New Rating',
      message: `${rater} rated "${workTitle}" ${rating}★`,
      workId: workId
    });
  }

  notifyReply(replier, workTitle, workId) {
    this.addNotification({
      type: 'reply',
      title: 'Reply to Comment',
      message: `${replier} replied to your comment on "${workTitle}"`,
      workId: workId
    });
  }

  notifySystem(title, message) {
    this.addNotification({
      type: 'system',
      title: title,
      message: message
    });
  }
}

const notificationSystem = new NotificationSystem();

document.addEventListener('DOMContentLoaded', () => {
  notificationSystem.requestNotificationPermission();
});

window.notificationSystem = notificationSystem;
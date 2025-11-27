const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.'));

// In-memory database (for demo)
let users = [
  { username: 'admin', email: 'admin@test.com', password: 'admin', role: 'admin' },
  { username: 'student1', email: 'student1@test.com', password: '123', role: 'student' }
];
let works = [];

// API Routes
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({ success: true, username: user.username, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/submit-work', (req, res) => {
  const { title, description, category, username } = req.body;
  const newWork = {
    _id: Date.now().toString(),
    title, description, category, username,
    createdAt: new Date(),
    completed: false,
    feedbacks: []
  };
  works.push(newWork);
  res.json({ success: true, message: 'Work submitted successfully' });
});

app.get('/all-works', (req, res) => {
  res.json(works);
});

app.get('/my-works', (req, res) => {
  const { username } = req.query;
  const userWorks = works.filter(work => work.username === username);
  res.json(userWorks);
});

app.post('/submit-feedback', (req, res) => {
  const { workId, rating, comment, reviewer } = req.body;
  const work = works.find(w => w._id === workId);
  if (work) {
    if (!work.feedbacks) work.feedbacks = [];
    work.feedbacks.push({ 
      rating: parseInt(rating), 
      comment, 
      reviewer, 
      createdAt: new Date() 
    });
    res.json({ success: true, message: 'Feedback submitted successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Work not found' });
  }
});

app.post('/mark-done/:workId', (req, res) => {
  const { workId } = req.params;
  const work = works.find(w => w._id === workId);
  if (work) {
    work.completed = true;
    res.json({ success: true, message: 'Work marked as completed' });
  } else {
    res.status(404).json({ success: false, message: 'Work not found' });
  }
});

app.delete('/delete-work/:workId', (req, res) => {
  const { workId } = req.params;
  works = works.filter(w => w._id !== workId);
  res.json({ success: true, message: 'Work deleted successfully' });
});

// Admin routes
app.get('/admin/users', (req, res) => {
  res.json(users);
});

app.get('/admin/reports', (req, res) => {
  res.json([]); // Empty for now
});

// Serve all HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/submit-work.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'submit-work.html'));
});

app.get('/my-works.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'my-works.html'));
});

app.get('/all-works.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'all-works.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Campus Critique server running on port ${PORT}`);
  console.log(`👉 Live at: https://campus-critique.onrender.com`);
  console.log(`📧 Admin: admin@test.com / admin`);
  console.log(`📧 Student: student1@test.com / 123`);
});
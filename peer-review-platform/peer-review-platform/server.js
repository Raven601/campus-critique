const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.txt', '.docx', '.pdf'];
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(
  'mongodb+srv://ianuser:mypass123@reviewplatform.mcgthy4.mongodb.net/userdb?retryWrites=true&w=majority'
);

mongoose.connection.on("connected", () => console.log("MongoDB Connected"));
mongoose.connection.on("error", (err) => console.log("MongoDB Error:", err));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ianski090103@gmail.com',
    pass: 'ylucegbejtvpivqr'
  }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'client' },
  verified: { type: Boolean, default: false },
  verifyToken: { type: String, default: null }
});

const User = mongoose.model('User', userSchema);

const workSchema = new mongoose.Schema({
  username: String,
  title: String,
  description: String,
  category: {
    type: String,
    required: true,
    default: 'general',
    enum: [
      'language-arts',
      'mathematics',
      'science',
      'social-studies',
      'arts-humanities',
      'physical-education',
      'foreign-languages',
      'technology',
      'vocational-arts',
      'general'
    ]
  },
  fileName: String,
  filePath: String,
  fileSize: Number,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  feedbacks: [
    {
      reviewer: String,
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

workSchema.virtual('averageRating').get(function () {
  if (!this.feedbacks || this.feedbacks.length === 0) return 0;
  const sum = this.feedbacks.reduce((a, b) => a + b.rating, 0);
  return (sum / this.feedbacks.length).toFixed(1);
});

const Work = mongoose.model('Work', workSchema);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'landing.html'));
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: 'Email already registered' });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: 'Username already taken' });

    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'client';

    const hashed = await bcrypt.hash(password, 10);

    let verified = true;
    let verifyToken = null;

    if (role === 'client') {
      verified = false;
      verifyToken = crypto.randomBytes(40).toString('hex');
    }

    const newUser = new User({
      username,
      email,
      password: hashed,
      role,
      verified,
      verifyToken
    });

    await newUser.save();

    if (role === 'client') {
      const link = `http://localhost:3000/verify?token=${verifyToken}`;
      await transporter.sendMail({
        from: 'ianski090103@gmail.com',
        to: email,
        subject: 'Verify your account',
        html: `<h2>Email Verification</h2><p>Click below:</p><a href="${link}">${link}</a>`
      });
    }

    res.status(201).json({
      message:
        role === "admin"
          ? "Admin created successfully! No verification required."
          : "Check your email to verify your account.",
      role
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verifyToken: token });
    if (!user) return res.send('Invalid or expired verification token.');

    user.verified = true;
    user.verifyToken = null;
    await user.save();

    res.send(`<h2>Email Verified!</h2><p>You may now <a href="/login.html">log in</a>.</p>`);
  } catch {
    res.send('Server error.');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Invalid email or password' });

    if (user.role !== 'admin' && !user.verified)
      return res.status(403).json({ message: 'Please verify your email before logging in.' });

    res.status(200).json({
      message: 'Login successful!',
      username: user.username,
      role: user.role
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/submit-work', upload.single('workFile'), async (req, res) => {
  try {
    const { username, title, description, category } = req.body;
    if (!username || !title || !description)
      return res.status(400).json({ message: 'All fields are required' });

    const valid = [
      'language-arts',
      'mathematics',
      'science',
      'social-studies',
      'arts-humanities',
      'physical-education',
      'foreign-languages',
      'technology',
      'vocational-arts'
    ];
    const workCategory = valid.includes(category) ? category : 'general';

    const data = { username, title, description, category: workCategory };

    if (req.file) {
      data.fileName = req.file.originalname;
      data.filePath = req.file.path;
      data.fileSize = req.file.size;
    }

    const work = new Work(data);
    await work.save();

    res.status(201).json({ message: 'Work submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

app.get('/my-works', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Username required' });

    const works = await Work.find({ username }).sort({ createdAt: -1 });
    const result = works.map(w => {
      const obj = w.toObject();
      const avg =
        w.feedbacks && w.feedbacks.length
          ? w.feedbacks.reduce((a, b) => a + b.rating, 0) / w.feedbacks.length
          : 0;
      return { ...obj, averageRating: avg.toFixed(1), reviewCount: w.feedbacks.length };
    });

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/all-works', async (req, res) => {
  try {
    const { username, category } = req.query;
    let query = { completed: { $ne: true } };

    if (username) query.username = { $ne: username };
    if (category && category !== 'all') query.category = category;

    const works = await Work.find(query).sort({ createdAt: -1 });
    const result = works.map(w => {
      const obj = w.toObject();
      const avg =
        w.feedbacks && w.feedbacks.length
          ? w.feedbacks.reduce((a, b) => a + b.rating, 0) / w.feedbacks.length
          : 0;
      return { ...obj, averageRating: avg.toFixed(1), reviewCount: w.feedbacks.length };
    });

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/submit-feedback', async (req, res) => {
  try {
    const { workId, reviewer, rating, comment } = req.body;
    if (!workId || !reviewer || !rating)
      return res.status(400).json({ message: 'All fields required' });

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ message: 'Work not found' });

    work.feedbacks.push({ reviewer, rating: Number(rating), comment });
    await work.save();

    res.status(201).json({ message: 'Feedback submitted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/mark-done', async (req, res) => {
  try {
    const { workId, username } = req.body;
    const work = await Work.findOne({ _id: workId, username });
    if (!work) return res.status(404).json({ message: 'Work not found' });

    work.completed = true;
    await work.save();

    res.json({ message: 'Work marked completed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/delete-work', async (req, res) => {
  try {
    const { workId, username } = req.body;
    const work = await Work.findOne({ _id: workId, username });
    if (!work) return res.status(404).json({ message: 'Work not found' });

    if (work.filePath && fs.existsSync(work.filePath)) fs.unlinkSync(work.filePath);
    await Work.findByIdAndDelete(workId);

    res.json({ message: 'Work deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/user-profile', async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Not found' });

    res.json({ username: user.username, email: user.email, role: user.role });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Not found' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password reset' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const reportSchema = new mongoose.Schema({
  workId: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true },
  reporter: String,
  reason: String,
  details: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  resolvedBy: String
});

const Report = mongoose.model('Report', reportSchema);

app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/reports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('workId')
      .sort({ createdAt: -1 });

    const result = reports.map(r => ({
      _id: r._id,
      work: r.workId
        ? {
            _id: r.workId._id,
            title: r.workId.title,
            description: r.workId.description,
            username: r.workId.username,
            category: r.workId.category,
            createdAt: r.workId.createdAt
          }
        : { title: 'Work Deleted', description: 'Deleted' },
      reporter: r.reporter,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt
    }));

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/reports', async (req, res) => {
  try {
    const { workId, reporter, reason, details } = req.body;
    const report = new Report({ workId, reporter, reason, details });
    await report.save();
    res.json({ message: 'Report submitted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/reports/:reportId/dismiss', async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: 'Not found' });

    report.status = 'dismissed';
    report.resolvedAt = new Date();
    report.resolvedBy = 'admin';
    await report.save();

    res.json({ message: 'Report dismissed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/admin/works/:workId', async (req, res) => {
  try {
    const work = await Work.findById(req.params.workId);
    if (work && work.filePath && fs.existsSync(work.filePath))
      fs.unlinkSync(work.filePath);

    await Work.findByIdAndDelete(req.params.workId);
    await Report.deleteMany({ workId: req.params.workId });

    res.json({ message: 'Work deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/admin/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (user && user.role === 'admin')
      return res.status(400).json({ message: 'Cannot delete admin' });

    const works = await Work.find({ username });
    works.forEach(w => {
      if (w.filePath && fs.existsSync(w.filePath)) fs.unlinkSync(w.filePath);
    });

    await User.deleteOne({ username });
    await Work.deleteMany({ username });
    await Report.deleteMany({ reporter: username });

    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/users/:username/warn', async (req, res) => {
  try {
    res.json({ message: 'Warning sent' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Add this to your server.js or routes file
app.get('/api/works/:id', async (req, res) => {
  try {
    const workId = req.params.id;
    
    // Fetch work from database
    const work = await db.collection('works').findOne({ _id: new ObjectId(workId) });
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    // Populate feedbacks if needed
    const feedbacks = await db.collection('feedbacks')
      .find({ workId: workId })
      .toArray();
    
    work.feedbacks = feedbacks;
    
    res.json(work);
  } catch (error) {
    console.error('Error fetching work:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
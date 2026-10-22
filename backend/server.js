const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./src/config/db');
const { initSocket } = require('./src/services/socketService');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const milestoneRoutes = require('./src/routes/milestoneRoutes');
const issueRoutes = require('./src/routes/issueRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const automationRoutes = require('./src/routes/automationRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const seedAdminUser = require('./src/utils/seedAdmin');

const app = express();
const server = http.createServer(app);

// Connect to Database & seed system admin
connectDB().then(() => {
  seedAdminUser();
});

// Initialize WebSockets
initSocket(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes'
  }
});
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'ProTrack SaaS API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error Handler Middleware
app.use(errorHandler);

const { checkAndSendDueDateReminders } = require('./src/services/reminderService');

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[ProTrack API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Initial check after 30 seconds, then recurring every hour
  setTimeout(() => {
    checkAndSendDueDateReminders().catch((err) => console.error('[Reminder Runner]:', err.message));
  }, 30000);

  setInterval(() => {
    checkAndSendDueDateReminders().catch((err) => console.error('[Reminder Runner]:', err.message));
  }, 60 * 60 * 1000);
});

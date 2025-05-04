// backend/api-gateway/src/index.js
require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health check endpoint (unprotected)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', timestamp: new Date() });
});

// Auth middleware for protected routes
app.use('/api/*', verifyToken);

// Service routes
app.use('/api/auth', createProxyMiddleware({ 
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/auth': ''}
}));

app.use('/api/dashboard', createProxyMiddleware({ 
  target: process.env.DASHBOARD_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/dashboard': ''}
}));

app.use('/api/courses', createProxyMiddleware({ 
  target: process.env.COURSES_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/courses': ''}
}));

app.use('/api/events', createProxyMiddleware({ 
  target: process.env.EVENTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/events': ''}
}));

app.use('/api/insights', createProxyMiddleware({ 
  target: process.env.INSIGHTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/insights': ''}
}));

app.use('/api/notifications', createProxyMiddleware({ 
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/notifications': ''}
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
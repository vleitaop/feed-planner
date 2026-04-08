require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically at /uploads
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/posts', postsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'sqlite', timestamp: new Date().toISOString() });
});

// ── Serve React build in production ──
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback: any non-API route returns index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💾 Database: SQLite (data.db)`);
  console.log(`📁 Uploads: ${uploadsDir}`);
});

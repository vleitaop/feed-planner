require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically at /uploads
app.use('/uploads', express.static(uploadsDir));

// API Routes
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'sqlite', timestamp: new Date().toISOString() });
});

// ── Serve React build in production ──
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-API, non-uploads route returns index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('📦 Serving React build from', clientDist);
} else {
  console.log('⚠️  No client/dist found — API-only mode');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💾 Database: SQLite (data.db)`);
  console.log(`📁 Uploads: ${uploadsDir}`);
});

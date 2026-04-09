require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ── CONEXIÓN A MONGODB ATLAS ──
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: Falta la variable MONGODB_URI en el entorno');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('🍃 Conectado exitosamente a MongoDB Atlas'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err));
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'mongodb', timestamp: new Date().toISOString() });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('📦 Serving React build from', clientDist);
} else {
  console.log('⚠️  No client/dist found — API-only mode');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
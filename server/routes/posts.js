const express = require('express');
const router = express.Router();
const db = require('../db');
const { randomUUID } = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Multer setup ─────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} not allowed`));
    }
  },
});

// Helper: build the /uploads/... URL from a filename
function fileUrl(filename) {
  return `/uploads/${filename}`;
}

// Helper: delete a file from uploads (best-effort, don't throw)
function deleteFile(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsDir, path.basename(urlPath));
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}

// ─── GET /api/posts ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM posts ORDER BY position ASC').all();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts ─────────────────────────────────────────────────────────
// Accepts multipart/form-data with field "media" (required) + "cover" (optional for reels)
// Also accepts text fields: type, position, caption
const createUpload = upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

router.post('/', createUpload, (req, res) => {
  const { type, position, caption } = req.body;
  const mediaFile = req.files?.media?.[0];
  const coverFile = req.files?.cover?.[0];

  if (!type || !mediaFile || position === undefined || position === null) {
    return res.status(400).json({ message: 'type, media file, and position are required' });
  }

  const validTypes = ['image', 'carousel', 'reel'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${validTypes.join(', ')}` });
  }

  try {
    const existing = db.prepare('SELECT id FROM posts WHERE position = ?').get(Number(position));
    if (existing) {
      return res.status(409).json({ message: `Slot ${position} is already occupied` });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const mediaUrl = fileUrl(mediaFile.filename);
    const coverUrl = coverFile ? fileUrl(coverFile.filename) : null;

    db.prepare(
      'INSERT INTO posts (id, type, mediaUrl, coverUrl, caption, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, type, mediaUrl, coverUrl, caption || '', Number(position), now, now);

    const saved = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT /api/posts/reorder ───────────────────────────────────────────────────
router.put('/reorder', (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: 'Expected a non-empty array of { id, position }' });
  }

  const updateStmt = db.prepare('UPDATE posts SET position = ?, updatedAt = ? WHERE id = ?');
  const now = new Date().toISOString();

  const reorderMany = db.transaction((items) => {
    for (const { id, position } of items) {
      updateStmt.run(position, now, id);
    }
  });

  try {
    reorderMany(updates);
    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────
// Accepts multipart/form-data. Only replaces files if new ones are provided.
const updateUpload = upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

router.put('/:id', updateUpload, (req, res) => {
  const { type, caption } = req.body;
  const mediaFile = req.files?.media?.[0];
  const coverFile = req.files?.cover?.[0];

  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newType = type !== undefined ? type : post.type;
    let newMediaUrl = post.mediaUrl;
    let newCoverUrl = post.coverUrl;
    const newCaption = caption !== undefined ? caption : (post.caption || '');
    const now = new Date().toISOString();

    // Replace media file if new one is uploaded
    if (mediaFile) {
      deleteFile(post.mediaUrl); // remove old file
      newMediaUrl = fileUrl(mediaFile.filename);
    }

    // Replace cover file if new one is uploaded
    if (coverFile) {
      deleteFile(post.coverUrl); // remove old file
      newCoverUrl = fileUrl(coverFile.filename);
    }

    // If type changed away from 'reel', remove the cover
    if (newType !== 'reel') {
      if (newCoverUrl) deleteFile(newCoverUrl);
      newCoverUrl = null;
    }

    db.prepare(
      'UPDATE posts SET type = ?, mediaUrl = ?, coverUrl = ?, caption = ?, updatedAt = ? WHERE id = ?'
    ).run(newType, newMediaUrl, newCoverUrl, newCaption, now, req.params.id);

    const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Delete uploaded files
    deleteFile(post.mediaUrl);
    deleteFile(post.coverUrl);

    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Post deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

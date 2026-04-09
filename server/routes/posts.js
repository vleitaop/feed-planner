const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ── 1. CONFIGURACIÓN DE CLOUDINARY ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'punto_nemo_feed',
    resource_type: 'auto'
  },
});

// Usamos single('media') para ser super estrictos con el archivo
const upload = multer({ storage: storage });

// ── 2. MODELO DE BASE DE DATOS ──
const postSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['image', 'carousel', 'reel'] },
  mediaUrl: { type: String, required: true },
  coverUrl: { type: String },
  position: { type: Number, required: true }
});

const Post = mongoose.model('Post', postSchema);

// ── 3. RUTAS ──
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ position: 1 });
    const formattedPosts = posts.map(post => ({
      id: post._id,
      type: post.type,
      mediaUrl: post.mediaUrl,
      coverUrl: post.coverUrl,
      position: post.position
    }));
    res.json(formattedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚨 MODO DETECTIVE ACTIVADO EN LA CREACIÓN
router.post('/', (req, res) => {
  upload.single('media')(req, res, async (err) => {
    // 1. Si Cloudinary falla (por ej: llaves incorrectas), atrapamos el error y lo gritamos
    if (err) {
      return res.status(400).json({ error: "❌ Error de Cloudinary/Multer: " + err.message });
    }

    try {
      let postData = { ...req.body };

      // Si vino un archivo, le sacamos la URL de Cloudinary
      if (req.file) {
        postData.mediaUrl = req.file.path;
      }

      // 2. Si el servidor recibe texto vacío, te mostramos exactamente qué recibió
      if (!postData.type || !postData.position || !postData.mediaUrl) {
        return res.status(400).json({
          error: `❌ Faltan datos o la foto no subió. Textos recibidos: ${JSON.stringify(req.body)}. ¿Llegó archivo?: ${req.file ? 'Sí' : 'No'}`
        });
      }

      const newPost = new Post(postData);
      const savedPost = await newPost.save();
      res.status(201).json({ id: savedPost._id, ...savedPost._doc });

    } catch (dbErr) {
      res.status(400).json({ error: "❌ Error de Base de Datos: " + dbErr.message });
    }
  });
});

router.put('/reorder', async (req, res) => {
  try {
    const items = req.body;
    await Promise.all(items.map(item =>
      Post.findByIdAndUpdate(item.id, { position: item.position })
    ));
    res.json({ message: 'Grilla reordenada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  upload.single('media')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: "❌ Error: " + err.message });
    try {
      let updateData = { ...req.body };
      if (req.file) updateData.mediaUrl = req.file.path;

      const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.json({ id: updatedPost._id, ...updatedPost._doc });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
});

router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Posteo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
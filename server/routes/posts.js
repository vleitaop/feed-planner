const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Post = require('../models/Post');

// 1. Configuración de Cloudinary (Usa las variables que ya tenés en Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configuración de Multer para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'feed_planner',
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov'],
    resource_type: 'auto', // Esto permite subir videos (Reels)
  },
});

const upload = multer({ storage });

// --- RUTAS ---

// CREAR POST (Imagen, Carrusel o Reel)
router.post('/', upload.fields([
  { name: 'media', maxCount: 10 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { type, position, caption } = req.body;

    // Extraer URLs de Cloudinary
    const mediaFiles = req.files['media'] || [];
    const mediaUrls = mediaFiles.map(file => file.path); 

    const coverUrl = req.files['cover'] ? req.files['cover'][0].path : null;

    const newPost = new Post({
      type,
      position: Number(position),
      caption,
      mediaUrls, // Array de URLs
      coverUrl
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el post', error });
  }
});

// OBTENER TODOS LOS POSTS
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ position: 1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener posts' });
  }
});

// ACTUALIZAR POST
router.put('/:id', upload.fields([
  { name: 'media', maxCount: 10 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { caption, type } = req.body;
    const updateData = { caption, type };

    if (req.files['media']) {
      updateData.mediaUrls = req.files['media'].map(file => file.path);
    }
    if (req.files['cover']) {
      updateData.coverUrl = req.files['cover'][0].path;
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar' });
  }
});

// ELIMINAR POST
router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar' });
  }
});

module.exports = router;
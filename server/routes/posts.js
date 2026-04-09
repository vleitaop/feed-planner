const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const upload = require('../middleware/cloudinary.config'); // Asegurate de que esta sea tu ruta a la config de multer

router.post('/', upload.fields([
  { name: 'media', maxCount: 10 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { type, position, caption } = req.body;

    // Multer + Cloudinary suben los archivos y te dan el 'path' (la URL)
    const mediaFiles = req.files['media'] || [];
    const urls = mediaFiles.map(file => file.path); // URLs de Cloudinary

    const coverFile = req.files['cover'] ? req.files['cover'][0].path : null;

    const newPost = new Post({
      type,
      position: Number(position),
      caption,
      mediaUrls: urls, // Guardamos el array de links
      coverUrl: coverFile
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el post' });
  }
});

module.exports = router;
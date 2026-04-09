const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
// Importá acá tu configuración de multer/cloudinary (ajustá la ruta si es distinta)
// Por ejemplo: const upload = require('../middleware/cloudinaryConfig'); 
// O si lo tenés definido en otro lado, asegurate de tener el objeto 'upload'

// ESTA ES LA RUTA QUE CREA EL POST (Tu "createPost")
router.post('/', upload.fields([
  { name: 'media', maxCount: 10 }, // Permite hasta 10 fotos para el carrusel
  { name: 'cover', maxCount: 1 }   // La portada del Reel
]), async (req, res) => {
  try {
    const { type, position, caption } = req.body;

    // 1. Extraemos las URLs de las fotos/videos que subió Multer a Cloudinary
    // req.files['media'] es un array. Sacamos el 'path' de cada uno.
    const files = req.files['media'] || [];
    const mediaUrls = files.map(file => file.path || file.url);

    // 2. Extraemos la portada si es un Reel
    const coverUrl = req.files['cover'] ? (req.files['cover'][0].path || req.files['cover'][0].url) : null;

    // 3. Creamos el post en MongoDB
    const newPost = new Post({
      type,
      position: parseInt(position),
      caption,
      mediaUrls: mediaUrls, // Guardamos el array de URLs
      coverUrl: coverUrl
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ message: 'Error al guardar en la base de datos', error });
  }
});

// ... (Acá abajo seguro tenés el router.get o router.delete, dejalos como están)

module.exports = router;

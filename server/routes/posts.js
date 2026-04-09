const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── 1. DEFINIMOS EL MODELO DE DATOS ──
// Esto le dice a MongoDB qué forma tiene cada posteo
const postSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['image', 'carousel', 'reel'] 
  },
  mediaUrl: { type: String, required: true },
  coverUrl: { type: String }, // Solo necesario para los reels
  position: { type: Number, required: true }
});

const Post = mongoose.model('Post', postSchema);

// ── 2. RUTAS DE LA API ──

// GET: Traer todos los posteos ordenados por su posición en la grilla
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ position: 1 });
    // Mongoose devuelve '_id', pero el frontend a veces espera 'id'. Lo mapeamos por las dudas.
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

// POST: Crear un nuevo posteo (cuando hacés clic en el '+')
router.post('/', async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.status(201).json({
      id: savedPost._id,
      ...savedPost._doc
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /reorder: Actualizar el orden cuando arrastrás y soltás (Drag & Drop)
router.put('/reorder', async (req, res) => {
  try {
    const items = req.body; // El frontend debe enviar un array de { id, position }
    
    // Actualizamos todas las posiciones en paralelo
    await Promise.all(items.map(item =>
      Post.findByIdAndUpdate(item.id, { position: item.position })
    ));
    
    res.json({ message: 'Grilla reordenada correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /:id : Editar un posteo existente (cambiar foto o tipo)
router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({
      id: updatedPost._id,
      ...updatedPost._doc
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Borrar un posteo
router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Posteo eliminado de la grilla' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['image', 'carousel', 'reel'] },
  mediaUrl: { type: String, required: true },
  coverUrl: { type: String },
  position: { type: Number, required: true }
});

const Post = mongoose.model('Post', postSchema);

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

router.post('/', async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.status(201).json({ id: savedPost._id, ...savedPost._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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

router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ id: updatedPost._id, ...updatedPost._doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
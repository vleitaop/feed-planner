const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'carousel', 'reel'],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    coverUrl: {
      type: String,
      default: null,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
    },
  },
  { timestamps: true }
);

// Ensure each position is unique
PostSchema.index({ position: 1 }, { unique: true });

module.exports = mongoose.model('Post', PostSchema);

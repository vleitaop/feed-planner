const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'carousel', 'reel'],
      required: true,
    },
    // CAMBIO: Ahora es un array para guardar las URLs de Cloudinary
    mediaUrls: [{
      type: String,
      required: true,
    }],
    coverUrl: {
      type: String,
      default: null,
    },
    position: {
      type: Number,
      required: true,
    },
    caption: {
      type: String,
    }
  },
  { timestamps: true }
);

PostSchema.index({ position: 1 }, { unique: true });

module.exports = mongoose.model('Post', PostSchema);
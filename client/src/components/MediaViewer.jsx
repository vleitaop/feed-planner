import { useState, useEffect } from 'react';

/**
 * MediaViewer — full-screen lightbox for Preview mode.
 * Displays media + caption below.
 */
export default function MediaViewer({ post, onClose }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Type badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-white/60 text-xs font-medium uppercase tracking-widest">
          {post.type}
        </span>
      </div>

      {/* Content */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] animate-scale-in flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {post.type === 'reel' ? (
          <ReelViewer post={post} />
        ) : (
          <ImageViewer post={post} />
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mt-4 px-4 max-w-md">
            <p className="text-white text-sm text-center leading-relaxed">
              {post.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageViewer({ post }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && (
        <div className="w-64 h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <img
        src={post.mediaUrl}
        alt={post.caption || post.type}
        className={`max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
      {/* Carousel indicator */}
      {post.type === 'carousel' && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      )}
    </div>
  );
}

function ReelViewer({ post }) {
  return (
    <video
      src={post.mediaUrl}
      poster={post.coverUrl || undefined}
      controls
      autoPlay
      className="max-w-[85vw] max-h-[75vh] rounded-lg shadow-2xl bg-black"
      style={{ aspectRatio: '9/16', maxHeight: '70vh' }}
    >
      Your browser does not support the video tag.
    </video>
  );
}

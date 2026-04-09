import { useState, useEffect } from 'react';

export default function MediaViewer({ post, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="relative max-w-[90vw] max-h-[90vh] animate-scale-in flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {post.type === 'reel' ? <ReelViewer post={post} /> : <ImageViewer post={post} />}
        {post.caption && (
          <div className="mt-4 px-4 max-w-md">
            <p className="text-white text-sm text-center leading-relaxed">{post.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageViewer({ post }) {
  const [loaded, setLoaded] = useState(false);
  // CORRECCIÓN: Usamos la primera imagen del array
  const src = (post.mediaUrls && post.mediaUrls.length > 0) ? post.mediaUrls[0] : post.mediaUrl;

  return (
    <div className="relative">
      {!loaded && (
        <div className="w-64 h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={post.caption || post.type}
        className={`max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
      {post.type === 'carousel' && post.mediaUrls?.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {post.mediaUrls.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReelViewer({ post }) {
  // CORRECCIÓN: El video es el primer elemento del array
  const src = (post.mediaUrls && post.mediaUrls.length > 0) ? post.mediaUrls[0] : post.mediaUrl;

  return (
    <video
      src={src}
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
import { useState, useEffect } from 'react';

export default function MediaViewer({ post, onClose }) {
  // Cerrar con la tecla Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Bloquear el scroll del fondo cuando el viewer está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Botón de cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Contenido Principal */}
      <div
        className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {post.type === 'reel' ? (
          <ReelViewer post={post} />
        ) : (
          <ImageViewer post={post} />
        )}

        {/* Pie de foto */}
        {post.caption && (
          <div className="mt-6 px-4 max-w-lg">
            <p className="text-white text-sm text-center font-light leading-relaxed opacity-90">
              {post.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageViewer({ post }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Array de imágenes (soporta el formato nuevo y el viejo por las dudas)
  const images = post.mediaUrls && post.mediaUrls.length > 0 
    ? post.mediaUrls 
    : [post.mediaUrl];

  const hasMultiple = images.length > 1;

  const nextImage = () => {
    setLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Navegación con teclado (Flechas)
  useEffect(() => {
    if (!hasMultiple) return;
    function handleKeyDown(e) {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultiple, currentIndex]);

  return (
    <div className="relative group flex items-center justify-center">
      {/* Cargando... */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Imagen actual */}
      <img
        src={images[currentIndex]}
        alt={`Slide ${currentIndex + 1}`}
        className={`max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />

      {/* Botones de Navegación (Solo si es Carrusel) */}
      {hasMultiple && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-[-50px] md:left-4 p-2 text-white/50 hover:text-white transition-colors"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextImage}
            className="absolute right-[-50px] md:right-4 p-2 text-white/50 hover:text-white transition-colors"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Indicadores (Puntitos) */}
          <div className="absolute bottom-[-25px] flex justify-center gap-2">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-white scale-125' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReelViewer({ post }) {
  // El video es el primer elemento del array mediaUrls
  const videoSrc = (post.mediaUrls && post.mediaUrls.length > 0) 
    ? post.mediaUrls[0] 
    : post.mediaUrl;

  return (
    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50">
      <video
        src={videoSrc}
        poster={post.coverUrl || undefined}
        controls
        autoPlay
        className="max-w-full max-h-[75vh] w-auto"
        style={{ aspectRatio: '9/16' }}
      >
        Tu navegador no soporta videos.
      </video>
    </div>
  );
}
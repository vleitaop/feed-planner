import { useState, useRef, useEffect } from 'react';
import { createPost } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

const TYPES = [
  { value: 'image', label: 'Imagen', emoji: '🖼️' },
  { value: 'carousel', label: 'Carousel', emoji: '🔲' },
  { value: 'reel', label: 'Reel', emoji: '▶️' },
];

export default function AddPostModal({ position, onClose, onSave }) {
  const [type, setType] = useState('image');
  const [mediaFiles, setMediaFiles] = useState([]); // Ahora es un array
  const [mediaPreviews, setMediaPreviews] = useState([]); // Ahora es un array
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const mediaInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Limpieza de memoria para las URLs creadas
  useEffect(() => {
    return () => {
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [mediaPreviews, coverPreview]);

  function handleMediaChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Si es carousel permitimos varios, si no, solo el primero
    const selectedFiles = type === 'carousel' ? files : [files[0]];
    setMediaFiles(selectedFiles);

    // Generar previews
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(urls);
  }

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mediaFiles.length === 0) {
      setError('Seleccioná al menos un archivo.');
      return;
    }
    if (type === 'reel' && !coverFile) {
      setError('Se requiere una imagen de portada para Reels.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('position', position);
    formData.append('caption', caption);

    // AGREGAR ARCHIVOS: 
    // Si es carrusel, recorremos el array y agregamos todos bajo la misma llave 'media'
    // Si es imagen o reel, el array solo tiene uno, así que funciona igual.
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    if (type === 'reel' && coverFile) {
      formData.append('cover', coverFile);
    }

    setLoading(true);
    try {
      await createPost(formData);
      showToast('Post guardado correctamente', 'success');
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el post.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        className="bg-white w-full max-w-sm mx-auto rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Agregar Post</h2>
            <p className="text-xs text-gray-400 mt-0.5">Slot {position + 1} de 12</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de post</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setType(t.value);
                    setMediaFiles([]); // Limpiamos al cambiar tipo para evitar errores
                    setMediaPreviews([]);
                  }}
                  className={[
                    'flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all',
                    type === t.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400',
                  ].join(' ')}
                >
                  <span className="text-base">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {type === 'reel' ? 'Video' : type === 'carousel' ? 'Imágenes (Múltiples)' : 'Imagen'}
            </label>
            <input
              ref={mediaInputRef}
              type="file"
              accept={type === 'reel' ? 'video/*' : 'image/*'}
              multiple={type === 'carousel'}
              onChange={handleMediaChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {mediaFiles.length > 0 
                ? `${mediaFiles.length} seleccionado(s)` 
                : `Seleccionar ${type === 'reel' ? 'video' : 'archivo'}...`}
            </button>
          </div>

          {type === 'reel' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Portada (imagen)</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                {coverFile ? coverFile.name : 'Seleccionar portada...'}
              </button>
            </div>
          )}

          {/* Sección de Previews Adaptable */}
          {mediaPreviews.length > 0 && (
            <div className={`grid gap-2 ${type === 'carousel' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {mediaPreviews.map((src, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-gray-100 aspect-square">
                  {type === 'reel' ? (
                    <video src={src} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              {type === 'reel' && coverPreview && (
                <div className="rounded-lg overflow-hidden border border-blue-400 aspect-square relative">
                  <span className="absolute top-0 left-0 bg-blue-500 text-white text-[8px] px-1 uppercase">Portada</span>
                  <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="add-caption" className="block text-xs font-medium text-gray-500 mb-1.5">Pie de foto</label>
            <textarea
              id="add-caption"
              rows={2}
              placeholder="Escribí un pie de foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-black text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
              {loading ? 'Subiendo...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
}

export function Backdrop({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      {children}
    </div>
  );
}

export function CloseButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    </button>
  );
}
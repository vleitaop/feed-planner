import { useState, useRef } from 'react';
import { createPost } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

const TYPES = [
  { value: 'image', label: 'Imagen', emoji: '🖼️' },
  { value: 'carousel', label: 'Carousel', emoji: '🔲' },
  { value: 'reel', label: 'Reel', emoji: '▶️' },
];

export default function AddPostModal({ position, onClose, onSave }) {
  const [type, setType] = useState('image');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const mediaInputRef = useRef(null);
  const coverInputRef = useRef(null);

  function handleMediaChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    // Generate local preview
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!mediaFile) {
      setError('Seleccioná un archivo multimedia.');
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
    formData.append('media', mediaFile);
    if (type === 'reel' && coverFile) {
      formData.append('cover', coverFile);
    }

    setLoading(true);
    try {
      await createPost(formData);
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el post.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const thumbSrc = type === 'reel' && coverPreview ? coverPreview : mediaPreview;

  return (
    <Backdrop onClose={onClose}>
      <div
        className="bg-white w-full max-w-sm mx-auto rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Agregar Post</h2>
            <p className="text-xs text-gray-400 mt-0.5">Slot {position + 1} de 12</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de post</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
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

          {/* Media file upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {type === 'reel' ? 'Video' : 'Imagen'}
            </label>
            <input
              ref={mediaInputRef}
              type="file"
              accept={type === 'reel' ? 'video/*' : 'image/*'}
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
              {mediaFile ? mediaFile.name : `Seleccionar ${type === 'reel' ? 'video' : 'imagen'}...`}
            </button>
          </div>

          {/* Cover file upload — Reels only */}
          {type === 'reel' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Portada (imagen)
              </label>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {coverFile ? coverFile.name : 'Seleccionar portada...'}
              </button>
            </div>
          )}

          {/* Preview thumbnail */}
          {thumbSrc && (
            <div className="rounded-lg overflow-hidden border border-gray-100 aspect-square max-h-32">
              {type === 'reel' && mediaPreview && !coverPreview ? (
                <video src={mediaPreview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={thumbSrc} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>
          )}

          {/* Caption */}
          <div>
            <label htmlFor="add-caption" className="block text-xs font-medium text-gray-500 mb-1.5">
              Pie de foto
            </label>
            <textarea
              id="add-caption"
              rows={2}
              placeholder="Escribí un pie de foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
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
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

export function CloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

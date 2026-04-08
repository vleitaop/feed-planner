import { useState, useRef } from 'react';
import { updatePost, deletePost } from '../lib/api.js';
import { Backdrop, CloseButton } from './AddPostModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

const TYPES = [
  { value: 'image', label: 'Imagen', emoji: '🖼️' },
  { value: 'carousel', label: 'Carousel', emoji: '🔲' },
  { value: 'reel', label: 'Reel', emoji: '▶️' },
];

export default function EditPostModal({ post, onClose, onSave, onDelete }) {
  const [type, setType] = useState(post.type);
  const [caption, setCaption] = useState(post.caption || '');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const mediaInputRef = useRef(null);
  const coverInputRef = useRef(null);

  function handleMediaChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('type', type);
    formData.append('caption', caption);
    if (mediaFile) formData.append('media', mediaFile);
    if (coverFile) formData.append('cover', coverFile);

    setLoading(true);
    try {
      await updatePost(post.id, formData);
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar el post.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deletePost(post.id);
      onDelete(post.id);
    } catch (err) {
      showToast('Error al eliminar el post.', 'error');
      setDeleting(false);
    }
  }

  // Current thumbnail: new file preview takes priority, then existing server URL
  const currentMediaThumb = mediaPreview || post.mediaUrl;
  const currentCoverThumb = coverPreview || post.coverUrl;
  const thumbSrc = type === 'reel' && currentCoverThumb ? currentCoverThumb : currentMediaThumb;

  return (
    <Backdrop onClose={onClose}>
      <div
        className="bg-white w-full max-w-sm mx-auto rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Editar Post</h2>
            <p className="text-xs text-gray-400 mt-0.5">Slot {post.position + 1} de 12</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <form onSubmit={handleSave} className="px-5 py-5 space-y-4">
          {/* Current thumbnail */}
          {thumbSrc && (
            <div className="rounded-lg overflow-hidden border border-gray-100 w-full aspect-square max-h-40">
              <img
                src={thumbSrc}
                alt="current"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

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

          {/* Replace media file */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {type === 'reel' ? 'Reemplazar video' : 'Reemplazar imagen'}
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
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 px-4 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {mediaFile ? mediaFile.name : 'Seleccionar nuevo archivo...'}
            </button>
            <p className="text-[10px] text-gray-400 mt-1">Dejá vacío para mantener el actual</p>
          </div>

          {/* Replace cover (Reels only) */}
          {type === 'reel' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Reemplazar portada
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
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 px-4 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {coverFile ? coverFile.name : 'Seleccionar nueva portada...'}
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label htmlFor="edit-caption" className="block text-xs font-medium text-gray-500 mb-1.5">
              Pie de foto
            </label>
            <textarea
              id="edit-caption"
              rows={2}
              placeholder="Escribí un pie de foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 resize-none"
            />
          </div>

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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {/* Delete */}
          <div className="border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={[
                'w-full text-xs font-medium py-2 rounded-lg border transition-all',
                confirmDelete
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'border-gray-200 text-red-400 hover:border-red-300 hover:bg-red-50',
              ].join(' ')}
            >
              {deleting
                ? 'Eliminando...'
                : confirmDelete
                ? '⚠️ Confirmar eliminación'
                : 'Eliminar post'}
            </button>
            {confirmDelete && (
              <p className="text-center text-xs text-gray-400 mt-1.5">
                Hacé click de nuevo para eliminar permanentemente.
              </p>
            )}
          </div>
        </form>
      </div>
    </Backdrop>
  );
}

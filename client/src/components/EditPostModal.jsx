import { useState, useRef, useEffect } from 'react';
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
  
  // Para edición, manejamos archivos nuevos si el usuario decide reemplazarlos
  const [mediaFiles, setMediaFiles] = useState([]); 
  const [mediaPreviews, setMediaPreviews] = useState([]);
  
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const mediaInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Limpiar memoria de URLs de vista previa
  useEffect(() => {
    return () => {
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [mediaPreviews, coverPreview]);

  function handleMediaChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Si cambiamos a carrusel permitimos varios, si no solo uno
    const selectedFiles = type === 'carousel' ? files : [files[0]];
    setMediaFiles(selectedFiles);

    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(urls);
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
    
    // Solo enviamos archivos si el usuario seleccionó nuevos para reemplazar
    if (mediaFiles.length > 0) {
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });
    }
    
    if (type === 'reel' && coverFile) {
      formData.append('cover', coverFile);
    }

    setLoading(true);
    try {
      // IMPORTANTE: Asegurate de que tu objeto post use _id o id según MongoDB
      const postId = post._id || post.id;
      await updatePost(postId, formData);
      showToast('Post actualizado con éxito', 'success');
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
      const postId = post._id || post.id;
      await deletePost(postId);
      onDelete(postId);
    } catch (err) {
      showToast('Error al eliminar el post.', 'error');
      setDeleting(false);
    }
  }

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
          
          {/* VISTAS PREVIAS: Prioriza archivos nuevos, sino muestra los de la DB */}
          <div className={`grid gap-2 ${type === 'carousel' ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {mediaPreviews.length > 0 ? (
              // Previsualización de archivos NUEVOS seleccionados
              mediaPreviews.map((src, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-blue-200 aspect-square">
                  {type === 'reel' ? (
                    <video src={src} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={src} className="w-full h-full object-cover" alt="new-preview" />
                  )}
                </div>
              ))
            ) : (
              // Previsualización de archivos ACTUALES en la base de datos (mediaUrls)
              post.mediaUrls?.map((url, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-100 aspect-square">
                  {type === 'reel' ? (
                    <video src={url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={url} className="w-full h-full object-cover" alt="current-media" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selector de Tipo */}
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

          {/* Reemplazar Archivos */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {type === 'carousel' ? 'Reemplazar todas las imágenes' : 'Reemplazar archivo'}
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
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 px-4 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {mediaFiles.length > 0 ? `${mediaFiles.length} seleccionados` : 'Seleccionar nuevo/s...'}
            </button>
            <p className="text-[10px] text-gray-400 mt-1">Si no seleccionás nada, se mantienen los actuales.</p>
          </div>

          {/* Reemplazar Portada (Solo Reels) */}
          {type === 'reel' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Reemplazar portada</label>
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
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 px-4 text-xs text-gray-500"
              >
                {coverFile ? coverFile.name : 'Seleccionar nueva portada...'}
              </button>
              { (coverPreview || post.coverUrl) && (
                <img src={coverPreview || post.coverUrl} className="mt-2 w-16 h-16 object-cover rounded border" alt="cover" />
              )}
            </div>
          )}

          {/* Caption */}
          <div>
            <label htmlFor="edit-caption" className="block text-xs font-medium text-gray-500 mb-1.5">Pie de foto</label>
            <textarea
              id="edit-caption"
              rows={2}
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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {/* Eliminar */}
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
              {deleting ? 'Eliminando...' : confirmDelete ? '⚠️ Confirmar eliminación' : 'Eliminar post'}
            </button>
          </div>
        </form>
      </div>
    </Backdrop>
  );
}
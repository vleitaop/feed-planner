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
  const [mediaFiles, setMediaFiles] = useState([]); // Array de archivos
  const [mediaPreviews, setMediaPreviews] = useState([]); // Array de previas
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const mediaInputRef = useRef(null);
  const coverInputRef = useRef(null);

  function handleMediaChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Si es carrusel permitimos varios, si no, solo el primero
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (mediaFiles.length === 0) return setError('Seleccioná archivos.');

    const formData = new FormData();
    formData.append('type', type);
    formData.append('position', position);
    formData.append('caption', caption);

    // Mandamos los archivos físicos. Multer los va a recibir uno por uno.
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    if (type === 'reel' && coverFile) {
      formData.append('cover', coverFile);
    }

    setLoading(true);
    try {
      await createPost(formData);
      showToast('¡Post creado!', 'success');
      onSave();
    } catch (err) {
      setError('Error al guardar el post.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-5 overflow-y-auto max-h-[90vh]">
        <h2 className="text-sm font-semibold mb-4">Agregar Post (Slot {position + 1})</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Tipo */}
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setType(t.value); setMediaFiles([]); setMediaPreviews([]); }}
                className={`p-2 rounded-lg border text-xs ${type === t.value ? 'bg-black text-white' : 'bg-white'}`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Input de Archivos */}
          <input
            ref={mediaInputRef}
            type="file"
            accept={type === 'reel' ? 'video/*' : 'image/*'}
            multiple={type === 'carousel'} // Clave para el carrusel
            onChange={handleMediaChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className="w-full border-2 border-dashed p-4 rounded-lg text-xs text-gray-500"
          >
            {mediaFiles.length > 0 ? `${mediaFiles.length} archivos seleccionados` : 'Seleccionar archivos'}
          </button>

          {/* Previews */}
          <div className="grid grid-cols-3 gap-2">
            {mediaPreviews.map((src, i) => (
              <img key={i} src={src} className="aspect-square object-cover rounded-md border" alt="preview" />
            ))}
          </div>

          <textarea
            placeholder="Pie de foto..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 border p-2 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-black text-white p-2 rounded-lg text-sm">
              {loading ? 'Subiendo...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
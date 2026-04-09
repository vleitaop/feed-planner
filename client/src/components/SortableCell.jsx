import { useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import MediaOverlay from './MediaOverlay.jsx';

export default function SortableCell({ position, post, onClick, isPreview, isEditorMode }) {
  const cellId = `pos-${position}`;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: cellId,
    disabled: isPreview,
  });

  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    transform,
    isDragging,
  } = useDraggable({
    id: cellId,
    disabled: !post || isPreview,
  });

  const setRef = useCallback(
    (node) => {
      setDropRef(node);
      setDragRef(node);
    },
    [setDropRef, setDragRef]
  );

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 999 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  // CORRECCIÓN: Lógica para detectar la miniatura en el array o el campo viejo
  const getThumb = () => {
    if (!post) return null;
    if (post.type === 'reel' && post.coverUrl) return post.coverUrl;
    
    // Si existe mediaUrls (array) y tiene algo, usamos el primero. Si no, fallback al viejo mediaUrl.
    return (post.mediaUrls && post.mediaUrls.length > 0) 
      ? post.mediaUrls[0] 
      : post.mediaUrl;
  };

  const thumbSrc = getThumb();
  const dragProps = post && !isPreview ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setRef}
      style={style}
      {...dragProps}
      onClick={onClick}
      data-dragging={isDragging ? 'true' : undefined}
      className={[
        'aspect-square relative overflow-hidden select-none transition-all duration-150',
        isPreview ? 'cursor-pointer' : 'cursor-pointer',
        isOver && !isPreview && !isDragging ? 'ring-2 ring-inset ring-black' : '',
        isDragging ? 'opacity-50 scale-95' : '',
        !post && !isPreview ? 'bg-white hover:bg-gray-50' : 'bg-gray-100',
      ].filter(Boolean).join(' ')}
    >
      {post ? (
        <>
          <img
            src={thumbSrc}
            alt={post.type}
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => {
              // Si la imagen falla, mostramos un fondo gris para que no quede el texto alt
              e.target.style.opacity = '0';
            }}
          />
          <MediaOverlay type={post.type} />
          {!isPreview && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors duration-200" />
          )}
        </>
      ) : (
        !isPreview && (
          <div className="w-full h-full flex items-center justify-center group">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="1.5" strokeLinecap="round" className="transition-all group-hover:stroke-black group-hover:scale-110">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        )
      )}
    </div>
  );
}
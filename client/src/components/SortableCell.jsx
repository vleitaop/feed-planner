import { useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import MediaOverlay from './MediaOverlay.jsx';

export default function SortableCell({ position, post, onClick, isPreview, isEditorMode }) {
  const cellId = `pos-${position}`;

  // Every cell is a drop target (editor only)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: cellId,
    disabled: isPreview,
  });

  // Only filled cells in editor mode are draggable
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

  // Combine drag + drop refs into the same DOM node
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

  // Determine thumb image
  const thumbSrc = post
    ? post.type === 'reel' && post.coverUrl
      ? post.coverUrl
      : post.mediaUrl
    : null;

  const dragProps = post && !isPreview ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setRef}
      style={style}
      {...dragProps}
      onClick={onClick}
      data-dragging={isDragging ? 'true' : undefined}
      className={[
        'aspect-square relative overflow-hidden select-none',
        'transition-all duration-150',
        isPreview ? 'cursor-pointer' : 'cursor-pointer',
        // Drop-over highlight (editor only)
        isOver && !isPreview && !isDragging
          ? 'ring-2 ring-inset ring-black'
          : '',
        // Dragging ghost
        isDragging ? 'opacity-50 scale-95' : '',
        // Empty cell background
        !post && !isPreview ? 'bg-white hover:bg-gray-50' : 'bg-gray-100',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {post ? (
        /* ── Filled cell ── */
        <>
          <img
            src={thumbSrc}
            alt={post.type}
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <MediaOverlay type={post.type} />

          {/* Editor hover overlay */}
          {!isPreview && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors duration-200" />
          )}
        </>
      ) : (
        /* ── Empty cell ── */
        !isPreview && (
          <div className="w-full h-full flex items-center justify-center group">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c7c7c7"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="transition-all group-hover:stroke-black group-hover:scale-110"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        )
      )}
    </div>
  );
}

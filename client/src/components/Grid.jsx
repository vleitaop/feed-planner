import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import SortableCell from './SortableCell.jsx';
import AddPostModal from './AddPostModal.jsx';
import EditPostModal from './EditPostModal.jsx';
import { reorderPosts } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

const DEFAULT_GRID_SIZE = 12;

export default function Grid({ posts, setPosts, isPreview = false, onCellClick, onRefetch, gridSize = DEFAULT_GRID_SIZE }) {
  const [addModal, setAddModal] = useState(null);   // { position: number }
  const [editModal, setEditModal] = useState(null); // post object
  const [activePost, setActivePost] = useState(null); // for DragOverlay thumbnail
  const { showToast } = useToast();

  // Build position → post map
  const positionMap = {};
  posts.forEach((p) => {
    positionMap[p.position] = p;
  });

  // dnd-kit sensors: require 5px movement before drag starts (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart({ active }) {
    const pos = parseInt(active.id.replace('pos-', ''));
    setActivePost(positionMap[pos] || null);
  }

  function handleDragEnd({ active, over }) {
    setActivePost(null);
    if (!over || active.id === over.id) return;

    const srcPos = parseInt(active.id.replace('pos-', ''));
    const dstPos = parseInt(over.id.replace('pos-', ''));

    const srcPost = positionMap[srcPos];
    const dstPost = positionMap[dstPos];

    if (!srcPost) return;

    // Build the update payload
    const updates = [{ id: srcPost.id, position: dstPos }];
    if (dstPost) updates.push({ id: dstPost.id, position: srcPos });

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === srcPost.id) return { ...p, position: dstPos };
        if (dstPost && p.id === dstPost.id) return { ...p, position: srcPos };
        return p;
      })
    );

    reorderPosts(updates).catch(() => {
      showToast('Reorder failed — refreshing', 'error');
      // Re-fetch would happen from parent; for now, no rollback needed at component level
    });
  }

  function handleCellClick(position) {
    if (isPreview) {
      const post = positionMap[position];
      if (post && onCellClick) onCellClick(post);
      return;
    }

    const post = positionMap[position];
    if (post) {
      setEditModal(post);
    } else {
      setAddModal({ position });
    }
  }

  const cells = Array.from({ length: gridSize }, (_, i) => i);

  // Shared grid markup
  const gridMarkup = (
    <div
      className="grid grid-cols-3"
      style={{ gap: isPreview ? '3px' : '1px', background: '#dbdbdb' }}
    >
      {cells.map((pos) => (
        <SortableCell
          key={pos}
          position={pos}
          post={positionMap[pos] || null}
          onClick={() => handleCellClick(pos)}
          isPreview={isPreview}
        />
      ))}
    </div>
  );

  // Preview mode: no DnD, no modals
  if (isPreview) {
    return gridMarkup;
  }

  // Editor mode: wrap in DndContext
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {gridMarkup}

        {/* Floating drag preview */}
        <DragOverlay dropAnimation={null}>
          {activePost ? (
            <div
              className="aspect-square w-24 overflow-hidden rounded shadow-xl ring-2 ring-black opacity-90 rotate-3"
              style={{ width: '96px', height: '96px' }}
            >
              <img
                src={
                  activePost.type === 'reel' && activePost.coverUrl
                    ? activePost.coverUrl
                    : activePost.mediaUrl
                }
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {addModal && (
        <AddPostModal
          position={addModal.position}
          onClose={() => setAddModal(null)}
          onSave={() => {
            setAddModal(null);
            setTimeout(() => {
              showToast('Post agregado ✓');
              if (onRefetch) onRefetch();
            }, 50);
          }}
        />
      )}

      {editModal && (
        <EditPostModal
          post={editModal}
          onClose={() => setEditModal(null)}
          onSave={() => {
            setEditModal(null);
            setTimeout(() => {
              showToast('Post actualizado ✓');
              if (onRefetch) onRefetch();
            }, 50);
          }}
          onDelete={() => {
            setEditModal(null);
            setTimeout(() => {
              showToast('Post eliminado');
              if (onRefetch) onRefetch();
            }, 50);
          }}
        />
      )}
    </>
  );
}

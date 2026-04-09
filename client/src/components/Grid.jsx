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
  const [addModal, setAddModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const { showToast } = useToast();

  const positionMap = {};
  posts.forEach((p) => {
    positionMap[p.position] = p;
  });

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

    const updates = [{ id: srcPost.id || srcPost._id, position: dstPos }];
    if (dstPost) updates.push({ id: dstPost.id || dstPost._id, position: srcPos });

    setPosts((prev) =>
      prev.map((p) => {
        const pId = p.id || p._id;
        if (pId === (srcPost.id || srcPost._id)) return { ...p, position: dstPos };
        if (dstPost && pId === (dstPost.id || dstPost._id)) return { ...p, position: srcPos };
        return p;
      })
    );

    reorderPosts(updates).catch(() => {
      showToast('Error al reordenar', 'error');
    });
  }

  function handleCellClick(position) {
    const post = positionMap[position];
    if (isPreview) {
      if (post && onCellClick) onCellClick(post);
      return;
    }
    if (post) {
      setEditModal(post);
    } else {
      setAddModal({ position });
    }
  }

  const cells = Array.from({ length: gridSize }, (_, i) => i);

  const gridMarkup = (
    <div className="grid grid-cols-3" style={{ gap: isPreview ? '3px' : '1px', background: '#dbdbdb' }}>
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

  if (isPreview) return gridMarkup;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {gridMarkup}
        <DragOverlay dropAnimation={null}>
          {activePost ? (
            <div className="aspect-square w-24 overflow-hidden rounded shadow-xl ring-2 ring-black opacity-90 rotate-3" style={{ width: '96px', height: '96px' }}>
              <img
                src={
                  activePost.type === 'reel' && activePost.coverUrl
                    ? activePost.coverUrl
                    : (activePost.mediaUrls && activePost.mediaUrls.length > 0)
                      ? activePost.mediaUrls[0]
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
          onSave={() => { setAddModal(null); onRefetch(); }}
        />
      )}

      {editModal && (
        <EditPostModal
          post={editModal}
          onClose={() => setEditModal(null)}
          onSave={() => { setEditModal(null); onRefetch(); }}
          onDelete={() => { setEditModal(null); onRefetch(); }}
        />
      )}
    </>
  );
}
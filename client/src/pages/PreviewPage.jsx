import { useState, useEffect } from 'react';
import Grid from '../components/Grid.jsx';
import MediaViewer from '../components/MediaViewer.jsx';
import { getPosts } from '../lib/api.js';

export default function PreviewPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState(null);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const filled = posts.length;

  // Calculate grid size from the highest post position (match editor rows)
  const maxPos = posts.length > 0 ? Math.max(...posts.map((p) => p.position)) : -1;
  const gridSize = Math.max(Math.ceil((maxPos + 1) / 3) * 3, 3); // at least 1 row

  return (
    <div className="min-h-screen bg-white">
      {/* ── Instagram-like profile header ── */}
      <div className="max-w-[470px] mx-auto px-4">
        {/* Top spacing + username row */}
        <div className="pt-8 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">qreative_</h1>
          </div>
          {/* Action icons (decorative) */}
          <div className="flex items-center gap-3 mt-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </div>
        </div>

        {/* Avatar + stats row */}
        <div className="flex items-center gap-8 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-200 flex items-center justify-center shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { label: 'posts', value: filled },
              { label: 'followers', value: '0' },
              { label: 'following', value: '0' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-sm font-bold">{value}</div>
                <div className="text-xs text-gray-800">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <p className="text-xs font-semibold">Qreative</p>
          <p className="text-xs text-gray-800 mt-0.5 leading-relaxed">
            Te ayudamos a ordenar las ventas, tu stock y tú producción
          </p>
          <p className="text-xs text-gray-800">Proba nuestra demo gratis</p>
          <a
            href="https://qreative.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 font-medium hover:underline mt-0.5 block"
          >
            qreative.app
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-5">
          <button className="flex-1 text-xs font-semibold bg-gray-100 rounded-lg py-1.5">
            Follow
          </button>
          <button className="flex-1 text-xs font-semibold bg-gray-100 rounded-lg py-1.5">
            Message
          </button>
          <button className="px-3 text-xs font-semibold bg-gray-100 rounded-lg py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Stories row */}
        <div className="flex gap-4 mb-4 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200" />
              <span className="text-[10px] text-gray-500">Story</span>
            </div>
          ))}
        </div>

        {/* Grid tabs */}
        <div className="flex border-t border-gray-200 mb-0">
          <button className="flex-1 flex justify-center py-2.5 border-t-2 border-black -mt-[1px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className="flex-1 flex justify-center py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="1.8">
              <rect x="2" y="7" width="20" height="15" rx="2"/>
              <polyline points="16 7 12 2 8 7"/>
            </svg>
          </button>
          <button className="flex-1 flex justify-center py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Grid (read-only) ── */}
      <div className="max-w-[470px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <Grid
            posts={posts}
            setPosts={setPosts}
            isPreview={true}
            onCellClick={(post) => setViewingPost(post)}
            gridSize={gridSize}
          />
        )}
      </div>

      {/* ── Lightbox ── */}
      {viewingPost && (
        <MediaViewer post={viewingPost} onClose={() => setViewingPost(null)} />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Grid from '../components/Grid.jsx';
import { getPosts, deletePost } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

const MIN_ROWS = 1;
const DEFAULT_ROWS = 4;

export default function EditorPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowCount, setRowCount] = useState(DEFAULT_ROWS);
  const [copyLabel, setCopyLabel] = useState('Share Preview');
  const { showToast } = useToast();

  function loadPosts() {
    return getPosts()
      .then((data) => {
        setPosts(data);
        // Auto-expand rows if existing posts exceed current grid
        if (data.length > 0) {
          const maxPos = Math.max(...data.map((p) => p.position));
          const neededRows = Math.ceil((maxPos + 1) / 3);
          setRowCount((prev) => Math.max(prev, neededRows));
        }
      })
      .catch(() => showToast('Error al cargar posts', 'error'));
  }

  useEffect(() => {
    loadPosts().finally(() => setLoading(false));
  }, []);

  const gridSize = rowCount * 3;

  function handleAddRow() {
    setRowCount((r) => r + 1);
  }

  async function handleRemoveRow() {
    if (rowCount <= MIN_ROWS) return;

    // Check if last row has any posts
    const lastRowStart = (rowCount - 1) * 3;
    const postsInLastRow = posts.filter(
      (p) => p.position >= lastRowStart && p.position < lastRowStart + 3
    );

    // Delete posts in last row if any
    if (postsInLastRow.length > 0) {
      const confirmed = window.confirm(
        `La última fila tiene ${postsInLastRow.length} post(s). ¿Eliminarlos y quitar la fila?`
      );
      if (!confirmed) return;

      try {
        for (const post of postsInLastRow) {
          await deletePost(post.id);
        }
      } catch {
        showToast('Error al eliminar posts de la fila', 'error');
        return;
      }
    }

    setRowCount((r) => r - 1);
    loadPosts();
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/preview`;

    function onSuccess() {
      setCopyLabel('Copied! ✓');
      showToast('Link copiado al portapapeles ✓');
      setTimeout(() => setCopyLabel('Share Preview'), 2500);
    }

    // Modern Clipboard API (requires HTTPS or localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(onSuccess).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      try {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        onSuccess();
      } catch {
        // Last resort: show the URL in a toast
        showToast(`Link: ${url}`, 'error');
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="black" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="4.5" stroke="black" strokeWidth="1.8"/>
                <circle cx="17.5" cy="6.5" r="1" fill="black"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">Feed Planner</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open Preview
            </Link>
            <button
              id="share-btn"
              type="button"
              onClick={handleCopyLink}
              className={[
                'flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all',
                copyLabel === 'Copied!'
                  ? 'bg-green-500 text-white'
                  : 'bg-black text-white hover:bg-gray-800',
              ].join(' ')}
            >
              {copyLabel === 'Copied!' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              )}
              {copyLabel}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center">
        {/* Profile section */}
        <div className="w-full max-w-lg px-4 py-6">
          <div className="flex items-center gap-5">
            {/* Avatar placeholder */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            {/* Stats */}
            <div className="flex-1 flex gap-5 justify-around">
              {[
                { label: 'Posts', value: posts.length },
                { label: 'Followers', value: '—' },
                { label: 'Following', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-sm font-semibold">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Username */}
          <div className="mt-3">
            <p className="text-sm font-semibold">qreative_</p>
            <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
              Te ayudamos a ordenar las ventas, tu stock y tú producción<br />
              Proba nuestra demo gratis
            </p>
            <p className="text-xs text-blue-600 hover:underline mt-0.5 cursor-pointer">qreative.app</p>
            <p className="text-[10px] text-gray-400 mt-1.5">
              ✦ Arrastrá para reordenar · Click en celda vacía para agregar
            </p>
          </div>

          {/* Hint bar */}
          <div className="mt-4 flex gap-2">
            <div className="h-8 flex-1 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-medium cursor-default">
              Edit Profile
            </div>
            <div className="h-8 w-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center cursor-default">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="2">
                <path d="M17 2l4 4-14 14H3v-4L17 2z"/>
              </svg>
            </div>
          </div>

          {/* Stories row placeholder */}
          <div className="flex gap-3 mt-5 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <span className="text-[10px] text-gray-400">Highlight</span>
              </div>
            ))}
          </div>

          {/* Grid tabs */}
          <div className="flex mt-5 border-t border-gray-200">
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

        {/* ── Row controls ── */}
        <div className="w-full max-w-lg px-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-400">
              {rowCount} {rowCount === 1 ? 'fila' : 'filas'} · {gridSize} celdas
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRemoveRow}
                disabled={rowCount <= MIN_ROWS}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Fila
              </button>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Fila
              </button>
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="flex items-center justify-center py-20">
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
            <Grid posts={posts} setPosts={setPosts} isPreview={false} onRefetch={loadPosts} gridSize={gridSize} />
          )}
        </div>
      </main>
    </div>
  );
}

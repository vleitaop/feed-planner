import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

let uid = 1;

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timersRef = useRef({});

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  // showToast is stable — defined once, safe to call from any callback
  const showToast = useCallback((message, type = 'success') => {
    const id = uid++;
    // Queue the state update to avoid calling setState during render/unmount of another component
    Promise.resolve().then(() => {
      dispatch({ type: 'ADD', toast: { id, message, type } });
      timersRef.current[id] = setTimeout(() => {
        dispatch({ type: 'REMOVE', id });
        delete timersRef.current[id];
      }, 3000);
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastList toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastList({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#000',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            padding: '9px 16px',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            minWidth: 180,
            animation: 'toastIn 0.2s ease-out',
            pointerEvents: 'auto',
          }}
        >
          {t.type === 'success' && (
            <svg style={{ flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg style={{ flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}

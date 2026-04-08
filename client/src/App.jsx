import { Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage.jsx';
import PreviewPage from './pages/PreviewPage.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/preview" element={<PreviewPage />} />
      </Routes>
    </ToastProvider>
  );
}

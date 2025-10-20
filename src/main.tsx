import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/canvas/:canvasId" element={<App />} />
        <Route path="/" element={<Navigate to="/canvas/shared" replace />} />
        <Route path="*" element={<Navigate to="/canvas/shared" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

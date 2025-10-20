import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthProvider';
import { Canvas } from './components/Canvas';
import { canvasService } from './services/canvasService';
import './App.css';

// Main canvas application
const CanvasApp: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();

  // If no canvas ID, redirect to a new canvas
  React.useEffect(() => {
    if (!canvasId) {
      const newCanvasId = canvasService.getSharedCanvasId(); // Default to shared canvas
      navigate(`/canvas/${newCanvasId}`, { replace: true });
    }
  }, [canvasId, navigate]);

  if (!canvasId) {
    return <div>Loading...</div>;
  }

  return <Canvas canvasId={canvasId} />;
};

function App() {
  return (
    <AuthProvider>
      <CanvasApp />
    </AuthProvider>
  );
}

export default App;
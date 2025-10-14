import React from 'react';
import { AuthProvider } from './components/Auth/AuthProvider';
import { Canvas } from './components/Canvas';
import './App.css';

// Main canvas application
const CanvasApp: React.FC = () => {
  return <Canvas />;
};

function App() {
  return (
    <AuthProvider>
      <CanvasApp />
    </AuthProvider>
  );
}

export default App;
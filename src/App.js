import React, { useState } from 'react';
import GalleryManager from './GalleryManager';
import GalleryVisitorView from './GalleryVisitorView';
import { Eye, Settings } from 'lucide-react';
import './App.css';

//new
import ComputingGalleryManager from './components/ComputingGalleryManager';

function App() {
  const [isAdminView, setIsAdminView] = useState(true);
  const [sharedArtifacts, setSharedArtifacts] = useState([]);

  // This function will be called from GalleryManager to share artifacts with visitor view
  const handleArtifactsUpdate = (artifacts) => {
    setSharedArtifacts(artifacts);
  };

  return (
    <div className="App">
      <ComputingGalleryManager />
    </div>
  );
}

export default App;
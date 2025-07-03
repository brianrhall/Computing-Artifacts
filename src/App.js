import React, { useState } from 'react';
import GalleryManager from './GalleryManager';
import GalleryVisitorView from './GalleryVisitorView';
import { Eye, Settings } from 'lucide-react';
import './App.css';

function App() {
  const [isAdminView, setIsAdminView] = useState(true);
  const [sharedArtifacts, setSharedArtifacts] = useState([]);

  // This function will be called from GalleryManager to share artifacts with visitor view
  const handleArtifactsUpdate = (artifacts) => {
    setSharedArtifacts(artifacts);
  };

  return (
    <div className="min-h-screen">
      {/* View Toggle Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsAdminView(!isAdminView)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
          title={isAdminView ? 'Switch to Visitor View' : 'Switch to Admin View'}
        >
          {isAdminView ? <Eye size={24} /> : <Settings size={24} />}
          <span className="hidden md:inline">
            {isAdminView ? 'Visitor View' : 'Admin View'}
          </span>
        </button>
      </div>

      {/* Main Content */}
      {isAdminView ? (
        <GalleryManager onArtifactsUpdate={handleArtifactsUpdate} />
      ) : (
        <GalleryVisitorView artifacts={sharedArtifacts} />
      )}
    </div>
  );
}

export default App;
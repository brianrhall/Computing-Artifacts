import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ComputingGalleryManager from './components/ComputingGalleryManager';
import ExhibitView from './components/ExhibitView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ComputingGalleryManager />} />
          <Route path="/exhibit/:exhibitId" element={<ExhibitView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
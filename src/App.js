import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ComputingGalleryManager from './components/gallery/ComputingGalleryManager';
import ExhibitView from './components/ExhibitView';
import AuctionView from './components/auctions/AuctionView'; // Add this import
import './App.css';
import './components/gallery/gallery.css';
import './mobile.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ComputingGalleryManager />} />
          <Route path="/exhibit/:exhibitId" element={<ExhibitView />} />
          <Route path="/auction/:auctionId" element={<AuctionView />} /> {/* Add this route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
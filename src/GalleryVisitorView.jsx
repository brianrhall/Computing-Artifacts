import React, { useState, useEffect } from 'react';
import { Search, Calendar, Tag, Monitor, Info, Grid, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Component for individual artifact cards in visitor view
const VisitorArtifactCard = ({ artifact, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const allImages = [];
  if (artifact.imageUrl) allImages.push({ type: 'url', src: artifact.imageUrl });
  if (artifact.images) allImages.push(...artifact.images.map(img => ({ type: 'upload', src: img.data })));
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
      onClick={() => onClick(artifact)}
    >
      {allImages.length > 0 ? (
        <div className="relative mx-auto" style={{ maxWidth: '240px' }}>
          <div className="relative" style={{ paddingBottom: '150%' }}>
            <img 
              src={allImages[currentImageIndex].src} 
              alt={artifact.name} 
              className="absolute inset-0 w-full h-full object-contain bg-gray-100" 
            />
            {allImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {allImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto" style={{ maxWidth: '240px' }}>
          <div className="relative bg-gray-100 flex items-center justify-center" style={{ paddingBottom: '150%' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image size={48} className="text-gray-400" />
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{artifact.name}</h3>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag size={14} />
            <span>{artifact.category}</span>
          </div>
          
          {artifact.date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} />
              <span>{artifact.date}</span>
            </div>
          )}
          
          {artifact.manufacturer && (
            <div className="flex items-center gap-2 text-gray-600">
              <Info size={14} />
              <span>{artifact.manufacturer}</span>
            </div>
          )}
        </div>
        
        {artifact.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{artifact.description}</p>
        )}
      </div>
    </div>
  );
};

// Modal component for detailed artifact view
const ArtifactModal = ({ artifact, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!artifact) return null;
  
  const allImages = [];
  if (artifact.imageUrl) allImages.push({ type: 'url', src: artifact.imageUrl });
  if (artifact.images) allImages.push(...artifact.images.map(img => ({ type: 'upload', src: img.data })));
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{artifact.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {allImages.length > 0 && (
            <div className="relative mb-6 mx-auto" style={{ maxWidth: '400px' }}>
              <div className="relative" style={{ paddingBottom: '133.33%' }}>
                <img 
                  src={allImages[currentImageIndex].src} 
                  alt={artifact.name} 
                  className="absolute inset-0 w-full h-full object-contain bg-gray-100 rounded-lg" 
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                            idx === currentImageIndex ? 'bg-white w-8' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-medium">{artifact.category}</p>
                </div>
                {artifact.manufacturer && (
                  <div>
                    <span className="text-sm text-gray-500">Manufacturer</span>
                    <p className="font-medium">{artifact.manufacturer}</p>
                  </div>
                )}
                {artifact.model && (
                  <div>
                    <span className="text-sm text-gray-500">Model</span>
                    <p className="font-medium">{artifact.model}</p>
                  </div>
                )}
                {artifact.year && (
                  <div>
                    <span className="text-sm text-gray-500">Year</span>
                    <p className="font-medium">{artifact.year}</p>
                  </div>
                )}
                {artifact.os && (
                  <div>
                    <span className="text-sm text-gray-500">Operating System</span>
                    <p className="font-medium">{artifact.os}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Display Information</h3>
              <div className="space-y-2">
                {artifact.displayGroup && (
                  <div>
                    <span className="text-sm text-gray-500">Display Group</span>
                    <p className="font-medium">{artifact.displayGroup}</p>
                  </div>
                )}
                {artifact.location && (
                  <div>
                    <span className="text-sm text-gray-500">Location</span>
                    <p className="font-medium">{artifact.location}</p>
                  </div>
                )}
                {artifact.condition && (
                  <div>
                    <span className="text-sm text-gray-500">Condition</span>
                    <p className="font-medium">{artifact.condition}</p>
                  </div>
                )}
                {artifact.acquisitionDate && (
                  <div>
                    <span className="text-sm text-gray-500">Acquisition Date</span>
                    <p className="font-medium">{artifact.acquisitionDate}</p>
                  </div>
                )}
                {artifact.donor && (
                  <div>
                    <span className="text-sm text-gray-500">Donor</span>
                    <p className="font-medium">{artifact.donor}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {artifact.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{artifact.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Gallery Visitor View Component
const GalleryVisitorView = ({ artifacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  
  // Get unique categories and display groups
  const categories = [...new Set(artifacts.map(a => a.category).filter(Boolean))].sort();
  const displayGroups = [...new Set(artifacts.map(a => a.displayGroup).filter(Boolean))].sort();
  
  // Filter artifacts
  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = searchTerm === '' || 
      artifact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || artifact.category === filterCategory;
    const matchesGroup = filterGroup === 'all' || artifact.displayGroup === filterGroup;
    
    return matchesSearch && matchesCategory && matchesGroup;
  });
  
  // Calculate stats
  const stats = {
    total: artifacts.length,
    categories: categories.length,
    displayGroups: displayGroups.length
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Computing Artifacts Gallery</h1>
          <p className="text-xl opacity-90">Explore our collection of computing history</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-gray-600">Total Artifacts</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.categories}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.displayGroups}</div>
            <div className="text-gray-600">Display Groups</div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search artifacts..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {categories.length > 0 && (
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
            {displayGroups.length > 0 && (
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="all">All Groups</option>
                {displayGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Artifacts Display */}
        {filteredArtifacts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredArtifacts.map(artifact => (
              <VisitorArtifactCard
                key={artifact.id}
                artifact={artifact}
                onClick={setSelectedArtifact}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No artifacts found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <ArtifactModal
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
};

export default GalleryVisitorView;
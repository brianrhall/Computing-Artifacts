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
        <div className="relative h-48">
          <img 
            src={allImages[currentImageIndex].src} 
            alt={artifact.name} 
            className="w-full h-full object-cover" 
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
      ) : (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <Image size={48} className="text-gray-400" />
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
            <div className="relative mb-6">
              <img 
                src={allImages[currentImageIndex].src} 
                alt={artifact.name} 
                className="w-full max-h-96 object-contain bg-gray-100 rounded-lg" 
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((currentImageIndex - 1 + allImages.length) % allImages.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((currentImageIndex + 1) % allImages.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{artifact.category}</span>
                </div>
                {artifact.date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year/Date:</span>
                    <span className="font-medium">{artifact.date}</span>
                  </div>
                )}
                {artifact.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="font-medium">{artifact.manufacturer}</span>
                  </div>
                )}
                {artifact.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{artifact.model}</span>
                  </div>
                )}
                {artifact.os && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating System:</span>
                    <span className="font-medium">{artifact.os}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Display Information</h3>
              <div className="space-y-2">
                {artifact.condition && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      artifact.condition === 'Mint' || artifact.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                      artifact.condition === 'Good' || artifact.condition === 'Working' ? 'bg-blue-100 text-blue-800' :
                      artifact.condition === 'Fair' || artifact.condition === 'Restored' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {artifact.condition}
                    </span>
                  </div>
                )}
                {artifact.displayGroup && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Display Group:</span>
                    <span className="font-medium">{artifact.displayGroup}</span>
                  </div>
                )}
                {artifact.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{artifact.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {artifact.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{artifact.description}</p>
            </div>
          )}
          
          {artifact.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{artifact.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GalleryVisitorView = ({ artifacts: providedArtifacts }) => {
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Use provided artifacts or fall back to sample data
  useEffect(() => {
    if (providedArtifacts && providedArtifacts.length > 0) {
      setArtifacts(providedArtifacts);
    } else {
      // Sample data for demonstration
      const sampleData = [
        {
          id: 1,
          name: 'Apple Macintosh 128K',
          category: 'Personal Computer',
          date: '1984',
          os: 'System 1.0',
          manufacturer: 'Apple',
          model: 'M0001',
          description: 'The first Macintosh personal computer, featuring a revolutionary graphical user interface.',
          condition: 'Working',
          displayGroup: 'Early PCs',
          location: 'Display Case A',
          notes: 'Original mouse and keyboard included. This machine changed personal computing forever.',
          imageUrl: '',
          images: []
        },
        {
          id: 2,
          name: 'Commodore 64',
          category: 'Personal Computer',
          date: '1982',
          os: 'Commodore BASIC 2.0',
          manufacturer: 'Commodore',
          model: 'C64',
          description: 'The best-selling home computer model of all time, with an estimated 17 million units sold.',
          condition: 'Restored',
          displayGroup: 'Home Computers',
          location: 'Display Case B',
          notes: 'Power supply has been recapped. Includes original packaging.',
          imageUrl: '',
          images: []
        }
      ];
      setArtifacts(sampleData);
    }
  }, [providedArtifacts]);

  const categories = [...new Set(artifacts.map(a => a.category))];
  const displayGroups = [...new Set(artifacts.map(a => a.displayGroup).filter(Boolean))];

  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || artifact.category === filterCategory;
    const matchesGroup = filterGroup === 'all' || artifact.displayGroup === filterGroup;
    return matchesSearch && matchesCategory && matchesGroup;
  });

  const stats = {
    total: artifacts.length,
    categories: categories.length,
    displayGroups: displayGroups.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Computing Artifacts Gallery</h1>
          <p className="text-gray-600 mt-2">Explore our collection of computing history</p>
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
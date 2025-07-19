import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Save, X, Calendar, Tag, Monitor, Info, Grid, DollarSign, CheckSquare, Upload, Image } from 'lucide-react';

// Separate component for artifact cards to handle image carousel state
const ArtifactCard = ({ artifact, onEdit, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const allImages = [];
  if (artifact.imageUrl) allImages.push({ type: 'url', src: artifact.imageUrl });
  if (artifact.images) allImages.push(...artifact.images.map(img => ({ type: 'upload', src: img.data })));
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      {allImages.length > 0 && (
        <div className="relative mb-4 mx-auto" style={{ maxWidth: '240px' }}>
          <div className="relative" style={{ paddingBottom: '150%' }}>
            <img 
              src={allImages[currentImageIndex].src} 
              alt={artifact.name} 
              className="absolute inset-0 w-full h-full object-contain bg-gray-100 rounded-lg" 
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + allImages.length) % allImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 14L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % allImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M8 14L12 10L8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {allImages.length === 0 && (
        <div className="mx-auto mb-4" style={{ maxWidth: '240px' }}>
          <div className="relative bg-gray-100 rounded-lg flex items-center justify-center" style={{ paddingBottom: '150%' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image size={48} className="text-gray-400" />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800">{artifact.name}</h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(artifact)}
            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(artifact.id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
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
        
        {artifact.os && (
          <div className="flex items-center gap-2 text-gray-600">
            <Monitor size={14} />
            <span>{artifact.os}</span>
          </div>
        )}
        
        {artifact.manufacturer && (
          <div className="flex items-center gap-2 text-gray-600">
            <Info size={14} />
            <span>{artifact.manufacturer} {artifact.model && `- ${artifact.model}`}</span>
          </div>
        )}
        
        {artifact.displayGroup && (
          <div className="flex items-center gap-2 text-gray-600">
            <Grid size={14} />
            <span>{artifact.displayGroup}</span>
          </div>
        )}
        
        {artifact.value && (
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign size={14} />
            <span>${artifact.value}</span>
          </div>
        )}
        
        {artifact.todos && (
          <div className="flex items-start gap-2 text-orange-600 mt-2">
            <CheckSquare size={14} className="mt-0.5" />
            <span className="text-xs">{artifact.todos}</span>
          </div>
        )}
      </div>
      
      {artifact.description && (
        <p className="text-sm text-gray-600 mt-2">{artifact.description}</p>
      )}
      
      {artifact.condition && (
        <div className="mt-2">
          <span className={`text-xs px-2 py-1 rounded ${
            artifact.condition === 'Mint' || artifact.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
            artifact.condition === 'Good' || artifact.condition === 'Working' ? 'bg-blue-100 text-blue-800' :
            artifact.condition === 'Fair' || artifact.condition === 'Restored' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {artifact.condition}
          </span>
        </div>
      )}
    </div>
  );
};

const GalleryManager = ({ onArtifactsUpdate }) => {
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    date: '',
    os: '',
    manufacturer: '',
    model: '',
    serialNumber: '',  // Added serial number field
    description: '',
    condition: '',
    displayGroup: '',
    location: '',
    value: '',
    acquisitionDate: '',
    source: '',
    notes: '',
    todos: '',
    imageUrl: '',
    images: []
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        name: 'Apple Macintosh 128K',
        category: 'Personal Computer',
        date: '1984',
        os: 'System 1.0',
        manufacturer: 'Apple',
        model: 'M0001',
        serialNumber: 'F4Q47V2J5Y6',  // Added sample serial number
        description: 'The first Macintosh personal computer',
        condition: 'Working',
        displayGroup: 'Early PCs',
        location: 'Display Case A',
        value: '2500',
        acquisitionDate: '2023-05-15',
        source: 'Private Collection',
        notes: 'Original mouse and keyboard included',
        todos: 'Clean case, check disk drive',
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
        serialNumber: 'WG8250456',  // Added sample serial number
        description: 'Best-selling home computer model',
        condition: 'Restored',
        displayGroup: 'Home Computers',
        location: 'Display Case B',
        value: '800',
        acquisitionDate: '2023-03-20',
        source: 'eBay',
        notes: 'Power supply recapped',
        todos: '',
        imageUrl: '',
        images: []
      }
    ];
    setArtifacts(sampleData);
  }, []);

  // Notify parent component when artifacts change
  useEffect(() => {
    if (onArtifactsUpdate) {
      onArtifactsUpdate(artifacts);
    }
  }, [artifacts, onArtifactsUpdate]);

  const categories = ['Personal Computer', 'Mainframe', 'Mini Computer', 'Calculator', 'Terminal', 'Storage Device', 'Networking', 'Gaming Console', 'Handheld', 'Other'];
  
  const displayGroups = [...new Set(artifacts.map(a => a.displayGroup).filter(Boolean)), 'Early PCs', 'Home Computers', 'Business Systems', 'Gaming', 'Portables'];

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      alert('Please fill in required fields (Name and Category)');
      return;
    }
    if (editingId) {
      setArtifacts(artifacts.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
    } else {
      setArtifacts([...artifacts, { ...formData, id: Date.now() }]);
    }
    resetForm();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            id: Date.now() + Math.random(),
            data: reader.result,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      date: '',
      os: '',
      manufacturer: '',
      model: '',
      serialNumber: '',  // Reset serial number field
      description: '',
      condition: '',
      displayGroup: '',
      location: '',
      value: '',
      acquisitionDate: '',
      source: '',
      notes: '',
      todos: '',
      imageUrl: '',
      images: []
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (artifact) => {
    setFormData({
      ...artifact,
      serialNumber: artifact.serialNumber || ''  // Ensure serial number is included in edit
    });
    setEditingId(artifact.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this artifact?')) {
      setArtifacts(artifacts.filter(a => a.id !== id));
    }
  };

  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || artifact.category === filterCategory;
    const matchesGroup = filterGroup === 'all' || artifact.displayGroup === filterGroup;
    return matchesSearch && matchesCategory && matchesGroup;
  });

  const totalValue = artifacts.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Computing Artifacts Gallery Manager</h1>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{artifacts.length}</div>
              <div className="text-sm text-gray-600">Total Artifacts</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{[...new Set(artifacts.map(a => a.category))].length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{artifacts.filter(a => a.todos).length}</div>
              <div className="text-sm text-gray-600">With To-Dos</div>
            </div>
          </div>

          {/* Controls */}
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
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Plus size={20} /> Add Artifact
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{editingId ? 'Edit' : 'Add'} Artifact</h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year/Date</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.os}
                      onChange={(e) => setFormData({...formData, os: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      placeholder="Enter serial number (internal use only)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <option value="">Select condition</option>
                      <option value="Mint">Mint</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Working">Working</option>
                      <option value="Non-working">Non-working</option>
                      <option value="Restored">Restored</option>
                      <option value="For Parts">For Parts</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Group</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.displayGroup}
                      onChange={(e) => setFormData({...formData, displayGroup: e.target.value})}
                      list="groups"
                    />
                    <datalist id="groups">
                      {displayGroups.map(group => (
                        <option key={group} value={group} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To-Do Items</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="List any maintenance, cleaning, or other tasks..."
                      value={formData.todos}
                      onChange={(e) => setFormData({...formData, todos: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm">Click to upload images</span>
                        <span className="text-xs">Supports multiple images</span>
                      </label>
                    </div>
                    
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {formData.images.map(image => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.data}
                              alt={image.name}
                              className="w-full h-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <Save size={20} /> {editingId ? 'Update' : 'Save'} Artifact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artifacts Display */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredArtifacts.map(artifact => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
        
        {filteredArtifacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No artifacts found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryManager;
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Save, Upload, Image as ImageIcon, 
  Grid, List, Eye, Calendar, MapPin, Users
} from 'lucide-react';
import { db, storage } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, orderBy, where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ExhibitManager = ({ user, isAdmin, artifacts }) => {
  const [exhibits, setExhibits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [showArtifactSelector, setShowArtifactSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    curator: '',
    headerImage: '',
    artifactIds: [],
    featured: false,
    published: true
  });

  // Load exhibits from Firestore
  useEffect(() => {
    loadExhibits();
  }, []);

  const loadExhibits = async () => {
    try {
      const q = query(collection(db, 'exhibits'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const exhibitsData = [];
      
      querySnapshot.forEach((doc) => {
        exhibitsData.push({ id: doc.id, ...doc.data() });
      });
      
      setExhibits(exhibitsData);
    } catch (error) {
      console.error('Error loading exhibits:', error);
    }
  };

  // Handle header image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      const timestamp = Date.now();
      const filename = `exhibits/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, headerImage: downloadURL }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle exhibit save
  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      alert('Please fill in required fields (Name and Description)');
      return;
    }
    
    try {
      const exhibitData = {
        ...formData,
        artifactIds: selectedArtifacts.map(a => a.id),
        updatedAt: new Date(),
        updatedBy: user.uid
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'exhibits', editingId), exhibitData);
      } else {
        exhibitData.createdAt = new Date();
        exhibitData.createdBy = user.uid;
        await addDoc(collection(db, 'exhibits'), exhibitData);
      }
      
      await loadExhibits();
      resetForm();
      alert('Exhibit saved successfully!');
    } catch (error) {
      console.error('Error saving exhibit:', error);
      alert('Error saving exhibit. Please try again.');
    }
  };

  // Handle exhibit delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exhibit?')) {
      try {
        const exhibit = exhibits.find(e => e.id === id);
        
        // Delete header image if exists
        if (exhibit?.headerImage) {
          try {
            const imageRef = ref(storage, exhibit.headerImage);
            await deleteObject(imageRef);
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        }
        
        await deleteDoc(doc(db, 'exhibits', id));
        await loadExhibits();
      } catch (error) {
        console.error('Error deleting exhibit:', error);
        alert('Error deleting exhibit. Please try again.');
      }
    }
  };

  // Handle edit
  const handleEdit = async (exhibit) => {
    setFormData({
      name: exhibit.name || '',
      description: exhibit.description || '',
      startDate: exhibit.startDate || '',
      endDate: exhibit.endDate || '',
      location: exhibit.location || '',
      curator: exhibit.curator || '',
      headerImage: exhibit.headerImage || '',
      artifactIds: exhibit.artifactIds || [],
      featured: exhibit.featured || false,
      published: exhibit.published !== undefined ? exhibit.published : true
    });
    
    // Load selected artifacts
    const selected = artifacts.filter(a => exhibit.artifactIds?.includes(a.id));
    setSelectedArtifacts(selected);
    
    setEditingId(exhibit.id);
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      curator: '',
      headerImage: '',
      artifactIds: [],
      featured: false,
      published: true
    });
    setSelectedArtifacts([]);
    setEditingId(null);
    setShowForm(false);
    setShowArtifactSelector(false);
  };

  // Add/remove artifacts from exhibit
  const toggleArtifact = (artifact) => {
    const exists = selectedArtifacts.find(a => a.id === artifact.id);
    if (exists) {
      setSelectedArtifacts(selectedArtifacts.filter(a => a.id !== artifact.id));
    } else {
      setSelectedArtifacts([...selectedArtifacts, artifact]);
    }
  };

  // Filter artifacts for selection
  const filteredArtifacts = artifacts.filter(artifact =>
    artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artifact.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artifact.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exhibits</h2>
          <p className="text-gray-600 mt-1">Create and manage themed collections</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Exhibit
            </button>
          )}
        </div>
      </div>

      {/* Exhibits Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibits.map(exhibit => (
            <div key={exhibit.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {exhibit.headerImage ? (
                  <img src={exhibit.headerImage} alt={exhibit.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {exhibit.featured && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                    Featured
                  </span>
                )}
                {!exhibit.published && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded">
                    Draft
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{exhibit.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{exhibit.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-3">
                  {exhibit.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(exhibit.startDate).toLocaleDateString()}
                        {exhibit.endDate && ` - ${new Date(exhibit.endDate).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                  {exhibit.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{exhibit.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    <span>{exhibit.artifactIds?.length || 0} artifacts</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/exhibit/${exhibit.id}`, '_blank')}
                    className="flex-1 px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEdit(exhibit)}
                        className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exhibit.id)}
                        className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Artifacts</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exhibits.map(exhibit => (
                <tr key={exhibit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{exhibit.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{exhibit.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {exhibit.startDate && new Date(exhibit.startDate).toLocaleDateString()}
                    {exhibit.endDate && ` - ${new Date(exhibit.endDate).toLocaleDateString()}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{exhibit.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {exhibit.artifactIds?.length || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {exhibit.featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        exhibit.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {exhibit.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/exhibit/${exhibit.id}`, '_blank')}
                        className="text-gray-600 hover:text-gray-800"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(exhibit)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exhibit.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b z-10 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingId ? 'Edit Exhibit' : 'Create New Exhibit'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exhibit Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    {uploading && (
                      <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                    )}
                    {formData.headerImage && (
                      <div className="mt-2">
                        <img 
                          src={formData.headerImage} 
                          alt="Header" 
                          className="w-full max-w-md h-48 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Exhibit Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Exhibit Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Main Gallery"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curator
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.curator}
                      onChange={(e) => setFormData({...formData, curator: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Exhibit</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600"
                      checked={formData.published}
                      onChange={(e) => setFormData({...formData, published: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Published (visible to visitors)</span>
                  </label>
                </div>
              </div>
              
              {/* Artifacts Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Artifacts ({selectedArtifacts.length} selected)
                </h3>
                
                {selectedArtifacts.length > 0 && (
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedArtifacts.map(artifact => (
                      <div key={artifact.id} className="relative group">
                        <img 
                          src={artifact.images?.[0] || '/placeholder.jpg'} 
                          alt={artifact.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <button
                            onClick={() => toggleArtifact(artifact)}
                            className="text-white hover:text-red-300"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-xs mt-1 truncate">{artifact.name}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowArtifactSelector(!showArtifactSelector)}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showArtifactSelector ? 'Hide' : 'Select'} Artifacts
                </button>
                
                {showArtifactSelector && (
                  <div className="mt-4 border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search artifacts..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredArtifacts.map(artifact => {
                        const isSelected = selectedArtifacts.find(a => a.id === artifact.id);
                        return (
                          <div
                            key={artifact.id}
                            onClick={() => toggleArtifact(artifact)}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                            }`}
                          >
                            <img 
                              src={artifact.images?.[0] || '/placeholder.jpg'} 
                              alt={artifact.name}
                              className="w-full h-20 object-cover rounded mb-1"
                            />
                            <p className="text-xs font-medium truncate">{artifact.name}</p>
                            <p className="text-xs text-gray-500 truncate">{artifact.category}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className={`px-4 py-2 ${
                    uploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors flex items-center gap-2`}
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Create'} Exhibit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExhibitManager;
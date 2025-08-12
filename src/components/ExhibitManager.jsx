import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Save, Upload, Image as ImageIcon, 
  Grid, List, Eye, Calendar, MapPin, Users, CheckCircle, DollarSign
} from 'lucide-react';
import { db, storage } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, orderBy, where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const ExhibitManager = ({ user, isAdmin, artifacts }) => {
  const [exhibits, setExhibits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [showArtifactSelector, setShowArtifactSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingGalleryLayout, setUploadingGalleryLayout] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAction, setSuccessAction] = useState('created');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    curator: '',
    headerImage: '',
    galleryLayoutImage: '',
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

  // Handle gallery layout image upload
  const handleGalleryLayoutUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingGalleryLayout(true);
    
    try {
      const timestamp = Date.now();
      const filename = `exhibits/layouts/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, galleryLayoutImage: downloadURL }));
    } catch (error) {
      console.error('Error uploading gallery layout image:', error);
      alert('Error uploading gallery layout image. Please try again.');
    } finally {
      setUploadingGalleryLayout(false);
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
      
      // Capture whether this is an update or create before resetting
      const isUpdate = !!editingId;
      
      if (editingId) {
        await updateDoc(doc(db, 'exhibits', editingId), exhibitData);
      } else {
        exhibitData.createdAt = new Date();
        exhibitData.createdBy = user.uid;
        await addDoc(collection(db, 'exhibits'), exhibitData);
      }
      
      await loadExhibits();
      
      // Store the action type before resetting form
      setSuccessAction(isUpdate ? 'updated' : 'created');
      resetForm();
      setShowSuccessModal(true);
      
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving exhibit:', error);
      alert('Error saving exhibit. Please try again.');
    }
  };

  // Handle exhibit delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exhibit?')) {
      try {
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
      galleryLayoutImage: exhibit.galleryLayoutImage || '',
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
      galleryLayoutImage: '',
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

  // Calculate total value of exhibit artifacts
  const calculateExhibitValue = (artifactIds) => {
    if (!artifactIds || artifactIds.length === 0) return 0;
    
    return artifactIds.reduce((total, artifactId) => {
      const artifact = artifacts.find(a => a.id === artifactId);
      if (artifact && artifact.value) {
        // Handle both string and number values
        const value = typeof artifact.value === 'string' 
          ? parseFloat(artifact.value.replace(/[^0-9.-]+/g, '')) 
          : artifact.value;
        return total + (isNaN(value) ? 0 : value);
      }
      return total;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats for Admins */}
      {isAdmin && exhibits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exhibits</p>
                <p className="text-2xl font-semibold text-gray-900">{exhibits.length}</p>
              </div>
              <Grid className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Artifacts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {exhibits.reduce((total, exhibit) => total + (exhibit.artifactIds?.length || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collection Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${exhibits.reduce((total, exhibit) => 
                    total + calculateExhibitValue(exhibit.artifactIds), 0
                  ).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      )}

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
              <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
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
                    <Users className="w-4 h-4" />
                    <span>{exhibit.artifactIds?.length || 0} artifacts</span>
                  </div>
                  {isAdmin && exhibit.artifactIds?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>${calculateExhibitValue(exhibit.artifactIds).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/exhibit/${exhibit.id}`)}
                    className="flex-1 px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEdit(exhibit)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exhibit.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
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
                {isAdmin && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Value</th>}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exhibits.map(exhibit => (
                <tr key={exhibit.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{exhibit.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{exhibit.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {exhibit.startDate ? 
                      new Date(exhibit.startDate).toLocaleDateString() : 'Ongoing'}
                    {exhibit.endDate && ` - ${new Date(exhibit.endDate).toLocaleDateString()}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{exhibit.location || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{exhibit.artifactIds?.length || 0}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${calculateExhibitValue(exhibit.artifactIds).toLocaleString()}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
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
                          onClick={() => navigate(`/exhibit/${exhibit.id}`)}
                          className="flex-1 px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                        >
                        <Eye className="w-4 h-4" />
                          View
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
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter exhibit name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the exhibit"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Exhibition location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curator</label>
                    <input
                      type="text"
                      value={formData.curator}
                      onChange={(e) => setFormData({...formData, curator: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Curator name"
                    />
                  </div>
                </div>
              </div>
              
              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Images</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Image</label>
                    <div className="space-y-2">
                      {formData.headerImage ? (
                        <div className="relative">
                          <img
                            src={formData.headerImage}
                            alt="Header"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setFormData({...formData, headerImage: ''})}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            {uploading ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Layout Image</label>
                    <div className="space-y-2">
                      {formData.galleryLayoutImage ? (
                        <div className="relative">
                          <img
                            src={formData.galleryLayoutImage}
                            alt="Gallery Layout"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setFormData({...formData, galleryLayoutImage: ''})}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            {uploadingGalleryLayout ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleGalleryLayoutUpload}
                            disabled={uploadingGalleryLayout}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Artifacts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
                    {isAdmin && selectedArtifacts.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Total value: ${selectedArtifacts.reduce((total, artifact) => {
                          const value = artifact.value ? 
                            (typeof artifact.value === 'string' 
                              ? parseFloat(artifact.value.replace(/[^0-9.-]+/g, '')) 
                              : artifact.value) 
                            : 0;
                          return total + (isNaN(value) ? 0 : value);
                        }, 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowArtifactSelector(!showArtifactSelector)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Artifacts
                  </button>
                </div>
                
                {selectedArtifacts.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedArtifacts.map(artifact => (
                      <div key={artifact.id} className="relative bg-gray-50 rounded-lg p-3">
                        {artifact.images?.[0] && (
                          <img
                            src={artifact.images[0]}
                            alt={artifact.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        )}
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{artifact.name}</p>
                        <p className="text-xs text-gray-500">{artifact.manufacturer}</p>
                        <button
                          onClick={() => toggleArtifact(artifact)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {showArtifactSelector && (
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Search artifacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredArtifacts.map(artifact => (
                        <label
                          key={artifact.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedArtifacts.some(a => a.id === artifact.id)}
                            onChange={() => toggleArtifact(artifact)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{artifact.name}</p>
                            <p className="text-xs text-gray-500">
                              {artifact.manufacturer} • {artifact.category}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Feature this exhibit on the homepage</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({...formData, published: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Publish exhibit (make visible to all visitors)</span>
                  </label>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.description}
                  className={`px-6 py-2 ${
                    !formData.name || !formData.description 
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full animate-fade-in-up">
            <div className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Success!
              </h3>
              <p className="text-gray-600">
                Your exhibit has been {successAction} successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExhibitManager;
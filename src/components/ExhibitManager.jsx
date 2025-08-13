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
import ErrorModal from './shared/ErrorModal';
import { useErrorModal } from '../hooks/useErrorModal';

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
  
  // Add error modal hook
  const { error, showError, showErrorModal, hideErrorModal } = useErrorModal();
  
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
      showErrorModal('Error uploading image. Please try again.');
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
      showErrorModal('Error uploading gallery layout image. Please try again.');
    } finally {
      setUploadingGalleryLayout(false);
    }
  };

  // Handle exhibit save
  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      showErrorModal('Please fill in required fields (Name and Description)', 'Missing Required Fields');
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
      showErrorModal('Error saving exhibit. Please try again.');
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
        showErrorModal('Error deleting exhibit. Please try again.');
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
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Exhibits</h2>
        <div className="flex items-center gap-3">
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
{exhibit.headerImage && (
  <div className="h-48 overflow-hidden relative">
    <img
      src={exhibit.headerImage}
      alt={exhibit.name}
      className="w-full h-full object-cover"
    />
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
)}
              
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
                      {exhibit.featured && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/exhibit/${exhibit.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(exhibit)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exhibit.id)}
                            className="text-red-600 hover:text-red-800"
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

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  {editingId ? 'Edit Exhibit' : 'Create New Exhibit'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curator
                    </label>
                    <input
                      type="text"
                      value={formData.curator}
                      onChange={(e) => setFormData({ ...formData, curator: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Date and Location */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header Image
                    </label>
                    <div className="space-y-2">
                      {formData.headerImage && (
                        <img 
                          src={formData.headerImage} 
                          alt="Header" 
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                      <label className="block">
                        <span className="sr-only">Choose header image</span>
                        <div className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {uploading ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gallery Layout Image
                    </label>
                    <div className="space-y-2">
                      {formData.galleryLayoutImage && (
                        <img 
                          src={formData.galleryLayoutImage} 
                          alt="Gallery Layout" 
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                      <label className="block">
                        <span className="sr-only">Choose gallery layout image</span>
                        <div className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {uploadingGalleryLayout ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleGalleryLayoutUpload}
                            disabled={uploadingGalleryLayout}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Exhibit</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Published</span>
                  </label>
                </div>

                {/* Artifacts Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Artifacts ({selectedArtifacts.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowArtifactSelector(!showArtifactSelector)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showArtifactSelector ? 'Hide' : 'Select'} Artifacts
                    </button>
                  </div>

                  {showArtifactSelector && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Search artifacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredArtifacts.map(artifact => {
                          const isSelected = selectedArtifacts.some(a => a.id === artifact.id);
                          return (
                            <div
                              key={artifact.id}
                              onClick={() => toggleArtifact(artifact)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-blue-50 border-2 border-blue-500' 
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {artifact.images?.[0] && (
                                  <img
                                    src={artifact.images[0]}
                                    alt={artifact.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{artifact.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {artifact.manufacturer} • {artifact.category}
                                  </p>
                                </div>
                                {artifact.value && (
                                  <span className="text-sm font-medium text-green-600">
                                    ${artifact.value}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.name || !formData.description}
                    className={`px-6 py-2 rounded-lg ${
                      formData.name && formData.description
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    } text-white transition-colors flex items-center gap-2`}
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Create'} Exhibit
                  </button>
                </div>
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

      {/* Error Modal */}
      {showError && (
        <ErrorModal
          title={error?.title}
          message={error?.message}
          onClose={hideErrorModal}
        />
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
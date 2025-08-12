import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Calendar, Clock, DollarSign, 
  Package, ArrowRight, X, Save, Grid, List, Eye,
  Gavel, AlertCircle, CheckCircle, Upload, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

const AuctionManager = ({ user, isAdmin, db, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp }) => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [showArtifactSelector, setShowArtifactSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAction, setSuccessAction] = useState('');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    minimumBidIncrement: 10,
    buyNowEnabled: false,
    headerImage: '',
    artifactIds: [],
    featured: false,
    published: true,
    terms: ''
  });

  // Load auctions and artifacts
  useEffect(() => {
    loadAuctions();
    loadArtifacts();
  }, []);

  const loadAuctions = async () => {
    try {
      const q = query(collection(db, 'auctions'), orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const auctionsData = [];
      
      querySnapshot.forEach((doc) => {
        auctionsData.push({ id: doc.id, ...doc.data() });
      });
      
      setAuctions(auctionsData);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArtifacts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'artifacts'));
      const artifactsData = [];
      
      querySnapshot.forEach((doc) => {
        artifactsData.push({ id: doc.id, ...doc.data() });
      });
      
      setArtifacts(artifactsData);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  // Handle header image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      const timestamp = Date.now();
      const filename = `auctions/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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

  // Auto-hide success modal
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const auctionData = {
        ...formData,
        artifactIds: selectedArtifacts.map(a => a.id),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'auctions', editingId), auctionData);
        setSuccessAction('updated');
      } else {
        auctionData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'auctions'), auctionData);
        setSuccessAction('created');
      }

      setShowSuccessModal(true);
      resetForm();
      await loadAuctions();
    } catch (error) {
      console.error('Error saving auction:', error);
      alert('Error saving auction. Please try again.');
    }
  };

  // Handle auction delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this auction? This will also delete all associated bids.')) {
      try {
        // Delete all bids for this auction
        const bidsQuery = query(collection(db, 'bids'), where('auctionId', '==', id));
        const bidsSnapshot = await getDocs(bidsQuery);
        
        const deletePromises = [];
        bidsSnapshot.forEach((bidDoc) => {
          deletePromises.push(deleteDoc(doc(db, 'bids', bidDoc.id)));
        });
        
        await Promise.all(deletePromises);
        
        // Delete the auction
        await deleteDoc(doc(db, 'auctions', id));
        await loadAuctions();
      } catch (error) {
        console.error('Error deleting auction:', error);
        alert('Error deleting auction. Please try again.');
      }
    }
  };

  // Handle edit
  const handleEdit = async (auction) => {
    setFormData({
      name: auction.name || '',
      description: auction.description || '',
      startDate: auction.startDate || '',
      endDate: auction.endDate || '',
      minimumBidIncrement: auction.minimumBidIncrement || 10,
      buyNowEnabled: auction.buyNowEnabled || false,
      headerImage: auction.headerImage || '',
      artifactIds: auction.artifactIds || [],
      featured: auction.featured || false,
      published: auction.published !== undefined ? auction.published : true,
      terms: auction.terms || ''
    });

    // Load selected artifacts
    if (auction.artifactIds && auction.artifactIds.length > 0) {
      const selected = artifacts.filter(a => auction.artifactIds.includes(a.id));
      setSelectedArtifacts(selected);
    }

    setEditingId(auction.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      minimumBidIncrement: 10,
      buyNowEnabled: false,
      headerImage: '',
      artifactIds: [],
      featured: false,
      published: true,
      terms: ''
    });
    setSelectedArtifacts([]);
    setEditingId(null);
    setShowForm(false);
    setShowArtifactSelector(false);
  };

  // Handle artifact selection
  const toggleArtifactSelection = (artifact) => {
    const isSelected = selectedArtifacts.some(a => a.id === artifact.id);
    
    if (isSelected) {
      setSelectedArtifacts(selectedArtifacts.filter(a => a.id !== artifact.id));
    } else {
      setSelectedArtifacts([...selectedArtifacts, artifact]);
    }
  };

  const getStatus = (auction) => {
    const now = new Date();
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'upcoming': return <Calendar className="w-4 h-4" />;
      case 'ended': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Manage Auctions</h2>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Auction
            </button>
          </div>
        </div>
      )}

      {/* Auctions Display */}
      {auctions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No auctions created yet.</p>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first auction
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {auctions.map((auction) => {
            const status = getStatus(auction);
            const timeRemaining = status === 'active' ? calculateTimeRemaining(auction.endDate) : null;
            
            return viewMode === 'grid' ? (
              // Grid View
              <div key={auction.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {auction.headerImage && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={auction.headerImage}
                      alt={auction.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{auction.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  
                  {auction.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{auction.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateTime(auction.startDate)}</span>
                    </div>
                    
                    {status === 'active' && timeRemaining && (
                      <div className="flex items-center gap-2 text-orange-600 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>{timeRemaining} remaining</span>
                      </div>
                    )}
                    
                    {auction.artifactIds && auction.artifactIds.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Package className="w-4 h-4" />
                        <span>{auction.artifactIds.length} artifacts</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/auction/${auction.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(auction)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(auction.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // List View
              <div key={auction.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {auction.headerImage && (
                      <img
                        src={auction.headerImage}
                        alt={auction.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{auction.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      
                      {auction.description && (
                        <p className="text-sm text-gray-600 mb-2">{auction.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(auction.startDate)}
                        </span>
                        
                        {status === 'active' && timeRemaining && (
                          <span className="flex items-center gap-1 text-orange-600 font-medium">
                            <Clock className="w-4 h-4" />
                            {timeRemaining} remaining
                          </span>
                        )}
                        
                        {auction.artifactIds && auction.artifactIds.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {auction.artifactIds.length} artifacts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/auction/${auction.id}`)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(auction)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(auction.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Form Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Auction' : 'Create New Auction'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auction Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Bid Increment ($)
                    </label>
                    <input
                      type="number"
                      value={formData.minimumBidIncrement}
                      onChange={(e) => setFormData({ ...formData, minimumBidIncrement: parseFloat(e.target.value) || 10 })}
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header Image
                    </label>
                    <div className="space-y-2">
                      {formData.headerImage ? (
                        <div className="relative">
                          <img
                            src={formData.headerImage}
                            alt="Header"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            type="button"
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
                </div>
                
                {/* Terms & Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter auction terms and conditions..."
                  />
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
                    <span className="text-sm font-medium text-gray-700">Featured Auction</span>
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
                      {showArtifactSelector ? 'Hide' : 'Select Artifacts'}
                    </button>
                  </div>
                  
                  {selectedArtifacts.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                      {selectedArtifacts.map(artifact => (
                        <div key={artifact.id} className="flex items-center justify-between bg-white p-2 rounded">
                          <div className="flex items-center gap-3">
                            {artifact.images?.[0] && (
                              <img
                                src={artifact.images[0]}
                                alt={artifact.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <span className="text-sm font-medium">{artifact.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleArtifactSelection(artifact)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showArtifactSelector && (
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                      <input
                        type="text"
                        placeholder="Search artifacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <div className="space-y-2">
                        {artifacts
                          .filter(artifact => 
                            artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            artifact.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(artifact => {
                            const isSelected = selectedArtifacts.some(a => a.id === artifact.id);
                            return (
                              <div
                                key={artifact.id}
                                onClick={() => toggleArtifactSelection(artifact)}
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
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Create'} Auction
                  </button>
                </div>
              </form>
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
                Auction has been {successAction} successfully.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManager;
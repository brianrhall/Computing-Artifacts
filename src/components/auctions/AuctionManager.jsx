import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Calendar, Clock, DollarSign, 
  Package, ArrowRight, X, Save, Grid, List, Eye,
  Gavel, AlertCircle, CheckCircle, Upload, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import ErrorModal from '../shared/ErrorModal';
import { useErrorModal } from '../../hooks/useErrorModal';

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

  // Add error modal hook
  const { error, showError, showErrorModal, hideErrorModal } = useErrorModal();

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
      showErrorModal('Error uploading image. Please try again.');
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
      showErrorModal('Please fill in all required fields (Name, Start Date, End Date)', 'Missing Required Fields');
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
      showErrorModal('Error saving auction. Please try again.');
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
        showErrorModal('Error deleting auction. Please try again.');
      }
    }
  };

  // Handle edit
  const handleEdit = (auction) => {
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
    const selected = artifacts.filter(a => auction.artifactIds?.includes(a.id));
    setSelectedArtifacts(selected);
    
    setEditingId(auction.id);
    setShowForm(true);
  };

  // Reset form
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
    setSearchTerm('');
  };

  // Toggle artifact selection
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

  // Calculate total value of selected artifacts
  const calculateTotalValue = () => {
    return selectedArtifacts.reduce((total, artifact) => {
      const value = typeof artifact.value === 'string' 
        ? parseFloat(artifact.value.replace(/[^0-9.-]+/g, '')) 
        : artifact.value;
      return total + (isNaN(value) ? 0 : value);
    }, 0);
  };

  // Get auction status
  const getAuctionStatus = (auction) => {
    const now = new Date();
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    
    if (now < startDate) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now > endDate) {
      return { status: 'ended', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Auctions</h2>
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
              Create Auction
            </button>
          )}
        </div>
      </div>

      {/* Auctions Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map(auction => {
            const { status, color } = getAuctionStatus(auction);
            const auctionArtifacts = artifacts.filter(a => auction.artifactIds?.includes(a.id));
            const totalValue = auctionArtifacts.reduce((sum, a) => {
              const value = typeof a.value === 'string' 
                ? parseFloat(a.value.replace(/[^0-9.-]+/g, '')) 
                : a.value;
              return sum + (isNaN(value) ? 0 : value);
            }, 0);
            
            return (
              <div key={auction.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
{auction.headerImage && (
  <div className="h-48 sm:h-48 overflow-hidden relative bg-gray-100">
    <img
      src={auction.headerImage}
      alt={auction.name}
      className="w-full h-full object-contain sm:object-cover"
    />
    {auction.featured && (
      <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
        Featured
      </span>
    )}
    {!auction.published && (
      <span className="absolute top-2 right-2 px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded">
        Draft
      </span>
    )}
  </div>
)}
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{auction.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{auction.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(auction.startDate).toLocaleDateString()} - {new Date(auction.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{auction.artifactIds?.length || 0} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Est. ${totalValue.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/auction/${auction.id}`)}
                      className="flex-1 px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(auction)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(auction.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Auction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Items</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Est. Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(auction => {
                const { status, color } = getAuctionStatus(auction);
                const auctionArtifacts = artifacts.filter(a => auction.artifactIds?.includes(a.id));
                const totalValue = auctionArtifacts.reduce((sum, a) => {
                  const value = typeof a.value === 'string' 
                    ? parseFloat(a.value.replace(/[^0-9.-]+/g, '')) 
                    : a.value;
                  return sum + (isNaN(value) ? 0 : value);
                }, 0);
                
                return (
                  <tr key={auction.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {auction.headerImage ? (
                          <img 
                            src={auction.headerImage} 
                            alt={auction.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <Gavel className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{auction.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{auction.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(auction.startDate).toLocaleDateString()} - {new Date(auction.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {auction.artifactIds?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${totalValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${color}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/auction/${auction.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(auction)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(auction.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auction Name <span className="text-red-500">*</span>
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Auction Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Bid Increment ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minimumBidIncrement}
                      onChange={(e) => setFormData({ ...formData, minimumBidIncrement: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.buyNowEnabled}
                        onChange={(e) => setFormData({ ...formData, buyNowEnabled: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Buy Now</span>
                    </label>
                  </div>
                </div>

                {/* Header Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Image
                  </label>
                  <div className="space-y-2">
                    {formData.headerImage && (
                      <img 
                        src={formData.headerImage} 
                        alt="Header" 
                        className="w-full h-48 object-cover rounded"
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
                      {showArtifactSelector ? 'Hide' : 'Select'} Artifacts
                    </button>
                  </div>

                  {selectedArtifacts.length > 0 && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Total Estimated Value:
                        </span>
                        <span className="text-lg font-semibold text-green-600">
                          ${calculateTotalValue().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

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
                        {filteredArtifacts.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No artifacts found</p>
                        ) : (
                          filteredArtifacts.map(artifact => {
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
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Form Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Create'} Auction
              </button>
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

export default AuctionManager;
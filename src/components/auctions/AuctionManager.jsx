import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Calendar, Clock, DollarSign, 
  Package, ArrowRight, X, Save, Grid, List, Eye,
  Gavel, AlertCircle, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  };

  // Add/remove artifacts from auction
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

  // Get auction status
  const getAuctionStatus = (auction) => {
    const now = new Date();
    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  // Calculate total starting bid for auction
  const calculateTotalStartingBid = (artifactIds) => {
    if (!artifactIds || artifactIds.length === 0) return 0;
    
    return artifactIds.reduce((total, artifactId) => {
      const artifact = artifacts.find(a => a.id === artifactId);
      if (artifact && artifact.startingBid) {
        const value = typeof artifact.startingBid === 'string' 
          ? parseFloat(artifact.startingBid.replace(/[^0-9.-]+/g, '')) 
          : artifact.startingBid;
        return total + (isNaN(value) ? 0 : value);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auction Management</h2>
          <p className="text-gray-600 mt-1">Create and manage online auctions for artifacts</p>
        </div>
        
        <div className="flex items-center gap-4">
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
            const status = getAuctionStatus(auction);
            return (
              <div key={auction.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                  {auction.headerImage ? (
                    <img src={auction.headerImage} alt={auction.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Gavel className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {auction.featured && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                      Featured
                    </span>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded ${
                    status === 'active' ? 'bg-green-500 text-white' :
                    status === 'upcoming' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {status === 'active' ? 'Live' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
                  </span>
                </div>
                
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
                    {isAdmin && auction.artifactIds?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Starting from ${calculateTotalStartingBid(auction.artifactIds).toLocaleString()}</span>
                      </div>
                    )}
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Items</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(auction => {
                const status = getAuctionStatus(auction);
                return (
                  <tr key={auction.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{auction.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{auction.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(auction.startDate).toLocaleDateString()} - {new Date(auction.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{auction.artifactIds?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        status === 'active' ? 'bg-green-100 text-green-800' :
                        status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {status === 'active' ? 'Live' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/auction/${auction.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(auction)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(auction.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
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

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.headerImage}
                      onChange={(e) => setFormData({ ...formData, headerImage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
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
                
                {/* Artifacts Selection */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Auction Items</h4>
                      <p className="text-sm text-gray-500">
                        {selectedArtifacts.length} items selected
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowArtifactSelector(!showArtifactSelector)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Items
                    </button>
                  </div>
                  
                  {selectedArtifacts.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
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
                          {artifact.value && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              Est. ${artifact.value}
                            </p>
                          )}
                          <button
                            type="button"
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
                        {filteredArtifacts.map(artifact => {
                          const isSelected = selectedArtifacts.find(a => a.id === artifact.id);
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
                Your auction has been {successAction} successfully.
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

export default AuctionManager;
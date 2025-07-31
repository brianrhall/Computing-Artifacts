import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Trash2, Plus, Search, Filter, Save, X, CheckCircle, Clock, DollarSign, Grid, List, LogIn, LogOut, User, Shield, Package, Eye, Copy, CheckCircle2, Layers } from 'lucide-react';
import ExhibitManager from './ExhibitManager';
import ArtifactDetailModal from './ArtifactDetailModal';
import DisplayGroupsManager from './DisplayGroupsManager';
import ImageManagement from './ImageManagement';
import { useLocation, useNavigate } from 'react-router-dom';

// Firebase imports
import { auth, googleProvider, db, storage } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ComputingGalleryManager = () => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  // App states
  const [activeTab, setActiveTab] = useState('artifacts'); // New state for tabs
  const [artifacts, setArtifacts] = useState([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ name: '', action: '' });
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [displayGroupsFromDB, setDisplayGroupsFromDB] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  
  const categories = [
    'Mainframe', 'Minicomputer', 'Microcomputer', 'Personal Computer',
    'Laptop', 'Server', 'Storage Device', 'Peripheral', 'Component',
    'Mobile Device', 'Media Player', 'Software', 'Documentation', 'Marketing', 'Book', 'Clothing', 'Other'
  ];
  
  // Dynamic display groups from database
  const displayGroups = displayGroupsFromDB.length > 0 
    ? displayGroupsFromDB 
    : ['Early Computing Era', 'Personal Computer Revolution', 'Modern Era'];

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    year: '',
    os: '',
    description: '',
    condition: '',
    displayGroup: '',
    location: '',
    estimatedValue: '',
    acquisitionDate: '',
    donor: '',
    notes: '',
    taskStatus: 'To Do',
    taskPriority: 'Medium',
    taskNotes: '',
    images: []
  });

  // Real email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      const user = userCredential.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || null,
          role: 'visitor',
          createdAt: new Date()
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { role: 'visitor' };
      
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        photoURL: user.photoURL,
        role: userData.role || 'visitor'
      });
      
      setIsAdmin(userData.role === 'admin');
      setShowLoginForm(false);
      setLoginData({ email: '', password: '' });
    } catch (error) {
        console.error('Login error:', error);
    
        // Map all authentication errors to a generic message
        const genericErrorMessage = 'Invalid Email or Password';
    
        // You can still log the specific error for debugging
        console.error('Specific error code:', error.code);
    
        setAuthError(genericErrorMessage);
        return { success: false, error: genericErrorMessage };
    }
  };

  // Real Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document for new Google users
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'visitor',
          createdAt: new Date()
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { role: 'visitor' };
      
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: userData.role || 'visitor'
      });
      
      setIsAdmin(userData.role === 'admin');
      setShowLoginForm(false);
    } catch (error) {
      console.error('Google login error:', error);
      setAuthError(error.message);
    }
  };

  // Real logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // For URL navigation
  useEffect(() => {
  // Parse URL parameters
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');
  
  // Set active tab based on URL parameter
  if (tabParam && ['artifacts', 'exhibits', 'displayGroups'].includes(tabParam)) {
    setActiveTab(tabParam);
  }
}, [location.search]);

  // Add auth state listener in useEffect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Auth state changed - user signed in:', user.email);
        
        // Check if user document exists
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create user document if signing in for first time
          console.log('Creating user document for existing auth user');
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL || null,
            role: 'visitor',
            createdAt: new Date()
          });
        }
        
        const userData = userDoc.exists() ? userDoc.data() : { role: 'visitor' };
        
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || null,
          role: userData?.role || 'visitor'
        });
        
        setIsAdmin(userData?.role === 'admin');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load artifacts from Firestore
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const q = query(collection(db, 'artifacts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const artifactsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          artifactsData.push({ 
            id: doc.id, 
            ...data,
            images: data.images || [] // Ensure images is always an array
          });
        });
        
        setArtifacts(artifactsData);
        setFilteredArtifacts(artifactsData);
      } catch (error) {
        console.error('Error loading artifacts:', error);
        // Fallback to empty array if Firestore fails
        setArtifacts([]);
        setFilteredArtifacts([]);
      }
    };
    
    loadArtifacts();
  }, []);

  // Load display groups from Firestore
  useEffect(() => {
    const loadDisplayGroups = async () => {
      try {
        const q = query(collection(db, 'displayGroups'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const groups = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          groups.push(data.name); // Just push the name for the dropdown
        });
        
        setDisplayGroupsFromDB(groups);
      } catch (error) {
        console.error('Error loading display groups:', error);
      }
    };
    
    loadDisplayGroups();
  }, [activeTab]); // Reload when switching tabs

  // Filter artifacts based on search and filters
  useEffect(() => {
    let filtered = artifacts;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }
    
    if (filterGroup !== 'all') {
      filtered = filtered.filter(a => a.displayGroup === filterGroup);
    }
    
    setFilteredArtifacts(filtered);
  }, [searchTerm, filterCategory, filterGroup, artifacts]);

  // Updated image upload handler using Firebase Storage
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        // Create a unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `artifacts/${timestamp}_${randomString}_${sanitizedName}`;
        
        // Create storage reference
        const storageRef = ref(storage, filename);
        
        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      });
      
      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Update form data with Firebase URLs
      setFormData(prevData => ({ 
        ...prevData, 
        images: [...(prevData.images || []), ...uploadedUrls] 
      }));
      
      // Clear the file input
      e.target.value = '';
      
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Add this new function to handle image order updates
  const handleImagesUpdate = (newImages) => {
    setFormData(prevData => ({
      ...prevData,
      images: newImages
    }));
  };

  // Update handleSave to use Firestore
  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.displayGroup) {
      alert('Please fill in all required fields (Name, Category, Display Group)');
      return;
    }
    
    try {
      const artifactData = {
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer || '',
        model: formData.model || '',
        serialNumber: formData.serialNumber || '',  // Include serial number in save
        year: formData.year || '',
        os: formData.os || '',
        description: formData.description || '',
        condition: formData.condition || '',
        displayGroup: formData.displayGroup,
        location: formData.location || '',
        estimatedValue: formData.estimatedValue || '',
        acquisitionDate: formData.acquisitionDate || '',
        donor: formData.donor || '',
        notes: formData.notes || '',
        taskStatus: formData.taskStatus === 'None' ? '' : (formData.taskStatus || 'In Progress'),
        taskPriority: formData.taskStatus === 'None' ? '' : (formData.taskPriority || 'Medium'),
        taskNotes: formData.taskNotes || '',
        images: formData.images || [],
        updatedAt: new Date()
      };
      
      if (editingId) {
        // Update existing artifact
        await updateDoc(doc(db, 'artifacts', editingId), artifactData);
        
        // Update local state
        setArtifacts(prevArtifacts => 
          prevArtifacts.map(a => 
            a.id === editingId ? { ...artifactData, id: editingId } : a
          )
        );
      } else {
        // Add new artifact
        artifactData.createdAt = new Date();
        artifactData.createdBy = user?.uid || 'anonymous';
        
        const docRef = await addDoc(collection(db, 'artifacts'), artifactData);
        
        const newArtifact = { ...artifactData, id: docRef.id };
        setArtifacts(prevArtifacts => [...prevArtifacts, newArtifact]);
      }
      
      // Show success modal instead of browser confirm
      const action = editingId ? 'updated' : 'added';
      setSuccessModalData({ name: formData.name, action });
      setShowSuccessModal(true);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving artifact:', error);
      alert('Error saving artifact. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      year: '',
      os: '',
      description: '',
      condition: '',
      displayGroup: '',
      location: '',
      estimatedValue: '',
      acquisitionDate: '',
      donor: '',
      notes: '',
      taskStatus: 'To Do',
      taskPriority: 'Medium',
      taskNotes: '',
      images: []
    });
    setShowForm(false);
    setEditingId(null);
    setUploading(false);
  };

  const handleEdit = (artifact) => {
    setFormData({
      name: artifact.name || '',
      category: artifact.category || '',
      manufacturer: artifact.manufacturer || '',
      model: artifact.model || '',
      serialNumber: artifact.serialNumber || '',
      year: artifact.year || '',
      os: artifact.os || '',
      description: artifact.description || '',
      condition: artifact.condition || '',
      displayGroup: artifact.displayGroup || '',
      location: artifact.location || '',
      estimatedValue: artifact.estimatedValue || artifact.value || '',
      acquisitionDate: artifact.acquisitionDate || '',
      donor: artifact.donor || artifact.source || '',
      notes: artifact.notes || '',
      taskStatus: artifact.taskStatus || artifact.status || 'To Do',
      taskPriority: artifact.taskPriority || artifact.priority || 'Medium',
      taskNotes: artifact.taskNotes || artifact.todos || '',
      images: artifact.images || []
    });
    setEditingId(artifact.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this artifact?')) {
      try {
        // Find the artifact to get its images
        const artifactToDelete = artifacts.find(a => a.id === id);
        
        // Delete images from Firebase Storage
        if (artifactToDelete?.images && artifactToDelete.images.length > 0) {
          for (const imageUrl of artifactToDelete.images) {
            try {
              // Extract the path from the URL
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
            } catch (error) {
              console.error('Error deleting image:', error);
              // Continue even if image deletion fails
            }
          }
        }
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'artifacts', id));
        setArtifacts(artifacts.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting artifact:', error);
        alert('Error deleting artifact. Please try again.');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-orange-600 bg-orange-50';
      case 'Low': return 'text-yellow-600 bg-yellow-50';
      case 'None': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleArtifactClick = (artifact) => {
    setSelectedArtifact(artifact);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Auth */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Computing Artifacts Gallery</h1>
              <p className="text-gray-600">
                {user ? (
                  isAdmin ? 'Admin Dashboard - Manage your computing history collection' : 'Visitor View - Browse the collection'
                ) : 'Public Gallery - Sign in for more features'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <span>{user.displayName || user.email}</span>
                    {(isAdmin === true && user !== null) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>

{/* Tab Navigation */}
<nav className="flex space-x-8 border-b border-gray-200">
  <button
    onClick={() => {
      setActiveTab('artifacts');
      navigate('/?tab=artifacts');
    }}
    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === 'artifacts'
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-2">
      <Package className="w-4 h-4" />
      Artifacts
    </div>
  </button>
  <button
    onClick={() => {
      setActiveTab('exhibits');
      navigate('/?tab=exhibits');
    }}
    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === 'exhibits'
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-2">
      <Eye className="w-4 h-4" />
      Exhibits
    </div>
  </button>
  {(isAdmin === true && user !== null) && (
    <button
      onClick={() => {
        setActiveTab('displayGroups');
        navigate('/?tab=displayGroups');
      }}
      className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        activeTab === 'displayGroups'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4" />
        Display Groups
      </div>
    </button>
  )}
</nav>
        </header>

        {/* Content based on active tab */}
        {activeTab === 'artifacts' ? (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center flex-1">
                  <div className="relative flex-1 min-w-64">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
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
                    <option value="all">All Display Groups</option>
                    {displayGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                  </button>
                  
                  {(isAdmin === true && user !== null) && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Artifact
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Artifacts Display */}
            {filteredArtifacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No artifacts found matching your criteria.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtifacts.map(artifact => (
                  <div 
                    key={artifact.id} 
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleArtifactClick(artifact)}
                  >
                    <div className="aspect-w-16 aspect-h-9 relative bg-gray-100 rounded-t-lg overflow-hidden">
                      {artifact.images && artifact.images.length > 0 ? (
                        <>
                          <img 
                            src={artifact.images[0]} 
                            alt={artifact.name}
                            className="object-cover w-full h-48"
                          />
                          {artifact.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              {artifact.images.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                          <Camera className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{artifact.name}</h3>
                        {artifact.taskStatus && getStatusIcon(artifact.taskStatus)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {artifact.manufacturer} {artifact.model && `- ${artifact.model}`}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {artifact.category}
                        </span>
                        {artifact.year && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {artifact.year}
                          </span>
                        )}
                        {artifact.condition && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            artifact.condition === 'Mint' || artifact.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                            artifact.condition === 'Good' || artifact.condition === 'Working' ? 'bg-blue-100 text-blue-800' :
                            artifact.condition === 'Fair' || artifact.condition === 'Restored' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                            }`}>
                            {artifact.condition}
                          </span>
                        )}
                      </div>
                      
                      {artifact.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {artifact.description}
                        </p>
                      )}
                      
                      {/* Priority admin control*/}
                      {isAdmin && artifact.taskPriority && artifact.taskStatus !== 'Complete' && (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPriorityColor(artifact.taskPriority)}`}>
                        Priority: {artifact.taskPriority}
                        </div>
                      )}
                      
                      {(isAdmin === true && user !== null) && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(artifact);
                            }}
                            className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(artifact.id);
                            }}
                            className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      {(isAdmin === true && user !== null) && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredArtifacts.map(artifact => (
                      <tr 
                        key={artifact.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleArtifactClick(artifact)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {artifact.images && artifact.images.length > 0 ? (
                              <img 
                                src={artifact.images[0]} 
                                alt={artifact.name}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <Camera className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">{artifact.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artifact.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artifact.manufacturer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artifact.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {artifact.taskStatus && getStatusIcon(artifact.taskStatus)}
                            <span className="ml-2 text-sm text-gray-500">{artifact.taskStatus || 'N/A'}</span>
                          </div>
                        </td>
                        {(isAdmin === true && user !== null) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(artifact);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(artifact.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === 'exhibits' ? (
          <ExhibitManager user={user} isAdmin={isAdmin} artifacts={artifacts} />
        ) : activeTab === 'displayGroups' ? (
          <DisplayGroupsManager 
            user={user} 
            isAdmin={isAdmin}
            db={db}
            collection={collection}
            doc={doc}
            getDocs={getDocs}
            addDoc={addDoc}
            updateDoc={updateDoc}
            deleteDoc={deleteDoc}
            query={query}
            orderBy={orderBy}
            where={where}
          />
        ) : null}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Artifact' : 'Add New Artifact'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Section: Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
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
                        Category *
                      </label>
                      <select
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operating System
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.os}
                        onChange={(e) => setFormData({...formData, os: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section: Display Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Display Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Group *
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.displayGroup}
                        onChange={(e) => setFormData({...formData, displayGroup: e.target.value})}
                      >
                        <option value="">Select display group</option>
                        {displayGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Display Case A"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section: Condition and Value */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Condition & Value</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Value
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="text"
                          className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.estimatedValue}
                          onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Section: Acquisition */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acquisition Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acquisition Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.acquisitionDate}
                        onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Donor/Source
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.donor}
                        onChange={(e) => setFormData({...formData, donor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section: Task Management */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Task Management</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.taskStatus}
                        onChange={(e) => setFormData({...formData, taskStatus: e.target.value})}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Complete">Complete</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.taskPriority}
                        onChange={(e) => setFormData({...formData, taskPriority: e.target.value})}
                        disabled={formData.taskStatus === 'Complete' || formData.taskStatus === 'None'}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Notes
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tasks to complete, issues to address..."
                        value={formData.taskNotes}
                        onChange={(e) => setFormData({...formData, taskNotes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section: Additional Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section: Images with Drag-and-Drop Reordering */}
                <div className="sm:col-span-2">
                  <ImageManagement
                    images={formData.images}
                    onImagesUpdate={handleImagesUpdate}
                    onImageUpload={handleImageUpload}
                    uploading={uploading}
                    disabled={!isAdmin}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update Artifact' : 'Save Artifact'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full animate-fade-in">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Success!</h3>
              <p className="text-gray-600 text-center">
                {successModalData.name} has been {successModalData.action} successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Artifact Detail Modal */}
        {selectedArtifact && (
          <ArtifactDetailModal 
            artifact={selectedArtifact}
            onClose={() => setSelectedArtifact(null)}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Login Modal */}
        {showLoginForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sign In</h2>
                <button
                  onClick={() => setShowLoginForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {authError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {authError}
                </div>
              )}
              
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In with Email
                </button>
              </form>
              
              <div className="mt-4 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              
              <button
                onClick={handleGoogleLogin}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Sign In with Google
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputingGalleryManager;
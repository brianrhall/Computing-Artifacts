import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Trash2, Plus, Search, Filter, Save, X, CheckCircle, Clock, DollarSign, Grid, List, LogIn, LogOut, User, Shield, Package, Eye, Copy, CheckCircle2 } from 'lucide-react';
import ExhibitManager from './ExhibitManager';

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
  orderBy 
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
  
  const categories = [
    'Mainframe', 'Minicomputer', 'Microcomputer', 'Personal Computer',
    'Laptop', 'Server', 'Storage Device', 'Peripheral', 'Component',
    'Mobile Device', 'Media Player', 'Software', 'Documentation', 'Marketing', 'Other'
  ];
  
  const displayGroups = [
    'Early Computing Era', 'Personal Computer Revolution', 
    'Internet Age', 'Mobile Computing', 'Modern Era', 'Special Collection'
  ];

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',  // Added serial number field
    year: '',
    os: '',
    description: '',
    condition: '',
    displayGroup: '',
    location: '',
    value: '',
    acquisitionDate: '',
    donor: '',
    status: 'To Do',
    priority: 'Medium',
    taskNotes: '',
    images: []
  });

  // Real Firebase authentication
  const handleLogin = async () => {
    setAuthError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        loginData.email, 
        loginData.password
      );
      
      // Check/Create user document
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        console.log('Creating new user document for:', userCredential.user.email);
        await setDoc(userDocRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || userCredential.user.email,
          role: 'visitor',
          createdAt: new Date()
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { role: 'visitor' };
      
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: userData?.role || 'visitor'
      });
      
      setIsAdmin(userData?.role === 'admin');
      setShowLoginForm(false);
      setLoginData({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
    }
  };

  // Real Google authentication
  const handleGoogleLogin = async () => {
    setAuthError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // First time user - create user document
        console.log('Creating new user document for:', user.email);
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'visitor', // Default role
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
          displayName: user.displayName,
          photoURL: user.photoURL,
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

  // Function to remove image from form (but not from Firebase Storage yet)
  const removeImage = (index) => {
    setFormData(prevData => ({
      ...prevData,
      images: prevData.images.filter((_, i) => i !== index)
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
        value: formData.value || '',
        acquisitionDate: formData.acquisitionDate || '',
        donor: formData.donor || '',
        status: formData.status || 'To Do',
        priority: formData.status === 'Complete' ? 'None' : (formData.priority || 'Medium'),
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
      name: '', category: '', manufacturer: '', model: '', serialNumber: '', year: '', os: '',
      description: '', condition: '', displayGroup: '', location: '', value: '',
      acquisitionDate: '', donor: '', status: 'To Do', priority: 'Medium',
      taskNotes: '', images: []
    });
    setShowForm(false);
    setEditingId(null);
    setUploading(false);
  };

  const handleEdit = (artifact) => {
    // Ensure all fields have values, especially images
    setFormData({
      name: artifact.name || '',
      category: artifact.category || '',
      manufacturer: artifact.manufacturer || '',
      model: artifact.model || '',
      serialNumber: artifact.serialNumber || '',  // Include serial number in edit
      year: artifact.year || '',
      os: artifact.os || '',
      description: artifact.description || '',
      condition: artifact.condition || '',
      displayGroup: artifact.displayGroup || '',
      location: artifact.location || '',
      value: artifact.value || '',
      acquisitionDate: artifact.acquisitionDate || '',
      donor: artifact.donor || '',
      status: artifact.status || 'To Do',
      priority: artifact.priority || 'Medium',
      taskNotes: artifact.taskNotes || '',
      images: artifact.images || []
    });
    setEditingId(artifact.id);
    setShowForm(true);
  };

  const handleDuplicate = (artifact) => {
    // Copy all fields except ID and add " (Copy)" to the name
    setFormData({
      name: `${artifact.name} (Copy)`,
      category: artifact.category || '',
      manufacturer: artifact.manufacturer || '',
      model: artifact.model || '',
      serialNumber: artifact.serialNumber || '',  // Include serial number in duplicate
      year: artifact.year || '',
      os: artifact.os || '',
      description: artifact.description || '',
      condition: artifact.condition || '',
      displayGroup: artifact.displayGroup || '',
      location: artifact.location || '',
      value: artifact.value || '',
      acquisitionDate: artifact.acquisitionDate || '',
      donor: artifact.donor || '',
      status: artifact.status || 'To Do',
      priority: artifact.priority || 'Medium',
      taskNotes: artifact.taskNotes || '',
      images: artifact.images || []
    });
    setEditingId(null); // This is a new artifact, not an edit
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
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      case 'None': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
                      <img src={user.photoURL} alt={user.displayName || user.email} className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span>{user.displayName || user.email}</span>
                    {isAdmin && (
                      <Shield className="w-4 h-4 text-blue-600" title="Admin" />
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
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
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('artifacts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                onClick={() => setActiveTab('exhibits')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
            </nav>
          </div>
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
                    {viewMode === 'grid' ? 'List' : 'Grid'}
                  </button>
                  
                  {isAdmin && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Artifact
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredArtifacts.length} of {artifacts.length} artifacts
              </div>
            </div>

            {/* Artifacts Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtifacts.map(artifact => (
                  <div key={artifact.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-portrait bg-gray-100 relative overflow-hidden rounded-t-lg">
                      {artifact.images && artifact.images[0] ? (
                        <img src={artifact.images[0]} alt={artifact.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {isAdmin && artifact.priority && artifact.priority !== 'None' && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(artifact.priority)}`}>
                            {artifact.priority}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{artifact.name}</h3>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(artifact.status)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{artifact.manufacturer} {artifact.model}</p>
                      <p className="text-sm text-gray-500 mb-3">{artifact.year} • {artifact.category}</p>
                      
                      {artifact.os && (
                        <p className="text-sm text-gray-600 mb-2">OS: {artifact.os}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-500">{artifact.displayGroup}</span>
                        {isAdmin && artifact.value && (
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-3 h-3" />
                            {artifact.value}
                          </span>
                        )}
                      </div>
                      
                      {artifact.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{artifact.description}</p>
                      )}
                      
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(artifact)}
                            className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            title="Edit artifact"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDuplicate(artifact)}
                            className="flex-1 px-3 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                            title="Duplicate artifact"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>
                          <button
                            onClick={() => handleDelete(artifact.id)}
                            className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                            title="Delete artifact"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      )}
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Display Group</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                      )}
                      {isAdmin && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Value</th>
                      )}
                      {isAdmin && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredArtifacts.map(artifact => (
                      <tr key={artifact.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{artifact.name}</div>
                            <div className="text-sm text-gray-500">{artifact.manufacturer} {artifact.model}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{artifact.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{artifact.year}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{artifact.displayGroup}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(artifact.status)}
                            <span className="text-sm text-gray-600">{artifact.status}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            {artifact.priority && artifact.priority !== 'None' && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(artifact.priority)}`}>
                                {artifact.priority}
                              </span>
                            )}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {artifact.value && `$${artifact.value}`}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(artifact)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(artifact)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(artifact.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* Exhibits Tab */
          <ExhibitManager user={user} isAdmin={isAdmin} artifacts={artifacts} />
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Success!
              </h2>
              
              <p className="text-gray-600 text-center mb-6">
                <span className="font-semibold">"{successModalData.name}"</span> has been {successModalData.action} to the collection.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  Would you like to add another artifact?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  No, I'm Done
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowForm(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Yes, Add Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {showLoginForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setAuthError('');
                    setLoginData({ email: '', password: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                
                {authError && (
                  <p className="text-sm text-red-600">{authError}</p>
                )}
                
                <button
                  onClick={handleLogin}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In with Email
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <button
                  onClick={handleGoogleLogin}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
                
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-600 font-medium mb-1">Note:</p>
                  <p className="text-gray-600">Google Sign-In creates a visitor account by default.</p>
                  <p className="text-gray-600 mt-1">Contact admin for elevated permissions.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal - Only for Admins */}
        {showForm && isAdmin && activeTab === 'artifacts' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-4xl my-4 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b z-10 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Artifact' : 'Add New Artifact'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Section: Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
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
                          placeholder="Enter serial number (internal use only)"
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
                          <option value="For Parts">For Parts</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Value ($)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.value}
                          onChange={(e) => setFormData({...formData, value: e.target.value})}
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
                          value={formData.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setFormData({
                              ...formData, 
                              status: newStatus,
                              priority: newStatus === 'Complete' ? 'None' : formData.priority
                            });
                          }}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Complete">Complete</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.status === 'Complete' ? 'None' : formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          disabled={formData.status === 'Complete'}
                        >
                          <option value="None">None</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Notes
                        </label>
                        <textarea
                          rows="2"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Task details, restoration notes, work to be done, etc."
                          value={formData.taskNotes}
                          onChange={(e) => setFormData({...formData, taskNotes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Section: Acquisition Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Acquisition Information</h3>
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
                          Donor
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
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images (3:4 portrait orientation recommended)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                    />
                    {uploading && (
                      <p className="text-sm text-blue-600 mt-1">Uploading images...</p>
                    )}
                    {formData.images && formData.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={img} 
                              alt={`Upload ${idx + 1}`} 
                              className="w-full h-20 sm:h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF, WebP (max 5MB per file)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Sticky Footer */}
              <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className={`w-full sm:w-auto px-4 py-2 ${
                      uploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    {uploading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingId ? 'Update' : 'Save'} Artifact
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputingGalleryManager;
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, storage, auth, googleProvider } from '../firebase';
import { Search, Grid, List, Plus, Calendar, Tag, Monitor, MapPin, Upload, Package, Clock, CheckCircle, Edit2, Trash2, Copy, DollarSign, Camera, Users, X, CheckCircle2, LogOut } from 'lucide-react';
import GalleryVisitorView from '../GalleryVisitorView';
import ArtifactDetailModal from './ArtifactDetailModal';
import ArtifactForm from './ArtifactForm';
import ExhibitManager from './ExhibitManager';

const ComputingGalleryManager = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ name: '', action: '' });
  
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
        role: userData?.role || 'visitor'
      });
      
      setIsAdmin(userData?.role === 'admin');
      setShowLoginForm(false);
    } catch (error) {
      console.error('Google login error:', error);
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: userData?.role || 'visitor'
          });
          setIsAdmin(userData?.role === 'admin');
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load artifacts from Firestore
  useEffect(() => {
    loadArtifacts();
  }, []);

  const loadArtifacts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'artifacts'));
      const loadedArtifacts = [];
      querySnapshot.forEach((doc) => {
        loadedArtifacts.push({ id: doc.id, ...doc.data() });
      });
      setArtifacts(loadedArtifacts);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  // Filter artifacts based on search and filters
  useEffect(() => {
    const filtered = artifacts.filter(artifact => {
      const matchesSearch = artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           artifact.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           artifact.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || artifact.category === filterCategory;
      const matchesGroup = filterGroup === 'all' || artifact.displayGroup === filterGroup;
      return matchesSearch && matchesCategory && matchesGroup;
    });
    setFilteredArtifacts(filtered);
  }, [artifacts, searchTerm, filterCategory, filterGroup]);

  const categories = [...new Set(artifacts.map(a => a.category).filter(Boolean))];
  const displayGroups = [...new Set(artifacts.map(a => a.displayGroup).filter(Boolean))];

  const stats = {
    total: artifacts.length,
    categories: categories.length,
    working: artifacts.filter(a => a.condition === 'Working' || a.condition === 'Excellent' || a.condition === 'Good').length,
    totalValue: artifacts.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0),
    toDoItems: artifacts.filter(a => a.status === 'To Do').length,
    inProgressItems: artifacts.filter(a => a.status === 'In Progress').length,
    completeItems: artifacts.filter(a => a.status === 'Complete').length
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
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
        serialNumber: formData.serialNumber || '',
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
        const docRef = await addDoc(collection(db, 'artifacts'), artifactData);
        
        // Update local state
        setArtifacts(prevArtifacts => [...prevArtifacts, { ...artifactData, id: docRef.id }]);
      }
      
      // Show success modal
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
      serialNumber: artifact.serialNumber || '',
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
      serialNumber: artifact.serialNumber || '',
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
                        <span className="text-xs font-medium">{user.email?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span>{user.displayName || user.email}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {isAdmin ? 'Admin' : 'Visitor'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          {/* Tabs - Only show if admin */}
          {isAdmin && (
            <div className="flex gap-4 border-b">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
                  activeTab === 'gallery' 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setActiveTab('exhibits')}
                className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
                  activeTab === 'exhibits' 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Exhibits
              </button>
            </div>
          )}
        </header>

        {/* Login Form Modal */}
        {showLoginForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6">Sign In</h2>
              
              {authError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {authError}
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-3">
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
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>
                
                <button
                  onClick={handleGoogleLogin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Sign In with Google
                </button>
                
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setAuthError('');
                    setLoginData({ email: '', password: '' });
                  }}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Content */}
        {(!isAdmin || activeTab === 'gallery') ? (
          <>
            {/* If not logged in, show visitor view */}
            {!user && (
              <GalleryVisitorView artifacts={artifacts} />
            )}
            
            {/* If logged in as visitor, show visitor view */}
            {user && !isAdmin && (
              <GalleryVisitorView artifacts={artifacts} />
            )}
            
            {/* If logged in as admin, show full management interface */}
            {user && isAdmin && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Monitor className="w-8 h-8 text-blue-600" />
                      <span className="text-2xl font-bold">{stats.total}</span>
                    </div>
                    <p className="text-sm text-gray-600">Total Artifacts</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Tag className="w-8 h-8 text-green-600" />
                      <span className="text-2xl font-bold">{stats.categories}</span>
                    </div>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-8 h-8 text-purple-600" />
                      <span className="text-2xl font-bold">{stats.working}</span>
                    </div>
                    <p className="text-sm text-gray-600">Working Condition</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                      <span className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</span>
                    </div>
                    <p className="text-sm text-gray-600">Total Value</p>
                  </div>
                </div>

                {/* Task Progress */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
                  <h3 className="text-lg font-semibold mb-3">Task Progress</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">To Do: <span className="font-semibold">{stats.toDoItems}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-600">In Progress: <span className="font-semibold">{stats.inProgressItems}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Complete: <span className="font-semibold">{stats.completeItems}</span></span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Search and Filter Bar - Show for all users */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search artifacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Display Groups</option>
                  {displayGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                
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
                  <div 
                    key={artifact.id} 
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleArtifactClick(artifact)}
                  >
                    <div className="aspect-portrait bg-gray-100 relative overflow-hidden rounded-t-lg">
                      {artifact.images && artifact.images[0] ? (
                        <img src={artifact.images[0]} alt={artifact.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {/* ONLY SHOW PRIORITY TO ADMINS */}
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
                        {/* ONLY SHOW VALUE TO ADMINS */}
                        {isAdmin && artifact.value && (
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-3 h-3" />
                            {artifact.value}
                          </span>
                        )}
                      </div>
                      
                      {artifact.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {artifact.location}
                        </div>
                      )}
                      
                      {isAdmin && (
                        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(artifact)}
                            className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            title="Edit artifact"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDuplicate(artifact)}
                            className="flex-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                            title="Duplicate artifact"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Copy</span>
                          </button>
                          <button
                            onClick={() => handleDelete(artifact.id)}
                            className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                            title="Delete artifact"
                          >
                            <Trash2 className="w-3 h-3" />
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
                      {/* ONLY SHOW PRIORITY COLUMN TO ADMINS */}
                      {isAdmin && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                      )}
                      {/* ONLY SHOW VALUE COLUMN TO ADMINS */}
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
                      <tr 
                        key={artifact.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleArtifactClick(artifact)}
                      >
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
                        {/* ONLY SHOW PRIORITY CELL TO ADMINS */}
                        {isAdmin && (
                          <td className="px-4 py-3">
                            {artifact.priority && artifact.priority !== 'None' && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(artifact.priority)}`}>
                                {artifact.priority}
                              </span>
                            )}
                          </td>
                        )}
                        {/* ONLY SHOW VALUE CELL TO ADMINS */}
                        {isAdmin && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {artifact.value && `$${artifact.value}`}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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

        {/* Artifact Detail Modal - MUST PASS isAdmin */}
        {selectedArtifact && (
          <ArtifactDetailModal
            artifact={selectedArtifact}
            isAdmin={isAdmin}
            onClose={() => setSelectedArtifact(null)}
          />
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
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowForm(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Another
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && isAdmin && (
          <ArtifactForm
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            uploading={uploading}
            editingId={editingId}
            onCancel={resetForm}
          />
        )}
      </div>
    </div>
  );
};

export default ComputingGalleryManager;
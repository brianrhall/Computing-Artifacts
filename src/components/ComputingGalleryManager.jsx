import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Trash2, Plus, Search, Filter, Save, X, CheckCircle, Clock, DollarSign, Grid, List, LogIn, LogOut, User, Shield, Package, Eye, Copy, CheckCircle2, Layers } from 'lucide-react';
import ExhibitManager from './ExhibitManager';
import ArtifactDetailModal from './ArtifactDetailModal';
import DisplayGroupsManager from './DisplayGroupsManager';
import ImageManagement from './ImageManagement';
import { useArtifactFilters } from '../hooks/useArtifactFilters';
import ArtifactsControls from './artifacts/ArtifactsControls';

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
  const [activeTab, setActiveTab] = useState('artifacts');
  const [artifacts, setArtifacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ name: '', action: '' });
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [displayGroupsFromDB, setDisplayGroupsFromDB] = useState([]);
  
  // Use the custom hook for filtering and sorting
  const {
    filteredArtifacts,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterGroup,
    setFilterGroup,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useArtifactFilters(artifacts);
  
  const categories = [
    'Mainframe', 'Minicomputer', 'Microcomputer', 'Personal Computer',
    'Laptop', 'Server', 'Storage Device', 'Peripheral', 'Component',
    'Mobile Device', 'Media Player', 'Software', 'Documentation', 'Marketing', 'Book', 'Clothing', 'Other'
  ];
  
  // Dynamic display groups from database
  const displayGroups = displayGroupsFromDB.length > 0 
    ? displayGroupsFromDB 
    : ['Pre-1970s', '1970s', '1980s', '1990s', '2000s', '2010s+'];
  
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

  // Real sign up
  const handleSignUp = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName || user.email,
        role: 'visitor',
        createdAt: new Date()
      });
      
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email,
        role: 'visitor'
      });
      
      setIsAdmin(false);
      setShowLoginForm(false);
      setAuthError('');
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthError(error.message);
    }
  };

  // Real email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email,
          role: 'visitor',
          createdAt: new Date()
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { role: 'visitor' };
      
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        role: userData.role || 'visitor'
      });
      
      setIsAdmin(userData.role === 'admin');
      setShowLoginForm(false);
      setLoginData({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
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
        // Create user document for first-time Google users
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
      } catch (error) {
        console.error('Error loading artifacts:', error);
        // Fallback to empty array if Firestore fails
        setArtifacts([]);
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
            a.id === editingId ? { ...a, ...artifactData } : a
          )
        );
      } else {
        // Add new artifact
        artifactData.createdAt = new Date();
        const docRef = await addDoc(collection(db, 'artifacts'), artifactData);
        
        // Update local state
        setArtifacts(prevArtifacts => [
          { id: docRef.id, ...artifactData },
          ...prevArtifacts
        ]);
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
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'To Do':
        return <Package className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const handleArtifactClick = (artifact) => {
    if (!showForm) {
      setSelectedArtifact(artifact);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Computing Artifacts Gallery</h1>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">{user.displayName || user.email}</span>
                    {isAdmin && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center gap-2"
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
                  Login
                </button>
              )}
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <nav className="flex gap-4 border-t pt-4">
            <button
              onClick={() => setActiveTab('artifacts')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
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
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
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
            
            {isAdmin && (
              <button
                onClick={() => setActiveTab('displayGroups')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
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
            <ArtifactsControls
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterCategory={filterCategory}
              onCategoryChange={setFilterCategory}
              filterGroup={filterGroup}
              onGroupChange={setFilterGroup}
              categories={categories}
              displayGroups={displayGroups}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isAdmin={isAdmin}
              onAddArtifact={() => setShowForm(true)}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />

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
                            artifact.condition === 'Good' || artifact.condition === 'Working' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {artifact.condition}
                          </span>
                        )}
                      </div>
                      
                      {(isAdmin === true && user !== null) && (
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(artifact)}
                            className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(artifact.id)}
                            className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
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
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artifact</th>
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
                                className="h-10 w-10 rounded-full object-cover" 
                                src={artifact.images[0]} 
                                alt={artifact.name} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Camera className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{artifact.name}</div>
                              <div className="text-sm text-gray-500">{artifact.model}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artifact.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artifact.manufacturer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artifact.year || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {artifact.taskStatus && getStatusIcon(artifact.taskStatus)}
                        </td>
                        {(isAdmin === true && user !== null) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(artifact)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(artifact.id)}
                                className="text-red-600 hover:text-red-900"
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
        ) : activeTab === 'exhibits' ? (
          <ExhibitManager 
            artifacts={artifacts}
            isAdmin={isAdmin}
            user={user}
          />
        ) : activeTab === 'displayGroups' ? (
          <DisplayGroupsManager />
        ) : null}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
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
                
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
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
                          required
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                          <option value="">Select a category</option>
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
                      
                      <div>
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
                    
                    <div className="mt-4">
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
                  </div>
                  
                  {/* Display Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Display Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <option value="Working">Working</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                          <option value="For Parts">For Parts</option>
                          <option value="Non-Working">Non-Working</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Group *
                        </label>
                        <select
                          required
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.displayGroup}
                          onChange={(e) => setFormData({...formData, displayGroup: e.target.value})}
                        >
                          <option value="">Select a display group</option>
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
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="e.g., Display Case A, Storage Room B"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Acquisition Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Acquisition Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <DollarSign className="inline w-4 h-4" />
                          Estimated Value
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.estimatedValue}
                          onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                          placeholder="e.g., $500"
                        />
                      </div>
                      
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
                  
                  {/* Task Management */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Task Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.taskStatus}
                          onChange={(e) => setFormData({...formData, taskStatus: e.target.value})}
                        >
                          <option value="None">None</option>
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
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
                          disabled={formData.taskStatus === 'None'}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Notes
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.taskNotes}
                        onChange={(e) => setFormData({...formData, taskNotes: e.target.value})}
                        placeholder="Any specific tasks or to-dos for this artifact"
                        disabled={formData.taskStatus === 'None'}
                      />
                    </div>
                  </div>

                  {/* Images Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Images</h3>
                    
                    {/* Image Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Camera className="inline w-4 h-4 mr-1" />
                        Upload Images
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {uploading && (
                        <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
                      )}
                    </div>
                    
                    {/* Image Management Component */}
                    {formData.images && formData.images.length > 0 && (
                      <ImageManagement 
                        images={formData.images} 
                        onImagesUpdate={handleImagesUpdate}
                      />
                    )}
                  </div>
                  
                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4 border-t">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Update Artifact' : 'Save Artifact'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
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
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Success!</h3>
              <p className="text-center text-gray-600 mb-4">
                {successModalData.name} has been successfully {successModalData.action}.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            onEdit={isAdmin ? handleEdit : null}
            onDelete={isAdmin ? handleDelete : null}
          />
        )}

        {/* Login Form Modal */}
        {showLoginForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Login</h2>
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
              
              {authError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
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
                  Login with Email
                </button>
              </form>
              
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Login with Google
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      const email = prompt('Enter your email:');
                      const password = prompt('Enter your password:');
                      const displayName = prompt('Enter your display name (optional):');
                      
                      if (email && password) {
                        handleSignUp(email, password, displayName);
                      }
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputingGalleryManager;
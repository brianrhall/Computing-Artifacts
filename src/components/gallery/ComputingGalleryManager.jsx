// src/components/gallery/ComputingGalleryManager.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Components
import GalleryHeader from './GalleryHeader';
import GalleryTabs from './GalleryTabs';
import FilterControls from './FilterControls';
import ArtifactGridView from './ArtifactGridView';
import ArtifactListView from './ArtifactListView';
import ArtifactForm from './ArtifactForm';
import LoginForm from '../auth/LoginForm';
import SuccessModal from './SuccessModal';
import ValidationModal from '../shared/ValidationModal';

import ArtifactDetailModal from '../artifacts/ArtifactDetailModal';
import ExhibitManager from '../ExhibitManager';
import DisplayGroupsManager from '../DisplayGroupsManager';

// Hooks
import useArtifacts from '../../hooks/useArtifacts';

const ComputingGalleryManager = () => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // App states
  const [activeTab, setActiveTab] = useState('artifacts');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('galleryViewMode');
    return savedViewMode === 'list' || savedViewMode === 'grid' ? savedViewMode : 'grid';
  });
  const [sortOrder, setSortOrder] = useState('none');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ name: '', action: '' });
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [displayGroupsFromDB, setDisplayGroupsFromDB] = useState([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Custom hooks
  const { 
    artifacts, 
    loading, 
    uploading, 
    saveArtifact, 
    deleteArtifact, 
    uploadImages 
  } = useArtifacts(user);

  // Form state
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

  useEffect(() => {
    localStorage.setItem('galleryViewMode', viewMode);
  }, [viewMode]);

  // Dynamic display groups
  const displayGroups = displayGroupsFromDB.length > 0 
    ? displayGroupsFromDB 
    : ['Early Computing Era', 'Personal Computer Revolution', 'Modern Era'];

  // Load display groups from database
  useEffect(() => {
    const loadDisplayGroups = async () => {
      try {
        const q = query(collection(db, 'displayGroups'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const groups = [];
        snapshot.forEach(doc => {
          groups.push({ id: doc.id, ...doc.data() });
        });
        setDisplayGroupsFromDB(groups);
      } catch (error) {
        console.error('Error loading display groups:', error);
      }
    };
    loadDisplayGroups();
  }, []);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL || null,
            role: 'visitor',
            createdAt: new Date()
          });
        }
        
        const userData = userDoc.exists() ? userDoc.data() : {};
        const adminStatus = userData.role === 'admin';
        
        // Merge Firebase Auth user with Firestore data
        setUser({
          ...user,
          photoURL: userData.photoURL || user.photoURL,  // Prefer Firestore photoURL
          displayName: userData.displayName || user.displayName || user.email
        });
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle URL navigation for tabs
  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    // Set active tab based on URL parameter
    if (tabParam && ['artifacts', 'exhibits', 'displayGroups'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Filter artifacts based on search and filters
  useEffect(() => {
    let filtered = [...artifacts];
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.year?.toString().includes(searchTerm) ||
        a.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }
    
    if (filterGroup !== 'all') {
      filtered = filtered.filter(a => a.displayGroup === filterGroup);
    }
    
    // Sort by year if sort order is set
    if (sortOrder !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        
        if (sortOrder === 'asc') {
          return yearA - yearB;
        } else {
          return yearB - yearA;
        }
      });
    }
    
    setFilteredArtifacts(filtered);
  }, [searchTerm, filterCategory, filterGroup, artifacts, sortOrder]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    try {
      const uploadedUrls = await uploadImages(files);
      setFormData(prevData => ({ 
        ...prevData, 
        images: [...(prevData.images || []), ...uploadedUrls] 
      }));
      
      // Clear the file input
      e.target.value = '';
    } catch (error) {
      alert('Error uploading images. Please try again.');
    }
  };

  // Handle images update (for reordering)
  const handleImagesUpdate = (newImages) => {
    setFormData(prevData => ({
      ...prevData,
      images: newImages
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.displayGroup) {
      setShowValidationModal(true);
      return;
    }
    
    try {
      await saveArtifact(formData, editingId);
      
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

  // Reset form
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
  };

  // Handle edit
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

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this artifact?')) {
      try {
        await deleteArtifact(id);
      } catch (error) {
        console.error('Error deleting artifact:', error);
        alert('Error deleting artifact. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <GalleryHeader 
          user={user} 
          isAdmin={isAdmin}
          onSignIn={() => setShowLoginForm(true)}
          onSignOut={handleSignOut}
        />
        
        <GalleryTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isAdmin={isAdmin} 
        />

        {activeTab === 'artifacts' ? (
          <>
            <FilterControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              filterGroup={filterGroup}
              setFilterGroup={setFilterGroup}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              viewMode={viewMode}
              setViewMode={setViewMode}
              displayGroups={displayGroups}
              isAdmin={isAdmin}
              user={user}
              onAddNew={() => setShowForm(true)}
            />

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading artifacts...</p>
              </div>
            ) : filteredArtifacts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No artifacts found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <ArtifactGridView
                artifacts={filteredArtifacts}
                isAdmin={isAdmin}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArtifactClick={setSelectedArtifact}
              />
            ) : (
              <ArtifactListView
                artifacts={filteredArtifacts}
                isAdmin={isAdmin}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArtifactClick={setSelectedArtifact}
              />
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
          <ArtifactForm
            formData={formData}
            setFormData={setFormData}
            editingId={editingId}
            onSave={handleSave}
            onClose={resetForm}
            displayGroups={displayGroups}
            handleImageUpload={handleImageUpload}
            handleImagesUpdate={handleImagesUpdate}
            uploading={uploading}
            isAdmin={isAdmin}
          />
        )}

        {/* Login Modal */}
        {showLoginForm && (
          <LoginForm
            onClose={() => setShowLoginForm(false)}
            onSuccess={() => setShowLoginForm(false)}
          />
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <SuccessModal
            name={successModalData.name}
            action={successModalData.action}
            onClose={() => setShowSuccessModal(false)}
          />
        )}

        {/* Validation Modal */}
        {showValidationModal && (
          <ValidationModal
            onClose={() => setShowValidationModal(false)}
          />
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
      </div>
    </div>
  );
};

export default ComputingGalleryManager;
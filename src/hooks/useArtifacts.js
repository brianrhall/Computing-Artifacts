// src/hooks/useArtifacts.js
import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, 
  doc, query, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const useArtifacts = (user) => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load artifacts from Firestore
  const loadArtifacts = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'artifacts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const artifactsData = [];
      
      querySnapshot.forEach((doc) => {
        artifactsData.push({ id: doc.id, ...doc.data() });
      });
      
      setArtifacts(artifactsData);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save artifact (create or update)
  const saveArtifact = async (formData, editingId) => {
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
      value: formData.estimatedValue || '',  // Save as 'value' to match ArtifactDetailModal
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

    return artifactData;
  };

  // Delete artifact
  const deleteArtifact = async (id) => {
    const artifactToDelete = artifacts.find(a => a.id === id);
    
    // Delete images from Firebase Storage
    if (artifactToDelete?.images && artifactToDelete.images.length > 0) {
      for (const imageUrl of artifactToDelete.images) {
        try {
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
  };

  // Upload images to Firebase Storage
  const uploadImages = async (files) => {
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
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Load artifacts on mount
  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  return {
    artifacts,
    loading,
    uploading,
    saveArtifact,
    deleteArtifact,
    uploadImages,
    refreshArtifacts: loadArtifacts
  };
};

export default useArtifacts;
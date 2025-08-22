import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, User, ArrowLeft, Grid, List, 
  Camera, Clock, DollarSign, Shield, Eye, Map, X
} from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ExhibitView = () => {
  const { exhibitId } = useParams();
  const [exhibit, setExhibit] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Check if user is admin
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData?.role === 'admin');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (exhibitId) {
      loadExhibit();
    }
  }, [exhibitId]);

  const loadExhibit = async () => {
    try {
      // Load exhibit data
      const exhibitDoc = await getDoc(doc(db, 'exhibits', exhibitId));
      
      if (!exhibitDoc.exists()) {
        setLoading(false);
        return;
      }
      
      const exhibitData = { id: exhibitDoc.id, ...exhibitDoc.data() };
      setExhibit(exhibitData);
      
      // Load artifacts in the exhibit
      if (exhibitData.artifactIds && exhibitData.artifactIds.length > 0) {
        const artifactsData = [];
        
        for (const artifactId of exhibitData.artifactIds) {
          const artifactDoc = await getDoc(doc(db, 'artifacts', artifactId));
          if (artifactDoc.exists()) {
            artifactsData.push({ id: artifactDoc.id, ...artifactDoc.data() });
          }
        }
        
        setArtifacts(artifactsData);
      }
    } catch (error) {
      console.error('Error loading exhibit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading exhibit...</p>
        </div>
      </div>
    );
  }

  if (!exhibit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exhibit Not Found</h2>
          <p className="text-gray-600 mb-4">The exhibit you're looking for doesn't exist.</p>
          <Link to="/?tab=exhibits" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 justify-center">
            <ArrowLeft className="w-4 h-4" />
            Back to Exhibits
          </Link>
        </div>
      </div>
    );
  }

  // Check if exhibit is unpublished and user is not admin
  if (!exhibit.published && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Show exhibit image if available */}
            {exhibit.headerImage && (
              <div className="relative h-64 sm:h-80 md:h-[28rem] bg-gray-900 overflow-hidden">
                <img 
                  src={exhibit.headerImage} 
                  alt={exhibit.name}
                  className="w-full h-full object-cover sm:object-cover object-contain opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </div>
            )}
            
            <div className="p-6 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{exhibit.name}</h2>
              <p className="text-gray-600 mb-4">This exhibit is currently being prepared.</p>
              
              {/* Show date range if available */}
              {(exhibit.startDate || exhibit.endDate) && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {exhibit.startDate && new Date(exhibit.startDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                      {exhibit
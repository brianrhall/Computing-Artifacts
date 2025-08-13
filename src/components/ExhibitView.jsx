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
                      {exhibit.endDate && ` - ${new Date(exhibit.endDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}`}
                    </span>
                  </div>
                </div>
              )}
              
              <Link to="/?tab=exhibits" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 justify-center">
                <ArrowLeft className="w-4 h-4" />
                Back to Exhibits
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show admin preview banner if exhibit is unpublished and user is admin
  const showAdminPreview = !exhibit.published && isAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Preview Banner */}
      {showAdminPreview && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Admin Preview:</span>
              <span>This exhibit is unpublished and only visible to administrators.</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Image - Taller banner style */}
      {exhibit.headerImage && (
        <div className="relative h-80 md:h-[28rem] bg-gray-900 overflow-hidden">
          <img 
            src={exhibit.headerImage} 
            alt={exhibit.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {exhibit.name}
              </h1>
              {exhibit.featured && (
                <span className="inline-block px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded">
                  Featured Exhibit
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <Link 
          to="/?tab=exhibits" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exhibits
        </Link>
        
        {/* Exhibit Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {!exhibit.headerImage && (
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{exhibit.name}</h1>
          )}
          
          <p className="text-gray-700 text-lg mb-6">{exhibit.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {(exhibit.startDate || exhibit.endDate) && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Exhibition Dates</p>
                  <p className="text-gray-600">
                    {exhibit.startDate && new Date(exhibit.startDate).toLocaleDateString()}
                    {exhibit.endDate && ` - ${new Date(exhibit.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            )}
            
            {exhibit.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-gray-600">{exhibit.location}</p>
                </div>
              </div>
            )}
            
            {exhibit.curator && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Curated by</p>
                  <p className="text-gray-600">{exhibit.curator}</p>
                </div>
              </div>
            )}
            
            {exhibit.galleryLayoutImage && (
              <div className="flex items-start gap-3">
                <Map className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Gallery Layout</p>
                  <a 
                    href={exhibit.galleryLayoutImage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View floor plan
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Artifacts Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Artifacts in this Exhibit ({artifacts.length})
            </h2>
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
          </div>
          
          {artifacts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Grid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No artifacts have been added to this exhibit yet.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artifacts.map((artifact) => (
                <div 
                  key={artifact.id} 
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedArtifact(artifact)}
                >
                  {artifact.images && artifact.images.length > 0 ? (
                    <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
                      <img 
                        src={artifact.images[0]} 
                        alt={artifact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{artifact.name}</h3>
                    {artifact.manufacturer && (
                      <p className="text-sm text-gray-600 mb-1">{artifact.manufacturer}</p>
                    )}
                    {artifact.year && (
                      <p className="text-sm text-gray-500">{artifact.year}</p>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Artifact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Condition</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {artifacts.map((artifact) => (
                    <tr 
                      key={artifact.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedArtifact(artifact)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {artifact.images && artifact.images.length > 0 ? (
                            <img 
                              src={artifact.images[0]} 
                              alt={artifact.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <Camera className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{artifact.name}</p>
                            {artifact.manufacturer && (
                              <p className="text-sm text-gray-600">{artifact.manufacturer}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{artifact.category || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{artifact.year || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{artifact.condition || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{artifact.location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedArtifact(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedArtifact(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg z-10 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Image Gallery */}
              {selectedArtifact.images && selectedArtifact.images.length > 0 && (
                <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                  <img 
                    src={selectedArtifact.images[0]} 
                    alt={selectedArtifact.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedArtifact.name}
                </h2>
                
                {selectedArtifact.manufacturer && (
                  <p className="text-lg text-gray-600 mb-4">
                    by {selectedArtifact.manufacturer}
                  </p>
                )}
                
                {selectedArtifact.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedArtifact.description}</p>
                  </div>
                )}
                
                {selectedArtifact.historicalContext && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Historical Context</h3>
                    <p className="text-gray-700">{selectedArtifact.historicalContext}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedArtifact.condition && (
                    <div>
                      <p className="text-gray-500">Condition</p>
                      <p className="font-medium">{selectedArtifact.condition}</p>
                    </div>
                  )}
                  {selectedArtifact.location && (
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium">{selectedArtifact.location}</p>
                    </div>
                  )}
                  {selectedArtifact.acquisitionDate && (
                    <div>
                      <p className="text-gray-500">Acquired</p>
                      <p className="font-medium">
                        {new Date(selectedArtifact.acquisitionDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedArtifact.value && (
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-medium">${selectedArtifact.value.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExhibitView;
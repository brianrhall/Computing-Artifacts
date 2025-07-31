import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, User, ArrowLeft, Grid, List, 
  Camera, Clock, DollarSign, Shield, Eye
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
              <div className="relative h-48 bg-gray-900 overflow-hidden">
                <img 
                  src={exhibit.headerImage} 
                  alt={exhibit.name}
                  className="w-full h-full object-cover opacity-70"
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
          </div>
        </div>
        
        {/* Artifacts Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Artifacts in this Exhibit ({artifacts.length})
            </h2>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
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
                    <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                      <img 
                        src={artifact.images[0]} 
                        alt={artifact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{artifact.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {artifact.manufacturer} {artifact.model && `- ${artifact.model}`}
                    </p>
                    <p className="text-sm text-gray-500">{artifact.year}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Artifact</th>
                    <th className="text-left p-4 font-medium text-gray-900">Manufacturer</th>
                    <th className="text-left p-4 font-medium text-gray-900">Model</th>
                    <th className="text-left p-4 font-medium text-gray-900">Year</th>
                    <th className="text-left p-4 font-medium text-gray-900">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {artifacts.map((artifact) => (
                    <tr 
                      key={artifact.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedArtifact(artifact)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {artifact.images && artifact.images.length > 0 ? (
                            <img 
                              src={artifact.images[0]} 
                              alt={artifact.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Camera className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{artifact.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{artifact.manufacturer || '-'}</td>
                      <td className="p-4 text-gray-600">{artifact.model || '-'}</td>
                      <td className="p-4 text-gray-600">{artifact.year || '-'}</td>
                      <td className="p-4 text-gray-600">{artifact.category || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Artifact Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedArtifact.name}</h3>
                <button 
                  onClick={() => setSelectedArtifact(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {selectedArtifact.images && selectedArtifact.images.length > 0 && (
                <div className="mb-6">
                  <img 
                    src={selectedArtifact.images[0]} 
                    alt={selectedArtifact.name}
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                  {selectedArtifact.images.length > 1 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {selectedArtifact.images.slice(1).map((img, idx) => (
                        <img 
                          key={idx}
                          src={img} 
                          alt={`${selectedArtifact.name} ${idx + 2}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Manufacturer</p>
                  <p className="font-medium">{selectedArtifact.manufacturer || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{selectedArtifact.model || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{selectedArtifact.year || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedArtifact.category || 'Unknown'}</p>
                </div>
              </div>
              
              {selectedArtifact.description && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedArtifact.description}</p>
                </div>
              )}
              
              {selectedArtifact.technicalDetails && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                  <p className="text-gray-700">{selectedArtifact.technicalDetails}</p>
                </div>
              )}
              
              {selectedArtifact.historicalContext && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Historical Context</h4>
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
      )}
    </div>
  );
};

export default ExhibitView;
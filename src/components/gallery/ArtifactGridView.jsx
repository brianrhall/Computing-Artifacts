// src/components/gallery/ArtifactGridView.jsx
import React from 'react';
import { Camera, CheckCircle, Clock } from 'lucide-react';
import { getPriorityColor } from '../shared/constants';

const ArtifactGridView = ({
  artifacts,
  isAdmin,
  user,
  onEdit,
  onDelete,
  onArtifactClick
}) => {
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map(artifact => (
        <div 
          key={artifact.id} 
          className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer"
          onClick={() => onArtifactClick(artifact)}
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
                    onEdit(artifact);
                  }}
                  className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(artifact.id);
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
  );
};

export default ArtifactGridView;
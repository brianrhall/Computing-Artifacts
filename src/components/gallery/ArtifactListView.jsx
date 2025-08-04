// src/components/gallery/ArtifactListView.jsx
import React from 'react';
import { Camera, CheckCircle, Clock } from 'lucide-react';

const ArtifactListView = ({
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Manufacturer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Year
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Condition
            </th>
            {(isAdmin === true && user !== null) && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            )}
            {(isAdmin === true && user !== null) && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {artifacts.map(artifact => (
            <tr 
              key={artifact.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onArtifactClick(artifact)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {artifact.images && artifact.images.length > 0 ? (
                    <img 
                      src={artifact.images[0]} 
                      alt={artifact.name}
                      className="w-10 h-10 rounded-lg object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-900">{artifact.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {artifact.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {artifact.manufacturer}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {artifact.year}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {artifact.condition && (
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    artifact.condition === 'Mint' || artifact.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                    artifact.condition === 'Good' || artifact.condition === 'Working' ? 'bg-blue-100 text-blue-800' :
                    artifact.condition === 'Fair' || artifact.condition === 'Restored' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {artifact.condition}
                  </span>
                )}
              </td>
              {(isAdmin === true && user !== null) && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(artifact.status)}
                    <span className="text-sm text-gray-500">{artifact.status}</span>
                  </div>
                </td>
              )}
              {(isAdmin === true && user !== null) && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(artifact);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(artifact.id);
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
  );
};

export default ArtifactListView;
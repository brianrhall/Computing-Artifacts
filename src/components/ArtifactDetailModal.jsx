import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Calendar, Tag, Info, MapPin, Package, Clock, CheckCircle, DollarSign, User, FileText, Wrench } from 'lucide-react';

const ArtifactDetailModal = ({ artifact, isAdmin, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!artifact) return null;
  
  // Ensure images is always an array
  const images = artifact.images || [];
  const hasImages = images.length > 0;
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
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
  
  const getConditionColor = (condition) => {
    switch(condition) {
      case 'Mint': 
      case 'Excellent': 
        return 'bg-green-100 text-green-800';
      case 'Good': 
        return 'bg-blue-100 text-blue-800';
      case 'Fair': 
        return 'bg-yellow-100 text-yellow-800';
      case 'Poor':
      case 'For Parts':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">{artifact.name}</h2>
            <div className="flex items-center gap-2">
              {getStatusIcon(artifact.status)}
              {isAdmin && artifact.priority && artifact.priority !== 'None' && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(artifact.priority)}`}>
                  {artifact.priority}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Images */}
              <div>
                {hasImages ? (
                  <div className="relative">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={images[currentImageIndex]} 
                        alt={`${artifact.name} - Image ${currentImageIndex + 1}`} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {images.length > 1 && (
                      <>
                        {/* Navigation buttons */}
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        
                        {/* Dots indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentImageIndex 
                                  ? 'bg-white w-8' 
                                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                
                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`aspect-[3/4] bg-gray-100 rounded overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex 
                            ? 'border-blue-500' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">{artifact.category}</span>
                    </div>
                    {artifact.manufacturer && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Manufacturer</span>
                        <span className="font-medium">{artifact.manufacturer}</span>
                      </div>
                    )}
                    {artifact.model && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Model</span>
                        <span className="font-medium">{artifact.model}</span>
                      </div>
                    )}
                    {isAdmin && artifact.serialNumber && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Serial Number</span>
                        <span className="font-medium font-mono text-sm">{artifact.serialNumber}</span>
                      </div>
                    )}
                    {artifact.year && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Year</span>
                        <span className="font-medium">{artifact.year}</span>
                      </div>
                    )}
                    {artifact.os && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Operating System</span>
                        <span className="font-medium">{artifact.os}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Display Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Display Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">Display Group</span>
                      <span className="font-medium">{artifact.displayGroup}</span>
                    </div>
                    {artifact.location && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Location</span>
                        <span className="font-medium flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {artifact.location}
                        </span>
                      </div>
                    )}
                    {artifact.condition && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Condition</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(artifact.condition)}`}>
                          {artifact.condition}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                {artifact.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {artifact.description}
                    </p>
                  </div>
                )}
                
                {/* Value and Acquisition - Admin Only */}
                {isAdmin && (artifact.value || artifact.acquisitionDate || artifact.donor) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Value & Acquisition
                    </h3>
                    <div className="space-y-2">
                      {artifact.value && (
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-gray-600">Estimated Value</span>
                          <span className="font-medium text-green-600">${artifact.value}</span>
                        </div>
                      )}
                      {artifact.acquisitionDate && (
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-gray-600">Acquisition Date</span>
                          <span className="font-medium">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(artifact.acquisitionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {artifact.donor && (
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-gray-600">Donor</span>
                          <span className="font-medium">
                            <User className="w-4 h-4 inline mr-1" />
                            {artifact.donor}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Task Management - Admin Only (Moved outside the grid) */}
            {isAdmin && (artifact.status || artifact.taskNotes) && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Task Management
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium flex items-center gap-2">
                      {getStatusIcon(artifact.status)}
                      {artifact.status}
                    </span>
                  </div>
                  {artifact.taskNotes && (
                    <div className="py-2">
                      <span className="text-gray-600 block mb-2">Task Notes</span>
                      <p className="text-sm bg-gray-50 p-3 rounded">{artifact.taskNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactDetailModal;
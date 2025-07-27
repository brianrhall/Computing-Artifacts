import React, { useState } from 'react';
import { Upload, X, GripVertical, Camera } from 'lucide-react';

const ImageManagement = ({ 
  images = [], 
  onImagesUpdate, 
  onImageUpload, 
  uploading = false,
  disabled = false 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a visual effect
    e.target.style.opacity = '0.5';
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  // Handle drop
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const draggedImage = images[draggedIndex];
    const newImages = [...images];
    
    // Remove the dragged image
    newImages.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    // Update parent component
    onImagesUpdate(newImages);
    
    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Remove image at index
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesUpdate(newImages);
  };

  // Move image up
  const moveImageUp = (index) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onImagesUpdate(newImages);
  };

  // Move image down
  const moveImageDown = (index) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onImagesUpdate(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images (3:4 portrait orientation recommended)
        </label>
        
        {/* Upload button */}
        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageUpload}
            disabled={uploading || disabled}
            className="hidden"
            id="image-upload-input"
          />
          <label
            htmlFor="image-upload-input"
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              uploading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop images below to reorder. First image will be the primary display image.
          </p>
        </div>

        {/* Image grid with drag and drop */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className={`relative group ${
                  dragOverIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Drag handle */}
                <div className={`absolute top-1 left-1 z-10 bg-white bg-opacity-90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move ${
                  disabled ? 'hidden' : ''
                }`}>
                  <GripVertical className="w-4 h-4 text-gray-600" />
                </div>

                {/* Image number badge */}
                <div className="absolute top-1 right-1 z-10 bg-black bg-opacity-70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Primary image indicator */}
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 right-1 z-10 bg-green-600 text-white text-xs py-1 px-2 rounded text-center">
                    Primary
                  </div>
                )}

                {/* Image */}
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgZmlsbD0iI2NjYyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTMzIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                    }}
                  />
                </div>

                {/* Action buttons */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      {/* Move up button */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImageUp(index);
                          }}
                          className="p-1 bg-white rounded hover:bg-gray-100"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Move down button */}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImageDown(index);
                          }}
                          className="p-1 bg-white rounded hover:bg-gray-100"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">No images uploaded yet</p>
            </div>
          </div>
        )}

        {/* Help text */}
        {images.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Tip: On desktop, drag images to reorder. On mobile, use the arrow buttons.
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageManagement;
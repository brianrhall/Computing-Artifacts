import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';

// Individual sortable image item
const SortableImage = ({ image, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      <div className={`relative ${isDragging ? 'opacity-50' : ''}`}>
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 cursor-move bg-white bg-opacity-90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
        >
          <GripVertical size={16} className="text-gray-600" />
        </div>
        
        <img
          src={image.url || image}
          alt={image.name || 'Artifact image'}
          className="w-full h-24 object-cover rounded border-2 border-gray-200"
          draggable={false}
        />
        
        <button
          type="button"
          onClick={() => onRemove(image.id || image)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X size={12} />
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          {image.name || `Image ${image.order || 1}`}
        </div>
      </div>
    </div>
  );
};

// Main sortable container component
const SortableImageList = ({ images, onReorder, onRemove }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      
      const newImages = arrayMove(images, oldIndex, newIndex);
      onReorder(newImages);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map(img => img.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((image) => (
            <SortableImage
              key={image.id}
              image={image}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableImageList;
// src/components/gallery/ArtifactForm.jsx
import React from 'react';
import { X, Save } from 'lucide-react';
import ImageManagement from '../ImageManagement';
import { CATEGORIES, CONDITIONS, TASK_STATUSES, TASK_PRIORITIES } from '../shared/constants';

const ArtifactForm = ({
  formData,
  setFormData,
  editingId,
  onSave,
  onClose,
  displayGroups,
  handleImageUpload,
  handleImagesUpdate,
  uploading,
  isAdmin
}) => {
  const renderFormField = (label, name, type = 'text', options = {}) => {
    const { required = false, placeholder = '', rows = 3, disabled = false } = options;
    
    return (
      <div className={options.fullWidth ? 'sm:col-span-2' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' ? (
          <select
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData[name]}
            onChange={(e) => setFormData({...formData, [name]: e.target.value})}
            required={required}
            disabled={disabled}
          >
            {options.choices}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            rows={rows}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData[name]}
            onChange={(e) => setFormData({...formData, [name]: e.target.value})}
            placeholder={placeholder}
            required={required}
          />
        ) : (
          <input
            type={type}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData[name]}
            onChange={(e) => setFormData({...formData, [name]: e.target.value})}
            placeholder={placeholder}
            required={required}
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editingId ? 'Edit Artifact' : 'Add New Artifact'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Basic Information Section */}
          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Name', 'name', 'text', { required: true })}
              
              {renderFormField('Category', 'category', 'select', {
                required: true,
                choices: (
                  <>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </>
                )
              })}
              
              {renderFormField('Display Group', 'displayGroup', 'select', {
                required: true,
                choices: (
                  <>
                    <option value="">Select a display group</option>
                    {displayGroups.map(group => {
                      const groupName = typeof group === 'string' ? group : group.name;
                      return (
                        <option key={groupName} value={groupName}>
                          {groupName}
                        </option>
                      );
                    })}
                  </>
                )
              })}
              
              {renderFormField('Condition', 'condition', 'select', {
                choices: (
                  <>
                    <option value="">Select condition</option>
                    {CONDITIONS.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </>
                )
              })}
              
              {renderFormField('Manufacturer', 'manufacturer')}
              {renderFormField('Model', 'model')}
              {renderFormField('Serial Number', 'serialNumber')}
              {renderFormField('Year', 'year')}
              
              {renderFormField('Operating System', 'os', 'text', { fullWidth: true })}
            </div>
          </div>

          {/* Acquisition Details Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acquisition Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Acquisition Date', 'acquisitionDate', 'date')}
              {renderFormField('Donor/Source', 'donor')}
              {renderFormField('Location', 'location')}
              {isAdmin && renderFormField('Estimated Value', 'estimatedValue', 'text', { 
                placeholder: 'e.g., 500 or 1000' 
              })}
            </div>
          </div>

          {/* Task Management Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Status', 'taskStatus', 'select', {
                choices: (
                  <>
                    {TASK_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </>
                )
              })}
              
              {renderFormField('Priority', 'taskPriority', 'select', {
                disabled: formData.taskStatus === 'Complete' || formData.taskStatus === 'None',
                choices: (
                  <>
                    {TASK_PRIORITIES.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </>
                )
              })}
              
              {renderFormField('Task Notes', 'taskNotes', 'textarea', {
                fullWidth: true,
                rows: 2,
                placeholder: 'Tasks to complete, issues to address...'
              })}
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              {renderFormField('Description', 'description', 'textarea')}
              {renderFormField('Notes', 'notes', 'textarea')}
            </div>
          </div>

          {/* Images Section */}
          <div className="sm:col-span-2">
            <ImageManagement
              images={formData.images}
              onImagesUpdate={handleImagesUpdate}
              onImageUpload={handleImageUpload}
              uploading={uploading}
              disabled={!isAdmin}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t sm:col-span-2">
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Artifact' : 'Add Artifact'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactForm;
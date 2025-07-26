import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';

const DisplayGroupManager = ({ user, isAdmin, artifacts, onDisplayGroupsChange }) => {
  const [displayGroups, setDisplayGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ name: '', action: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });

  // Load display groups from Firestore
  useEffect(() => {
    const loadDisplayGroups = async () => {
      try {
        const q = query(collection(db, 'displayGroups'), orderBy('sortOrder', 'asc'));
        const querySnapshot = await getDocs(q);
        const groupsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          groupsData.push({ 
            id: doc.id, 
            ...data
          });
        });
        
        setDisplayGroups(groupsData);
        
        // Notify parent component of display groups change
        if (onDisplayGroupsChange) {
          onDisplayGroupsChange(groupsData);
        }
      } catch (error) {
        console.error('Error loading display groups:', error);
        setErrorMessage('Failed to load display groups');
      } finally {
        setLoading(false);
      }
    };
    
    loadDisplayGroups();
  }, [onDisplayGroupsChange]);

  // Get artifact count for each display group
  const getArtifactCount = (groupName) => {
    return artifacts.filter(artifact => artifact.displayGroup === groupName).length;
  };

  // Check if display group can be deleted (has no artifacts)
  const canDeleteGroup = (groupName) => {
    return getArtifactCount(groupName) === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sortOrder: displayGroups.length,
      isActive: true
    });
    setShowForm(false);
    setEditingId(null);
    setErrorMessage('');
  };

  const handleEdit = (group) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      sortOrder: group.sortOrder || 0,
      isActive: group.isActive !== false
    });
    setEditingId(group.id);
    setShowForm(true);
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMessage('Display group name is required');
      return;
    }

    // Check for duplicate names (excluding current item if editing)
    const duplicateExists = displayGroups.some(group => 
      group.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      group.id !== editingId
    );

    if (duplicateExists) {
      setErrorMessage('A display group with this name already exists');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sortOrder: parseInt(formData.sortOrder) || 0,
        isActive: formData.isActive,
        updatedAt: new Date()
      };

      if (editingId) {
        // Update existing display group
        await updateDoc(doc(db, 'displayGroups', editingId), groupData);
        
        // Update local state
        setDisplayGroups(prevGroups => 
          prevGroups.map(g => 
            g.id === editingId ? { ...groupData, id: editingId } : g
          ).sort((a, b) => a.sortOrder - b.sortOrder)
        );
      } else {
        // Add new display group
        groupData.createdAt = new Date();
        groupData.createdBy = user?.uid || 'anonymous';
        
        const docRef = await addDoc(collection(db, 'displayGroups'), groupData);
        
        const newGroup = { ...groupData, id: docRef.id };
        const updatedGroups = [...displayGroups, newGroup].sort((a, b) => a.sortOrder - b.sortOrder);
        setDisplayGroups(updatedGroups);
      }

      // Show success modal
      const action = editingId ? 'updated' : 'created';
      setSuccessModalData({ name: formData.name, action });
      setShowSuccessModal(true);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving display group:', error);
      setErrorMessage('Failed to save display group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!canDeleteGroup(name)) {
      alert(`Cannot delete "${name}" because it contains artifacts. Please move or delete all artifacts in this group first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the display group "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'displayGroups', id));
        const updatedGroups = displayGroups.filter(g => g.id !== id);
        setDisplayGroups(updatedGroups);
        
        // Notify parent component
        if (onDisplayGroupsChange) {
          onDisplayGroupsChange(updatedGroups);
        }
      } catch (error) {
        console.error('Error deleting display group:', error);
        alert('Error deleting display group. Please try again.');
      }
    }
  };

  const handleToggleActive = async (group) => {
    try {
      const updatedData = {
        ...group,
        isActive: !group.isActive,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'displayGroups', group.id), updatedData);
      
      setDisplayGroups(prevGroups => 
        prevGroups.map(g => 
          g.id === group.id ? updatedData : g
        )
      );
    } catch (error) {
      console.error('Error updating display group:', error);
      alert('Error updating display group. Please try again.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only administrators can manage display groups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading display groups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Display Groups</h2>
          <p className="text-gray-600 mt-1">
            Organize your artifacts by computing era or theme
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Display Group
        </button>
      </div>

      {/* Display Groups List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {displayGroups.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Display Groups</h3>
            <p className="text-gray-600 mb-4">Create your first display group to organize artifacts.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Display Group
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayGroups.map((group) => (
              <div key={group.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          group.isActive !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {group.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Order: {group.sortOrder || 0}
                        </span>
                      </div>
                    </div>
                    
                    {group.description && (
                      <p className="text-gray-600 mb-3">{group.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{getArtifactCount(group.name)} artifacts</span>
                      <span>•</span>
                      <span>Created {new Date(group.createdAt?.toDate()).toLocaleDateString()}</span>
                      {group.updatedAt && (
                        <>
                          <span>•</span>
                          <span>Updated {new Date(group.updatedAt?.toDate()).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(group)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        group.isActive !== false
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={group.isActive !== false ? 'Deactivate group' : 'Activate group'}
                    >
                      {group.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(group)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                      title="Edit display group"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(group.id, group.name)}
                      disabled={!canDeleteGroup(group.name)}
                      className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                        canDeleteGroup(group.name)
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        canDeleteGroup(group.name)
                          ? 'Delete display group'
                          : 'Cannot delete - group contains artifacts'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Display Group' : 'Add Display Group'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Early Computing Era"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this display group..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first in lists
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (available for new artifacts)
                </label>
              </div>
              
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Success!
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              Display group <span className="font-semibold">"{successModalData.name}"</span> has been {successModalData.action}.
            </p>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayGroupManager;
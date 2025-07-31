import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Save, Tag, Layers, 
  Calendar, ChevronRight, AlertCircle 
} from 'lucide-react';

const DisplayGroupsManager = ({ user, isAdmin, db, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, where }) => {
  const [displayGroups, setDisplayGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [artifactCounts, setArtifactCounts] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    dateRange: '',
    color: '#3B82F6', // Default blue color
    icon: 'Layers'
  });

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F28C28' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ];

  // Load display groups from Firestore
  useEffect(() => {
    loadDisplayGroups();
    loadArtifactCounts();
  }, []);

  const loadDisplayGroups = async () => {
    try {
      const q = query(collection(db, 'displayGroups'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const groupsData = [];
      
      querySnapshot.forEach((doc) => {
        groupsData.push({ id: doc.id, ...doc.data() });
      });
      
      setDisplayGroups(groupsData);
    } catch (error) {
      console.error('Error loading display groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArtifactCounts = async () => {
    try {
      const artifactsSnapshot = await getDocs(collection(db, 'artifacts'));
      const counts = {};
      
      artifactsSnapshot.forEach((doc) => {
        const artifact = doc.data();
        if (artifact.displayGroup) {
          counts[artifact.displayGroup] = (counts[artifact.displayGroup] || 0) + 1;
        }
      });
      
      setArtifactCounts(counts);
    } catch (error) {
      console.error('Error loading artifact counts:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a display group name');
      return;
    }
    
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        order: parseInt(formData.order) || 0,
        dateRange: formData.dateRange.trim(),
        color: formData.color,
        icon: formData.icon,
        updatedAt: new Date(),
        updatedBy: user.uid
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'displayGroups', editingId), groupData);
      } else {
        groupData.createdAt = new Date();
        groupData.createdBy = user.uid;
        await addDoc(collection(db, 'displayGroups'), groupData);
      }
      
      await loadDisplayGroups();
      await loadArtifactCounts();
      resetForm();
    } catch (error) {
      console.error('Error saving display group:', error);
      alert('Error saving display group. Please try again.');
    }
  };

  const handleEdit = (group) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      order: group.order || 0,
      dateRange: group.dateRange || '',
      color: group.color || '#3B82F6',
      icon: group.icon || 'Layers'
    });
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleDelete = async (id, groupName) => {
    const artifactCount = artifactCounts[groupName] || 0;
    
    if (artifactCount > 0) {
      alert(`Cannot delete "${groupName}" because it contains ${artifactCount} artifact${artifactCount !== 1 ? 's' : ''}. Please reassign the artifacts first.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${groupName}"?`)) {
      try {
        await deleteDoc(doc(db, 'displayGroups', id));
        await loadDisplayGroups();
      } catch (error) {
        console.error('Error deleting display group:', error);
        alert('Error deleting display group. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      order: displayGroups.length,
      dateRange: '',
      color: '#3B82F6',
      icon: 'Layers'
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Only administrators can manage display groups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Display Groups</h2>
          <p className="text-gray-600 mt-1">Organize artifacts by era or collection</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Display Group
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Edit Display Group' : 'New Display Group'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Early Computing Era"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of this collection..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <input
                  type="text"
                  value={formData.dateRange}
                  onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1970s-1980s"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Create'} Group
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Groups List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : displayGroups.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No display groups yet.</p>
          <p className="text-sm text-gray-500 mt-1">Create your first display group to organize artifacts.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${group.color}20`, color: group.color }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      {group.dateRange && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {group.dateRange}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-gray-600 mb-3">{group.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Order: <span className="font-medium text-gray-700">{group.order}</span>
                    </span>
                    <span className="text-gray-500">
                      Artifacts: <span className="font-medium text-gray-700">
                        {artifactCounts[group.name] || 0}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id, group.name)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips for organizing display groups:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Use chronological order for historical collections</li>
              <li>Groups with artifacts cannot be deleted until artifacts are reassigned</li>
              <li>Lower order numbers appear first in lists and filters</li>
              <li>Colors help visually distinguish groups in the interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayGroupsManager;
import React from 'react';
import { Search, List, Grid, Plus } from 'lucide-react';

const ArtifactsControls = ({
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterGroup,
  onGroupChange,
  categories,
  displayGroups,
  viewMode,
  onViewModeChange,
  isAdmin,
  onAddArtifact
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search artifacts..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterGroup}
            onChange={(e) => onGroupChange(e.target.value)}
          >
            <option value="all">All Display Groups</option>
            {displayGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          
          {isAdmin && (
            <button
              onClick={onAddArtifact}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Artifact
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtifactsControls;
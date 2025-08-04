// src/components/gallery/FilterControls.jsx
import React from 'react';
import { Search, Filter, Grid, List, Plus } from 'lucide-react';
import { CATEGORIES } from '../shared/constants';

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterGroup,
  setFilterGroup,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  displayGroups,
  isAdmin,
  user,
  onAddNew
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search artifacts..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2">
          {/* Category Filter */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Display Group Filter */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="all">All Display Groups</option>
            {displayGroups.map(group => {
              const groupName = typeof group === 'string' ? group : group.name;
              return (
                <option key={groupName} value={groupName}>
                  {groupName}
                </option>
              );
            })}
          </select>

          {/* Sort Order */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="none">Default Order</option>
            <option value="asc">Year (Oldest First)</option>
            <option value="desc">Year (Newest First)</option>
          </select>

              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </button>
              
              {(isAdmin === true && user !== null) && (
                <button
                  onClick={onAddNew}
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

export default FilterControls;
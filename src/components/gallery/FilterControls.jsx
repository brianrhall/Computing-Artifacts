// src/components/gallery/FilterControls.jsx - UPDATED VERSION
import React, { useState } from 'react';
import { Search, Filter, Grid, List, Plus, ChevronDown, X } from 'lucide-react';
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="mb-6">
      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        {/* Search bar and action buttons */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              showMobileFilters ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable filters */}
        {showMobileFilters && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <select
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="w-full px-3 py-2 border rounded-lg text-sm"
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

            <select
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="none">Default Order</option>
              <option value="asc">Year (Oldest First)</option>
              <option value="desc">Year (Newest First)</option>
            </select>
          </div>
        )}

        {/* Floating Add Button for Mobile */}
        {isAdmin && user && (
          <button
            onClick={onAddNew}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="flex flex-col lg:flex-row gap-4">
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
          <div className="flex flex-wrap gap-2">
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
                <span className="hidden lg:inline">Add Artifact</span>
                <span className="lg:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
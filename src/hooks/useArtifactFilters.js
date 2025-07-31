import { useState, useEffect } from 'react';

export const useArtifactFilters = (artifacts) => {
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // default sort by name
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    let filtered = artifacts;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }
    
    // Apply display group filter
    if (filterGroup !== 'all') {
      filtered = filtered.filter(a => a.displayGroup === filterGroup);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'year':
          // Convert years to numbers for proper sorting
          const yearA = parseInt(a.year) || 0;
          const yearB = parseInt(b.year) || 0;
          compareValue = yearA - yearB;
          break;
          
        case 'name':
          compareValue = (a.name || '').localeCompare(b.name || '');
          break;
          
        case 'manufacturer':
          compareValue = (a.manufacturer || '').localeCompare(b.manufacturer || '');
          break;
          
        case 'category':
          compareValue = (a.category || '').localeCompare(b.category || '');
          break;
          
        default:
          compareValue = 0;
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setFilteredArtifacts(sorted);
  }, [searchTerm, filterCategory, filterGroup, sortBy, sortOrder, artifacts]);

  return {
    filteredArtifacts,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterGroup,
    setFilterGroup,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  };
};
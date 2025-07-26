import { useState, useEffect } from 'react';

export const useArtifactFilters = (artifacts) => {
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');

  useEffect(() => {
    let filtered = artifacts;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }
    
    if (filterGroup !== 'all') {
      filtered = filtered.filter(a => a.displayGroup === filterGroup);
    }
    
    setFilteredArtifacts(filtered);
  }, [searchTerm, filterCategory, filterGroup, artifacts]);

  return {
    filteredArtifacts,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterGroup,
    setFilterGroup
  };
};
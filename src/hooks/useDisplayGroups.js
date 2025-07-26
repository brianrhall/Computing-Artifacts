import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export const useDisplayGroups = () => {
  const [displayGroups, setDisplayGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDisplayGroups = async () => {
    try {
      const q = query(collection(db, 'displayGroups'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const groups = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        groups.push(data.name);
      });
      
      setDisplayGroups(groups);
    } catch (error) {
      console.error('Error loading display groups:', error);
      // Fallback to default groups if database fails
      setDisplayGroups(['Early Computing Era', 'Personal Computer Revolution', 'Modern Era']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisplayGroups();
  }, []);

  return {
    displayGroups,
    loading,
    refreshDisplayGroups: loadDisplayGroups
  };
};
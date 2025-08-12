import React from 'react';
import { Package, Eye, Layers, Gavel } from 'lucide-react'; // Add Gavel icon
import { useNavigate, useLocation } from 'react-router-dom';

const GalleryTabs = ({ activeTab, setActiveTab, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    // Update URL to reflect the current tab
    if (tabId === 'artifacts') {
      // For artifacts tab, remove the tab parameter (default view)
      navigate('/');
    } else {
      // For other tabs, add the tab parameter
      navigate(`/?tab=${tabId}`);
    }
  };

  const tabs = [
    {
      id: 'artifacts',
      label: 'Artifacts',
      icon: Package,
      visible: true
    },
    {
      id: 'exhibits',
      label: 'Exhibits',
      icon: Eye,
      visible: true
    },
    {
      id: 'auctions',      // Add this new tab
      label: 'Auctions',
      icon: Gavel,
      visible: true       // Make it visible to all users
    },
    {
      id: 'displayGroups',
      label: 'Display Groups',
      icon: Layers,
      visible: isAdmin
    }
  ];

  return (
    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
      {tabs.filter(tab => tab.visible).map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default GalleryTabs;
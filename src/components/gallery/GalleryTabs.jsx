// src/components/gallery/GalleryTabs.jsx - UPDATED VERSION
import React from 'react';
import { Package, Eye, Layers, Gavel } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const GalleryTabs = ({ activeTab, setActiveTab, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    if (tabId === 'artifacts') {
      navigate('/');
    } else {
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
      id: 'auctions',
      label: 'Auctions',
      icon: Gavel,
      visible: true
    },
    {
      id: 'displayGroups',
      label: 'Display Groups',
      icon: Layers,
      visible: isAdmin
    }
  ];

  return (
    <div className="mb-6">
      {/* Mobile: Horizontal scroll */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 -mx-6 px-6 sm:hidden">
        {tabs.filter(tab => tab.visible).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: Full width tabs */}
      <div className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
    </div>
  );
};

export default GalleryTabs;
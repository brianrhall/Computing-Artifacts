import React from 'react';
import { Package, Eye, Layers } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, isAdmin }) => {
  const tabs = [
    { id: 'artifacts', label: 'Artifacts', icon: Package, showAlways: true },
    { id: 'exhibits', label: 'Exhibits', icon: Eye, showAlways: true },
    { id: 'displayGroups', label: 'Display Groups', icon: Layers, showAlways: false }
  ];

  return (
    <nav className="flex space-x-8 border-b border-gray-200">
      {tabs.map(tab => {
        if (!tab.showAlways && !isAdmin) return null;
        
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {tab.label}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default TabNavigation;
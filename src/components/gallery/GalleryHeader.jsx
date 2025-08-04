// src/components/gallery/GalleryHeader.jsx
import React from 'react';
import { User, Shield, LogIn, LogOut } from 'lucide-react';

const GalleryHeader = ({ 
  user, 
  isAdmin, 
  onSignIn, 
  onSignOut 
}) => {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Computing Artifacts Gallery
          </h1>
          <p className="text-gray-600">
            {user ? (
              isAdmin 
                ? 'Admin Dashboard - Manage your computing history collection' 
                : 'Visitor View - Browse the collection'
            ) : 'Public Gallery - Sign in for more features'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 p-1 bg-gray-200 rounded-full" />
                )}
                <span>{user.displayName || user.email}</span>
                {isAdmin && (
                  <Shield className="w-4 h-4 text-blue-600" title="Admin" />
                )}
              </div>
              <button
                onClick={onSignOut}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default GalleryHeader;
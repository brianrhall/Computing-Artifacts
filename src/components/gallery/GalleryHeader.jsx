// src/components/gallery/GalleryHeader.jsx - UPDATED VERSION
import React, { useState } from 'react';
import { User, Shield, LogIn, LogOut, Menu, X } from 'lucide-react';

const GalleryHeader = ({ 
  user, 
  isAdmin, 
  onSignIn, 
  onSignOut 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="mb-8">
      {/* Mobile Header */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Computing Artifacts
            </h1>
            <p className="text-sm text-gray-600">
              {user ? (isAdmin ? 'Admin' : 'Visitor') : 'Gallery'}
            </p>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User" 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <User className="w-10 h-10 p-2 bg-gray-200 rounded-full" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {user.displayName || user.email}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Administrator
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onSignIn();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between">
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
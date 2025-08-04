import React, { useState } from 'react';
import { User, Shield, LogIn, LogOut } from 'lucide-react';
import LoginForm from './LoginForm';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const AuthSection = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
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
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </>
      ) : (
        <button
          onClick={() => setShowLoginForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
      )}

      {showLoginForm && (
        <LoginForm 
          onClose={() => setShowLoginForm(false)}
          onSuccess={(userData) => {
            setUser(userData.user);
            setIsAdmin(userData.isAdmin);
            setShowLoginForm(false);
          }}
        />
      )}
    </div>
  );
};

export default AuthSection;
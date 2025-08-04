// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { auth, googleProvider, db } from '../../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LoginForm = ({ onClose, onSuccess }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        loginData.email, 
        loginData.password
      );
      const user = userCredential.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || null,
          role: 'visitor',
          createdAt: new Date()
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Login error:', error);
      // Show user-friendly error messages
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/user-not-found') {
        setAuthError('Invalid username or password.');
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError('Network error. Please check your connection.');
      } else {
        setAuthError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check/create user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'visitor',
          createdAt: new Date()
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Google login error:', error);
      // Show user-friendly error messages
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in was cancelled.');
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError('Network error. Please check your connection.');
      } else {
        setAuthError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sign In</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {authError}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
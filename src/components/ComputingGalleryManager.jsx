import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Trash2, Plus, Search, Filter, Save, X, CheckCircle, Clock, DollarSign, Grid, List, LogIn, LogOut, User, Shield } from 'lucide-react';

const ComputingGalleryManager = () => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  // App states
  const [artifacts, setArtifacts] = useState([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  const categories = [
    'Mainframe', 'Minicomputer', 'Microcomputer', 'Personal Computer',
    'Laptop', 'Server', 'Storage Device', 'Peripheral', 'Component',
    'Software', 'Documentation', 'Other'
  ];
  
  const displayGroups = [
    'Early Computing Era', 'Personal Computer Revolution', 
    'Internet Age', 'Mobile Computing', 'Modern Era', 'Special Collection'
  ];

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    year: '',
    os: '',
    description: '',
    condition: '',
    displayGroup: '',
    location: '',
    value: '',
    acquisitionDate: '',
    donor: '',
    status: 'To Do',
    priority: 'Medium',
    notes: '',
    images: []
  });

  // Mock authentication (replace with Firebase auth)
  const handleLogin = () => {
    setAuthError('');
    
    // Mock authentication - replace with Firebase auth
    if (loginData.email === 'admin@gallery.com' && loginData.password === 'admin123') {
      setUser({ email: loginData.email, role: 'admin' });
      setIsAdmin(true);
      setShowLoginForm(false);
      setLoginData({ email: '', password: '' });
    } else if (loginData.email === 'visitor@gallery.com' && loginData.password === 'visitor123') {
      setUser({ email: loginData.email, role: 'visitor' });
      setIsAdmin(false);
      setShowLoginForm(false);
      setLoginData({ email: '', password: '' });
    } else {
      setAuthError('Invalid email or password');
    }
  };

  // Mock Google authentication (replace with Firebase Google auth)
  const handleGoogleLogin = () => {
    setAuthError('');
    
    // Mock Google authentication - replace with Firebase auth
    // In production, this would use firebase.auth().signInWithPopup(googleProvider)
    
    // Simulate Google login - for demo, we'll create a mock Google user as admin
    const mockGoogleUser = {
      email: 'user@gmail.com',
      displayName: 'Google User',
      photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=4285f4&color=fff',
      role: 'admin' // In production, check Firestore or custom claims for role
    };
    
    setUser(mockGoogleUser);
    setIsAdmin(true);
    setShowLoginForm(false);
    setLoginData({ email: '', password: '' });
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
  };

  // Load saved data on mount
  useEffect(() => {
    const savedData = [
      {
        id: 1,
        name: 'Apple II',
        category: 'Personal Computer',
        manufacturer: 'Apple',
        model: 'II',
        year: '1977',
        os: 'Apple DOS',
        description: 'One of the first mass-produced microcomputers',
        condition: 'Good',
        displayGroup: 'Personal Computer Revolution',
        location: 'Display Case A',
        value: '2500',
        acquisitionDate: '2023-05-15',
        donor: 'John Smith',
        status: 'Complete',
        priority: 'High',
        notes: 'Fully functional with original monitor',
        images: []
      },
      {
        id: 2,
        name: 'IBM System/360',
        category: 'Mainframe',
        manufacturer: 'IBM',
        model: 'System/360 Model 30',
        year: '1965',
        os: 'OS/360',
        description: 'Revolutionary mainframe computer system',
        condition: 'Fair',
        displayGroup: 'Early Computing Era',
        location: 'Storage Room B',
        value: '15000',
        acquisitionDate: '2022-11-20',
        donor: 'Tech Museum Foundation',
        status: 'In Progress',
        priority: 'Medium',
        notes: 'Needs restoration work',
        images: []
      }
    ];
    setArtifacts(savedData);
    setFilteredArtifacts(savedData);
  }, []);

  // Filter artifacts based on search and filters
  useEffect(() => {
    let filtered = artifacts;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSave = () => {
    if (!formData.name || !formData.category || !formData.displayGroup) {
      alert('Please fill in all required fields (Name, Category, Display Group)');
      return;
    }
    
    if (editingId) {
      const updated = artifacts.map(a => 
        a.id === editingId ? { ...formData, id: editingId } : a
      );
      setArtifacts(updated);
    } else {
      const newArtifact = { ...formData, id: Date.now() };
      setArtifacts([...artifacts, newArtifact]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '', category: '', manufacturer: '', model: '', year: '', os: '',
      description: '', condition: '', displayGroup: '', location: '', value: '',
      acquisitionDate: '', donor: '', status: 'To Do', priority: 'Medium',
      notes: '', images: []
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (artifact) => {
    setFormData(artifact);
    setEditingId(artifact.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this artifact?')) {
      setArtifacts(artifacts.filter(a => a.id !== id));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(readers).then(images => {
      setFormData({ ...formData, images: [...formData.images, ...images] });
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Auth */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Computing Artifacts Gallery</h1>
              <p className="text-gray-600">
                {user ? (
                  isAdmin ? 'Admin Dashboard - Manage your computing history collection' : 'Visitor View - Browse the collection'
                ) : 'Public Gallery - Sign in for more features'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || user.email} className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span>{user.displayName || user.email}</span>
                    {isAdmin && (
                      <Shield className="w-4 h-4 text-blue-600" title="Admin" />
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
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
            </div>
          </div>
          
          {/* Demo Credentials Notice */}
          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800 font-medium mb-1">Demo Credentials:</p>
              <p className="text-blue-700">Admin: admin@gallery.com / admin123</p>
              <p className="text-blue-700">Visitor: visitor@gallery.com / visitor123</p>
            </div>
          )}
        </header>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search artifacts..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="all">All Display Groups</option>
                {displayGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Artifact
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredArtifacts.length} of {artifacts.length} artifacts
          </div>
        </div>

        {/* Artifacts Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtifacts.map(artifact => (
              <div key={artifact.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {artifact.images && artifact.images[0] ? (
                    <img src={artifact.images[0]} alt={artifact.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(artifact.priority)}`}>
                      {artifact.priority}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{artifact.name}</h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(artifact.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">{artifact.manufacturer} {artifact.model}</p>
                  <p className="text-sm text-gray-500 mb-3">{artifact.year} • {artifact.category}</p>
                  
                  {artifact.os && (
                    <p className="text-sm text-gray-600 mb-2">OS: {artifact.os}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-500">{artifact.displayGroup}</span>
                    {artifact.value && (
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-3 h-3" />
                        {artifact.value}
                      </span>
                    )}
                  </div>
                  
                  {artifact.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{artifact.description}</p>
                  )}
                  
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(artifact)}
                        className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(artifact.id)}
                        className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Display Group</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Value</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredArtifacts.map(artifact => (
                  <tr key={artifact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{artifact.name}</div>
                        <div className="text-sm text-gray-500">{artifact.manufacturer} {artifact.model}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{artifact.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{artifact.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{artifact.displayGroup}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(artifact.status)}
                        <span className="text-sm text-gray-600">{artifact.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {artifact.value && `$${artifact.value}`}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(artifact)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(artifact.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Login Modal */}
        {showLoginForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setAuthError('');
                    setLoginData({ email: '', password: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    placeholder="Enter your email"
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
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                
                {authError && (
                  <p className="text-sm text-red-600">{authError}</p>
                )}
                
                <button
                  onClick={handleLogin}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In with Email
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <button
                  onClick={handleGoogleLogin}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
                
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-600 font-medium mb-1">Demo Accounts:</p>
                  <p className="text-gray-600">Admin: admin@gallery.com / admin123</p>
                  <p className="text-gray-600">Visitor: visitor@gallery.com / visitor123</p>
                  <p className="text-gray-600 mt-1">Google Sign-In: Creates admin account</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal - Only for Admins */}
        {showForm && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-4xl my-4 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b z-10 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Artifact' : 'Add New Artifact'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Section: Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.model}
                          onChange={(e) => setFormData({...formData, model: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.year}
                          onChange={(e) => setFormData({...formData, year: e.target.value})}
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Operating System
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.os}
                          onChange={(e) => setFormData({...formData, os: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Section: Display Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Display Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Group *
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.displayGroup}
                          onChange={(e) => setFormData({...formData, displayGroup: e.target.value})}
                        >
                          <option value="">Select display group</option>
                          {displayGroups.map(group => (
                            <option key={group} value={group}>{group}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Display Case A"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Section: Condition and Value */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Condition & Value</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.condition}
                          onChange={(e) => setFormData({...formData, condition: e.target.value})}
                        >
                          <option value="">Select condition</option>
                          <option value="Mint">Mint</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                          <option value="For Parts">For Parts</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Value ($)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.value}
                          onChange={(e) => setFormData({...formData, value: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Section: Task Management */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Task Management</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Complete">Complete</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Section: Acquisition Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Acquisition Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Acquisition Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.acquisitionDate}
                          onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Donor
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.donor}
                          onChange={(e) => setFormData({...formData, donor: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="2"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes, restoration details, etc."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {formData.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img} alt="" className="w-full h-20 sm:h-24 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = formData.images.filter((_, i) => i !== idx);
                                setFormData({...formData, images: newImages});
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Sticky Footer */}
              <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Save'} Artifact
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputingGalleryManager;
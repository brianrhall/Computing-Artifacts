import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, Clock, ArrowLeft, DollarSign, 
  Gavel, AlertCircle, CheckCircle, User, 
  Package, Eye, Timer, TrendingUp, Shield, X  // Added X here
} from 'lucide-react';
import { db, auth } from '../../firebase';  // Fixed path - added '../'
import { 
  doc, getDoc, collection, query, where, getDocs, 
  addDoc, orderBy, limit, onSnapshot, serverTimestamp  // limit is already here
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AuctionView = () => {
  const { auctionId } = useParams();
  const [auction, setAuction] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [bids, setBids] = useState({});
  const [bidAmount, setBidAmount] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [auctionStatus, setAuctionStatus] = useState('');

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Check if user is admin
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData?.role === 'admin');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auctionId) {
      loadAuction();
    }
  }, [auctionId]);

  // Update time remaining every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (auction) {
        updateTimeRemaining();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const updateTimeRemaining = () => {
    const now = new Date();
    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    
    if (now < start) {
      setAuctionStatus('upcoming');
      const diff = start - now;
      setTimeRemaining(formatTimeDifference(diff, 'Starts in'));
    } else if (now > end) {
      setAuctionStatus('ended');
      setTimeRemaining('Auction ended');
    } else {
      setAuctionStatus('active');
      const diff = end - now;
      setTimeRemaining(formatTimeDifference(diff, 'Ends in'));
    }
  };

  const formatTimeDifference = (diff, prefix) => {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${prefix} ${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${prefix} ${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${prefix} ${minutes}m ${seconds}s`;
    }
  };

  const loadAuction = async () => {
    try {
      // Load auction data
      const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
      
      if (!auctionDoc.exists()) {
        setLoading(false);
        return;
      }
      
      const auctionData = { id: auctionDoc.id, ...auctionDoc.data() };
      setAuction(auctionData);
      
      // Load artifacts in the auction
      if (auctionData.artifactIds && auctionData.artifactIds.length > 0) {
        const artifactsData = [];
        
        for (const artifactId of auctionData.artifactIds) {
          const artifactDoc = await getDoc(doc(db, 'artifacts', artifactId));
          if (artifactDoc.exists()) {
            artifactsData.push({ id: artifactDoc.id, ...artifactDoc.data() });
          }
        }
        
        setArtifacts(artifactsData);
        
        // Load bids for each artifact
        loadBidsForArtifacts(auctionData.artifactIds);
      }
    } catch (error) {
      console.error('Error loading auction:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBidsForArtifacts = (artifactIds) => {
    const unsubscribes = [];
    
    artifactIds.forEach(artifactId => {
      const q = query(
        collection(db, 'bids'),
        where('auctionId', '==', auctionId),
        where('artifactId', '==', artifactId),
        orderBy('bidAmount', 'desc'),
        limit(1)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const highestBid = snapshot.docs[0].data();
          setBids(prev => ({
            ...prev,
            [artifactId]: highestBid
          }));
        }
      });
      
      unsubscribes.push(unsubscribe);
    });
    
    // Cleanup
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  };

  const handleBidClick = (artifact) => {
    if (!user) {
      alert('Please sign in to place a bid');
      return;
    }
    
    if (auctionStatus !== 'active') {
      alert('This auction is not currently active');
      return;
    }
    
    setSelectedArtifact(artifact);
    const currentBid = bids[artifact.id]?.bidAmount || 0;
    const minimumBid = Math.max(
      artifact.startingBid || artifact.value || 0,
      currentBid + auction.minimumBidIncrement
    );
    setBidAmount(minimumBid.toString());
    setShowBidModal(true);
  };

  const handlePlaceBid = async () => {
    if (!selectedArtifact || !bidAmount) return;
    
    const amount = parseFloat(bidAmount);
    const currentBid = bids[selectedArtifact.id]?.bidAmount || 0;
    const minimumBid = Math.max(
      selectedArtifact.startingBid || selectedArtifact.value || 0,
      currentBid + auction.minimumBidIncrement
    );
    
    if (amount < minimumBid) {
      alert(`Minimum bid is $${minimumBid.toFixed(2)}`);
      return;
    }
    
    setBidding(true);
    
    try {
      await addDoc(collection(db, 'bids'), {
        auctionId: auctionId,
        artifactId: selectedArtifact.id,
        artifactName: selectedArtifact.name,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        bidAmount: amount,
        timestamp: serverTimestamp()
      });
      
      setShowBidModal(false);
      setShowSuccessModal(true);
      
      // Auto-hide success modal
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Error placing bid. Please try again.');
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
          <p className="text-gray-600 mb-4">The auction you're looking for doesn't exist.</p>
          <Link to="/?tab=auctions" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 justify-center">
            <ArrowLeft className="w-4 h-4" />
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Check if auction is unpublished and user is not admin
  if (!auction.published && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{auction.name}</h2>
              <p className="text-gray-600 mb-4">This auction is currently being prepared.</p>
              
              <Link to="/?tab=auctions" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 justify-center">
                <ArrowLeft className="w-4 h-4" />
                Back to Auctions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showAdminPreview = !auction.published && isAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Preview Banner */}
      {showAdminPreview && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Admin Preview:</span>
              <span>This auction is unpublished and only visible to administrators.</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Image */}
      {auction.headerImage && (
        <div className="relative h-64 md:h-80 bg-gray-900 overflow-hidden">
          <img 
            src={auction.headerImage} 
            alt={auction.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {auction.name}
              </h1>
              <div className="flex items-center gap-4 text-white">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  auctionStatus === 'active' ? 'bg-green-500' :
                  auctionStatus === 'upcoming' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}>
                  {auctionStatus === 'active' ? 'Live Auction' : 
                   auctionStatus === 'upcoming' ? 'Upcoming' : 'Ended'}
                </span>
                <span className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  {timeRemaining}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <Link 
          to="/?tab=auctions" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Auctions
        </Link>
        
        {/* Auction Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {!auction.headerImage && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  auctionStatus === 'active' ? 'bg-green-100 text-green-800' :
                  auctionStatus === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {auctionStatus === 'active' ? 'Live Auction' : 
                   auctionStatus === 'upcoming' ? 'Upcoming' : 'Ended'}
                </span>
                <span className="flex items-center gap-2 text-gray-600">
                  <Timer className="w-5 h-5" />
                  {timeRemaining}
                </span>
              </div>
            </>
          )}
          
          {auction.description && (
            <p className="text-gray-700 text-lg mb-6">{auction.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Auction Period</p>
                <p className="text-sm text-gray-600">
                  {new Date(auction.startDate).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  {' - '}
                  {new Date(auction.endDate).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Total Items</p>
                <p className="text-sm text-gray-600">{artifacts.length} artifacts</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Bid Increment</p>
                <p className="text-sm text-gray-600">${auction.minimumBidIncrement} minimum</p>
              </div>
            </div>
          </div>
          
// Continuing from line 413 - auction.terms section
          {auction.terms && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Terms & Conditions
              </h3>
              <div className="prose prose-sm text-gray-600 max-w-none">
                {auction.terms.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artifacts.map(artifact => {
            const currentBid = bids[artifact.id]?.bidAmount || 0;
            const startingBid = artifact.startingBid || artifact.value || 0;
            const displayBid = currentBid > 0 ? currentBid : startingBid;
            const hasActiveBid = currentBid > 0;
            
            return (
              <div key={artifact.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {artifact.images && artifact.images.length > 0 ? (
                    <img 
                      src={artifact.images[0]} 
                      alt={artifact.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {hasActiveBid && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Active Bid
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{artifact.name}</h3>
                  {artifact.manufacturer && (
                    <p className="text-sm text-gray-600 mb-2">{artifact.manufacturer} {artifact.model}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {hasActiveBid ? 'Current Bid' : 'Starting Bid'}
                      </span>
                      <span className="font-bold text-lg text-gray-900">
                        ${displayBid.toLocaleString()}
                      </span>
                    </div>
                    
                    {hasActiveBid && (
                      <div className="text-xs text-gray-500">
                        by {bids[artifact.id].userName}
                      </div>
                    )}
                  </div>
                  
                  {auctionStatus === 'active' ? (
                    <button
                      onClick={() => handleBidClick(artifact)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Gavel className="w-4 h-4" />
                      Place Bid
                    </button>
                  ) : auctionStatus === 'upcoming' ? (
                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center text-sm">
                      Auction Not Started
                    </div>
                  ) : (
                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center text-sm">
                      Auction Ended
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Bid Modal */}
      {showBidModal && selectedArtifact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Place Your Bid</h3>
                  <p className="text-gray-600 mt-1">{selectedArtifact.name}</p>
                </div>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Bid
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    ${(bids[selectedArtifact.id]?.bidAmount || selectedArtifact.startingBid || selectedArtifact.value || 0).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Bid Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your bid"
                      step={auction.minimumBidIncrement}
                      min={Math.max(
                        selectedArtifact.startingBid || selectedArtifact.value || 0,
                        (bids[selectedArtifact.id]?.bidAmount || 0) + auction.minimumBidIncrement
                      )}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum bid increment: ${auction.minimumBidIncrement}
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Bid Information</p>
                      <ul className="space-y-1 text-xs">
                        <li>• All bids are final and cannot be retracted</li>
                        <li>• You will be notified if you are outbid</li>
                        <li>• Winner will be contacted at auction end</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={bidding}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={bidding || !bidAmount}
                >
                  {bidding ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Placing Bid...
                    </>
                  ) : (
                    <>
                      <Gavel className="w-4 h-4" />
                      Place Bid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center animate-fade-in-up">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bid Placed Successfully!</h3>
            <p className="text-gray-600">
              Your bid has been recorded. You'll be notified if you're outbid.
            </p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AuctionView;
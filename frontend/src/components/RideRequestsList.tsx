import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Users, MessageCircle, Check, XCircle, Car, User, Eye } from 'lucide-react';
import { RideRequest, FareOffer } from '../types';
import FareBargainingModal from './FareBargainingModal';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

interface RideRequestsListProps {
  className?: string;
}

const RideRequestsList: React.FC<RideRequestsListProps> = ({ className = '' }) => {
  const { user: authUser } = useAuth();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(null);
  const [showBargainingModal, setShowBargainingModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    offeredFare: 0,
    message: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch ride requests from API
      const response = await apiService.getRideRequests({ driverId: authUser?.id });
      setRequests(response.requests);
    } catch (error: any) {
      console.error('Error fetching ride requests:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch ride requests');
      // Fallback to empty array if API fails
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = async (request: RideRequest) => {
    if (offerForm.offeredFare <= 0) {
      toast.error('Please enter a valid fare amount');
      return;
    }

    try {
      // TODO: Submit offer via API
      const offer: FareOffer = {
        id: `offer-${Date.now()}`,
        requestId: request.id,
        driverId: 'current-driver-id', // This would come from auth context
        offeredFare: offerForm.offeredFare,
        message: offerForm.message,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update request to show it has an offer
      setRequests(prev => prev.map(req => 
        req.id === request.id 
          ? { ...req, offers: [...(req.offers || []), offer] }
          : req
      ));

      setOfferForm({ offeredFare: 0, message: '' });
      setSelectedRequest(null);
      
      toast.success('Offer submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeUntilDeparture = (dateString: string) => {
    const departure = new Date(dateString);
    const now = new Date();
    const diffMs = departure.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return 'Now';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ride Requests</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-6">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Requests Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              When riders request rides, they'll appear here for you to respond to.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {request.rider?.name || 'Rider'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.rider?.school || 'Student'} • ⭐ {request.rider?.rating || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getTimeUntilDeparture(request.departureTime)} until departure
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Route</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {request.origin} → {request.destination}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Departure</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatTime(request.departureTime)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Fare</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      ${request.maxFare.toFixed(2)} per person
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Passengers</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {request.passengers} passenger{request.passengers > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {request.message && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Message</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      "{request.message}"
                    </p>
                  </div>
                )}

                {/* Offer Form */}
                {selectedRequest?.id === request.id ? (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Make an Offer</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Your Fare Offer
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                          <input
                            type="number"
                            value={offerForm.offeredFare}
                            onChange={(e) => setOfferForm(prev => ({ ...prev, offeredFare: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            max={request.maxFare}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Maximum: ${request.maxFare.toFixed(2)} per person
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message (Optional)
                        </label>
                        <textarea
                          value={offerForm.message}
                          onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Add a message for the rider..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleSubmitOffer(request)}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Submit Offer</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setOfferForm({ offeredFare: 0, message: '' });
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Make Offer</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowBargainingModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement decline functionality
                        toast.success('Request declined');
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fare Bargaining Modal */}
      <FareBargainingModal
        isOpen={showBargainingModal}
        onClose={() => {
          setShowBargainingModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        user={null} // This would come from auth context
        onOfferSubmitted={(offer) => {
          toast.success('Offer submitted successfully!');
          setShowBargainingModal(false);
          setSelectedRequest(null);
        }}
        onOfferAccepted={(offer) => {
          toast.success('Offer accepted! Ride confirmed.');
          setShowBargainingModal(false);
          setSelectedRequest(null);
        }}
        onOfferDeclined={(offer) => {
          toast.success('Offer declined');
          setShowBargainingModal(false);
          setSelectedRequest(null);
        }}
        onCounterOfferSubmitted={(counterOffer) => {
          toast.success('Counter offer submitted!');
        }}
      />
    </div>
  );
};

export default RideRequestsList;

import React, { useState, useEffect } from 'react';
import { X, DollarSign, MessageCircle, Clock, User, Car, Check, XCircle, Send } from 'lucide-react';
import { RideRequest, FareOffer, CounterOffer, User as UserType } from '../types';
import toast from 'react-hot-toast';

interface FareBargainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RideRequest | null;
  user: UserType | null;
  onOfferSubmitted?: (offer: FareOffer) => void;
  onOfferAccepted?: (offer: FareOffer) => void;
  onOfferDeclined?: (offer: FareOffer) => void;
  onCounterOfferSubmitted?: (counterOffer: CounterOffer) => void;
}

const FareBargainingModal: React.FC<FareBargainingModalProps> = ({
  isOpen,
  onClose,
  request,
  user,
  onOfferSubmitted,
  onOfferAccepted,
  onOfferDeclined,
  onCounterOfferSubmitted
}) => {
  const [offers, setOffers] = useState<FareOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOffer, setNewOffer] = useState({
    offeredFare: 0,
    message: ''
  });
  const [counterOffer, setCounterOffer] = useState({
    counterFare: 0,
    message: ''
  });
  const [selectedOffer, setSelectedOffer] = useState<FareOffer | null>(null);

  useEffect(() => {
    if (isOpen && request) {
      // TODO: Fetch offers for this request
      // fetchOffers(request.id);
    }
  }, [isOpen, request]);

  const handleSubmitOffer = async () => {
    if (!request || !user || newOffer.offeredFare <= 0) {
      toast.error('Please enter a valid fare amount');
      return;
    }

    setLoading(true);
    try {
      // TODO: Submit offer via API
      const offer: FareOffer = {
        id: `offer-${Date.now()}`,
        requestId: request.id,
        driverId: user.id,
        offeredFare: newOffer.offeredFare,
        message: newOffer.message,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        driver: user
      };

      setOffers(prev => [...prev, offer]);
      setNewOffer({ offeredFare: 0, message: '' });
      
      if (onOfferSubmitted) {
        onOfferSubmitted(offer);
      }
      
      toast.success('Offer submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCounterOffer = async (offer: FareOffer) => {
    if (counterOffer.counterFare <= 0) {
      toast.error('Please enter a valid counter offer amount');
      return;
    }

    setLoading(true);
    try {
      // TODO: Submit counter offer via API
      const counterOfferData: CounterOffer = {
        id: `counter-${Date.now()}`,
        offerId: offer.id,
        fromUserId: user?.id || '',
        counterFare: counterOffer.counterFare,
        message: counterOffer.message,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fromUser: user || undefined
      };

      // Update offer status to COUNTERED
      setOffers(prev => prev.map(o => 
        o.id === offer.id 
          ? { ...o, status: 'COUNTERED' as const, counterOffers: [...(o.counterOffers || []), counterOfferData] }
          : o
      ));

      setCounterOffer({ counterFare: 0, message: '' });
      setSelectedOffer(null);
      
      if (onCounterOfferSubmitted) {
        onCounterOfferSubmitted(counterOfferData);
      }
      
      toast.success('Counter offer submitted!');
    } catch (error: any) {
      console.error('Error submitting counter offer:', error);
      toast.error('Failed to submit counter offer');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: FareOffer) => {
    setLoading(true);
    try {
      // TODO: Accept offer via API
      setOffers(prev => prev.map(o => 
        o.id === offer.id ? { ...o, status: 'ACCEPTED' as const } : o
      ));
      
      if (onOfferAccepted) {
        onOfferAccepted(offer);
      }
      
      toast.success('Offer accepted! Ride confirmed.');
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineOffer = async (offer: FareOffer) => {
    setLoading(true);
    try {
      // TODO: Decline offer via API
      setOffers(prev => prev.map(o => 
        o.id === offer.id ? { ...o, status: 'DECLINED' as const } : o
      ));
      
      if (onOfferDeclined) {
        onOfferDeclined(offer);
      }
      
      toast.success('Offer declined');
    } catch (error: any) {
      console.error('Error declining offer:', error);
      toast.error('Failed to decline offer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'ACCEPTED': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'DECLINED': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'COUNTERED': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fare Negotiation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {request.origin} → {request.destination}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Request Details */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Passengers</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {request.passengers} passenger{request.passengers > 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Message</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {request.message || 'No additional message'}
                </p>
              </div>
            </div>
          </div>

          {/* Offers List */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Driver Offers ({offers.length})
            </h3>

            {offers.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No offers yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Drivers will see your request and can make offers
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div key={offer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {offer.driver?.name || 'Driver'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {offer.driver?.school || 'Student'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${offer.offeredFare.toFixed(2)}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                          {offer.status}
                        </span>
                      </div>
                    </div>

                    {offer.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        "{offer.message}"
                      </p>
                    )}

                    {/* Counter Offers */}
                    {offer.counterOffers && offer.counterOffers.length > 0 && (
                      <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Counter Offers:</h4>
                        {offer.counterOffers.map((counter) => (
                          <div key={counter.id} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  ${counter.counterFare.toFixed(2)} from {counter.fromUser?.name || 'You'}
                                </p>
                                {counter.message && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    "{counter.message}"
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(counter.status)}`}>
                                {counter.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {offer.status === 'PENDING' && user?.role === 'RIDER' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAcceptOffer(offer)}
                          disabled={loading}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Counter</span>
                        </button>
                        <button
                          onClick={() => handleDeclineOffer(offer)}
                          disabled={loading}
                          className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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

          {/* Counter Offer Form */}
          {selectedOffer && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Make Counter Offer
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Counter Offer Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      value={counterOffer.counterFare}
                      onChange={(e) => setCounterOffer(prev => ({ ...prev, counterFare: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={counterOffer.message}
                    onChange={(e) => setCounterOffer(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Explain your counter offer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSubmitCounterOffer(selectedOffer)}
                    disabled={loading || counterOffer.counterFare <= 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Counter Offer</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOffer(null);
                      setCounterOffer({ counterFare: 0, message: '' });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FareBargainingModal;

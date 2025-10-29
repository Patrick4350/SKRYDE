import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Users, MessageCircle, Car, Star, Check, X, ArrowRightLeft } from 'lucide-react';
import { DriverWithDistance, Location } from '../types';
import apiService from '../services/api';
import { getNearbySimulatedDrivers } from '../services/driverSimulation';
import LocationInput from './LocationInput';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface EnhancedRideRequestFormProps {
  onRequestSent: (request: any) => void;
  onCancel: () => void;
  className?: string;
}

const EnhancedRideRequestForm: React.FC<EnhancedRideRequestFormProps> = ({ 
  onRequestSent, 
  onCancel, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'drivers' | 'bargain'>('form');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    passengers: '1',
    maxFare: '',
    message: '',
    originLatitude: '',
    originLongitude: '',
    destLatitude: '',
    destLongitude: ''
  });

  // Driver matching data
  const [nearbyDrivers, setNearbyDrivers] = useState<DriverWithDistance[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithDistance | null>(null);
  const [fareEstimate, setFareEstimate] = useState<any>(null);

  // Bargaining data
  const [bargainData, setBargainData] = useState({
    proposedFare: '',
    message: '',
    counterFare: '',
    counterMessage: ''
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setFormData(prev => ({
            ...prev,
            originLatitude: position.coords.latitude.toString(),
            originLongitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        }
      );
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find nearby drivers using simulation
      const drivers = await getNearbySimulatedDrivers(
        currentLocation?.latitude || parseFloat(formData.originLatitude),
        currentLocation?.longitude || parseFloat(formData.originLongitude),
        8
      );

      if (drivers.length === 0) {
        toast.error('No drivers available nearby. Please try again later.');
        setLoading(false);
        return;
      }

      setNearbyDrivers(drivers);
      setStep('drivers');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to find nearby drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = async (driver: DriverWithDistance) => {
    setSelectedDriver(driver);
    setLoading(true);

    try {
      // Calculate fare estimate
      const fareResponse = await apiService.calculateFare({
        origin: formData.origin,
        destination: formData.destination,
        driverId: driver.id,
        distance: driver.distance
      });

      setFareEstimate(fareResponse);
      setBargainData(prev => ({
        ...prev,
        proposedFare: fareResponse.estimatedFare.toString()
      }));
      setStep('bargain');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to calculate fare');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBargain = async () => {
    if (!selectedDriver || !fareEstimate) return;

    setLoading(true);
    try {
      // Create ride request
      const requestResponse = await apiService.createRideRequest({
        origin: formData.origin,
        destination: formData.destination,
        departureTime: formData.departureTime,
        passengers: parseInt(formData.passengers),
        maxFare: parseFloat(formData.maxFare),
        message: formData.message,
        originLatitude: parseFloat(formData.originLatitude),
        originLongitude: parseFloat(formData.originLongitude),
        destLatitude: parseFloat(formData.destLatitude),
        destLongitude: parseFloat(formData.destLongitude)
      });

      // Start fare negotiation
      const bargainResponse = await apiService.startBargain({
        requestId: requestResponse.request.id,
        driverId: selectedDriver.id,
        proposedFare: parseFloat(bargainData.proposedFare),
        message: bargainData.message
      });

      toast.success('Ride request sent! Driver will be notified.');
      onRequestSent(requestResponse.request);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send ride request');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!selectedDriver || !fareEstimate) return;

    setLoading(true);
    try {
      // This would be implemented with the actual ride ID from the bargain response
      // For now, we'll just show a success message
      toast.success('Counter offer sent!');
      setStep('drivers');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send counter offer');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'form') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Request a Ride</h2>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pickup Location
              </label>
              <LocationInput
                value={formData.origin}
                onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                onLocationSelect={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    origin: location.address,
                    originLatitude: location.lat.toString(),
                    originLongitude: location.lng.toString()
                  }));
                }}
                placeholder="Enter pickup location"
              />
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination
              </label>
              <LocationInput
                value={formData.destination}
                onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                onLocationSelect={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    destination: location.address,
                    destLatitude: location.lat.toString(),
                    destLongitude: location.lng.toString()
                  }));
                }}
                placeholder="Enter destination"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Departure Time
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="departureTime"
                  value={formData.departureTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Passengers
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="passengers"
                  min="1"
                  max="8"
                  value={formData.passengers}
                  onChange={(e) => setFormData(prev => ({ ...prev, passengers: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="maxFare" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Fare ($)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="maxFare"
                  step="0.01"
                  min="0"
                  value={formData.maxFare}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxFare: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message (Optional)
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageCircle className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="message"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Any special requests or notes for the driver..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding Drivers...' : 'Find Drivers'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'drivers') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Available Drivers</h2>
          <button
            onClick={() => setStep('form')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            ← Back to Form
          </button>
        </div>

        {nearbyDrivers.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Drivers Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No drivers are currently available within 8km of your location.
            </p>
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {nearbyDrivers.map((driver) => (
              <div
                key={driver.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => handleDriverSelect(driver)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{driver.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{driver.school}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{driver.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{driver.distance.toFixed(1)} km away</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Fare</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">$--</p>
                  </div>
                </div>
                {driver.vehicleInfo && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{driver.vehicleInfo}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 'bargain' && selectedDriver && fareEstimate) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fare Negotiation</h2>
          <button
            onClick={() => setStep('drivers')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            ← Back to Drivers
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Driver Details</h3>
          <p className="text-gray-700 dark:text-gray-300">{selectedDriver.name} • {selectedDriver.school}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Rating: {selectedDriver.rating.toFixed(1)} • {selectedDriver.distance.toFixed(1)} km away</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Fare Estimate</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700 dark:text-blue-300">Base Fare: ${fareEstimate.baseFare}</p>
              <p className="text-blue-700 dark:text-blue-300">Per KM: ${fareEstimate.perKmRate}</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300">Distance: {fareEstimate.distance} km</p>
              <p className="text-blue-700 dark:text-blue-300">Rating Factor: {fareEstimate.ratingMultiplier.toFixed(2)}x</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
              Estimated Total: ${fareEstimate.estimatedFare.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="proposedFare" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Proposed Fare ($)
            </label>
            <input
              type="number"
              id="proposedFare"
              step="0.01"
              min="0"
              value={bargainData.proposedFare}
              onChange={(e) => setBargainData(prev => ({ ...prev, proposedFare: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Enter your proposed fare"
            />
          </div>

          <div>
            <label htmlFor="bargainMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message to Driver (Optional)
            </label>
            <textarea
              id="bargainMessage"
              rows={3}
              value={bargainData.message}
              onChange={(e) => setBargainData(prev => ({ ...prev, message: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 'I can be ready in 10 minutes' or 'Is this fare negotiable?'"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleStartBargain}
            disabled={loading || !bargainData.proposedFare}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Request...' : 'Send Ride Request'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default EnhancedRideRequestForm;

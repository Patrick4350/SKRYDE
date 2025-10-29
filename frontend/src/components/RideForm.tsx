import React, { useState } from 'react';
import { Ride, Location } from '../types';
import apiService from '../services/api';
import { MapPin, Clock, DollarSign, Users, Calendar, Car } from 'lucide-react';
import toast from 'react-hot-toast';

interface RideFormProps {
  onRideCreated?: (ride: Ride) => void;
  onCancel?: () => void;
  className?: string;
}

const RideForm: React.FC<RideFormProps> = ({
  onRideCreated,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    seats: 1,
    fare: 0,
    originLatitude: '',
    originLongitude: '',
    destLatitude: '',
    destLongitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.departureTime) {
      newErrors.departureTime = 'Departure time is required';
    } else {
      const departure = new Date(formData.departureTime);
      if (departure <= new Date()) {
        newErrors.departureTime = 'Departure time must be in the future';
      }
    }
    if (formData.seats < 1 || formData.seats > 8) {
      newErrors.seats = 'Seats must be between 1 and 8';
    }
    if (formData.fare < 0) {
      newErrors.fare = 'Fare must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        departureTime: formData.departureTime,
        seats: Number(formData.seats),
        fare: Number(formData.fare),
        originLatitude: formData.originLatitude ? Number(formData.originLatitude) : undefined,
        originLongitude: formData.originLongitude ? Number(formData.originLongitude) : undefined,
        destLatitude: formData.destLatitude ? Number(formData.destLatitude) : undefined,
        destLongitude: formData.destLongitude ? Number(formData.destLongitude) : undefined
      };

      const response = await apiService.createRide(rideData);
      toast.success('Ride created successfully!');
      
      if (onRideCreated) {
        onRideCreated(response.ride);
      }
      
      // Reset form
      setFormData({
        origin: '',
        destination: '',
        departureTime: '',
        seats: 1,
        fare: 0,
        originLatitude: '',
        originLongitude: '',
        destLatitude: '',
        destLongitude: ''
      });
    } catch (error: any) {
      console.error('Error creating ride:', error);
      const message = error.response?.data?.message || 'Failed to create ride';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            originLatitude: position.coords.latitude.toString(),
            originLongitude: position.coords.longitude.toString()
          }));
          toast.success('Current location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Car className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Post a New Ride</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Origin
              </label>
              <input
                type="text"
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="Where are you starting from?"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.origin ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.origin && (
                <p className="mt-1 text-sm text-red-600">{errors.origin}</p>
              )}
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Destination
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="Where are you going?"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.destination ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
              )}
            </div>
          </div>

          {/* Departure Time */}
          <div>
            <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Departure Time
            </label>
            <input
              type="datetime-local"
              id="departureTime"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.departureTime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.departureTime && (
              <p className="mt-1 text-sm text-red-600">{errors.departureTime}</p>
            )}
          </div>

          {/* Seats and Fare */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Available Seats
              </label>
              <select
                id="seats"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.seats ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
                ))}
              </select>
              {errors.seats && (
                <p className="mt-1 text-sm text-red-600">{errors.seats}</p>
              )}
            </div>

            <div>
              <label htmlFor="fare" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Fare per Person
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="fare"
                  name="fare"
                  value={formData.fare}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.fare ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.fare && (
                <p className="mt-1 text-sm text-red-600">{errors.fare}</p>
              )}
            </div>
          </div>

          {/* Location Coordinates (Optional) */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Location Coordinates (Optional)</h3>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Use Current Location
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Origin Latitude</label>
                <input
                  type="number"
                  name="originLatitude"
                  value={formData.originLatitude}
                  onChange={handleChange}
                  placeholder="e.g., 40.7128"
                  step="any"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Origin Longitude</label>
                <input
                  type="number"
                  name="originLongitude"
                  value={formData.originLongitude}
                  onChange={handleChange}
                  placeholder="e.g., -74.0060"
                  step="any"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Destination Latitude</label>
                <input
                  type="number"
                  name="destLatitude"
                  value={formData.destLatitude}
                  onChange={handleChange}
                  placeholder="e.g., 40.7589"
                  step="any"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Destination Longitude</label>
                <input
                  type="number"
                  name="destLongitude"
                  value={formData.destLongitude}
                  onChange={handleChange}
                  placeholder="e.g., -73.9851"
                  step="any"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Adding coordinates helps riders find your ride more easily on the map
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Post Ride'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RideForm;

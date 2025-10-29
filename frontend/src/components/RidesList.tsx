import React, { useState, useEffect } from 'react';
import { Ride, Location } from '../types';
import apiService from '../services/api';
import { MapPin, Clock, DollarSign, Users, Star, Car, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface RidesListProps {
  currentLocation?: Location;
  onRideSelect?: (ride: Ride) => void;
  className?: string;
}

const RidesList: React.FC<RidesListProps> = ({
  currentLocation,
  onRideSelect,
  className = ''
}) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minFare: '',
    maxFare: '',
    seats: '',
    departureDate: '',
    radius: '10'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchRides = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pagination.limit
      };

      // Add filters
      if (filters.origin) params.origin = filters.origin;
      if (filters.destination) params.destination = filters.destination;
      if (filters.minFare) params.minFare = Number(filters.minFare);
      if (filters.maxFare) params.maxFare = Number(filters.maxFare);
      if (filters.seats) params.seats = Number(filters.seats);
      if (filters.departureDate) params.departureDate = filters.departureDate;
      if (filters.radius) params.radius = Number(filters.radius);

      // Add location if available
      if (currentLocation) {
        params.latitude = currentLocation.latitude;
        params.longitude = currentLocation.longitude;
      }

      const response = await apiService.getRidesWithFilters(params);
      setRides(response.rides);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [currentLocation, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      minFare: '',
      maxFare: '',
      seats: '',
      departureDate: '',
      radius: '10'
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const handleRideClick = (ride: Ride) => {
    if (onRideSelect) {
      onRideSelect(ride);
    }
  };

  const loadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchRides(pagination.page + 1);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Available Rides</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => fetchRides()}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin
                </label>
                <input
                  type="text"
                  value={filters.origin}
                  onChange={(e) => handleFilterChange('origin', e.target.value)}
                  placeholder="From..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={filters.destination}
                  onChange={(e) => handleFilterChange('destination', e.target.value)}
                  placeholder="To..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Fare
                </label>
                <input
                  type="number"
                  value={filters.minFare}
                  onChange={(e) => handleFilterChange('minFare', e.target.value)}
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Fare
                </label>
                <input
                  type="number"
                  value={filters.maxFare}
                  onChange={(e) => handleFilterChange('maxFare', e.target.value)}
                  placeholder="$50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seats Needed
                </label>
                <input
                  type="number"
                  value={filters.seats}
                  onChange={(e) => handleFilterChange('seats', e.target.value)}
                  placeholder="1"
                  min="1"
                  max="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={filters.departureDate}
                  onChange={(e) => handleFilterChange('departureDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Radius:</label>
                <select
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="50">50 km</option>
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rides List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rides...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="p-8 text-center">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rides found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rides.map((ride) => (
              <div
                key={ride.id}
                onClick={() => handleRideClick(ride)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {ride.origin} → {ride.destination}
                      </span>
                      {ride.distance && (
                        <span className="text-xs text-gray-500">
                          {formatDistance(ride.distance)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(ride.departureTime)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{formatDate(ride.departureTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium text-green-600">${ride.fare}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{ride.seats} seats</span>
                      </div>
                    </div>

                    {ride.driver && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm text-gray-600">
                            {ride.driver.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm text-gray-600">{ride.driver.name}</span>
                        {ride.driver.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      ${ride.fare}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ride._count?.requests || 0} requests
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {pagination.page < pagination.pages && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-2 px-4 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : `Load More (${pagination.total - rides.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default RidesList;

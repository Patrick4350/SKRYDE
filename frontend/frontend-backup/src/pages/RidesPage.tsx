import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  Filter, 
  Search, 
  Calendar,
  Car,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageCircle
} from 'lucide-react';
import apiService from '../services/api';
import { Ride, RideRequest, FareOffer } from '../types';
import toast from 'react-hot-toast';

const RidesPage: React.FC = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'requests' | 'offers'>('history');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: ''
  });

  useEffect(() => {
    fetchRideData();
  }, []);

  const fetchRideData = async () => {
    setLoading(true);
    try {
      // TODO: Fetch rides, requests, and offers from API
      // const [ridesResponse, requestsResponse] = await Promise.all([
      //   apiService.getProfileRides(),
      //   apiService.getRideRequests()
      // ]);
      
      // Mock data for now
      const mockRides: Ride[] = [
        {
          id: 'ride-1',
          driverId: 'driver-1',
          origin: 'Campus Library',
          destination: 'Downtown Mall',
          departureTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          seats: 4,
          fare: 12,
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          driver: {
            id: 'driver-1',
            name: 'John Smith',
            email: 'john@university.edu',
            school: 'University of Example',
            role: 'DRIVER',
            roleType: 'Student',
            verified: true,
            rating: 4.9,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        {
          id: 'ride-2',
          driverId: 'driver-2',
          origin: 'Student Center',
          destination: 'Airport',
          departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          seats: 3,
          fare: 20,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          driver: {
            id: 'driver-2',
            name: 'Sarah Johnson',
            email: 'sarah@university.edu',
            school: 'University of Example',
            role: 'DRIVER',
            roleType: 'Student',
            verified: true,
            rating: 4.7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      ];

      const mockRequests: RideRequest[] = [
        {
          id: 'req-1',
          riderId: 'rider-1',
          origin: 'Campus Library',
          destination: 'Shopping Center',
          departureTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          maxFare: 15,
          passengers: 2,
          message: 'Need a ride for shopping',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          rider: {
            id: 'rider-1',
            name: 'Mike Chen',
            email: 'mike@university.edu',
            school: 'University of Example',
            role: 'RIDER',
            roleType: 'Student',
            verified: true,
            rating: 4.6,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      ];

      setRides(mockRides);
      setRequests(mockRequests);
    } catch (error: any) {
      console.error('Error fetching ride data:', error);
      toast.error('Failed to fetch ride data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ACTIVE':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'DECLINED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'ACCEPTED':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'ACTIVE':
      case 'PENDING':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'CANCELLED':
      case 'DECLINED':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const filteredRides = rides.filter(ride => {
    if (filters.status !== 'all' && ride.status !== filters.status) return false;
    if (filters.search && !ride.origin.toLowerCase().includes(filters.search.toLowerCase()) && 
        !ride.destination.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = requests.filter(request => {
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    if (filters.search && !request.origin.toLowerCase().includes(filters.search.toLowerCase()) && 
        !request.destination.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
          Ride History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-300">
          View your ride history, requests, and offers
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'history', name: 'Ride History', icon: Car, count: rides.length },
              { id: 'requests', name: user?.role === 'RIDER' ? 'My Requests' : 'Incoming Requests', icon: MessageCircle, count: requests.length },
              { id: 'offers', name: 'Offers', icon: DollarSign, count: 0 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rides..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {filteredRides.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Rides Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filters.search ? 'No rides match your search criteria.' : 'You haven\'t taken any rides yet.'}
              </p>
            </div>
          ) : (
            filteredRides.map((ride) => (
              <div key={ride.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {ride.driver?.name || 'Driver'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ride.driver?.school || 'Student'} • ⭐ {ride.driver?.rating || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ride.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                      {ride.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Route</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {ride.origin} → {ride.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Departure</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatTime(ride.departureTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fare</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        ${ride.fare.toFixed(2)} per person
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {ride.seats} seat{ride.seats > 1 ? 's' : ''} available
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(ride.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Requests Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filters.search ? 'No requests match your search criteria.' : 'No ride requests found.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
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
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Route</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {request.origin} → {request.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Departure</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatTime(request.departureTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Max Fare</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        ${request.maxFare.toFixed(2)} per person
                      </p>
                    </div>
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {request.passengers} passenger{request.passengers > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(request.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Offers Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Offers and counter-offers will appear here when you negotiate fares.
          </p>
        </div>
      )}
    </div>
  );
};

export default RidesPage;
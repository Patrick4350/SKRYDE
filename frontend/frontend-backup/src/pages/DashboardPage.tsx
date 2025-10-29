import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Car, MapPin, Users, Star, Plus, Search, Map, Filter } from 'lucide-react';
import apiService from '../services/api';
import { Ride, Location, ProfileStats } from '../types';
import MapView from '../components/MapView';
import RidesList from '../components/RidesList';
import RideRequestForm from '../components/RideRequestForm';
import RideRequestsList from '../components/RideRequestsList';
import EnhancedRideRequestForm from '../components/EnhancedRideRequestForm';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'rides' | 'requests'>('overview');
  const [showRideForm, setShowRideForm] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    getCurrentLocation();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ridesResponse, statsResponse] = await Promise.all([
        apiService.getRidesWithFilters({ limit: 5 }),
        apiService.getProfileStats()
      ]);
      
      setRecentRides(ridesResponse.rides);
      setStats(statsResponse.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Don't show error toast for location, just use default
        }
      );
    }
  };

  const handleRideCreated = (ride: Ride) => {
    setShowRideForm(false);
    setActiveTab('overview');
    fetchDashboardData(); // Refresh data
    toast.success('Ride posted successfully!');
  };

  const handleRideSelect = (ride: Ride) => {
    // Handle ride selection - could open a modal or navigate to ride details
    console.log('Selected ride:', ride);
  };

  const handleLocationChange = (location: Location) => {
    setCurrentLocation(location);
  };

  const dashboardStats = [
    {
      name: 'Total Rides',
      value: stats ? (stats.totalRidesAsDriver + stats.totalRidesAsRider).toString() : '0',
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Rating',
      value: stats ? stats.averageRating.toFixed(1) : '0.0',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Completed Rides',
      value: stats ? stats.completedRides.toString() : '0',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: user?.role === 'DRIVER' ? 'Total Earnings' : 'Reviews Received',
      value: user?.role === 'DRIVER' 
        ? `$${stats?.totalEarnings.toFixed(0) || '0'}` 
        : stats?.recentReviews.length.toString() || '0',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 transition-colors duration-300">
          {user?.role === 'DRIVER' 
            ? 'Ready to help fellow students get around?' 
            : 'Find your next ride with fellow students'
          }
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 sm:mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex flex-wrap gap-2 sm:gap-4 lg:gap-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: Car, shortName: 'Home' },
              { id: 'map', name: 'Map View', icon: Map, shortName: 'Map' },
              { id: 'rides', name: 'Browse Rides', icon: Search, shortName: 'Rides' },
              { id: 'requests', name: user?.role === 'DRIVER' ? 'My Requests' : 'Request Ride', icon: Plus, shortName: user?.role === 'DRIVER' ? 'Requests' : 'Request' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.shortName}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 transition-all duration-300 hover:shadow-md hover:scale-105">
                  <div className="flex items-center">
                    <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                    </div>
                    <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.name}</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Rides */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 transition-all duration-300">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Rides</h2>
                <button 
                  onClick={() => setActiveTab('rides')}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  View all
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentRides.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentRides.map((ride) => (
                    <div key={ride.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                          {ride.origin} → {ride.destination}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {new Date(ride.departureTime).toLocaleDateString()} at{' '}
                          {new Date(ride.departureTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:text-right mt-2 sm:mt-0 sm:ml-4">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">${ride.fare}</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-4 sm:ml-0">{ride.seats} seats</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No recent rides found</p>
                  <button 
                    onClick={() => setActiveTab('rides')}
                    className="mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                  >
                    Browse rides
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button 
                  onClick={() => setActiveTab('map')}
                  className="flex items-center justify-between p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 bg-primary-600 rounded-lg">
                      <Map className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">View Map</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">See nearby drivers and rides</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('rides')}
                  className="flex items-center justify-between p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Find Rides</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Browse available rides</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('requests')}
                  className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 transform hover:scale-105 active:scale-95 sm:col-span-2"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {user?.role === 'DRIVER' ? 'Manage Requests' : 'Request Ride'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {user?.role === 'DRIVER' ? 'View and respond to ride requests' : 'Request a ride from nearby drivers'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'map' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Live Map View</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              See nearby drivers and available rides in real-time
            </p>
          </div>
          <div className="h-64 sm:h-80 lg:h-96">
            <MapView
              center={currentLocation || undefined}
              showDrivers={true}
              showRides={true}
              radius={10}
              onLocationChange={handleLocationChange}
              className="h-full"
            />
          </div>
        </div>
      )}

      {activeTab === 'rides' && (
        <RidesList
          currentLocation={currentLocation || undefined}
          onRideSelect={handleRideSelect}
          className="h-full"
        />
      )}

      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user?.role === 'DRIVER' ? 'Ride Requests' : 'Request a Ride'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user?.role === 'DRIVER' 
                ? 'Manage incoming ride requests from riders' 
                : 'Request a ride from nearby drivers'
              }
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {user?.role === 'DRIVER' ? (
              <RideRequestsList className="h-full" />
            ) : (
              <EnhancedRideRequestForm
                onRequestSent={(request) => {
                  toast.success('Ride request sent! Drivers will be notified.');
                  setActiveTab('overview');
                }}
                onCancel={() => setActiveTab('overview')}
                className="max-w-4xl mx-auto"
              />
            )}
          </div>
        </div>
      )}

      {/* Verification Banner */}
      {!user?.verified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-xl p-4 sm:p-6 mt-6 sm:mt-8 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-800 dark:text-yellow-200">Account Verification Pending</h3>
              <p className="text-sm sm:text-base text-yellow-700 dark:text-yellow-300">
                Your account is pending verification. You'll be able to use all features once verified.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

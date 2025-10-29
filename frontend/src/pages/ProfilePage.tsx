import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X, MapPin, Car, Star, Calendar, DollarSign, Users, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { User as UserType, ProfileStats, Ride } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    school: '',
    vehicleInfo: '',
    licensePlate: '',
    currentLatitude: '',
    currentLongitude: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profileResponse, statsResponse, ridesResponse] = await Promise.all([
        apiService.getProfile(),
        apiService.getProfileStats(),
        apiService.getProfileRides({ limit: 5 })
      ]);

      setUser(profileResponse.user);
      setStats(statsResponse.stats);
      setRecentRides(ridesResponse.rides);
      
      // Initialize edit form
      setEditForm({
        name: profileResponse.user.name,
        school: profileResponse.user.school,
        vehicleInfo: profileResponse.user.vehicleInfo || '',
        licensePlate: profileResponse.user.licensePlate || '',
        currentLatitude: profileResponse.user.currentLatitude?.toString() || '',
        currentLongitude: profileResponse.user.currentLongitude?.toString() || ''
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form to original values
    if (user) {
      setEditForm({
        name: user.name,
        school: user.school,
        vehicleInfo: user.vehicleInfo || '',
        licensePlate: user.licensePlate || '',
        currentLatitude: user.currentLatitude?.toString() || '',
        currentLongitude: user.currentLongitude?.toString() || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const updateData: any = {
        name: editForm.name,
        school: editForm.school,
        vehicleInfo: editForm.vehicleInfo,
        licensePlate: editForm.licensePlate
      };

      // Add coordinates if provided
      if (editForm.currentLatitude && editForm.currentLongitude) {
        updateData.currentLatitude = Number(editForm.currentLatitude);
        updateData.currentLongitude = Number(editForm.currentLongitude);
      }

      const response = await apiService.updateProfile(updateData);
      setUser(response.user);
      updateUser(response.user);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await apiService.deleteAccount();
        toast.success('Account deleted successfully');
        // Redirect to login will be handled by the auth interceptor
      } catch (error: any) {
        console.error('Error deleting account:', error);
        const message = error.response?.data?.message || 'Failed to delete account';
        toast.error(message);
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditForm(prev => ({
            ...prev,
            currentLatitude: position.coords.latitude.toString(),
            currentLongitude: position.coords.longitude.toString()
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-all duration-300">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{user.school}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.verified 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                }`}>
                  {user.verified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full">
                  {user.role}
                </span>
                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 rounded-full">
                  {user.roleType}
                </span>
              </div>
            </div>

            {/* Profile Stats */}
            {stats && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Rating</span>
                  </div>
                  <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Rides as Driver</span>
                  </div>
                  <span className="font-semibold">{stats.totalRidesAsDriver}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Rides as Rider</span>
                  </div>
                  <span className="font-semibold">{stats.totalRidesAsRider}</span>
                </div>
                {user.role === 'DRIVER' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Total Earnings</span>
                    </div>
                    <span className="font-semibold">${stats.totalEarnings.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {editing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
              
              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-all duration-300">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Profile Information</h2>
            
            {editing ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      School
                    </label>
                    <input
                      type="text"
                      value={editForm.school}
                      onChange={(e) => setEditForm(prev => ({ ...prev, school: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {user.role === 'DRIVER' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vehicle Information
                      </label>
                      <input
                        type="text"
                        value={editForm.vehicleInfo}
                        onChange={(e) => setEditForm(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                        placeholder="e.g., 2020 Honda Civic"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        License Plate
                      </label>
                      <input
                        type="text"
                        value={editForm.licensePlate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                        placeholder="e.g., ABC-123"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Location (Optional)</h3>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      Use Current Location
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Latitude</label>
                      <input
                        type="number"
                        value={editForm.currentLatitude}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currentLatitude: e.target.value }))}
                        placeholder="e.g., 40.7128"
                        step="any"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Longitude</label>
                      <input
                        type="number"
                        value={editForm.currentLongitude}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currentLongitude: e.target.value }))}
                        placeholder="e.g., -74.0060"
                        step="any"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email</h3>
                    <p className="text-gray-900 dark:text-gray-100 break-all">{user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Role</h3>
                    <p className="text-gray-900 dark:text-gray-100 capitalize">{user.role}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Member Since</h3>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Last Updated</h3>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>

                {user.role === 'DRIVER' && (user.vehicleInfo || user.licensePlate) && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {user.vehicleInfo && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle</h4>
                          <p className="text-gray-900 dark:text-gray-100">{user.vehicleInfo}</p>
                        </div>
                      )}
                      {user.licensePlate && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">License Plate</h4>
                          <p className="text-gray-900 dark:text-gray-100">{user.licensePlate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {user.currentLatitude && user.currentLongitude && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Current Location</h3>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        {user.currentLatitude.toFixed(4)}, {user.currentLongitude.toFixed(4)}
                      </span>
                    </div>
                    {user.lastLocationUpdate && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Last updated: {formatDate(user.lastLocationUpdate)} at {formatTime(user.lastLocationUpdate)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Rides */}
          {recentRides.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mt-4 sm:mt-6 transition-all duration-300">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Recent Rides</h2>
              <div className="space-y-3 sm:space-y-4">
                {recentRides.map((ride) => (
                  <div key={ride.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                            {ride.origin} → {ride.destination}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(ride.departureTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(ride.departureTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>${ride.fare}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{ride.seats} seats</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end sm:justify-start">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ride.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                          ride.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                          'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        }`}>
                          {ride.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

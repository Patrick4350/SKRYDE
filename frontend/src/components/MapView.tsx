import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapData, DriverWithDistance, RideWithDistance, Location } from '../types';
import apiService from '../services/api';
import { getNearbySimulatedDrivers, updateDriverPositions } from '../services/driverSimulation';
import { Car, MapPin, Clock, DollarSign, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

interface MapViewProps {
  center?: Location;
  zoom?: number;
  showDrivers?: boolean;
  showRides?: boolean;
  radius?: number;
  onLocationChange?: (location: Location) => void;
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 13,
  showDrivers = true,
  showRides = true,
  radius = 5,
  onLocationChange,
  className = ''
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(center || null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithDistance | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideWithDistance | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLocationPermission(true);
          if (onLocationChange) {
            onLocationChange(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission(false);
          toast.error('Unable to get your location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      setLocationPermission(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  }, [onLocationChange]);

  // Fetch map data (drivers and rides)
  const fetchMapData = useCallback(async (location: Location) => {
    if (!location) return;

    setLoading(true);
    try {
      // Use simulated drivers for development
      const drivers = await getNearbySimulatedDrivers(
        location.latitude,
        location.longitude,
        radius
      );

      // Create mock map data
      const data: MapData = {
        drivers,
        rides: [], // We'll add simulated rides later if needed
        center: location,
        radius,
        timestamp: new Date().toISOString()
      };

      setMapData(data);
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [radius, showRides]);

  // Update location heartbeat
  const updateLocationHeartbeat = useCallback(async (location: Location) => {
    try {
      await apiService.updateLocation(location.latitude, location.longitude);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, []);

  // Initialize location and map data
  useEffect(() => {
    if (center) {
      setCurrentLocation(center);
      fetchMapData(center);
    } else {
      getCurrentLocation();
    }
  }, [center, getCurrentLocation, fetchMapData]);

  // Update map data when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchMapData(currentLocation);
      updateLocationHeartbeat(currentLocation);
    }
  }, [currentLocation, fetchMapData, updateLocationHeartbeat]);

  // Update driver positions periodically to simulate movement
  useEffect(() => {
    if (!mapData?.drivers) return;

    const interval = setInterval(() => {
      setMapData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          drivers: updateDriverPositions(prev.drivers)
        };
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [mapData?.drivers]);

  // Set up location tracking
  useEffect(() => {
    if (!currentLocation) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            
            // Only update if location changed significantly (more than 50 meters)
            const distance = Math.sqrt(
              Math.pow(newLocation.latitude - currentLocation.latitude, 2) +
              Math.pow(newLocation.longitude - currentLocation.longitude, 2)
            ) * 111000; // Rough conversion to meters

            if (distance > 50) {
              setCurrentLocation(newLocation);
              if (onLocationChange) {
                onLocationChange(newLocation);
              }
            }
          },
          (error) => {
            console.error('Error updating location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 30000, // 30 seconds
          }
        );
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentLocation, onLocationChange]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const location = {
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      };
      setCurrentLocation(location);
      if (onLocationChange) {
        onLocationChange(location);
      }
    }
  }, [onLocationChange]);

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load map</p>
          <p className="text-sm text-gray-500 mt-2">Please check your Google Maps API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : defaultCenter}
        zoom={zoom}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Current user location marker */}
        {currentLocation && (
          <Marker
            position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
            }}
            title="Your location"
          />
        )}

        {/* Driver markers */}
        {showDrivers && mapData?.drivers.map((driver) => (
          <Marker
            key={driver.id}
            position={{ lat: driver.currentLatitude!, lng: driver.currentLongitude! }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="3"/>
                  <path d="M12 16L15 19L20 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
            }}
            onClick={() => setSelectedDriver(driver)}
            title={`${driver.name} - ${formatDistance(driver.distance)} away`}
          />
        ))}

        {/* Ride markers */}
        {showRides && mapData?.rides.map((ride) => (
          <Marker
            key={ride.id}
            position={{ 
              lat: ride.originLatitude || ride.driver?.currentLatitude || 0, 
              lng: ride.originLongitude || ride.driver?.currentLongitude || 0 
            }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="10" fill="#F59E0B" stroke="white" stroke-width="2"/>
                  <path d="M8 14L11 17L16 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(28, 28),
            }}
            onClick={() => setSelectedRide(ride)}
            title={`Ride to ${ride.destination} - $${ride.fare}`}
          />
        ))}

        {/* Driver info window */}
        {selectedDriver && (
          <InfoWindow
            position={{ lat: selectedDriver.currentLatitude!, lng: selectedDriver.currentLongitude! }}
            onCloseClick={() => setSelectedDriver(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center space-x-2 mb-2">
                <Car className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900">{selectedDriver.name}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Verified
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">★</span>
                  <span>{selectedDriver.rating.toFixed(1)} rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span>{formatDistance(selectedDriver.distance)} away</span>
                </div>
                {selectedDriver.vehicleInfo && (
                  <div className="text-xs text-gray-500">
                    {selectedDriver.vehicleInfo}
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Ride info window */}
        {selectedRide && (
          <InfoWindow
            position={{ 
              lat: selectedRide.originLatitude || selectedRide.driver?.currentLatitude || 0, 
              lng: selectedRide.originLongitude || selectedRide.driver?.currentLongitude || 0 
            }}
            onCloseClick={() => setSelectedRide(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center space-x-2 mb-2">
                <Car className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-gray-900">Available Ride</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedRide.origin} → {selectedRide.destination}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(selectedRide.departureTime)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3 h-3" />
                  <span>${selectedRide.fare}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3" />
                  <span>{selectedRide.seats} seats available</span>
                </div>
                {selectedRide.driver && (
                  <div className="text-xs text-gray-500 mt-1">
                    Driver: {selectedRide.driver.name} ({selectedRide.driver.rating.toFixed(1)}★)
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Updating map...</p>
          </div>
        </div>
      )}

      {/* Location permission status */}
      {locationPermission === false && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
          Location access denied. Click on the map to set your location.
        </div>
      )}
    </div>
  );
};

export default MapView;

/**
 * Geo utility functions for distance calculations and location operations
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationWithDistance extends Location {
  distance: number; // in kilometers
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearby locations within a specified radius
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param locations Array of locations to search
 * @param radiusKm Radius in kilometers
 * @returns Array of locations with distance information
 */
export function findNearbyLocations(
  centerLat: number,
  centerLon: number,
  locations: Location[],
  radiusKm: number
): LocationWithDistance[] {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(centerLat, centerLon, location.latitude, location.longitude)
    }))
    .filter(location => location.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Validate if coordinates are within reasonable bounds
 * @param latitude Latitude to validate
 * @param longitude Longitude to validate
 * @returns True if coordinates are valid
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Calculate bounding box for a given center point and radius
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusKm / 111; // Approximate degrees per km for latitude
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(centerLat))); // Adjust for longitude
  
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta
  };
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Calculate estimated travel time based on distance
 * @param distanceKm Distance in kilometers
 * @param avgSpeedKmh Average speed in km/h (default: 30 for city driving)
 * @returns Estimated travel time in minutes
 */
export function calculateTravelTime(
  distanceKm: number,
  avgSpeedKmh: number = 30
): number {
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}

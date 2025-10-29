import { DriverWithDistance } from '../types';

// Simulated driver data for development
const SIMULATED_DRIVERS = [
  {
    id: 'sim-driver-1',
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    school: 'University of Example',
    role: 'DRIVER' as const,
    roleType: 'Student' as const,
    verified: true,
    rating: 4.8,
    vehicleInfo: '2020 Honda Civic',
    licensePlate: 'ABC-123',
    currentLatitude: 40.7128,
    currentLongitude: -74.0060,
    lastLocationUpdate: new Date().toISOString(),
    distance: 0.5,
    estimatedArrival: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sim-driver-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@university.edu',
    school: 'University of Example',
    role: 'DRIVER' as const,
    roleType: 'Student' as const,
    verified: true,
    rating: 4.9,
    vehicleInfo: '2019 Toyota Camry',
    licensePlate: 'XYZ-789',
    currentLatitude: 40.7589,
    currentLongitude: -73.9851,
    lastLocationUpdate: new Date().toISOString(),
    distance: 1.2,
    estimatedArrival: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sim-driver-3',
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@university.edu',
    school: 'University of Example',
    role: 'DRIVER' as const,
    roleType: 'Faculty' as const,
    verified: true,
    rating: 4.7,
    vehicleInfo: '2021 Nissan Altima',
    licensePlate: 'DEF-456',
    currentLatitude: 40.6892,
    currentLongitude: -74.0445,
    lastLocationUpdate: new Date().toISOString(),
    distance: 0.8,
    estimatedArrival: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sim-driver-4',
    name: 'Emma Wilson',
    email: 'emma.wilson@university.edu',
    school: 'University of Example',
    role: 'DRIVER' as const,
    roleType: 'Student' as const,
    verified: true,
    rating: 4.6,
    vehicleInfo: '2018 Ford Focus',
    licensePlate: 'GHI-789',
    currentLatitude: 40.7505,
    currentLongitude: -73.9934,
    lastLocationUpdate: new Date().toISOString(),
    distance: 1.5,
    estimatedArrival: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sim-driver-5',
    name: 'David Kim',
    email: 'david.kim@university.edu',
    school: 'University of Example',
    role: 'DRIVER' as const,
    roleType: 'Student' as const,
    verified: true,
    rating: 4.9,
    vehicleInfo: '2022 Hyundai Elantra',
    licensePlate: 'JKL-012',
    currentLatitude: 40.7282,
    currentLongitude: -73.7949,
    lastLocationUpdate: new Date().toISOString(),
    distance: 2.1,
    estimatedArrival: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Generate random drivers around a given location
export const generateSimulatedDrivers = (
  userLat: number,
  userLng: number,
  radiusKm: number = 5
): DriverWithDistance[] => {
  const drivers: DriverWithDistance[] = [];
  
  // Generate 3-8 random drivers within the radius
  const numDrivers = Math.floor(Math.random() * 6) + 3;
  
  for (let i = 0; i < numDrivers; i++) {
    // Generate random offset within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert km to degrees (rough approximation)
    const latOffset = (distance / 111) * Math.cos(angle);
    const lngOffset = (distance / (111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle);
    
    const driverLat = userLat + latOffset;
    const driverLng = userLng + lngOffset;
    
    // Pick a random base driver and modify it
    const baseDriver = SIMULATED_DRIVERS[i % SIMULATED_DRIVERS.length];
    
    drivers.push({
      ...baseDriver,
      id: `sim-driver-${Date.now()}-${i}`,
      currentLatitude: driverLat,
      currentLongitude: driverLng,
      distance: distance,
      estimatedArrival: Math.floor(distance * 2) + 2, // Rough estimate: 2 min per km + 2 min base
      lastLocationUpdate: new Date(Date.now() - Math.random() * 300000).toISOString(), // Random time within last 5 minutes
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(), // Random time within last 30 days
      updatedAt: new Date().toISOString()
    });
  }
  
  // Sort by distance
  return drivers.sort((a, b) => a.distance - b.distance);
};

// Get drivers within a specific radius
export const getNearbySimulatedDrivers = (
  userLat: number,
  userLng: number,
  radiusKm: number = 5
): Promise<DriverWithDistance[]> => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      const drivers = generateSimulatedDrivers(userLat, userLng, radiusKm);
      resolve(drivers);
    }, 500 + Math.random() * 1000); // 0.5-1.5 second delay
  });
};

// Update driver positions (simulate movement)
export const updateDriverPositions = (drivers: DriverWithDistance[]): DriverWithDistance[] => {
  return drivers.map(driver => {
    // Add small random movement
    const latOffset = (Math.random() - 0.5) * 0.001; // ~100m movement
    const lngOffset = (Math.random() - 0.5) * 0.001;
    
    return {
      ...driver,
      currentLatitude: (driver.currentLatitude || 0) + latOffset,
      currentLongitude: (driver.currentLongitude || 0) + lngOffset,
      lastLocationUpdate: new Date().toISOString()
    };
  });
};

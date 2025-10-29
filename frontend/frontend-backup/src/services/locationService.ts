// Location suggestion service using Google Places API
export interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Mock location suggestions for development (when Google Places API is not available)
const MOCK_SUGGESTIONS: LocationSuggestion[] = [
  {
    place_id: 'mock-1',
    description: 'Times Square, New York, NY, USA',
    main_text: 'Times Square',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7580,
        lng: -73.9855
      }
    }
  },
  {
    place_id: 'mock-2',
    description: 'Central Park, New York, NY, USA',
    main_text: 'Central Park',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7829,
        lng: -73.9654
      }
    }
  },
  {
    place_id: 'mock-3',
    description: 'Brooklyn Bridge, New York, NY, USA',
    main_text: 'Brooklyn Bridge',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7061,
        lng: -73.9969
      }
    }
  },
  {
    place_id: 'mock-4',
    description: 'Empire State Building, New York, NY, USA',
    main_text: 'Empire State Building',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7484,
        lng: -73.9857
      }
    }
  },
  {
    place_id: 'mock-5',
    description: 'Statue of Liberty, New York, NY, USA',
    main_text: 'Statue of Liberty',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.6892,
        lng: -74.0445
      }
    }
  },
  {
    place_id: 'mock-6',
    description: 'Wall Street, New York, NY, USA',
    main_text: 'Wall Street',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7074,
        lng: -74.0113
      }
    }
  },
  {
    place_id: 'mock-7',
    description: 'Madison Square Garden, New York, NY, USA',
    main_text: 'Madison Square Garden',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7505,
        lng: -73.9934
      }
    }
  },
  {
    place_id: 'mock-8',
    description: 'High Line, New York, NY, USA',
    main_text: 'High Line',
    secondary_text: 'New York, NY, USA',
    geometry: {
      location: {
        lat: 40.7480,
        lng: -74.0048
      }
    }
  }
];

// Get location suggestions based on input
export const getLocationSuggestions = async (
  input: string,
  apiKey?: string
): Promise<LocationSuggestion[]> => {
  if (!input || input.length < 2) {
    return [];
  }

  // If we have a Google Places API key, use the real API
  if (apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=establishment|geocode&components=country:us`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          main_text: prediction.structured_formatting?.main_text || prediction.description,
          secondary_text: prediction.structured_formatting?.secondary_text || '',
          geometry: {
            location: {
              lat: 0, // Will be filled by getPlaceDetails
              lng: 0
            }
          }
        }));
      }
    } catch (error) {
      console.warn('Google Places API error, falling back to mock data:', error);
    }
  }

  // Fallback to mock data for development
  return MOCK_SUGGESTIONS.filter(suggestion =>
    suggestion.description.toLowerCase().includes(input.toLowerCase()) ||
    suggestion.main_text.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 5);
};

// Get detailed place information
export const getPlaceDetails = async (
  placeId: string,
  apiKey?: string
): Promise<LocationSuggestion | null> => {
  // If we have a Google Places API key, use the real API
  if (apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const place = data.result;
        
        return {
          place_id: placeId,
          description: place.formatted_address,
          main_text: place.name,
          secondary_text: place.formatted_address,
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            }
          }
        };
      }
    } catch (error) {
      console.warn('Google Places API error:', error);
    }
  }

  // Fallback to mock data
  const mockPlace = MOCK_SUGGESTIONS.find(s => s.place_id === placeId);
  return mockPlace || null;
};

// Reverse geocoding - get address from coordinates
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number,
  apiKey?: string
): Promise<string> => {
  // If we have a Google Geocoding API key, use the real API
  if (apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      }
    } catch (error) {
      console.warn('Google Geocoding API error:', error);
    }
  }

  // Fallback to approximate address
  return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

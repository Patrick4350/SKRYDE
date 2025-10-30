import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { getLocationSuggestions, getPlaceDetails, LocationSuggestion } from '../services/locationService';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter location",
  className = "",
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get Google Maps API key from environment (Create React App style)
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  // Debounced search for suggestions
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await getLocationSuggestions(value, apiKey);
        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, apiKey]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: LocationSuggestion) => {
    setLoading(true);
    try {
      // Get detailed place information
      const placeDetails = await getPlaceDetails(suggestion.place_id, apiKey);
      
      if (placeDetails) {
        onChange(placeDetails.description);
        onLocationSelect({
          lat: placeDetails.geometry.location.lat,
          lng: placeDetails.geometry.location.lng,
          address: placeDetails.description
        });
      } else {
        // Fallback to suggestion data
        onChange(suggestion.description);
        onLocationSelect({
          lat: suggestion.geometry.location.lat,
          lng: suggestion.geometry.location.lng,
          address: suggestion.description
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to suggestion data
      onChange(suggestion.description);
      onLocationSelect({
        lat: suggestion.geometry.location.lat,
        lng: suggestion.geometry.location.lng,
        address: suggestion.description
      });
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear input
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {suggestion.main_text}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.secondary_text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No suggestions message */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No locations found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationInput;

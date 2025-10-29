# Google Maps Setup for SKRYDE

## Development Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** (for location suggestions)
   - **Geocoding API** (for reverse geocoding)

### 2. Create API Key

1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 3. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:5001
```

### 4. Restrict API Key (Recommended for Production)

1. In Google Cloud Console, go to your API key
2. Click "Restrict Key"
3. Under "Application restrictions", choose "HTTP referrers"
4. Add your domain(s):
   - `http://localhost:3000/*` (for development)
   - `https://yourdomain.com/*` (for production)

### 5. Features Enabled

With this setup, SKRYDE will have:

- **Interactive Maps**: Real-time map display with user location
- **Location Suggestions**: Auto-complete when typing locations
- **Driver Simulation**: Simulated drivers around user location
- **Geocoding**: Convert coordinates to addresses and vice versa

### 6. Development Mode

If you don't have a Google Maps API key, the app will work with:
- Mock location suggestions
- Simulated drivers
- Basic map functionality (may have watermarks)

### 7. Cost Considerations

- **Maps JavaScript API**: Free up to 28,000 loads per month
- **Places API**: $17 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

For development, you'll likely stay within the free tier limits.

## Troubleshooting

### Map Not Loading
- Check if the API key is correctly set in `.env`
- Verify the API key has the required APIs enabled
- Check browser console for error messages

### Location Suggestions Not Working
- Ensure Places API is enabled
- Check if the API key has Places API access
- Verify the API key restrictions allow your domain

### CORS Errors
- Make sure your domain is added to the API key restrictions
- Check if the API key is properly configured

# SKRYDE MVP Extension - Profile, Rides & Maps

This extension adds comprehensive Profile management, enhanced Rides functionality, and Google Maps integration to the SKRYDE MVP.

## 🚀 New Features

### Backend Enhancements

#### 1. Enhanced Database Schema
- **LocationPing Model**: Tracks user location history
- **Enhanced User Model**: Added location fields and indexes
- **Enhanced Ride Model**: Added coordinate fields for better mapping
- **Database Indexes**: Optimized queries for location-based searches

#### 2. New API Routes

**Profile Routes (`/api/profile`)**
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile
- `GET /stats` - Get user statistics
- `GET /rides` - Get user's ride history
- `DELETE /me` - Delete user account

**Enhanced Rides Routes (`/api/rides`)**
- `GET /` - Get rides with advanced filtering
- `GET /:id` - Get single ride details
- `POST /` - Create new ride (drivers only)
- `PUT /:id` - Update ride (driver only)
- `DELETE /:id` - Delete ride (driver only)
- `GET /driver/my-rides` - Get driver's rides

**Location & Nearby Routes (`/api/nearby`)**
- `POST /heartbeat` - Update user location
- `GET /drivers` - Get nearby drivers
- `GET /rides` - Get nearby rides
- `GET /history` - Get location history
- `GET /map-data` - Get real-time map data

#### 3. Geo Utilities (`/src/utils/geo.ts`)
- Distance calculations using Haversine formula
- Location validation
- Bounding box calculations
- Nearby location finding

### Frontend Enhancements

#### 1. Google Maps Integration
- **MapView Component**: Real-time map showing drivers and rides
- **Location Tracking**: Automatic location updates every 30 seconds
- **Interactive Markers**: Click to view driver/ride details
- **Info Windows**: Detailed information popups

#### 2. Enhanced Components

**RidesList Component**
- Advanced filtering (origin, destination, fare, seats, date, radius)
- Real-time search and pagination
- Location-based filtering
- Responsive design

**RideForm Component**
- Complete ride posting form for drivers
- Location coordinate input (optional)
- Form validation
- Current location detection

**Enhanced ProfilePage**
- Full profile editing capabilities
- Statistics dashboard
- Recent rides display
- Account management
- Location management

**Enhanced DashboardPage**
- Tabbed interface (Overview, Map, Rides, Post Ride)
- Real-time statistics
- Quick actions
- Integrated map view
- Ride browsing and posting

#### 3. Updated Type Definitions
- Enhanced User interface with location fields
- Enhanced Ride interface with coordinates
- New interfaces: LocationPing, DriverWithDistance, MapData, ProfileStats

## 🛠 Setup Instructions

### 1. Backend Setup
The backend routes are already wired and ready to use. The database schema has been updated with:
```bash
cd backend
npx prisma db push
```

### 2. Frontend Setup
Install the new dependencies:
```bash
cd frontend
npm install @react-google-maps/api @types/google.maps
```

### 3. Google Maps API Key
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a `.env.local` file in the frontend directory:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
REACT_APP_API_URL=http://localhost:5001/api
```

### 4. Required Google Maps APIs
Enable these APIs in your Google Cloud Console:
- Maps JavaScript API
- Places API (optional, for future enhancements)

## 🎯 Key Features

### ✅ Profile Management
- Edit personal information
- Update vehicle details (for drivers)
- Manage location coordinates
- View statistics and ride history
- Account deletion

### ✅ Enhanced Rides
- Advanced filtering and search
- Location-based ride discovery
- Real-time ride posting
- Driver ride management
- Coordinate-based mapping

### ✅ Google Maps Integration
- Real-time driver locations
- Interactive ride markers
- Location tracking and updates
- Distance calculations
- Uber-style map interface

### ✅ Location Services
- Automatic location detection
- Location history tracking
- Nearby driver/ride discovery
- Real-time location updates
- Privacy-conscious location management

## 🔧 Technical Details

### Database Schema Updates
```sql
-- New LocationPing table
CREATE TABLE location_pings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Enhanced User table
ALTER TABLE users ADD COLUMN current_latitude REAL;
ALTER TABLE users ADD COLUMN current_longitude REAL;
ALTER TABLE users ADD COLUMN last_location_update TIMESTAMP;

-- Enhanced Ride table
ALTER TABLE rides ADD COLUMN origin_latitude REAL;
ALTER TABLE rides ADD COLUMN origin_longitude REAL;
ALTER TABLE rides ADD COLUMN dest_latitude REAL;
ALTER TABLE rides ADD COLUMN dest_longitude REAL;
```

### API Endpoints Summary
- **Profile**: 5 endpoints for complete profile management
- **Rides**: 7 endpoints for comprehensive ride operations
- **Location**: 5 endpoints for location and mapping services
- **Total**: 17 new endpoints added

### Frontend Components
- **MapView**: Google Maps integration with real-time data
- **RidesList**: Advanced ride browsing with filters
- **RideForm**: Complete ride posting interface
- **ProfilePage**: Full profile management
- **DashboardPage**: Enhanced dashboard with tabs

## 🚦 Usage

### For Drivers
1. **Post Rides**: Use the "Post Ride" tab in dashboard
2. **Manage Profile**: Edit vehicle info and location
3. **View Map**: See nearby riders and your location
4. **Track Earnings**: View statistics in profile

### For Riders
1. **Browse Rides**: Use filters to find perfect rides
2. **View Map**: See nearby drivers and available rides
3. **Manage Profile**: Update personal information
4. **Track History**: View past rides and ratings

## 🔒 Privacy & Security
- Location data is optional and user-controlled
- Location history is stored securely
- Users can delete their location data
- All location updates require authentication
- Location sharing respects user privacy settings

## 🎨 UI/UX Features
- Consistent SKRYDE branding
- Soft blue/purple campus-inspired design
- Responsive design for all screen sizes
- Loading states and error handling
- Empty state placeholders
- Smooth transitions and animations

This extension transforms SKRYDE from a basic MVP into a comprehensive rideshare platform with professional-grade features while maintaining the student-focused, community-centric design philosophy.

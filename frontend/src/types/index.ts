export interface User {
  id: string;
  email: string;
  name: string;
  school: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  roleType: 'Student' | 'Faculty';
  verified: boolean;
  rating: number;
  vehicleInfo?: string;
  licensePlate?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ridesAsDriver: number;
    ridesAsRider: number;
    reviewsReceived: number;
  };
}

export interface Ride {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  departureTime: string;
  seats: number;
  fare: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  originLatitude?: number;
  originLongitude?: number;
  destLatitude?: number;
  destLongitude?: number;
  proposedFare?: number;
  acceptedFare?: number;
  bargainHistory?: any;
  createdAt: string;
  updatedAt: string;
  driver?: User;
  requests?: RideRequest[];
  offers?: Offer[];
  distance?: number;
  _count?: {
    requests: number;
    offers: number;
  };
}

export interface RideRequest {
  id: string;
  riderId: string;
  origin: string;
  destination: string;
  departureTime: string;
  maxFare: number;
  passengers: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  rider?: User;
  offers?: FareOffer[];
  _count?: {
    offers: number;
  };
}

export interface FareOffer {
  id: string;
  requestId: string;
  driverId: string;
  offeredFare: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED';
  createdAt: string;
  updatedAt: string;
  driver?: User;
  request?: RideRequest;
  counterOffers?: CounterOffer[];
}

export interface CounterOffer {
  id: string;
  offerId: string;
  fromUserId: string;
  counterFare: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
  fromUser?: User;
  offer?: FareOffer;
}

export interface Offer {
  id: string;
  rideId: string;
  riderId: string;
  amount: number;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
  ride?: Ride;
  rider?: User;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
  reviewed?: User;
}

export interface Ad {
  id: string;
  title: string;
  image?: string;
  link?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  requiresVerification?: boolean;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LocationPing {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface DriverWithDistance extends User {
  distance: number;
  estimatedArrival: number;
}

export interface RideWithDistance extends Ride {
  distance: number;
}

export interface MapData {
  drivers: DriverWithDistance[];
  rides: RideWithDistance[];
  center: Location;
  radius: number;
  timestamp: string;
}

export interface ProfileStats {
  totalRidesAsDriver: number;
  totalRidesAsRider: number;
  completedRides: number;
  averageRating: number;
  totalEarnings: number;
  recentReviews: Review[];
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: 'OFFER' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'RIDE_REQUEST' | 'RIDE_CONFIRMED';
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: 'RIDER' | 'DRIVER';
    roleType: 'Student' | 'Faculty';
  };
}

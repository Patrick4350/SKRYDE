import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Ride,
  Offer,
  Review,
  Ad,
  AuthResponse,
  ApiResponse,
  ProfileStats,
  MapData,
  DriverWithDistance,
  LocationPing,
  Location,
  RideRequest,
  FareOffer,
  CounterOffer,
  Notification
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    name: string;
    school: string;
    role?: string;
    vehicleInfo?: string;
    licensePlate?: string;
  }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  // (Deprecated) Old profile endpoints removed in favor of /profile/* routes below

  // (Deprecated) Old rides endpoints removed; see enhanced rides endpoints below

  // Offers endpoints
  async getOffers(rideId: string): Promise<{ offers: Offer[] }> {
    const response: AxiosResponse<{ offers: Offer[] }> = await this.api.get(`/offers/ride/${rideId}`);
    return response.data;
  }

  async createOffer(rideId: string, amount: number): Promise<{ offer: Offer; message: string }> {
    const response: AxiosResponse<{ offer: Offer; message: string }> = await this.api.post('/offers', {
      rideId,
      amount,
    });
    return response.data;
  }

  async acceptOffer(id: string): Promise<{ offer: Offer; message: string }> {
    const response: AxiosResponse<{ offer: Offer; message: string }> = await this.api.put(`/offers/${id}/accept`);
    return response.data;
  }

  async rejectOffer(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.put(`/offers/${id}/reject`);
    return response.data;
  }

  async getMyOffers(): Promise<{ offers: Offer[] }> {
    const response: AxiosResponse<{ offers: Offer[] }> = await this.api.get('/offers/my-offers');
    return response.data;
  }

  async cancelOffer(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/offers/${id}`);
    return response.data;
  }

  // Reviews endpoints
  async getReviews(userId: string): Promise<{ reviews: Review[] }> {
    const response: AxiosResponse<{ reviews: Review[] }> = await this.api.get(`/reviews/user/${userId}`);
    return response.data;
  }

  async createReview(data: {
    reviewedId: string;
    rating: number;
    comment?: string;
  }): Promise<{ review: Review; message: string }> {
    const response: AxiosResponse<{ review: Review; message: string }> = await this.api.post('/reviews', data);
    return response.data;
  }

  async updateReview(id: string, data: { rating?: number; comment?: string }): Promise<{ review: Review; message: string }> {
    const response: AxiosResponse<{ review: Review; message: string }> = await this.api.put(`/reviews/${id}`, data);
    return response.data;
  }

  async deleteReview(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/reviews/${id}`);
    return response.data;
  }

  async getMyReviews(): Promise<{ reviews: Review[] }> {
    const response: AxiosResponse<{ reviews: Review[] }> = await this.api.get('/reviews/my-reviews');
    return response.data;
  }

  // Users endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    verified?: boolean;
  }): Promise<{ users: User[]; pagination: any }> {
    const response: AxiosResponse<{ users: User[]; pagination: any }> = await this.api.get('/users', { params });
    return response.data;
  }

  async getUser(id: string): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  // Admin endpoints
  async getDashboard(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/admin/dashboard');
    return response.data;
  }

  async getMetrics(period?: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/admin/metrics', { params: { period } });
    return response.data;
  }

  async getAds(): Promise<{ ads: Ad[] }> {
    const response: AxiosResponse<{ ads: Ad[] }> = await this.api.get('/admin/ads');
    return response.data;
  }

  async createAd(data: { title: string; image?: string; link?: string }): Promise<{ ad: Ad; message: string }> {
    const response: AxiosResponse<{ ad: Ad; message: string }> = await this.api.post('/admin/ads', data);
    return response.data;
  }

  async updateAd(id: string, data: Partial<Ad>): Promise<{ ad: Ad; message: string }> {
    const response: AxiosResponse<{ ad: Ad; message: string }> = await this.api.put(`/admin/ads/${id}`, data);
    return response.data;
  }

  async deleteAd(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/admin/ads/${id}`);
    return response.data;
  }

  // Profile endpoints
  async getProfile(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/profile/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<{ user: User; message: string }> {
    const response: AxiosResponse<{ user: User; message: string }> = await this.api.put('/profile/me', data);
    return response.data;
  }

  async getProfileStats(): Promise<{ stats: ProfileStats }> {
    const response: AxiosResponse<{ stats: ProfileStats }> = await this.api.get('/profile/stats');
    return response.data;
  }

  async getProfileRides(params?: {
    page?: number;
    limit?: number;
    type?: 'all' | 'driver' | 'rider';
  }): Promise<{ rides: Ride[]; pagination: any }> {
    const response: AxiosResponse<{ rides: Ride[]; pagination: any }> = await this.api.get('/profile/rides', { params });
    return response.data;
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete('/profile/me');
    return response.data;
  }

  // Enhanced Rides endpoints
  async getRidesWithFilters(params?: {
    origin?: string;
    destination?: string;
    minFare?: number;
    maxFare?: number;
    seats?: number;
    departureDate?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<{ rides: Ride[]; pagination: any }> {
    const response: AxiosResponse<{ rides: Ride[]; pagination: any }> = await this.api.get('/rides', { params });
    return response.data;
  }

  async getRideById(id: string): Promise<{ ride: Ride }> {
    const response: AxiosResponse<{ ride: Ride }> = await this.api.get(`/rides/${id}`);
    return response.data;
  }

  async createRide(data: {
    origin: string;
    destination: string;
    departureTime: string;
    seats: number;
    fare: number;
    originLatitude?: number;
    originLongitude?: number;
    destLatitude?: number;
    destLongitude?: number;
  }): Promise<{ ride: Ride; message: string }> {
    const response: AxiosResponse<{ ride: Ride; message: string }> = await this.api.post('/rides', data);
    return response.data;
  }

  async updateRide(id: string, data: Partial<Ride>): Promise<{ ride: Ride; message: string }> {
    const response: AxiosResponse<{ ride: Ride; message: string }> = await this.api.put(`/rides/${id}`, data);
    return response.data;
  }

  async deleteRide(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/rides/${id}`);
    return response.data;
  }

  async getDriverRides(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ rides: Ride[]; pagination: any }> {
    const response: AxiosResponse<{ rides: Ride[]; pagination: any }> = await this.api.get('/rides/driver/my-rides', { params });
    return response.data;
  }

  // Location and Nearby endpoints
  async updateLocation(latitude: number, longitude: number): Promise<{ message: string; timestamp: string }> {
    const response: AxiosResponse<{ message: string; timestamp: string }> = await this.api.post('/nearby/heartbeat', {
      latitude,
      longitude
    });
    return response.data;
  }

  async getNearbyDrivers(params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }): Promise<{ drivers: DriverWithDistance[]; center: Location; radius: number; count: number }> {
    const response: AxiosResponse<{ drivers: DriverWithDistance[]; center: Location; radius: number; count: number }> = 
      await this.api.get('/nearby/drivers', { params });
    return response.data;
  }

  async getNearbyRides(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<{ rides: Ride[]; center: Location; radius: number; pagination: any }> {
    const response: AxiosResponse<{ rides: Ride[]; center: Location; radius: number; pagination: any }> = 
      await this.api.get('/nearby/rides', { params });
    return response.data;
  }

  async getLocationHistory(params?: {
    hours?: number;
    limit?: number;
  }): Promise<{ history: LocationPing[]; hours: number; count: number }> {
    const response: AxiosResponse<{ history: LocationPing[]; hours: number; count: number }> = 
      await this.api.get('/nearby/history', { params });
    return response.data;
  }

  async getMapData(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    includeRides?: boolean;
  }): Promise<MapData> {
    const response: AxiosResponse<MapData> = await this.api.get('/nearby/map-data', { params });
    return response.data;
  }

  // Driver Matching and Fare Bargaining endpoints (NEW)
  async getNearbyDriversForRide(params: { latitude: number; longitude: number; radius?: number }): Promise<{ drivers: DriverWithDistance[]; count: number; center: Location; radius: number }> {
    const response: AxiosResponse<{ drivers: DriverWithDistance[]; count: number; center: Location; radius: number }> = 
      await this.api.get('/bargain/nearby-drivers', { params });
    return response.data;
  }

  async calculateFare(data: { origin: string; destination: string; driverId: string; distance?: number }): Promise<{ estimatedFare: number; baseFare: number; perKmRate: number; distance: number; ratingMultiplier: number; driver: any }> {
    const response: AxiosResponse<{ estimatedFare: number; baseFare: number; perKmRate: number; distance: number; ratingMultiplier: number; driver: any }> = 
      await this.api.post('/bargain/calculate-fare', data);
    return response.data;
  }

  async createRideRequest(data: { origin: string; destination: string; departureTime: string; passengers: number; maxFare: number; message?: string; originLatitude?: number; originLongitude?: number; destLatitude?: number; destLongitude?: number }): Promise<{ request: any; message: string }> {
    const response: AxiosResponse<{ request: any; message: string }> = 
      await this.api.post('/bargain/ride-request', data);
    return response.data;
  }

  async startBargain(data: { requestId: string; driverId: string; proposedFare: number; message?: string }): Promise<{ ride: Ride; message: string }> {
    const response: AxiosResponse<{ ride: Ride; message: string }> = 
      await this.api.post('/bargain/start-bargain', data);
    return response.data;
  }

  async counterOffer(data: { rideId: string; counterFare: number; message?: string }): Promise<{ ride: Ride; message: string }> {
    const response: AxiosResponse<{ ride: Ride; message: string }> = 
      await this.api.post('/bargain/counter-offer', data);
    return response.data;
  }

  async acceptFare(data: { rideId: string }): Promise<{ ride: Ride; message: string }> {
    const response: AxiosResponse<{ ride: Ride; message: string }> = 
      await this.api.post('/bargain/accept-fare', data);
    return response.data;
  }

  async rejectFare(data: { rideId: string; reason?: string }): Promise<{ ride: Ride; message: string }> {
    const response: AxiosResponse<{ ride: Ride; message: string }> = 
      await this.api.post('/bargain/reject-fare', data);
    return response.data;
  }

  // Ride Request Management endpoints
  async getRideRequests(params?: { status?: string; riderId?: string; driverId?: string }): Promise<{ requests: RideRequest[]; pagination: any }> {
    const response: AxiosResponse<{ requests: RideRequest[]; pagination: any }> = 
      await this.api.get('/bargain/ride-requests', { params });
    return response.data;
  }

  // Notifications endpoints
  async getNotifications(): Promise<Notification[]> {
    const response: AxiosResponse<Notification[]> = 
      await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<{ ok: boolean; notification: Notification }> {
    const response: AxiosResponse<{ ok: boolean; notification: Notification }> = 
      await this.api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<{ ok: boolean }> {
    const response: AxiosResponse<{ ok: boolean }> = 
      await this.api.patch('/notifications/mark-all-read');
    return response.data;
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    const response: AxiosResponse<{ count: number }> = 
      await this.api.get('/notifications/unread-count');
    return response.data;
  }
}

export default new ApiService();

// Trip service for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class TripService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get user trips
  async getUserTrips(status = null, limit = 10, page = 1) {
    try {
      let endpoint = '/profile/trips';
      const params = new URLSearchParams();

      if (status) params.append('status', status);
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching user trips:', error);
      throw error;
    }
  }

  // Get all trips for calendar view
  async getAllTripsForCalendar() {
    try {
      const response = await this.makeRequest('/profile/trips?limit=1000');
      return response;
    } catch (error) {
      console.error('Error fetching all trips for calendar:', error);
      throw error;
    }
  }

  // Get completed trips (previous trips)
  async getPreviousTrips(limit = 6) {
    try {
      const response = await this.getUserTrips('completed', limit, 1);
      return response.trips || [];
    } catch (error) {
      console.error('Error fetching previous trips:', error);
      return [];
    }
  }

  // Get upcoming trips
  async getUpcomingTrips(limit = 6) {
    try {
      const response = await this.getUserTrips('planned', limit, 1);
      return response.trips || [];
    } catch (error) {
      console.error('Error fetching upcoming trips:', error);
      return [];
    }
  }

  // Get ongoing trips
  async getOngoingTrips(limit = 6) {
    try {
      const response = await this.getUserTrips('ongoing', limit, 1);
      return response.trips || [];
    } catch (error) {
      console.error('Error fetching ongoing trips:', error);
      return [];
    }
  }

  // Create a new trip
  async createTrip(tripData) {
    try {
      const response = await this.makeRequest('/profile/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });
      return response;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  }

  // Update a trip
  async updateTrip(tripId, tripData) {
    try {
      const response = await this.makeRequest(`/profile/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(tripData),
      });
      return response;
    } catch (error) {
      console.error('Error updating trip:', error);
      throw error;
    }
  }

  // Delete a trip
  async deleteTrip(tripId) {
    try {
      const response = await this.makeRequest(`/profile/trips/${tripId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  // Get trip details
  async getTripDetails(tripId) {
    try {
      const response = await this.makeRequest(`/profile/trips/${tripId}`);
      return response;
    } catch (error) {
      console.error('Error fetching trip details:', error);
      throw error;
    }
  }
}

export default new TripService();
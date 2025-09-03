const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config({ path: './config.env' });

// Cache for API responses (5 minutes)
const cache = new NodeCache({ stdTTL: 300 });

// API Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

class TravelService {
  constructor() {
    this.amadeusToken = null;
    this.tokenExpiry = null;
  }

  // Get Amadeus access token for flight data
  async getAmadeusToken() {
    if (this.amadeusToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.amadeusToken;
    }

    try {
      const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token',
        'grant_type=client_credentials&client_id=' + AMADEUS_CLIENT_ID + '&client_secret=' + AMADEUS_CLIENT_SECRET,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.amadeusToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.amadeusToken;
    } catch (error) {
      console.error('Error getting Amadeus token:', error.message);
      return null;
    }
  }

  // Get real-time flight prices
  async getFlightPrices(origin, destination, departureDate, returnDate = null, adults = 1) {
    const cacheKey = `flight_${origin}_${destination}_${departureDate}_${returnDate}_${adults}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const token = await this.getAmadeusToken();
      if (!token) {
        return this.getFallbackFlightPrices(origin, destination, departureDate, returnDate, adults);
      }

      const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: departureDate,
          returnDate: returnDate,
          adults: adults,
          max: 5,
          currencyCode: 'INR'
        }
      });

      const flights = response.data.data.map(flight => ({
        id: flight.id,
        airline: flight.validatingAirlineCodes[0],
        departure: flight.itineraries[0].segments[0].departure,
        arrival: flight.itineraries[0].segments[0].arrival,
        price: flight.price.total,
        currency: flight.price.currency,
        duration: flight.itineraries[0].duration,
        stops: flight.itineraries[0].segments.length - 1
      }));

      cache.set(cacheKey, flights);
      return flights;
    } catch (error) {
      console.error('Error getting flight prices:', error.message);
      return this.getFallbackFlightPrices(origin, destination, departureDate, returnDate, adults);
    }
  }

  // Fallback flight prices (when API fails)
  getFallbackFlightPrices(origin, destination, departureDate, returnDate, adults) {
    const basePrice = 5000; // Base price in INR
    const distanceMultiplier = this.calculateDistanceMultiplier(origin, destination);
    const dateMultiplier = this.calculateDateMultiplier(departureDate);

    return [
      {
        id: 'flight-1',
        airline: 'AI',
        departure: { iataCode: origin, terminal: '1' },
        arrival: { iataCode: destination, terminal: '2' },
        price: Math.round(basePrice * distanceMultiplier * dateMultiplier * adults),
        currency: 'INR',
        duration: 'PT2H30M',
        stops: 0
      },
      {
        id: 'flight-2',
        airline: '6E',
        departure: { iataCode: origin, terminal: '3' },
        arrival: { iataCode: destination, terminal: '1' },
        price: Math.round(basePrice * distanceMultiplier * dateMultiplier * adults * 0.8),
        currency: 'INR',
        duration: 'PT3H15M',
        stops: 1
      }
    ];
  }

  // Get real-time hotel prices
  async getHotelPrices(location, checkIn, checkOut, adults = 1, rooms = 1) {
    const cacheKey = `hotel_${location}_${checkIn}_${checkOut}_${adults}_${rooms}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      if (RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
        const response = await axios.get('https://hotels4.p.rapidapi.com/locations/v3/search', {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
          },
          params: {
            query: location,
            locale: 'en_US',
            currency: 'INR'
          }
        });

        if (response.data.suggestions && response.data.suggestions.length > 0) {
          const destinationId = response.data.suggestions[0].entities[0].destinationId;

          const hotelsResponse = await axios.get('https://hotels4.p.rapidapi.com/properties/v2/list', {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': RAPIDAPI_HOST
            },
            params: {
              destinationId: destinationId,
              checkIn: checkIn,
              checkOut: checkOut,
              adults: adults,
              rooms: rooms,
              currency: 'INR'
            }
          });

          const hotels = hotelsResponse.data.data.propertySearch.properties.map(hotel => ({
            id: hotel.id,
            name: hotel.name,
            price: hotel.price?.lead?.amount || 0,
            currency: hotel.price?.lead?.currencyInfo?.code || 'INR',
            rating: hotel.reviews?.score || 0,
            image: hotel.propertyGallery?.images[0]?.image?.url || '',
            amenities: hotel.amenities || []
          }));

          cache.set(cacheKey, hotels);
          return hotels;
        }
      }
    } catch (error) {
      console.error('Error getting hotel prices:', error.message);
    }

    // Fallback hotel prices
    return this.getFallbackHotelPrices(location, checkIn, checkOut, adults, rooms);
  }

  // Fallback hotel prices
  getFallbackHotelPrices(location, checkIn, checkOut, adults, rooms) {
    const basePrice = 2000; // Base price per night
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    return [
      {
        id: 'hotel-1',
        name: 'Budget Hotel',
        price: Math.round(basePrice * nights * rooms),
        currency: 'INR',
        rating: 3.5,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        amenities: ['WiFi', 'AC', 'TV']
      },
      {
        id: 'hotel-2',
        name: 'Comfort Hotel',
        price: Math.round(basePrice * nights * rooms * 1.5),
        currency: 'INR',
        rating: 4.2,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2060&q=80',
        amenities: ['WiFi', 'AC', 'TV', 'Restaurant', 'Gym']
      },
      {
        id: 'hotel-3',
        name: 'Luxury Hotel',
        price: Math.round(basePrice * nights * rooms * 2.5),
        currency: 'INR',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        amenities: ['WiFi', 'AC', 'TV', 'Restaurant', 'Gym', 'Spa', 'Pool']
      }
    ];
  }

  // Get train prices (Indian Railways)
  async getTrainPrices(origin, destination, date) {
    const cacheKey = `train_${origin}_${destination}_${date}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // For now, using fallback data since Indian Railways API requires special access
      // In production, you would integrate with IRCTC API or similar service
      const trains = this.getFallbackTrainPrices(origin, destination, date);
      cache.set(cacheKey, trains);
      return trains;
    } catch (error) {
      console.error('Error getting train prices:', error.message);
      return this.getFallbackTrainPrices(origin, destination, date);
    }
  }

  // Fallback train prices
  getFallbackTrainPrices(origin, destination, date) {
    const basePrice = 800; // Base price in INR
    const distanceMultiplier = this.calculateDistanceMultiplier(origin, destination);

    return [
      {
        id: 'train-1',
        name: 'Rajdhani Express',
        number: '12301',
        departure: '06:00',
        arrival: '14:30',
        price: Math.round(basePrice * distanceMultiplier),
        currency: 'INR',
        duration: '8h 30m',
        class: 'AC 3 Tier'
      },
      {
        id: 'train-2',
        name: 'Shatabdi Express',
        number: '12019',
        departure: '08:00',
        arrival: '16:00',
        price: Math.round(basePrice * distanceMultiplier * 1.2),
        currency: 'INR',
        duration: '8h 0m',
        class: 'AC Chair Car'
      }
    ];
  }

  // Get bus prices
  async getBusPrices(origin, destination, date) {
    const cacheKey = `bus_${origin}_${destination}_${date}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // For now, using fallback data since bus APIs require special access
      const buses = this.getFallbackBusPrices(origin, destination, date);
      cache.set(cacheKey, buses);
      return buses;
    } catch (error) {
      console.error('Error getting bus prices:', error.message);
      return this.getFallbackBusPrices(origin, destination, date);
    }
  }

  // Fallback bus prices
  getFallbackBusPrices(origin, destination, date) {
    const basePrice = 300; // Base price in INR
    const distanceMultiplier = this.calculateDistanceMultiplier(origin, destination);

    return [
      {
        id: 'bus-1',
        name: 'Volvo AC',
        departure: '20:00',
        arrival: '06:00',
        price: Math.round(basePrice * distanceMultiplier),
        currency: 'INR',
        duration: '10h 0m',
        type: 'AC Sleeper'
      },
      {
        id: 'bus-2',
        name: 'Regular Bus',
        departure: '22:00',
        arrival: '08:00',
        price: Math.round(basePrice * distanceMultiplier * 0.7),
        currency: 'INR',
        duration: '10h 0m',
        type: 'Non-AC'
      }
    ];
  }

  // Get real-time attractions and activities
  async getAttractions(location, radius = 50000) {
    const cacheKey = `attractions_${location}_${radius}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Use fallback attractions
    return this.getFallbackAttractions(location);
  }

  // Fallback attractions
  getFallbackAttractions(location) {
    return [
      {
        id: 'attr-1',
        name: 'Local Markets',
        rating: 4.2,
        user_ratings_total: 150,
        types: ['shopping'],
        vicinity: 'City Center',
        photos: [],
        location: null,
        price_level: 1
      },
      {
        id: 'attr-2',
        name: 'Historical Sites',
        rating: 4.5,
        user_ratings_total: 300,
        types: ['tourist_attraction'],
        vicinity: 'Old Town',
        photos: [],
        location: null,
        price_level: 0
      },
      {
        id: 'attr-3',
        name: 'Cultural Centers',
        rating: 4.3,
        user_ratings_total: 200,
        types: ['museum'],
        vicinity: 'Downtown',
        photos: [],
        location: null,
        price_level: 1
      }
    ];
  }

  // Calculate distance multiplier for pricing
  calculateDistanceMultiplier(origin, destination) {
    // This is a simplified calculation - in production you'd use actual distance
    const distances = {
      'Mumbai': { 'Delhi': 2.5, 'Bangalore': 1.8, 'Chennai': 2.0, 'Kolkata': 2.2 },
      'Delhi': { 'Mumbai': 2.5, 'Bangalore': 2.8, 'Chennai': 2.6, 'Kolkata': 1.8 },
      'Bangalore': { 'Mumbai': 1.8, 'Delhi': 2.8, 'Chennai': 1.2, 'Kolkata': 2.5 },
      'Chennai': { 'Mumbai': 2.0, 'Delhi': 2.6, 'Bangalore': 1.2, 'Kolkata': 2.3 }
    };

    const originCity = origin.split(',')[0];
    const destCity = destination.split(',')[0];

    if (distances[originCity] && distances[originCity][destCity]) {
      return distances[originCity][destCity];
    }

    return 2.0; // Default multiplier
  }

  // Calculate date multiplier for pricing
  calculateDateMultiplier(date) {
    const targetDate = new Date(date);
    const today = new Date();
    const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7) return 1.5; // Last minute booking
    if (daysUntil <= 30) return 1.2; // Short notice
    if (daysUntil <= 90) return 1.0; // Normal booking
    return 0.9; // Early booking discount
  }

  // Get comprehensive travel package with real-time pricing
  async getTravelPackage(origin, destination, stops, startDate, endDate, travelers, budget, tripType) {
    try {
      // Get all transportation options
      const [flights, trains, buses] = await Promise.all([
        this.getFlightPrices(origin, destination, startDate, endDate, travelers),
        this.getTrainPrices(origin, destination, startDate),
        this.getBusPrices(origin, destination, startDate)
      ]);

      // Get hotel prices for all locations
      const allLocations = [origin, ...stops, destination];
      const hotelPromises = allLocations.map(location =>
        this.getHotelPrices(location, startDate, endDate, travelers)
      );
      const hotels = await Promise.all(hotelPromises);

      // Get attractions for all locations
      const attractionPromises = allLocations.map(location =>
        this.getAttractions(location)
      );
      const attractions = await Promise.all(attractionPromises);

      // Calculate optimal route and pricing
      const routeInfo = await this.calculateRoute(origin, destination, stops);

      // Generate packages based on budget and preferences
      const packages = this.generatePackages(
        flights, trains, buses, hotels, attractions,
        routeInfo, startDate, endDate, travelers, budget, tripType
      );

      return {
        packages,
        routeInfo,
        totalAttractions: attractions.flat().length,
        pricing: this.calculatePricing(routeInfo, travelers, tripType),
        tripSummary: {
          totalDistance: routeInfo?.totalDistance || 0,
          totalDuration: routeInfo?.totalDuration || 0,
          duration: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
          travelers,
          tripType
        }
      };
    } catch (error) {
      console.error('Error getting travel package:', error);
      throw error;
    }
  }

  // Calculate optimal route using estimated data
  async calculateRoute(origin, destination, stops) {
    // Return estimated route data
    const waypoints = stops.filter(stop => stop.trim() !== '');
    const estimatedDistance = 1000; // Default 1000 km
    const estimatedDuration = '10h 0m';

    return {
      distance: `${estimatedDistance} km`,
      duration: estimatedDuration,
      totalDistance: estimatedDistance * 1000, // Convert to meters
      totalDuration: 36000, // 10 hours in seconds
      steps: [
        {
          instruction: `Drive from ${origin} to ${destination}`,
          distance: `${estimatedDistance} km`,
          duration: estimatedDuration
        }
      ],
      overview_polyline: null
    };
  }

  // Generate travel packages
  generatePackages(flights, trains, buses, hotels, attractions, routeInfo, startDate, endDate, travelers, budget, tripType) {
    const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

    // Ensure we have valid data arrays
    const validFlights = flights && flights.length > 0 ? flights : [];
    const validTrains = trains && trains.length > 0 ? trains : [];
    const validBuses = buses && buses.length > 0 ? buses : [];
    const validHotels = hotels && hotels.length > 0 ? hotels : [];
    const validAttractions = attractions && attractions.length > 0 ? attractions : [];

    // Calculate base costs with fallbacks
    const transportCosts = {
      budget: validBuses.length > 0 ? Math.min(...validBuses.map(b => b.price)) : 1500,
      comfort: validTrains.length > 0 ? Math.min(...validTrains.map(t => t.price)) : 2500,
      luxury: validFlights.length > 0 ? Math.min(...validFlights.map(f => f.price)) : 5000
    };

    const accommodationCosts = validHotels.length > 0 ?
      validHotels.map(hotelGroup =>
        hotelGroup && hotelGroup.length > 0 ? Math.min(...hotelGroup.map(h => h.price)) : 2000
      ) : [2000];

    const minAccommodationCost = Math.min(...accommodationCosts);

    const packages = [
      {
        id: 'budget-1',
        title: 'Budget Explorer',
        route: `${routeInfo?.origin || 'Start'} → ${routeInfo?.destination || 'End'}`,
        duration: `${duration} days`,
        price: `₹${transportCosts.budget + minAccommodationCost}`,
        rating: 4.2,
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        highlights: ['Budget transport', 'Affordable hotels', 'Local experiences'],
        transport: validBuses[0] || { name: 'Budget Bus', price: 1500, duration: '10h 0m' },
        accommodation: validHotels[0]?.[0] || { name: 'Budget Hotel', price: 2000, rating: 3.5 },
        type: 'budget',
        estimatedCost: transportCosts.budget + minAccommodationCost,
        routeInfo: routeInfo,
        attractions: validAttractions[0]?.slice(0, 3) || [],
        pricing: {
          transport: transportCosts.budget,
          accommodation: minAccommodationCost,
          food: 300 * duration * travelers,
          activities: 200 * duration * travelers,
          total: transportCosts.budget + minAccommodationCost + (300 * duration * travelers) + (200 * duration * travelers)
        },
        features: ['Free WiFi', 'Local Guide', 'Basic Insurance']
      },
      {
        id: 'comfort-1',
        title: 'Comfort Journey',
        route: `${routeInfo?.origin || 'Start'} → ${routeInfo?.destination || 'End'}`,
        duration: `${duration} days`,
        price: `₹${transportCosts.comfort + minAccommodationCost * 1.5}`,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        highlights: ['Comfortable transport', 'Quality hotels', 'Guided tours'],
        transport: validTrains[0] || { name: 'Comfort Train', price: 2500, duration: '8h 0m' },
        accommodation: validHotels[0]?.[1] || validHotels[0]?.[0] || { name: 'Comfort Hotel', price: 3000, rating: 4.2 },
        type: 'comfort',
        estimatedCost: transportCosts.comfort + minAccommodationCost * 1.5,
        routeInfo: routeInfo,
        attractions: validAttractions[0]?.slice(0, 4) || [],
        pricing: {
          transport: transportCosts.comfort,
          accommodation: minAccommodationCost * 1.5,
          food: 600 * duration * travelers,
          activities: 400 * duration * travelers,
          total: transportCosts.comfort + (minAccommodationCost * 1.5) + (600 * duration * travelers) + (400 * duration * travelers)
        },
        features: ['Free WiFi', 'Professional Guide', 'Travel Insurance', '24/7 Support']
      },
      {
        id: 'luxury-1',
        title: 'Luxury Experience',
        route: `${routeInfo?.origin || 'Start'} → ${routeInfo?.destination || 'End'}`,
        duration: `${duration} days`,
        price: `₹${transportCosts.luxury + minAccommodationCost * 2.5}`,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80',
        highlights: ['Premium transport', 'Luxury hotels', 'Exclusive experiences'],
        transport: validFlights[0] || { name: 'Luxury Flight', price: 5000, duration: '2h 30m' },
        accommodation: validHotels[0]?.[2] || validHotels[0]?.[1] || validHotels[0]?.[0] || { name: 'Luxury Hotel', price: 5000, rating: 4.8 },
        type: 'luxury',
        estimatedCost: transportCosts.luxury + minAccommodationCost * 2.5,
        routeInfo: routeInfo,
        attractions: validAttractions[0]?.slice(0, 5) || [],
        pricing: {
          transport: transportCosts.luxury,
          accommodation: minAccommodationCost * 2.5,
          food: 1200 * duration * travelers,
          activities: 800 * duration * travelers,
          total: transportCosts.luxury + (minAccommodationCost * 2.5) + (1200 * duration * travelers) + (800 * duration * travelers)
        },
        features: ['Premium WiFi', 'Personal Guide', 'Premium Insurance', '24/7 Concierge', 'VIP Access']
      }
    ];

    // Filter by budget if specified
    if (budget) {
      return packages.filter(pkg => pkg.type === budget);
    }

    return packages;
  }

  // Calculate comprehensive pricing
  calculatePricing(routeInfo, travelers, tripType) {
    const distanceKm = (routeInfo?.totalDistance || 1000) / 1000;
    const durationDays = Math.ceil((routeInfo?.totalDuration || 86400) / (24 * 60 * 60));

    const basePricing = {
      budget: { transport: 15, accommodation: 800, food: 300, activities: 200 },
      comfort: { transport: 25, accommodation: 1500, food: 600, activities: 400 },
      luxury: { transport: 50, accommodation: 3000, food: 1200, activities: 800 }
    };

    const tripMultipliers = {
      leisure: 1.0,
      business: 1.3,
      adventure: 1.2,
      cultural: 1.1
    };

    const multiplier = tripMultipliers[tripType] || 1.0;

    const pricing = {};
    Object.keys(basePricing).forEach(type => {
      pricing[type] = {
        transport: Math.round(basePricing[type].transport * distanceKm * multiplier),
        accommodation: Math.round(basePricing[type].accommodation * durationDays * multiplier),
        food: Math.round(basePricing[type].food * durationDays * travelers * multiplier),
        activities: Math.round(basePricing[type].activities * durationDays * travelers * multiplier),
        total: 0
      };
      pricing[type].total = pricing[type].transport + pricing[type].accommodation +
        pricing[type].food + pricing[type].activities;
    });

    return pricing;
  }
}

module.exports = new TravelService();

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  MapPin,
  Search,
  Plus,
  X,
  Star,
  Clock,
  Users,
  Navigation,
  Map,
  Hotel,
  Utensils,
  Car,
  Plane,
  Train,
  Bus,
  Cloud,
  Info,
  TrendingUp,
  Shield,
  Wifi,
  UserCheck,
  ArrowLeft,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../utils/toast';

const PlanTripPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      showError('Logout failed');
    }
  };

  // Check for pre-filled destination from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const destination = urlParams.get('destination');
    if (destination) {
      setTripData(prev => ({
        ...prev,
        endPlace: destination
      }));
    }
  }, []);

  // Form state
  const [tripData, setTripData] = useState({
    startDate: '',
    endDate: '',
    startPlace: '',
    endPlace: '',
    stops: []
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState([]);
  const [showItinerary, setShowItinerary] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [totalAttractions, setTotalAttractions] = useState(0);
  const [tripSummary, setTripSummary] = useState(null);
  const [transportOptions, setTransportOptions] = useState(null);
  const [hotelOptions, setHotelOptions] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [travelTips, setTravelTips] = useState(null);
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const [customTripData, setCustomTripData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startPlace: '',
    endPlace: '',
    description: '',
    travelers: 1,
    budget: 0,
    tripType: 'leisure'
  });
  const [isCreatingCustomTrip, setIsCreatingCustomTrip] = useState(false);

  // Autocomplete state
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [showStopSuggestions, setShowStopSuggestions] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(-1);

  // Refs for autocomplete
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const stopInputRefs = useRef([]);

  // Date validation
  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);

    if (startDate < today) {
      showError('Start date cannot be in the past');
      return false;
    }

    if (endDate <= startDate) {
      showError('End date must be after start date');
      return false;
    }

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 6) {
      showError('Trip duration cannot exceed 6 days');
      return false;
    }

    return true;
  };

  // Form validation
  const validateForm = () => {
    if (!tripData.startPlace.trim()) {
      showError('Please enter a start place');
      return false;
    }

    if (!tripData.endPlace.trim()) {
      showError('Please enter a destination');
      return false;
    }

    if (!tripData.startDate) {
      showError('Please select a start date');
      return false;
    }

    if (!tripData.endDate) {
      showError('Please select an end date');
      return false;
    }

    if (!validateDates()) {
      return false;
    }

    // Additional check for 6-day limit
    const duration = getTripDuration();
    if (duration && duration > 6) {
      showError('Trip duration cannot exceed 6 days');
      return false;
    }

    return true;
  };

  // Calculate maximum end date (6 days from start date)
  const getMaxEndDate = () => {
    if (!tripData.startDate) return '';
    const startDate = new Date(tripData.startDate);
    const maxEndDate = new Date(startDate);
    maxEndDate.setDate(startDate.getDate() + 6);
    return maxEndDate.toISOString().split('T')[0];
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (!tripData.startDate || !tripData.endDate) return null;
    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle form changes
  const handleInputChange = (field, value) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear suggestions when user starts typing
    if (field === 'startPlace') {
      setShowStartSuggestions(false);
    } else if (field === 'endPlace') {
      setShowEndSuggestions(false);
    }

    // If start date is changed, reset end date if it exceeds the new limit
    if (field === 'startDate') {
      const newStartDate = new Date(value);
      const currentEndDate = new Date(tripData.endDate);
      const maxEndDate = new Date(newStartDate);
      maxEndDate.setDate(newStartDate.getDate() + 6);

      if (currentEndDate > maxEndDate) {
        setTripData(prev => ({
          ...prev,
          endDate: ''
        }));
        showError('End date has been reset. Please select a date within 6 days of the start date.');
      }
    }
  };

  // Search places for autocomplete using our backend API
  const searchPlaces = async (query, setSuggestions, setShowSuggestions) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Use backend API for place search
      const response = await axios.get(`/api/trips/search-places?query=${encodeURIComponent(query)}`);
      setSuggestions(response.data.places);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle place selection
  const selectPlace = (place, field, setSuggestions, setShowSuggestions) => {
    setTripData(prev => ({
      ...prev,
      [field]: place.description
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Add stop
  const addStop = () => {
    if (tripData.stops.length < 5) {
      setTripData(prev => ({
        ...prev,
        stops: [...prev.stops, '']
      }));
      setActiveStopIndex(tripData.stops.length);
    } else {
      showError('Maximum 5 stops allowed');
    }
  };

  // Remove stop
  const removeStop = (index) => {
    setTripData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
    setActiveStopIndex(-1);
  };

  // Update stop
  const updateStop = (index, value) => {
    setTripData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => i === index ? value : stop)
    }));

    // Search for suggestions
    if (value.length >= 2) {
      searchPlaces(value, setStopSuggestions, setShowStopSuggestions);
      setActiveStopIndex(index);
    } else {
      setStopSuggestions([]);
      setShowStopSuggestions(false);
    }
  };

  // Select stop
  const selectStop = (place, index) => {
    setTripData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => i === index ? place.description : stop)
    }));
    setStopSuggestions([]);
    setShowStopSuggestions(false);
    setActiveStopIndex(-1);
  };

  // Get transport options
  const getTransportOptions = async () => {
    if (!tripData.startPlace || !tripData.endPlace || !tripData.startDate) return;

    try {
      const response = await axios.get('/api/trips/transport-options', {
        params: {
          origin: tripData.startPlace,
          destination: tripData.endPlace,
          date: tripData.startDate,
          travelers: 1 // Default to 1 traveler
        }
      });
      setTransportOptions(response.data);
    } catch (error) {
      console.error('Error getting transport options:', error);
    }
  };

  // Get hotel options
  const getHotelOptions = async () => {
    if (!tripData.startPlace || !tripData.startDate || !tripData.endDate) return;

    try {
      const response = await axios.get('/api/trips/hotel-options', {
        params: {
          location: tripData.startPlace,
          checkIn: tripData.startDate,
          checkOut: tripData.endDate,
          adults: 1, // Default to 1 traveler
          rooms: 1 // Default to 1 room
        }
      });
      setHotelOptions(response.data);
    } catch (error) {
      console.error('Error getting hotel options:', error);
    }
  };

  // Get weather data
  const getWeatherData = async () => {
    if (!tripData.startPlace) return;

    try {
      const response = await axios.get(`/api/trips/weather/${encodeURIComponent(tripData.startPlace)}`);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error getting weather data:', error);
    }
  };

  // Get travel tips
  const getTravelTips = async () => {
    if (!tripData.endPlace) return;

    try {
      const response = await axios.get(`/api/trips/travel-tips/${encodeURIComponent(tripData.endPlace)}`);
      setTravelTips(response.data);
    } catch (error) {
      console.error('Error getting travel tips:', error);
    }
  };

  // Generate itinerary
  const generateItinerary = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("\n\n\n\n---------------------")
      // Generate itinerary using Gemini + Foursquare
      const itineraryResponse = await axios.post('/api/itinerary/generate', {
        startPlace: tripData.startPlace,
        endPlace: tripData.endPlace,
        stops: tripData.stops.filter(stop => stop.trim() !== ''),
        startDate: tripData.startDate,
        endDate: tripData.endDate
      });

      const result = itineraryResponse.data;

      // Check if the response has an error
      if (result.error) {
        throw new Error(result.message || 'Failed to generate itinerary');
      }

      // Ensure trip is always an array to prevent undefined errors
      setItinerary(result.trip || []);
      setShowItinerary(true);

      showSuccess(`Generated ${result.totalDays || 0} day itinerary for your trip!`);
    } catch (error) {
      console.error('Error generating itinerary:', error);

      // Show more specific error messages
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message) {
        showError(error.message);
      } else {
        showError('Failed to generate itinerary. Please check your API configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save generated itinerary as planned trip
  const saveItineraryAsTrip = async () => {
    if (!itinerary || itinerary.length === 0) {
      showError('No itinerary to save. Please generate an itinerary first.');
      return;
    }

    setIsSavingTrip(true);
    try {
      const tripTitle = `${tripData.startPlace} to ${tripData.endPlace} Trip`;

      const response = await axios.post('/api/profile/save-itinerary', {
        title: tripTitle,
        startPlace: tripData.startPlace,
        endPlace: tripData.endPlace,
        stops: tripData.stops.filter(stop => stop.trim() !== ''),
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        itinerary: itinerary,
        travelers: 1,
        budget: 0,
        tripType: 'leisure'
      });

      if (response.data.success) {
        showSuccess('Itinerary saved as planned trip successfully!');
        // Optionally navigate to profile page to view the saved trip
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to save itinerary. Please try again.');
      }
    } finally {
      setIsSavingTrip(false);
    }
  };

  // Add custom itinerary
  const addCustomItinerary = () => {
    setShowAddItineraryModal(true);
  };

  // Handle custom trip data changes
  const handleCustomTripChange = (field, value) => {
    setCustomTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create custom trip
  const createCustomTrip = async () => {
    // Validate required fields
    if (!customTripData.title || !customTripData.startDate || !customTripData.endDate ||
      !customTripData.startPlace || !customTripData.endPlace) {
      showError('Please fill in all required fields');
      return;
    }

    // Validate dates
    const start = new Date(customTripData.startDate);
    const end = new Date(customTripData.endDate);

    if (start >= end) {
      showError('End date must be after start date');
      return;
    }

    setIsCreatingCustomTrip(true);
    try {
      const response = await axios.post('/api/profile/trips', {
        title: customTripData.title,
        description: customTripData.description,
        startPlace: customTripData.startPlace,
        endPlace: customTripData.endPlace,
        startDate: customTripData.startDate,
        endDate: customTripData.endDate,
        travelers: customTripData.travelers,
        budget: customTripData.budget,
        tripType: customTripData.tripType
      });

      if (response.data.success) {
        showSuccess('Custom trip created successfully!');
        setShowAddItineraryModal(false);
        // Reset form
        setCustomTripData({
          title: '',
          startDate: '',
          endDate: '',
          startPlace: '',
          endPlace: '',
          description: '',
          travelers: 1,
          budget: 0,
          tripType: 'leisure'
        });
        // Optionally navigate to profile page
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error creating custom trip:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to create custom trip. Please try again.');
      }
    } finally {
      setIsCreatingCustomTrip(false);
    }
  };

  // Select package
  const selectPackage = (pkg) => {
    setSelectedPackages(prev => [...prev, pkg]);
    showSuccess(`Added ${pkg.title} to your selection`);
  };

  // View itinerary
  const viewItinerary = () => {
    if (selectedPackages.length === 0) {
      showError('Please select at least one package');
      return;
    }

    navigate('/itinerary', {
      state: {
        tripData,
        selectedPackages,
        routeInfo,
        totalAttractions,
        tripSummary
      }
    });
  };

  // Remove attraction from itinerary


  // Get transport icon
  const getTransportIcon = (transport) => {
    if (typeof transport === 'string') {
      switch (transport) {
        case 'car': return <Car className="h-4 w-4" />;
        case 'train': return <Train className="h-4 w-4" />;
        case 'bus': return <Bus className="h-4 w-4" />;
        case 'flight': return <Plane className="h-4 w-4" />;
        default: return <Car className="h-4 w-4" />;
      }
    }

    // If transport is an object (from real-time API)
    if (transport.airline) return <Plane className="h-4 w-4" />;
    if (transport.number) return <Train className="h-4 w-4" />;
    if (transport.type) return <Bus className="h-4 w-4" />;

    return <Car className="h-4 w-4" />;
  };



  // Get transport details
  const getTransportDetails = (transport) => {
    if (typeof transport === 'string') return transport;

    if (transport.airline) {
      return `${transport.airline} - ${transport.duration}`;
    }
    if (transport.number) {
      return `${transport.name} (${transport.number}) - ${transport.duration}`;
    }
    if (transport.type) {
      return `${transport.name} - ${transport.duration}`;
    }

    return 'Transport';
  };

  // Handle click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startInputRef.current && !startInputRef.current.contains(event.target)) {
        setShowStartSuggestions(false);
      }
      if (endInputRef.current && !endInputRef.current.contains(event.target)) {
        setShowEndSuggestions(false);
      }
      if (stopInputRefs.current.length > 0) {
        const isClickInsideStop = stopInputRefs.current.some(ref =>
          ref && ref.contains(event.target)
        );
        if (!isClickInsideStop) {
          setShowStopSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="flex items-center text-green-600 hover:text-green-700 transition-colors duration-200 p-2 rounded-lg hover:bg-green-50"
              >
                <Calendar className="h-5 w-5 mr-2" />
                View Calendar
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Plan Your Trip</h1>
              <p className="text-gray-600">Create the perfect itinerary for your journey</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Profile Image Button */}
              <Link
                to="/profile"
                className="flex items-center space-x-2 bg-gray-100 rounded-full p-1 hover:bg-gray-200 transition-colors"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Planning Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                Trip Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-xs text-gray-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tripData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
                      min={new Date().toISOString().split('T')[0]}
                      placeholder="Select start date"
                    />
                  </div>
                  {!tripData.startDate && (
                    <p className="text-xs text-gray-500 mt-1">Please select a start date to continue</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-xs text-gray-500">* (Max 6 days from start)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tripData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${!tripData.startDate
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                      min={tripData.startDate || new Date().toISOString().split('T')[0]}
                      max={getMaxEndDate()}
                      disabled={!tripData.startDate}
                      placeholder="Select end date"
                    />
                  </div>
                  {!tripData.startDate ? (
                    <p className="text-xs text-gray-500 mt-1">Please select a start date first</p>
                  ) : !tripData.endDate ? (
                    <p className="text-xs text-gray-500 mt-1">Please select an end date</p>
                  ) : null}
                </div>

                {/* Start Place */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Place
                  </label>
                  <div className="relative">
                    <input
                      ref={startInputRef}
                      type="text"
                      value={tripData.startPlace}
                      onChange={(e) => {
                        handleInputChange('startPlace', e.target.value);
                        searchPlaces(e.target.value, setStartSuggestions, setShowStartSuggestions);
                      }}
                      onFocus={() => {
                        if (tripData.startPlace.length >= 2) {
                          setShowStartSuggestions(true);
                        }
                      }}
                      placeholder="e.g., Mumbai, Maharashtra"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>

                  {/* Start Place Suggestions */}
                  {showStartSuggestions && startSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {startSuggestions.map((place, index) => (
                        <div
                          key={index}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectPlace(place, 'startPlace', setStartSuggestions, setShowStartSuggestions);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{place.main_text}</div>
                          <div className="text-sm text-gray-600">{place.secondary_text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* End Place */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Place
                  </label>
                  <div className="relative">
                    <input
                      ref={endInputRef}
                      type="text"
                      value={tripData.endPlace}
                      onChange={(e) => {
                        handleInputChange('endPlace', e.target.value);
                        searchPlaces(e.target.value, setEndSuggestions, setShowEndSuggestions);
                      }}
                      onFocus={() => {
                        if (tripData.endPlace.length >= 2) {
                          setShowEndSuggestions(true);
                        }
                      }}
                      placeholder="e.g., Delhi, India"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>

                  {/* End Place Suggestions */}
                  {showEndSuggestions && endSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {endSuggestions.map((place, index) => (
                        <div
                          key={index}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectPlace(place, 'endPlace', setEndSuggestions, setShowEndSuggestions);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{place.main_text}</div>
                          <div className="text-sm text-gray-600">{place.secondary_text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Separator */}
              <div className="my-6 border-t border-gray-200"></div>

              {/* Trip Duration Indicator */}
              {getTripDuration() !== null && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-900">
                          Trip Duration: {getTripDuration()} day{getTripDuration() !== 1 ? 's' : ''}
                        </span>
                        <p className="text-xs text-blue-600 mt-1">
                          {tripData.startDate && tripData.endDate && (
                            <>
                              {new Date(tripData.startDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })} - {new Date(tripData.endDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {getTripDuration() === 6 && (
                      <span className="text-xs text-blue-700 bg-blue-200 px-3 py-1 rounded-full font-medium">
                        Maximum duration
                      </span>
                    )}
                    {getTripDuration() < 6 && (
                      <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                        {6 - getTripDuration()} day{6 - getTripDuration() !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stops */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Stops (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addStop}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stop
                  </button>
                </div>

                {tripData.stops.map((stop, index) => (
                  <div key={index} className="relative mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <input
                          ref={el => stopInputRefs.current[index] = el}
                          type="text"
                          value={stop}
                          onChange={(e) => updateStop(index, e.target.value)}
                          placeholder={`Stop ${index + 1} (e.g., Surat, Gujarat)`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Stop Suggestions */}
                    {showStopSuggestions && activeStopIndex === index && stopSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {stopSuggestions.map((place, placeIndex) => (
                          <div
                            key={placeIndex}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectStop(place, index);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{place.main_text}</div>
                            <div className="text-sm text-gray-600">{place.secondary_text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>



              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={generateItinerary}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Generate Itinerary
                    </>
                  )}
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={addCustomItinerary}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Custom Trip
                  </button>
                </div>
              </div>
            </div>

            {/* Weather Information */}
            {weatherData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Cloud className="h-5 w-5 mr-2" />
                  Weather Forecast for {weatherData.location}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Current</p>
                    <p className="text-2xl font-bold text-blue-900">{weatherData.current.temperature}°C</p>
                    <p className="text-sm text-blue-700">{weatherData.current.condition}</p>
                  </div>
                  {weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center">
                      <p className="text-sm text-blue-600">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="text-lg font-bold text-blue-900">{day.high}°C</p>
                      <p className="text-sm text-blue-700">{day.low}°C</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Route Information */}
            {routeInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  Route Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600">Total Distance</p>
                    <p className="text-xl font-bold text-green-900">{routeInfo.distance}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600">Travel Time</p>
                    <p className="text-xl font-bold text-green-900">{routeInfo.duration}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600">Attractions Found</p>
                    <p className="text-xl font-bold text-green-900">{totalAttractions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600">Trip Duration</p>
                    <p className="text-xl font-bold text-green-900">{tripSummary?.duration} days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transport Options */}
            {transportOptions && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Transportation Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {transportOptions.flights && transportOptions.flights.length > 0 && (
                    <div className="text-center p-4 bg-white rounded-lg">
                      <Plane className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-purple-600">Flights</p>
                      <p className="text-lg font-bold text-purple-900">From ₹{transportOptions.summary.cheapestFlight}</p>
                    </div>
                  )}
                  {transportOptions.trains && transportOptions.trains.length > 0 && (
                    <div className="text-center p-4 bg-white rounded-lg">
                      <Train className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-purple-600">Trains</p>
                      <p className="text-lg font-bold text-purple-900">From ₹{transportOptions.summary.cheapestTrain}</p>
                    </div>
                  )}
                  {transportOptions.buses && transportOptions.buses.length > 0 && (
                    <div className="text-center p-4 bg-white rounded-lg">
                      <Bus className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-purple-600">Buses</p>
                      <p className="text-lg font-bold text-purple-900">From ₹{transportOptions.summary.cheapestBus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search Results */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended Packages</h2>
                <div className="space-y-6">
                  {searchResults.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <img
                          src={pkg.image}
                          alt={pkg.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{pkg.title}</h3>
                              <p className="text-gray-600 text-sm mb-2">{pkg.route}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {pkg.duration}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  1 traveler
                                </span>
                                <span className="flex items-center">
                                  <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                                  {pkg.rating}
                                </span>
                                {pkg.routeInfo && (
                                  <span className="flex items-center">
                                    <Map className="h-4 w-4 mr-1" />
                                    {pkg.routeInfo.distance}
                                  </span>
                                )}
                              </div>

                              {/* Transport Information */}
                              {pkg.transport && (
                                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    {getTransportIcon(pkg.transport)}
                                    <span className="ml-2">Transport:</span>
                                  </h4>
                                  <p className="text-sm text-gray-600">{getTransportDetails(pkg.transport)}</p>
                                </div>
                              )}

                              {/* Accommodation Information */}
                              {pkg.accommodation && (
                                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Hotel className="h-4 w-4 mr-2" />
                                    <span>Accommodation:</span>
                                  </h4>
                                  <p className="text-sm text-gray-600">{pkg.accommodation.name || pkg.accommodation}</p>
                                  {pkg.accommodation.rating && (
                                    <div className="flex items-center mt-1">
                                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                      <span className="text-xs text-gray-600">{pkg.accommodation.rating}</span>
                                    </div>
                                  )}
                                </div>
                              )}



                              <div className="flex flex-wrap gap-2 mb-3">
                                {pkg.highlights.map((highlight, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {highlight}
                                  </span>
                                ))}
                              </div>

                              {pkg.attractions && pkg.attractions.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600 mb-1">Top Attractions:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {pkg.attractions.map((attr, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                      >
                                        {attr.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Features */}
                              {pkg.features && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600 mb-1">Included Features:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {pkg.features.map((feature, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">{pkg.price}</p>
                              <p className="text-sm text-gray-500">per person</p>
                              <button
                                onClick={() => selectPackage(pkg)}
                                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                              >
                                Select Package
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Itinerary */}
            {showItinerary && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Map className="h-6 w-6 mr-2" />
                    Your Generated Itinerary
                  </h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={saveItineraryAsTrip}
                      disabled={isSavingTrip}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSavingTrip ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Save as Planned Trip
                        </>
                      )}
                    </button>
                    <button
                      onClick={addCustomItinerary}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Itinerary
                    </button>
                  </div>
                </div>
                {itinerary && itinerary.length > 0 ? (
                  <div className="space-y-6">
                    {itinerary.map((day, dayIndex) => (
                      <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Day {day.day}: {day.city}
                          </h3>
                          {day.date && (
                            <span className="text-sm text-gray-500">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                        <div className="space-y-4">
                          {day.activities.map((activity, activityIndex) => (
                            <div key={activityIndex} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg relative">
                              {activity.imageUrl && (
                                <img
                                  src={activity.imageUrl}
                                  alt={activity.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{activity.name}</h4>
                                  <div className="flex items-center space-x-2">
                                    {activity.rating && (
                                      <div className="flex items-center">
                                        <span className="text-yellow-500">★</span>
                                        <span className="text-sm text-gray-600 ml-1">{activity.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {activity.time && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {activity.time}
                                  </p>
                                )}
                                {activity.description && (
                                  <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                                )}
                                {activity.cost && (
                                  <p className="text-sm font-medium text-green-600">
                                    <span className="text-green-600 mr-1">₹</span>
                                    {activity.cost}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No itinerary data available. Please try generating again.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Selected Packages */}
            {selectedPackages.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Packages</h3>
                <div className="space-y-3">
                  {selectedPackages.map((pkg, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{pkg.title}</p>
                        <p className="text-sm text-gray-600">{pkg.price}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPackages(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={viewItinerary}
                  className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  View Itinerary
                </button>
              </div>
            )}



            {/* Travel Tips */}
            {travelTips && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Travel Tips for {travelTips.destination}
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">General</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {travelTips.general.slice(0, 2).map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Accommodation</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {travelTips.accommodation.slice(0, 2).map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Trending Packages */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Packages</h3>
              <div className="space-y-4">
                <div 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('/golden-trail-adventure')}
                >
                  <img
                    src="https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
                    alt="Golden Triangle"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-semibold text-gray-900 mb-1">Golden Triangle Adventure</h4>
                  <p className="text-sm text-gray-600 mb-2">Delhi → Agra → Jaipur</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">7 days</span>
                      <span className="flex items-center text-sm">
                        <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                        4.8
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">₹25,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Itinerary Modal */}
      {showAddItineraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add Custom Itinerary</h3>
              <button
                onClick={() => setShowAddItineraryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTripData.title}
                  onChange={(e) => handleCustomTripChange('title', e.target.value)}
                  placeholder="Enter trip title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={customTripData.startDate}
                    onChange={(e) => handleCustomTripChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={customTripData.endDate}
                    onChange={(e) => handleCustomTripChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customTripData.startPlace}
                    onChange={(e) => handleCustomTripChange('startPlace', e.target.value)}
                    placeholder="e.g., Mumbai, Maharashtra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customTripData.endPlace}
                    onChange={(e) => handleCustomTripChange('endPlace', e.target.value)}
                    placeholder="e.g., Delhi, India"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={customTripData.description}
                  onChange={(e) => handleCustomTripChange('description', e.target.value)}
                  placeholder="Enter trip description (optional)"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customTripData.travelers}
                    onChange={(e) => handleCustomTripChange('travelers', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customTripData.budget}
                    onChange={(e) => handleCustomTripChange('budget', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Type
                  </label>
                  <select
                    value={customTripData.tripType}
                    onChange={(e) => handleCustomTripChange('tripType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="leisure">Leisure</option>
                    <option value="business">Business</option>
                    <option value="adventure">Adventure</option>
                    <option value="cultural">Cultural</option>
                    <option value="family">Family</option>
                    <option value="romantic">Romantic</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddItineraryModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCustomTrip}
                disabled={isCreatingCustomTrip}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreatingCustomTrip ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanTripPage;

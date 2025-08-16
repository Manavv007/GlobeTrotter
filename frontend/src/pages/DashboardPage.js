import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Globe, User, LogOut, Calendar, MapPin, Star, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showError } from '../utils/toast';
import tripService from '../services/tripService';
import { getDestinationImage } from '../utils/destinationImages';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [previousTrips, setPreviousTrips] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [ongoingTrips, setOngoingTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      showError('Logout failed');
    }
  };

  // Fetch city suggestions
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/trips/search-places?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.places || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchSuggestions(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.description);
    setShowSuggestions(false);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/plan-trip?destination=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const popularDestinations = [
    {
      name: 'Kerala',
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      name: 'Goa',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80'
    },
    {
      name: 'Manali',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    },
    {
      name: 'Assam',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    }
  ];

  // Fetch user trips on component mount
  useEffect(() => {
    const fetchUserTrips = async () => {
      try {
        setLoading(true);
        const [previous, upcoming, ongoing] = await Promise.all([
          tripService.getPreviousTrips(6),
          tripService.getUpcomingTrips(6),
          tripService.getOngoingTrips(6)
        ]);

        setPreviousTrips(previous);
        setUpcomingTrips(upcoming);
        setOngoingTrips(ongoing);
      } catch (error) {
        console.error('Error fetching trips:', error);
        showError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrips();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Get trip display name
  const getTripDisplayName = (trip) => {
    if (trip.title) return trip.title;
    return `${trip.startPlace} to ${trip.endPlace}`;
  };

  // Handle trip card click
  const handleTripClick = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  // Handle popular destination card click
  const handleDestinationClick = (destinationName) => {
    navigate(`/plan-trip?destination=${encodeURIComponent(destinationName)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center text-gray-900">
            <Globe className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">GlobeTrotter</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/calendar" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Link>
            <Link to="/community" className="text-gray-600 hover:text-gray-900 transition-colors">Community</Link>
            <Link to="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">Profile</Link>
          </nav>

          {/* Right side - Profile */}
          <div className="flex items-center space-x-4">
            {/* Profile Image Button */}
            <div className="relative">
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
            </div>

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
      </header>

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Ready to plan your next adventure?
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="flex bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 flex items-center px-4">
                  <Search className="h-5 w-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Where"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                    className="flex-1 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearchSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 transition-colors duration-200 flex items-center"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id || index}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionSelect(suggestion);
                      }}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{suggestion.main_text}</div>
                          {suggestion.secondary_text && (
                            <div className="text-sm text-gray-500">{suggestion.secondary_text}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Popular Destinations Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Popular Destinations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <div
                key={index}
                onClick={() => handleDestinationClick(destination.name)}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300/6366f1/ffffff?text=' + encodeURIComponent(destination.name);
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-lg">{destination.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Previous Trips Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Previous Trips
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : previousTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                  onClick={() => handleTripClick(trip._id)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getDestinationImage(trip.endPlace)}
                      alt={getTripDisplayName(trip)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-lg mb-1">{getTripDisplayName(trip)}</h3>
                      <p className="text-white/80 text-sm flex items-center mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {trip.endPlace}
                      </p>
                      <p className="text-white/80 text-sm flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(trip.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Trips</h3>
                <p className="text-gray-600 mb-4">You haven't completed any trips yet. Start planning your first adventure!</p>
                <button
                  onClick={() => navigate('/plan-trip')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Plan Your First Trip
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Upcoming Trips Section */}
        {upcomingTrips.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Upcoming Trips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                  onClick={() => handleTripClick(trip._id)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getDestinationImage(trip.endPlace)}
                      alt={getTripDisplayName(trip)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Planned
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-lg mb-1">{getTripDisplayName(trip)}</h3>
                      <p className="text-white/80 text-sm flex items-center mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {trip.endPlace}
                      </p>
                      <p className="text-white/80 text-sm flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(trip.startDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ongoing Trips Section */}
        {ongoingTrips.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Ongoing Trips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                  onClick={() => handleTripClick(trip._id)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getDestinationImage(trip.endPlace)}
                      alt={getTripDisplayName(trip)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Ongoing
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-lg mb-1">{getTripDisplayName(trip)}</h3>
                      <p className="text-white/80 text-sm flex items-center mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {trip.endPlace}
                      </p>
                      <p className="text-white/80 text-sm flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Until {formatDate(trip.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plan a Trip CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => navigate('/plan-trip')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Plan a trip
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center"
            >
              <Calendar className="mr-2 h-5 w-5" />
              View Calendar
            </button>
          </div>
        </section>
      </div>

    </div>
  );
};

export default DashboardPage;

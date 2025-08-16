import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, Edit, Trash2, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import tripService from '../services/tripService';
import { getDestinationImage } from '../utils/destinationImages';
import { showSuccess, showError } from '../utils/toast';

const TripDetailsPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        const response = await tripService.getTripDetails(tripId);
        setTrip(response.trip);
      } catch (error) {
        console.error('Error fetching trip details:', error);
        showError('Failed to load trip details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTripDetails();
    }
  }, [tripId, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'ongoing':
        return 'bg-orange-500';
      case 'planned':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'ongoing':
        return <Clock className="h-4 w-4" />;
      case 'planned':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleDeleteTrip = async () => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripService.deleteTrip(tripId);
        showSuccess('Trip deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting trip:', error);
        showError('Failed to delete trip');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="flex items-center text-green-600 hover:text-green-700 mr-4"
              >
                <Calendar className="h-5 w-5 mr-2" />
                View Calendar
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/calendar')}
                className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-white border border-green-300 rounded-md hover:bg-green-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </button>
              <button
                onClick={() => navigate(`/trips/${tripId}/edit`)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDeleteTrip}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={getDestinationImage(trip.endPlace)}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{trip.title}</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)} text-white`}>
              {getStatusIcon(trip.status)}
              <span className="ml-2 capitalize">{trip.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Overview</h2>

              {trip.description && (
                <p className="text-gray-600 mb-6">{trip.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{trip.startPlace}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{trip.endPlace}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">{formatDate(trip.startDate)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">{formatDate(trip.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Travelers</p>
                    <p className="font-medium">{trip.travelers} {trip.travelers === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>

                {trip.budget && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium">₹{trip.budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stops */}
            {trip.stops && trip.stops.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Stops</h3>
                <div className="space-y-2">
                  {trip.stops.map((stop, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {trip.itinerary && trip.itinerary.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Itinerary</h3>
                <div className="space-y-4">
                  {trip.itinerary.map((day, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Day {index + 1}</h4>
                      {Array.isArray(day) ? (
                        <ul className="space-y-1">
                          {day.map((activity, activityIndex) => (
                            <li key={activityIndex} className="text-gray-600">• {activity}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">{day}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Summary</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Trip Type</p>
                  <p className="font-medium capitalize">{trip.tripType}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>

                {trip.totalCost > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="font-medium text-green-600">₹{trip.totalCost.toLocaleString()}</p>
                  </div>
                )}

                {trip.rating && (
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < trip.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({trip.rating}/5)</span>
                    </div>
                  </div>
                )}

                {trip.review && (
                  <div>
                    <p className="text-sm text-gray-500">Review</p>
                    <p className="text-sm text-gray-700 mt-1">{trip.review}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetailsPage;

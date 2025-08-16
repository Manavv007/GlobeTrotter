import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Star, Camera, Utensils, Car, Hotel, Plane } from 'lucide-react';
import toast from 'react-hot-toast';

const GoldenTrailAdventure = () => {
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);

  const handleBookPackage = async () => {
    setIsBooking(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to book this package');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5001/api/packages/book-golden-trail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          travelers: 2 // Default to 2 travelers, can be made dynamic
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Golden Trail Adventure booked successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to book package');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book package. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const itinerary = [
    {
      day: 1,
      location: "Delhi",
      title: "Arrival & Delhi Exploration",
      activities: [
        {
          time: "10:00 AM",
          name: "Airport Pickup & Hotel Check-in",
          description: "Comfortable transfer from Indira Gandhi International Airport to your luxury hotel",
          icon: <Plane className="h-4 w-4" />
        },
        {
          time: "2:00 PM",
          name: "Red Fort & Chandni Chowk",
          description: "Explore the magnificent Mughal architecture and bustling old market",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "6:00 PM",
          name: "India Gate & Connaught Place",
          description: "Evening stroll at the war memorial and shopping at CP",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "8:00 PM",
          name: "Welcome Dinner",
          description: "Traditional North Indian cuisine at Karim's Restaurant",
          icon: <Utensils className="h-4 w-4" />
        }
      ]
    },
    {
      day: 2,
      location: "Delhi",
      title: "Historical Delhi Tour",
      activities: [
        {
          time: "9:00 AM",
          name: "Qutub Minar Complex",
          description: "Visit the UNESCO World Heritage Site and tallest brick minaret",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "11:30 AM",
          name: "Humayun's Tomb",
          description: "Explore the precursor to the Taj Mahal's architecture",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "2:00 PM",
          name: "Lotus Temple",
          description: "Visit the stunning Bahá'í House of Worship",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "4:00 PM",
          name: "Akshardham Temple",
          description: "Marvel at the world's largest comprehensive Hindu temple",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "7:00 PM",
          name: "Cultural Show",
          description: "Traditional dance and music performance at Kingdom of Dreams",
          icon: <Star className="h-4 w-4" />
        }
      ]
    },
    {
      day: 3,
      location: "Delhi → Agra",
      title: "Journey to the City of Love",
      activities: [
        {
          time: "8:00 AM",
          name: "Departure to Agra",
          description: "Comfortable AC car journey via Yamuna Expressway (3.5 hours)",
          icon: <Car className="h-4 w-4" />
        },
        {
          time: "12:30 PM",
          name: "Hotel Check-in & Lunch",
          description: "Rest and traditional Mughlai lunch at hotel",
          icon: <Hotel className="h-4 w-4" />
        },
        {
          time: "3:00 PM",
          name: "Agra Fort",
          description: "Explore the red sandstone fortress and UNESCO World Heritage Site",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "5:30 PM",
          name: "Mehtab Bagh",
          description: "Sunset view of Taj Mahal from the moonlight garden",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "8:00 PM",
          name: "Local Cuisine Experience",
          description: "Dinner at Pinch of Spice with Agra specialties",
          icon: <Utensils className="h-4 w-4" />
        }
      ]
    },
    {
      day: 4,
      location: "Agra",
      title: "Taj Mahal & Local Crafts",
      activities: [
        {
          time: "6:00 AM",
          name: "Taj Mahal Sunrise",
          description: "Witness the changing colors of the marble monument at dawn",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "9:00 AM",
          name: "Breakfast at Hotel",
          description: "Return to hotel for hearty breakfast and rest",
          icon: <Utensils className="h-4 w-4" />
        },
        {
          time: "11:00 AM",
          name: "Marble Inlay Workshop",
          description: "Learn the art of pietra dura from local artisans",
          icon: <Star className="h-4 w-4" />
        },
        {
          time: "2:00 PM",
          name: "Itmad-ud-Daulah (Baby Taj)",
          description: "Visit the exquisite tomb often called the 'Jewel Box'",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "4:00 PM",
          name: "Agra Local Markets",
          description: "Shop for marble handicrafts, leather goods, and carpets",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "7:00 PM",
          name: "Cultural Evening",
          description: "Mohabbat The Taj show - a musical extravaganza",
          icon: <Star className="h-4 w-4" />
        }
      ]
    },
    {
      day: 5,
      location: "Agra → Jaipur",
      title: "Journey to the Pink City",
      activities: [
        {
          time: "9:00 AM",
          name: "Departure to Jaipur",
          description: "Scenic drive via Fatehpur Sikri (5 hours with sightseeing)",
          icon: <Car className="h-4 w-4" />
        },
        {
          time: "11:00 AM",
          name: "Fatehpur Sikri",
          description: "Explore the abandoned Mughal city and UNESCO World Heritage Site",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "1:00 PM",
          name: "Lunch En Route",
          description: "Traditional Rajasthani thali at a heritage restaurant",
          icon: <Utensils className="h-4 w-4" />
        },
        {
          time: "4:00 PM",
          name: "Arrival in Jaipur",
          description: "Check-in at heritage hotel in the Pink City",
          icon: <Hotel className="h-4 w-4" />
        },
        {
          time: "6:00 PM",
          name: "City Palace Complex",
          description: "Evening visit to the royal residence and museum",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "8:00 PM",
          name: "Rajasthani Folk Show",
          description: "Traditional dance and puppet show with dinner",
          icon: <Star className="h-4 w-4" />
        }
      ]
    },
    {
      day: 6,
      location: "Jaipur",
      title: "Royal Jaipur Experience",
      activities: [
        {
          time: "8:00 AM",
          name: "Amber Fort",
          description: "Elephant ride up to the hilltop fort (optional jeep ride available)",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "11:00 AM",
          name: "Hawa Mahal",
          description: "Photo stop at the iconic Palace of Winds",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "12:00 PM",
          name: "Jantar Mantar",
          description: "Explore the astronomical observatory and UNESCO site",
          icon: <Star className="h-4 w-4" />
        },
        {
          time: "2:00 PM",
          name: "Royal Lunch",
          description: "Traditional Rajasthani cuisine at 1135 AD restaurant",
          icon: <Utensils className="h-4 w-4" />
        },
        {
          time: "4:00 PM",
          name: "Jaigarh Fort",
          description: "Visit the fort housing the world's largest wheeled cannon",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "6:00 PM",
          name: "Johari Bazaar Shopping",
          description: "Shop for jewelry, textiles, and handicrafts in the famous market",
          icon: <MapPin className="h-4 w-4" />
        },
        {
          time: "8:00 PM",
          name: "Farewell Dinner",
          description: "Rooftop dinner with city views at Peacock Rooftop Restaurant",
          icon: <Utensils className="h-4 w-4" />
        }
      ]
    },
    {
      day: 7,
      location: "Jaipur → Delhi",
      title: "Departure Day",
      activities: [
        {
          time: "9:00 AM",
          name: "Hotel Check-out",
          description: "Leisurely breakfast and check-out from heritage hotel",
          icon: <Hotel className="h-4 w-4" />
        },
        {
          time: "10:00 AM",
          name: "Albert Hall Museum",
          description: "Quick visit to the oldest museum in Rajasthan (optional)",
          icon: <Camera className="h-4 w-4" />
        },
        {
          time: "12:00 PM",
          name: "Journey to Delhi",
          description: "Comfortable drive back to Delhi (5.5 hours)",
          icon: <Car className="h-4 w-4" />
        },
        {
          time: "6:00 PM",
          name: "Delhi Airport Drop",
          description: "Transfer to Indira Gandhi International Airport for departure",
          icon: <Plane className="h-4 w-4" />
        }
      ]
    }
  ];

  const packageInclusions = [
    "6 nights accommodation in 4-star heritage hotels",
    "Daily breakfast and 4 lunches, 3 dinners",
    "AC car with experienced driver for all transfers",
    "Professional English-speaking guide",
    "All monument entrance fees",
    "Cultural shows and experiences",
    "Airport transfers"
  ];

  const packageExclusions = [
    "International/domestic flights",
    "Personal expenses and tips",
    "Travel insurance",
    "Elephant ride at Amber Fort (₹1,200 extra)",
    "Camera fees at monuments",
    "Any meals not mentioned in inclusions"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Trip Details
            </button>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
          alt="Golden Trail Adventure"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Golden Trail Adventure</h1>
            <p className="text-xl md:text-2xl mb-6">Delhi → Agra → Jaipur</p>
            <div className="flex flex-wrap justify-center gap-6 text-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                7 Days / 6 Nights
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                2-6 People
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                From ₹25,999
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Itinerary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Itinerary</h2>
              
              <div className="space-y-8">
                {itinerary.map((day, index) => (
                  <div key={index} className="border-l-4 border-amber-500 pl-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{day.title}</h3>
                        <p className="text-amber-600 font-medium">{day.location}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 ml-14">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-start bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mr-4">
                            <Clock className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-600">{activity.time}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              {activity.icon}
                              <h4 className="font-semibold text-gray-900 ml-2">{activity.name}</h4>
                            </div>
                            <p className="text-gray-600 text-sm">{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Package Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Package Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">7 Days / 6 Nights</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cities</span>
                  <span className="font-medium">3 Cities</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Group Size</span>
                  <span className="font-medium">2-6 People</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-bold text-green-600 text-lg">₹25,999</span>
                </div>
                
                <div className="flex items-center justify-center pt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">(4.8/5) 124 reviews</span>
                </div>
              </div>
              
              <button 
                onClick={handleBookPackage}
                disabled={isBooking}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 mt-6"
              >
                {isBooking ? 'Booking...' : 'Book This Package'}
              </button>
            </div>

            {/* Inclusions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Package Includes</h3>
              <ul className="space-y-2">
                {packageInclusions.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Not Included</h3>
              <ul className="space-y-2">
                {packageExclusions.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldenTrailAdventure;

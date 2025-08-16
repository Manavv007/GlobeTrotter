const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authenticateToken } = require('../middleware/auth');

// Book the Golden Trail Adventure package
router.post('/book-golden-trail', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Golden Trail Adventure package data
    const goldenTrailData = {
      userId: userId,
      title: "Golden Trail Adventure",
      description: "Experience the magnificent Golden Triangle - Delhi, Agra, and Jaipur in a comprehensive 7-day journey through India's most iconic destinations.",
      startPlace: "Delhi, India",
      endPlace: "Delhi, India",
      stops: ["Agra, Uttar Pradesh, India", "Jaipur, Rajasthan, India"],
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), // 13 days from now (7 day trip)
      travelers: req.body.travelers || 2,
      budget: 25999,
      tripType: 'cultural',
      status: 'planned',
      totalCost: 25999,
      itinerary: [
        {
          day: 1,
          location: "Delhi",
          title: "Arrival & Delhi Exploration",
          activities: [
            {
              time: "10:00 AM",
              name: "Airport Pickup & Hotel Check-in",
              description: "Comfortable transfer from Indira Gandhi International Airport to your luxury hotel"
            },
            {
              time: "2:00 PM",
              name: "Red Fort & Chandni Chowk",
              description: "Explore the magnificent Mughal architecture and bustling old market"
            },
            {
              time: "6:00 PM",
              name: "India Gate & Connaught Place",
              description: "Evening stroll at the war memorial and shopping at CP"
            },
            {
              time: "8:00 PM",
              name: "Welcome Dinner",
              description: "Traditional North Indian cuisine at Karim's Restaurant"
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
              description: "Visit the UNESCO World Heritage Site and tallest brick minaret"
            },
            {
              time: "11:30 AM",
              name: "Humayun's Tomb",
              description: "Explore the precursor to the Taj Mahal's architecture"
            },
            {
              time: "2:00 PM",
              name: "Lotus Temple",
              description: "Visit the stunning Bahá'í House of Worship"
            },
            {
              time: "4:00 PM",
              name: "Akshardham Temple",
              description: "Marvel at the world's largest comprehensive Hindu temple"
            },
            {
              time: "7:00 PM",
              name: "Cultural Show",
              description: "Traditional dance and music performance at Kingdom of Dreams"
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
              description: "Comfortable AC car journey via Yamuna Expressway (3.5 hours)"
            },
            {
              time: "12:30 PM",
              name: "Hotel Check-in & Lunch",
              description: "Rest and traditional Mughlai lunch at hotel"
            },
            {
              time: "3:00 PM",
              name: "Agra Fort",
              description: "Explore the red sandstone fortress and UNESCO World Heritage Site"
            },
            {
              time: "5:30 PM",
              name: "Mehtab Bagh",
              description: "Sunset view of Taj Mahal from the moonlight garden"
            },
            {
              time: "8:00 PM",
              name: "Local Cuisine Experience",
              description: "Dinner at Pinch of Spice with Agra specialties"
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
              description: "Witness the changing colors of the marble monument at dawn"
            },
            {
              time: "9:00 AM",
              name: "Breakfast at Hotel",
              description: "Return to hotel for hearty breakfast and rest"
            },
            {
              time: "11:00 AM",
              name: "Marble Inlay Workshop",
              description: "Learn the art of pietra dura from local artisans"
            },
            {
              time: "2:00 PM",
              name: "Itmad-ud-Daulah (Baby Taj)",
              description: "Visit the exquisite tomb often called the 'Jewel Box'"
            },
            {
              time: "4:00 PM",
              name: "Agra Local Markets",
              description: "Shop for marble handicrafts, leather goods, and carpets"
            },
            {
              time: "7:00 PM",
              name: "Cultural Evening",
              description: "Mohabbat The Taj show - a musical extravaganza"
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
              description: "Scenic drive via Fatehpur Sikri (5 hours with sightseeing)"
            },
            {
              time: "11:00 AM",
              name: "Fatehpur Sikri",
              description: "Explore the abandoned Mughal city and UNESCO World Heritage Site"
            },
            {
              time: "1:00 PM",
              name: "Lunch En Route",
              description: "Traditional Rajasthani thali at a heritage restaurant"
            },
            {
              time: "4:00 PM",
              name: "Arrival in Jaipur",
              description: "Check-in at heritage hotel in the Pink City"
            },
            {
              time: "6:00 PM",
              name: "City Palace Complex",
              description: "Evening visit to the royal residence and museum"
            },
            {
              time: "8:00 PM",
              name: "Rajasthani Folk Show",
              description: "Traditional dance and puppet show with dinner"
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
              description: "Elephant ride up to the hilltop fort (optional jeep ride available)"
            },
            {
              time: "11:00 AM",
              name: "Hawa Mahal",
              description: "Photo stop at the iconic Palace of Winds"
            },
            {
              time: "12:00 PM",
              name: "Jantar Mantar",
              description: "Explore the astronomical observatory and UNESCO site"
            },
            {
              time: "2:00 PM",
              name: "Royal Lunch",
              description: "Traditional Rajasthani cuisine at 1135 AD restaurant"
            },
            {
              time: "4:00 PM",
              name: "Jaigarh Fort",
              description: "Visit the fort housing the world's largest wheeled cannon"
            },
            {
              time: "6:00 PM",
              name: "Johari Bazaar Shopping",
              description: "Shop for jewelry, textiles, and handicrafts in the famous market"
            },
            {
              time: "8:00 PM",
              name: "Farewell Dinner",
              description: "Rooftop dinner with city views at Peacock Rooftop Restaurant"
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
              description: "Leisurely breakfast and check-out from heritage hotel"
            },
            {
              time: "10:00 AM",
              name: "Albert Hall Museum",
              description: "Quick visit to the oldest museum in Rajasthan (optional)"
            },
            {
              time: "12:00 PM",
              name: "Journey to Delhi",
              description: "Comfortable drive back to Delhi (5.5 hours)"
            },
            {
              time: "6:00 PM",
              name: "Delhi Airport Drop",
              description: "Transfer to Indira Gandhi International Airport for departure"
            }
          ]
        }
      ],
      attractions: [
        {
          name: "Taj Mahal",
          location: "Agra",
          type: "Historical Monument",
          rating: 4.9,
          description: "One of the Seven Wonders of the World"
        },
        {
          name: "Red Fort",
          location: "Delhi",
          type: "Historical Monument", 
          rating: 4.5,
          description: "Mughal fortress and UNESCO World Heritage Site"
        },
        {
          name: "Amber Fort",
          location: "Jaipur",
          type: "Historical Monument",
          rating: 4.7,
          description: "Hilltop fort with stunning architecture"
        },
        {
          name: "Hawa Mahal",
          location: "Jaipur",
          type: "Palace",
          rating: 4.4,
          description: "Iconic Palace of Winds"
        }
      ],
      hotelOptions: [
        {
          name: "The Imperial, New Delhi",
          location: "Delhi",
          rating: 4.8,
          price: 8500,
          amenities: ["WiFi", "Pool", "Spa", "Restaurant"]
        },
        {
          name: "ITC Mughal, Agra",
          location: "Agra", 
          rating: 4.6,
          price: 7200,
          amenities: ["WiFi", "Pool", "Restaurant", "Garden"]
        },
        {
          name: "Rambagh Palace, Jaipur",
          location: "Jaipur",
          rating: 4.9,
          price: 12000,
          amenities: ["WiFi", "Pool", "Spa", "Heritage", "Restaurant"]
        }
      ],
      notes: "This is a pre-planned Golden Trail Adventure package featuring India's Golden Triangle. All accommodations, meals, and transportation are included as per the itinerary.",
      isPublic: false
    };

    // Create the trip
    const newTrip = new Trip(goldenTrailData);
    await newTrip.save();

    res.status(201).json({
      success: true,
      message: 'Golden Trail Adventure package booked successfully!',
      trip: newTrip.getSummary()
    });

  } catch (error) {
    console.error('Error booking Golden Trail Adventure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book package. Please try again.'
    });
  }
});

module.exports = router;

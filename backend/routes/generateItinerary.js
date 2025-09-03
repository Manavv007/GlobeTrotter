const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config({ path: './config.env' });
const { getLocationAttractions, getUniquePlaces } = require('../utils/googlePlaces');

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

/**
 * Generate a structured itinerary in the specified JSON format
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} startingPlace - Starting place name
 * @param {string} destinationPlace - Destination place name
 * @param {Array} attractions - Array of attraction objects from Google Places API
 * @returns {Object} - Structured itinerary in the specified format
 */
function generateStructuredItinerary(startDate, endDate, startingPlace, destinationPlace, attractions) {
  // Calculate trip duration
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Distribute attractions evenly across days
  const attractionsPerDay = Math.ceil(attractions.length / totalDays);

  // Create itinerary structure
  const itinerary = [];
  const usedAttractions = [];

  for (let day = 1; day <= totalDays; day++) {
    const startIndex = (day - 1) * attractionsPerDay;
    const endIndex = Math.min(startIndex + attractionsPerDay, attractions.length);
    const dayAttractions = attractions.slice(startIndex, endIndex);

    const locations = dayAttractions.map((attraction, index) => {
      // Calculate travel time (assume 30-60 minutes between locations)
      const travelTime = index === 0 ? 0 : Math.floor(Math.random() * 30) + 30;

      // Determine best time to visit based on attraction type
      let bestTimeToVisit = "9 AM - 12 PM";
      if (attraction.types && attraction.types.includes('park')) {
        bestTimeToVisit = "6 AM - 9 AM";
      } else if (attraction.types && attraction.types.includes('museum')) {
        bestTimeToVisit = "10 AM - 4 PM";
      } else if (attraction.types && attraction.types.includes('shopping')) {
        bestTimeToVisit = "11 AM - 8 PM";
      }

      // Estimate ticket pricing based on attraction type and rating
      let ticketPricing = 100; // Default
      if (attraction.rating >= 4.5) {
        ticketPricing = 200;
      } else if (attraction.rating >= 4.0) {
        ticketPricing = 150;
      } else {
        ticketPricing = 100;
      }

      // Free for parks and some cultural sites
      if (attraction.types && (attraction.types.includes('park') || attraction.types.includes('temple'))) {
        ticketPricing = 0;
      }

      return {
        placeName: attraction.name,
        placeDetails: `${attraction.types ? attraction.types[0].replace(/_/g, ' ') : 'Tourist attraction'} in ${destinationPlace}. ${attraction.rating ? `Rated ${attraction.rating}/5.` : ''}`,
        placeImagesURL: attraction.photo_url || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
        geoCoordinates: {
          lat: attraction.location?.latitude || 0,
          lng: attraction.location?.longitude || 0
        },
        ticketPricing: ticketPricing,
        bestTimeToVisit: bestTimeToVisit,
        travelTimeFromPreviousLocation: travelTime
      };
    });

    itinerary.push({
      day: day,
      locations: locations
    });
  }

  return {
    startDate: startDate,
    endDate: endDate,
    startingPlace: {
      name: startingPlace,
      geoCoordinates: { lat: 0, lng: 0 } // Would need geocoding for actual coordinates
    },
    destination: {
      name: destinationPlace,
      geoCoordinates: { lat: 0, lng: 0 }, // Would need geocoding for actual coordinates
      rating: attractions.length > 0 ? attractions[0].rating || 4.0 : 4.0
    },
    itinerary: itinerary
  };
}



/**
 * Generate a dynamic itinerary using Google Places API data
 * @param {Array} cities - Array of cities to visit
 * @param {number} totalDays - Total number of days
 * @returns {Promise<Object>} - Generated itinerary
 */
async function generateDynamicItinerary(cities, totalDays) {
  console.log(`Generating itinerary for ${totalDays} days across ${cities.length} cities`);

  // Calculate attractions needed per day (default 3, but can be adjusted based on trip type)
  const attractionsPerDay = 3;
  const totalAttractionsNeeded = totalDays * attractionsPerDay;

  console.log(`Need ${totalAttractionsNeeded} total attractions (${attractionsPerDay} per day)`);

  // Pre-fetch attractions for all cities with enough capacity
  console.log('Pre-fetching attractions for all cities...');
  const cityAttractions = {};
  const allAttractions = [];

  for (const city of cities) {
    try {
      // Fetch more attractions per city to ensure we have enough
      const attractionsPerCity = Math.ceil(totalAttractionsNeeded / cities.length) + 5; // Add buffer
      const attractions = await getLocationAttractions(city, attractionsPerCity);
      cityAttractions[city] = attractions;
      console.log(`✅ Found ${attractions.length} attractions for ${city}`);

      // Add city prefix to attractions for better organization
      const cityAttractionsWithLocation = attractions.map(attraction => ({
        ...attraction,
        city: city
      }));
      allAttractions.push(...cityAttractionsWithLocation);
    } catch (error) {
      console.log(`⚠️ Failed to get attractions for ${city}:`, error.message);
      cityAttractions[city] = [];
    }
  }

  console.log(`Total attractions available: ${allAttractions.length}`);

  // If we don't have enough attractions, try to get more with larger radius
  if (allAttractions.length < totalAttractionsNeeded) {
    console.log(`⚠️ Only ${allAttractions.length} attractions found, need ${totalAttractionsNeeded}. Trying to get more...`);

    // Try to get more attractions from each city with larger radius
    for (const city of cities) {
      try {
        const additionalAttractions = await getLocationAttractions(city, totalAttractionsNeeded);
        const newAttractions = additionalAttractions.filter(newAttraction =>
          !allAttractions.some(existing => existing.name === newAttraction.name)
        );

        if (newAttractions.length > 0) {
          const cityAttractionsWithLocation = newAttractions.map(attraction => ({
            ...attraction,
            city: city
          }));
          allAttractions.push(...cityAttractionsWithLocation);
          console.log(`✅ Added ${newAttractions.length} more attractions for ${city}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to get additional attractions for ${city}:`, error.message);
      }
    }
  }

  // If still not enough attractions, create some fallback ones
  if (allAttractions.length < totalAttractionsNeeded) {
    console.log(`⚠️ Still only ${allAttractions.length} attractions. Creating fallback attractions...`);

    const fallbackNeeded = totalAttractionsNeeded - allAttractions.length;
    const fallbackPerCity = Math.ceil(fallbackNeeded / cities.length);

    for (const city of cities) {
      const fallbackAttractions = [
        {
          name: `${city} City Tour`,
          city: city,
          rating: 4.0,
          types: ['tourist_attraction'],
          price_level: 2,
          location: { address: `${city}, India` },
          place_id: `fallback_${city}_city_tour`
        },
        {
          name: `${city} Local Market`,
          city: city,
          rating: 3.8,
          types: ['shopping'],
          price_level: 1,
          location: { address: `${city}, India` },
          place_id: `fallback_${city}_market`
        },
        {
          name: `${city} Historical Site`,
          city: city,
          rating: 4.2,
          types: ['historic'],
          price_level: 1,
          location: { address: `${city}, India` },
          place_id: `fallback_${city}_historic`
        },
        {
          name: `${city} Cultural Center`,
          city: city,
          rating: 4.1,
          types: ['cultural'],
          price_level: 2,
          location: { address: `${city}, India` },
          place_id: `fallback_${city}_cultural`
        },
        {
          name: `${city} Nature Park`,
          city: city,
          rating: 4.0,
          types: ['park'],
          price_level: 1,
          location: { address: `${city}, India` },
          place_id: `fallback_${city}_park`
        }
      ];

      const cityFallbacks = fallbackAttractions.slice(0, fallbackPerCity);
      allAttractions.push(...cityFallbacks);
      console.log(`✅ Added ${cityFallbacks.length} fallback attractions for ${city}`);
    }
  }

  // Create location-based progression itinerary
  console.log(`Creating location-based progression itinerary for ${totalDays} days`);
  console.log(`Cities in order: ${cities.join(' → ')}`);

  const trip = [];
  const usedPlaces = [];

  // Calculate days per location for proper progression
  // For stops, we need to ensure they appear in the middle of the itinerary
  const daysPerLocation = Math.floor(totalDays / cities.length);
  const remainingDays = totalDays % cities.length;

  console.log(`Base days per location: ${daysPerLocation}, Remaining days: ${remainingDays}`);

  // Create day-to-city mapping for proper progression
  const dayToCityMapping = [];
  let currentDay = 1;

  for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
    const city = cities[cityIndex];
    const daysForThisCity = daysPerLocation + (cityIndex < remainingDays ? 1 : 0);

    console.log(`${city}: ${daysForThisCity} days (days ${currentDay} to ${currentDay + daysForThisCity - 1})`);

    for (let dayOffset = 0; dayOffset < daysForThisCity; dayOffset++) {
      dayToCityMapping[currentDay + dayOffset - 1] = city;
    }

    currentDay += daysForThisCity;
  }

  for (let day = 1; day <= totalDays; day++) {
    // Get the city for this specific day from our mapping
    const currentCity = dayToCityMapping[day - 1];
    const cityIndex = cities.indexOf(currentCity);

    console.log(`Day ${day}: Allocated to ${currentCity} (city index: ${cityIndex})`);

    // Get attractions for the current city
    const cityAttractionsList = cityAttractions[currentCity] || [];

    // Get unique places for this day from the current city, avoiding duplicates
    const availableAttractions = cityAttractionsList.filter(attraction =>
      !usedPlaces.some(used => used.toLowerCase().includes(attraction.name.toLowerCase()))
    );

    // If we don't have enough attractions for this city, create fallback ones
    let dayAttractions = availableAttractions.slice(0, attractionsPerDay);

    if (dayAttractions.length < attractionsPerDay) {
      const fallbackNeeded = attractionsPerDay - dayAttractions.length;
      const fallbackAttractions = [
        {
          name: `${currentCity} City Tour`,
          city: currentCity,
          rating: 4.0,
          types: ['tourist_attraction'],
          price_level: 2,
          location: { address: `${currentCity}, India` },
          place_id: `fallback_${currentCity}_city_tour_${day}`
        },
        {
          name: `${currentCity} Local Market`,
          city: currentCity,
          rating: 3.8,
          types: ['shopping'],
          price_level: 1,
          location: { address: `${currentCity}, India` },
          place_id: `fallback_${currentCity}_market_${day}`
        },
        {
          name: `${currentCity} Historical Site`,
          city: currentCity,
          rating: 4.2,
          types: ['historic'],
          price_level: 1,
          location: { address: `${currentCity}, India` },
          place_id: `fallback_${currentCity}_historic_${day}`
        },
        {
          name: `${currentCity} Cultural Center`,
          city: currentCity,
          rating: 4.1,
          types: ['cultural'],
          price_level: 2,
          location: { address: `${currentCity}, India` },
          place_id: `fallback_${currentCity}_cultural_${day}`
        },
        {
          name: `${currentCity} Nature Park`,
          city: currentCity,
          rating: 4.0,
          types: ['park'],
          price_level: 1,
          location: { address: `${currentCity}, India` },
          place_id: `fallback_${currentCity}_park_${day}`
        }
      ];

      // Add fallback attractions that haven't been used yet
      const unusedFallbacks = fallbackAttractions.filter(fallback =>
        !usedPlaces.some(used => used.toLowerCase().includes(fallback.name.toLowerCase()))
      );

      dayAttractions = [...dayAttractions, ...unusedFallbacks.slice(0, fallbackNeeded)];
    }

    if (dayAttractions.length > 0) {
      // Convert places to activities
      const activities = dayAttractions.map((place, index) => {
        const times = ['09:00 AM', '11:30 AM', '03:00 PM', '05:30 PM', '07:00 PM'];
        const category = place.types?.[0]?.replace(/_/g, ' ') || 'Tourist Attraction';

        // Add to used places to avoid duplicates
        usedPlaces.push(place.name);

        // Determine cost based on price level
        let cost = '₹200';
        if (place.price_level === 1) cost = '₹100';
        else if (place.price_level === 2) cost = '₹300';
        else if (place.price_level === 3) cost = '₹500';
        else if (place.price_level === 4) cost = '₹800';

        return {
          name: place.name,
          time: times[index] || '02:00 PM',
          description: `${category} in ${place.city || 'the city'}. ${place.opening_hours ? 'Check opening hours before visiting.' : 'A popular destination for visitors.'}`,
          cost: cost,
          category: category,
          rating: place.rating,
          latitude: place.location?.latitude,
          longitude: place.location?.longitude,
          photo_url: place.photo_url,
          address: place.location?.address,
          website: place.website,
          phone: place.phone,
          opening_hours: place.opening_hours
        };
      });

      trip.push({
        day,
        location: currentCity,
        activities: activities
      });
    } else {
      // Fallback activities if no attractions available
      const fallbackActivities = [
        {
          name: `${currentCity} City Tour`,
          time: '09:00 AM',
          description: `Explore the main attractions of ${currentCity}`,
          cost: '₹200',
          category: 'Tourist Attraction'
        },
        {
          name: `${currentCity} Local Market`,
          time: '11:30 AM',
          description: `Experience local culture and shopping in ${currentCity}`,
          cost: '₹150',
          category: 'Shopping'
        },
        {
          name: `${currentCity} Historical Site`,
          time: '03:00 PM',
          description: `Visit important historical landmarks in ${currentCity}`,
          cost: '₹100',
          category: 'Monument'
        }
      ];

      trip.push({
        day,
        location: currentCity,
        activities: fallbackActivities
      });
    }
  }

  console.log(`✅ Generated itinerary with ${trip.length} days`);
  return { totalDays, trip };
}

/**
 * Call Gemini API to generate intelligent itinerary
 * @param {string} prompt - The prompt for Gemini
 * @returns {Promise<Object>} - Parsed JSON response from Gemini
 */
async function callGemini(prompt) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const response = await axios.post(`${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000
      }
    }, {
      headers: { "Content-Type": "application/json" }
    });

    const json = response.data;

    // Extract text content from Gemini response
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!text) {
      throw new Error("No textual output found from Gemini: " + JSON.stringify(json).slice(0, 500));
    }

    // Parse JSON from Gemini response
    const cleaned = text.trim();
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");

    let jsonStr;
    if (firstBracket >= 0 && (firstBracket < firstBrace || firstBrace === -1)) {
      jsonStr = cleaned.slice(firstBracket);
    } else if (firstBrace >= 0) {
      jsonStr = cleaned.slice(firstBrace);
    } else {
      throw new Error("No JSON structure found in Gemini response");
    }

    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.error("Gemini API call error:", err);
    throw err;
  }
}



/**
 * Calculate trip duration in days from start and end dates
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {number} - Number of days
 */
function calculateTripDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }

  // Check if start date is in the past
  if (start < today) {
    throw new Error('Start date cannot be in the past');
  }

  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (days <= 0) {
    throw new Error('End date must be after start date');
  }

  if (days > 6) {
    throw new Error('Trip duration cannot exceed 6 days');
  }

  return days;
}

/**
 * Get tourist attractions for a specific location
 * POST /api/itinerary/attractions
 */
router.post('/attractions', authenticateToken, async (req, res) => {
  try {
    const { location, startDate, endDate } = req.body;

    // Validate required fields
    if (!location) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "location is required"
      });
    }

    console.log(`🔍 Fetching tourist attractions for ${location}...`);

    // Get attractions for the location
    const attractions = await getLocationAttractions(location, 20); // Get more attractions for comprehensive list

    if (attractions.length === 0) {
      return res.json({
        message: `No tourist places found in ${location} for the given dates.`,
        attractions: []
      });
    }

    // Format attractions in the requested JSON structure
    const formattedAttractions = attractions.map(attraction => ({
      name: attraction.name,
      description: `${attraction.types ? attraction.types[0].replace(/_/g, ' ') : 'Tourist attraction'}${attraction.rating ? ` (Rated ${attraction.rating}/5)` : ''}. ${attraction.location?.address ? `Located at ${attraction.location.address}` : ''}`,
      location: attraction.location?.address || `${attraction.name}, ${location}`
    }));

    res.json({
      message: `Found ${formattedAttractions.length} tourist places in ${location}`,
      attractions: formattedAttractions
    });

  } catch (error) {
    console.error('Attractions fetch error:', error);
    res.status(500).json({
      error: "attractions_fetch_failed",
      message: "Failed to fetch attractions. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate structured itinerary endpoint
 * POST /api/itinerary/structured
 */
router.post('/structured', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, startingPlace, destinationPlace } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !startingPlace || !destinationPlace) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "startDate, endDate, startingPlace, and destinationPlace are required"
      });
    }

    // Get attractions for the destination
    console.log(`Fetching attractions for ${destinationPlace}...`);
    const attractions = await getLocationAttractions(destinationPlace, 15); // Get more attractions for better distribution

    if (attractions.length === 0) {
      return res.status(404).json({
        error: "No attractions found",
        message: `No attractions found for ${destinationPlace}`
      });
    }

    // Generate structured itinerary
    const structuredItinerary = generateStructuredItinerary(
      startDate,
      endDate,
      startingPlace,
      destinationPlace,
      attractions
    );

    res.json(structuredItinerary);

  } catch (error) {
    console.error('Structured itinerary generation error:', error);
    res.status(500).json({
      error: "itinerary_generation_failed",
      message: "Failed to generate structured itinerary. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate itinerary endpoint
 * POST /api/itinerary/generate
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { startPlace, endPlace, stops = [], startDate, endDate } = req.body;

    // Validate required fields
    if (!startPlace || !endPlace || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "startPlace, endPlace, startDate, and endDate are required"
      });
    }

    // Calculate trip duration
    let totalDays;
    try {
      totalDays = calculateTripDuration(startDate, endDate);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid dates",
        message: error.message
      });
    }

    // Get all unique cities for the trip
    const allCities = [startPlace, ...stops, endPlace].filter((city, index, arr) =>
      arr.indexOf(city) === index && city.trim() !== ''
    );

    console.log(`Generating itinerary for ${totalDays} days: ${allCities.join(' → ')}`);

    // Generate dynamic itinerary using Google Places API data
    let itineraryResponse;
    try {
      console.log('Generating dynamic itinerary with Google Places data...');
      itineraryResponse = await generateDynamicItinerary(allCities, totalDays);
      console.log('✅ Dynamic itinerary generated successfully');
    } catch (error) {
      console.log('⚠️ Dynamic generation failed, using basic itinerary');
      console.log('Error:', error.message);

      // Fallback to basic itinerary
      itineraryResponse = {
        totalDays,
        trip: allCities.map((city, index) => ({
          day: index + 1,
          location: city,
          activities: [
            {
              name: `${city} City Tour`,
              time: '09:00 AM',
              description: `Explore the main attractions of ${city}`,
              cost: '₹200',
              category: 'Tourist Attraction'
            },
            {
              name: `${city} Local Market`,
              time: '11:30 AM',
              description: `Experience local culture and shopping in ${city}`,
              cost: '₹150',
              category: 'Shopping'
            },
            {
              name: `${city} Historical Site`,
              time: '03:00 PM',
              description: `Visit important historical landmarks in ${city}`,
              cost: '₹100',
              category: 'Monument'
            }
          ]
        }))
      };
    }

    // Return successful response
    res.json({
      totalDays,
      trip: itineraryResponse.trip,
      source: 'google_places'
    });

  } catch (error) {
    console.error('Itinerary generation error:', error);
    res.status(500).json({
      error: "itinerary_generation_failed",
      message: "Failed to generate itinerary. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});



module.exports = router;

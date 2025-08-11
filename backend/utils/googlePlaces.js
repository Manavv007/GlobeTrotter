require('dotenv').config({ path: './config.env' });
const axios = require('axios');

/**
 * Get coordinates for a location using Google Geocoding API
 * @param {string} address - The address/location to geocode
 * @returns {Promise<Object>} - Object with latitude and longitude
 */
async function getCoordinates(address) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(geocodeUrl);
    const data = response.data;

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed for ${address}: ${data.status}`);
    }

    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: data.results[0].formatted_address
    };
  } catch (error) {
    console.error(`Geocoding error for ${address}:`, error.message);
    throw error;
  }
}

/**
 * Search for tourist attractions near coordinates using Google Places API with pagination
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} radius - Search radius in meters (default: 5000)
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} - Array of place objects
 */
async function searchNearbyAttractions(latitude, longitude, radius = 5000, limit = 5) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    let allResults = [];
    let nextPageToken = null;
    let attempts = 0;
    const maxAttempts = 3; // Google allows up to 3 pages (60 results total)

    do {
      let nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=tourist_attraction&key=${process.env.GOOGLE_MAPS_API_KEY}`;

      if (nextPageToken) {
        nearbyUrl += `&pagetoken=${nextPageToken}`;
      }

      const response = await axios.get(nearbyUrl);
      const data = response.data;

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API failed: ${data.status}`);
      }

      if (data.results && data.results.length > 0) {
        allResults.push(...data.results);
      }

      nextPageToken = data.next_page_token;
      attempts++;

      // If there's a next page token, wait a bit before making the next request
      // Google requires a short delay between pagination requests
      if (nextPageToken && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (nextPageToken && attempts < maxAttempts && allResults.length < limit);

    // Sort by rating (highest first) and limit results
    const sortedResults = allResults
      .filter(place => place.rating) // Only include places with ratings
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    console.log(`Found ${sortedResults.length} attractions (from ${allResults.length} total results)`);
    return sortedResults;
  } catch (error) {
    console.error(`Places API error for ${latitude},${longitude}:`, error.message);
    throw error;
  }
}

/**
 * Get detailed information about a place using Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Detailed place information
 */
async function getPlaceDetails(placeId) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,opening_hours,photos,types,website,formatted_phone_number&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(detailsUrl);
    const data = response.data;

    if (data.status !== 'OK') {
      throw new Error(`Place Details API failed: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    console.error(`Place Details API error for ${placeId}:`, error.message);
    throw error;
  }
}

/**
 * Get photo URL for a place using Google Place Photos API
 * @param {string} photoReference - Photo reference from place details
 * @param {number} maxWidth - Maximum width of the photo (default: 400)
 * @returns {string} - Photo URL
 */
function getPlacePhotoUrl(photoReference, maxWidth = 400) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return null;
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
}

/**
 * Get comprehensive place information for a location
 * @param {string} locationName - Name of the location
 * @param {number} limit - Maximum number of attractions to return (default: 5)
 * @returns {Promise<Array>} - Array of detailed place objects
 */
async function getLocationAttractions(locationName, limit = 5) {
  try {
    // Step 1: Get coordinates
    console.log(`Getting coordinates for ${locationName}...`);
    const coords = await getCoordinates(locationName);

    // Step 2: Search for nearby attractions with larger radius if needed
    console.log(`Searching for attractions near ${locationName}...`);
    let attractions = await searchNearbyAttractions(coords.latitude, coords.longitude, 5000, limit);

    // If we don't have enough attractions, try with larger radius
    if (attractions.length < limit) {
      console.log(`Only found ${attractions.length} attractions, trying with larger radius...`);
      const largerRadiusAttractions = await searchNearbyAttractions(coords.latitude, coords.longitude, 10000, limit);

      // Merge and deduplicate attractions
      const allAttractions = [...attractions, ...largerRadiusAttractions];
      const uniqueAttractions = allAttractions.filter((attraction, index, self) =>
        index === self.findIndex(a => a.place_id === attraction.place_id)
      );

      attractions = uniqueAttractions.slice(0, limit);
      console.log(`After larger radius search: ${attractions.length} attractions`);
    }

    if (attractions.length === 0) {
      console.log(`No attractions found for ${locationName}`);
      return [];
    }

    // Step 3: Get detailed information for each attraction
    console.log(`Getting details for ${attractions.length} attractions in ${locationName}...`);
    const detailedAttractions = await Promise.all(
      attractions.map(async (attraction) => {
        try {
          const details = await getPlaceDetails(attraction.place_id);

          // Get photo URL if available
          let photoUrl = null;
          if (details.photos && details.photos.length > 0) {
            photoUrl = getPlacePhotoUrl(details.photos[0].photo_reference);
          }

          return {
            name: details.name || attraction.name,
            place_id: attraction.place_id,
            location: {
              latitude: attraction.geometry.location.lat,
              longitude: attraction.geometry.location.lng,
              address: details.formatted_address || attraction.vicinity
            },
            rating: details.rating || attraction.rating,
            types: details.types || attraction.types,
            opening_hours: details.opening_hours?.weekday_text || null,
            website: details.website || null,
            phone: details.formatted_phone_number || null,
            photo_url: photoUrl,
            price_level: attraction.price_level || null
          };
        } catch (error) {
          console.log(`Failed to get details for ${attraction.name}:`, error.message);
          // Return basic attraction info if details fail
          return {
            name: attraction.name,
            place_id: attraction.place_id,
            location: {
              latitude: attraction.geometry.location.lat,
              longitude: attraction.geometry.location.lng,
              address: attraction.vicinity
            },
            rating: attraction.rating,
            types: attraction.types,
            opening_hours: null,
            website: null,
            phone: null,
            photo_url: null,
            price_level: attraction.price_level || null
          };
        }
      })
    );

    return detailedAttractions;
  } catch (error) {
    console.error(`Error getting attractions for ${locationName}:`, error.message);
    // Return fallback attractions when Google API fails
    return getFallbackAttractions(locationName, limit);
  }
}

/**
 * Get fallback attractions when Google API is not available
 * @param {string} locationName - Name of the location
 * @param {number} limit - Maximum number of attractions to return
 * @returns {Array} - Array of fallback attraction objects
 */
function getFallbackAttractions(locationName, limit = 5) {
  console.log(`Using fallback attractions for ${locationName}`);

  const fallbackAttractions = {
    'Ahmedabad': [
      { name: 'Sabarmati Ashram', rating: 4.5, types: ['tourist_attraction', 'museum'], price_level: 1 },
      { name: 'Adalaj Stepwell', rating: 4.3, types: ['tourist_attraction', 'historic'], price_level: 1 },
      { name: 'Sidi Saiyyed Mosque', rating: 4.2, types: ['tourist_attraction', 'mosque'], price_level: 1 },
      { name: 'Kankaria Lake', rating: 4.1, types: ['tourist_attraction', 'park'], price_level: 2 },
      { name: 'Calico Museum of Textiles', rating: 4.4, types: ['tourist_attraction', 'museum'], price_level: 2 }
    ],
    'Hyderabad': [
      { name: 'Charminar', rating: 4.4, types: ['tourist_attraction', 'historic'], price_level: 1 },
      { name: 'Golconda Fort', rating: 4.3, types: ['tourist_attraction', 'fort'], price_level: 2 },
      { name: 'Hussain Sagar Lake', rating: 4.2, types: ['tourist_attraction', 'lake'], price_level: 1 },
      { name: 'Salar Jung Museum', rating: 4.5, types: ['tourist_attraction', 'museum'], price_level: 2 },
      { name: 'Qutb Shahi Tombs', rating: 4.1, types: ['tourist_attraction', 'historic'], price_level: 1 }
    ],
    'Mumbai': [
      { name: 'Gateway of India', rating: 4.5, types: ['tourist_attraction', 'monument'], price_level: 1 },
      { name: 'Marine Drive', rating: 4.3, types: ['tourist_attraction', 'scenic'], price_level: 1 },
      { name: 'Juhu Beach', rating: 4.2, types: ['tourist_attraction', 'beach'], price_level: 1 },
      { name: 'Colaba Causeway', rating: 4.0, types: ['tourist_attraction', 'shopping'], price_level: 2 },
      { name: 'Elephanta Caves', rating: 4.4, types: ['tourist_attraction', 'historic'], price_level: 2 }
    ],
    'Delhi': [
      { name: 'Red Fort', rating: 4.4, types: ['tourist_attraction', 'fort'], price_level: 2 },
      { name: 'Qutub Minar', rating: 4.3, types: ['tourist_attraction', 'monument'], price_level: 2 },
      { name: 'India Gate', rating: 4.2, types: ['tourist_attraction', 'monument'], price_level: 1 },
      { name: 'Chandni Chowk', rating: 4.1, types: ['tourist_attraction', 'market'], price_level: 2 },
      { name: 'Humayun\'s Tomb', rating: 4.5, types: ['tourist_attraction', 'historic'], price_level: 2 }
    ],
    'Manali': [
      { name: 'Hadimba Temple', rating: 4.4, types: ['tourist_attraction', 'temple'], price_level: 1 },
      { name: 'Solang Valley', rating: 4.3, types: ['tourist_attraction', 'valley'], price_level: 2 },
      { name: 'Rohtang Pass', rating: 4.2, types: ['tourist_attraction', 'mountain'], price_level: 2 },
      { name: 'Mall Road', rating: 4.1, types: ['tourist_attraction', 'shopping'], price_level: 2 },
      { name: 'Manu Temple', rating: 4.0, types: ['tourist_attraction', 'temple'], price_level: 1 }
    ],
    'Haryana': [
      { name: 'Kurukshetra Panorama and Science Centre', rating: 4.3, types: ['tourist_attraction', 'museum'], price_level: 2 },
      { name: 'Pinjore Gardens', rating: 4.2, types: ['tourist_attraction', 'park'], price_level: 1 },
      { name: 'Sultanpur National Park', rating: 4.1, types: ['tourist_attraction', 'park'], price_level: 1 },
      { name: 'Badkhal Lake', rating: 4.0, types: ['tourist_attraction', 'lake'], price_level: 1 },
      { name: 'Damdama Lake', rating: 4.1, types: ['tourist_attraction', 'lake'], price_level: 1 }
    ],
    'Kolkata': [
      { name: 'Victoria Memorial', rating: 4.6, types: ['tourist_attraction', 'museum'], price_level: 2 },
      { name: 'Howrah Bridge', rating: 4.4, types: ['tourist_attraction', 'bridge'], price_level: 1 },
      { name: 'Dakshineswar Kali Temple', rating: 4.3, types: ['tourist_attraction', 'temple'], price_level: 1 },
      { name: 'Belur Math', rating: 4.2, types: ['tourist_attraction', 'temple'], price_level: 1 },
      { name: 'Indian Museum', rating: 4.1, types: ['tourist_attraction', 'museum'], price_level: 2 }
    ],
    'Bangalore': [
      { name: 'Lalbagh Botanical Garden', rating: 4.4, types: ['tourist_attraction', 'park'], price_level: 1 },
      { name: 'Cubbon Park', rating: 4.3, types: ['tourist_attraction', 'park'], price_level: 1 },
      { name: 'Bangalore Palace', rating: 4.2, types: ['tourist_attraction', 'palace'], price_level: 2 },
      { name: 'Tipu Sultan\'s Summer Palace', rating: 4.1, types: ['tourist_attraction', 'palace'], price_level: 2 },
      { name: 'Vidhana Soudha', rating: 4.0, types: ['tourist_attraction', 'government'], price_level: 1 }
    ],
    'Chennai': [
      { name: 'Marina Beach', rating: 4.3, types: ['tourist_attraction', 'beach'], price_level: 1 },
      { name: 'Kapaleeshwarar Temple', rating: 4.2, types: ['tourist_attraction', 'temple'], price_level: 1 },
      { name: 'Fort St. George', rating: 4.1, types: ['tourist_attraction', 'fort'], price_level: 2 },
      { name: 'Valluvar Kottam', rating: 4.0, types: ['tourist_attraction', 'monument'], price_level: 1 },
      { name: 'Government Museum', rating: 4.1, types: ['tourist_attraction', 'museum'], price_level: 2 }
    ],
    'Pune': [
      { name: 'Shaniwar Wada', rating: 4.2, types: ['tourist_attraction', 'fort'], price_level: 2 },
      { name: 'Aga Khan Palace', rating: 4.3, types: ['tourist_attraction', 'palace'], price_level: 2 },
      { name: 'Sinhagad Fort', rating: 4.1, types: ['tourist_attraction', 'fort'], price_level: 1 },
      { name: 'Dagdusheth Halwai Ganapati Temple', rating: 4.0, types: ['tourist_attraction', 'temple'], price_level: 1 },
      { name: 'Khadakwasla Dam', rating: 4.1, types: ['tourist_attraction', 'dam'], price_level: 1 }
    ]
  };

  // Try to find exact match first
  let attractions = fallbackAttractions[locationName];

  // If no exact match, try to find partial matches (e.g., "Mumbai, India" should match "Mumbai")
  if (!attractions) {
    const locationLower = locationName.toLowerCase();
    for (const [key, value] of Object.entries(fallbackAttractions)) {
      if (locationLower.includes(key.toLowerCase()) || key.toLowerCase().includes(locationLower)) {
        attractions = value;
        console.log(`Found partial match: ${key} for ${locationName}`);
        break;
      }
    }
  }

  // If still no match, create generic attractions for the location
  if (!attractions) {
    console.log(`No fallback data found for ${locationName}, creating generic attractions`);
    attractions = [
      { name: `${locationName} City Center`, rating: 4.0, types: ['tourist_attraction', 'point_of_interest'], price_level: 1 },
      { name: `${locationName} Historical Site`, rating: 4.1, types: ['tourist_attraction', 'historic'], price_level: 1 },
      { name: `${locationName} Local Market`, rating: 3.9, types: ['tourist_attraction', 'shopping'], price_level: 1 },
      { name: `${locationName} Cultural Center`, rating: 4.0, types: ['tourist_attraction', 'cultural'], price_level: 2 },
      { name: `${locationName} Nature Park`, rating: 4.1, types: ['tourist_attraction', 'park'], price_level: 1 }
    ];
  }

  return attractions.slice(0, limit).map((attraction, index) => ({
    name: attraction.name,
    place_id: `fallback_${locationName}_${index}`,
    location: {
      latitude: null,
      longitude: null,
      address: `${attraction.name}, ${locationName}`
    },
    rating: attraction.rating,
    types: attraction.types,
    opening_hours: null,
    website: null,
    phone: null,
    photo_url: null,
    price_level: attraction.price_level
  }));
}

/**
 * Get unique places avoiding duplicates
 * @param {Array} allPlaces - Array of all place objects
 * @param {Array} usedPlaces - Array of already used place names
 * @param {number} count - Number of unique places to return
 * @returns {Array} - Array of unique places
 */
function getUniquePlaces(allPlaces, usedPlaces = [], count = 3) {
  const uniquePlaces = allPlaces.filter(place =>
    !usedPlaces.some(used =>
      used.toLowerCase().includes(place.name.toLowerCase()) ||
      place.name.toLowerCase().includes(used.toLowerCase())
    )
  );

  return uniquePlaces.slice(0, count);
}

module.exports = {
  getCoordinates,
  searchNearbyAttractions,
  getPlaceDetails,
  getPlacePhotoUrl,
  getLocationAttractions,
  getFallbackAttractions,
  getUniquePlaces
};

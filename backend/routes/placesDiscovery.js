const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config({ path: './config.env' });

/**
 * Foursquare API Configuration
 */
const FOURSQUARE_API_BASE = 'https://api.foursquare.com/v3/places';
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

/**
 * Windsurf task to enrich places with Gemini-generated content
 * @param {Array} foursquareResults - Raw results from Foursquare API
 * @returns {Object} - Enriched places with summaries and top picks
 */
async function enrichPlaces(foursquareResults) {
  const prompt = `You are a travel assistant helping users discover places.
Here are the Foursquare results:
${JSON.stringify(foursquareResults, null, 2)}

Please do the following:
1. Write a short summary (2–3 sentences) for each place.
2. Highlight unique features (budget, vibe, atmosphere, specialties).
3. Suggest the top 2 recommendations overall based on rating, popularity, and uniqueness.

Format your response as JSON:
{
  "enriched_places": [
    {
      "fsq_id": "place_id_from_foursquare",
      "name": "Place Name",
      "summary": "2-3 sentence summary highlighting what makes this place special",
      "unique_features": ["feature1", "feature2", "feature3"],
      "original_data": { /* original foursquare data */ }
    }
  ],
  "top_picks": [
    {
      "fsq_id": "place_id",
      "name": "Place Name", 
      "reason": "Why this is a top pick"
    },
    {
      "fsq_id": "place_id",
      "name": "Place Name",
      "reason": "Why this is a top pick"
    }
  ]
}`;

  try {
    // Call Gemini API through the existing callGemini function
    const geminiResponse = await callGemini(prompt);
    return geminiResponse;
  } catch (error) {
    console.error('Gemini enrichment failed:', error);
    // Fallback: return basic enrichment
    return {
      enriched_places: foursquareResults.map(place => ({
        fsq_id: place.fsq_id,
        name: place.name,
        summary: `${place.name} is a ${place.categories?.[0]?.name || 'popular'} location with a rating of ${place.rating || 'N/A'}/10. Located at ${place.location?.formatted_address || 'the specified location'}.`,
        unique_features: [
          place.categories?.[0]?.name || 'Popular destination',
          place.price ? `Price level: ${place.price}` : 'Pricing varies',
          place.rating ? `Highly rated (${place.rating}/10)` : 'Well-reviewed'
        ],
        original_data: place
      })),
      top_picks: foursquareResults.slice(0, 2).map(place => ({
        fsq_id: place.fsq_id,
        name: place.name,
        reason: `Highly rated ${place.categories?.[0]?.name || 'destination'} with excellent reviews`
      }))
    };
  }
}

/**
 * Call Gemini API to generate intelligent content
 * @param {string} prompt - The prompt for Gemini
 * @returns {Promise<Object>} - Parsed JSON response from Gemini
 */
async function callGemini(prompt) {
  const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
  
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
        temperature: 0.3,
        maxOutputTokens: 3000
      }
    }, {
      headers: { "Content-Type": "application/json" }
    });

    const json = response.data;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!text) {
      throw new Error("No textual output found from Gemini");
    }

    // Extract JSON from response
    const cleaned = text.trim();
    const firstBrace = cleaned.indexOf("{");
    
    if (firstBrace === -1) {
      throw new Error("No JSON structure found in Gemini response");
    }

    const jsonStr = cleaned.slice(firstBrace);
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    console.error("Gemini API call error:", err);
    throw err;
  }
}

/**
 * Discover nearby places using Foursquare API
 * @param {string} location - Location to search near (lat,lng or place name)
 * @param {string} categories - Comma-separated category IDs (optional)
 * @param {number} limit - Number of results to return (default: 20)
 * @returns {Promise<Array>} - Array of places from Foursquare
 */
async function discoverPlaces(location, categories = '', limit = 20) {
  try {
    if (!FOURSQUARE_API_KEY) {
      throw new Error('FOURSQUARE_API_KEY is not configured');
    }

    const params = {
      near: location,
      limit: limit,
      fields: 'fsq_id,name,categories,location,rating,price,hours,website,tel,email,description,photos'
    };

    if (categories) {
      params.categories = categories;
    }

    const response = await axios.get(`${FOURSQUARE_API_BASE}/search`, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      },
      params: params
    });

    return response.data.results || [];
  } catch (error) {
    console.error('Foursquare API error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch places from Foursquare: ${error.message}`);
  }
}

/**
 * Discover and enrich places endpoint
 * POST /api/places/discover
 */
router.post('/discover', authenticateToken, async (req, res) => {
  try {
    const { location, categories, limit = 20 } = req.body;

    // Validate required fields
    if (!location) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "location is required"
      });
    }

    console.log(`🔍 Discovering places near ${location}...`);

    // Step 1: Get places from Foursquare API
    const foursquareResults = await discoverPlaces(location, categories, limit);

    if (foursquareResults.length === 0) {
      return res.json({
        message: `No places found near ${location}`,
        enriched_places: [],
        top_picks: []
      });
    }

    console.log(`✅ Found ${foursquareResults.length} places from Foursquare`);

    // Step 2: Enrich results with Gemini through Windsurf
    console.log(`🤖 Enriching places with Gemini...`);
    const enrichedResults = await enrichPlaces(foursquareResults);

    console.log(`✅ Places enriched successfully`);

    // Step 3: Return enriched recommendations
    res.json({
      message: `Found and enriched ${foursquareResults.length} places near ${location}`,
      total_places: foursquareResults.length,
      enriched_places: enrichedResults.enriched_places || [],
      top_picks: enrichedResults.top_picks || [],
      source: 'foursquare_gemini'
    });

  } catch (error) {
    console.error('Places discovery error:', error);
    res.status(500).json({
      error: "places_discovery_failed",
      message: "Failed to discover and enrich places. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get place details by Foursquare ID
 * GET /api/places/:fsq_id
 */
router.get('/:fsq_id', authenticateToken, async (req, res) => {
  try {
    const { fsq_id } = req.params;

    if (!FOURSQUARE_API_KEY) {
      return res.status(500).json({
        error: "API configuration error",
        message: "Foursquare API key not configured"
      });
    }

    const response = await axios.get(`${FOURSQUARE_API_BASE}/${fsq_id}`, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        fields: 'fsq_id,name,categories,location,rating,price,hours,website,tel,email,description,photos,tips'
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({
      error: "place_details_failed",
      message: "Failed to get place details. Please try again later."
    });
  }
});

module.exports = router;

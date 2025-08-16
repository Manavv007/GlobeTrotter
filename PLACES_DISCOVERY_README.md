# Places Discovery API - Foursquare + Gemini Integration

## Overview
This implementation creates a Trip Advisor-like places discovery system that combines:
- **Foursquare API** for structured place data (name, category, rating, address, price)
- **Gemini AI** for human-like summaries, comparisons, and recommendations

## API Flow
```
User Query → Foursquare API → Gemini (via Windsurf) → Enriched Response
```

## Endpoints

### 1. Discover Places
**POST** `/api/places/discover`

**Request Body:**
```json
{
  "location": "Mumbai, India",
  "categories": "13065,13003", // Optional: restaurant, cafe categories
  "limit": 20 // Optional: default 20
}
```

**Response:**
```json
{
  "message": "Found and enriched 15 places near Mumbai, India",
  "total_places": 15,
  "enriched_places": [
    {
      "fsq_id": "4b058704f964a520943e22e3",
      "name": "Leopold Cafe",
      "summary": "Historic cafe in Colaba known for its continental cuisine and vibrant atmosphere. A popular hangout spot for both locals and tourists with reasonable prices.",
      "unique_features": [
        "Historic landmark cafe",
        "Budget-friendly dining",
        "Tourist hotspot"
      ],
      "original_data": {
        "fsq_id": "4b058704f964a520943e22e3",
        "name": "Leopold Cafe",
        "categories": [{"name": "Cafe"}],
        "location": {"formatted_address": "Colaba, Mumbai"},
        "rating": 7.8,
        "price": 2
      }
    }
  ],
  "top_picks": [
    {
      "fsq_id": "4b058704f964a520943e22e3",
      "name": "Leopold Cafe",
      "reason": "Historic charm combined with excellent food and budget-friendly prices"
    },
    {
      "fsq_id": "another_place_id",
      "name": "Gateway of India",
      "reason": "Iconic landmark with stunning architecture and waterfront views"
    }
  ],
  "source": "foursquare_gemini"
}
```

### 2. Get Place Details
**GET** `/api/places/:fsq_id`

Returns detailed information for a specific place from Foursquare.

## Configuration

### Environment Variables
Add to your `config.env`:
```env
# Foursquare API Configuration
FOURSQUARE_API_KEY=your_foursquare_api_key

# Gemini API (already configured)
GEMINI_API_KEY=your_gemini_api_key
```

### Get Foursquare API Key
1. Visit [Foursquare Developer Portal](https://developer.foursquare.com/)
2. Create a new app
3. Copy your API key
4. Add it to your `config.env` file

## Frontend Integration Example

```javascript
// Example usage in React component
const discoverPlaces = async (location) => {
  try {
    const response = await axios.post('/api/places/discover', {
      location: location,
      categories: '13065,13003', // restaurants and cafes
      limit: 15
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { enriched_places, top_picks } = response.data;
    
    // Display enriched places with AI-generated summaries
    setPlaces(enriched_places);
    setTopPicks(top_picks);
    
  } catch (error) {
    console.error('Places discovery failed:', error);
  }
};
```

## Features

### Foursquare Integration
- ✅ Real-time place discovery
- ✅ Structured data (rating, price, categories)
- ✅ Location-based search
- ✅ Category filtering
- ✅ Place details with photos, hours, contact info

### Gemini AI Enhancement
- ✅ Human-like place summaries (2-3 sentences)
- ✅ Unique feature highlighting
- ✅ Top 2 recommendations with reasoning
- ✅ Fallback responses if AI fails
- ✅ Context-aware descriptions

### Error Handling
- ✅ Graceful API failures
- ✅ Fallback summaries if Gemini fails
- ✅ Input validation
- ✅ Rate limiting protection

## Testing

### Test the API
```bash
# Test places discovery
curl -X POST http://localhost:5000/api/places/discover \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "location": "Goa, India",
    "limit": 10
  }'

# Test place details
curl -X GET http://localhost:5000/api/places/PLACE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Category IDs (Common)
- `13065` - Restaurant
- `13003` - Cafe  
- `13377` - Nightclub
- `12013` - Hotel
- `16032` - Shopping Mall
- `10032` - Tourist Attraction

## Next Steps
1. Add the Foursquare API key to your `config.env`
2. Test the endpoints with Postman or curl
3. Integrate into your frontend components
4. Customize the Gemini prompts for your specific use case
5. Add caching for better performance

## Benefits
- **Rich Data**: Foursquare provides comprehensive place information
- **AI Enhancement**: Gemini adds human-like context and recommendations  
- **Scalable**: Easy to extend with more AI features
- **Reliable**: Fallback mechanisms ensure consistent responses

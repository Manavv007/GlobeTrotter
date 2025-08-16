const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

const dummyPosts = [
  {
    tripTitle: "Magical Kerala Backwaters Adventure",
    description: "Just returned from an incredible 5-day journey through Kerala's enchanting backwaters! From houseboat stays in Alleppey to spice plantation tours in Thekkady, every moment was pure magic. The sunset views from Vembanad Lake were absolutely breathtaking. Highly recommend staying in a traditional houseboat - the experience of waking up to gentle water sounds is unforgettable!",
    photos: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    tags: ["#kerala", "#backwaters", "#houseboat", "#nature", "#peaceful"],
    location: "Kerala, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrival in Kochi", "Fort Kochi exploration", "Chinese fishing nets visit", "Local seafood dinner"],
        notes: "Start early to avoid crowds at popular spots"
      },
      {
        day: 2,
        activities: ["Drive to Alleppey", "Houseboat check-in", "Backwater cruise", "Traditional Kerala lunch on boat"],
        notes: "Book houseboat in advance, especially during peak season"
      },
      {
        day: 3,
        activities: ["Morning bird watching", "Village walk", "Spice plantation visit", "Ayurvedic massage"],
        notes: "Carry mosquito repellent for village walks"
      },
      {
        day: 4,
        activities: ["Thekkady wildlife sanctuary", "Periyar Lake boat ride", "Spice shopping", "Cultural show"],
        notes: "Early morning is best for wildlife spotting"
      },
      {
        day: 5,
        activities: ["Return to Kochi", "Last-minute shopping", "Departure"],
        notes: "Keep some time for airport shopping - great spices available"
      }
    ]
  },
  {
    tripTitle: "Budget Goa Trip - ₹12,000 for 4 Days!",
    description: "Proved that you can have an amazing Goa experience without breaking the bank! Stayed in budget hostels, ate at local joints, and still had the time of my life. The beaches are free, the sunsets are priceless, and the memories are invaluable. Here's how I managed to keep costs super low while maximizing the fun!",
    photos: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    tags: ["#goa", "#budget", "#backpacking", "#beaches", "#solo"],
    location: "Goa, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Panaji", "Check into hostel", "Explore Fontainhas", "Sunset at Miramar Beach"],
        notes: "Hostel bed: ₹800/night, local bus from airport: ₹50"
      },
      {
        day: 2,
        activities: ["Baga Beach morning", "Water sports", "Local lunch at beach shack", "Anjuna flea market"],
        notes: "Negotiate water sports prices, eat at local places not tourist spots"
      },
      {
        day: 3,
        activities: ["Dudhsagar Falls trip", "Spice plantation visit", "Traditional Goan dinner"],
        notes: "Shared taxi to falls: ₹400 per person, carry packed lunch"
      },
      {
        day: 4,
        activities: ["Old Goa churches", "Souvenir shopping", "Departure"],
        notes: "Free entry to most churches, bargain at markets"
      }
    ]
  },
  {
    tripTitle: "Manali Adventure - Trekking & Mountain Vibes",
    description: "The mountains were calling and I had to go! Spent a week in Manali doing everything from paragliding to trekking. The Hampta Pass trek was challenging but absolutely rewarding. The views from 14,000 feet are something you have to see to believe. Perfect destination for adventure enthusiasts and nature lovers!",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    tags: ["#manali", "#trekking", "#adventure", "#mountains", "#paragliding"],
    location: "Manali, Himachal Pradesh",
    itinerary: [
      {
        day: 1,
        activities: ["Arrival in Manali", "Mall Road exploration", "Hadimba Temple visit", "Local market shopping"],
        notes: "Acclimatize to altitude, avoid heavy activities on first day"
      },
      {
        day: 2,
        activities: ["Solang Valley", "Paragliding", "Zorbing", "Cable car ride"],
        notes: "Book adventure activities in advance, weather dependent"
      },
      {
        day: 3,
        activities: ["Rohtang Pass day trip", "Snow activities", "Photography"],
        notes: "Carry warm clothes, permits required for Rohtang Pass"
      },
      {
        day: 4,
        activities: ["Hampta Pass trek start", "Base camp setup", "Acclimatization walk"],
        notes: "Hire local guide, carry proper trekking gear"
      },
      {
        day: 5,
        activities: ["Trek to Hampta Pass summit", "Descent to Chatru", "Camping"],
        notes: "Start early, weather can change quickly at high altitude"
      },
      {
        day: 6,
        activities: ["Return trek", "Hot springs visit", "Rest and recovery"],
        notes: "Soak in natural hot springs to relax muscles"
      },
      {
        day: 7,
        activities: ["Local sightseeing", "Souvenir shopping", "Departure"],
        notes: "Buy local woolens and handicrafts"
      }
    ]
  },
  {
    tripTitle: "Rajasthan Royal Heritage Circuit",
    description: "Embarked on a majestic journey through the land of kings! From the pink city of Jaipur to the golden city of Jaisalmer, every destination told a story of valor and grandeur. The palaces, forts, and desert landscapes create an experience that feels like traveling back in time. A must-do for history and culture enthusiasts!",
    photos: [
      "https://images.unsplash.com/photo-1599661046827-dacde6976549?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609920658906-8223bd289001?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    tags: ["#rajasthan", "#heritage", "#palaces", "#desert", "#culture"],
    location: "Rajasthan, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Jaipur", "City Palace visit", "Jantar Mantar", "Local Rajasthani dinner"],
        notes: "Book palace entry tickets online to avoid queues"
      },
      {
        day: 2,
        activities: ["Amber Fort", "Hawa Mahal", "Jal Mahal", "Shopping at Johari Bazaar"],
        notes: "Take elephant ride to Amber Fort, negotiate prices at bazaars"
      },
      {
        day: 3,
        activities: ["Drive to Jodhpur", "Mehrangarh Fort", "Blue city exploration", "Sunset from fort"],
        notes: "Hire auto-rickshaw for blue city tour, carry water"
      },
      {
        day: 4,
        activities: ["Jaswant Thada", "Umaid Bhawan Palace", "Drive to Jaisalmer"],
        notes: "Long drive day, start early, take breaks"
      },
      {
        day: 5,
        activities: ["Jaisalmer Fort", "Patwon Ki Haveli", "Desert safari preparation", "Camel ride"],
        notes: "Book desert camp in advance, carry warm clothes for night"
      },
      {
        day: 6,
        activities: ["Sam Sand Dunes", "Desert camping", "Cultural program", "Stargazing"],
        notes: "Unforgettable desert experience, don't miss sunrise"
      },
      {
        day: 7,
        activities: ["Return to Jaisalmer", "Local shopping", "Departure"],
        notes: "Buy authentic Rajasthani handicrafts and textiles"
      }
    ]
  },
  {
    tripTitle: "Incredible Northeast India - Assam & Meghalaya",
    description: "Discovered the hidden gems of Northeast India! The rolling tea gardens of Assam and the living root bridges of Meghalaya left me speechless. This region is so underrated - pristine nature, unique culture, and the warmest people you'll ever meet. If you're looking for offbeat destinations, this is it!",
    photos: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    tags: ["#northeast", "#assam", "#meghalaya", "#offbeat", "#nature"],
    location: "Assam & Meghalaya, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Guwahati", "Kamakhya Temple", "Brahmaputra river cruise", "Assamese dinner"],
        notes: "Temple has specific visiting hours, check before going"
      },
      {
        day: 2,
        activities: ["Drive to Kaziranga", "Check into eco-lodge", "Evening safari", "Wildlife spotting"],
        notes: "Book safari permits in advance, carry binoculars"
      },
      {
        day: 3,
        activities: ["Morning elephant safari", "Rhino spotting", "Drive to Shillong"],
        notes: "Early morning best for wildlife, long drive to Shillong"
      },
      {
        day: 4,
        activities: ["Shillong exploration", "Ward's Lake", "Don Bosco Museum", "Police Bazaar"],
        notes: "Shillong is quite cool, carry light woolens"
      },
      {
        day: 5,
        activities: ["Cherrapunji day trip", "Living root bridges", "Nohkalikai Falls", "Cave exploration"],
        notes: "Carry raincoat, Cherrapunji gets heavy rainfall"
      },
      {
        day: 6,
        activities: ["Dawki river", "Crystal clear waters", "Boat ride", "Bangladesh border view"],
        notes: "Dawki river is incredibly clear, great for photography"
      },
      {
        day: 7,
        activities: ["Return to Guwahati", "Tea garden visit", "Shopping", "Departure"],
        notes: "Buy authentic Assam tea and traditional handicrafts"
      }
    ]
  },
  {
    tripTitle: "Spiritual Journey to Rishikesh & Haridwar",
    description: "Found peace and adventure in the yoga capital of the world! Rishikesh offered the perfect blend of spirituality and thrill - from morning yoga sessions by the Ganges to white water rafting in the afternoon. The evening Ganga Aarti in Haridwar was a deeply moving experience. Perfect for soul searching and adventure seekers alike!",
    photos: [
      "https://images.unsplash.com/photo-1544967882-bc2f6b3d6e3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    tags: ["#rishikesh", "#spiritual", "#yoga", "#ganges", "#adventure"],
    location: "Rishikesh, Uttarakhand",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Rishikesh", "Check into ashram", "Evening meditation", "Vegetarian dinner"],
        notes: "Many ashrams offer accommodation, book in advance"
      },
      {
        day: 2,
        activities: ["Morning yoga session", "Laxman Jhula visit", "Beatles Ashram", "Cafe hopping"],
        notes: "Start yoga early morning, carry water bottle"
      },
      {
        day: 3,
        activities: ["White water rafting", "Beach camping", "Bonfire", "Stargazing"],
        notes: "Rafting season is best from March to June and September to November"
      },
      {
        day: 4,
        activities: ["Bungee jumping", "Flying fox", "Giant swing", "Adventure activities"],
        notes: "Book adventure activities in advance, medical certificate required"
      },
      {
        day: 5,
        activities: ["Drive to Haridwar", "Har Ki Pauri", "Ganga Aarti", "Temple visits"],
        notes: "Reach Har Ki Pauri early for good spots during Aarti"
      },
      {
        day: 6,
        activities: ["Morning temple visits", "Holy dip in Ganges", "Shopping", "Return to Rishikesh"],
        notes: "Respect local customs, dress modestly at temples"
      }
    ]
  }
];

const dummyComments = [
  {
    text: "This looks absolutely amazing! Kerala has been on my bucket list for so long. How was the weather during your visit?",
    replies: [
      "The weather was perfect! We went in December - not too hot, not too cold. Perfect for boat rides!"
    ]
  },
  {
    text: "Wow, ₹12,000 for 4 days in Goa is incredible! Can you share more details about the hostels you stayed in?",
    replies: [
      "I stayed at Zostel Goa and Mad Monkey Hostel. Both were clean and had great vibes!",
      "Thanks for sharing! I'm definitely trying this budget approach for my next trip."
    ]
  },
  {
    text: "The Hampta Pass trek looks challenging but so rewarding! How fit do you need to be for this trek?",
    replies: [
      "Basic fitness is enough, but some cardio training before the trip definitely helps!"
    ]
  },
  {
    text: "Rajasthan is truly magical! Which city did you enjoy the most?",
    replies: [
      "Jaisalmer was my favorite - the desert experience was unforgettable!"
    ]
  },
  {
    text: "Northeast India is so underrated! Thanks for highlighting this beautiful region.",
    replies: []
  },
  {
    text: "Rishikesh is such a peaceful place. Did you try any specific yoga schools there?",
    replies: [
      "I practiced at Parmarth Niketan Ashram - highly recommend their morning sessions!"
    ]
  }
];

async function seedCommunity() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing users (we'll use the first few as post authors)
    const users = await User.find().limit(6);
    
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    // Clear existing posts and comments
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('Cleared existing posts and comments');

    // Create posts
    const createdPosts = [];
    for (let i = 0; i < dummyPosts.length; i++) {
      const postData = dummyPosts[i];
      const user = users[i % users.length]; // Cycle through users
      
      const post = new Post({
        ...postData,
        userId: user._id,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
      
      await post.save();
      createdPosts.push(post);
      console.log(`Created post: ${post.tripTitle}`);
    }

    // Add some likes to posts
    for (const post of createdPosts) {
      const numLikes = Math.floor(Math.random() * 20) + 5; // 5-25 likes
      const likers = users.slice(0, Math.min(numLikes, users.length));
      post.likes = likers.map(user => user._id);
      await post.save();
    }

    // Create comments
    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const commentData = dummyComments[i];
      
      if (commentData) {
        // Create main comment
        const comment = new Comment({
          postId: post._id,
          userId: users[(i + 1) % users.length]._id, // Different user than post author
          text: commentData.text,
          createdAt: new Date(post.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // After post creation
        });
        
        await comment.save();
        
        // Create replies
        for (const replyText of commentData.replies) {
          const reply = new Comment({
            postId: post._id,
            userId: users[(i + 2) % users.length]._id, // Another different user
            text: replyText,
            parentCommentId: comment._id,
            createdAt: new Date(comment.createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000) // After main comment
          });
          
          await reply.save();
        }
      }
    }

    console.log('Successfully seeded community with dummy data!');
    console.log(`Created ${createdPosts.length} posts with comments and likes`);
    
  } catch (error) {
    console.error('Error seeding community:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCommunity();
}

module.exports = seedCommunity;

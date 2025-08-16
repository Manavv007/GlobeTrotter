const mongoose = require('mongoose');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://InternHub_Hardik:LtGNpooHIpdtjBMa@cluster0.7kam1.mongodb.net/globetrotter?retryWrites=true&w=majority&appName=Cluster0';

const morePosts = [
  {
    tripTitle: "Budget Backpacking Through Himachal",
    description: "Completed an epic 10-day backpacking trip through Himachal Pradesh for just ₹8,000! Stayed in hostels, hitchhiked, and ate local food. The mountain views were incredible and the people were so welcoming. Perfect for solo travelers on a tight budget!",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c"
    ],
    tags: ["#himachal", "#budget", "#backpacking", "#solo", "#mountains"],
    location: "Himachal Pradesh, India",
    itinerary: [
      {
        day: 1,
        activities: ["Delhi to Manali by bus", "Check into hostel", "Mall Road walk"],
        notes: "Government bus is cheapest option - ₹500"
      },
      {
        day: 2,
        activities: ["Hadimba Temple", "Manu Temple", "Old Manali exploration"],
        notes: "Walk everywhere to save money on transport"
      }
    ]
  },
  {
    tripTitle: "Golden Triangle First Timer's Guide",
    description: "Just completed the classic Golden Triangle circuit - Delhi, Agra, Jaipur! As a first-time visitor to India, this was the perfect introduction. The Taj Mahal at sunrise was absolutely magical, and Jaipur's palaces felt like stepping into a fairy tale. Here's my complete guide for first-timers!",
    photos: [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523",
      "https://images.unsplash.com/photo-1599661046827-dacde6976549"
    ],
    tags: ["#goldentriangle", "#firsttime", "#delhi", "#agra", "#jaipur"],
    location: "Delhi-Agra-Jaipur, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive Delhi", "Red Fort", "Jama Masjid", "Chandni Chowk"],
        notes: "Use metro to get around Delhi - very convenient"
      },
      {
        day: 2,
        activities: ["India Gate", "Lotus Temple", "Qutub Minar", "Train to Agra"],
        notes: "Book train tickets in advance for better prices"
      }
    ]
  },
  {
    tripTitle: "Incredible Ladakh Bike Trip",
    description: "Rode my Royal Enfield from Delhi to Leh - 1,200km of pure adventure! The high altitude passes, pristine lakes, and Buddhist monasteries made this the trip of a lifetime. Challenging but absolutely worth every moment. Bikers, this should be on your bucket list!",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1544967882-bc2f6b3d6e3e"
    ],
    tags: ["#ladakh", "#biketrip", "#adventure", "#royalenfield", "#bucketlist"],
    location: "Ladakh, India",
    itinerary: [
      {
        day: 1,
        activities: ["Delhi to Chandigarh", "Bike preparation", "Rest"],
        notes: "Get bike serviced before starting the journey"
      },
      {
        day: 2,
        activities: ["Chandigarh to Manali", "Mountain roads", "Acclimatization"],
        notes: "Take it slow on mountain roads, safety first"
      }
    ]
  },
  {
    tripTitle: "South India Temple Trail",
    description: "Explored the magnificent temples of Tamil Nadu and Karnataka! From the towering gopurams of Madurai to the intricate carvings of Hampi, each temple told a story spanning centuries. The spiritual energy and architectural brilliance left me speechless. A must for culture enthusiasts!",
    photos: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96"
    ],
    tags: ["#southindia", "#temples", "#culture", "#heritage", "#spiritual"],
    location: "Tamil Nadu & Karnataka, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive Chennai", "Kapaleeshwarar Temple", "Marina Beach"],
        notes: "Dress modestly for temple visits"
      },
      {
        day: 2,
        activities: ["Chennai to Mahabalipuram", "Shore Temple", "Five Rathas"],
        notes: "Early morning visit to avoid crowds"
      }
    ]
  },
  {
    tripTitle: "Andaman Islands Paradise",
    description: "Discovered India's best kept secret - the Andaman Islands! Crystal clear waters, pristine beaches, and incredible marine life. Scuba diving at Havelock Island was like entering another world. Perfect for beach lovers and adventure seekers alike!",
    photos: [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5"
    ],
    tags: ["#andaman", "#islands", "#beaches", "#scubadiving", "#paradise"],
    location: "Andaman Islands, India",
    itinerary: [
      {
        day: 1,
        activities: ["Fly to Port Blair", "Cellular Jail", "Light & Sound Show"],
        notes: "Book flights early - limited connectivity to islands"
      },
      {
        day: 2,
        activities: ["Ferry to Havelock", "Radhanagar Beach", "Sunset viewing"],
        notes: "Ferry can be rough - carry motion sickness tablets"
      }
    ]
  },
  {
    tripTitle: "Mumbai Street Food Adventure",
    description: "Spent 3 days eating my way through Mumbai's incredible street food scene! From vada pav to pav bhaji, dosa to bhel puri - every bite was an explosion of flavors. The food tours were amazing and locals were so friendly. Foodie heaven!",
    photos: [
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8",
      "https://images.unsplash.com/photo-1596797038530-2c107229654b"
    ],
    tags: ["#mumbai", "#streetfood", "#foodie", "#local", "#flavors"],
    location: "Mumbai, India",
    itinerary: [
      {
        day: 1,
        activities: ["Mohammed Ali Road", "Vada Pav tasting", "Juhu Beach chaat"],
        notes: "Start with small portions - there's so much to try!"
      },
      {
        day: 2,
        activities: ["Crawford Market", "Dosa varieties", "Kulfi at Chowpatty"],
        notes: "Carry hand sanitizer and stay hydrated"
      }
    ]
  }
];

const moreComments = [
  "This budget breakdown is so helpful! How did you manage accommodation for so cheap?",
  "The Golden Triangle is perfect for first-timers. Which city did you enjoy most?",
  "Ladakh bike trip is on my bucket list! How was the road condition?",
  "South Indian temples are architectural marvels. Great photos!",
  "Andaman looks like paradise! How's the weather in monsoon season?",
  "Mumbai street food is the best! Did you try the famous Tunde Kabab?",
  "Amazing itinerary! Bookmarking this for my next trip.",
  "Your photos are stunning! What camera equipment do you use?",
  "Thanks for the detailed budget breakdown. Very useful!",
  "Adding this destination to my travel wishlist right now!"
];

async function createMorePosts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find().limit(10);
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    // Create additional posts
    const createdPosts = [];
    for (let i = 0; i < morePosts.length; i++) {
      const postData = morePosts[i];
      const user = users[i % users.length];
      
      const post = new Post({
        ...postData,
        userId: user._id,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000) // Random date within last 20 days
      });
      
      // Add random likes
      const numLikes = Math.floor(Math.random() * 25) + 10; // 10-35 likes
      const likers = users.slice(0, Math.min(numLikes, users.length));
      post.likes = likers.map(user => user._id);
      
      await post.save();
      createdPosts.push(post);
      console.log(`✅ Created post: ${post.tripTitle} with ${post.likes.length} likes`);
    }

    // Add comments to new posts
    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const numComments = Math.floor(Math.random() * 3) + 2; // 2-4 comments per post
      
      for (let j = 0; j < numComments; j++) {
        const comment = new Comment({
          postId: post._id,
          userId: users[(i + j + 1) % users.length]._id,
          text: moreComments[(i + j) % moreComments.length],
          createdAt: new Date(post.createdAt.getTime() + (j + 1) * 2 * 60 * 60 * 1000) // 2 hours apart
        });
        
        await comment.save();
      }
    }

    // Get total posts count
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();

    console.log('\n🎉 Community seeding completed!');
    console.log(`📝 Total Posts: ${totalPosts}`);
    console.log(`💬 Total Comments: ${totalComments}`);
    console.log(`🏷️ Popular Tags: #budget, #adventure, #culture, #beaches, #mountains, #spiritual, #foodie`);
    console.log('\n✨ Your community is now ready with diverse travel experiences!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createMorePosts();

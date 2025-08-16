const mongoose = require('mongoose');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');

// Use the MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://InternHub_Hardik:LtGNpooHIpdtjBMa@cluster0.7kam1.mongodb.net/globetrotter?retryWrites=true&w=majority&appName=Cluster0';

const dummyPosts = [
  {
    tripTitle: "Magical Kerala Backwaters Adventure",
    description: "Just returned from an incredible 5-day journey through Kerala's enchanting backwaters! From houseboat stays in Alleppey to spice plantation tours in Thekkady, every moment was pure magic. The sunset views from Vembanad Lake were absolutely breathtaking. Highly recommend staying in a traditional houseboat - the experience of waking up to gentle water sounds is unforgettable!",
    photos: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96"
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
      }
    ]
  },
  {
    tripTitle: "Budget Goa Trip - ₹12,000 for 4 Days!",
    description: "Proved that you can have an amazing Goa experience without breaking the bank! Stayed in budget hostels, ate at local joints, and still had the time of my life. The beaches are free, the sunsets are priceless, and the memories are invaluable. Here's how I managed to keep costs super low while maximizing the fun!",
    photos: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19"
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
      }
    ]
  },
  {
    tripTitle: "Manali Adventure - Trekking & Mountain Vibes",
    description: "The mountains were calling and I had to go! Spent a week in Manali doing everything from paragliding to trekking. The Hampta Pass trek was challenging but absolutely rewarding. The views from 14,000 feet are something you have to see to believe. Perfect destination for adventure enthusiasts and nature lovers!",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766"
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
      }
    ]
  },
  {
    tripTitle: "Rajasthan Royal Heritage Circuit",
    description: "Embarked on a majestic journey through the land of kings! From the pink city of Jaipur to the golden city of Jaisalmer, every destination told a story of valor and grandeur. The palaces, forts, and desert landscapes create an experience that feels like traveling back in time. A must-do for history and culture enthusiasts!",
    photos: [
      "https://images.unsplash.com/photo-1599661046827-dacde6976549",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245"
    ],
    tags: ["#rajasthan", "#heritage", "#palaces", "#desert", "#culture"],
    location: "Rajasthan, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Jaipur", "City Palace visit", "Jantar Mantar", "Local Rajasthani dinner"],
        notes: "Book palace entry tickets online to avoid queues"
      }
    ]
  },
  {
    tripTitle: "Incredible Northeast India - Assam & Meghalaya",
    description: "Discovered the hidden gems of Northeast India! The rolling tea gardens of Assam and the living root bridges of Meghalaya left me speechless. This region is so underrated - pristine nature, unique culture, and the warmest people you'll ever meet. If you're looking for offbeat destinations, this is it!",
    photos: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96"
    ],
    tags: ["#northeast", "#assam", "#meghalaya", "#offbeat", "#nature"],
    location: "Assam & Meghalaya, India",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Guwahati", "Kamakhya Temple", "Brahmaputra river cruise", "Assamese dinner"],
        notes: "Temple has specific visiting hours, check before going"
      }
    ]
  },
  {
    tripTitle: "Spiritual Journey to Rishikesh & Haridwar",
    description: "Found peace and adventure in the yoga capital of the world! Rishikesh offered the perfect blend of spirituality and thrill - from morning yoga sessions by the Ganges to white water rafting in the afternoon. The evening Ganga Aarti in Haridwar was a deeply moving experience. Perfect for soul searching and adventure seekers alike!",
    photos: [
      "https://images.unsplash.com/photo-1544967882-bc2f6b3d6e3e"
    ],
    tags: ["#rishikesh", "#spiritual", "#yoga", "#ganges", "#adventure"],
    location: "Rishikesh, Uttarakhand",
    itinerary: [
      {
        day: 1,
        activities: ["Arrive in Rishikesh", "Check into ashram", "Evening meditation", "Vegetarian dinner"],
        notes: "Many ashrams offer accommodation, book in advance"
      }
    ]
  }
];

async function seedCommunity() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing users
    const users = await User.find().limit(10);
    console.log(`Found ${users.length} users`);
    
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
      const user = users[i % users.length];
      
      const post = new Post({
        ...postData,
        userId: user._id,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      
      // Add random likes
      const numLikes = Math.floor(Math.random() * 15) + 5;
      const likers = users.slice(0, Math.min(numLikes, users.length));
      post.likes = likers.map(user => user._id);
      
      await post.save();
      createdPosts.push(post);
      console.log(`Created post: ${post.tripTitle} with ${post.likes.length} likes`);
    }

    // Create comments
    const commentTexts = [
      "This looks absolutely amazing! How was the weather during your visit?",
      "Wow, great budget tips! Can you share more details about accommodation?",
      "The trek looks challenging but so rewarding! How fit do you need to be?",
      "This region is truly magical! Which city did you enjoy the most?",
      "Northeast India is so underrated! Thanks for highlighting this beautiful region.",
      "Such a peaceful place. Did you try any specific yoga schools there?",
      "Beautiful photos! What camera did you use?",
      "Adding this to my bucket list right now!",
      "Thanks for the detailed itinerary, very helpful!",
      "Looks like an incredible adventure!"
    ];

    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const numComments = Math.floor(Math.random() * 4) + 1; // 1-4 comments per post
      
      for (let j = 0; j < numComments; j++) {
        const comment = new Comment({
          postId: post._id,
          userId: users[(i + j + 1) % users.length]._id,
          text: commentTexts[(i + j) % commentTexts.length],
          createdAt: new Date(post.createdAt.getTime() + (j + 1) * 60 * 60 * 1000)
        });
        
        await comment.save();
        console.log(`Added comment to post: ${post.tripTitle}`);
      }
    }

    console.log('\n✅ Successfully seeded community with dummy data!');
    console.log(`📝 Created ${createdPosts.length} posts`);
    console.log(`💬 Added comments to all posts`);
    console.log(`❤️ Added likes to all posts`);
    console.log(`🏷️ Popular tags: #kerala, #goa, #budget, #adventure, #mountains, #heritage, #spiritual`);
    
  } catch (error) {
    console.error('❌ Error seeding community:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedCommunity();

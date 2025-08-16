import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, ChevronRight, Star } from 'lucide-react';

const LandingPage = () => {
  // Random travel images for hero and inspiration sections
  const heroImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
  ];

  const inspirationImages = [
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2036&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  ];

  const popularDestinations = [
    {
      name: 'Kerala',
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      rating: 4.7
    },
    {
      name: 'Goa',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
      rating: 4.6
    },
    {
      name: 'Manali',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      rating: 4.5
    },
    {
      name: 'Assam',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      rating: 4.8
    }
  ];

  const selectedHeroImage = heroImages[Math.floor(Math.random() * heroImages.length)];
  const selectedInspirationImage = inspirationImages[Math.floor(Math.random() * inspirationImages.length)];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center text-gray-900">
            <Globe className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">GlobeTrotter</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${selectedHeroImage})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover Your Next Adventure
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Explore destinations, plan your trips, and create unforgettable memories.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 flex items-center px-4">
                  <Search className="h-5 w-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Where to?"
                    className="flex-1 py-4 text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <button className="bg-blue-600 text-white px-8 py-4 font-medium hover:bg-blue-700 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Popular Destinations
          </h2>

          {/* Horizontally Scrollable Cards */}
          <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
            {popularDestinations.map((destination, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300/6366f1/ffffff?text=' + encodeURIComponent(destination.name);
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-lg">{destination.name}</h3>
                      <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-white text-sm ml-1">{destination.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Inspiration Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Image */}
              <div className="relative h-80 lg:h-full">
                <img
                  src={selectedInspirationImage}
                  alt="Travel Inspiration"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right Side - Content */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Top 10 Hidden Gems in Europe
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Discover the lesser-known destinations that offer unique experiences and breathtaking scenery.
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 inline-flex items-center">
                  Read More
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <button className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
            Sign up to start planning
          </button>
        </div>
      </section>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

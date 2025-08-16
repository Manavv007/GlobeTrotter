import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import PostForm from '../components/PostForm';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Filter, 
  Plus,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  Bookmark,
  MoreHorizontal,
  Search
} from 'lucide-react';

const CommunityPage = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTag, setSelectedTag] = useState('');
  const [trendingTags, setTrendingTags] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchTrendingTags();
  }, [sortBy, selectedTag]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const fetchPosts = async (pageNum = 1, reset = true) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageNum,
          limit: 10,
          sortBy,
          tag: selectedTag
        }
      });

      if (response.data.success) {
        if (reset) {
          setPosts(response.data.posts);
        } else {
          setPosts(prev => [...prev, ...response.data.posts]);
        }
        setHasMore(response.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/posts/tags/trending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTrendingTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPosts(posts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isLiked: response.data.isLiked,
                likeCount: response.data.likeCount 
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleCopyItinerary = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/posts/${postId}/copy-itinerary`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error copying itinerary:', error);
      toast.error(error.response?.data?.message || 'Failed to copy itinerary');
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1, false);
    }
  };

  const PostCard = ({ post }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {post.userId?.profilePicture ? (
                <img 
                  src={post.userId.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.userId?.firstName} {post.userId?.lastName}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(post.createdAt).toLocaleDateString()}
                {post.location && (
                  <>
                    <span className="mx-2">•</span>
                    <MapPin className="h-3 w-3 mr-1" />
                    {post.location}
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.tripTitle}</h2>
        <p className="text-gray-700 mb-4">{post.description}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <button
                key={index}
                onClick={() => setSelectedTag(tag)}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Photos */}
        {post.photos && post.photos.length > 0 && (
          <div className="mb-4">
            {post.photos.length === 1 ? (
              <img 
                src={post.photos[0]} 
                alt="Travel photo"
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.photos.slice(0, 4).map((photo, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={photo} 
                      alt={`Travel photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {index === 3 && post.photos.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.photos.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Itinerary Preview */}
        {post.itinerary && post.itinerary.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Itinerary Preview</h4>
            <div className="space-y-2">
              {post.itinerary.slice(0, 2).map((day, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">Day {day.day}:</span>
                  <span className="text-gray-600 ml-2">
                    {day.activities.slice(0, 2).join(', ')}
                    {day.activities.length > 2 && '...'}
                  </span>
                </div>
              ))}
              {post.itinerary.length > 2 && (
                <p className="text-sm text-gray-500">
                  +{post.itinerary.length - 2} more days
                </p>
              )}
            </div>
            <button
              onClick={() => handleCopyItinerary(post._id)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Copy Itinerary
            </button>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleLike(post._id)}
              className={`flex items-center space-x-2 ${
                post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              } transition-colors`}
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.likeCount || 0}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.commentCount || 0}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
          
          <button className="text-gray-600 hover:text-yellow-600 transition-colors">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community</h1>
              <p className="text-gray-600 mt-1">Share your travel experiences and discover new adventures</p>
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Share Experience</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="mostLiked">Most Liked</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {selectedTag && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Filtered by:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {selectedTag}
                      </span>
                      <button
                        onClick={() => setSelectedTag('')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to share your travel experience!</p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Post
                  </button>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                  
                  {hasMore && (
                    <div className="text-center py-6">
                      <button
                        onClick={loadMore}
                        className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Load More Posts
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80">
            {/* Trending Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Trending Tags</h3>
              <div className="space-y-2">
                {trendingTags.slice(0, 10).map((tagData, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTag(tagData.tag)}
                    className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-blue-600 font-medium">{tagData.tag}</span>
                    <span className="text-sm text-gray-500">{tagData.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Posts</span>
                  <span className="font-medium text-gray-900">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Tags</span>
                  <span className="font-medium text-gray-900">{trendingTags.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Form Modal */}
      <PostForm 
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default CommunityPage;

import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Upload, 
  MapPin, 
  Calendar, 
  Plus, 
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

const PostForm = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    tripTitle: '',
    description: '',
    location: '',
    photos: [],
    tags: [],
    itinerary: []
  });
  const [newTag, setNewTag] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const tag = newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPhoto = () => {
    if (newPhoto.trim() && !formData.photos.includes(newPhoto.trim())) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, newPhoto.trim()]
      }));
      setNewPhoto('');
    }
  };

  const removePhoto = (photoToRemove) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo !== photoToRemove)
    }));
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const token = localStorage.getItem('token');
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(
          'http://localhost:5001/api/upload/image',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        return response.data.imageUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, {
        day: prev.itinerary.length + 1,
        activities: [''],
        notes: ''
      }]
    }));
  };

  const updateItineraryDay = (dayIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const addActivity = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, index) => 
        index === dayIndex 
          ? { ...day, activities: [...day.activities, ''] }
          : day
      )
    }));
  };

  const updateActivity = (dayIndex, activityIndex, value) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              activities: day.activities.map((activity, aIndex) => 
                aIndex === activityIndex ? value : activity
              )
            }
          : day
      )
    }));
  };

  const removeActivity = (dayIndex, activityIndex) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              activities: day.activities.filter((_, aIndex) => aIndex !== activityIndex)
            }
          : day
      )
    }));
  };

  const removeItineraryDay = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, index) => index !== dayIndex)
        .map((day, index) => ({ ...day, day: index + 1 }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tripTitle.trim() || !formData.description.trim()) {
      toast.error('Trip title and description are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/posts',
        {
          ...formData,
          itinerary: formData.itinerary.map(day => ({
            ...day,
            activities: day.activities.filter(activity => activity.trim())
          }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Post created successfully!');
        onPostCreated(response.data.post);
        onClose();
        // Reset form
        setFormData({
          tripTitle: '',
          description: '',
          location: '',
          photos: [],
          tags: [],
          itinerary: []
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Share Your Travel Experience</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Trip Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Title *
            </label>
            <input
              type="text"
              name="tripTitle"
              value={formData.tripTitle}
              onChange={handleInputChange}
              placeholder="e.g., Amazing Weekend in Kerala"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Share your travel story, tips, and experiences..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Kerala, India"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="h-4 w-4 inline mr-1" />
              Photos
            </label>
            <div className="space-y-3">
              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingImages}
                />
                <label
                  htmlFor="photo-upload"
                  className={`cursor-pointer flex flex-col items-center space-y-2 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {uploadingImages ? 'Uploading images...' : 'Click to upload photos from your device'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Supports JPG, PNG, GIF (Max 5MB each)
                  </span>
                </label>
              </div>

              {/* URL Input Section */}
              <div className="text-center text-sm text-gray-500">
                OR
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhoto}
                  onChange={(e) => setNewPhoto(e.target.value)}
                  placeholder="Enter photo URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addPhoto}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x150?text=Invalid+URL';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="e.g., beach, budget, adventure"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Itinerary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                Itinerary (Optional)
              </label>
              <button
                type="button"
                onClick={addItineraryDay}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                Add Day
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.itinerary.map((day, dayIndex) => (
                <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Day {day.day}</h4>
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(dayIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Activities
                      </label>
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) => updateActivity(dayIndex, activityIndex, e.target.value)}
                            placeholder="e.g., Visit backwaters"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeActivity(dayIndex, activityIndex)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addActivity(dayIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Activity
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={day.notes}
                        onChange={(e) => updateItineraryDay(dayIndex, 'notes', e.target.value)}
                        placeholder="Any special notes for this day..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Share Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;

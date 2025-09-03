import React, { useState } from 'react';
import axios from 'axios';

const ImageUploadTest = () => {
  const [file, setFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('images', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/images/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        console.log('Upload successful:', response.data);
        setUploadedImage(response.data.images[0]);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Image Upload Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {uploadedImage && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Uploaded Image:</h3>
            <div className="text-sm text-gray-600">
              <p>Filename: {uploadedImage.filename}</p>
              <p>Size: {(uploadedImage.size / 1024).toFixed(2)} KB</p>
              <p>URL: {uploadedImage.url}</p>
            </div>
            
            <div className="border rounded-lg p-2">
              <img
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${uploadedImage.url}`}
                alt="Uploaded"
                className="w-full h-48 object-cover rounded"
                onError={(e) => {
                  console.error('Image failed to load');
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-red-500 text-center py-4">
                Image failed to load
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadTest;

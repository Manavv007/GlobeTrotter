import React, { useState, useRef, useEffect } from 'react';
import { Heart, Eye, Download, Share2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ImageDisplay = ({
  images = [],
  showMetadata = true,
  showActions = true,
  lazyLoad = true,
  className = '',
  onImageClick = null,
  onLike = null,
  onShare = null,
  onDownload = null
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const imageRefs = useRef({});

  // Handle image click
  const handleImageClick = (image, index) => {
    if (onImageClick) {
      onImageClick(image, index);
    } else {
      setSelectedImage(image);
      setCurrentIndex(index);
      setLightboxOpen(true);
      setZoomLevel(1);
    }
  };

  // Navigate lightbox
  const navigateLightbox = (direction) => {
    const newIndex = (currentIndex + direction + images.length) % images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    setZoomLevel(1);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;

      switch (e.key) {
        case 'Escape':
          setLightboxOpen(false);
          break;
        case 'ArrowLeft':
          navigateLightbox(-1);
          break;
        case 'ArrowRight':
          navigateLightbox(1);
          break;
        case '+':
        case '=':
          setZoomLevel(prev => Math.min(prev + 0.2, 3));
          break;
        case '-':
          setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentIndex, images.length]);

  // Lazy loading observer
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const imageId = img.dataset.imageId;
            
            if (imageId && !loadedImages.has(imageId)) {
              img.src = img.dataset.src;
              setLoadedImages(prev => new Set(prev).add(imageId));
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    Object.values(imageRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [images, lazyLoad, loadedImages]);

  // Handle image load
  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  };

  // Handle like
  const handleLike = async (image) => {
    if (onLike) {
      try {
        await onLike(image);
      } catch (error) {
        toast.error('Failed to like image');
      }
    }
  };

  // Handle share
  const handleShare = async (image) => {
    if (onShare) {
      try {
        await onShare(image);
      } catch (error) {
        toast.error('Failed to share image');
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: image.originalName || 'Shared Image',
          text: image.description || 'Check out this image!',
          url: image.urls?.original || image.urls?.medium
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share image');
        }
      }
    }
  };

  // Handle download
  const handleDownload = async (image) => {
    if (onDownload) {
      try {
        await onDownload(image);
      } catch (error) {
        toast.error('Failed to download image');
      }
    } else {
      try {
        const response = await fetch(image.urls?.original || image.urls?.medium);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.originalName || 'image';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Image downloaded successfully');
      } catch (error) {
        toast.error('Failed to download image');
      }
    }
  };

  if (images.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No images to display</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {images.map((image, index) => (
          <div
            key={image._id || image.id || index}
            className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              <img
                ref={el => imageRefs.current[image._id || image.id || index] = el}
                data-image-id={image._id || image.id || index}
                data-src={image.urls?.medium || image.urls?.original || image.url}
                src={lazyLoad ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+' : (image.urls?.medium || image.urls?.original || image.url)}
                alt={image.originalName || `Image ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                onLoad={() => handleImageLoad(image._id || image.id || index)}
                onError={handleImageError}
                onClick={() => handleImageClick(image, index)}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
              
              {/* Actions Overlay */}
              {showActions && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(image);
                      }}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
                      title="Like"
                    >
                      <Heart 
                        className={`h-5 w-5 ${image.likes?.includes(image.user?._id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(image);
                      }}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
                      title="Share"
                    >
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
                      title="Download"
                    >
                      <Download className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            {showMetadata && (
              <div className="p-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{image.views || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>{image.likes?.length || 0}</span>
                  </div>
                </div>
                
                {image.tags && image.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {image.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{image.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all duration-200 z-10"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateLightbox(-1)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all duration-200 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateLightbox(1)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all duration-200 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex space-x-2 z-10">
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all duration-200"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all duration-200"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>

            {/* Image */}
            <div className="relative max-w-full max-h-full overflow-auto">
              <img
                src={selectedImage.urls?.large || selectedImage.urls?.original || selectedImage.url}
                alt={selectedImage.originalName || 'Selected image'}
                className="max-w-none transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {selectedImage.originalName || `Image ${currentIndex + 1}`}
              </h3>
              {selectedImage.metadata && (
                <div className="text-sm space-y-1">
                  <p>Dimensions: {selectedImage.metadata.width} × {selectedImage.metadata.height}</p>
                  <p>Size: {(selectedImage.metadata.size / (1024 * 1024)).toFixed(2)} MB</p>
                  {selectedImage.metadata.exif?.camera && (
                    <p>Camera: {selectedImage.metadata.exif.camera}</p>
                  )}
                </div>
              )}
              {selectedImage.tags && selectedImage.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedImage.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageDisplay;

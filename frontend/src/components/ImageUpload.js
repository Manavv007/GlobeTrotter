import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ImageUpload = ({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  showPreview = true,
  multiple = true,
  className = '',
  disabled = false
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // File validation
  const validateFiles = useCallback((acceptedFiles) => {
    const errors = [];
    const validFiles = [];

    acceptedFiles.forEach((file, index) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large. Max size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }

      // Check if we already have this file
      const isDuplicate = files.some(existingFile =>
        existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        errors.push(`${file.name}: File already selected`);
        return;
      }

      // Check total file count
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  }, [files, maxFiles, maxSize, allowedTypes]);

  // Handle file selection
  const handleFiles = useCallback((acceptedFiles) => {
    const { validFiles, errors } = validateFiles(acceptedFiles);

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    if (validFiles.length === 0) return;

    // Process files
    const processedFiles = validFiles.map((file) => ({
      file: file,
      id: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file),
      status: 'ready',
      size: file.size
    }));

    setFiles(prev => [...prev, ...processedFiles]);
  }, [validateFiles]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'image/*': allowedTypes
    },
    maxSize,
    multiple,
    disabled: uploading || disabled
  });

  // Handle file input change
  const handleFileInputChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    handleFiles(selectedFiles);
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('No files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress({});

    try {
      const uploadPromises = files.map(async (fileData, index) => {
        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [fileData.id]: Math.min((prev[fileData.id] || 0) + Math.random() * 20, 90)
            }));
          }, 200);

          // Call the upload function
          await onUpload([fileData.file]);

          clearInterval(progressInterval);
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: 100
          }));

          return { success: true, fileData };
        } catch (error) {
          console.error('Upload error:', error);
          return { success: false, fileData, error: error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast.success(`Successfully uploaded ${successful.length} images`);
        // Clear successful uploads after a delay
        setTimeout(() => {
          setFiles(prev => prev.filter(f =>
            !successful.some(s => s.fileData.id === f.id)
          ));
        }, 2000);
      }

      if (failed.length > 0) {
        failed.forEach(f => {
          toast.error(`Failed to upload ${f.fileData.file.name}: ${f.error}`);
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${uploading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {isDragActive ? (
              <Upload className="h-12 w-12 text-blue-500" />
            ) : (
              <ImageIcon className="h-12 w-12 text-gray-400" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              {isDragActive
                ? 'Drop images here'
                : 'Drag & drop images here'
              }
            </h3>
            <p className="text-sm text-gray-500">
              or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
                disabled={uploading || disabled}
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Supports {allowedTypes.join(', ')} up to {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-sm text-red-600 hover:text-red-500"
              disabled={uploading}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((fileData) => (
              <div
                key={fileData.id}
                className="relative bg-white border border-gray-200 rounded-lg p-3 space-y-2"
              >
                {/* Preview */}
                {showPreview && (
                  <div className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={fileData.preview}
                      alt={fileData.file.name}
                      className="w-full h-full object-cover"
                    />
                    {uploadProgress[fileData.id] !== undefined && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <span className="text-sm">
                            {Math.round(uploadProgress[fileData.id] || 0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* File Info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileData.file.size / (1024 * 1024)).toFixed(2)}MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileData.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'ready' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {fileData.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {fileData.status === 'ready' ? 'Ready to upload' : fileData.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${uploading || files.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }
              `}
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

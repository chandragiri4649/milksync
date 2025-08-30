const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'davago_uploads', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Only allow these image formats
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Resize if needed
    quality: 'auto', // Auto optimize quality
    format: 'auto', // Auto format selection
  },
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      // Check if it's one of the allowed formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, JPG, and PNG images are allowed!'), false);
      }
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "image" as the field name.',
        error: 'UNEXPECTED_FIELD'
      });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!',
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  if (error.message.includes('Only JPEG, JPG, and PNG images are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Only JPEG, JPG, and PNG images are allowed!',
      error: 'INVALID_IMAGE_FORMAT'
    });
  }
  
  // Generic error
  return res.status(500).json({
    success: false,
    message: 'Upload failed. Please try again.',
    error: 'UPLOAD_ERROR'
  });
};

module.exports = {
  upload,
  handleUploadError
};

const express = require('express');
const router = express.Router();

// Import upload controller and middleware
const { uploadImage, deleteImage, getImageInfo } = require('../controllers/uploadController');
const { upload, handleUploadError } = require('../middlewares/cloudinaryUpload');

// Import authentication middleware (optional - uncomment if you want to protect upload routes)
// const { authenticateToken } = require('../middlewares/authMiddleware');

// POST /upload - Upload single image
router.post('/upload', 
  // authenticateToken, // Uncomment to protect this route
  upload.single('image'), // 'image' is the field name expected in the form
  handleUploadError, // Handle multer errors
  uploadImage
);

// DELETE /upload/:publicId - Delete image by public ID
router.delete('/upload/:publicId', 
  // authenticateToken, // Uncomment to protect this route
  deleteImage
);

// GET /upload/:publicId - Get image information by public ID
router.get('/upload/:publicId', 
  // authenticateToken, // Uncomment to protect this route
  getImageInfo
);

// GET /upload - Health check endpoint
router.get('/upload', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload service is running',
    endpoints: {
      'POST /upload': 'Upload single image (field name: "image")',
      'DELETE /upload/:publicId': 'Delete image by public ID',
      'GET /upload/:publicId': 'Get image information by public ID'
    },
    limits: {
      maxFileSize: '5MB',
      allowedFormats: ['jpg', 'jpeg', 'png'],
      folder: 'davago_uploads'
    }
  });
});

module.exports = router;

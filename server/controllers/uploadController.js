const { cloudinary } = require('../config/cloudinary');

// Upload single image to Cloudinary
const uploadImage = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please upload an image.',
        error: 'NO_FILE'
      });
    }

    // Get the Cloudinary URL from the uploaded file
    const imageUrl = req.file.path;
    
    // Get additional file information
    const fileInfo = {
      url: imageUrl,
      public_id: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
      format: req.file.format,
      width: req.file.width,
      height: req.file.height,
      created_at: new Date().toISOString()
    };

    console.log('✅ Image uploaded successfully:', {
      originalName: req.file.originalname,
      cloudinaryUrl: imageUrl,
      publicId: req.file.filename,
      size: req.file.size
    });

    // Return success response with image URL
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: fileInfo
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Handle Cloudinary specific errors
    if (error.http_code) {
      return res.status(error.http_code).json({
        success: false,
        message: 'Cloudinary upload failed',
        error: 'CLOUDINARY_ERROR',
        details: error.message
      });
    }
    
    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Internal server error during upload',
      error: 'SERVER_ERROR'
    });
  }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
        error: 'MISSING_PUBLIC_ID'
      });
    }

    // Delete image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted successfully:', publicId);
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        data: { publicId, deleted: true }
      });
    } else {
      console.log('⚠️ Image not found or already deleted:', publicId);
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted',
        error: 'IMAGE_NOT_FOUND'
      });
    }

  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: 'DELETE_ERROR'
    });
  }
};

// Get image information from Cloudinary
const getImageInfo = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
        error: 'MISSING_PUBLIC_ID'
      });
    }

    // Get image information from Cloudinary
    const result = await cloudinary.api.resource(publicId);
    
    res.status(200).json({
      success: true,
      message: 'Image information retrieved successfully',
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        created_at: result.created_at
      }
    });

  } catch (error) {
    console.error('❌ Get image info error:', error);
    
    if (error.http_code === 404) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        error: 'IMAGE_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get image information',
      error: 'GET_INFO_ERROR'
    });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  getImageInfo
};

const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// Create product with image file
exports.createProductWithImage = async (req, res) => {
  try {
    console.log("📝 Received request body:", req.body);
    console.log("📁 Received file:", req.file);
    
    const { distributorId, name, productQuantity, productUnit, costPerTub, costPerPacket, packetsPerTub } = req.body;
    
    // Validate required fields
    if (!distributorId || !name || !productQuantity || !productUnit || !costPerTub || !costPerPacket || !packetsPerTub) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        received: { distributorId, name, productQuantity, productUnit, costPerTub, costPerPacket, packetsPerTub } 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Product image is required" });
    }

    // Validate numbers
    const productQuantityNum = parseFloat(productQuantity);
    const costPerTubNum = parseFloat(costPerTub);
    const costPerPacketNum = parseFloat(costPerPacket);
    const packetsPerTubNum = parseInt(packetsPerTub);

    if (isNaN(productQuantityNum)) return res.status(400).json({ error: "Product quantity must be a valid number" });
    if (isNaN(costPerTubNum)) return res.status(400).json({ error: "Cost per tub must be a valid number" });
    if (isNaN(costPerPacketNum)) return res.status(400).json({ error: "Cost per packet must be a valid number" });
    if (isNaN(packetsPerTubNum)) return res.status(400).json({ error: "Packets per tub must be a valid number" });

    // Get Cloudinary URL from uploaded file
    const imageUrl = req.file.path;

    const product = new Product({
      distributorId,
      name,
      productQuantity: productQuantityNum,
      productUnit,
      imageUrl,
      costPerTub: costPerTubNum,
      costPerPacket: costPerPacketNum,
      packetsPerTub: packetsPerTubNum
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ 
      error: "Failed to create product", 
      details: err.message 
    });
  }
};


// Get all products (also return costForOneTub)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('distributorId', 'distributorName companyName').sort({ createdAt: -1 });
    const withCost = products.map(p => ({
      ...p._doc,
      costForOneTub: p.costPerPacket * p.packetsPerTub
    }));
    res.json(withCost);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};


// Update product with optional image file
exports.updateProductWithImage = async (req, res) => {
  try {
    const { distributorId, name, productQuantity, productUnit, costPerTub, costPerPacket, packetsPerTub } = req.body;
    let updateData = {};

    // Get the current product to check for existing image
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (distributorId !== undefined) updateData.distributorId = distributorId;
    if (name !== undefined) updateData.name = name;
    if (productQuantity !== undefined) {
      const productQuantityNum = parseFloat(productQuantity);
      if (isNaN(productQuantityNum)) {
        return res.status(400).json({ error: "Product quantity must be a valid number" });
      }
      updateData.productQuantity = productQuantityNum;
    }
    if (productUnit !== undefined) updateData.productUnit = productUnit;
    if (costPerTub !== undefined) {
      const cptNum = parseFloat(costPerTub);
      if (isNaN(cptNum)) {
        return res.status(400).json({ error: "Cost per tub must be a valid number" });
      }
      updateData.costPerTub = cptNum;
    }
    if (costPerPacket !== undefined) {
      const cppNum = parseFloat(costPerPacket);
      if (isNaN(cppNum)) {
        return res.status(400).json({ error: "Cost per packet must be a valid number" });
      }
      updateData.costPerPacket = cppNum;
    }
    if (packetsPerTub !== undefined) {
      const pptNum = parseInt(packetsPerTub);
      if (isNaN(pptNum)) {
        return res.status(400).json({ error: "Packets per tub must be a valid number" });
      }
      updateData.packetsPerTub = pptNum;
    }

    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (currentProduct.imageUrl && currentProduct.imageUrl.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = currentProduct.imageUrl.split('/');
          const publicId = urlParts[urlParts.length - 1].split('.')[0];
          const folderPath = 'davago_uploads';
          const fullPublicId = `${folderPath}/${publicId}`;
          
          await cloudinary.uploader.destroy(fullPublicId);
          console.log('✅ Old product image deleted from Cloudinary:', fullPublicId);
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete old image from Cloudinary:', deleteError.message);
          // Continue with update even if old image deletion fails
        }
      }
      
      // Get Cloudinary URL from uploaded file
      updateData.imageUrl = req.file.path;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('distributorId', 'distributorName companyName');

    res.json(updated);
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
};


// Get products by distributor with costForOneTub
exports.getProductsByDistributor = async (req, res) => {
  try {
    const products = await Product.find({ distributorId: req.params.distributorId }).populate('distributorId', 'distributorName companyName').sort({ createdAt: -1 });
    const withCost = products.map(p => ({
      ...p._doc,
      costForOneTub: p.costPerPacket * p.packetsPerTub
    }));
    res.json(withCost);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products by distributor" });
  }
};


// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Delete image from Cloudinary if it exists
    if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = product.imageUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        const folderPath = 'davago_uploads';
        const fullPublicId = `${folderPath}/${publicId}`;
        
        await cloudinary.uploader.destroy(fullPublicId);
        console.log('✅ Product image deleted from Cloudinary:', fullPublicId);
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete image from Cloudinary:', deleteError.message);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Product deletion error:", err);
    res.status(500).json({ error: "Failed to delete product", details: err.message });
  }
};


// Calculate cost API (optional for cost management UI)
exports.calculateTotalCost = async (req, res) => {
  try {
    const { numberOfTubs = 1 } = req.query;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const totalCost = product.costPerPacket * product.packetsPerTub * Number(numberOfTubs);

    res.json({
      product: product.name,
      numberOfTubs: Number(numberOfTubs),
      costPerTub: product.costPerPacket * product.packetsPerTub,
      totalCost
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate cost", details: err.message });
  }
};

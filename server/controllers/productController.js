const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// Create product with image file
exports.createProductWithImage = async (req, res) => {
  try {
    console.log("📝 Received request body:", req.body);
    console.log("📁 Received file:", req.file);
    
    const { company, name, quantity, unit, costPerTub, costPerPacket, packetsPerTub } = req.body;
    
    // Validate required fields
    if (!company || !name || !quantity || !unit || !costPerTub || !costPerPacket || !packetsPerTub) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        received: { company, name, quantity, unit, costPerTub, costPerPacket, packetsPerTub } 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Product image is required" });
    }

    // Validate numbers
    const quantityNum = parseFloat(quantity);
    const costPerTubNum = parseFloat(costPerTub);
    const costPerPacketNum = parseFloat(costPerPacket);
    const packetsPerTubNum = parseInt(packetsPerTub);

    if (isNaN(quantityNum)) return res.status(400).json({ error: "Quantity must be a valid number" });
    if (isNaN(costPerTubNum)) return res.status(400).json({ error: "Cost per tub must be a valid number" });
    if (isNaN(costPerPacketNum)) return res.status(400).json({ error: "Cost per packet must be a valid number" });
    if (isNaN(packetsPerTubNum)) return res.status(400).json({ error: "Packets per tub must be a valid number" });

    // Get Cloudinary URL from uploaded file
    const imageUrl = req.file.path;

    const product = new Product({
      company,
      name,
      quantity: quantityNum,
      unit,
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
    const products = await Product.find().sort({ createdAt: -1 });
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
    const { company, name, quantity, unit, costPerTub, costPerPacket, packetsPerTub } = req.body;
    let updateData = {};

    // Get the current product to check for existing image
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (company !== undefined) updateData.company = company;
    if (name !== undefined) updateData.name = name;
    if (quantity !== undefined) {
      const quantityNum = parseFloat(quantity);
      if (isNaN(quantityNum)) {
        return res.status(400).json({ error: "Quantity must be a valid number" });
      }
      updateData.quantity = quantityNum;
    }
    if (unit !== undefined) updateData.unit = unit;
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
    );

    res.json(updated);
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
};


// Get products by company with costForOneTub
exports.getProductsByCompany = async (req, res) => {
  try {
    const products = await Product.find({ company: req.params.companyName }).sort({ createdAt: -1 });
    const withCost = products.map(p => ({
      ...p._doc,
      costForOneTub: p.costPerPacket * p.packetsPerTub
    }));
    res.json(withCost);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products by company" });
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

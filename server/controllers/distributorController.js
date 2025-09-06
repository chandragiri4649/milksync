const Distributor = require("../models/Distributor");
const bcrypt = require("bcryptjs");
const { createUserSession, destroySession } = require("../middlewares/sessionMiddleware");


exports.getAllDistributors = async (req, res) => {
  try {
    console.log("🔍 distributorController - getAllDistributors called");
    console.log("🔍 Session info:", {
      userId: req.session?.userId,
      userRole: req.session?.userRole,
      sessionId: req.session?.id
    });
    
    const distributors = await Distributor.find({});
    console.log("🔍 distributorController - Found distributors:", {
      count: distributors.length,
      firstDistributor: distributors[0] ? {
        id: distributors[0]._id,
        distributorName: distributors[0].distributorName,
        companyName: distributors[0].companyName
      } : 'No distributors found'
    });
    
    res.json(distributors);
  } catch (err) {
    console.error("❌ distributorController - Error fetching distributors:", err);
    res.status(500).json({ message: "Error fetching distributors" });
  }
};

exports.getProductsByCompany = async (req, res) => {
  try {
    const products = await Product.find({ company: req.params.companyName }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch company products" });
  }
};

exports.addDistributor = async (req, res) => {
  const { distributorName, companyName, contact, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const distributor = new Distributor({
      distributorName,
      companyName,
      contact,
      username,
      password: hashedPassword,
    });
    await distributor.save();
    res.json({ message: "Distributor added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding distributor" });
  }
};

exports.deleteDistributor = async (req, res) => {
  const { id } = req.params;
  try {
    await Distributor.findByIdAndDelete(id);
    res.json({ message: "Distributor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting distributor" });
  }
};

exports.updateDistributor = async (req, res) => {
  const { id } = req.params;
  const { distributorName, companyName, contact, username, password, status } = req.body;

  console.log("updateDistributor called with ID:", id);
  console.log("Request body:", req.body);

  try {
    const updateData = { distributorName, companyName, contact, username, status };

    // Only hash and include password if it's provided
    if (password && password.trim() !== "") {
      console.log("Password provided, hashing...");
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    console.log("Update data:", updateData);

    const updatedDistributor = await Distributor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDistributor) {
      console.log("Distributor not found with ID:", id);
      return res.status(404).json({ message: "Distributor not found" });
    }

    console.log("Distributor updated successfully:", updatedDistributor);
    res.json({ message: "Distributor updated successfully", distributor: updatedDistributor });
  } catch (err) {
    console.error("Error updating distributor:", err);
    res.status(500).json({ message: "Error updating distributor" });
  }
};


exports.distributorLogin = async (req, res) => {
  const { username, password } = req.body;
  console.log("🔐 distributorController - Login attempt for username:", username);
  
  try {
    const distributor = await Distributor.findOne({ username });
    if (!distributor) {
      console.log("❌ distributorController - Distributor not found for username:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("✅ distributorController - Distributor found:", { id: distributor._id, username: distributor.username });
    
    const isMatch = await bcrypt.compare(password, distributor.password);
    if (!isMatch) {
      console.log("❌ distributorController - Password mismatch for username:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("✅ distributorController - Password verified for username:", username);
    
    // Create session for distributor and wait for it to be saved
    await createUserSession(req, distributor, 'distributor');
    
    // Debug: Check if session was created
    console.log("🔍 distributorController - After session creation:", {
      sessionId: req.session?.id,
      userId: req.session?.userId,
      userRole: req.session?.userRole,
      sessionExists: !!req.session
    });
    
    // Debug: Check response headers
    console.log("🔍 distributorController - Response headers:", {
      'set-cookie': res.getHeaders()['set-cookie'],
      sessionCookie: res.getHeaders()['set-cookie']?.find(cookie => cookie.includes('connect.sid'))
    });
    
    // Debug: Check if session cookie is being set
    const sessionCookie = res.getHeaders()['set-cookie']?.find(cookie => cookie.includes('connect.sid'));
    if (sessionCookie) {
      console.log("✅ Session cookie is being set:", sessionCookie);
    } else {
      console.log("❌ No session cookie found in response headers");
    }
    
    res.json({ 
      message: "Login successful", 
      user: {
        id: distributor._id,
        username: distributor.username,
        companyName: distributor.companyName,
        distributorName: distributor.distributorName,
        contact: distributor.contact,
        role: 'distributor'
      }
    });
  } catch (err) {
    console.error("❌ distributorController - Distributor login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// distributorController.js
exports.getDistributorProfile = async (req, res) => {
  try {
    console.log("🔍 distributorController - Getting profile for session user:", {
      sessionUserId: req.session?.userId,
      sessionUserRole: req.session?.userRole
    });
    
    // req.session.userId is set by sessionMiddleware after verifying session
    const distributor = await Distributor.findById(req.session.userId).select("-password");
    if (!distributor) {
      console.log("❌ distributorController - Distributor not found for session user ID:", req.session.userId);
      return res.status(404).json({ message: "Distributor not found" });
    }
    
    console.log("✅ distributorController - Profile found for distributor:", distributor.username);
    res.json(distributor);
  } catch (error) {
    console.error("❌ distributorController - Error fetching distributor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout distributor
exports.distributorLogout = async (req, res) => {
  try {
    destroySession(req, res, () => {
      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error("Distributor logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// Get current session info for distributor
exports.getDistributorSessionInfo = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        message: "No active session",
        sessionExpired: true 
      });
    }

    const distributor = await Distributor.findById(req.session.userId).select('-password');
    if (!distributor) {
      req.session.destroy();
      return res.status(401).json({ 
        message: "User not found",
        sessionExpired: true 
      });
    }

    res.json({
      user: {
        id: distributor._id,
        username: distributor.username,
        name: distributor.name,
        distributorName: distributor.distributorName,
        contact: distributor.contact,
        role: 'distributor'
      },
      session: {
        userId: req.session.userId,
        userRole: req.session.userRole,
        username: req.session.username
      }
    });
  } catch (error) {
    console.error("Get distributor session info error:", error);
    res.status(500).json({ message: "Failed to get session info" });
  }
};

exports.getProductsByDistributor = async (req, res) => {
  const distributorId = req.params.id;

  try {
    // Find products where 'distributorId' field matches the given ID
    const products = await Product.find({ distributorId: distributorId })
      .populate('distributorId', 'distributorName companyName')
      .sort({ createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found for this distributor" });
    }

    // Add computed fields for compatibility
    const productsWithComputed = products.map(product => ({
      ...product._doc,
      costForOneTub: product.costPerPacket * product.packetsPerTub
    }));

    res.json(productsWithComputed);
  } catch (err) {
    console.error("Error fetching products for distributor:", err);
    res.status(500).json({ message: "Server error fetching products" });
  }
};

// Get full data for a distributor including orders, bills, payments, and wallet
exports.getDistributorFullData = async (req, res) => {
  const { id } = req.params;

  try {
    // Import required models
    const Order = require("../models/Order");
    const Bill = require("../models/Bill");
    const Payment = require("../models/Payment");

    // Get distributor basic info
    const distributor = await Distributor.findById(id).select("-password");
    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    // Get orders for this distributor
    const orders = await Order.find({ distributorId: id }).sort({ orderDate: -1 });

    // Get bills for this distributor
    const bills = await Bill.find({ distributorId: id }).sort({ billDate: -1 });

    // Get payments for this distributor
    const payments = await Payment.find({ distributorId: id }).sort({ paymentDate: -1 });

    // Get wallet balance for this distributor (stored in distributor model)
    const walletBalance = distributor.walletBalance || 0;

    // Prepare response data
    const fullData = {
      distributor: {
        _id: distributor._id,
        name: distributor.name,
        email: distributor.contact?.email,
        phone: distributor.contact?.phone,
        address: distributor.contact?.address,
        distributorName: distributor.distributorName,
        username: distributor.username,
        status: distributor.status
      },
      orders: orders.map(order => ({
        _id: order._id,
        date: order.orderDate,
        products: order.items?.map(item => ({ name: item.productId, quantity: item.quantity, unit: item.unit })) || [],
        quantity: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        status: order.status,
        totalAmount: order.items?.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0) || 0
      })),
      bills: bills.map(bill => ({
        _id: bill._id,
        date: bill.billDate,
        amount: bill.totalAmount,
        serialNo: bill.billNumber || `BILL-${bill._id}`
      })),
      payments: payments.map(payment => ({
        _id: payment._id,
        date: payment.paymentDate,
        amount: payment.amount,
        serialNo: payment._id.toString().slice(-6).toUpperCase()
      })),
      wallet: {
        balance: walletBalance,
        lastUpdated: distributor.updatedAt
      }
    };

    res.json(fullData);
  } catch (err) {
    console.error("Error fetching distributor full data:", err);
    res.status(500).json({ message: "Server error fetching distributor data" });
  }
};
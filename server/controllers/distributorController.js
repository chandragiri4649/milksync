const Distributor = require("../models/Distributor");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.getAllDistributors = async (req, res) => {
  try {
    const distributors = await Distributor.find({});
    res.json(distributors);
  } catch (err) {
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
  const { distributorName, name, contact, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const distributor = new Distributor({
      distributorName,
      name,
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
  const { distributorName, name, contact, username, password, status } = req.body;

  console.log("updateDistributor called with ID:", id);
  console.log("Request body:", req.body);

  try {
    const updateData = { distributorName, name, contact, username, status };

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
  try {
    console.log("Distributor login attempt:", username);
    const distributor = await Distributor.findOne({ username });
    if (!distributor) {
      console.log("Distributor not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const isMatch = await bcrypt.compare(password, distributor.password);
    if (!isMatch) {
      console.log("Invalid password for distributor:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const token = jwt.sign(
      { id: distributor._id, username: distributor.username, role: "distributor" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "2h" }
    );
    console.log("Distributor login success:", username);
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Distributor login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// distributorController.js
exports.getDistributorProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware after verifying JWT
    const distributor = await Distributor.findById(req.user.id).select("-password");
    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    res.json(distributor);
  } catch (error) {
    console.error("Error fetching distributor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProductsByDistributor = async (req, res) => {
  const distributorId = req.params.id;

  try {
    // Find products where 'distributor' field matches the given ID
    const products = await Product.find({ distributor: distributorId });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found for this distributor" });
    }

    res.json(products);
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
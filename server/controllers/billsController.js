const Bill = require("../models/Bill");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Get all bills (admin/staff view)
exports.getBillsByDistributor = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("distributorId", "distributorName name")
      .populate("orderId", "orderDate status")
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (err) {
    console.error("Error fetching bills:", err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
};

// Get bills for a specific distributor (distributor view)
exports.getDistributorBills = async (req, res) => {
  try {
    console.log("🔍 billsController - getDistributorBills called");
    console.log("🔍 billsController - Session data:", {
      userId: req.session?.userId,
      userRole: req.session?.userRole
    });
    
    // Use session user ID instead of JWT user ID
    const distributorId = req.session?.userId;
    
    if (!distributorId) {
      console.log("❌ billsController - No distributor ID in session");
      return res.status(401).json({ error: "Distributor ID not found" });
    }

    // Get bills for this specific distributor
    const bills = await Bill.find({ distributorId: distributorId })
      .populate("orderId", "orderDate status customerName")
      .sort({ createdAt: -1 });

    // Transform the data to match frontend expectations
    const transformedBills = bills.map(bill => ({
      _id: bill._id,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      customerName: bill.customerName,
      totalAmount: bill.totalAmount,
      paymentMethod: bill.paymentMethod,
      status: bill.status,
      locked: bill.locked,
      createdAt: bill.createdAt,
      orderId: bill.orderId,
      items: bill.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        pricePerUnit: item.price, // Add pricePerUnit for frontend compatibility
        total: item.total
      })),
      // Include damaged products information
      damagedProducts: bill.damagedProducts || [],
      totalDamagedCost: bill.totalDamagedCost || 0,
      updatedBy: bill.updatedBy || null,
      updatedAt: bill.updatedAt || null
    }));

    res.json(transformedBills);
  } catch (err) {
    console.error("Error fetching distributor bills:", err);
    res.status(500).json({ error: "Failed to fetch distributor bills" });
  }
};

// Create or Update bill when order is created/updated
exports.upsertBillFromOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('🔔 upsertBillFromOrder called with:', { orderId, body: req.body });
    
    if (!orderId) {
      console.log('❌ Missing orderId');
      return res.status(400).json({ error: "orderId is required" });
    }

    console.log('📋 Finding order with ID:', orderId);
    const order = await Order.findById(orderId)
      .populate("distributorId", "distributorName name")
      .populate("items.productId", "name costPerTub costPerPacket packetsPerTub");

    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log('✅ Order found:', {
      orderId: order._id,
      distributorId: order.distributorId,
      itemsCount: order.items.length,
      locked: order.locked
    });

    if (order.locked) {
      console.log('❌ Order is locked');
      return res.status(403).json({ error: "Order is locked and bill cannot be modified" });
    }

    // Prepare bill items with enhanced debugging
    console.log('📦 Processing order items...');
    const billItems = order.items.map((item, index) => {
      const product = item.productId;
      if (!product) {
        console.log(`⚠️ Product not found for item at index ${index}`);
        return null;
      }

      // 🆕 Use costPerTub directly, with fallback calculation
      let costPerTub = product.costPerTub;
      if (!costPerTub && product.costPerPacket && product.packetsPerTub) {
        costPerTub = product.costPerPacket * product.packetsPerTub;
        console.log(`�� Calculated costPerTub for ${product.name}: ${costPerTub}`);
      }
      
      if (!costPerTub) {
        console.log('❌ No cost information available for product:', product.name);
        costPerTub = 0; // Default to 0 instead of throwing error
      }

      const totalCost = costPerTub * item.quantity;
      console.log(`Total cost for ${product.name}: ${totalCost} (${costPerTub} × ${item.quantity})`);

      return {
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit: item.unit || 'tub',
        price: costPerTub,
        total: totalCost
      };
    }).filter(Boolean); // Remove null items

    const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);
    console.log('💰 Total bill amount:', totalAmount);

    // Find bill or create if does not exist
    console.log('🔍 Checking for existing bill...');
    let bill = await Bill.findOne({ orderId });
    
    if (bill) {
      console.log('📋 Existing bill found:', bill._id);
      if (bill.locked) {
        console.log('❌ Bill is locked');
        return res.status(403).json({ error: "Bill is locked and cannot be updated" });
      }
      console.log('🔄 Updating existing bill...');
      bill.items = billItems;
      bill.subtotal = totalAmount;
      bill.totalAmount = totalAmount;
      bill.billDate = new Date();
    } else {
      console.log('➕ Creating new bill...');
      bill = new Bill({
        distributorId: order.distributorId._id,
        orderId: order._id,
        billNumber: `BILL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        billDate: new Date(),
        customerName: order.customerName || 'Customer',
        customerPhone: order.customerPhone || '',
        items: billItems,
        subtotal: totalAmount,
        totalAmount: totalAmount,
        paymentMethod: 'pending',
        status: 'pending',
        locked: false
      });
    }

    console.log('💾 Saving bill...');
    const savedBill = await bill.save();
    console.log('✅ Bill saved successfully:', savedBill._id);
    
    res.status(200).json({ message: "Bill created/updated successfully", bill: savedBill });
  } catch (err) {
    console.error("❌ Error generating/updating bill:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ error: "Failed to generate/update bill", details: err.message });
  }
};

// Create new bill (admin or staff)
exports.createBill = async (req, res) => {
  try {
    const {
      orderId,
      billNumber,
      billDate,
      customerName,
      customerPhone,
      items,
      subtotal,
      totalAmount,
      paymentMethod,
      status
    } = req.body;

    // Validate required fields
    if (!orderId || !billNumber || !billDate || !customerName || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the order to find distributorId
    const order = await Order.findById(orderId).populate('distributorId');
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create new bill
    const bill = new Bill({
      distributorId: order.distributorId._id,
      orderId,
      billNumber,
      billDate,
      customerName,
      customerPhone,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.total
      })),
      subtotal,
      totalAmount,
      paymentMethod,
      status: status || 'pending',
      createdAt: new Date()
    });

    const savedBill = await bill.save();
    
    // Populate the saved bill with order details
    const populatedBill = await Bill.findById(savedBill._id)
      .populate("orderId", "orderDate status customerName")
      .populate("distributorId", "distributorName name");

    res.status(201).json({
      message: "Bill created successfully",
      bill: populatedBill
    });
  } catch (err) {
    console.error("Error creating bill:", err);
    res.status(500).json({ error: "Failed to create bill", details: err.message });
  }
};

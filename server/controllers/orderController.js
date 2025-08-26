const Order = require("../models/Order");
const Bill = require("../models/Bill");
const Distributor = require("../models/Distributor");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { distributorId, orderDate, items, customerName, customerPhone } = req.body;
    
    // Debug logging
    console.log('createOrder received:', {
      distributorId,
      orderDate,
      items,
      itemsLength: items ? items.length : 0,
      body: req.body
    });

    const userId = (req.user && (req.user._id || req.user.id)) || null;
    
    // Debug logging for authentication
    console.log('Authentication debug:', {
      reqUser: req.user,
      userId,
      hasUserId: !!userId
    });
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated: missing user id" });
    }

    // Determine the user model based on the user's role
    let userModel = 'Staff'; // Default to Staff
    if (req.user.role === 'admin') {
      userModel = 'Admin';
    } else if (req.user.role === 'staff') {
      userModel = 'Staff';
    }
    
    // Debug logging for user role and model
    console.log('User role and model determination:', {
      userId: req.user._id,
      userRole: req.user.role,
      userModel: userModel,
      reqUserKeys: Object.keys(req.user)
    });

    if (!distributorId || !orderDate || !items || !Array.isArray(items) || items.length === 0) {
      console.log('Basic validation failed:', {
        hasDistributorId: !!distributorId,
        hasOrderDate: !!orderDate,
        hasItems: !!items,
        isItemsArray: Array.isArray(items),
        itemsLength: items ? items.length : 0
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(distributorId)) {
      console.log('Distributor ID validation failed:', { distributorId, isValid: mongoose.Types.ObjectId.isValid(distributorId) });
      return res.status(400).json({ error: "Invalid distributorId" });
    }

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      
      // Debug logging for item validation
      console.log(`Item ${i} validation:`, {
        item,
        hasProductId: !!item?.productId,
        productIdValid: item?.productId ? mongoose.Types.ObjectId.isValid(item.productId) : false,
        quantity: item?.quantity,
        quantityValid: Number.isFinite(Number(item?.quantity)) && Number(item?.quantity) > 0,
        unit: item?.unit,
        unitValid: !!item?.unit && typeof item.unit === 'string'
      });
      
      if (!item || !item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ error: `Invalid productId at index ${i}` });
      }
      const quantityNum = Number(item.quantity);
      if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
        return res.status(400).json({ error: `Invalid quantity at index ${i}` });
      }
      if (!item.unit || typeof item.unit !== 'string') {
        return res.status(400).json({ error: `Invalid unit at index ${i}` });
      }
    }

    // Restrict orders to from tomorrow onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse the date more carefully to handle different formats
    let selectedDate;
    try {
      // If orderDate is already a Date object, use it directly
      if (orderDate instanceof Date) {
        selectedDate = new Date(orderDate);
      } else if (typeof orderDate === 'string') {
        // Handle ISO date strings and other formats
        selectedDate = new Date(orderDate);
        // Check if the date is valid
        if (isNaN(selectedDate.getTime())) {
          return res.status(400).json({ 
            error: "Invalid date format", 
            details: { orderDate, parsedDate: selectedDate }
          });
        }
      } else {
        return res.status(400).json({ 
          error: "Invalid date type", 
          details: { orderDate, type: typeof orderDate }
        });
      }
      selectedDate.setHours(0, 0, 0, 0);
    } catch (err) {
      console.error('Date parsing error:', err);
      return res.status(400).json({ 
        error: "Failed to parse date", 
        details: { orderDate, error: err.message }
      });
    }

    // Debug logging
    console.log('Date validation:', {
      today: today.toISOString(),
      selectedDate: selectedDate.toISOString(),
      orderDate: orderDate,
      isSelectedDateValid: selectedDate > today,
      todayTime: today.getTime(),
      selectedTime: selectedDate.getTime(),
      difference: selectedDate.getTime() - today.getTime()
    });

    if (selectedDate <= today) {
      return res.status(400).json({ 
        error: "Orders can only be placed from tomorrow onwards",
        details: {
          today: today.toISOString(),
          selectedDate: selectedDate.toISOString(),
          orderDate: orderDate
        }
      });
    }

    const newOrder = new Order({
      userId,
      userModel, // Add the user model type
      distributorId,
      orderDate: selectedDate,
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '',
      items,
      status: "pending",
      locked: false      // 🔔 ADDED: Always unlocked when created
    });

    // Debug logging for the order being created
    console.log('Creating new order with:', {
      userId: newOrder.userId,
      userModel: newOrder.userModel,
      distributorId: newOrder.distributorId,
      orderDate: newOrder.orderDate,
      itemsCount: newOrder.items.length
    });

    await newOrder.save();
    
    // Debug logging after save
    console.log('Order saved successfully:', {
      orderId: newOrder._id,
      userId: newOrder.userId,
      userModel: newOrder.userModel
    });

    // Generate bill automatically when order is created
    try {
      const billItems = [];
      let totalBillAmount = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.log(`⚠️ Product not found for item: ${item.productId}`);
          continue;
        }

        // 🆕 Use costPerTub directly, with fallback calculation
        let costPerTub = product.costPerTub;
        if (!costPerTub && product.costPerPacket && product.packetsPerTub) {
          costPerTub = product.costPerPacket * product.packetsPerTub;
          console.log(`�� Calculated costPerTub for ${product.name}: ${costPerTub}`);
        }
        if (!costPerTub) {
          console.log(`⚠️ No cost information for product: ${product.name}`);
          costPerTub = 0;
        }

        const totalCost = costPerTub * item.quantity;
        totalBillAmount += totalCost;

        billItems.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          unit: item.unit || 'tubs',
          price: costPerTub,
          total: totalCost
        });
      }
      // Create bill with simple structure
      const bill = new Bill({
        distributorId: distributorId,
        orderId: newOrder._id,
        billNumber: `BILL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        billDate: new Date(),
        customerName: customerName || 'Customer',
        customerPhone: customerPhone || '',
        items: billItems,
        subtotal: totalBillAmount,
        totalAmount: totalBillAmount,
        paymentMethod: 'pending',
        status: 'pending',
        locked: false // Bill is editable until order is delivered
      });

      await bill.save();
      console.log(`✅ Bill generated automatically for order ${newOrder._id} with amount: ₹${totalBillAmount}`);
    } catch (billError) {
      console.error('❌ Error generating bill:', billError);
      // Don't fail the order creation if bill generation fails
    }
    


    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("Order creation error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation error", details: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: "Invalid ID format", details: err.message });
    }
    res.status(500).json({ error: "Failed to place order", details: err.message });
  }
};

// Get orders by logged-in user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("distributorId", "name company")
      .populate("items.productId", "name company quantity unit imageUrl")
      .sort({ createdAt: -1 });

    // Manually populate user information since we have dynamic references
    const ordersWithUserInfo = await Promise.all(
      orders.map(async (order) => {
        try {
          // Debug logging to see what's in the order
          console.log('Processing order in getMyOrders:', {
            orderId: order._id,
            userId: order.userId,
            userModel: order.userModel,
            orderType: typeof order.userModel
          });
          
          let userInfo = null;
          if (order.userModel === 'Admin') {
            const Admin = require('../models/Admin');
            userInfo = await Admin.findById(order.userId).select('username email');
            console.log('Admin user found:', userInfo);
          } else if (order.userModel === 'Staff') {
            const Staff = require('../models/Staff');
            userInfo = await Staff.findById(order.userId).select('username email');
            console.log('Staff user found:', userInfo);
          } else {
            console.log('Unknown userModel:', order.userModel);
          }
          
          return {
            ...order.toObject(),
            userId: userInfo
          };
        } catch (err) {
          console.error('Error populating user info for order:', order._id, err);
          return {
            ...order.toObject(),
            userId: { username: 'Unknown User', email: 'unknown@example.com' }
          };
        }
      })
    );

    res.json(ordersWithUserInfo);
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ error: "Failed to fetch orders", details: err.message });
  }
};

// Get all orders (for Admin or Staff visibility)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("distributorId", "name company")
      .populate("items.productId", "name company quantity unit imageUrl")
      .sort({ createdAt: -1 });

    // Manually populate user information since we have dynamic references
    const ordersWithUserInfo = await Promise.all(
      orders.map(async (order) => {
        try {
          // Debug logging to see what's in the order
          console.log('Processing order in getAllOrders:', {
            orderId: order._id,
            userId: order.userId,
            userModel: order.userModel,
            orderType: typeof order.userModel
          });
          
          let userInfo = null;
          if (order.userModel === 'Admin') {
            const Admin = require('../models/Admin');
            userInfo = await Admin.findById(order.userId).select('username email');
            console.log('Admin user found:', userInfo);
          } else if (order.userModel === 'Staff') {
            const Staff = require('../models/Staff');
            userInfo = await Staff.findById(order.userId).select('username email');
            console.log('Staff user found:', userInfo);
          } else {
            console.log('Unknown userModel:', order.userModel);
          }
          
          return {
            ...order.toObject(),
            userId: userInfo
          };
        } catch (err) {
          console.error('Error populating user info for order:', order._id, err);
          return {
            ...order.toObject(),
            userId: { username: 'Unknown User', email: 'unknown@example.com' }
          };
        }
      })
    );

    res.json(ordersWithUserInfo);
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ error: "Failed to fetch all orders", details: err.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    // Find the order first
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order is locked
    if (order.locked) {
      return res.status(403).json({ error: "Order is locked and cannot be deleted" });
    }

    // Allow deletion if user is admin/staff (can delete any order) OR if it's their own order
    if (req.user.role === 'admin' || req.user.role === 'staff' || order.userId.toString() === req.user._id.toString()) {
      await Order.deleteOne({ _id: req.params.id });
      res.json({ message: "Order deleted successfully" });
    } else {
      res.status(403).json({ error: "You can only delete your own orders" });
    }
  } catch (err) {
    console.error("deleteOrder error:", err);
    res.status(500).json({ error: "Failed to delete order", details: err.message });
  }
};

// Update order
exports.updateOrder = async (req, res) => {
  try {
    const { orderDate, items } = req.body;
    
    // Find the order first
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order is locked
    if (order.locked) {
      return res.status(403).json({ error: "Order is locked and cannot be updated" });
    }

    // Allow update if user is admin/staff (can update any order) OR if it's their own order
    if (req.user.role === 'admin' || req.user.role === 'staff' || order.userId.toString() === req.user._id.toString()) {
      order.orderDate = orderDate || order.orderDate;
      order.items = items || order.items;
      await order.save();
      await order.populate("distributorId items.productId");
      res.json(order);
    } else {
      res.status(403).json({ error: "You can only update your own orders" });
    }
  } catch (err) {
    console.error("updateOrder error:", err);
    res.status(500).json({ error: "Failed to update order", details: err.message });
  }
};

// Mark order as delivered and credit wallet
exports.markOrderDelivered = async (req, res) => {
  const { id } = req.params;
  console.log('🚚 markOrderDelivered called for order:', id);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Invalid order ID:', id);
    return res.status(400).json({ error: "Invalid order id" });
  }
  
  try {
    // Load order with product details for bill generation
    console.log('📋 Loading order details...');
    const order = await Order.findById(id)
      .populate("distributorId", "_id name distributorName")
      .populate("items.productId", "name costPerTub costPerPacket packetsPerTub");

    if (!order) {
      console.log('❌ Order not found:', id);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log('✅ Order found:', {
      orderId: order._id,
      status: order.status,
      locked: order.locked,
      distributorId: order.distributorId._id
    });

    if (order.locked || order.status === "delivered") {
      console.log('❌ Order already delivered/locked');
      return res.status(400).json({ error: "Order already delivered/locked" });
    }

    // Find existing bill or generate one if it doesn't exist
    console.log('🔍 Checking for existing bill...');
    let bill = await Bill.findOne({ orderId: order._id });
    
    if (!bill) {
      console.log('📄 No bill found, generating automatically...');
      try {
        // Generate bill automatically
        // Generate bill automatically
        const billItems = [];
        let totalBillAmount = 0;

        for (const item of order.items) {
          const product = item.productId;
          if (!product) {
            console.log('⚠️ Product not found for item, skipping:', item);
            continue;
          }

          // 🆕 Use costPerTub directly, with fallback calculation
          let costPerTub = product.costPerTub;
          if (!costPerTub && product.costPerPacket && product.packetsPerTub) {
            costPerTub = product.costPerPacket * product.packetsPerTub;
            console.log(`�� Calculated costPerTub for ${product.name}: ${costPerTub}`);
          }
          
          if (!costPerTub) {
            console.log('⚠️ No cost information for product:', product.name);
            costPerTub = 0; // Default to 0 instead of failing
          }

          const totalCost = costPerTub * item.quantity;
          totalBillAmount += totalCost;

          billItems.push({
            productId: product._id,
            productName: product.name,
            quantity: item.quantity,
            unit: item.unit || 'tubs',
            price: costPerTub,
            total: totalCost
          });
        }

        console.log('💰 Calculated bill amount:', totalBillAmount);

        // Create the bill
        bill = new Bill({
          distributorId: order.distributorId._id,
          orderId: order._id,
          billNumber: `BILL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          billDate: new Date(),
          customerName: order.customerName || 'Customer',
          customerPhone: order.customerPhone || '',
          items: billItems,
          subtotal: totalBillAmount,
          totalAmount: totalBillAmount,
          paymentMethod: 'pending',
          status: 'pending',
          locked: false
        });

        await bill.save();
        console.log('✅ Bill generated automatically:', bill._id);
      } catch (billError) {
        console.error('❌ Error generating bill automatically:', billError);
        return res.status(500).json({ 
          error: "Failed to generate bill for delivery", 
          details: billError.message 
        });
      }
    } else {
      console.log('✅ Existing bill found:', bill._id);
      if (bill.locked) {
        console.log('❌ Bill already locked');
        return res.status(400).json({ error: "Bill already locked for this order" });
      }
    }

    // Lock the bill
    console.log('🔒 Locking bill...');
    bill.locked = true;
    bill.status = 'completed';
    await bill.save();

    // Update distributor wallet with bill amount
    console.log('💳 Crediting distributor wallet...');
    const distributorId = order.distributorId._id || order.distributorId;
    const updatedDistributor = await Distributor.findByIdAndUpdate(
      distributorId,
      { $inc: { walletBalance: bill.totalAmount } },
      { new: true }
    );
    
    if (!updatedDistributor) {
      console.log('❌ Distributor not found while crediting wallet');
      return res.status(404).json({ error: "Distributor not found while crediting wallet" });
    }

    console.log('✅ Wallet credited:', bill.totalAmount, 'New balance:', updatedDistributor.walletBalance);

    // Lock order and set delivered status
    console.log('🔒 Locking order and setting delivered status...');
    order.status = "delivered";
    order.locked = true;
    await order.save();

    console.log('✅ Order marked as delivered successfully');
    res.json({
      message: "Order marked as delivered. Bill generated (if needed), wallet credited, and records locked.",
      orderId: order._id,
      billId: bill._id,
      creditedAmount: bill.totalAmount,
      walletBalance: updatedDistributor.walletBalance,
      billGenerated: !bill.createdAt || new Date() - bill.createdAt < 1000 // Indicates if bill was just created
    });
  } catch (err) {
    console.error('❌ Error in markOrderDelivered:', err);
    console.error('❌ Error stack:', err.stack);
    const message = err?.message || "Failed to mark order delivered";
    return res.status(500).json({ error: message, details: err.message });
  }
};

exports.getTomorrowPendingOrders = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const orders = await Order.find({
      distributorId: req.user.id,
      status: "pending",
      orderDate: { $gte: tomorrow, $lt: dayAfterTomorrow }
    }).populate("items.productId","name quantity unit company");

    res.json(orders);
  } catch (error) {
    console.error("Error fetching tomorrow's pending orders:", error);
    res.status(500).json({ error: "Failed to fetch tomorrow's orders" });
  }
};

// Get all orders for a distributor
exports.getDistributorOrders = async (req, res) => {
  try {
    const distributorId = req.user.id;
    
    if (!distributorId) {
      return res.status(401).json({ error: "Distributor ID not found" });
    }

    // Get all orders assigned to this distributor
    const orders = await Order.find({
      distributorId: distributorId
    })
    .populate("items.productId", "name quantity unit company costPerPacket packetsPerTub")
    .sort({ orderDate: -1, createdAt: -1 }); // Most recent first

    // Transform the data to match the frontend expectations
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderDate: order.orderDate,
      status: order.status,
      customerName: order.customerName || 'Customer',
      customer: { name: order.customerName || 'Customer' },
      items: order.items.map(item => ({
        productId: {
          name: item.productId ? item.productId.name : 'N/A',
          unit: item.unit || 'units'
        },
        quantity: item.quantity,
        costPerUnit: item.productId ? (item.productId.costPerPacket * (item.productId.packetsPerTub || 1)) : 0,
        unit: item.unit || 'units'
      })),
      deliveryDate: order.deliveryDate,
      locked: order.locked,
      createdAt: order.createdAt
    }));

    res.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching distributor orders:", error);
    res.status(500).json({ error: "Failed to fetch distributor orders" });
  }
};

// Confirm delivery by distributor
exports.confirmDistributorDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const distributorId = req.user.id;
    const { deliveryDate, distributorNotes } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Find the order and verify it belongs to this distributor
    const order = await Order.findOne({
      _id: orderId,
      distributorId: distributorId
    }).populate("items.productId", "name quantity unit company costPerPacket packetsPerTub");

    if (!order) {
      return res.status(404).json({ error: "Order not found or not assigned to you" });
    }

    if (order.status === "delivered") {
      return res.status(400).json({ error: "Order is already marked as delivered" });
    }

    if (order.locked) {
      return res.status(400).json({ error: "Order is locked and cannot be modified" });
    }

    // Update order status to delivered
    order.status = "delivered";
    order.deliveryDate = deliveryDate || new Date();
    order.distributorNotes = distributorNotes || "Order delivered successfully";
    order.updatedAt = new Date();

    await order.save();

    // Send success response
    res.json({
      message: "Order marked as delivered successfully",
      orderId: order._id,
      deliveryDate: order.deliveryDate,
      status: order.status
    });

  } catch (error) {
    console.error("Error confirming distributor delivery:", error);
    res.status(500).json({ error: "Failed to confirm delivery" });
  }
};

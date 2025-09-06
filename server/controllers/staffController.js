const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUserSession, destroySession } = require("../middlewares/sessionMiddleware");

exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find({}, "-password"); // exclude password hash
    res.json(staffList);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Error fetching staff" });
  }
};

exports.addStaff = async (req, res) => {
  const { name, role, username, password, email, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = new Staff({
      name,
      role,
      username,
      email,
      phone,
      password: hashedPassword
    });
    await staff.save();
    res.json({ message: "Staff added successfully" });
  } catch (err) {
    console.error("Error adding staff:", err);
    res.status(500).json({ message: "Error adding staff" });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, role, username, email, phone, password } = req.body;

  console.log("updateStaff called with ID:", id);
  console.log("Request body:", req.body);

  try {
    const updateData = { name, role, username, email, phone };
    
    // Only hash password if it's provided
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    console.log("Update data:", updateData);

    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStaff) {
      console.log("Staff member not found with ID:", id);
      return res.status(404).json({ message: "Staff member not found" });
    }

    console.log("Staff updated successfully:", updatedStaff);
    res.json({ message: "Staff updated successfully", staff: updatedStaff });
  } catch (err) {
    console.error("Error updating staff:", err);
    res.status(500).json({ message: "Error updating staff" });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ message: "Error deleting staff" });
  }
};

exports.staffLogin = async (req, res) => {
  const { username, password } = req.body;
  console.log("🔐 staffController - Login attempt for username:", username);
  
  try {
    const staff = await Staff.findOne({ username });
    if (!staff) {
      console.log("❌ staffController - Staff not found for username:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("✅ staffController - Staff found:", { id: staff._id, username: staff.username, role: staff.role });
    
    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      console.log("❌ staffController - Password mismatch for username:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("✅ staffController - Password verified for username:", username);
    
    // Create session for staff and wait for it to be saved
    await createUserSession(req, staff, 'staff');
    
    // Debug: Check if session was created
    console.log("🔍 staffController - After session creation:", {
      sessionId: req.session?.id,
      userId: req.session?.userId,
      userRole: req.session?.userRole,
      sessionExists: !!req.session
    });
    
    const tokenPayload = { id: staff._id, username: staff.username, role: "staff" };
    const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
    
    console.log("🔐 staffController - Creating token with payload:", tokenPayload);
    console.log("🔐 staffController - Using JWT secret:", jwtSecret ? "SECRET_SET" : "DEFAULT_SECRET");
    
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "2h" });
    
    console.log("✅ staffController - Token created successfully:", { 
      tokenLength: token.length, 
      tokenPreview: token.substring(0, 20) + "..." 
    });
    
    // Debug: Check response headers
    console.log("🔍 staffController - Response headers:", {
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
      token,
      user: {
        id: staff._id,
        username: staff.username,
        name: staff.name,
        email: staff.email,
        role: 'staff'
      }
    });
  } catch (err) {
    console.error("❌ staffController - Staff login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout staff
exports.staffLogout = async (req, res) => {
  try {
    destroySession(req, res, () => {
      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error("Staff logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// Get current session info for staff
exports.getStaffSessionInfo = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        message: "No active session",
        sessionExpired: true 
      });
    }

    const staff = await Staff.findById(req.session.userId).select('-password');
    if (!staff) {
      req.session.destroy();
      return res.status(401).json({ 
        message: "User not found",
        sessionExpired: true 
      });
    }

    res.json({
      user: {
        id: staff._id,
        username: staff.username,
        name: staff.name,
        email: staff.email,
        role: 'staff'
      },
      session: {
        userId: req.session.userId,
        userRole: req.session.userRole,
        username: req.session.username
      }
    });
  } catch (error) {
    console.error("Get staff session info error:", error);
    res.status(500).json({ message: "Failed to get session info" });
  }
};


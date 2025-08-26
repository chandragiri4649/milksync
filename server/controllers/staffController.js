const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    
    const tokenPayload = { id: staff._id, username: staff.username, role: "staff" };
    const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
    
    console.log("🔐 staffController - Creating token with payload:", tokenPayload);
    console.log("🔐 staffController - Using JWT secret:", jwtSecret ? "SECRET_SET" : "DEFAULT_SECRET");
    
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "2h" });
    
    console.log("✅ staffController - Token created successfully:", { 
      tokenLength: token.length, 
      tokenPreview: token.substring(0, 20) + "..." 
    });
    
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ staffController - Staff login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


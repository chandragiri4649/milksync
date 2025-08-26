const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("🔐 authMiddleware - Request URL:", req.url);
  console.log("🔐 authMiddleware - Authorization header:", req.headers.authorization ? "Present" : "Missing");
  
  if (req.headers.authorization) {
    console.log("🔐 authMiddleware - Full auth header:", req.headers.authorization.substring(0, 20) + "...");
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ authMiddleware - No valid authorization header");
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  console.log("🔐 authMiddleware - Token extracted (first 20 chars):", token.substring(0, 20) + "...");
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    console.log("✅ authMiddleware - Token decoded successfully:", { 
      id: decoded.id, 
      username: decoded.username, 
      role: decoded.role,
      exp: decoded.exp 
    });
    
    // Normalize user shape so downstream code can rely on _id
    req.user = { ...decoded };
    if (!req.user._id && decoded.id) {
      req.user._id = decoded.id;
    }
    
    console.log("✅ authMiddleware - req.user set:", req.user);
    next();
  } catch (err) {
    console.log("❌ authMiddleware - Token verification failed:", err.message);
    console.log("❌ authMiddleware - JWT_SECRET used:", process.env.JWT_SECRET || "your_jwt_secret");
    return res.status(401).json({ message: "Invalid token" });
  }
};

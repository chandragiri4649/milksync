// middlewares/adminOrStaffMiddleware.js
module.exports = function (req, res, next) {
  console.log("adminOrStaffMiddleware - User:", req.user);
  console.log("adminOrStaffMiddleware - User role:", req.user?.role);
  
  if (req.user?.role === "admin" || req.user?.role === "staff") {
    console.log("adminOrStaffMiddleware - Access granted");
    return next();
  }
  console.log("adminOrStaffMiddleware - Access denied");
  res.status(403).json({ message: "Access denied: Admins or Staff only" });
};

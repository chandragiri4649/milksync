module.exports = function distributorRoleMiddleware(req, res, next) {
  // Assumes req.user.role is set by your authMiddleware after JWT verification
  if (req.user && req.user.role === "distributor") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Distributor only" });
};
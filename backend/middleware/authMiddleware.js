// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// 🔐 Protect middleware (JWT verification)
// 🔐 Protect middleware (JWT verification)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Fetch latest user info from DB (role + district)
      const user = await User.findById(decoded.id).select("role district isActive");
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      // ✅ Block inactive users (optional but good)
      if (user.isActive === false) {
        return res.status(403).json({ message: "Account deactivated. Contact admin." });
      }

      // ✅ Attach to req.user
      req.user = {
        id: user._id.toString(),
        role: user.role,
        district: user.district,
      };

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};




// 🔒 Admin-only middleware (STEP 3 FIX)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

// 🎭 Optional: Role-based authorization (still usable elsewhere)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};

module.exports = {
  protect,
  adminOnly,
  authorizeRoles,
};

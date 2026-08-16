const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const userId = user?._id || user?.id || user;
  const payload = {
    id: userId,
    role: user?.role || "user",
    email: user?.email,
    username: user?.username,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = generateToken;
const User = require("../models/user.model");

const getAdminOverview = async (req, res) => {
  try {
    const [totalUsers, adminCount, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.find().sort({ createdAt: -1 }).limit(5).select("-password"),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        currentUser: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          role: req.user.role,
        },
        totals: {
          totalUsers,
          adminCount,
        },
        recentUsers: recentUsers.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin overview",
    });
  }
};

module.exports = {
  getAdminOverview,
};

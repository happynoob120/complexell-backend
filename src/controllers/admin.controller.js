const User = require("../models/user.model");
const Article = require("../models/article.model");

const getAdminOverview = async (req, res) => {
  try {
    const [totalUsers, adminCount, bannedCount, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isBanned: true }),
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
          bannedCount,
        },
        recentUsers: recentUsers.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isBanned: user.isBanned,
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

const getUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users",
    });
  }
};

const toggleUserBan = async (req, res, forceValue = null) => {
  try {
    const { id } = req.params;
    const { ban, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const shouldBan = forceValue !== null ? forceValue : ban === true || ban === "true";

    user.isBanned = shouldBan;
    if (shouldBan) {
      user.bannedAt = new Date();
      user.bannedReason = reason || "Admin action";
    } else {
      user.bannedAt = null;
      user.bannedReason = "";
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: shouldBan ? "User banned successfully" : "User unbanned successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBanned: user.isBanned,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user ban status",
    });
  }
};

const getArticlesForAdmin = async (req, res) => {
  try {
    const articles = await Article.find({})
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      articles: articles.map((article) => ({
        id: article._id,
        title: article.article_title,
        slug: article.slug,
        author: article.author ? article.author.username : "Unknown",
        authorEmail: article.author ? article.author.email : "",
        createdAt: article.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to load articles",
    });
  }
};

module.exports = {
  getAdminOverview,
  getUsersForAdmin,
  toggleUserBan,
  getArticlesForAdmin,
};

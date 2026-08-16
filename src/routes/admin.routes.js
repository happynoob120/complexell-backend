const express = require("express");
const protect = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");
const {
  getAdminOverview,
  getUsersForAdmin,
  toggleUserBan,
  getArticlesForAdmin,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/overview", protect, requireAdmin, getAdminOverview);
router.get("/users", protect, requireAdmin, getUsersForAdmin);
router.get("/articles", protect, requireAdmin, getArticlesForAdmin);
router.patch("/users/:id/ban", protect, requireAdmin, (req, res) => toggleUserBan(req, res, true));
router.patch("/users/:id/unban", protect, requireAdmin, (req, res) => toggleUserBan(req, res, false));

module.exports = router;

const express = require("express");
const protect = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");
const { getAdminOverview } = require("../controllers/admin.controller");

const router = express.Router();

router.get("/overview", protect, requireAdmin, getAdminOverview);

module.exports = router;

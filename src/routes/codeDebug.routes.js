const express = require("express");
const { diagnoseCode } = require("../controllers/codeDebug.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/diagnose", protect, diagnoseCode);

module.exports = router;

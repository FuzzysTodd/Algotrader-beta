const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { constants: { ENUM: { ROLE } } } = require("../helpers")

const { TRADE: { VALIDATOR, APIS } } = require("../controllers");

/* Post Apis */
router.post("/", auth({ isTokenRequired: false }), VALIDATOR.Trade, APIS.Trade);

module.exports = router;

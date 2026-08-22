const express = require('express');
const router = express.Router();
const { getSafetyAdvice } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

router.post('/advise', optionalAuth, getSafetyAdvice);

module.exports = router;

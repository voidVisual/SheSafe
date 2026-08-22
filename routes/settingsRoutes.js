const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;

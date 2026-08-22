const express = require('express');
const router = express.Router();
const { triggerSOS, getActiveSOS, resolveSOS, getSOSHistory } = require('../controllers/sosController');
const { authenticate } = require('../middleware/auth');

// All SOS routes require authentication
router.use(authenticate);

router.post('/trigger', triggerSOS);
router.get('/status', getActiveSOS);
router.post('/resolve', resolveSOS);
router.get('/history', getSOSHistory);

module.exports = router;

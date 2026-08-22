const express = require('express');
const router = express.Router();
const { updateLocation, getCurrentLocation, getLocationHistory } = require('../controllers/locationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/update', updateLocation);
router.get('/current', getCurrentLocation);
router.get('/history', getLocationHistory);

module.exports = router;

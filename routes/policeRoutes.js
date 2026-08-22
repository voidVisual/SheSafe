const express = require('express');
const router = express.Router();
const { getHelplines, getNearbyPolice } = require('../controllers/policeController');

router.get('/helplines', getHelplines);
router.get('/nearby', getNearbyPolice);

module.exports = router;

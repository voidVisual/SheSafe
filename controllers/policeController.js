/**
 * Verified emergency helplines directory
 */
const HELPLINES = [
  {
    name: 'National Emergency Number',
    number: '112',
    description: 'All-in-one emergency helpline for Police, Fire, and Ambulance across India',
    category: 'Universal',
    isPrimary: true
  },
  {
    name: "Women's Helpline (National)",
    number: '1091',
    description: '24x7 dedicated emergency helpline for women in distress',
    category: 'Women Safety',
    isPrimary: true
  },
  {
    name: 'Women Helpline (Domestic Abuse / NCW)',
    number: '181',
    description: '24-hour toll-free emergency response for women affected by violence',
    category: 'Women Safety',
    isPrimary: false
  },
  {
    name: 'Police Emergency',
    number: '100',
    description: 'Direct Police Control Room dispatch',
    category: 'Police',
    isPrimary: true
  },
  {
    name: 'Women Power Line',
    number: '1090',
    description: 'Dedicated support for harassment, stalking, and cyber safety',
    category: 'Women Safety',
    isPrimary: false
  },
  {
    name: 'Medical Emergency / Ambulance',
    number: '108',
    description: 'Immediate medical ambulance and paramedic assistance',
    category: 'Medical',
    isPrimary: false
  },
  {
    name: 'Cyber Crime Helpline',
    number: '1930',
    description: 'National cyber fraud & digital harassment reporting',
    category: 'Cyber Safety',
    isPrimary: false
  }
];

/**
 * Get verified emergency helplines
 * GET /api/police/helplines
 */
const getHelplines = (req, res) => {
  return res.status(200).json({
    success: true,
    helplines: HELPLINES
  });
};

/**
 * Get nearby police stations query and recommendations
 * GET /api/police/nearby
 */
const getNearbyPolice = (req, res) => {
  const { lat, lon, radius = 5000 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      message: 'Latitude (lat) and Longitude (lon) parameters are required.'
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  const googleMapsSearchUrl = `https://www.google.com/maps/search/police+station/@${latitude},${longitude},15z`;
  const osmSearchUrl = `https://www.openstreetmap.org/search?query=police#map=16/${latitude}/${longitude}`;

  return res.status(200).json({
    success: true,
    userLocation: {
      latitude,
      longitude
    },
    googleMapsUrl: googleMapsSearchUrl,
    osmUrl: osmSearchUrl,
    emergencyHelplines: HELPLINES.filter(h => h.isPrimary),
    guidance: 'In immediate life-threatening danger, dial 112 or 1091 instantly or tap the SOS button to alert all emergency contacts.'
  });
};

module.exports = {
  getHelplines,
  getNearbyPolice
};

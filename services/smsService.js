const twilio = require('twilio');

// Initialize Twilio client if keys are present
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && apiKey && apiSecret) {
  try {
    client = twilio(apiKey, apiSecret, { accountSid });
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error.message);
  }
}

/**
 * Sends an emergency SMS using Twilio.
 * If Twilio is not configured, it simulates the SMS dispatch gracefully.
 * 
 * @param {string} toPhone The recipient's phone number
 * @param {string} messageBody The emergency message
 * @returns {Promise<object>} Result of the dispatch
 */
const sendEmergencySMS = async (toPhone, messageBody) => {
  if (!client || !twilioPhone) {
    console.log(`[SIMULATION] Sending SMS to ${toPhone}...`);
    console.log(`[SIMULATION MESSAGE] \n${messageBody}`);
    return { success: true, simulated: true, messageId: 'sim_' + Date.now() };
  }

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhone,
      to: toPhone
    });
    console.log(`[TWILIO] Successfully sent SMS to ${toPhone}. SID: ${message.sid}`);
    return { success: true, simulated: false, messageId: message.sid };
  } catch (error) {
    console.error(`[TWILIO ERROR] Failed to send SMS to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmergencySMS
};

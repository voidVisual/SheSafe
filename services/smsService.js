const twilio = require('twilio');

// Initialize Twilio client if keys are present
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
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
    // Note: Free Twilio trial accounts in certain regions (like India) restrict custom SMS bodies.
    // We send a predefined template to bypass this restriction during development/testing.
    // Once upgraded to a paid account, change this back to: body: messageBody
    const message = await client.messages.create({
      body: 'sms_appointment_reminders', 
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

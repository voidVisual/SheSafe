/**
 * Rule-based fallback safety advisor in case Gemini API is offline or key is inactive
 */
const getFallbackSafetyAdvice = (situation) => {
  const text = (situation || '').toLowerCase();

  if (text.includes('follow') || text.includes('behind') || text.includes('stalk')) {
    return `🚨 **Immediate Safety Steps for Being Followed:**\n` +
      `1. **Do NOT head home or into isolated areas.** Head directly toward a well-lit, crowded place (store, cafe, metro station, or fuel station).\n` +
      `2. **Stay on the phone:** Call an emergency contact or act like you are speaking to someone nearby who is expecting you right now.\n` +
      `3. **Trigger SheSafe SOS:** Tap the SOS button immediately so your trusted contacts receive your live GPS coordinates.\n` +
      `4. **If danger is imminent, dial 112 or 1091 (Women Helpline) immediately.**`;
  }

  if (text.includes('cab') || text.includes('taxi') || text.includes('auto') || text.includes('driver')) {
    return `🚕 **Cab / Ride Safety Steps:**\n` +
      `1. **Share Live Trip:** Open the Live Location tab in SheSafe and share your live route.\n` +
      `2. **Call a Family Member / Friend:** Loudly mention the vehicle license number and that you are on your way.\n` +
      `3. **If route deviates:** Firmly tell the driver to stop at a populated place. If they refuse, open the window, shout for attention, and trigger SOS or dial 112.`;
  }

  if (text.includes('dark') || text.includes('alone') || text.includes('scared') || text.includes('night')) {
    return `🌙 **Night / Isolated Area Safety Advice:**\n` +
      `1. **Keep moving toward illuminated roads:** Avoid shortcuts, parks, or unlit alleys.\n` +
      `2. **Keep hands free:** Keep your phone ready in your hand with emergency speed-dial ready.\n` +
      `3. **Stay alert:** Remove earphones/headphones to stay aware of your surroundings.\n` +
      `4. **Activate Live Location:** Let your emergency contacts track your position until you are safely indoors.`;
  }

  if (text.includes('harass') || text.includes('touch') || text.includes('threat') || text.includes('abuse')) {
    return `⚠️ **Harassment / Threat Response:**\n` +
      `1. **Make Noise / Draw Attention:** Loudly tell the person to back off in a firm, clear voice so bystanders notice.\n` +
      `2. **Move to a public space:** Approach a shopkeeper, security guard, or groups of families.\n` +
      `3. **Document & Report:** Note descriptions and call Women Powerline 1090 or National Emergency 112.\n` +
      `4. **Trigger SOS:** Tap the SOS button in SheSafe immediately.`;
  }

  return `🛡️ **Safety Guidance:**\n` +
    `1. **Trust your instincts:** If something feels wrong, remove yourself from the situation immediately.\n` +
    `2. **Stay in populated, well-lit spaces** and avoid isolated routes.\n` +
    `3. **Keep emergency contacts informed:** Share your live location via SheSafe.\n` +
    `4. **In any emergency:** Tap the red SOS button or dial 112 / 1091 for instant police assistance.`;
};

/**
 * AI Safety Assistant endpoint
 * POST /api/ai/advise
 */
const getSafetyAdvice = async (req, res, next) => {
  try {
    const { situation, location } = req.body;

    if (!situation || situation.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please describe the situation you need advice for.'
      });
    }

    const trimmedSituation = situation.trim();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // If no valid key is provided or placeholder is present, use fallback engine
    if (!apiKey || apiKey.startsWith('your_') || apiKey.length < 10) {
      const fallbackAdvice = getFallbackSafetyAdvice(trimmedSituation);
      return res.status(200).json({
        success: true,
        source: 'shesafe-safety-engine',
        advice: fallbackAdvice
      });
    }

    try {
      const promptText =
        `You are SheSafe AI, a compassionate, expert women's personal safety assistant.\n` +
        `The user is asking for guidance in this situation: "${trimmedSituation}".\n` +
        (location ? `User's current location info: ${location}.\n` : '') +
        `Provide concise, calm, practical, step-by-step safety advice.\n` +
        `Keep it brief (3-4 bullet points max), clear, and actionable.\n` +
        `If there is potential danger, advise dialing 112 / 1091 or triggering SOS.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500
            }
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({
          success: true,
          source: 'gemini-ai',
          advice: aiText
        });
      } else {
        console.warn('⚠️ Gemini API response issue, using emergency fallback engine:', data);
        const fallbackAdvice = getFallbackSafetyAdvice(trimmedSituation);
        return res.status(200).json({
          success: true,
          source: 'shesafe-safety-engine',
          advice: fallbackAdvice
        });
      }
    } catch (aiError) {
      console.warn('⚠️ AI Service call failed, reverting to emergency fallback:', aiError.message);
      const fallbackAdvice = getFallbackSafetyAdvice(trimmedSituation);
      return res.status(200).json({
        success: true,
        source: 'shesafe-safety-engine',
        advice: fallbackAdvice
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSafetyAdvice
};

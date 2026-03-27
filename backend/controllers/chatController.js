const axios = require('axios');

// @desc    Get Chatbot response from OpenRouter (Gemini Free)
// @route   POST /api/chat
// @access  Public
exports.getChatResponse = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Please provide a message",
            });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error("OPENROUTER_API_KEY is missing in backend .env");
            return res.status(500).json({ success: false, error: "Chatbot API Key not configured" });
        }

        const systemPrompt = `
            You are a helpful and polite bus ticketing assistant for "Bus Yatra". 
            
            STRICT RULES:
            1. ONLY answer questions related to bus bookings, routes, schedules, and ticketing in Nepal.
            2. If a user asks where or how to book a ticket, you MUST tell them to book through "Bus Yatra" (this app).
            3. If a user asks anything unrelated to buses (e.g., food, weather, general news, other travel types), politely decline by saying: "I'm sorry, I can only assist with bus ticketing queries for Bus Yatra. How can I help you with your bus journey today?"
            4. Keep responses very concise and friendly.
        `;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "http://localhost:3000", // Optional, for OpenRouter analytics
                    "X-Title": "BusYatra App", // Optional, for OpenRouter analytics
                    "Content-Type": "application/json"
                }
            }
        );

        const text = response.data.choices[0].message.content;

        res.status(200).json({
            success: true,
            data: text,
        });
    } catch (error) {
        console.error("--- OpenRouter Chat Error ---");
        console.error("Message:", error.message);
        if (error.response) {
            console.error("Error Data:", error.response.data);
        }
        res.status(500).json({
            success: false,
            error: "Chatbot error: " + (error.response?.data?.error?.message || error.message),
        });
    }
};

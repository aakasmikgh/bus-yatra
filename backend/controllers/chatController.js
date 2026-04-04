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

        const models = [
            "google/gemini-2.0-flash-lite:free",
            "openrouter/auto",
            "google/gemini-flash-1.5:free"
        ];

        let response;
        let lastErrorStatus;
        let lastErrorData;

        for (const model of models) {
            try {
                console.log(`[CHAT-V2] Attempting model: ${model}`);
                response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ],
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "HTTP-Referer": "https://busyatra.com", 
                            "X-Title": "BusYatra App", 
                            "Content-Type": "application/json"
                        },
                        timeout: 10000 
                    }
                );

                if (response.data && response.data.choices && response.data.choices.length > 0) {
                    console.log(`[CHAT-V2] Success with model: ${model}`);
                    break; 
                }
            } catch (err) {
                lastErrorStatus = err.response?.status;
                lastErrorData = err.response?.data;
                console.error(`[CHAT-V2] Model ${model} failed | Status: ${lastErrorStatus}`);
                continue; 
            }
        }

        // --- LAYER 2: DIRECT GEMINI FAILSAFE ---
        if (!response || !response.data || !response.data.choices || response.data.choices.length === 0) {
            console.log("[CHAT-V2] --- All OpenRouter Models Failed. Trying Direct Gemini API ---");
            
            const directGeminiKey = process.env.GEMINI_API_KEY;
            if (directGeminiKey) {
                // Try v1 and v1beta
                const urls = [
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${directGeminiKey}`,
                    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${directGeminiKey}`,
                    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${directGeminiKey}`
                ];

                for (const url of urls) {
                    try {
                        console.log(`[CHAT-V2] Trying Direct Gemini URL: ${url.split('?')[0]}`);
                        const directResponse = await axios.post(url, {
                            contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + message }] }]
                        });

                        const directText = directResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (directText) {
                            console.log("[CHAT-V2] Success with Direct Gemini API");
                            return res.status(200).json({ success: true, data: directText });
                        }
                    } catch (directErr) {
                        console.error("[CHAT-V2] Direct Gemini API failed for URL:", directErr.message);
                    }
                }
            }
        }

        // --- LAYER 3: EMERGENCY SMART LOCAL BACKUP (Guaranteed Response) ---
        if (!response || !response.data || !response.data.choices || response.data.choices.length === 0) {
            console.log("[CHAT-V2] --- All APIs Failed. Booting Local Assistant ---");
            
            let localResponse = "I'm currently in basic mode. How can I help with your bus journey today?";
            const lowMsg = message.toLowerCase();

            if (lowMsg.includes('ticket') || lowMsg.includes('book')) {
                localResponse = "You can book tickets directly in this app! Just select your destination on the Home screen, find a bus, and follow the payment steps.";
            } else if (lowMsg.includes('cancel') || lowMsg.includes('refund')) {
                localResponse = "To cancel a ticket, go to 'My Bookings', select your ticket, and tap 'Cancel'. Refunds are usually processed in 3-5 days.";
            } else if (lowMsg.includes('route') || lowMsg.includes('where')) {
                localResponse = "We offer routes to many destinations in Nepal (Dhulikhel, Kalanki, etc). You can search for routes on the Home screen!";
            } else if (lowMsg.includes('payment') || lowMsg.includes('khalti') || lowMsg.includes('stripe')) {
                localResponse = "We accept Khalti, Stripe, and Cash for ticketing payments. All your transactions are secure.";
            }

            return res.status(200).json({
                success: true,
                data: localResponse,
            });
        }

        const text = response.data.choices[0].message.content;

        res.status(200).json({
            success: true,
            data: text,
        });
    } catch (error) {
        console.error("[CHAT-V2] --- OpenRouter Chat Error ---");
        console.error("Message:", error.message);
        
        if (error.response) {
            console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
            
            // Handle 401 specifically for API Key issues
            if (error.response.status === 401) {
                return res.status(200).json({
                    success: true,
                    data: "I'm having trouble with my API key (Unauthorized). Please check the backend .env configuration!",
                });
            }
        }
        
        res.status(500).json({
            success: false,
            error: "Chatbot error: " + (error.response?.data?.error?.message || error.message),
        });
    }
};

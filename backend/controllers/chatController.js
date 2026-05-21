const axios = require('axios');
const Destination = require('../models/Destination');
const { spawn } = require('child_process');
const path = require('path');

// @desc    Get Chatbot response from OpenRouter (Gemini Free)

// @route   POST /api/chat
// @access  Public
exports.getChatResponse = async (req, res) => {
    try {
        const { message, lat, lng, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "Please provide a message" });
        }

        // --- SPATIAL INTENT DETECTION ---
        const lowMsg = message.toLowerCase();
        if (lowMsg.includes('nearest') || lowMsg.includes('closest') || lowMsg.includes('near me')) {
            if (lat && lng) {
                const destinations = await Destination.find({ latitude: { $exists: true }, longitude: { $exists: true } });
                if (destinations.length > 0) {
                    const stops = destinations.map(d => ({ name: d.name, lat: d.latitude, lng: d.longitude }));
                    const result = await new Promise((resolve) => {
                        const pythonProcess = spawn('python', [path.join(__dirname, '../algorithms/spatial_engine.py')]);
                        let dataStr = '';
                        pythonProcess.stdin.write(JSON.stringify({ userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }, stops: stops }));
                        pythonProcess.stdin.end();
                        pythonProcess.stdout.on('data', (d) => dataStr += d.toString());
                        pythonProcess.on('close', () => { try { resolve(JSON.parse(dataStr)); } catch (e) { resolve(null); } });
                    });
                    if (result && result.success) {
                        const stop = result.data;
                        return res.status(200).json({ success: true, data: `The nearest bus stop to you is ${stop.name}. It is approximately ${stop.distance} KM away. How else can I help you?` });
                    }
                }
            }
        }

        const systemPrompt = `
            You are "Yatra Assistant", a senior local travel expert for Bus Yatra in Nepal. 
            
            YOUR MISSION:
            Provide actual, helpful travel advice first. NEVER start a response by telling the user to "search in the app". 

            GREETINGS & GENERAL CONVERSATION:
            - If the user greets you (e.g., "hi", "hello", "hey", "namaste"), respond with a friendly greeting like "Hi! Welcome to Bus Yatra. How may I assist you today?" instead of giving unsolicited travel/routing advice. Only provide route details when the user actually asks for a route or travel destination.

            LOCAL KNOWLEDGE (Use this for travel queries!):
            - Kathmandu -> Pokhara: Tourist buses from Sorhakhutte (7 AM), Local from Gongabu.
            - Kirtipur -> Anywhere: Go to Kalanki or Gongabu.
            - Lamachaur -> Mustang: Go to "New Bus Park" (Prithvi Chowk/Gongabu area) in Pokhara to catch Mustang-bound buses.
            - Most buses passing through Kathmandu can be boarded at Kalanki.

            GUIDELINES:
            1. ONLY provide route or travel advice if the user asks for a route, destination, or travel details.
            2. ALWAYS give a specific location or bus park recommendation (e.g., "Go to New Bus Park").
            3. After giving the specific advice, you can mention: "You can see the exact timings and book seats on the Bus Yatra app."
            4. If the user asks "check it" or "ok", use the context to provide more details about the previous topic.
            5. Keep it friendly and snappy (max 2-3 sentences).
        `;

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error("OPENROUTER_API_KEY is missing in backend .env");
            return res.status(500).json({ success: false, error: "Chatbot API Key not configured" });
        }

        const models = ["google/gemini-2.0-flash-lite:free", "openrouter/auto", "google/gemini-flash-1.5:free"];
        let response;
        let lastErrorStatus;

        // Construct message array with history
        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-6).map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: msg.content
            })),
            { role: "user", content: message }
        ];

        for (const model of models) {
            try {
                console.log(`[CHAT-V3] Attempting model: ${model} with history count: ${apiMessages.length - 2}`);
                response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: model,
                        messages: apiMessages,
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
                    break; 
                }
            } catch (err) {
                lastErrorStatus = err.response?.status;
                console.error(`[CHAT-V3] Model ${model} failed | Status: ${lastErrorStatus}`);
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
            const lowMsg = message.toLowerCase().trim();

            if (lowMsg === 'hi' || lowMsg === 'hello' || lowMsg === 'hey' || lowMsg === 'namaste' || lowMsg === 'greetings') {
                localResponse = "Hi! Welcome to Bus Yatra. How may I assist you today?";
            } else if (lowMsg.includes('ticket') || lowMsg.includes('book')) {
                localResponse = "You can book tickets directly in this app! Just select your destination on the Home screen, find a bus, and follow the payment steps.";
            } else if ((lowMsg.includes('pokhara') || lowMsg.includes('pkr')) && lowMsg.includes('kathmandu')) {
                localResponse = "For Kathmandu to Pokhara, I recommend Sorhakhutte for Tourist buses (7 AM) or Gongabu for local/deluxe buses. You can book them right here in the app!";
            } else if (lowMsg.includes('cancel') || lowMsg.includes('refund')) {
                localResponse = "To cancel a ticket, go to 'My Bookings', select your ticket, and tap 'Cancel'. Refunds are usually processed in 3-5 days.";
            } else if (lowMsg.includes('route') || lowMsg.includes('where')) {
                localResponse = "We cover most major routes in Nepal including Pokhara, Chitwan, and Dharan. Check the Home screen to see the full list!";
            } else if (lowMsg.includes('payment') || lowMsg.includes('stripe')) {
                localResponse = "We accept Stripe and Cash for ticketing payments. All your transactions are secure.";
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

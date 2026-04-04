const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("Checking GEMINI_API_KEY...");
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        console.log("V1 Models:", response.data.models.map(m => m.name));
    } catch (err) {
        console.log("V1 List Failed:", err.message);
    }

    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log("V1Beta Models:", response.data.models.map(m => m.name));
    } catch (err) {
        console.log("V1Beta List Failed:", err.message);
    }
}

listModels();

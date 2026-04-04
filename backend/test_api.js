const axios = require('axios');

const testApi = async () => {
    try {
        const response = await axios.get('http://localhost:5001/api/destinations');
        console.log('API Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Count:', response.data.count);
        console.log('Data:', response.data.data.map(d => d.name));
        process.exit(0);
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
        process.exit(1);
    }
};

testApi();

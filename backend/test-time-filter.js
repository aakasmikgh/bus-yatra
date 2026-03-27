const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Route = require('./models/Route');

async function testFilter() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Exact logic from routeController to see where it breaks
    const routes = await Route.find({});
    console.log(`Found ${routes.length} total routes.`);
    
    const date = '27 Mar 2026'; // Mocking the frontend pass
    const searchDateObj = new Date(date);
    const today = new Date();
    
    console.log('Search Date:', searchDateObj.toLocaleString());
    console.log('Today:', today.toLocaleString());
    console.log('Date Match:', searchDateObj.getDate() === today.getDate() &&
                searchDateObj.getMonth() === today.getMonth() &&
                searchDateObj.getFullYear() === today.getFullYear());
                
    const filteredRoutes = routes.filter(route => {
        const timeStr = route.departureTime;
        console.log('Departure String:', timeStr);
        if (!timeStr) return true;
        
        const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3]; 

            if (period) {
                if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }

            const departureDate = new Date();
            departureDate.setHours(hours, minutes, 0, 0);

            console.log(`Evaluating Route: Dept Time: ${timeStr} -> ${departureDate.toLocaleString()} vs Today: ${today.toLocaleString()}`);
            return departureDate > today;
        }
        return true;
    });
    
    console.log(`Filtered out ${routes.length - filteredRoutes.length} routes.`);
    process.exit(0);
}

testFilter();

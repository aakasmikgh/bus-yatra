const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function testKNN() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB. Commencing K-Nearest Neighbors (KNN) Euclidean Test...\n');

        // Fetch existing users from the live database
        const users = await User.find({ age: { $exists: true }, gender: { $exists: true } }).limit(5);

        if (users.length < 2) {
            console.log('❌ Not enough users with Age and Gender data in the database to run KNN.');
            console.log('Please register at least 2 users with Profile Data in the Mobile app first!');
            process.exit(0);
        }

        const targetUser = users[0];
        console.log(`[TARGET USER] ${targetUser.name} | Age: ${targetUser.age} | Gender: ${targetUser.gender}`);
        console.log('----------------------------------------------------');

        const genderWeight = 10;
        
        // Calculate Euclidean Distance for the rest
        const distances = users.slice(1).map(user => {
            const ageDiff = targetUser.age - user.age;
            const targetGenderVal = targetUser.gender === 'Male' ? 1 : 0;
            const userGenderVal = user.gender === 'Male' ? 1 : 0;
            const genderDiff = (targetGenderVal - userGenderVal) * genderWeight;

            const distance = Math.sqrt((ageDiff * ageDiff) + (genderDiff * genderDiff));

            return {
                name: user.name,
                age: user.age,
                gender: user.gender,
                distance: distance.toFixed(2)
            };
        });

        // Sort by nearest neighbor
        distances.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        distances.forEach((d, index) => {
            console.log(`👤 Neighbor ${index + 1}: ${d.name} | Age: ${d.age} | Gender: ${d.gender} | Euclidean Distance = ${d.distance}`);
        });

        console.log('----------------------------------------------------');
        console.log(`✅ KNN MATHEMATICS PROVEN: The closest demographic match is ${distances[0].name} with distance ${distances[0].distance}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testKNN();

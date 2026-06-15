const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function testFetch() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // 1. Get an existing user
    const User = require('./models/User');
    const user = await User.findOne({ email: 'banrapolubharathreddy@gmail.com' }) || await User.findOne();
    if (!user) { console.log('No user found'); return; }
    console.log("Testing as user:", user.email);

    // 2. Generate a token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    // 3. Make the API request
    try {
        const res = await axios.get('http://localhost:3000/api/jobs?sort=match&page=1&limit=20', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`\n=== API Returned ${res.data.jobs.length} jobs ===`);
        res.data.jobs.forEach((j, i) => {
            console.log(`${i+1}. [Score: ${j.matchScore}] ${j.title} | ${j.company} | Insertion: ${j.created_at}`);
        });
        
    } catch (e) {
        console.error("API error:", e.response ? e.response.data : e.message);
    }
    mongoose.disconnect();
}
testFetch();

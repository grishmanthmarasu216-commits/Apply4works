const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function testDB() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const jobs = await Job.find().sort({ _id: -1 }).limit(20).lean();
    console.log("=== LATEST 20 JOBS ===");
    jobs.forEach(j => {
        console.log(`[${j._id.getTimestamp().toISOString()}] ${j.title} | ${j.company} | created_at: ${j.created_at} | postedAt: ${j.postedAt || 'N/A'}`);
    });
    
    mongoose.disconnect();
}
testDB();

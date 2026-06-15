const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function testDesc() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const jobs = await Job.find().sort({ _id: -1 }).limit(5).lean();
    console.log("=== NEWEST JOBS ===");
    jobs.forEach(j => {
        console.log(`[${j.title}] Description length: ${j.description ? j.description.length : 'MISSING'}`);
    });
    
    mongoose.disconnect();
}
testDesc();

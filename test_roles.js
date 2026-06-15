const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');


async function testRoles() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // 1. fetch 10 old jobs and 10 new jobs
    const newJobs = await Job.find().sort({ _id: -1 }).limit(10).lean();
    const oldJobs = await Job.find().sort({ _id: 1 }).limit(10).lean();

    const prefs = {
        roles: ['Network Engineer', 'Software Engineer']
    };

    const evalJob = (j) => {
        let score = 0;
        let jobTitle = (j.title || '').toLowerCase();
        for (const r of prefs.roles) {
            if (jobTitle === r.toLowerCase()) score = Math.max(score, 95);
            else if (jobTitle.includes(r.toLowerCase())) score = Math.max(score, 92);
        }
        return score;
    };

    console.log("=== NEW JOBS ===");
    newJobs.forEach(j => console.log(`[Score: ${evalJob(j)}] ${j.title} | ${j.company}`));
    console.log("\n=== OLD JOBS ===");
    oldJobs.forEach(j => console.log(`[Score: ${evalJob(j)}] ${j.title} | ${j.company}`));

    mongoose.disconnect();
}
testRoles();

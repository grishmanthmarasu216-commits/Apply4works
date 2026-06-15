const mongoose = require('mongoose');
const Job = require('./models/Job');
const jobsController = require('./controllers/jobsController');
require('dotenv').config({ path: './.env' });

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // 1. Initialize cache
    console.time("Init Cache");
    await jobsController.initializeJobsCache();
    console.timeEnd("Init Cache");
    
    // 2. Mock req and res
    const req = {
        query: { sort: 'match', page: 1, limit: 100 },
        user: { _id: new mongoose.Types.ObjectId() }
    };
    
    let page1Ids = new Set();
    const res1 = {
        json: (data) => {
            console.log(`Page 1: Returned ${data.jobs.length} jobs.`);
            data.jobs.forEach(j => page1Ids.add(j.id));
        }
    };
    
    console.time("API Request 1");
    await jobsController.getJobs(req, res1);
    console.timeEnd("API Request 1");
    
    req.query.page = 2;
    let overlapCount = 0;
    const res2 = {
        json: (data) => {
            console.log(`Page 2: Returned ${data.jobs.length} jobs.`);
            data.jobs.forEach(j => {
                if (page1Ids.has(j.id)) overlapCount++;
            });
            console.log(`Overlapping IDs: ${overlapCount}`);
        }
    };
    console.time("API Request 2");
    await jobsController.getJobs(req, res2);
    console.timeEnd("API Request 2");
    
    mongoose.disconnect();
}
runTest();

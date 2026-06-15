const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function testInvalidDate() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    try {
        const result = await Job.updateOne(
            { title: "Test Invalid Date Job", company: "Test Company" },
            {
                $setOnInsert: {
                    title: "Test Invalid Date Job",
                    company: "Test Company",
                    created_at: new Date("1 week ago")
                }
            },
            { upsert: true }
        );
        console.log("Upsert Result:", result);
        
        const job = await Job.findOne({ title: "Test Invalid Date Job" });
        console.log("Saved Job created_at:", job.created_at);
        console.log("Type of saved created_at:", typeof job.created_at);
    } catch (e) {
        console.error("Error:", e.message);
    }
    
    mongoose.disconnect();
}
testInvalidDate();

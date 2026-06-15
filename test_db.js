const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function checkDB() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:apply4works@cluster0.mongodb.net/apply4works?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
    
    const count = await Job.countDocuments();
    console.log("Total Jobs:", count);
    
    const latestJobs = await Job.find().sort({ _id: -1 }).limit(10).lean();
    
    console.log("\nLast 10 inserted jobs (by _id):");
    latestJobs.forEach(j => {
        console.log(`- ${j.title} | created_at: ${j.created_at} | postedAt: ${j.postedAt}`);
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const count24h = await Job.countDocuments({ _id: { $gt: mongoose.Types.ObjectId.createFromTime(oneDayAgo.getTime() / 1000) } });
    console.log("\nJobs inserted in last 24h (by _id):", count24h);

    const countCreatedAt24h = await Job.countDocuments({ created_at: { $gt: oneDayAgo } });
    console.log("Jobs with created_at in last 24h:", countCreatedAt24h);

    mongoose.disconnect();
}

checkDB().catch(console.error);

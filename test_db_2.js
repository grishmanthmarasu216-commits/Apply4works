const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function checkDB() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:apply4works@cluster0.mongodb.net/apply4works?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
    
    const count = await Job.countDocuments();
    console.log("Total Jobs:", count);
    
    const jobs = await Job.find().sort({ created_at: -1 }).limit(10).lean();
    
    console.log("\nLast 10 jobs by created_at DESC:");
    jobs.forEach(j => {
        console.log(`- [${j._id}] ${j.title} | created_at: ${j.created_at} | type: ${typeof j.created_at}`);
    });

    const nullCreatedAt = await Job.countDocuments({ created_at: null });
    console.log("\nJobs with created_at == null:", nullCreatedAt);

    mongoose.disconnect();
}

checkDB().catch(console.error);

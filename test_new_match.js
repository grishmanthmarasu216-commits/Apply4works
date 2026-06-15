const mongoose = require('mongoose');
const Job = require('./models/Job');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

// We extract getKeywordsForRole and calculateDetailedMatchScore from jobsController.js via eval to test them
const code = fs.readFileSync('./controllers/jobsController.js', 'utf-8');

const keywordRegex = /const getKeywordsForRole = \(role\) => \{([\s\S]*?)\n\};/g;
const kwMatch = keywordRegex.exec(code);
const getKeywordsForRole = new Function('role', kwMatch[1]);

const scoreRegex = /const calculateDetailedMatchScore = \(job, userPrefs, userCountry\) => \{([\s\S]*?)\n\};/g;
const scoreMatch = scoreRegex.exec(code);
const calculateDetailedMatchScore = new Function('job', 'userPrefs', 'userCountry', 
    `const getKeywordsForRole = ${getKeywordsForRole.toString()};\n` + scoreMatch[1]);


async function testMatching() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("=== TESTING BUSINESS ANALYST ===");
    
    // Fake jobs to test
    const jobs = [
        { _id: new mongoose.Types.ObjectId(), title: "Business Analyst", description: "business analysis", created_at: new Date() },
        { _id: new mongoose.Types.ObjectId(), title: "Strategy Analyst", description: "strategy", created_at: new Date() },
        { _id: new mongoose.Types.ObjectId(), title: "Product Analyst", description: "product", created_at: new Date() },
        { _id: new mongoose.Types.ObjectId(), title: "Business Transformation Consultant", description: "business", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
        { _id: new mongoose.Types.ObjectId(), title: "Full Stack Engineer", description: "react node", created_at: new Date() },
        { _id: new mongoose.Types.ObjectId(), title: "Reporting Analyst", description: "reports", created_at: new Date() }
    ];

    const prefs = { roles: ['Business Analyst', 'Software Engineer', 'Data Analyst'], skills: [] };

    for (const job of jobs) {
        job._id.getTimestamp = () => new Date(job.created_at);
        const md = calculateDetailedMatchScore(job, prefs, 'US');
        console.log(`[${md.score}%] - ${job.title} (${md.matchReason}) [Tier: ${md.tier}]`);
    }

    mongoose.disconnect();
}
testMatching();

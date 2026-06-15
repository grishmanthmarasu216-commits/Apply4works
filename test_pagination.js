const mongoose = require('mongoose');
const Job = require('./models/Job');
const crypto = require('crypto');
require('dotenv').config({ path: './.env' });

// Global Caching Mechanism
const recommendationCache = new Map();
let globalJobsVersion = Date.now();

// Mock dependencies
const userPrefs = { roles: ['Software Engineer'] };
const userCountry = 'US';
const matchQuery = {};

// Mock formatJobResponse
const formatJobResponse = (j) => ({ id: j._id.toString(), title: j.title });

async function testPagination(pageNum, limitNum) {
    const sort = 'match';
    const cacheKey = 'guest';
    const prefHash = JSON.stringify(userPrefs);
    const reqHash = JSON.stringify({ page: pageNum, limit: limitNum, sort: 'match' });
    const fullHash = crypto.createHash('md5').update(prefHash + reqHash).digest('hex');

    let broadKeywords = ['software engineer', 'software developer', 'backend developer'];
    
    if (broadKeywords.length > 0 && sort === 'match') {
        const cached = recommendationCache.get(cacheKey);
        if (cached && cached.prefHash === fullHash && cached.version >= globalJobsVersion) {
            console.log(`[Page ${pageNum}] Cache Hit`);
            const paginatedCachedJobs = cached.rawJobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);
            return paginatedCachedJobs.map(j => j._id.toString());
        }
    }

    console.log(`[Page ${pageNum}] Cache Miss - Fetching & Sorting`);
    let rawJobs = await Job.find(matchQuery).select('_id title created_at').lean();
    
    // Mock score
    rawJobs.forEach((j, i) => { j.matchScore = 80; j.tier = 2; });

    rawJobs.sort((a, b) => {
        const tierA = a.tier || 5;
        const tierB = b.tier || 5;
        if (tierA !== tierB) return tierA - tierB;
        
        const dateB = b._id && typeof b._id.getTimestamp === 'function' ? b._id.getTimestamp().getTime() : new Date(b?.created_at || 0).getTime();
        const dateA = a._id && typeof a._id.getTimestamp === 'function' ? a._id.getTimestamp().getTime() : new Date(a?.created_at || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;

        const scoreA = a.matchScore || 0;
        const scoreB = b.matchScore || 0;
        return scoreB - scoreA;
    });

    recommendationCache.set(cacheKey, {
        prefHash: fullHash,
        version: Date.now(),
        rawJobs: rawJobs,
        generatedKeywords: broadKeywords,
        totalJobsInDB: rawJobs.length
    });

    const paginatedJobs = rawJobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    return paginatedJobs.map(j => j._id.toString());
}

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const p1 = await testPagination(1, 5);
    console.log('Page 1 IDs:', p1);
    
    const p2 = await testPagination(2, 5);
    console.log('Page 2 IDs:', p2);
    
    const overlap = p1.filter(id => p2.includes(id));
    console.log('Overlap count:', overlap.length);
    
    mongoose.disconnect();
}
runTest();

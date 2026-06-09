const apifyService = require('./apifyService');
const Job = require('../models/Job');

const fetchJobs = async () => {
    try {
        console.log('\n========================================');
        console.log('STARTING BACKGROUND JOB FETCH FROM APIFY');
        console.log('========================================');

        let allJobs = [];

        console.log(`\n>>> Executing configured Apify tasks...`);
        const apifyJobs = await apifyService.fetchJobs();
        allJobs = allJobs.concat(apifyJobs);

        console.log(`\n[Apify] Total Jobs Retrieved: ${allJobs.length}`);
        console.log(`[Merge] Combined Jobs Count: ${allJobs.length}`);

        const uniqueJobs = [];
        const seenUrls = new Set();
        const seenSignatures = new Set();
        let duplicatesRemoved = 0;

        for (const job of allJobs) {
            const url = job.applyUrl || job.jobUrl;
            const sig = `${job.title}-${job.company}-${job.location}`.toLowerCase();
            
            if (url && seenUrls.has(url)) {
                duplicatesRemoved++;
                continue;
            }
            if (!url && seenSignatures.has(sig)) {
                duplicatesRemoved++;
                continue;
            }
            
            if (url) seenUrls.add(url);
            seenSignatures.add(sig);
            uniqueJobs.push(job);
        }

        console.log(`[Dedupe] Duplicates Removed: ${duplicatesRemoved}`);

        let totalInserted = 0;
        if (uniqueJobs.length > 0) {
            const stats = await apifyService.saveJobs(uniqueJobs);
            if (stats) {
                totalInserted = stats.inserted;
            }
        }

        console.log('\n========================================');
        console.log('BACKGROUND JOB FETCH CYCLE COMPLETE');
        console.log(`[Jobs] New Insertions: ${totalInserted}`);
        console.log(`[Jobs] Storage Complete`);
        const intervalHours = parseInt(process.env.JOB_FETCH_INTERVAL_HOURS) || 6;
        const nextSync = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
        console.log(`Next Scheduled Sync Time: ~${nextSync.toLocaleString()}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('CRITICAL: Failed to execute background fetch cycle:', error.message);
    }
};

module.exports = { fetchJobs };

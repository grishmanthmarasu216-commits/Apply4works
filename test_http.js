const axios = require('axios');

async function simulateFrontend() {
    console.log("Fetching Page 1...");
    const res1 = await axios.get('http://localhost:3000/api/jobs?page=1&limit=100&sort=match');
    const jobs1 = res1.data.jobs;
    console.log(`Page 1 fetched ${jobs1.length} jobs.`);
    
    console.log("Fetching Page 2...");
    const res2 = await axios.get('http://localhost:3000/api/jobs?page=2&limit=100&sort=match');
    const jobs2 = res2.data.jobs;
    console.log(`Page 2 fetched ${jobs2.length} jobs.`);
    
    // Check overlap
    let page1Ids = new Set(jobs1.map(j => j.id));
    let overlap = 0;
    jobs2.forEach(j => {
        if (page1Ids.has(j.id)) overlap++;
    });
    console.log(`Overlap between Page 1 and Page 2: ${overlap}`);
}

simulateFrontend().catch(console.error);

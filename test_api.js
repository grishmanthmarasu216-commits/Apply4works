const http = require('http');

http.get('http://localhost:3000/api/jobs?sort=match', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Total Jobs:", json.totalJobs);
            console.log("Top 5 Jobs returned by API:");
            json.jobs.slice(0, 5).forEach((j, i) => {
                console.log(`${i+1}. [${j.matchScore}%] ${j.title} | ${j.company} | ${j.postedDate}`);
            });
        } catch(e) {
            console.log("Error parsing JSON");
        }
    });
}).on('error', err => {
    console.log("Error making request:", err.message);
});

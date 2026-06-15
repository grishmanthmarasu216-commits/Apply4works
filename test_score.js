const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');
const fs = require('fs');

// We will simulate calculateDetailedMatchScore logic exactly as in jobsController
const getKeywordsForRole = (role) => {
    const r = role.toLowerCase();
    
    // Core Engineering
    if (r.includes('mechanical')) return ['mechanical', 'mechanical engineer', 'mechanical field engineer', 'mechanical project engineer', 'mechanical reliability engineer', 'mechanical maintenance engineer', 'mechanical design engineer', 'commissioning engineer', 'building engineer', 'datacenter mechanical'];
    if (r.includes('civil')) return ['civil', 'civil engineer', 'site engineer', 'structural engineer', 'design engineer', 'land development engineer', 'transportation engineer', 'construction engineer', 'environmental design engineer'];
    
    // Software & QA
    if (r.includes('qa') || r.includes('quality assurance')) return ['qa', 'quality assurance', 'qa engineer', 'qa analyst', 'test engineer', 'software tester', 'automation tester', 'sdet', 'automation testing specialist'];
    if (r.includes('frontend') || r.includes('front-end')) return ['frontend', 'front-end', 'frontend developer', 'frontend engineer', 'react', 'reactjs', 'javascript', 'typescript', 'ui developer', 'web developer'];
    if (r.includes('software')) return ['software engineer', 'software developer', 'backend developer', 'backend engineer', 'full stack', 'full-stack', 'programmer', 'application developer'];
    
    // Infrastructure & Network
    if (r.includes('network')) return ['network', 'network engineer', 'network administrator', 'network analyst', 'infrastructure engineer', 'noc engineer', 'systems network engineer', 'networking', 'infrastructure', 'systems', 'system administrator', 'datacenter', 'cloud infrastructure', 'noc'];
    
    // Data & Cyber
    if (r.includes('data analyst')) return ['data analyst', 'data analysis', 'business intelligence', 'bi analyst', 'sql analyst', 'reporting analyst'];
    if (r.includes('cybersecurity') || r.includes('security')) return ['cybersecurity', 'security engineer', 'information security', 'infosec', 'cyber security', 'soc analyst', 'penetration tester', 'security analyst'];
    
    // Fallback
    const core = r.replace(/engineer|developer|manager|analyst|specialist|consultant|architect|designer/ig, '').trim();
    let keywords = [r];
    if (core.length > 2) keywords.push(core);
    return keywords;
};

const calculateDetailedMatchScore = (job, userPrefs, userCountry) => {
    let bestScore = 0;
    let bestKeywords = [];
    let bestReason = "Fair Match";
    let bestFallbackStage = "Step 5: Related role matches";

    if (!userPrefs || !userPrefs.roles || userPrefs.roles.length === 0) {
        return { score: 50, matchedKeywords: [], matchReason: "General Match", fallbackStage: bestFallbackStage };
    }

    const jobTitle = (job.title || '').toLowerCase();
    const jobSkills = Array.isArray(job.skills_required) ? job.skills_required.map(s=>s.toLowerCase()) : (typeof job.skills_required === 'string' ? job.skills_required.toLowerCase().split(',').map(s=>s.trim()) : []);
    const desc = (job.description || '').toLowerCase();
    const reqs = (job.requirements || '').toLowerCase();
    const userSkills = (userPrefs.skills || []).map(s => s.toLowerCase());
    const jobLoc = (job.location || '').toLowerCase();
    const prefCountry = (userCountry || '').toLowerCase();
    const jobType = (job.job_type || '').toLowerCase();
    const prefType = (userPrefs.workMode || '').toLowerCase();
    const userExp = (userPrefs.experienceLevel || '').toLowerCase();
    const jobExp = (job.experienceLevel || '').toLowerCase();

    for (const r of userPrefs.roles) {
        const keywords = getKeywordsForRole(r);
        let currentScore = 0;
        let matchedKw = [];
        let fallbackStage = "Step 5: Related role matches";

        let baseScore = 0;
        let maxBonus = 0;

        // 1. Role Base Score
        if (jobTitle === r.toLowerCase()) {
            baseScore = 95;
            maxBonus = 5;
            fallbackStage = "Step 1: Direct role matches";
            matchedKw.push(r.toLowerCase());
        } else if (jobTitle.includes(r.toLowerCase())) {
            baseScore = 92;
            maxBonus = 8;
            fallbackStage = "Step 1: Direct role matches";
            matchedKw.push(r.toLowerCase());
        } else {
            for (const kw of keywords) {
                if (kw.length > 2 && jobTitle.includes(kw)) {
                    baseScore = Math.max(baseScore, 90);
                    maxBonus = 5;
                    matchedKw.push(kw);
                    fallbackStage = "Step 2: Synonym matches";
                }
            }
            if (baseScore === 0) {
                const roleWords = r.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['engineer','developer','manager'].includes(w));
                for (const rw of roleWords) {
                    if (jobTitle.includes(rw)) {
                        baseScore = Math.max(baseScore, 80);
                        maxBonus = 10;
                        matchedKw.push(rw);
                        fallbackStage = "Step 3: Partial keyword matches";
                    } else if (desc.includes(rw) || jobSkills.some(s => s.includes(rw))) {
                        baseScore = Math.max(baseScore, 60);
                        maxBonus = 20;
                        matchedKw.push(rw);
                        fallbackStage = "Step 4: Skill/Industry match";
                    }
                }
            }
        }

        if (baseScore === 0) {
           baseScore = 40;
           maxBonus = 20;
           fallbackStage = "Step 5: Related role matches";
        }

        // 2. Bonus Score (Skills, Exp, Loc, Pref)
        let bonusPoints = 0;
        
        let skillMatches = 0;
        if (userSkills.length > 0) {
            for (const s of userSkills) {
                if (jobSkills.some(js => js.includes(s)) || desc.includes(s) || reqs.includes(s)) {
                    skillMatches++;
                    matchedKw.push(s);
                }
            }
            bonusPoints += (skillMatches / userSkills.length) * (maxBonus * 0.5);
        } else {
            bonusPoints += (maxBonus * 0.25); 
        }

        if (userExp && jobExp) {
            if (jobExp.includes(userExp) || userExp.includes(jobExp)) bonusPoints += (maxBonus * 0.25);
        } else {
            bonusPoints += (maxBonus * 0.25);
        }

        if (prefCountry && jobLoc.includes(prefCountry)) bonusPoints += (maxBonus * 0.15);
        else if (jobLoc.includes('remote')) bonusPoints += (maxBonus * 0.15);
        
        if (prefType && prefType !== 'all' && jobType.includes(prefType)) bonusPoints += (maxBonus * 0.10);
        else bonusPoints += (maxBonus * 0.10);

        currentScore = Math.min(100, Math.round(baseScore + bonusPoints));

        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestKeywords = [...new Set(matchedKw)];
            bestFallbackStage = fallbackStage;
        }
    }

    if (bestScore >= 90) bestReason = `Excellent Match`;
    else if (bestScore >= 80) bestReason = `Strong Match`;
    else if (bestScore >= 70) bestReason = `Good Match`;
    else if (bestScore >= 50) bestReason = `Partial Match`;
    else bestReason = `Low Match`;

    let tier = 5;
    if (bestFallbackStage.includes('Step 1')) tier = 1;
    else if (bestFallbackStage.includes('Step 2')) tier = 2;
    else if (bestFallbackStage.includes('Step 3')) tier = 3;
    else if (bestFallbackStage.includes('Step 4')) tier = 4;
    else tier = 5;

    const coreWords = userPrefs.roles.map(r => r.replace(/engineer|developer|manager|analyst|specialist|consultant|architect|designer/ig, '').trim().toLowerCase()).filter(w => w.length > 2);
    for (const cw of coreWords) {
        if (jobTitle.includes(cw) && tier > 2) {
            tier = 2;
            break;
        }
    }

    return { score: bestScore, matchedKeywords: bestKeywords.slice(0, 5), matchReason: bestReason, fallbackStage: bestFallbackStage, tier: tier };
};

async function testScore() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:apply4works@cluster0.mongodb.net/apply4works?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Fetch newly inserted jobs
    const rawJobsWithDesc = await Job.find().sort({ created_at: -1 }).limit(10).lean();
    
    // Test a common user preference
    const userPrefs = {
        roles: ["Software Engineer", "Backend Developer"],
        skills: ["JavaScript", "Node", "MongoDB", "AWS", "Python"],
        workMode: "all",
        experienceLevel: "all"
    };

    console.log("=== SCORING NEW JOBS WITH DESCRIPTION ===");
    rawJobsWithDesc.forEach(j => {
        const md = calculateDetailedMatchScore(j, userPrefs, '');
        console.log(`[${md.score}%] ${j.title} | ${j.company} | desc length: ${j.description?.length || 0}`);
    });

    console.log("\n=== SCORING NEW JOBS WITHOUT DESCRIPTION ===");
    rawJobsWithDesc.forEach(j => {
        const jNoDesc = { ...j, description: undefined };
        const md = calculateDetailedMatchScore(jNoDesc, userPrefs, '');
        console.log(`[${md.score}%] ${j.title} | ${j.company} | desc length: 0`);
    });

    mongoose.disconnect();
}

testScore().catch(console.error);

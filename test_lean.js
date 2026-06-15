const mongoose = require('mongoose');
const Job = require('./models/Job');
require('dotenv').config({ path: './.env' });

async function checkLean() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const job = await Job.findOne().lean();
    console.log(typeof job._id);
    console.log(job._id instanceof mongoose.Types.ObjectId);
    console.log(typeof job._id.getTimestamp);
    mongoose.disconnect();
}
checkLean();

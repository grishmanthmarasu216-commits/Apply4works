const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

async function testObjectId() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:apply4works@cluster0.mongodb.net/apply4works?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
    
    const job = await Job.findOne().lean();
    if (job) {
        console.log("job._id type:", typeof job._id);
        console.log("Is ObjectId?", job._id instanceof mongoose.Types.ObjectId);
        console.log("Has getTimestamp?", typeof job._id.getTimestamp === 'function');
        if (typeof job._id.getTimestamp === 'function') {
            console.log("Timestamp:", job._id.getTimestamp());
        }
    }
    mongoose.disconnect();
}
testObjectId();

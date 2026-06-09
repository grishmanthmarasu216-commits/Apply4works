const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('[MongoDB] Connected');
    console.log(`[MongoDB] Cluster: ${conn.connection.host}, Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

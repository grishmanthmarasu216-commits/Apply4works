const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased from 5000 to prevent timeout on slow DNS
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      retryWrites: true,
      // Removed 'family: 4' to prevent ENOTFOUND if IPv4 resolution drops but IPv6 works
    });
    console.log('[MongoDB] Connected successfully');
    console.log(`[MongoDB] Cluster: ${conn.connection.host}, Database: ${conn.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

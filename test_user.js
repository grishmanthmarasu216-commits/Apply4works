const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne();
  console.log("user.id:", user.id);
  console.log("typeof user.id:", typeof user.id);
  console.log("user.id.toString():", user.id.toString());
  console.log("userId.toString().substring(18, 24):", user.id.toString().substring(18, 24));
  await mongoose.disconnect();
}
testUser();

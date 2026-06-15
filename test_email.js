require('dotenv').config();
const mongoose = require('mongoose');
const { queueEmail } = require('./services/emailQueue');
const { sendWelcomeEmail, sendPaymentSuccessEmail } = require('./services/emailService');
const User = require('./models/User');

async function testEmail() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find or create dummy user
  let user = await User.findOne({ email: 'test@apply4works.com' });
  if (!user) {
    user = await User.create({
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@apply4works.com',
      password: 'testpassword'
    });
  }

  console.log('Sending Welcome Email to Queue (tests HTML loading from disk)...');
  await sendWelcomeEmail(user);

  console.log('Sending Payment Success Email to Queue...');
  await sendPaymentSuccessEmail(user, {
    planName: 'PRO Plan',
    amount: 24.99,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    transactionId: 'txn_123456789'
  });

  // Give queue 3 seconds to process
  setTimeout(async () => {
    const updatedUser = await User.findById(user._id);
    console.log('User Email History Length:', updatedUser.emailHistory.length);
    if (updatedUser.emailHistory.length > 0) {
      console.log('Latest Email History Status:', updatedUser.emailHistory[updatedUser.emailHistory.length - 1].status);
    }
    
    // Simulate Razorpay Webhook Hash Verification
    const crypto = require('crypto');
    const secret = 'dummy_secret';
    const payload = JSON.stringify({ event: 'subscription.charged' });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    console.log('Simulated Webhook Signature Match:', signature === crypto.createHmac('sha256', secret).update(payload).digest('hex'));
    
    await mongoose.disconnect();
    process.exit(0);
  }, 3000);
}

testEmail().catch(err => console.error(err));

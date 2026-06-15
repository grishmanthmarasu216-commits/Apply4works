require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

async function testRazorpay() {
  try {
    const options = {
      amount: 999,
      currency: "USD",
      receipt: `rcpt_666e133827d04f2d0111a43a_1781530874954`
    };
    console.log("Creating order with 43 char receipt...");
    const order = await razorpay.orders.create(options);
    console.log("Success:", order);
  } catch (err) {
    console.error("Razorpay Error:", err.statusCode, err.error);
  }
}

testRazorpay();

require('dotenv').config();
const paymentController = require('./controllers/paymentController');

const mongoose = require('mongoose');

async function testController() {
  await mongoose.connect(process.env.MONGODB_URI);
  const req = {
    body: {
      plan: 'Basic',
      coupon: null
    },
    user: {
      id: '666e133827d04f2d0111a43a'
    }
  };

  const res = {
    status: function(code) {
      console.log('Status set to:', code);
      return this;
    },
    json: function(data) {
      console.log('Response:', data);
      return this;
    }
  };

  await paymentController.createOrder(req, res);
  await mongoose.disconnect();
}

testController().catch(console.error);

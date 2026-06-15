const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const Preference = require('./models/Preference');

async function testPrefs() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const user = await User.findOne({ email: 'banrapolubharathreddy@gmail.com' });
    if (user && user.preferences) {
        const p = await Preference.findById(user.preferences);
        console.log("User Preferences:", p);
    } else {
        console.log("No preferences");
    }
    mongoose.disconnect();
}
testPrefs();

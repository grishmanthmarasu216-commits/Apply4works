const mongoose = require('mongoose');

const original = { _id: new mongoose.Types.ObjectId() };
const clone = { ...original };

console.log(typeof clone._id.getTimestamp);

const mongoose = require('mongoose');

const model = mongoose.model("Ertu-Staffs", mongoose.Schema({
    id: String,
    currentPin: { type: Number, default: 0 },
    requiredPin: { type: Number, default: 0 },
}))

module.exports = model;
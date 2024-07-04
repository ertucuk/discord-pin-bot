const mongoose = require('mongoose');

const model = mongoose.model("Ertu-Pin", mongoose.Schema({
    id: String,
    pin: { type: Object, default: {} },
    lastPinDate: { type: Number, default: 0 },
    lastDayTime: { type: Number, default: () => new Date().setHours(0, 0, 0, 0) },
    days: { type: Number, default: 1 },
}))

module.exports = model;
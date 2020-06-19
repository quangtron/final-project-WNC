const mongoose = require('mongoose');

const receivers = new mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    card_number: Number,
    reminiscent_name: String
})

module.exports = Receivers = mongoose.model('receivers', receivers);
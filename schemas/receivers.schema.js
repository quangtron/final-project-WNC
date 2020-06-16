const mongoose = require('mongoose');

const receivers = mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    card_number: String,
    reminiscent_name: String
})

module.exports = Receivers = mongoose.model('receivers', receivers);
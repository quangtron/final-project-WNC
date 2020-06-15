const mongoose = require('mongoose');

const cards = {
    id_customer: mongoose.Types.ObjectId,
    id_type_card: mongoose.Types.ObjectId,
    card_number: String,
    balance: Number
}

module.exports = Cards = mongoose.model('cards', cards);
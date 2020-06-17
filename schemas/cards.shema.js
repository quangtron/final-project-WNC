const mongoose = require('mongoose');

const cards = {
    id_customer: mongoose.Types.ObjectId,
    id_type_card: Number,
    card_number: Number,
    balance: Number
}

module.exports = Cards = mongoose.model('cards', cards);
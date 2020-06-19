const mongoose = require('mongoose');

const cards = new mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    id_type_card: Number,
    card_number: Number,
    balance: Number
})

module.exports = Cards = mongoose.model('cards', cards);
const mongoose = require('mongoose');

const type_cards = new mongoose.Schema({
    name_type: String
})

module.exports = Type_Cards = mongoose.model('type_cards', type_cards);
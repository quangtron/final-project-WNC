const mongoose = require('mongoose');

const transactions = new mongoose.Schema({
    card_number_sender: Number,
    id_type_transaction: Number,
    id_partner_bank: Number,
    card_number_receiver: Number,
    message: String,
    money: Number,
    type_paid: Number,
    date_created: Date
})

module.exports = Transactions = mongoose.model('transactions', transactions);
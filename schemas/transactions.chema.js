const mongoose = require('mongoose');

const transactions = new mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    id_type_transaction: Number,
    id_partner_bank: Number,
    card_number: Number,
    message: String,
    money: Number,
    type_paid: Number,
    date_created: Date
})

module.exports = Transactions = mongoose.model('transactions', transactions);
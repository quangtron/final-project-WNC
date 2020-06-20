const mongoose = require('mongoose');

const transactions = new mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    card_number: Number,
    reminiscent_name: String
})

module.exports = Transactions = mongoose.model('transactions', transactions);
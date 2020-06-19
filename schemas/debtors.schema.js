const mongoose = require('mongoose');

const debtors = new mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    // id_type_debt: Number, // 1: my created // 2: others sent 
    is_paid: Number, // 1: unpaid // 2: paid
    card_number: Number, 
    money: Number,
    message: String
})

module.exports = Debtors = mongoose.model('debtors', debtors);
const mongoose = require('mongoose');

const notifications_cancel_debt = new mongoose.Schema({
    id_customer: mongoose.Types.ObjectId,
    is_notified: Number, // 1: chua thong bao // 2: da thong bao
    message: String
})

module.exports = Notifications_Cancel_Debt = mongoose.model('notifications_cancel_debt', notifications_cancel_debt);
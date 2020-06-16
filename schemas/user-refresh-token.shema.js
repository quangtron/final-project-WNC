const mongoose = require('mongoose');

const user_refresh_token = {
    id_customer: mongoose.Types.ObjectId,
    refresh_token: String,
    rdt: Date
}

module.exports = User_refresh_token = mongoose.model('user_refresh_token', user_refresh_token);
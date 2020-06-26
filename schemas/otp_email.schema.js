const mongoose = require('mongoose');

const otp_email = new mongoose.Schema({
    email: String,
    otp_email_token: String,
    otp_email_exprires: Number
})

module.exports = Otp_email = mongoose.model('otp_email', otp_email);
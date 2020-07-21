const mongoose = require('mongoose');

const customers = new mongoose.Schema({
    full_name: String,
    address: String,
    email: String,
    phone_number: String,
    username: String,
    password: String,
    day_of_birth: String,
    permission: Number,
    is_delete: Number
})

module.exports = Customers = mongoose.model('customers', customers);
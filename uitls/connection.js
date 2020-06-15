const mongoose = require('mongoose');

const uri = "mongodb+srv://user1:123456abc@cluster0-nqsrs.mongodb.net/internet-banking?retryWrites=true&w=majority";

const connectDB = async _ => {
    await mongoose.connect(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    })
    console.log('db is connected!');
}

module.exports = connectDB;
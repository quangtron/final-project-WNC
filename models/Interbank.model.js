const db = require('../uitls/db');

module.exports = {
    singleByCardNumber: cardNumber => db.load(`select * from users where cardNumber = '${cardNumber}'`),
}
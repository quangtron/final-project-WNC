const db = require('../uitls/db');

module.exports = {
    singleByCardNumber: cardNumber => db.load(`select * from users where cardNumber = '${cardNumber}'`),
    update: (cardNumber, money) => db.load(`update users set Money=${money} where cardNumber = '${cardNumber}'`)
}
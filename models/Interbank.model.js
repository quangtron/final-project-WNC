const db = require('../uitls/db');

module.exports = {
    singleByUsername: username => db.load(`select * from users where username = '${username}'`),
}
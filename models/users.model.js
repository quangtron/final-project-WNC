const bcrypt = require('bcryptjs');
const moment = require('moment');

const db = require('../uitls/db');

module.exports = {
    all : _ => db.load('select * from users'),
    addUser: entity => {
        const hash = bcrypt.hashSync(entity.password);
        entity.password = hash;
        return db.add(entity, 'users');
    },
    singleByUsername: username => db.load(`select * from users where username='${username}'`),
    updateRefreshToken: async(userId, token) => {
        await db.del({ ID: userId }, 'userRefreshTokenExt');

        const entity = {
            ID: userId,
            refreshToken: token,
            rdt: moment().format('YYYY-MM-DD HH:mm:ss')
        }

        return db.add(entity, 'userRefreshTokenExt');
    },
    verifyRefreshToken: async(userId, token) => {
        const sql = `select * from userRefreshTokenExt where ID = ${userId} and refreshToken = '${token}'`;
        const rows = await db.load(sql);

        if(rows.length > 0){
            return true;
        }

        return false;
    }
}
const bcrypt = require('bcryptjs');

const userModel = require('./users.model');

module.exports = {
    login: async entity => {
        const rows = await userModel.singleByUsername(entity.username);

        if(rows === 0){
            return null;
        }

        const hashPwd = rows[0].password;

        if(bcrypt.compareSync(entity.password, hashPwd)){
            return rows[0];
        }

        return null;
    }
}
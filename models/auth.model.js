const bcrypt = require('bcryptjs');

const custumer_model = require('./customers.model');

module.exports = {
    login: async entity => {
        const result = await custumer_model.find_by_username(entity.username);

        if(!result){
            return null;
        }

        const hashPwd = result.password;

        if(bcrypt.compareSync(entity.password, hashPwd)){
            return result;
        }

        return null;
    }
}
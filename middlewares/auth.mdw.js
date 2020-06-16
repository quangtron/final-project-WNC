const jwt = require('jsonwebtoken');
const create_error = require('http-errors');

const config = require('../config/default.json');

module.exports = function(req, res, next) {
    const token = req.headers['x-access-token'];
    
    if(token){
        jwt.verify(token, config.auth.secret, (err, payload) => {
            if(err){
                throw create_error(401, err);
            }

            req.token_payload = payload;
            next();
        })
    } else {
        throw create_error(401, 'No AccessToken Found!');
    }
}
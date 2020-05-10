const createError = require('http-errors');
const config = require('../config/default.json');

module.exports = function(req, res, next) {
    if(req.headers['partner-code'] !== config.user.partnerCode){
        throw createError(400, 'Invalid partner-code!');
    }
    next();
}
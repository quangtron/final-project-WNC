const createError = require('http-errors');
const moment = require('moment');

const config = require('../config/default.json');

module.exports = function(req, res, next) {
    if(req.headers['partner-code'] !== config.interbank.partnerCode){
        throw createError(400, 'Invalid partner code!');
    }

    const ts = moment().unix();
    const timeExp = moment.unix(req.headers['ts']).add(1, 'm').unix();

    if(ts > timeExp){
        console.log(moment().unix());
        throw createError(400, 'Request expire!');
    }

    next();
}
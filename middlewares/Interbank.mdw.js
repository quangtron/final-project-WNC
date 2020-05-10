const createError = require('http-errors');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const config = require('../config/default.json');

module.exports = function(req, res, next) {
    if(req.headers['partner-code'] !== config.interbank.partnerCode){
        throw createError(400, 'Invalid partner code!');
    }

    const ts = moment().unix();
    const headerTs = req.headers['ts'];
    const timeExp = moment.unix(headerTs).add(10, 'm').unix();

    if(ts > timeExp){
        console.log(moment().unix());
        throw createError(400, 'Request expire!');
    }

    const signature = headerTs + JSON.stringify(req.body);
    console.log(bcrypt.hashSync(signature));
    if(!bcrypt.compareSync(signature, req.headers['sign'])){
        throw createError(400, 'Something wrong!');
    }

    next();
}
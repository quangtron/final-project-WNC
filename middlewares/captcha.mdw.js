const request = require('request');

const config = require('../config/default.json');

module.exports = function(captcha) {
    if(!captcha){
        return false;
    }

    const verify_url = `https://www.google.com/recaptcha/api/siteverify?secret=${config.captcha.secret_key}&response=${captcha}`;

    request(verify_url,(err,response,body)=>{
        if(err){console.log(err); }

        body = JSON.parse(body);

        if(!body.success && body.success === undefined){
            return false;
        }
        else if(body.score < 0.5){
            return false;
        }
        
        return true;
    })
}
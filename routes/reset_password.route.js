const express = require('express');
const bcrypt = require('bcryptjs');
const rand_token = require('rand-token');

const customers_model = require('../models/customers.model');
const mail = require('../middlewares/verify_email.mdw');
const config = require('../config/default.json');
const otp_email_model = require('../models/otp_email.model');

const router = express.Router();

router.post('/send-email', async (req, res) => {
    const customer_reset = await customers_model.find_by_email(req.body.email);
    
    if(!customer_reset){
        return res.status(204).json({is_error: true});
    }

    const token = rand_token.generate(config.auth.refresh_token_sz);

    await otp_email_model.update_otp_token(token, req.body.email);

    let mailOptions = {
        from: config.email_otp.user,
        to: req.body.email,
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://localhost:3000/reset-password/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
    };

    const ret = await mail.send_email(mailOptions);
    console.log(ret);
    res.json('ok');
})

router.post('/verify/:token', async (req, res) => {
    if(req.body.new_password !== req.body.confirm_password){
        return res.status(204).json({is_error: true});
    }

    const hash_password = bcrypt.hashSync(req.body.new_password);

    const reset_pw_detail = await otp_email_model.find_by_token(req.params.token);

    if(!reset_pw_detail){
        return res.status(204).json({is_error: true});
    }

    if(Date.now() > reset_pw_detail.otp_email_exprires){
        return res.status(204).json({is_error: true});
    }


    const customer_detail = await customers_model.find_by_email(reset_pw_detail.email);

    if(!customer_detail){
        return res.status(204).json({is_error: true});
    }

    customer_detail.password = hash_password;

    await customers_model.edit({email: reset_pw_detail.email}, customer_detail);

    res.status(200).json(customer_detail);
})

module.exports = router;
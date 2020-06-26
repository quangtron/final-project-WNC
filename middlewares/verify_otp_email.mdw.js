const express = require('express');

const mail = require('../middlewares/verify_email.mdw');
const otp_email_model = require('../models/otp_email.model');
const { token } = require('morgan');

module.exports = {
    send_otp: async (email, full_name) => {
        const token = Math.floor(Math.random() * 99999 + 10000);
    
        await otp_email_model.update_otp_token(token, email);
    
        let mailOptions = {
            from: 'webnangcao17@gmail.com',
            to: 'haquangtrong.ton@gmail.com',
            subject: 'Password Reset',
            text: `Dear ${full_name},\n
                You have selected ${email} to verify your transaction.\n
                This is code for you:\n
                <h2>${token}</h2>\n
                This code will expire five minutes after this email was send.\n\n
                <b>Why you received this email.</b>\n
                Internet banking requires verification an email adress for your transaction.\n
                If you did not make this request, you can ignore this email.\n
                Thank you!`
        };
    
        await mail.send_email(mailOptions);
    },
    verify_otp: async (token) => {
        const otp_detail = await otp_email_model.find_by_token(token);

        if(!otp_detail){
            return false;
        }
    
        if(Date.now() > otp_detail.otp_email_exprires){
            return false;
        }

        return true;
    }
}
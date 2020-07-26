const nodemailer = require('nodemailer');

const config = require('../config/default.json');

let transport = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
        user: config.email_otp.user,
        pass: config.email_otp.pass
    }
})

module.exports = {
    send_email(mailOptions){
        return new Promise((resolve, reject) => {
            transport.sendMail(mailOptions, (err, info) => {
                if (err) reject(err);

                resolve(info);
            })
        })
    }
}
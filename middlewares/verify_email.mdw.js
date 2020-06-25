const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'webnangcao17@gmail.com',
        pass: 'wnc123456'
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
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
        return res.status(203).json({is_error: true, msg: "Không tìm thấy email!"});
    }

    const token = rand_token.generate(config.auth.refresh_token_sz);

    await otp_email_model.update_otp_token(token, req.body.email);

    let mailOptions = {
        from: config.email_otp.user,
        to: req.body.email,
        subject: 'Quên mật khẩu',
        text: 'Bạn nhận được email này bởi vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n' +
            'Hãy nhấn vào link bên dưới hoặc, sao chép và dán link bên dưới vào trình duyệt để hoàn tất quy trình:\n\n' +
            'http://localhost:3000/reset-password?token=' + token + '\n\n' +
            'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email và mật khẩu của bạn sẽ không thay đổi.\n'
    };

    const ret = await mail.send_email(mailOptions);

    res.status(200).json(ret);
})

router.post('/verify/:token', async (req, res) => {
    if(req.body.new_password !== req.body.confirm_password){
        return res.status(203).json({is_error: true, msg: "Mật khẩu nhập lại không đúng!"});
    }

    const hash_password = bcrypt.hashSync(req.body.new_password);

    const reset_pw_detail = await otp_email_model.find_by_token(req.params.token);

    if(!reset_pw_detail){
        return res.status(203).json({is_error: true, msg: "Token không đúng!"});
    }

    if(Date.now() > reset_pw_detail.otp_email_exprires){
        return res.status(203).json({is_error: true, msg: "OTP hết hạn!"});
    }


    const customer_detail = await customers_model.find_by_email(reset_pw_detail.email);

    if(!customer_detail){
        return res.status(203).json({is_error: true, msg: "Không tìm thấy tài khoản!"});
    }

    customer_detail.password = hash_password;

    await customers_model.edit({email: reset_pw_detail.email}, customer_detail);

    res.status(200).json(customer_detail);
})

module.exports = router;
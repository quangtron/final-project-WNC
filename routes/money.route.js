const express = require('express');
const createError = require('http-errors');
const nodeRSA = require('node-rsa');
const crypto = require('crypto');
const config = require('../config/default.json');
const moneyModel = require('../models/money.model');

const router = express.Router();

router.post('/', async(req, res) => {
    const rows = await moneyModel.singleByCardNumber(req.body.cardNumber);
    
    if(rows.length === 0){
        throw createError(400, 'Invalid card number!');
    }

    const cardNumber = req.body.cardNumber;
    const currentMoney = rows[0].Money;

    const money = currentMoney + req.body.amoundOfMoney;
    
    const ret = await moneyModel.update(cardNumber, money);

    //
    privateKeyA = config.RSA.privateKeyA; // dung de ky

    // tạo chữ kí
    const sign = crypto.createSign('SHA256');
    
    sign.write('success!'); // đưa data cần kí vào đây
    const signature = sign.sign(privateKeyA, 'hex'); // tạo chữ kí bằng private key

    res.json({
        status: "success!",
        signature
    });
})

module.exports = router;
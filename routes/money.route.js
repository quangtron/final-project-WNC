const express = require('express');
const create_error = require('http-errors');
const nodeRSA = require('node-rsa');
const crypto = require('crypto');
const config = require('../config/default.json');
const moneyModel = require('../models/money.model');
const cards_model = require('../models/cards.model');
const transactions_model = require('../models/transactions.model');
const moment = require('moment');

const router = express.Router();

router.post('/', async(req, res) => {
    // const rows = await moneyModel.singleByCardNumber(req.body.cardNumber);
    if(await cards_model.is_exist(req.body.card_number) === false){
        res.status(400).json({is_error: true, msg: "Số tài khoản không tồn tại!"});
        throw create_error(400, 'Number card is not exist!');
    }
    
    const card_receiver = await cards_model.find_detail_by_card_number(req.body.card_number);

    card_receiver.balance += req.body.money;
    await cards_model.edit({_id: card_receiver._id}, card_receiver);

    const entity_new_transaction = {
        // id_customer: id_customer,
        card_number_sender: req.headers['card_number_sender'],
        id_type_transaction: 1,
        id_partner_bank: req.headers['partner_code'],
        card_number_receiver: card_receiver.card_number,
        message: req.body.message,
        money: req.body.money,
        type_paid: 1,
        date_created: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    await transactions_model.add(entity_new_transaction);

    //
    privateKeyA = config.RSA.privateKeyA; // dung de ky

    // tạo chữ kí
    const sign = crypto.createSign('SHA256');
    
    sign.write('success!'); // đưa data cần kí vào đây
    const signature = sign.sign(privateKeyA, 'hex'); // tạo chữ kí bằng private key

    res.status(200).json({
        status: "success!",
        signature
    });
})

module.exports = router;
const express = require('express');
const createError = require('http-errors');

const InterbankModel = require('../models/Interbank.model');

const router = express.Router();

router.get('/', async(req, res) => {
    const rows = await InterbankModel.singleByCardNumber(req.body.cardNumber);

    if(rows.length === 0){
        throw createError(400, 'Invalid card number!');
    }

    res.json({
        cardNumber: rows[0].cardNumber,
        name: rows[0].Name,
        money: rows[0].Money
    })
})

module.exports = router;
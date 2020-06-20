const express = require('express');
const create_error = require('http-errors');

const card_model = require('../models/cards.model');

const router = express.Router();

router.post('/customer/sending/add', async (req, res) => {
    const { card_number, amount, content } = req.body;
    const id_customer = req.token_payload.id;

    if(await !card_model.is_exist(card_number)){
        throw create_error(400, 'Number card is not exist!');
    }

    const card_detail_sender = await card_model.find_payment_card_by_id_customer(id_customer);

    if(card_detail_sender.balance < amount){
        throw create_error(400, 'Balance is not enough!');
    }

    card_detail_sender.balance -= amount;

    const card_detail_receiver = await card_model.find_detail_by_card_number(card_number);
    card_detail_receiver.balance += amount;

    await card_model.edit({_id: card_detail_sender._id}, card_detail_sender);
    await card_model.edit({_id: card_detail_receiver._id}, card_detail_receiver);

    res.status(200).json(req.body);
})

module.exports = router;